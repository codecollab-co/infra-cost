import { EventEmitter } from 'events';
import { createHmac, timingSafeEqual } from 'crypto';
import axios, { AxiosError } from 'axios';

export interface WebhookConfiguration {
  secret: string;
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  userAgent: string;
  enableSignatureValidation: boolean;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
  tenantId?: string;
  userId?: string;
  source?: string;
  version?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookUrl: string;
  event: WebhookEvent;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  maxRetries: number;
  createdAt: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  nextRetryAt?: Date;
  lastResponse?: {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    duration: number;
  };
  error?: string;
}

export class WebhookManager extends EventEmitter {
  private config: WebhookConfiguration;
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private retryQueue: WebhookDelivery[] = [];
  private retryTimer?: NodeJS.Timeout;

  constructor(config: Partial<WebhookConfiguration> = {}) {
    super();

    this.config = {
      secret: '',
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000,
      userAgent: 'InfraCost-Webhook/1.0',
      enableSignatureValidation: true,
      ...config
    };

    this.setupRetryProcessor();
  }

  public async deliverWebhook(
    url: string,
    event: WebhookEvent,
    secret?: string
  ): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      id: this.generateDeliveryId(),
      webhookUrl: url,
      event,
      status: 'pending',
      attempts: 0,
      maxRetries: this.config.maxRetries,
      createdAt: new Date()
    };

    this.deliveries.set(delivery.id, delivery);

    try {
      await this.attemptDelivery(delivery, secret);
    } catch (error) {
      console.error(`Failed to deliver webhook ${delivery.id}:`, error);
    }

    return delivery;
  }

  private async attemptDelivery(delivery: WebhookDelivery, secret?: string): Promise<void> {
    delivery.attempts++;
    delivery.status = delivery.attempts > 1 ? 'retrying' : 'pending';

    const payload = this.createPayload(delivery.event);
    const headers = this.createHeaders(payload, secret || this.config.secret);

    const startTime = Date.now();

    try {
      const response = await axios.post(delivery.webhookUrl, payload, {
        headers,
        timeout: this.config.timeout,
        validateStatus: (status) => status < 500 // Retry on 5xx errors
      });

      const duration = Date.now() - startTime;

      delivery.lastResponse = {
        statusCode: response.status,
        headers: response.headers as Record<string, string>,
        body: JSON.stringify(response.data),
        duration
      };

      if (response.status >= 200 && response.status < 300) {
        // Success
        delivery.status = 'delivered';
        delivery.deliveredAt = new Date();

        this.emit('delivery.success', delivery);
        console.log(`✅ Webhook delivered: ${delivery.id} to ${delivery.webhookUrl} (${duration}ms)`);
      } else {
        // HTTP error but not server error
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = this.getErrorMessage(error);

      delivery.error = errorMessage;
      delivery.lastResponse = {
        statusCode: (error as AxiosError).response?.status || 0,
        headers: (error as AxiosError).response?.headers as Record<string, string> || {},
        body: JSON.stringify((error as AxiosError).response?.data) || '',
        duration
      };

      if (delivery.attempts < delivery.maxRetries) {
        // Schedule retry
        delivery.nextRetryAt = new Date(Date.now() + this.config.retryDelay * Math.pow(2, delivery.attempts - 1));
        this.scheduleRetry(delivery);

        console.log(`⏰ Webhook delivery failed, retrying ${delivery.id}: ${errorMessage} (attempt ${delivery.attempts}/${delivery.maxRetries})`);
      } else {
        // Max retries reached
        delivery.status = 'failed';
        delivery.failedAt = new Date();

        this.emit('delivery.failed', delivery);
        console.error(`❌ Webhook delivery failed permanently: ${delivery.id} - ${errorMessage}`);
      }
    }

    this.deliveries.set(delivery.id, delivery);
  }

  private createPayload(event: WebhookEvent): string {
    return JSON.stringify({
      id: event.id,
      type: event.type,
      data: event.data,
      timestamp: event.timestamp.toISOString(),
      tenant_id: event.tenantId,
      user_id: event.userId,
      source: event.source || 'infra-cost',
      version: event.version || '1.0'
    });
  }

  private createHeaders(payload: string, secret: string): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': this.config.userAgent,
      'X-Webhook-Timestamp': Date.now().toString(),
      'X-Webhook-ID': this.generateDeliveryId()
    };

    if (this.config.enableSignatureValidation && secret) {
      const signature = this.generateSignature(payload, secret);
      headers['X-Webhook-Signature'] = signature;
      headers['X-Webhook-Signature-256'] = `sha256=${signature}`;
    }

    return headers;
  }

  private generateSignature(payload: string, secret: string): string {
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  public validateSignature(payload: string, signature: string, secret: string): boolean {
    if (!this.config.enableSignatureValidation) {
      return true;
    }

    const expectedSignature = this.generateSignature(payload, secret);
    const providedSignature = signature.replace(/^sha256=/, '');

    return timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );
  }

  private scheduleRetry(delivery: WebhookDelivery): void {
    this.retryQueue.push(delivery);
    if (!this.retryTimer) {
      this.setupRetryProcessor();
    }
  }

  private setupRetryProcessor(): void {
    this.retryTimer = setInterval(() => {
      const now = new Date();
      const readyForRetry = this.retryQueue.filter(delivery =>
        delivery.nextRetryAt && delivery.nextRetryAt <= now
      );

      readyForRetry.forEach(delivery => {
        this.retryQueue = this.retryQueue.filter(d => d.id !== delivery.id);
        this.attemptDelivery(delivery).catch(error => {
          console.error(`Retry failed for delivery ${delivery.id}:`, error);
        });
      });

      // Clean up completed deliveries
      if (this.retryQueue.length === 0 && this.retryTimer) {
        clearInterval(this.retryTimer);
        this.retryTimer = undefined;
      }
    }, 1000);
  }

  private getErrorMessage(error: any): string {
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return 'Request timeout';
    } else if (error.code === 'ENOTFOUND') {
      return 'Host not found';
    } else if (error.response) {
      return `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else {
      return error.message || 'Unknown error';
    }
  }

  private generateDeliveryId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Event type definitions for type safety
  public async emitEvent(
    type: 'cost_analysis.started' | 'cost_analysis.completed' | 'cost_analysis.failed' |
          'tenant.created' | 'tenant.suspended' | 'tenant.activated' |
          'user.created' | 'user.role_changed' | 'user.suspended' |
          'api_key.created' | 'api_key.revoked' |
          'forecast.generated' | 'optimization.completed' |
          'alert.triggered' | 'threshold.exceeded' |
          'compliance.violation' | 'audit.event',
    data: any,
    options?: {
      tenantId?: string;
      userId?: string;
      source?: string;
      version?: string;
    }
  ): Promise<WebhookEvent> {
    const event: WebhookEvent = {
      id: this.generateDeliveryId(),
      type,
      data,
      timestamp: new Date(),
      tenantId: options?.tenantId,
      userId: options?.userId,
      source: options?.source,
      version: options?.version
    };

    this.emit('event.created', event);
    return event;
  }

  // Management methods
  public getDelivery(deliveryId: string): WebhookDelivery | undefined {
    return this.deliveries.get(deliveryId);
  }

  public getDeliveries(filter?: {
    status?: WebhookDelivery['status'];
    tenantId?: string;
    since?: Date;
    limit?: number;
  }): WebhookDelivery[] {
    let deliveries = Array.from(this.deliveries.values());

    if (filter) {
      if (filter.status) {
        deliveries = deliveries.filter(d => d.status === filter.status);
      }
      if (filter.tenantId) {
        deliveries = deliveries.filter(d => d.event.tenantId === filter.tenantId);
      }
      if (filter.since) {
        deliveries = deliveries.filter(d => d.createdAt >= filter.since!);
      }
      if (filter.limit) {
        deliveries = deliveries.slice(0, filter.limit);
      }
    }

    return deliveries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public async retryDelivery(deliveryId: string): Promise<WebhookDelivery | null> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) {
      return null;
    }

    if (delivery.status === 'delivered') {
      throw new Error('Cannot retry already delivered webhook');
    }

    // Reset delivery state
    delivery.status = 'pending';
    delivery.attempts = 0;
    delivery.error = undefined;
    delivery.nextRetryAt = undefined;

    await this.attemptDelivery(delivery);
    return delivery;
  }

  public getStats(): {
    totalDeliveries: number;
    successful: number;
    failed: number;
    pending: number;
    retrying: number;
    averageDeliveryTime: number;
    failureRate: number;
  } {
    const deliveries = Array.from(this.deliveries.values());
    const successful = deliveries.filter(d => d.status === 'delivered');
    const failed = deliveries.filter(d => d.status === 'failed');
    const pending = deliveries.filter(d => d.status === 'pending');
    const retrying = deliveries.filter(d => d.status === 'retrying');

    const totalDeliveryTime = successful.reduce((sum, d) =>
      sum + (d.lastResponse?.duration || 0), 0
    );
    const averageDeliveryTime = successful.length > 0 ? totalDeliveryTime / successful.length : 0;

    const failureRate = deliveries.length > 0 ? failed.length / deliveries.length : 0;

    return {
      totalDeliveries: deliveries.length,
      successful: successful.length,
      failed: failed.length,
      pending: pending.length,
      retrying: retrying.length,
      averageDeliveryTime,
      failureRate
    };
  }

  public purgeOldDeliveries(olderThan: Date): number {
    const initialSize = this.deliveries.size;

    for (const [id, delivery] of this.deliveries.entries()) {
      if (delivery.createdAt < olderThan &&
          (delivery.status === 'delivered' || delivery.status === 'failed')) {
        this.deliveries.delete(id);
      }
    }

    const purged = initialSize - this.deliveries.size;
    if (purged > 0) {
      console.log(`🧹 Purged ${purged} old webhook deliveries`);
    }

    return purged;
  }

  public async shutdown(): Promise<void> {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = undefined;
    }

    // Wait for pending retries to complete
    const pendingDeliveries = this.retryQueue.length;
    if (pendingDeliveries > 0) {
      console.log(`⏳ Waiting for ${pendingDeliveries} pending webhook deliveries...`);

      // Give it some time to complete pending deliveries
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    this.retryQueue = [];
    this.emit('shutdown');
    console.log('🛑 Webhook manager shut down');
  }
}