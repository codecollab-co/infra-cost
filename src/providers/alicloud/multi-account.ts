/**
 * Alibaba Cloud Multi-Account Support
 *
 * Handles cost aggregation and resource discovery across multiple Alibaba Cloud accounts.
 * Similar to Azure multi-subscription and AWS Organizations support.
 */

import { AlibabaCloudClientConfig } from './config';
import { getAccountCostBreakdown, aggregateCosts, AlibabaCloudCostData } from './cost';
import { listAccounts, getMultipleAccounts, AlibabaCloudAccount } from './account';
import { discoverAllResources } from './inventory';

export interface MultiAccountCostBreakdown {
  accounts: Array<{
    accountId: string;
    accountName: string;
    costs: AlibabaCloudCostData;
  }>;
  totals: {
    thisMonth: number;
    lastMonth: number;
    last7Days: number;
    yesterday: number;
    currency: string;
  };
  totalsByService: Record<string, number>;
  accountCount: number;
}

export interface DetailedMultiAccountCostBreakdown extends MultiAccountCostBreakdown {
  costByAccount: Record<string, AlibabaCloudCostData>;
  serviceCostsByAccount: Record<string, Record<string, number>>;
}

/**
 * Get cost breakdown for multiple Alibaba Cloud accounts
 */
export async function getMultiAccountCostBreakdown(
  aliConfig: AlibabaCloudClientConfig,
  options?: {
    activeOnly?: boolean;
    accountIds?: string[];
  }
): Promise<MultiAccountCostBreakdown> {
  try {
    // Determine which accounts to query
    let accountsToQuery: AlibabaCloudAccount[] = [];

    if (options?.accountIds && options.accountIds.length > 0) {
      // Use specified account IDs
      const accounts = await getMultipleAccounts(aliConfig, options.accountIds);
      accountsToQuery = accounts.filter((acc) => !acc.error);
    } else if (aliConfig.allAccounts) {
      // Discover all accessible accounts
      accountsToQuery = await listAccounts(aliConfig);
      if (options?.activeOnly) {
        accountsToQuery = accountsToQuery.filter((acc) => acc.status === 'Active');
      }
    } else if (aliConfig.accountIds && aliConfig.accountIds.length > 0) {
      // Use accounts from config
      const accounts = await getMultipleAccounts(aliConfig, aliConfig.accountIds);
      accountsToQuery = accounts.filter((acc) => !acc.error);
    } else {
      // Single account mode
      const accounts = await listAccounts(aliConfig);
      accountsToQuery = accounts;
    }

    console.log(`Fetching costs for ${accountsToQuery.length} accounts...`);

    // Fetch costs for all accounts in parallel
    const costPromises = accountsToQuery.map(async (account) => {
      try {
        const costs = await getAccountCostBreakdown(aliConfig, account.accountId);
        return {
          accountId: account.accountId,
          accountName: account.accountName,
          costs,
        };
      } catch (error: any) {
        console.error(`Failed to get costs for account ${account.accountId}:`, error.message);
        return {
          accountId: account.accountId,
          accountName: account.accountName,
          costs: {
            accountId: account.accountId,
            thisMonth: 0,
            lastMonth: 0,
            last7Days: 0,
            yesterday: 0,
            currency: 'CNY',
            breakdown: [],
          },
        };
      }
    });

    const accounts = await Promise.all(costPromises);

    // Aggregate costs across all accounts
    const allCosts = accounts.map((acc) => acc.costs);
    const aggregated = aggregateCosts(allCosts);

    return {
      accounts,
      totals: {
        thisMonth: aggregated.totalThisMonth,
        lastMonth: aggregated.totalLastMonth,
        last7Days: aggregated.totalLast7Days,
        yesterday: aggregated.totalYesterday,
        currency: aggregated.currency,
      },
      totalsByService: aggregated.totalsByService,
      accountCount: accounts.length,
    };
  } catch (error: any) {
    console.error('Failed to get multi-account cost breakdown:', error.message);
    throw error;
  }
}

/**
 * Get detailed multi-account cost breakdown with per-account service costs
 */
export async function getDetailedMultiAccountCostBreakdown(
  aliConfig: AlibabaCloudClientConfig,
  options?: {
    activeOnly?: boolean;
    accountIds?: string[];
  }
): Promise<DetailedMultiAccountCostBreakdown> {
  const breakdown = await getMultiAccountCostBreakdown(aliConfig, options);

  // Build detailed cost maps
  const costByAccount: Record<string, AlibabaCloudCostData> = {};
  const serviceCostsByAccount: Record<string, Record<string, number>> = {};

  for (const account of breakdown.accounts) {
    costByAccount[account.accountId] = account.costs;

    // Build service costs map for this account
    const serviceCosts: Record<string, number> = {};
    if (account.costs.breakdown) {
      for (const service of account.costs.breakdown) {
        const serviceName = service.productName || service.productCode;
        serviceCosts[serviceName] = service.cost;
      }
    }
    serviceCostsByAccount[account.accountId] = serviceCosts;
  }

  return {
    ...breakdown,
    costByAccount,
    serviceCostsByAccount,
  };
}

/**
 * Get resource inventory across multiple accounts
 */
