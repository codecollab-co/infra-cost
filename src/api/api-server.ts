import { EventEmitter } from 'events';
import express, { Request, Response, NextFunction } from 'express';
import { createHash, randomBytes } from 'crypto';
import { WebhookManager, WebhookEvent, WebhookDelivery } from './webhook-manager';
import { MultiTenantManager, User, Tenant } from '../enterprise/multi-tenant';
import { AdvancedCostAnalytics } from '../analytics/business-intelligence';

// Extend Express Request type with custom properties
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: { id: string; tenantId: string };
      apiKey?: APIKey;
    }
  }
}

export interface APIConfiguration {
  port: number;
  host: string;
  enableCors: boolean;
  enableRateLimit: boolean;
  maxRequestsPerMinute: number;
  enableAuth: boolean;
  enableWebhooks: boolean;
  webhookSecret: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface APIKey {
  id: string;
  key: string;
  hashedKey: string;
  name: string;
  userId: string;
  tenantId: string;
  permissions: APIPermission[];
  status: 'active' | 'suspended' | 'revoked';
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  usage: {
    requestCount: number;
    lastReset: Date;
    rateLimitReached: boolean;
  };
}

export interface APIPermission {
  resource: string; // 'costs', 'inventory', 'analytics', 'tenants', 'users', etc.
  actions: string[]; // 'read', 'write', 'delete', 'admin'
  scope?: string; // Optional scope restriction
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    version: string;
    rateLimit?: {
      remaining: number;
      reset: Date;
    };
  };
}

export interface CostAnalysisRequest {
  provider?: string;
  region?: string;
  service?: string;
  startDate?: string;
  endDate?: string;
  includeForecasts?: boolean;
  includeRecommendations?: boolean;
  format?: 'summary' | 'detailed' | 'executive';
}

export interface WebhookSubscription {
  id: string;
  tenantId: string;
  url: string;
  events: string[];
  secret?: string;
  active: boolean;
  createdAt: Date;
  lastDelivery?: Date;
  failureCount: number;
  maxRetries: number;
}

export class APIServer extends EventEmitter {
  private app: express.Application;
  private server: ReturnType<express.Application['listen']> | null;
  private config: APIConfiguration;
  private webhookManager: WebhookManager;
  private multiTenantManager?: MultiTenantManager;
  private costAnalytics?: AdvancedCostAnalytics;
  private apiKeys: Map<string, APIKey> = new Map();
  private rateLimitStore: Map<string, { count: number; reset: Date }> = new Map();
  private webhookSubscriptions: Map<string, WebhookSubscription> = new Map();

