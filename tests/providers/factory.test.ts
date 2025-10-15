import { CloudProviderFactory } from '../../src/providers/factory';
import { CloudProvider, ProviderConfig } from '../../src/types/providers';

describe('CloudProviderFactory', () => {
  describe('create', () => {
    it('should create AWS provider with valid config', () => {
      const config: ProviderConfig = {
        provider: CloudProvider.AWS,
        region: 'us-east-1',
        accessKeyId: 'test-key',
        secretAccessKey: 'test-secret'
      };

      const provider = CloudProviderFactory.create(CloudProvider.AWS, config);
      expect(provider).toBeDefined();
    });

    it('should throw error for unsupported provider', () => {
      const config: ProviderConfig = {
        provider: 'unsupported' as CloudProvider,
        region: 'us-east-1'
      };

      expect(() => {
        CloudProviderFactory.create('unsupported' as CloudProvider, config);
      }).toThrow('Unsupported cloud provider');
    });
  });

  describe('getSupportedProviders', () => {
    it('should return list of supported providers', () => {
      const providers = CloudProviderFactory.getSupportedProviders();
      expect(providers).toContain(CloudProvider.AWS);
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    });
  });
});