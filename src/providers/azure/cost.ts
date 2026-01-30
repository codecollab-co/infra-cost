/**
 * Azure Cost Management
 *
 * Handles cost data retrieval from Azure Cost Management API.
 * Supports single subscription, multi-subscription, and management group costs.
 */

import { CostManagementClient } from '@azure/arm-costmanagement';
import { AzureClientConfig } from './config';

export interface AzureCostData {
  subscriptionId: string;
  subscriptionName?: string;
  thisMonth: number;
  lastMonth: number;
  currency: string;
  breakdown?: AzureCostByService[];
}

export interface AzureCostByService {
  serviceName: string;
  cost: number;
  currency: string;
}

export interface AzureDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/**
 * Get cost breakdown for a single Azure subscription
 */
export async function getSubscriptionCostBreakdown(
  azureConfig: AzureClientConfig,
  subscriptionId?: string,
  dateRange?: AzureDateRange
): Promise<AzureCostData> {
  const subId = subscriptionId || azureConfig.subscriptionId;

  if (!subId) {
    throw new Error('Subscription ID is required');
  }

  const costManagementClient = new CostManagementClient(azureConfig.auth as any);

  // Get current month costs
  const thisMonthRange = dateRange || getCurrentMonthRange();
  const lastMonthRange = getLastMonthRange();

  const [thisMonthData, lastMonthData] = await Promise.all([
    queryCosts(costManagementClient, subId, thisMonthRange),
    queryCosts(costManagementClient, subId, lastMonthRange),
  ]);

  return {
    subscriptionId: subId,
    thisMonth: thisMonthData.totalCost,
    lastMonth: lastMonthData.totalCost,
    currency: thisMonthData.currency,
    breakdown: thisMonthData.breakdown,
  };
}

/**
 * Query Azure Cost Management API
 */
async function queryCosts(
  client: CostManagementClient,
  subscriptionId: string,
  dateRange: AzureDateRange
): Promise<{ totalCost: number; currency: string; breakdown: AzureCostByService[] }> {
  const scope = `/subscriptions/${subscriptionId}`;

  try {
    const queryDefinition = {
      type: 'Usage',
      timeframe: 'Custom',
      timePeriod: {
        from: new Date(dateRange.startDate),
        to: new Date(dateRange.endDate),
      },
      dataset: {
        granularity: 'None',
        aggregation: {
          totalCost: {
            name: 'PreTaxCost',
            function: 'Sum',
          },
        },
        grouping: [
          {
            type: 'Dimension',
            name: 'ServiceName',
          },
        ],
      },
    };

    const result = await client.query.usage(scope, queryDefinition as any);

    let totalCost = 0;
    let currency = 'USD';
    const breakdown: AzureCostByService[] = [];

    if (result.rows && result.rows.length > 0) {
      // Extract currency from result
      if (result.rows[0] && result.rows[0].length > 2) {
        currency = result.rows[0][2] as string || 'USD';
      }

      // Process rows
      for (const row of result.rows) {
        const cost = parseFloat(row[0] as string) || 0;
        const serviceName = row[1] as string || 'Unknown';

        totalCost += cost;
        breakdown.push({
          serviceName,
          cost,
          currency,
        });
      }
    }

    return { totalCost, currency, breakdown };
  } catch (error: any) {
    console.error(`Failed to query costs for subscription ${subscriptionId}:`, error.message);
    return {
      totalCost: 0,
      currency: 'USD',
      breakdown: [],
    };
  }
}

/**
 * Get current month date range
 */
function getCurrentMonthRange(): AzureDateRange {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Get last month date range
 */
function getLastMonthRange(): AzureDateRange {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Aggregate costs from multiple subscriptions
 */
export function aggregateCosts(costs: AzureCostData[]): {
  totalThisMonth: number;
  totalLastMonth: number;
  currency: string;
  totalsByService: Record<string, number>;
} {
  let totalThisMonth = 0;
  let totalLastMonth = 0;
  const currency = costs[0]?.currency || 'USD';
  const totalsByService: Record<string, number> = {};

  for (const cost of costs) {
    totalThisMonth += cost.thisMonth;
    totalLastMonth += cost.lastMonth;

    // Aggregate by service
    if (cost.breakdown) {
      for (const service of cost.breakdown) {
        totalsByService[service.serviceName] =
          (totalsByService[service.serviceName] || 0) + service.cost;
      }
    }
  }

  return {
    totalThisMonth,
    totalLastMonth,
    currency,
    totalsByService,
  };
}
