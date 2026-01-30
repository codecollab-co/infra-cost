/**
 * API Utilities
 * Helper functions for API routes
 */

import { CloudProviderAdapter } from '../types/providers';
import { CloudProviderFactory } from '../providers/factory';
import { autoLoadConfig } from '../core/config/loader';

/**
 * Get cloud provider instance from config
 */
export async function getProviderFromConfig(): Promise<CloudProviderAdapter> {
  const config = autoLoadConfig();
  const factory = new CloudProviderFactory();
  return factory.createProvider(config as any);
}

/**
 * Get current configuration
 */
export function getConfig() {
  return autoLoadConfig();
}
