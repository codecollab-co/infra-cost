/**
 * Alibaba Cloud Provider Configuration
 *
 * Handles Alibaba Cloud authentication and configuration management.
 * Supports AccessKey/SecretKey authentication for API access.
 */

import { ProviderConfig } from '../../types/providers';

export interface AlibabaCloudClientConfig {
  accessKeyId: string;
  accessKeySecret: string;
  regionId: string;
  accountId?: string;
  allAccounts?: boolean;
  accountIds?: string[];
  endpoint?: string;
}

/**
 * Create Alibaba Cloud client configuration from provider config
 */
export function createAlibabaCloudClientConfig(config: ProviderConfig): AlibabaCloudClientConfig {
  const { credentials } = config;

  if (!credentials.accessKeyId || !credentials.accessKeySecret) {
    throw new Error('Alibaba Cloud provider requires accessKeyId and accessKeySecret');
  }

  // Default to cn-hangzhou region if not specified
  const regionId = config.region || credentials.regionId || 'cn-hangzhou';

  return {
    accessKeyId: credentials.accessKeyId,
    accessKeySecret: credentials.accessKeySecret,
    regionId,
    accountId: credentials.accountId,
    allAccounts: credentials.allAccounts,
    accountIds: credentials.accountIds,
    endpoint: credentials.endpoint,
  };
}

/**
 * Validate Alibaba Cloud configuration
 */
export function validateAlibabaCloudConfig(config: ProviderConfig): boolean {
  const { credentials } = config;

  // Must have AccessKey credentials
  if (!credentials.accessKeyId || !credentials.accessKeySecret) {
    return false;
  }

  // If specifying multiple accounts, must have account IDs
  if (credentials.allAccounts === false && credentials.accountIds && credentials.accountIds.length === 0) {
    return false;
  }

  return true;
}

/**
 * Get common SDK client configuration
 */
export function getCommonClientConfig(aliConfig: AlibabaCloudClientConfig) {
  return {
    accessKeyId: aliConfig.accessKeyId,
    accessKeySecret: aliConfig.accessKeySecret,
    endpoint: aliConfig.endpoint,
    regionId: aliConfig.regionId,
  };
}

/**
 * Create BSS OpenAPI endpoint based on region
 */
export function getBSSEndpoint(regionId: string): string {
  // BSS OpenAPI has specific regional endpoints
  const mainlandRegions = ['cn-hangzhou', 'cn-shanghai', 'cn-beijing', 'cn-shenzhen'];

  if (mainlandRegions.includes(regionId)) {
    return 'business.aliyuncs.com';
  }

  // International regions
  return 'business.ap-southeast-1.aliyuncs.com';
}

/**
 * Create ECS endpoint based on region
 */
export function getECSEndpoint(regionId: string): string {
  return `ecs.${regionId}.aliyuncs.com`;
}

/**
 * Create OSS endpoint based on region
 */
export function getOSSEndpoint(regionId: string): string {
  return `oss-${regionId}.aliyuncs.com`;
}

/**
 * Create RDS endpoint based on region
 */
export function getRDSEndpoint(regionId: string): string {
  return `rds.${regionId}.aliyuncs.com`;
}

/**
 * Create Container Service endpoint based on region
 */
export function getCSEndpoint(regionId: string): string {
  return `cs.${regionId}.aliyuncs.com`;
}
