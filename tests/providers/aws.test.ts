// @ts-nocheck
import { AWSProvider } from '../../src/providers/aws';
import { ProviderConfig } from '../../src/types/providers';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cost-explorer');
jest.mock('@aws-sdk/client-sts');
jest.mock('@aws-sdk/client-iam');

describe('AWSProvider', () => {
  let provider: AWSProvider;
  let mockConfig: ProviderConfig;

  beforeEach(() => {
    mockConfig = {
      provider: 'aws',
      region: 'us-east-1',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key'
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
      const mockSTSClient = {
        send: jest.fn().mockResolvedValue({
          Account: '123456789012',
          UserId: 'test-user',
          Arn: 'arn:aws:sts::123456789012:user/test-user'
        })
      };

      // Replace the client in provider
      (provider as any).stsClient = mockSTSClient;

      const isValid = await provider.validateCredentials();
      expect(isValid).toBe(true);
      expect(mockSTSClient.send).toHaveBeenCalledTimes(1);
    });

    it('should return false for invalid credentials', async () => {
      // Mock failed STS response
      const mockSTSClient = {
        send: jest.fn().mockRejectedValue(new Error('Invalid credentials'))
      };

      (provider as any).stsClient = mockSTSClient;

      const isValid = await provider.validateCredentials();
      expect(isValid).toBe(false);
    });
  });

  describe('getAccountInfo', () => {
    it('should return account information', async () => {
      // Mock STS response
      const mockSTSClient = {
        send: jest.fn().mockResolvedValue({
          Account: '123456789012',
          UserId: 'test-user',
          Arn: 'arn:aws:sts::123456789012:user/test-user'
        })
      };

      // Mock IAM response
      const mockIAMClient = {
        send: jest.fn().mockResolvedValue({
          AccountAliases: ['test-account-alias']
        })
      };

      (provider as any).stsClient = mockSTSClient;
      (provider as any).iamClient = mockIAMClient;

      const accountInfo = await provider.getAccountInfo();

      expect(accountInfo).toEqual({
        id: '123456789012',
        name: 'test-account-alias',
        provider: 'aws'
      });
    });

    it('should handle missing account alias', async () => {
      const mockSTSClient = {
        send: jest.fn().mockResolvedValue({
          Account: '123456789012',
          UserId: 'test-user',
          Arn: 'arn:aws:sts::123456789012:user/test-user'
        })
      };

      const mockIAMClient = {
        send: jest.fn().mockResolvedValue({
          AccountAliases: []
        })
      };

      (provider as any).stsClient = mockSTSClient;
      (provider as any).iamClient = mockIAMClient;

      const accountInfo = await provider.getAccountInfo();

      expect(accountInfo).toEqual({
        id: '123456789012',
        name: '123456789012',
        provider: 'aws'
      });
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

      const mockCEClient = {
        send: jest.fn().mockResolvedValue(mockCostData)
      };

      (provider as any).ceClient = mockCEClient;

      const costBreakdown = await provider.getCostBreakdown();

      expect(costBreakdown).toHaveProperty('totals');
      expect(costBreakdown).toHaveProperty('services');
      expect(costBreakdown.totals.thisMonth).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(costBreakdown.services)).toBe(true);
    });

    it('should handle empty cost data', async () => {
      const mockCEClient = {
        send: jest.fn().mockResolvedValue({
          ResultsByTime: []
        })
      };

      (provider as any).ceClient = mockCEClient;

      const costBreakdown = await provider.getCostBreakdown();

      expect(costBreakdown.totals.thisMonth).toBe(0);
      expect(costBreakdown.services).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should handle AWS API errors gracefully', async () => {
      const mockCEClient = {
        send: jest.fn().mockRejectedValue(new Error('AWS API Error'))
      };

      (provider as any).ceClient = mockCEClient;

      await expect(provider.getCostBreakdown()).rejects.toThrow();
    });
  });
});