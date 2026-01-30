/**
 * Azure Provider Configuration
 *
 * Handles Azure authentication and configuration management.
 * Supports multiple authentication methods:
 * - Service Principal (client credentials)
 * - Managed Identity
 * - Azure CLI credentials
 * - Interactive browser login
 */

import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';
import { ProviderConfig } from '../../types/providers';

export interface AzureClientConfig {
  subscriptionId: string;
  subscriptionIds?: string[];
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  managementGroupId?: string;
  allSubscriptions?: boolean;
  auth: DefaultAzureCredential | ClientSecretCredential;
}

/**
 * Create Azure authentication client from provider config
 */
export function createAzureAuth(config: ProviderConfig): DefaultAzureCredential | ClientSecretCredential {
  const { credentials } = config;

  // Option 1: Service Principal (client credentials)
  if (credentials.clientId && credentials.clientSecret && credentials.tenantId) {
    return new ClientSecretCredential(
      credentials.tenantId,
      credentials.clientId,
      credentials.clientSecret
    );
  }

  // Option 2: Default Azure Credential (Managed Identity, CLI, etc.)
  return new DefaultAzureCredential();
}

/**
 * Create Azure client configuration from provider config
 */
export function createAzureClientConfig(config: ProviderConfig): AzureClientConfig {
  const { credentials } = config;

  if (!credentials.subscriptionId && !credentials.allSubscriptions) {
    throw new Error('Azure provider requires subscriptionId or allSubscriptions flag');
  }

  const auth = createAzureAuth(config);

  return {
    subscriptionId: credentials.subscriptionId || '',
    subscriptionIds: credentials.subscriptionIds,
    tenantId: credentials.tenantId,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    managementGroupId: credentials.managementGroupId,
    allSubscriptions: credentials.allSubscriptions,
    auth,
  };
}

/**
 * Validate Azure configuration
 */
export function validateAzureConfig(config: ProviderConfig): boolean {
  const { credentials } = config;

  // Must have either subscriptionId or allSubscriptions flag
  if (!credentials.subscriptionId && !credentials.allSubscriptions) {
    return false;
  }

  // If using Service Principal, must have all three fields
  if (credentials.clientId || credentials.clientSecret || credentials.tenantId) {
    if (!credentials.clientId || !credentials.clientSecret || !credentials.tenantId) {
      return false;
    }
  }

  return true;
}
