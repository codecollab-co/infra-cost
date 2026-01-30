/**
 * Azure Subscription Management
 *
 * Handles listing and managing Azure subscriptions.
 * Supports multi-subscription and management group hierarchies.
 */

import { SubscriptionClient } from '@azure/arm-subscriptions';
import { AzureClientConfig } from './config';

export interface AzureSubscription {
  subscriptionId: string;
  displayName: string;
  state: string;
  tenantId?: string;
  managementGroupId?: string;
}

/**
 * List all accessible Azure subscriptions
 */
export async function listSubscriptions(
  azureConfig: AzureClientConfig,
  options?: {
    activeOnly?: boolean;
  }
): Promise<AzureSubscription[]> {
  const subscriptionClient = new SubscriptionClient(azureConfig.auth as any);

  const subscriptions: AzureSubscription[] = [];

  for await (const subscription of subscriptionClient.subscriptions.list()) {
    // Skip non-enabled subscriptions if activeOnly is true
    if (options?.activeOnly && subscription.state !== 'Enabled') {
      continue;
    }

    subscriptions.push({
      subscriptionId: subscription.subscriptionId || '',
      displayName: subscription.displayName || '',
      state: subscription.state || 'Unknown',
      tenantId: subscription.tenantId,
    });
  }

  return subscriptions;
}

/**
 * Get subscription details by ID
 */
export async function getSubscription(
  azureConfig: AzureClientConfig,
  subscriptionId: string
): Promise<AzureSubscription | null> {
  const subscriptionClient = new SubscriptionClient(azureConfig.auth as any);

  try {
    const subscription = await subscriptionClient.subscriptions.get(subscriptionId);

    return {
      subscriptionId: subscription.subscriptionId || '',
      displayName: subscription.displayName || '',
      state: subscription.state || 'Unknown',
      tenantId: subscription.tenantId,
    };
  } catch (error) {
    console.error(`Failed to get subscription ${subscriptionId}:`, error);
    return null;
  }
}

/**
 * List subscriptions in a management group
 */
export async function listSubscriptionsInManagementGroup(
  azureConfig: AzureClientConfig,
  managementGroupId: string
): Promise<AzureSubscription[]> {
  // Note: Management group listing requires @azure/arm-managementgroups
  // For now, return empty array as placeholder
  console.warn('Management group subscription listing not yet implemented');
  return [];
}
