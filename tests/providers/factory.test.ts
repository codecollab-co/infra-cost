import { jest } from '@jest/globals';

// Mock the logger module entirely to avoid ora issues
jest.mock('../../src/logger', () => ({
  printFatalError: jest.fn(),
  showSpinner: jest.fn(),
  hideSpinner: jest.fn(),
  succeedSpinner: jest.fn(),
  failSpinner: jest.fn()
}));

import { CloudProviderFactory } from '../../src/providers/factory';
import { CloudProvider, ProviderConfig } from '../../src/types/providers';

describe('CloudProviderFactory', () => {
  let factory: CloudProviderFactory;

  beforeEach(() => {
    factory = new CloudProviderFactory();
  });

  describe('createProvider', () => {
    it('should create AWS provider with valid config', () => {
      const config: ProviderConfig = {
        provider: CloudProvider.AWS,
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'test-key',
          secretAccessKey: 'test-secret'
        }
      };

      const provider = factory.createProvider(config);
      expect(provider).toBeDefined();
    });

    it('should throw error for unsupported provider', () => {
      const config: ProviderConfig = {
        provider: 'unsupported' as CloudProvider,
        region: 'us-east-1',
        credentials: {}
      };

      expect(() => {
        factory.createProvider(config);
      }).toThrow('Invalid configuration for provider');
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const providers = factory.getSupportedProviders();
      expect(providers).toContain(CloudProvider.AWS);
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    });
  });
});