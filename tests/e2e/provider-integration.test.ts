/**
 * Provider Integration E2E Tests
 *
 * Tests the integration between different provider modules
 * without requiring external credentials or API calls.
 */

import { CloudProviderFactory } from '../../src/providers/factory';
import { CloudProvider, ProviderConfig } from '../../src/types/providers';
import { GCPProvider } from '../../src/providers/gcp/provider';
import { AWSProvider } from '../../src/providers/aws/provider';

describe('Provider Integration E2E Tests', () => {
  describe('Provider Factory', () => {
    it('should create AWS provider from factory', () => {
      const config: ProviderConfig = {
        provider: CloudProvider.AWS,
        credentials: {
          profile: 'default',
        },
        region: 'us-east-1',
      };

      const provider = CloudProviderFactory.createProvider(config);

      expect(provider).toBeInstanceOf(AWSProvider);
      expect(provider.config.provider).toBe(CloudProvider.AWS);
    });

    it('should create GCP provider from factory', () => {
      const config: ProviderConfig = {
        provider: CloudProvider.GOOGLE_CLOUD,
        credentials: {
          projectId: 'test-project',
        },
      };

      const provider = CloudProviderFactory.createProvider(config);

      expect(provider).toBeInstanceOf(GCPProvider);
      expect(provider.config.provider).toBe(CloudProvider.GOOGLE_CLOUD);
    });

    it('should throw error for unsupported provider', () => {
      const config: ProviderConfig = {
        provider: 'unsupported' as CloudProvider,
        credentials: {},
      };

      expect(() => {
        CloudProviderFactory.createProvider(config);
      }).toThrow('Unsupported provider');
    });
  });

  describe('GCP Provider Configuration', () => {
    it('should initialize with single project configuration', () => {
      const config: ProviderConfig = {
        provider: CloudProvider.GOOGLE_CLOUD,
        credentials: {
          projectId: 'my-project',
          keyFilePath: '/path/to/key.json',
        },
      };

      const provider = new GCPProvider(config);

      expect(provider.config.provider).toBe(CloudProvider.GOOGLE_CLOUD);
      expect(provider.config.credentials.projectId).toBe('my-project');
    });

    it('should initialize with multi-project configuration', () => {
      const config: ProviderConfig = {
        provider: CloudProvider.GOOGLE_CLOUD,
        credentials: {
          projectId: 'main-project',
          projectIds: ['project-1', 'project-2', 'project-3'],
        },
      };

      const provider = new GCPProvider(config);

      expect(provider.config.credentials.projectIds).toHaveLength(3);
    });

    it('should initialize with organization configuration', () => {
      const config: ProviderConfig = {
        provider: CloudProvider.GOOGLE_CLOUD,
        credentials: {
          projectId: 'admin-project',
          organizationId: '123456789',
        },
      };

      const provider = new GCPProvider(config);

      expect(provider.config.credentials.organizationId).toBe('123456789');
    });

    it('should initialize with billing configuration', () => {
      const config: ProviderConfig = {
        provider: CloudProvider.GOOGLE_CLOUD,
        credentials: {
          projectId: 'billing-project',
          billingAccountId: '012345-ABCDEF-678901',
          billingDatasetId: 'custom_billing',
          billingTableId: 'custom_table',
        },
      };

      const provider = new GCPProvider(config);

      expect(provider.config.credentials.billingAccountId).toBe('012345-ABCDEF-678901');
      expect(provider.config.credentials.billingDatasetId).toBe('custom_billing');
    });
  });

  describe('AWS Provider Configuration', () => {
    it('should initialize with profile configuration', () => {
      const config: ProviderConfig = {
        provider: CloudProvider.AWS,
        credentials: {
          profile: 'production',
        },
        region: 'us-west-2',
      };

      const provider = new AWSProvider(config);

      expect(provider.config.credentials.profile).toBe('production');
      expect(provider.config.region).toBe('us-west-2');
    });

    it('should initialize with access key configuration', () => {
      const config: ProviderConfig = {
        provider: CloudProvider.AWS,
        credentials: {
          accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        },
        region: 'us-east-1',
      };

      const provider = new AWSProvider(config);

      expect(provider.config.credentials.accessKeyId).toBe('AKIAIOSFODNN7EXAMPLE');
    });
  });

  describe('Provider Validation', () => {
    it('should validate GCP config with required fields', () => {
      const validConfig: ProviderConfig = {
        provider: CloudProvider.GOOGLE_CLOUD,
        credentials: {
          projectId: 'valid-project',
        },
      };

      expect(GCPProvider.validateGCPConfig(validConfig)).toBe(true);
    });

    it('should reject GCP config without projectId', () => {
      const invalidConfig: ProviderConfig = {
        provider: CloudProvider.GOOGLE_CLOUD,
        credentials: {},
      };

      expect(GCPProvider.validateGCPConfig(invalidConfig)).toBe(false);
    });

    it('should return required credentials for GCP', () => {
      const requiredCreds = GCPProvider.getRequiredCredentials();

      expect(requiredCreds).toContain('projectId');
      expect(requiredCreds).toContain('keyFilePath');
      expect(requiredCreds).toContain('billingDatasetId');
      expect(requiredCreds).toContain('billingTableId');
    });
  });

  describe('Multi-Provider Configuration', () => {
    it('should support switching between providers', () => {
      const awsConfig: ProviderConfig = {
        provider: CloudProvider.AWS,
        credentials: {
          profile: 'default',
        },
        region: 'us-east-1',
      };

      const gcpConfig: ProviderConfig = {
        provider: CloudProvider.GOOGLE_CLOUD,
        credentials: {
          projectId: 'test-project',
        },
      };

      const awsProvider = CloudProviderFactory.createProvider(awsConfig);
      const gcpProvider = CloudProviderFactory.createProvider(gcpConfig);

      expect(awsProvider).toBeInstanceOf(AWSProvider);
      expect(gcpProvider).toBeInstanceOf(GCPProvider);
    });

    it('should maintain separate configurations for multiple providers', () => {
      const configs: ProviderConfig[] = [
        {
          provider: CloudProvider.AWS,
          credentials: { profile: 'aws-prod' },
          region: 'us-east-1',
        },
        {
          provider: CloudProvider.GOOGLE_CLOUD,
          credentials: { projectId: 'gcp-prod' },
        },
      ];

      const providers = configs.map((config) =>
        CloudProviderFactory.createProvider(config)
      );

      expect(providers[0].config.credentials.profile).toBe('aws-prod');
      expect(providers[1].config.credentials.projectId).toBe('gcp-prod');
    });
  });

  describe('Configuration Validation Workflow', () => {
    it('should validate complete GCP configuration workflow', () => {
      // Step 1: Create configuration
      const config: ProviderConfig = {
        provider: CloudProvider.GOOGLE_CLOUD,
        credentials: {
          projectId: 'e2e-test-project',
          keyFilePath: '/path/to/service-account.json',
          billingDatasetId: 'billing_export',
          billingTableId: 'gcp_billing_export',
        },
      };

      // Step 2: Validate configuration
      expect(GCPProvider.validateGCPConfig(config)).toBe(true);

      // Step 3: Create provider
      const provider = CloudProviderFactory.createProvider(config);
      expect(provider).toBeInstanceOf(GCPProvider);

      // Step 4: Verify configuration is accessible
      expect(provider.config.credentials.projectId).toBe('e2e-test-project');
      expect(provider.config.credentials.billingDatasetId).toBe('billing_export');
    });

    it('should validate complete AWS configuration workflow', () => {
      // Step 1: Create configuration
      const config: ProviderConfig = {
        provider: CloudProvider.AWS,
        credentials: {
          profile: 'e2e-test-profile',
        },
        region: 'us-west-2',
      };

      // Step 2: Create provider
      const provider = CloudProviderFactory.createProvider(config);
      expect(provider).toBeInstanceOf(AWSProvider);

      // Step 3: Verify configuration is accessible
      expect(provider.config.credentials.profile).toBe('e2e-test-profile');
      expect(provider.config.region).toBe('us-west-2');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid provider gracefully', () => {
      const config: ProviderConfig = {
        provider: 'invalid-provider' as CloudProvider,
        credentials: {},
      };

      expect(() => {
        CloudProviderFactory.createProvider(config);
      }).toThrow();
    });

    it('should handle missing credentials gracefully', () => {
      const config: ProviderConfig = {
        provider: CloudProvider.GOOGLE_CLOUD,
        credentials: {
          projectId: '',
        },
      };

      expect(GCPProvider.validateGCPConfig(config)).toBe(false);
    });
  });

  describe('Configuration Serialization', () => {
    it('should serialize and deserialize GCP configuration', () => {
      const originalConfig: ProviderConfig = {
        provider: CloudProvider.GOOGLE_CLOUD,
        credentials: {
          projectId: 'serialization-test',
          projectIds: ['proj1', 'proj2'],
          organizationId: '123456789',
        },
      };

      // Serialize
      const serialized = JSON.stringify(originalConfig);

      // Deserialize
      const deserialized: ProviderConfig = JSON.parse(serialized);

      // Verify
      expect(deserialized.provider).toBe(CloudProvider.GOOGLE_CLOUD);
      expect(deserialized.credentials.projectId).toBe('serialization-test');
      expect(deserialized.credentials.projectIds).toEqual(['proj1', 'proj2']);
      expect(deserialized.credentials.organizationId).toBe('123456789');
    });

    it('should serialize and deserialize AWS configuration', () => {
      const originalConfig: ProviderConfig = {
        provider: CloudProvider.AWS,
        credentials: {
          profile: 'test-profile',
        },
        region: 'eu-west-1',
      };

      // Serialize
      const serialized = JSON.stringify(originalConfig);

      // Deserialize
      const deserialized: ProviderConfig = JSON.parse(serialized);

      // Verify
      expect(deserialized.provider).toBe(CloudProvider.AWS);
      expect(deserialized.credentials.profile).toBe('test-profile');
      expect(deserialized.region).toBe('eu-west-1');
    });
  });
});
