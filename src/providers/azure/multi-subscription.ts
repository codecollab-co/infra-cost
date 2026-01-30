/**
 * Azure Multi-Subscription Cost Management
 *
 * Handles cost aggregation across multiple Azure subscriptions.
 * Supports management group hierarchies and parallel processing.
 */

import { AzureClientConfig } from './config';
import { listSubscriptions, AzureSubscription } from './subscription';
import { getSubscriptionCostBreakdown, aggregateCosts, AzureCostData } from './cost';

export interface MultiSubscriptionCostBreakdown {
  totals: {
    thisMonth: number;
    lastMonth: number;
    currency: string;
  };
  totalsByService: Record<string, number>;
  subscriptions: AzureCostData[];
  aggregatedTotals: {
    thisMonth: number;
    lastMonth: number;
    currency: string;
  };
  aggregatedTotalsByService: Record<string, number>;
}

export interface ManagementGroupCostBreakdown {
  managementGroupId: string;
  managementGroupName?: string;
  totals: {
    thisMonth: number;
    lastMonth: number;
    currency: string;
  };
  totalsByService: Record<string, number>;
  subscriptions: AzureCostData[];
  subscriptionCount: number;
}

/**
 * Get cost breakdown across multiple Azure subscriptions
 */
export async function getMultiSubscriptionCostBreakdown(
  azureConfig: AzureClientConfig,
  options?: {
    activeOnly?: boolean;
    subscriptionIds?: string[];
  }
): Promise<MultiSubscriptionCostBreakdown> {
  let subscriptionIds: string[];

  // Determine which subscriptions to query
  if (options?.subscriptionIds && options.subscriptionIds.length > 0) {
    subscriptionIds = options.subscriptionIds;
  } else if (azureConfig.subscriptionIds && azureConfig.subscriptionIds.length > 0) {
    subscriptionIds = azureConfig.subscriptionIds;
  } else if (azureConfig.allSubscriptions) {
    // Fetch all accessible subscriptions
    const subscriptions = await listSubscriptions(azureConfig, {
      activeOnly: options?.activeOnly !== false,
    });
    subscriptionIds = subscriptions.map((s) => s.subscriptionId);
  } else {
    // Single subscription
    subscriptionIds = azureConfig.subscriptionId ? [azureConfig.subscriptionId] : [];
  }

  if (subscriptionIds.length === 0) {
    throw new Error('No subscriptions found to query');
  }

  console.log(`Fetching costs for ${subscriptionIds.length} subscriptions...`);

  // Fetch costs for all subscriptions in parallel
  const subscriptionCosts = await Promise.all(
    subscriptionIds.map(async (subscriptionId) => {
      try {
        return await getSubscriptionCostBreakdown(azureConfig, subscriptionId);
      } catch (error: any) {
        console.error(
          `Failed to get costs for subscription ${subscriptionId}: ${error.message}`
        );
        // Return zero costs on failure
        return {
          subscriptionId,
          thisMonth: 0,
          lastMonth: 0,
          currency: 'USD',
          breakdown: [],
        };
      }
    })
  );

  // Aggregate costs
  const aggregated = aggregateCosts(subscriptionCosts);

  return {
    totals: {
      thisMonth: aggregated.totalThisMonth,
      lastMonth: aggregated.totalLastMonth,
      currency: aggregated.currency,
    },
    totalsByService: aggregated.totalsByService,
    subscriptions: subscriptionCosts,
    aggregatedTotals: {
      thisMonth: aggregated.totalThisMonth,
      lastMonth: aggregated.totalLastMonth,
      currency: aggregated.currency,
    },
    aggregatedTotalsByService: aggregated.totalsByService,
  };
}

/**
 * Get cost breakdown for all subscriptions in a management group
 */
