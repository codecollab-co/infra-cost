import { jest } from '@jest/globals';

// Mock the logger module entirely to avoid ora issues
jest.mock('../../../src/logger.js', () => ({
  printFatalError: jest.fn(),
  showSpinner: jest.fn(),
  hideSpinner: jest.fn(),
  succeedSpinner: jest.fn(),
  failSpinner: jest.fn()
}));

import { AWSProvider } from '../../../src/providers/aws.js';
import { CloudProvider, ProviderConfig } from '../../../src/types/providers.js';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-cost-explorer');
jest.mock('@aws-sdk/client-ec2');
jest.mock('@aws-sdk/client-rds');
jest.mock('@aws-sdk/client-lambda');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-budgets');
jest.mock('@aws-sdk/client-sts');
jest.mock('@aws-sdk/client-iam');

describe('AWSProvider', () => {
  let awsProvider: AWSProvider;
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

    awsProvider = new AWSProvider(mockConfig);
  });

  describe('constructor', () => {
    it('should create AWSProvider instance with valid config', () => {
      expect(awsProvider).toBeDefined();
      expect(awsProvider).toBeInstanceOf(AWSProvider);
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

  describe('basic methods', () => {
    it('should have validateCredentials method', () => {
      expect(typeof awsProvider.validateCredentials).toBe('function');
    });

    it('should have getAccountInfo method', () => {
      expect(typeof awsProvider.getAccountInfo).toBe('function');
    });

    it('should have getCostBreakdown method', () => {
      expect(typeof awsProvider.getCostBreakdown).toBe('function');
    });

    it('should have getResourceInventory method', () => {
      expect(typeof awsProvider.getResourceInventory).toBe('function');
    });
  });
});
