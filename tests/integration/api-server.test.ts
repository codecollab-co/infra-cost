import { jest } from '@jest/globals';
import { APIServer } from '../../src/api/api-server.js';

describe('APIServer Integration Tests', () => {
  let apiServer: APIServer;

  beforeAll(async () => {
    apiServer = new APIServer({
      port: 3001,
      host: '0.0.0.0',
      enableCors: true,
      enableRateLimit: true,
      maxRequestsPerMinute: 100,
      enableAuth: false,
      enableWebhooks: false,
      webhookSecret: 'test-secret',
      logLevel: 'error'
    });
  });

  describe('Constructor', () => {
    it('should create API server instance with valid config', () => {
      expect(apiServer).toBeDefined();
      expect(apiServer).toBeInstanceOf(APIServer);
    });

    it('should have getStats method', () => {
      const stats = apiServer.getStats();
      expect(stats).toHaveProperty('apiKeys');
      expect(stats).toHaveProperty('webhooks');
      expect(stats).toHaveProperty('rateLimits');
    });
  });

  // Note: Full integration tests require supertest dependency
  // Install with: npm install --save-dev supertest @types/supertest
});
