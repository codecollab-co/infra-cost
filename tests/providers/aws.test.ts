import { jest } from '@jest/globals';

// Mock the logger module entirely to avoid ora issues
jest.mock('../../src/logger', () => ({
  printFatalError: jest.fn(),
  showSpinner: jest.fn(),
  hideSpinner: jest.fn(),
  succeedSpinner: jest.fn(),
  failSpinner: jest.fn()
}));

// Create a stable object to hold our mock functions
const mocks = {
  stsSend: jest.fn().mockResolvedValue({}),
  iamSend: jest.fn().mockResolvedValue({}),
  ceSend: jest.fn().mockResolvedValue({})
};

// Mock AWS SDK clients with explicit factory functions that reference the stable mocks object
jest.mock('@aws-sdk/client-sts', () => ({
  STSClient: jest.fn(() => ({
    send: (command: any) => mocks.stsSend(command)
  })),
  GetCallerIdentityCommand: jest.fn((input) => input)
}));

jest.mock('@aws-sdk/client-iam', () => ({
  IAMClient: jest.fn(() => ({
    send: (command: any) => mocks.iamSend(command)
  })),
  ListAccountAliasesCommand: jest.fn((input) => input)
}));

jest.mock('@aws-sdk/client-cost-explorer', () => ({
  CostExplorerClient: jest.fn(() => ({
    send: (command: any) => mocks.ceSend(command)
  })),
  GetCostAndUsageCommand: jest.fn((input) => input)
}));

import { AWSProvider } from '../../src/providers/aws';
import { CloudProvider, ProviderConfig } from '../../src/types/providers';

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
      mocks.stsSend.mockResolvedValue({
        Account: '123456789012',
        UserId: 'test-user',
        Arn: 'arn:aws:sts::123456789012:user/test-user'
      });

      const isValid = await provider.validateCredentials();
      expect(isValid).toBe(true);
      expect(mocks.stsSend).toHaveBeenCalledTimes(1);
    });

    it('should return false for invalid credentials', async () => {
      // Mock failed STS response
      mocks.stsSend.mockRejectedValue(new Error('Invalid credentials'));

      const isValid = await provider.validateCredentials();
      expect(isValid).toBe(false);
    });
  });

  describe('getAccountInfo', () => {
    it('should return account information', async () => {
      // Mock IAM response with account alias
      mocks.iamSend.mockResolvedValue({
        AccountAliases: ['test-account-alias']
      });

      const accountInfo = await provider.getAccountInfo();

      expect(accountInfo).toEqual({
        id: 'test-account-alias',
        name: 'test-account-alias',
        provider: 'aws'
      });
      expect(mocks.iamSend).toHaveBeenCalledTimes(1);
    });

    it('should handle missing account alias', async () => {
      // Mock IAM response with no aliases
      mocks.iamSend.mockResolvedValue({
        AccountAliases: []
      });

      // Mock STS response for fallback
      mocks.stsSend.mockResolvedValue({
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
      expect(mocks.iamSend).toHaveBeenCalledTimes(1);
      expect(mocks.stsSend).toHaveBeenCalledTimes(1);
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

      mocks.ceSend.mockResolvedValue(mockCostData);

      const costBreakdown = await provider.getCostBreakdown();

      expect(costBreakdown).toHaveProperty('totals');
      expect(costBreakdown).toHaveProperty('services');
      expect(costBreakdown.totals.thisMonth).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(costBreakdown.services)).toBe(true);
      expect(mocks.ceSend).toHaveBeenCalled();
    });

    it('should handle empty cost data', async () => {
      mocks.ceSend.mockResolvedValue({
        ResultsByTime: []
      });

      const costBreakdown = await provider.getCostBreakdown();

      expect(costBreakdown.totals.thisMonth).toBe(0);
      expect(costBreakdown.services).toEqual([]);
      expect(mocks.ceSend).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle AWS API errors gracefully', async () => {
      mocks.ceSend.mockRejectedValue(new Error('AWS API Error'));

      await expect(provider.getCostBreakdown()).rejects.toThrow();
    });
  });
});