  constructor(config: Partial<APIConfiguration> = {}) {
    super();

    this.config = {
      port: 3000,
      host: '0.0.0.0',
      enableCors: true,
      enableRateLimit: true,
      maxRequestsPerMinute: 100,
      enableAuth: true,
      enableWebhooks: true,
      webhookSecret: process.env.WEBHOOK_SECRET || this.generateSecret(),
      logLevel: 'info',
      ...config
    };

    this.app = express();
    this.webhookManager = new WebhookManager({
      secret: this.config.webhookSecret,
      maxRetries: 3,
      retryDelay: 1000
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupEventListeners();
  }

  private generateSecret(): string {
    return randomBytes(32).toString('hex');
  }

  private setupMiddleware(): void {
    // Basic middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // CORS
    if (this.config.enableCors) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
        } else {
          next();
        }
      });
    }

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const requestId = randomBytes(8).toString('hex');
      req.requestId = requestId;

      if (this.config.logLevel === 'debug') {
        console.log(`[${requestId}] ${req.method} ${req.path} - ${req.ip}`);
      }

      next();
    });

    // Authentication middleware
    if (this.config.enableAuth) {
      this.app.use('/api', this.authMiddleware.bind(this));
    }

    // Rate limiting
    if (this.config.enableRateLimit) {
      this.app.use('/api', this.rateLimitMiddleware.bind(this));
    }
  }

  private async authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const apiKey = req.headers['x-api-key'] as string || req.headers.authorization?.replace('Bearer ', '');

    if (!apiKey) {
      res.status(401).json(this.createResponse(false, null, {
        code: 'MISSING_API_KEY',
        message: 'API key is required'
      }));
      return;
    }

    // Hash the provided key to compare with stored hash
    const hashedKey = createHash('sha256').update(apiKey).digest('hex');
    const keyRecord = Array.from(this.apiKeys.values()).find(k => k.hashedKey === hashedKey);

    if (!keyRecord) {
      res.status(401).json(this.createResponse(false, null, {
        code: 'INVALID_API_KEY',
        message: 'Invalid API key'
      }));
      return;
    }

    if (keyRecord.status !== 'active') {
      res.status(401).json(this.createResponse(false, null, {
        code: 'SUSPENDED_API_KEY',
        message: 'API key is suspended or revoked'
      }));
      return;
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      res.status(401).json(this.createResponse(false, null, {
        code: 'EXPIRED_API_KEY',
        message: 'API key has expired'
      }));
      return;
    }

    // Update last used time
    keyRecord.lastUsedAt = new Date();
    keyRecord.usage.requestCount++;

    // Attach user and tenant info to request
    req.user = { id: keyRecord.userId, tenantId: keyRecord.tenantId };
    req.apiKey = keyRecord;

    next();
  }

  private rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const apiKey = req.apiKey;
    if (!apiKey) {
      next();
      return;
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - 60000); // 1 minute window

    let rateLimitData = this.rateLimitStore.get(apiKey.id);

    if (!rateLimitData || rateLimitData.reset < now) {
      rateLimitData = { count: 0, reset: new Date(now.getTime() + 60000) };
    }

    rateLimitData.count++;

    if (rateLimitData.count > this.config.maxRequestsPerMinute) {
      apiKey.usage.rateLimitReached = true;
      res.status(429).json(this.createResponse(false, null, {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests'
      }));
      return;
    }

    this.rateLimitStore.set(apiKey.id, rateLimitData);

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', this.config.maxRequestsPerMinute);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, this.config.maxRequestsPerMinute - rateLimitData.count));
    res.setHeader('X-RateLimit-Reset', rateLimitData.reset.toISOString());

    next();
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API Info
    this.app.get('/api/info', (req: Request, res: Response) => {
      res.json(this.createResponse(true, {
        version: '1.0.0',
        features: {
          costAnalysis: true,
          forecasting: true,
          inventory: true,
          analytics: true,
          multiTenant: !!this.multiTenantManager,
          webhooks: this.config.enableWebhooks
        },
        rateLimit: {
          enabled: this.config.enableRateLimit,
          maxRequestsPerMinute: this.config.maxRequestsPerMinute
        }
      }));
    });

    // Cost Analysis API
    this.setupCostAnalysisRoutes();

    // Tenant Management API
    this.setupTenantRoutes();

    // User Management API
    this.setupUserRoutes();

    // API Key Management
    this.setupAPIKeyRoutes();

    // Webhook Management
    this.setupWebhookRoutes();

    // Analytics API
    this.setupAnalyticsRoutes();
  }

  private setupCostAnalysisRoutes(): void {
    // Get cost analysis
    this.app.get('/api/costs', async (req: Request, res: Response) => {
      try {
        const params = req.query as Record<string, string>;
        const user = req.user;

        // Here you would integrate with your existing cost analysis logic
        const mockData = {
          tenantId: user.tenantId,
          totalCost: 1234.56,
          breakdown: {
            compute: 567.89,
            storage: 345.67,
            networking: 321.00
          },
          period: {
            start: params.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: params.endDate || new Date().toISOString()
          },
          currency: 'USD'
        };

        res.json(this.createResponse(true, mockData));
      } catch (error) {
        res.status(500).json(this.createResponse(false, null, {
          code: 'INTERNAL_ERROR',
          message: error.message
        }));
      }
    });

    // Trigger cost analysis
    this.app.post('/api/costs/analyze', async (req: Request, res: Response) => {
      try {
        const params = req.body as CostAnalysisRequest;
        const user = req.user;

        // Emit webhook event
        if (this.config.enableWebhooks) {
          await this.emitWebhookEvent('cost_analysis.started', {
            tenantId: user.tenantId,
            userId: user.id,
            analysisParams: params
          });
        }

        // Mock analysis result
        const result = {
          analysisId: randomBytes(8).toString('hex'),
          status: 'completed',
          results: {
            totalCost: 1234.56,
            recommendations: ['Consider rightsizing instances', 'Archive unused storage']
          }
        };

        // Emit completion webhook
        if (this.config.enableWebhooks) {
          await this.emitWebhookEvent('cost_analysis.completed', {
            tenantId: user.tenantId,
            userId: user.id,
            analysisId: result.analysisId,
            results: result.results
          });
        }

        res.json(this.createResponse(true, result));
      } catch (error) {
        res.status(500).json(this.createResponse(false, null, {
          code: 'ANALYSIS_FAILED',
          message: error.message
        }));
      }
    });
  }

  private setupTenantRoutes(): void {
    if (!this.multiTenantManager) return;

    // Get tenant info
    this.app.get('/api/tenants/:id', async (req: Request, res: Response) => {
      try {
        const tenantId = req.params.id;
        const user = req.user;

        // Check permission
        if (user.tenantId !== tenantId) {
          res.status(403).json(this.createResponse(false, null, {
            code: 'FORBIDDEN',
            message: 'Access denied to tenant data'
          }));
          return;
        }

        const tenant = await this.multiTenantManager!.getTenant(tenantId);
        if (!tenant) {
          res.status(404).json(this.createResponse(false, null, {
            code: 'TENANT_NOT_FOUND',
            message: 'Tenant not found'
          }));
          return;
        }

        res.json(this.createResponse(true, tenant));
      } catch (error) {
        res.status(500).json(this.createResponse(false, null, {
          code: 'INTERNAL_ERROR',
          message: error.message
        }));
      }
    });
  }

  private setupUserRoutes(): void {
    // Get user profile
    this.app.get('/api/users/me', async (req: Request, res: Response) => {
      try {
        const user = req.user;

        // In a real implementation, fetch from database
        const userProfile = {
          id: user.id,
          tenantId: user.tenantId,
          email: 'user@example.com',
          role: 'member',
          permissions: [],
          lastLoginAt: new Date().toISOString()
        };

        res.json(this.createResponse(true, userProfile));
      } catch (error) {
        res.status(500).json(this.createResponse(false, null, {
          code: 'INTERNAL_ERROR',
          message: error.message
        }));
      }
    });
  }

  private setupAPIKeyRoutes(): void {
    // List API keys for current user
    this.app.get('/api/api-keys', async (req: Request, res: Response) => {
      try {
        const user = req.user;
        const userKeys = Array.from(this.apiKeys.values())
          .filter(key => key.userId === user.id)
          .map(key => ({
            id: key.id,
            name: key.name,
            status: key.status,
            createdAt: key.createdAt,
            lastUsedAt: key.lastUsedAt,
            expiresAt: key.expiresAt,
            usage: key.usage
          }));

        res.json(this.createResponse(true, userKeys));
      } catch (error) {
        res.status(500).json(this.createResponse(false, null, {
          code: 'INTERNAL_ERROR',
          message: error.message
        }));
      }
    });

    // Create new API key
    this.app.post('/api/api-keys', async (req: Request, res: Response) => {
      try {
        const { name, permissions, expiresAt } = req.body;
        const user = req.user;

        const apiKey = this.generateAPIKey(user.id, user.tenantId, name, permissions, expiresAt);

        res.json(this.createResponse(true, {
          id: apiKey.id,
          key: apiKey.key, // Only returned once
          name: apiKey.name,
          permissions: apiKey.permissions,
          expiresAt: apiKey.expiresAt
        }));
      } catch (error) {
        res.status(500).json(this.createResponse(false, null, {
          code: 'KEY_CREATION_FAILED',
          message: error.message
        }));
      }
    });

    // Revoke API key
    this.app.delete('/api/api-keys/:id', async (req: Request, res: Response) => {
      try {
        const keyId = req.params.id;
        const user = req.user;

        const apiKey = this.apiKeys.get(keyId);
        if (!apiKey || apiKey.userId !== user.id) {
          res.status(404).json(this.createResponse(false, null, {
            code: 'KEY_NOT_FOUND',
            message: 'API key not found'
          }));
          return;
        }

        apiKey.status = 'revoked';
        this.apiKeys.set(keyId, apiKey);

        res.json(this.createResponse(true, { message: 'API key revoked successfully' }));
      } catch (error) {
        res.status(500).json(this.createResponse(false, null, {
          code: 'REVOCATION_FAILED',
          message: error.message
        }));
      }
    });
  }

  private setupWebhookRoutes(): void {
    if (!this.config.enableWebhooks) return;

    // List webhook subscriptions
    this.app.get('/api/webhooks', async (req: Request, res: Response) => {
      try {
        const user = req.user;
        const userWebhooks = Array.from(this.webhookSubscriptions.values())
          .filter(webhook => webhook.tenantId === user.tenantId);

        res.json(this.createResponse(true, userWebhooks));
      } catch (error) {
        res.status(500).json(this.createResponse(false, null, {
          code: 'INTERNAL_ERROR',
          message: error.message
        }));
      }
    });

    // Create webhook subscription
    this.app.post('/api/webhooks', async (req: Request, res: Response) => {
      try {
        const { url, events, secret } = req.body;
        const user = req.user;

        const webhook: WebhookSubscription = {
          id: randomBytes(8).toString('hex'),
          tenantId: user.tenantId,
          url,
          events: events || ['*'],
          secret,
          active: true,
          createdAt: new Date(),
          failureCount: 0,
          maxRetries: 3
        };

        this.webhookSubscriptions.set(webhook.id, webhook);

        res.json(this.createResponse(true, webhook));
      } catch (error) {
        res.status(500).json(this.createResponse(false, null, {
          code: 'WEBHOOK_CREATION_FAILED',
          message: error.message
        }));
      }
    });

    // Delete webhook subscription
    this.app.delete('/api/webhooks/:id', async (req: Request, res: Response) => {
      try {
        const webhookId = req.params.id;
        const user = req.user;

        const webhook = this.webhookSubscriptions.get(webhookId);
        if (!webhook || webhook.tenantId !== user.tenantId) {
          res.status(404).json(this.createResponse(false, null, {
            code: 'WEBHOOK_NOT_FOUND',
            message: 'Webhook not found'
          }));
          return;
        }

        this.webhookSubscriptions.delete(webhookId);

        res.json(this.createResponse(true, { message: 'Webhook deleted successfully' }));
      } catch (error) {
        res.status(500).json(this.createResponse(false, null, {
          code: 'WEBHOOK_DELETION_FAILED',
          message: error.message
        }));
      }
    });
  }

  private setupAnalyticsRoutes(): void {
    // Get analytics dashboard
    this.app.get('/api/analytics/dashboard', async (req: Request, res: Response) => {
      try {
        const user = req.user;

        // Mock analytics data
        const dashboard = {
          tenantId: user.tenantId,
          summary: {
            totalCosts: 1234.56,
            monthlyTrend: 5.2,
            activeResources: 42,
            recommendations: 8
          },
          charts: [
            {
              type: 'line',
              title: 'Monthly Costs',
              data: [1000, 1100, 1234.56]
            },
            {
              type: 'pie',
              title: 'Cost by Service',
              data: { compute: 60, storage: 25, networking: 15 }
            }
          ]
        };

        res.json(this.createResponse(true, dashboard));
      } catch (error) {
        res.status(500).json(this.createResponse(false, null, {
          code: 'ANALYTICS_FAILED',
          message: error.message
        }));
      }
    });
  }

  private setupEventListeners(): void {
    this.webhookManager.on('delivery.success', (delivery: WebhookDelivery) => {
      console.log(`✅ Webhook delivered: ${delivery.id}`);
    });

    this.webhookManager.on('delivery.failed', (delivery: WebhookDelivery) => {
      console.log(`❌ Webhook delivery failed: ${delivery.id} - ${delivery.error}`);
    });
  }

  public generateAPIKey(
    userId: string,
    tenantId: string,
    name: string = 'default',
    permissions: APIPermission[] = [],
    expiresAt?: Date
  ): APIKey {
    const key = randomBytes(32).toString('hex');
    const hashedKey = createHash('sha256').update(key).digest('hex');

    const apiKey: APIKey = {
      id: randomBytes(8).toString('hex'),
      key,
      hashedKey,
      name,
      userId,
      tenantId,
      permissions,
      status: 'active',
      createdAt: new Date(),
      expiresAt,
      usage: {
        requestCount: 0,
        lastReset: new Date(),
        rateLimitReached: false
      }
    };

    this.apiKeys.set(apiKey.id, apiKey);
    return apiKey;
  }

  private async emitWebhookEvent(eventType: string, data: unknown): Promise<void> {
    const relevantWebhooks = Array.from(this.webhookSubscriptions.values())
      .filter(webhook =>
        webhook.active &&
        (webhook.events.includes('*') || webhook.events.includes(eventType))
      );

    for (const webhook of relevantWebhooks) {
      const event: WebhookEvent = {
        id: randomBytes(8).toString('hex'),
        type: eventType,
        data,
        timestamp: new Date(),
        tenantId: webhook.tenantId
      };

      await this.webhookManager.deliverWebhook(webhook.url, event, webhook.secret);
    }
  }

  private createResponse<T>(
    success: boolean,
    data?: T,
    error?: { code: string; message: string; details?: unknown }
  ): APIResponse<T> {
    return {
      success,
      data,
      error,
      meta: {
        requestId: randomBytes(8).toString('hex'),
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };
  }

  public setMultiTenantManager(manager: MultiTenantManager): void {
    this.multiTenantManager = manager;
  }

  public setCostAnalytics(analytics: AdvancedCostAnalytics): void {
    this.costAnalytics = analytics;
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, this.config.host, () => {
        console.log(`🚀 API Server running on ${this.config.host}:${this.config.port}`);
        this.emit('started');
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🛑 API Server stopped');
          this.emit('stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public getStats(): {
    apiKeys: { total: number; active: number; suspended: number };
    webhooks: { total: number; active: number };
    rateLimits: { activeKeys: number };
  } {
    return {
      apiKeys: {
        total: this.apiKeys.size,
        active: Array.from(this.apiKeys.values()).filter(k => k.status === 'active').length,
        suspended: Array.from(this.apiKeys.values()).filter(k => k.status === 'suspended').length
      },
      webhooks: {
        total: this.webhookSubscriptions.size,
        active: Array.from(this.webhookSubscriptions.values()).filter(w => w.active).length
      },
      rateLimits: {
        activeKeys: this.rateLimitStore.size
      }
    };
  }
}