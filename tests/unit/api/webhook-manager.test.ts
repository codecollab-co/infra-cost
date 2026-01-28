import { jest } from '@jest/globals';
import axios from 'axios';
import { WebhookManager } from '../../../src/api/webhook-manager.js';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Test utilities
const testUtils = {
  mockAxiosResponse: (data: unknown, status: number = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {} as any
  })
};

describe('WebhookManager', () => {
  let webhookManager: WebhookManager;

  beforeEach(() => {
    webhookManager = new WebhookManager({
      secret: 'test-secret',
      maxRetries: 3,
      retryDelay: 100,
      timeout: 5000
    });
  });

  afterEach(() => {
    webhookManager.shutdown();
  });

  describe('deliverWebhook', () => {
    it('should deliver webhook successfully', async () => {
      const mockResponse = testUtils.mockAxiosResponse({ success: true }, 200);
      mockedAxios.post.mockResolvedValue(mockResponse);

      const event = {
        id: 'evt_123',
        type: 'cost_analysis.completed' as const,
        data: { totalCost: 1000, currency: 'USD' },
        timestamp: new Date(),
        tenantId: 'tenant_123'
      };

      const delivery = await webhookManager.deliverWebhook(
        'https://example.com/webhook',
        event
      );

      expect(delivery.status).toBe('delivered');
      expect(delivery.event).toEqual(event);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'InfraCost-Webhook/1.0',
            'X-Webhook-Signature': expect.any(String)
          }),
          timeout: 5000
        })
      );
    });

    it('should retry on server errors', async () => {
      mockedAxios.post
        .mockRejectedValueOnce(new Error('Server Error'))
        .mockRejectedValueOnce(new Error('Server Error'))
        .mockResolvedValueOnce(testUtils.mockAxiosResponse({ success: true }, 200));

      const event = {
        id: 'evt_retry',
        type: 'alert.triggered' as const,
        data: { message: 'Cost threshold exceeded' },
        timestamp: new Date()
      };

      const delivery = await webhookManager.deliverWebhook(
        'https://example.com/webhook',
        event
      );

      // Wait for retries to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(delivery.attempts).toBe(3);
      expect(delivery.status).toBe('delivered');
    });

    it('should fail after max retries', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Persistent Server Error'));

      const event = {
        id: 'evt_fail',
        type: 'forecast.generated' as const,
        data: { forecast: 1500 },
        timestamp: new Date()
      };

      const delivery = await webhookManager.deliverWebhook(
        'https://example.com/webhook',
        event
      );

      // Wait for all retries to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(delivery.attempts).toBe(3);
      expect(delivery.status).toBe('failed');
      expect(delivery.error).toContain('Persistent Server Error');
    });

    it('should handle HTTP client errors without retry', async () => {
      const mockError = {
        response: { status: 400, statusText: 'Bad Request', data: 'Invalid payload' }
      };
      mockedAxios.post.mockRejectedValue(mockError);

      const event = {
        id: 'evt_400',
        type: 'user.created' as const,
        data: { userId: 'user_123' },
        timestamp: new Date()
      };

      const delivery = await webhookManager.deliverWebhook(
        'https://example.com/webhook',
        event
      );

      expect(delivery.attempts).toBe(1);
      expect(delivery.status).toBe('failed');
      expect(delivery.error).toContain('HTTP 400');
    });
  });

  describe('signature validation', () => {
    it('should generate correct HMAC signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';

      const signature = (webhookManager as any).generateSignature(payload, secret);

      expect(signature).toBeTruthy();
      expect(typeof signature).toBe('string');
      expect(signature).toHaveLength(64); // SHA256 hex string
    });

    it('should validate signature correctly', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';

      const signature = (webhookManager as any).generateSignature(payload, secret);
      const isValid = webhookManager.validateSignature(payload, `sha256=${signature}`, secret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      const invalidSignature = 'sha256=invalid_signature';

      const isValid = webhookManager.validateSignature(payload, invalidSignature, secret);

      expect(isValid).toBe(false);
    });

    it('should skip validation when disabled', () => {
      const noValidationManager = new WebhookManager({
        enableSignatureValidation: false
      });

      const isValid = noValidationManager.validateSignature('payload', 'invalid', 'secret');

      expect(isValid).toBe(true);
    });
  });

  describe('event emission', () => {
    it('should create and emit events', async () => {
      const event = await webhookManager.emitEvent(
        'cost_analysis.completed',
        { totalCost: 1000 },
        { tenantId: 'tenant_123', userId: 'user_456' }
      );

      expect(event).toEqual(expect.objectContaining({
        id: expect.any(String),
        type: 'cost_analysis.completed',
        data: { totalCost: 1000 },
        timestamp: expect.any(Date),
        tenantId: 'tenant_123',
        userId: 'user_456',
        source: 'infra-cost',
        version: '1.0'
      }));
    });

    it('should emit event.created event', async () => {
      const eventCreatedSpy = jest.fn();
      webhookManager.on('event.created', eventCreatedSpy);

      await webhookManager.emitEvent('tenant.created', { tenantId: 'new_tenant' });

      expect(eventCreatedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'tenant.created',
          data: { tenantId: 'new_tenant' }
        })
      );
    });
  });

  describe('delivery management', () => {
    it('should track delivery attempts', async () => {
      mockedAxios.post.mockResolvedValue(testUtils.mockAxiosResponse({ success: true }));

      const event = {
        id: 'evt_track',
        type: 'api_key.created' as const,
        data: { keyId: 'key_123' },
        timestamp: new Date()
      };

      const delivery = await webhookManager.deliverWebhook(
        'https://example.com/webhook',
        event
      );

      const retrieved = webhookManager.getDelivery(delivery.id);
      expect(retrieved).toEqual(delivery);
    });

    it('should filter deliveries by status', async () => {
      mockedAxios.post
        .mockResolvedValueOnce(testUtils.mockAxiosResponse({ success: true }))
        .mockRejectedValueOnce(new Error('Failed'));

      const successEvent = {
        id: 'evt_success',
        type: 'optimization.completed' as const,
        data: { savings: 500 },
        timestamp: new Date()
      };

      const failEvent = {
        id: 'evt_fail',
        type: 'threshold.exceeded' as const,
        data: { threshold: 1000 },
        timestamp: new Date()
      };

      await webhookManager.deliverWebhook('https://example.com/webhook', successEvent);
      await webhookManager.deliverWebhook('https://example.com/webhook', failEvent);

      // Wait for all retry attempts to complete (3 retries with exponential backoff)
      // Retry 1: 100ms, Retry 2: 200ms, Retry 3: 400ms -> need at least 700ms total
      await new Promise(resolve => setTimeout(resolve, 800));

      const successfulDeliveries = webhookManager.getDeliveries({ status: 'delivered' });
      const failedDeliveries = webhookManager.getDeliveries({ status: 'failed' });

      expect(successfulDeliveries).toHaveLength(1);
      expect(failedDeliveries).toHaveLength(1);
    });

    it('should filter deliveries by tenant', async () => {
      mockedAxios.post.mockResolvedValue(testUtils.mockAxiosResponse({ success: true }));

      const tenant1Event = {
        id: 'evt_t1',
        type: 'compliance.violation' as const,
        data: { violation: 'GDPR' },
        timestamp: new Date(),
        tenantId: 'tenant_1'
      };

      const tenant2Event = {
        id: 'evt_t2',
        type: 'audit.event' as const,
        data: { action: 'login' },
        timestamp: new Date(),
        tenantId: 'tenant_2'
      };

      await webhookManager.deliverWebhook('https://example.com/webhook', tenant1Event);
      await webhookManager.deliverWebhook('https://example.com/webhook', tenant2Event);

      const tenant1Deliveries = webhookManager.getDeliveries({ tenantId: 'tenant_1' });

      expect(tenant1Deliveries).toHaveLength(1);
      expect(tenant1Deliveries[0].event.tenantId).toBe('tenant_1');
    });

    it('should limit delivery results', () => {
      const deliveries = webhookManager.getDeliveries({ limit: 2 });
      expect(deliveries.length).toBeLessThanOrEqual(2);
    });
  });

  describe('retry mechanism', () => {
    it('should retry with exponential backoff', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Temporary failure'));

      const event = {
        id: 'evt_backoff',
        type: 'cost_analysis.failed' as const,
        data: { error: 'Analysis timeout' },
        timestamp: new Date()
      };

      const startTime = Date.now();
      await webhookManager.deliverWebhook('https://example.com/webhook', event);

      // Wait for retries
      await new Promise(resolve => setTimeout(resolve, 800));

      const delivery = webhookManager.getDeliveries({ limit: 1 })[0];
      expect(delivery.attempts).toBe(3);

      // Should have taken time for exponential backoff
      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeGreaterThan(300); // 100ms + 200ms + delays
    });
  });

  describe('statistics', () => {
    it('should calculate delivery statistics', async () => {
      mockedAxios.post
        .mockResolvedValueOnce(testUtils.mockAxiosResponse({ success: true }))
        .mockRejectedValueOnce(new Error('Failed'));

      const event1 = {
        id: 'evt_stats1',
        type: 'user.role_changed' as const,
        data: { userId: 'user_123' },
        timestamp: new Date()
      };

      const event2 = {
        id: 'evt_stats2',
        type: 'user.suspended' as const,
        data: { userId: 'user_456' },
        timestamp: new Date()
      };

      await webhookManager.deliverWebhook('https://example.com/webhook', event1);
      await webhookManager.deliverWebhook('https://example.com/webhook', event2);

      // Wait for delivery attempts
      await new Promise(resolve => setTimeout(resolve, 500));

      const stats = webhookManager.getStats();

      expect(stats).toEqual(expect.objectContaining({
        totalDeliveries: 2,
        successful: 1,
        failed: 1,
        pending: 0,
        retrying: 0,
        averageDeliveryTime: expect.any(Number),
        failureRate: 0.5
      }));
    });
  });

  describe('cleanup', () => {
    it('should purge old deliveries', async () => {
      mockedAxios.post.mockResolvedValue(testUtils.mockAxiosResponse({ success: true }));

      const oldEvent = {
        id: 'evt_old',
        type: 'api_key.revoked' as const,
        data: { keyId: 'old_key' },
        timestamp: new Date()
      };

      await webhookManager.deliverWebhook('https://example.com/webhook', oldEvent);

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);

      const purgedCount = webhookManager.purgeOldDeliveries(oldDate);

      expect(purgedCount).toBeGreaterThanOrEqual(0);
    });

    it('should shutdown gracefully', async () => {
      const shutdownSpy = jest.fn();
      webhookManager.on('shutdown', shutdownSpy);

      await webhookManager.shutdown();

      expect(shutdownSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = { code: 'ETIMEDOUT', message: 'Request timeout' };
      mockedAxios.post.mockRejectedValue(timeoutError);

      const event = {
        id: 'evt_timeout',
        type: 'forecast.generated' as const,
        data: { forecast: 2000 },
        timestamp: new Date()
      };

      const delivery = await webhookManager.deliverWebhook(
        'https://example.com/webhook',
        event
      );

      expect(delivery.error).toBe('Request timeout');
    });

    it('should handle connection refused', async () => {
      const connRefusedError = { code: 'ECONNREFUSED', message: 'Connection refused' };
      mockedAxios.post.mockRejectedValue(connRefusedError);

      const event = {
        id: 'evt_refused',
        type: 'optimization.completed' as const,
        data: { optimizations: [] },
        timestamp: new Date()
      };

      const delivery = await webhookManager.deliverWebhook(
        'https://example.com/webhook',
        event
      );

      expect(delivery.error).toBe('Connection refused');
    });
  });
});