export async function getMultiAccountResourceInventory(
  aliConfig: AlibabaCloudClientConfig,
  options?: {
    activeOnly?: boolean;
    accountIds?: string[];
    includeResources?: boolean;
  }
): Promise<{
  accountCount: number;
  totalResources: number;
  resourcesByAccount: Record<string, {
    accountId: string;
    accountName: string;
    resourceCount: number;
    resources?: any;
  }>;
  resourcesByType: Record<string, number>;
}> {
  try {
    // Determine which accounts to query
    let accountsToQuery: AlibabaCloudAccount[] = [];

    if (options?.accountIds && options.accountIds.length > 0) {
      const accounts = await getMultipleAccounts(aliConfig, options.accountIds);
      accountsToQuery = accounts.filter((acc) => !acc.error);
    } else if (aliConfig.allAccounts) {
      accountsToQuery = await listAccounts(aliConfig);
      if (options?.activeOnly) {
        accountsToQuery = accountsToQuery.filter((acc) => acc.status === 'Active');
      }
    } else if (aliConfig.accountIds && aliConfig.accountIds.length > 0) {
      const accounts = await getMultipleAccounts(aliConfig, aliConfig.accountIds);
      accountsToQuery = accounts.filter((acc) => !acc.error);
    } else {
      const accounts = await listAccounts(aliConfig);
      accountsToQuery = accounts;
    }

    console.log(`Discovering resources for ${accountsToQuery.length} accounts...`);

    // Discover resources for all accounts in parallel
    const resourcePromises = accountsToQuery.map(async (account) => {
      try {
        const resources = await discoverAllResources(aliConfig);
        const resourceCount =
          resources.ecsInstances.length +
          resources.ossBuckets.length +
          resources.rdsInstances.length +
          resources.ackClusters.length;

        return {
          accountId: account.accountId,
          accountName: account.accountName,
          resourceCount,
          resources: options?.includeResources ? resources : undefined,
        };
      } catch (error: any) {
        console.error(`Failed to discover resources for account ${account.accountId}:`, error.message);
        return {
          accountId: account.accountId,
          accountName: account.accountName,
          resourceCount: 0,
          resources: undefined,
        };
      }
    });

    const accountResources = await Promise.all(resourcePromises);

    // Build resource maps
    const resourcesByAccount: Record<string, any> = {};
    let totalResources = 0;
    const resourcesByType: Record<string, number> = {
      compute: 0,
      storage: 0,
      database: 0,
      container: 0,
    };

    for (const accountResource of accountResources) {
      resourcesByAccount[accountResource.accountId] = accountResource;
      totalResources += accountResource.resourceCount;

      if (accountResource.resources) {
        resourcesByType.compute += accountResource.resources.ecsInstances.length;
        resourcesByType.storage += accountResource.resources.ossBuckets.length;
        resourcesByType.database += accountResource.resources.rdsInstances.length;
        resourcesByType.container += accountResource.resources.ackClusters.length;
      }
    }

    return {
      accountCount: accountsToQuery.length,
      totalResources,
      resourcesByAccount,
      resourcesByType,
    };
  } catch (error: any) {
    console.error('Failed to get multi-account resource inventory:', error.message);
    throw error;
  }
}

/**
 * Get top spending accounts
 */
export function getTopSpendingAccounts(
  breakdown: MultiAccountCostBreakdown,
  limit: number = 10
): Array<{
  accountId: string;
  accountName: string;
  thisMonth: number;
  lastMonth: number;
  percentageOfTotal: number;
}> {
  const sorted = [...breakdown.accounts]
    .sort((a, b) => b.costs.thisMonth - a.costs.thisMonth)
    .slice(0, limit);

  return sorted.map((account) => ({
    accountId: account.accountId,
    accountName: account.accountName,
    thisMonth: account.costs.thisMonth,
    lastMonth: account.costs.lastMonth,
    percentageOfTotal: (account.costs.thisMonth / breakdown.totals.thisMonth) * 100,
  }));
}

/**
 * Get accounts with cost increases
 */
export function getAccountsWithCostIncreases(
  breakdown: MultiAccountCostBreakdown,
  thresholdPercent: number = 10
): Array<{
  accountId: string;
  accountName: string;
  thisMonth: number;
  lastMonth: number;
  increasePercent: number;
  increaseAmount: number;
}> {
  const increases: Array<any> = [];

  for (const account of breakdown.accounts) {
    if (account.costs.lastMonth === 0) continue;

    const increaseAmount = account.costs.thisMonth - account.costs.lastMonth;
    const increasePercent = (increaseAmount / account.costs.lastMonth) * 100;

    if (increasePercent >= thresholdPercent) {
      increases.push({
        accountId: account.accountId,
        accountName: account.accountName,
        thisMonth: account.costs.thisMonth,
        lastMonth: account.costs.lastMonth,
        increasePercent,
        increaseAmount,
      });
    }
  }

  // Sort by increase percentage (descending)
  increases.sort((a, b) => b.increasePercent - a.increasePercent);

  return increases;
}

/**
 * Get cost distribution across accounts
 */
export function getCostDistribution(
  breakdown: MultiAccountCostBreakdown
): {
  topAccount: number;
  bottom25Percent: number;
  median: number;
  mean: number;
  standardDeviation: number;
} {
  const costs = breakdown.accounts.map((acc) => acc.costs.thisMonth).sort((a, b) => b - a);

  const sum = costs.reduce((a, b) => a + b, 0);
  const mean = sum / costs.length;

  const variance = costs.reduce((acc, cost) => acc + Math.pow(cost - mean, 2), 0) / costs.length;
  const standardDeviation = Math.sqrt(variance);

  const medianIndex = Math.floor(costs.length / 2);
  const median = costs.length % 2 === 0
    ? (costs[medianIndex - 1] + costs[medianIndex]) / 2
    : costs[medianIndex];

  const bottom25Index = Math.ceil(costs.length * 0.75);
  const bottom25Percent = costs[bottom25Index] || 0;

  return {
    topAccount: costs[0] || 0,
    bottom25Percent,
    median,
    mean,
    standardDeviation,
  };
}
