import { CloudProvider, CloudProviderAdapter, ProviderConfig, ProviderFactory } from '../types/providers';
import { AWSProvider } from './aws';
import { GCPProvider } from './gcp/provider';
import { AzureProvider } from './azure/provider';
import { AlibabaCloudProvider } from './alicloud/provider';
import { OracleCloudProvider } from './oracle/provider';

export class CloudProviderFactory implements ProviderFactory {
  createProvider(config: ProviderConfig): CloudProviderAdapter {
    if (!this.validateProviderConfig(config)) {
      throw new Error(`Invalid configuration for provider: ${config.provider}`);
    }

    switch (config.provider) {
      case CloudProvider.AWS:
        return new AWSProvider(config);
      case CloudProvider.GOOGLE_CLOUD:
        return new GCPProvider(config);
      case CloudProvider.AZURE:
        return new AzureProvider(config);
      case CloudProvider.ALIBABA_CLOUD:
        return new AlibabaCloudProvider(config);
      case CloudProvider.ORACLE_CLOUD:
        return new OracleCloudProvider(config);
      default:
        throw new Error(`Unsupported cloud provider: ${config.provider}`);
    }
  }

  getSupportedProviders(): CloudProvider[] {
    return [
      CloudProvider.AWS,
      CloudProvider.GOOGLE_CLOUD,
      CloudProvider.AZURE,
      CloudProvider.ALIBABA_CLOUD,
      CloudProvider.ORACLE_CLOUD
    ];
  }

  validateProviderConfig(config: ProviderConfig): boolean {
    if (!config.provider) {
      return false;
    }

    const supportedProviders = this.getSupportedProviders();
    if (!supportedProviders.includes(config.provider)) {
      return false;
    }

    // Basic validation - specific providers can do more detailed validation
    return config.credentials !== null && config.credentials !== undefined;
  }

  static getProviderDisplayNames(): Record<CloudProvider, string> {
    return {
      [CloudProvider.AWS]: 'Amazon Web Services (AWS)',
      [CloudProvider.GOOGLE_CLOUD]: 'Google Cloud Platform (GCP)',
      [CloudProvider.AZURE]: 'Microsoft Azure',
      [CloudProvider.ALIBABA_CLOUD]: 'Alibaba Cloud',
      [CloudProvider.ORACLE_CLOUD]: 'Oracle Cloud Infrastructure (OCI)'
    };
  }

  static getProviderFromString(provider: string): CloudProvider | null {
    const normalizedProvider = provider.toLowerCase().trim();

    const providerMap: Record<string, CloudProvider> = {
      'aws': CloudProvider.AWS,
      'amazon': CloudProvider.AWS,
      'amazonwebservices': CloudProvider.AWS,
      'gcp': CloudProvider.GOOGLE_CLOUD,
      'google': CloudProvider.GOOGLE_CLOUD,
      'googlecloud': CloudProvider.GOOGLE_CLOUD,
      'azure': CloudProvider.AZURE,
      'microsoft': CloudProvider.AZURE,
      'microsoftazure': CloudProvider.AZURE,
      'alicloud': CloudProvider.ALIBABA_CLOUD,
      'alibaba': CloudProvider.ALIBABA_CLOUD,
      'alibabacloud': CloudProvider.ALIBABA_CLOUD,
      'oracle': CloudProvider.ORACLE_CLOUD,
      'oci': CloudProvider.ORACLE_CLOUD,
      'oraclecloud': CloudProvider.ORACLE_CLOUD
    };

    return providerMap[normalizedProvider.replace(/[-_\s]/g, '')] || null;
  }
}