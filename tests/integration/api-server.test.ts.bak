// @ts-nocheck
import { jest } from '@jest/globals';
import request from 'supertest';
import { APIServer } from '../../src/api/api-server.js';

describe('APIServer Integration Tests', () => {
  let apiServer: APIServer;
  let server: any;

  beforeAll(async () => {
    // Mock environment variables for testing
    process.env.PORT = '3001';
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.API_VERSION = 'v1';

    apiServer = new APIServer({
      port: 3001,
      cors: { origin: '*' },
      rateLimit: { windowMs: 15 * 60 * 1000, max: 1000 }
    });

    server = await apiServer.start();
  });

  afterAll(async () => {
    if (server) {
      await apiServer.stop();
    }
  });

  describe('Health Check', () => {
    it('should return server health status', async () => {
      const response = await request(server)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String)
      }));
    });

    it('should include service status', async () => {
      const response = await request(server)
        .get('/health')
        .expect(200);

      expect(response.body.services).toEqual(expect.objectContaining({
        database: expect.any(String),
        cache: expect.any(String),
        webhooks: expect.any(String)
      }));
    });
  });

  describe('Authentication', () => {
    let authToken: string;

    it('should authenticate with valid API key', async () => {
      const response = await request(server)
        .post('/api/v1/auth/login')
        .send({
          apiKey: 'test-api-key-12345',
          tenantId: 'tenant-123'
        })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        token: expect.any(String),
        expiresIn: expect.any(Number)
      }));

      authToken = response.body.token;
    });

    it('should reject invalid API key', async () => {
      await request(server)
        .post('/api/v1/auth/login')
        .send({
          apiKey: 'invalid-key',
          tenantId: 'tenant-123'
        })
        .expect(401);
    });

    it('should access protected routes with valid token', async () => {
      await request(server)
        .get('/api/v1/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should reject access without token', async () => {
      await request(server)
        .get('/api/v1/user/profile')
        .expect(401);
    });
  });

  describe('Cost Analysis API', () => {
    let authToken: string;

    beforeAll(async () => {
      const authResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({
          apiKey: 'test-api-key-12345',
          tenantId: 'tenant-123'
        });
      authToken = authResponse.body.token;
    });

    it('should get cost analysis data', async () => {
      const response = await request(server)
        .get('/api/v1/costs/analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          provider: 'aws',
          startDate: '2023-01-01',
          endDate: '2023-01-31',
          groupBy: 'service'
        })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          totalCost: expect.any(Number),
          currency: expect.any(String),
          period: expect.objectContaining({
            start: expect.any(String),
            end: expect.any(String)
          }),
          services: expect.any(Array)
        })
      }));
    });

    it('should handle cost forecast requests', async () => {
      const response = await request(server)
        .post('/api/v1/costs/forecast')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'aws',
          days: 30,
          basedOn: 'historical'
        })
        .expect(200);

      expect(response.body.data).toEqual(expect.objectContaining({
        forecast: expect.any(Array),
        confidence: expect.any(Number),
        methodology: expect.any(String)
      }));
    });

    it('should validate cost analysis parameters', async () => {
      await request(server)
        .get('/api/v1/costs/analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          provider: 'invalid-provider'
        })
        .expect(400);
    });
  });

  describe('Resource Management API', () => {
    let authToken: string;

    beforeAll(async () => {
      const authResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({
          apiKey: 'test-api-key-12345',
          tenantId: 'tenant-123'
        });
      authToken = authResponse.body.token;
    });

    it('should get resource inventory', async () => {
      const response = await request(server)
        .get('/api/v1/resources/inventory')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ provider: 'aws' })
        .expect(200);

      expect(response.body.data).toEqual(expect.objectContaining({
        compute: expect.any(Object),
        storage: expect.any(Object),
        network: expect.any(Object),
        database: expect.any(Object)
      }));
    });

    it('should get optimization recommendations', async () => {
      const response = await request(server)
        .get('/api/v1/resources/recommendations')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ provider: 'aws', type: 'rightsizing' })
        .expect(200);

      expect(response.body.data).toEqual(expect.objectContaining({
        recommendations: expect.any(Array),
        potentialSavings: expect.any(Number),
        summary: expect.any(Object)
      }));
    });

    it('should apply optimization actions', async () => {
      const response = await request(server)
        .post('/api/v1/resources/optimize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'aws',
          actions: [{
            type: 'rightsizing',
            resourceId: 'i-1234567890abcdef0',
            newInstanceType: 't3.medium',
            estimatedSavings: 50
          }]
        })
        .expect(200);

      expect(response.body.data).toEqual(expect.objectContaining({
        jobId: expect.any(String),
        status: 'pending',
        actions: expect.any(Array)
      }));
    });
  });

  describe('Monitoring and Alerts API', () => {
    let authToken: string;

    beforeAll(async () => {
      const authResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({
          apiKey: 'test-api-key-12345',
          tenantId: 'tenant-123'
        });
      authToken = authResponse.body.token;
    });

    it('should create cost alert', async () => {
      const response = await request(server)
        .post('/api/v1/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'cost_threshold',
          name: 'Monthly Budget Alert',
          threshold: 1000,
          period: 'monthly',
          condition: 'greater_than',
          actions: ['email', 'slack']
        })
        .expect(201);

      expect(response.body.data).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: 'Monthly Budget Alert',
        status: 'active'
      }));
    });

    it('should get alert history', async () => {
      const response = await request(server)
        .get('/api/v1/alerts/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10 })
        .expect(200);

      expect(response.body.data).toEqual(expect.objectContaining({
        alerts: expect.any(Array),
        pagination: expect.any(Object)
      }));
    });

    it('should get anomaly detection results', async () => {
      const response = await request(server)
        .get('/api/v1/monitoring/anomalies')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          provider: 'aws',
          days: 7,
          severity: 'major'
        })
        .expect(200);

      expect(response.body.data).toEqual(expect.objectContaining({
        anomalies: expect.any(Array),
        statistics: expect.any(Object),
        recommendations: expect.any(Array)
      }));
    });
  });

  describe('Visualization API', () => {
    let authToken: string;

    beforeAll(async () => {
      const authResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({
          apiKey: 'test-api-key-12345',
          tenantId: 'tenant-123'
        });
      authToken = authResponse.body.token;
    });

    it('should create dashboard', async () => {
      const response = await request(server)
        .post('/api/v1/dashboards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Cost Overview Dashboard',
          template: 'cost-overview',
          configuration: {
            theme: 'default',
            autoRefresh: true,
            refreshInterval: 300
          }
        })
        .expect(201);

      expect(response.body.data).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: 'Cost Overview Dashboard',
        charts: expect.any(Array)
      }));
    });

    it('should export dashboard', async () => {
      // First create a dashboard
      const createResponse = await request(server)
        .post('/api/v1/dashboards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Export Test Dashboard',
          template: 'resource-optimization'
        });

      const dashboardId = createResponse.body.data.id;

      const response = await request(server)
        .get(`/api/v1/dashboards/${dashboardId}/export`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ format: 'html' })
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('<!DOCTYPE html>');
    });

    it('should get available dashboard templates', async () => {
      const response = await request(server)
        .get('/api/v1/dashboards/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toEqual(expect.objectContaining({
        templates: expect.any(Array)
      }));
    });
  });

  describe('Webhooks API', () => {
    let authToken: string;

    beforeAll(async () => {
      const authResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({
          apiKey: 'test-api-key-12345',
          tenantId: 'tenant-123'
        });
      authToken = authResponse.body.token;
    });

    it('should create webhook endpoint', async () => {
      const response = await request(server)
        .post('/api/v1/webhooks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://api.example.com/webhook',
          events: ['cost_analysis.completed', 'alert.triggered'],
          secret: 'webhook-secret-123'
        })
        .expect(201);

      expect(response.body.data).toEqual(expect.objectContaining({
        id: expect.any(String),
        url: 'https://api.example.com/webhook',
        events: expect.any(Array)
      }));
    });

    it('should get webhook delivery history', async () => {
      const response = await request(server)
        .get('/api/v1/webhooks/deliveries')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 5 })
        .expect(200);

      expect(response.body.data).toEqual(expect.objectContaining({
        deliveries: expect.any(Array),
        pagination: expect.any(Object)
      }));
    });

    it('should retry failed webhook delivery', async () => {
      // This would typically require a real failed delivery
      const response = await request(server)
        .post('/api/v1/webhooks/deliveries/retry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deliveryId: 'test-delivery-id' })
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        message: expect.any(String)
      }));
    });
  });

  describe('Error Handling', () => {
    let authToken: string;

    beforeAll(async () => {
      const authResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({
          apiKey: 'test-api-key-12345',
          tenantId: 'tenant-123'
        });
      authToken = authResponse.body.token;
    });

    it('should handle 404 errors', async () => {
      const response = await request(server)
        .get('/api/v1/non-existent-endpoint')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toEqual(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: expect.any(String)
        })
      }));
    });

    it('should handle validation errors', async () => {
      const response = await request(server)
        .post('/api/v1/costs/forecast')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'aws',
          days: -1 // Invalid value
        })
        .expect(400);

      expect(response.body).toEqual(expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
          details: expect.any(Array)
        })
      }));
    });

    it('should handle rate limiting', async () => {
      // Make rapid requests to trigger rate limiting
      const requests = Array.from({ length: 10 }, () =>
        request(server)
          .get('/api/v1/costs/analysis')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      // Some requests should be rate limited
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should handle server errors gracefully', async () => {
      // Simulate a server error by requesting invalid data
      const response = await request(server)
        .get('/api/v1/costs/analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          provider: 'aws',
          startDate: 'invalid-date'
        })
        .expect(400);

      expect(response.body).toEqual(expect.objectContaining({
        success: false,
        error: expect.any(Object)
      }));
    });
  });

  describe('Tenant Isolation', () => {
    let tenant1Token: string;
    let tenant2Token: string;

    beforeAll(async () => {
      const tenant1Auth = await request(server)
        .post('/api/v1/auth/login')
        .send({
          apiKey: 'tenant1-api-key',
          tenantId: 'tenant-1'
        });
      tenant1Token = tenant1Auth.body.token;

      const tenant2Auth = await request(server)
        .post('/api/v1/auth/login')
        .send({
          apiKey: 'tenant2-api-key',
          tenantId: 'tenant-2'
        });
      tenant2Token = tenant2Auth.body.token;
    });

    it('should isolate tenant data', async () => {
      // Create alert for tenant 1
      const tenant1Alert = await request(server)
        .post('/api/v1/alerts')
        .set('Authorization', `Bearer ${tenant1Token}`)
        .send({
          type: 'cost_threshold',
          name: 'Tenant 1 Alert',
          threshold: 500
        });

      // Try to access tenant 1's alert with tenant 2's token
      const unauthorizedAccess = await request(server)
        .get(`/api/v1/alerts/${tenant1Alert.body.data.id}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404); // Should not find tenant 1's alert

      expect(unauthorizedAccess.body.success).toBe(false);
    });
  });

  describe('Performance', () => {
    let authToken: string;

    beforeAll(async () => {
      const authResponse = await request(server)
        .post('/api/v1/auth/login')
        .send({
          apiKey: 'test-api-key-12345',
          tenantId: 'tenant-123'
        });
      authToken = authResponse.body.token;
    });

    it('should respond to health check quickly', async () => {
      const startTime = Date.now();

      await request(server)
        .get('/health')
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(100); // Should respond within 100ms
    });

    it('should handle concurrent requests', async () => {
      const concurrentRequests = Array.from({ length: 5 }, () =>
        request(server)
          .get('/api/v1/costs/analysis')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ provider: 'aws' })
      );

      const responses = await Promise.all(concurrentRequests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});