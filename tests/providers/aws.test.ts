import { jest } from '@jest/globals';

// Mock the logger module entirely to avoid ora issues
jest.mock('../../src/logger', () => ({
  printFatalError: jest.fn(),
  showSpinner: jest.fn(),
  hideSpinner: jest.fn(),
  succeedSpinner: jest.fn(),
  failSpinner: jest.fn()
}));

// Use manual mocks from __mocks__ directory (no factory needed)
jest.mock('@aws-sdk/client-sts');
jest.mock('@aws-sdk/client-iam');
jest.mock('@aws-sdk/client-cost-explorer');

import { AWSProvider } from '../../src/providers/aws';
import { CloudProvider, ProviderConfig } from '../../src/types/providers';

// Import mock send functions from manual mocks
const { mockSTSSend } = require('../__mocks__/@aws-sdk/client-sts');
const { mockIAMSend } = require('../__mocks__/@aws-sdk/client-iam');
const { mockCESend } = require('../__mocks__/@aws-sdk/client-cost-explorer');

describe('AWSProvider', () => {
  let provider: AWSProvider;
  let mockConfig: ProviderConfig;

  beforeEach(() => {
    mockConfig = {
      provider: CloudProvider.AWS,
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key'
      }
    };

    provider = new AWSProvider(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create AWSProvider instance with valid config', () => {
      expect(provider).toBeDefined();
      expect(provider).toBeInstanceOf(AWSProvider);
    });

    it('should handle config with profile', () => {
      const configWithProfile = {
        ...mockConfig,
        profile: 'test-profile'
      };

      const providerWithProfile = new AWSProvider(configWithProfile);
      expect(providerWithProfile).toBeDefined();
    });
  });

  describe('validateCredentials', () => {
    it('should validate credentials successfully', async () => {
      // Mock successful STS response
      mockSTSSend.mockResolvedValue({
        Account: '123456789012',
        UserId: 'test-user',
        Arn: 'arn:aws:sts::123456789012:user/test-user'
      });

      const isValid = await provider.validateCredentials();
      expect(isValid).toBe(true);
      expect(mockSTSSend).toHaveBeenCalledTimes(1);
    });

    it('should return false for invalid credentials', async () => {
      // Mock failed STS response
      mockSTSSend.mockRejectedValue(new Error('Invalid credentials'));

      const isValid = await provider.validateCredentials();
      expect(isValid).toBe(false);
    });
  });

  describe('getAccountInfo', () => {
    it('should return account information', async () => {
      // Mock IAM response with account alias
      mockIAMSend.mockResolvedValue({
        AccountAliases: ['test-account-alias']
      });

      const accountInfo = await provider.getAccountInfo();

      expect(accountInfo).toEqual({
        id: 'test-account-alias',
        name: 'test-account-alias',
        provider: 'aws'
      });
      expect(mockIAMSend).toHaveBeenCalledTimes(1);
    });

    it('should handle missing account alias', async () => {
      // Mock IAM response with no aliases
      mockIAMSend.mockResolvedValue({
        AccountAliases: []
      });

      // Mock STS response for fallback
      mockSTSSend.mockResolvedValue({
        Account: '123456789012',
        UserId: 'test-user',
        Arn: 'arn:aws:sts::123456789012:user/test-user'
      });

      const accountInfo = await provider.getAccountInfo();

      expect(accountInfo).toEqual({
        id: '123456789012',
        name: '123456789012',
        provider: 'aws'
      });
      expect(mockIAMSend).toHaveBeenCalledTimes(1);
      expect(mockSTSSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCostBreakdown', () => {
    it('should return cost breakdown data', async () => {
      const mockCostData = {
        ResultsByTime: [
          {
            TimePeriod: {
              Start: '2024-01-01',
              End: '2024-01-31'
            },
            Total: {
              BlendedCost: {
                Amount: '100.50',
                Unit: 'USD'
              }
            },
            Groups: [
              {
                Keys: ['EC2-Instance'],
                Metrics: {
                  BlendedCost: {
                    Amount: '75.25',
                    Unit: 'USD'
                  }
                }
              }
            ]
          }
        ]
      };

      mockCESend.mockResolvedValue(mockCostData);

      const costBreakdown = await provider.getCostBreakdown();

      expect(costBreakdown).toHaveProperty('totals');
      expect(costBreakdown).toHaveProperty('totalsByService');
      expect(costBreakdown.totals.thisMonth).toBeGreaterThanOrEqual(0);
      expect(typeof costBreakdown.totalsByService).toBe('object');
      expect(mockCESend).toHaveBeenCalled();
    });

    it('should handle empty cost data', async () => {
      mockCESend.mockResolvedValue({
        ResultsByTime: []
      });

      const costBreakdown = await provider.getCostBreakdown();

      expect(costBreakdown.totals.thisMonth).toBe(0);
      expect(costBreakdown.totalsByService).toBeDefined();
      expect(mockCESend).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle AWS API errors gracefully', async () => {
      mockCESend.mockRejectedValue(new Error('AWS API Error'));

      await expect(provider.getCostBreakdown()).rejects.toThrow();
    });
  });
});
