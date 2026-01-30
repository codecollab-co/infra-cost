import {
  getRawCostByService,
  getTotalCosts,
  getDetailedCostBreakdown,
  getProjectBillingInfo,
} from '../../../../src/providers/gcp/cost';
import { BigQuery } from '@google-cloud/bigquery';
import { CloudBillingClient } from '@google-cloud/billing';

// Mock BigQuery
jest.mock('@google-cloud/bigquery');
// Mock Cloud Billing
jest.mock('@google-cloud/billing');
// Mock logger
jest.mock('../../../../src/logger', () => ({
  showSpinner: jest.fn(),
}));

describe('GCP Cost', () => {
  const mockAuth = {
    getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
  };

  const mockGcpConfig = {
    auth: mockAuth as any,
    projectId: 'test-project',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getRawCostByService', () => {
    it('should fetch and aggregate cost data by service', async () => {
      const mockRows = [
        {
          service_name: 'Compute Engine',
          usage_date: '2026-01-15',
          total_cost: 100.50,
          currency: 'USD',
        },
        {
          service_name: 'Cloud Storage',
          usage_date: '2026-01-15',
          total_cost: 25.75,
          currency: 'USD',
        },
        {
          service_name: 'Compute Engine',
          usage_date: '2026-01-16',
          total_cost: 105.25,
          currency: 'USD',
        },
      ];

      const mockQuery = jest.fn().mockResolvedValue([mockRows]);
      (BigQuery as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
      }));

      const result = await getRawCostByService(mockGcpConfig);

      expect(result).toHaveProperty('Compute Engine');
      expect(result).toHaveProperty('Cloud Storage');
      expect(result['Compute Engine']['2026-01-15']).toBe(100.50);
      expect(result['Compute Engine']['2026-01-16']).toBe(105.25);
      expect(result['Cloud Storage']['2026-01-15']).toBe(25.75);
    });

    it('should handle multiple currencies', async () => {
      const mockRows = [
        {
          service_name: 'Compute Engine',
          usage_date: '2026-01-15',
          total_cost: 100,
          currency: 'USD',
        },
        {
          service_name: 'Compute Engine',
          usage_date: '2026-01-15',
          total_cost: 85,
          currency: 'EUR',
        },
      ];

      const mockQuery = jest.fn().mockResolvedValue([mockRows]);
      (BigQuery as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
      }));

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = await getRawCostByService(mockGcpConfig);

      expect(result).toHaveProperty('Compute Engine (USD)');
      expect(result).toHaveProperty('Compute Engine (EUR)');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Multiple currencies detected')
      );
      consoleWarnSpy.mockRestore();
    });

    it('should apply date range filters', async () => {
      const mockQuery = jest.fn().mockResolvedValue([[]]);
      (BigQuery as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
      }));

      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-01-31');

      await getRawCostByService(mockGcpConfig, undefined, undefined, {
        startDate,
        endDate,
      });

      expect(mockQuery).toHaveBeenCalled();
      const queryCall = mockQuery.mock.calls[0][0];
      expect(queryCall.query).toContain('2026-01-01');
      expect(queryCall.query).toContain('2026-01-31');
    });

    it('should apply currency filter', async () => {
      const mockQuery = jest.fn().mockResolvedValue([[]]);
      (BigQuery as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
      }));

      await getRawCostByService(mockGcpConfig, undefined, undefined, {
        currency: 'EUR',
      });

      expect(mockQuery).toHaveBeenCalled();
      const queryCall = mockQuery.mock.calls[0][0];
      expect(queryCall.query).toContain("currency = 'EUR'");
    });

    it('should apply pagination limits', async () => {
      const mockQuery = jest.fn().mockResolvedValue([[]]);
      (BigQuery as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
      }));

      await getRawCostByService(mockGcpConfig, undefined, undefined, {
        maxResults: 100,
      });

      expect(mockQuery).toHaveBeenCalled();
      const queryCall = mockQuery.mock.calls[0][0];
      expect(queryCall.query).toContain('LIMIT 100');
      expect(queryCall.maxResults).toBe(100);
    });

    it('should throw helpful error when billing export not found', async () => {
      const error = new Error('Not found: Table billing_export.gcp_billing_export');
      const mockQuery = jest.fn().mockRejectedValue(error);
      (BigQuery as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
      }));

      await expect(getRawCostByService(mockGcpConfig)).rejects.toThrow(
        'BigQuery billing export not found'
      );
    });
  });

  describe('getTotalCosts', () => {
    it('should calculate totals by period', async () => {
      const mockRows = [
        // This month
        {
          service_name: 'Compute Engine',
          usage_date: new Date().toISOString().split('T')[0],
          total_cost: 100,
          currency: 'USD',
        },
        // Last month
        {
          service_name: 'Compute Engine',
          usage_date: new Date(new Date().setMonth(new Date().getMonth() - 1))
            .toISOString()
            .split('T')[0],
          total_cost: 90,
          currency: 'USD',
        },
      ];

      const mockQuery = jest.fn().mockResolvedValue([mockRows]);
      (BigQuery as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
      }));

      const result = await getTotalCosts(mockGcpConfig);

      expect(result.totals).toHaveProperty('thisMonth');
      expect(result.totals).toHaveProperty('lastMonth');
      expect(result.totalsByService).toHaveProperty('thisMonth');
      expect(result.totalsByService).toHaveProperty('lastMonth');
    });
  });

  describe('getDetailedCostBreakdown', () => {
    it('should return cost data with metadata', async () => {
      const mockRows = [
        {
          service_name: 'Compute Engine',
          usage_date: '2026-01-15',
          total_cost: 100,
          currency: 'USD',
        },
        {
          service_name: 'Cloud Storage',
          usage_date: '2026-01-15',
          total_cost: 50,
          currency: 'USD',
        },
      ];

      const mockQuery = jest.fn().mockResolvedValue([mockRows]);
      (BigQuery as jest.Mock).mockImplementation(() => ({
        query: mockQuery,
      }));

      const result = await getDetailedCostBreakdown(mockGcpConfig);

      expect(result).toHaveProperty('costByService');
      expect(result).toHaveProperty('metadata');
      expect(result.metadata.serviceCount).toBe(2);
      expect(result.metadata.totalCost).toBe(150);
      expect(result.metadata).toHaveProperty('dateRange');
      expect(result.metadata).toHaveProperty('currencies');
    });
  });

  describe('getProjectBillingInfo', () => {
    it('should fetch project billing information', async () => {
      const mockBillingInfo = {
        billingAccountName: 'billingAccounts/123456-ABCDEF-789012',
        billingEnabled: true,
      };

      const mockGetProjectBillingInfo = jest
        .fn()
        .mockResolvedValue([mockBillingInfo]);

      (CloudBillingClient as jest.Mock).mockImplementation(() => ({
        getProjectBillingInfo: mockGetProjectBillingInfo,
      }));

      const result = await getProjectBillingInfo(mockGcpConfig);

      expect(result.billingAccountName).toBe(
        'billingAccounts/123456-ABCDEF-789012'
      );
      expect(result.billingEnabled).toBe(true);
    });

    it('should handle billing info errors', async () => {
      const mockGetProjectBillingInfo = jest
        .fn()
        .mockRejectedValue(new Error('Access denied'));

      (CloudBillingClient as jest.Mock).mockImplementation(() => ({
        getProjectBillingInfo: mockGetProjectBillingInfo,
      }));

      await expect(getProjectBillingInfo(mockGcpConfig)).rejects.toThrow(
        'Failed to get project billing info'
      );
    });
  });
});
