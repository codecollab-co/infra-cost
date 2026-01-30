import { getBudgets, getBudgetAlerts } from '../../../../src/providers/gcp/budget';
import { BudgetServiceClient } from '@google-cloud/billing/build/src/v1';

// Mock GCP Billing SDK
jest.mock('@google-cloud/billing/build/src/v1', () => ({
  BudgetServiceClient: jest.fn(),
}));

jest.mock('@google-cloud/billing', () => ({
  CloudBillingClient: jest.fn(),
}));

jest.mock('../../../../src/providers/gcp/cost', () => ({
  getTotalCosts: jest.fn(),
}));

jest.mock('../../../../src/logger', () => ({
  showSpinner: jest.fn(),
}));

describe('GCP Budget', () => {
  const mockAuth = {
    getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
  };

  const mockGcpConfig = {
    auth: mockAuth as any,
    projectId: 'test-project',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock getTotalCosts
    const { getTotalCosts } = require('../../../../src/providers/gcp/cost');
    getTotalCosts.mockResolvedValue({
      totals: {
        thisMonth: 500,
        lastMonth: 450,
        last7Days: 115,
        yesterday: 16,
      },
    });
  });

  describe('getBudgets', () => {
    it('should fetch and parse GCP budgets', async () => {
      const mockBudget = {
        name: 'billingAccounts/123456/budgets/budget-1',
        displayName: 'Monthly Budget',
        amount: {
          specifiedAmount: {
            units: 1000,
            currencyCode: 'USD',
          },
        },
        budgetFilter: {
          calendarPeriod: 'MONTH',
        },
        thresholdRules: [
          { thresholdPercent: 0.5 }, // 50%
          { thresholdPercent: 0.8 }, // 80%
          { thresholdPercent: 1.0 }, // 100%
        ],
      };

      (BudgetServiceClient as jest.Mock).mockImplementation(() => ({
        listBudgets: jest.fn().mockResolvedValue([[mockBudget]]),
      }));

      const result = await getBudgets(mockGcpConfig, '123456');

      expect(result).toHaveLength(1);
      expect(result[0].budgetName).toBe('Monthly Budget');
      expect(result[0].budgetAmount).toBe(1000);
      expect(result[0].spentAmount).toBe(500); // From mocked getTotalCosts
      expect(result[0].currency).toBe('USD');
      expect(result[0].period).toBe('MONTH');
      expect(result[0].thresholds).toEqual([50, 80, 100]);
    });

    it('should handle multiple budgets', async () => {
      const mockBudgets = [
        {
          name: 'billingAccounts/123456/budgets/budget-1',
          displayName: 'Development Budget',
          amount: {
            specifiedAmount: {
              units: 500,
              currencyCode: 'USD',
            },
          },
          budgetFilter: {
            calendarPeriod: 'MONTH',
          },
          thresholdRules: [{ thresholdPercent: 0.9 }],
        },
        {
          name: 'billingAccounts/123456/budgets/budget-2',
          displayName: 'Production Budget',
          amount: {
            specifiedAmount: {
              units: 2000,
              currencyCode: 'USD',
            },
          },
          budgetFilter: {
            calendarPeriod: 'MONTH',
          },
          thresholdRules: [{ thresholdPercent: 0.8 }],
        },
      ];

      (BudgetServiceClient as jest.Mock).mockImplementation(() => ({
        listBudgets: jest.fn().mockResolvedValue([mockBudgets]),
      }));

      const result = await getBudgets(mockGcpConfig, '123456');

      expect(result).toHaveLength(2);
      expect(result[0].budgetName).toBe('Development Budget');
      expect(result[1].budgetName).toBe('Production Budget');
    });

    it('should handle custom period budgets', async () => {
      const mockBudget = {
        name: 'billingAccounts/123456/budgets/budget-1',
        displayName: 'Q1 Budget',
        amount: {
          specifiedAmount: {
            units: 3000,
            currencyCode: 'USD',
          },
        },
        budgetFilter: {
          customPeriod: {
            startDate: {
              year: 2026,
              month: 1,
              day: 1,
            },
            endDate: {
              year: 2026,
              month: 3,
              day: 31,
            },
          },
        },
        thresholdRules: [{ thresholdPercent: 0.75 }],
      };

      (BudgetServiceClient as jest.Mock).mockImplementation(() => ({
        listBudgets: jest.fn().mockResolvedValue([[mockBudget]]),
      }));

      const result = await getBudgets(mockGcpConfig, '123456');

      expect(result).toHaveLength(1);
      expect(result[0].startDate).toEqual(new Date(2026, 0, 1));
      expect(result[0].endDate).toEqual(new Date(2026, 2, 31));
    });

    it('should throw error without billing account ID', async () => {
      // Mock CloudBillingClient to return null
      const { CloudBillingClient } = require('@google-cloud/billing');
      CloudBillingClient.mockImplementation(() => ({
        getProjectBillingInfo: jest.fn().mockResolvedValue([{}]),
      }));

      await expect(getBudgets(mockGcpConfig)).rejects.toThrow(
        'Unable to determine billing account'
      );
    });
  });

  describe('getBudgetAlerts', () => {
    it('should generate alerts for breached thresholds', async () => {
      const mockBudget = {
        name: 'billingAccounts/123456/budgets/budget-1',
        displayName: 'Monthly Budget',
        amount: {
          specifiedAmount: {
            units: 1000,
            currencyCode: 'USD',
          },
        },
        budgetFilter: {
          calendarPeriod: 'MONTH',
        },
        thresholdRules: [
          { thresholdPercent: 0.5 }, // 50% - breached
          { thresholdPercent: 0.8 }, // 80% - not breached
          { thresholdPercent: 1.0 }, // 100% - not breached
        ],
      };

      (BudgetServiceClient as jest.Mock).mockImplementation(() => ({
        listBudgets: jest.fn().mockResolvedValue([[mockBudget]]),
      }));

      // Current spend is 500 (from mock), which is 50% of 1000
      const result = await getBudgetAlerts(mockGcpConfig, '123456');

      expect(result).toHaveLength(1);
      expect(result[0].budgetName).toBe('Monthly Budget');
      expect(result[0].threshold).toBe(50);
      expect(result[0].currentPercentage).toBe(50);
      expect(result[0].spentAmount).toBe(500);
      expect(result[0].remainingAmount).toBe(500);
      expect(result[0].status).toBe('warning');
      expect(result[0].severity).toBe('low');
    });

    it('should generate multiple alerts for multiple breached thresholds', async () => {
      const mockBudget = {
        name: 'billingAccounts/123456/budgets/budget-1',
        displayName: 'Monthly Budget',
        amount: {
          specifiedAmount: {
            units: 500, // Spend is 500, so 100% used
            currencyCode: 'USD',
          },
        },
        budgetFilter: {
          calendarPeriod: 'MONTH',
        },
        thresholdRules: [
          { thresholdPercent: 0.5 }, // 50% - breached
          { thresholdPercent: 0.8 }, // 80% - breached
          { thresholdPercent: 1.0 }, // 100% - breached
        ],
      };

      (BudgetServiceClient as jest.Mock).mockImplementation(() => ({
        listBudgets: jest.fn().mockResolvedValue([[mockBudget]]),
      }));

      const result = await getBudgetAlerts(mockGcpConfig, '123456');

      expect(result).toHaveLength(3);
      expect(result[0].threshold).toBe(50);
      expect(result[1].threshold).toBe(80);
      expect(result[2].threshold).toBe(100);

      // All should have 100% usage
      result.forEach((alert) => {
        expect(alert.currentPercentage).toBe(100);
      });
    });

    it('should calculate correct severity levels', async () => {
      const mockBudget1 = {
        name: 'billingAccounts/123456/budgets/budget-1',
        displayName: 'Budget Over Limit',
        amount: {
          specifiedAmount: {
            units: 400, // Spend is 500, so 125% used
            currencyCode: 'USD',
          },
        },
        budgetFilter: {
          calendarPeriod: 'MONTH',
        },
        thresholdRules: [{ thresholdPercent: 0.8 }],
      };

      (BudgetServiceClient as jest.Mock).mockImplementation(() => ({
        listBudgets: jest.fn().mockResolvedValue([[mockBudget1]]),
      }));

      const result = await getBudgetAlerts(mockGcpConfig, '123456');

      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe('critical'); // Over 100%
      expect(result[0].status).toBe('critical');
    });

    it('should sort alerts by severity', async () => {
      const mockBudgets = [
        {
          name: 'billingAccounts/123456/budgets/budget-1',
          displayName: 'Low Severity Budget',
          amount: {
            specifiedAmount: {
              units: 1000,
              currencyCode: 'USD',
            },
          },
          budgetFilter: {
            calendarPeriod: 'MONTH',
          },
          thresholdRules: [{ thresholdPercent: 0.5 }], // 50% threshold, 50% used
        },
        {
          name: 'billingAccounts/123456/budgets/budget-2',
          displayName: 'Critical Budget',
          amount: {
            specifiedAmount: {
              units: 400, // 125% used
              currencyCode: 'USD',
            },
          },
          budgetFilter: {
            calendarPeriod: 'MONTH',
          },
          thresholdRules: [{ thresholdPercent: 0.8 }],
        },
      ];

      (BudgetServiceClient as jest.Mock).mockImplementation(() => ({
        listBudgets: jest.fn().mockResolvedValue([mockBudgets]),
      }));

      const result = await getBudgetAlerts(mockGcpConfig, '123456');

      expect(result).toHaveLength(2);
      // Critical alert should be first
      expect(result[0].budgetName).toBe('Critical Budget');
      expect(result[0].severity).toBe('critical');
      // Low severity alert should be second
      expect(result[1].budgetName).toBe('Low Severity Budget');
      expect(result[1].severity).toBe('low');
    });

    it('should not generate alerts for budgets below threshold', async () => {
      const mockBudget = {
        name: 'billingAccounts/123456/budgets/budget-1',
        displayName: 'Safe Budget',
        amount: {
          specifiedAmount: {
            units: 2000, // Spend is 500, so 25% used
            currencyCode: 'USD',
          },
        },
        budgetFilter: {
          calendarPeriod: 'MONTH',
        },
        thresholdRules: [
          { thresholdPercent: 0.5 }, // 50% - not breached
          { thresholdPercent: 0.8 }, // 80% - not breached
        ],
      };

      (BudgetServiceClient as jest.Mock).mockImplementation(() => ({
        listBudgets: jest.fn().mockResolvedValue([[mockBudget]]),
      }));

      const result = await getBudgetAlerts(mockGcpConfig, '123456');

      expect(result).toHaveLength(0);
    });

    it('should skip budgets with zero amount', async () => {
      const mockBudget = {
        name: 'billingAccounts/123456/budgets/budget-1',
        displayName: 'Last Period Budget',
        amount: {
          lastPeriodAmount: {}, // Last period amount (not yet calculated)
        },
        budgetFilter: {
          calendarPeriod: 'MONTH',
        },
        thresholdRules: [{ thresholdPercent: 0.8 }],
      };

      (BudgetServiceClient as jest.Mock).mockImplementation(() => ({
        listBudgets: jest.fn().mockResolvedValue([[mockBudget]]),
      }));

      const result = await getBudgetAlerts(mockGcpConfig, '123456');

      expect(result).toHaveLength(0);
    });
  });
});