export async function getManagementGroupCostBreakdown(
  azureConfig: AzureClientConfig,
  managementGroupId?: string
): Promise<ManagementGroupCostBreakdown> {
  const mgId = managementGroupId || azureConfig.managementGroupId;

  if (!mgId) {
    throw new Error('Management group ID is required');
  }

  // Note: Full management group support requires @azure/arm-managementgroups
  // For now, this is a placeholder implementation
  console.warn('Management group cost breakdown not fully implemented yet');

  // Get all subscriptions (placeholder - should filter by management group)
  const subscriptions = await listSubscriptions(azureConfig, { activeOnly: true });
  const subscriptionIds = subscriptions.map((s) => s.subscriptionId);

  // Fetch costs for all subscriptions
  const subscriptionCosts = await Promise.all(
    subscriptionIds.map(async (subscriptionId) => {
      try {
        return await getSubscriptionCostBreakdown(azureConfig, subscriptionId);
      } catch (error: any) {
        console.error(
          `Failed to get costs for subscription ${subscriptionId}: ${error.message}`
        );
        return {
          subscriptionId,
          thisMonth: 0,
          lastMonth: 0,
          currency: 'USD',
          breakdown: [],
        };
      }
    })
  );

  // Aggregate costs
  const aggregated = aggregateCosts(subscriptionCosts);

  return {
    managementGroupId: mgId,
    totals: {
      thisMonth: aggregated.totalThisMonth,
      lastMonth: aggregated.totalLastMonth,
      currency: aggregated.currency,
    },
    totalsByService: aggregated.totalsByService,
    subscriptions: subscriptionCosts,
    subscriptionCount: subscriptionCosts.length,
  };
}

/**
 * Get detailed cost breakdown with subscription metadata
 */
export async function getDetailedMultiSubscriptionCostBreakdown(
  azureConfig: AzureClientConfig,
  options?: {
    activeOnly?: boolean;
    subscriptionIds?: string[];
  }
): Promise<{
  subscriptions: Array<{
    subscription: AzureSubscription;
    costs: AzureCostData;
  }>;
  aggregatedTotals: {
    thisMonth: number;
    lastMonth: number;
    currency: string;
  };
  aggregatedTotalsByService: Record<string, number>;
}> {
  // Get subscription list
  let subscriptions: AzureSubscription[];

  if (options?.subscriptionIds && options.subscriptionIds.length > 0) {
    // Fetch specific subscriptions
    subscriptions = await Promise.all(
      options.subscriptionIds.map(async (id) => {
        const subs = await listSubscriptions(azureConfig, { activeOnly: false });
        return subs.find((s) => s.subscriptionId === id)!;
      })
    );
    subscriptions = subscriptions.filter(Boolean);
  } else {
    // Fetch all subscriptions
    subscriptions = await listSubscriptions(azureConfig, {
      activeOnly: options?.activeOnly !== false,
    });
  }

  // Fetch costs for each subscription
  const detailedCosts = await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        const costs = await getSubscriptionCostBreakdown(
          azureConfig,
          subscription.subscriptionId
        );

        return {
          subscription,
          costs: {
            ...costs,
            subscriptionName: subscription.displayName,
          },
        };
      } catch (error: any) {
        console.error(
          `Failed to get costs for subscription ${subscription.subscriptionId}: ${error.message}`
        );
        return {
          subscription,
          costs: {
            subscriptionId: subscription.subscriptionId,
            subscriptionName: subscription.displayName,
            thisMonth: 0,
            lastMonth: 0,
            currency: 'USD',
            breakdown: [],
          },
        };
      }
    })
  );

  // Aggregate costs
  const allCosts = detailedCosts.map((d) => d.costs);
  const aggregated = aggregateCosts(allCosts);

  return {
    subscriptions: detailedCosts,
    aggregatedTotals: {
      thisMonth: aggregated.totalThisMonth,
      lastMonth: aggregated.totalLastMonth,
      currency: aggregated.currency,
    },
    aggregatedTotalsByService: aggregated.totalsByService,
  };
}
