/**
 * Oracle Cloud Cost Management
 *
 * Handles cost data retrieval from OCI Usage API and Cost Analysis.
 * Supports single compartment, multi-compartment, and tenancy-wide costs.
 */

import * as usageapi from 'oci-usageapi';
import { OracleClientConfig } from './config';

export interface OracleCostData {
  compartmentId: string;
  compartmentName?: string;
  thisMonth: number;
  lastMonth: number;
  currency: string;
  breakdown?: OracleCostByService[];
}

export interface OracleCostByService {
  serviceName: string;
  cost: number;
  currency: string;
}

export interface OracleDateRange {
  startDate: string; // ISO 8601 format
  endDate: string;   // ISO 8601 format
}

/**
 * Get cost breakdown for a single OCI compartment
 */
export async function getCompartmentCostBreakdown(
  oracleConfig: OracleClientConfig,
  compartmentId?: string,
  dateRange?: OracleDateRange
): Promise<OracleCostData> {
  const compartId = compartmentId || oracleConfig.compartmentId || oracleConfig.tenancyId;

  if (!compartId) {
    throw new Error('Compartment ID is required');
  }

  const usageClient = new usageapi.UsageapiClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  // Get current month costs
  const thisMonthRange = dateRange || getCurrentMonthRange();
  const lastMonthRange = getLastMonthRange();

  const [thisMonthData, lastMonthData] = await Promise.all([
    queryCosts(usageClient, oracleConfig.tenancyId, compartId, thisMonthRange),
    queryCosts(usageClient, oracleConfig.tenancyId, compartId, lastMonthRange),
  ]);

  return {
    compartmentId: compartId,
    thisMonth: thisMonthData.totalCost,
    lastMonth: lastMonthData.totalCost,
    currency: thisMonthData.currency,
    breakdown: thisMonthData.breakdown,
  };
}

/**
 * Query OCI Usage API for cost data
 */
async function queryCosts(
  client: usageapi.UsageapiClient,
  tenancyId: string,
  compartmentId: string,
  dateRange: OracleDateRange
): Promise<{ totalCost: number; currency: string; breakdown: OracleCostByService[] }> {
  try {
    // Create usage request
    const requestSummarizedUsagesDetails: usageapi.models.RequestSummarizedUsagesDetails = {
      tenantId: tenancyId,
      timeUsageStarted: new Date(dateRange.startDate),
      timeUsageEnded: new Date(dateRange.endDate),
      granularity: usageapi.models.RequestSummarizedUsagesDetails.Granularity.Monthly,
      queryType: usageapi.models.RequestSummarizedUsagesDetails.QueryType.Cost,
      groupBy: ['service'],
      compartmentDepth: 6, // Include all nested compartments
      filter: {
        operator: usageapi.models.Filter.Operator.And,
        dimensions: [
          {
            key: 'compartmentId',
            value: compartmentId,
          },
        ],
        tags: [],
      },
    };

    const request: usageapi.requests.RequestSummarizedUsagesRequest = {
      requestSummarizedUsagesDetails: requestSummarizedUsagesDetails,
    };

    const response = await client.requestSummarizedUsages(request);

    let totalCost = 0;
    let currency = 'USD';
    const breakdown: OracleCostByService[] = [];

    if (response.usageAggregation?.items) {
      for (const item of response.usageAggregation.items) {
        const cost = item.computedAmount || 0;
        const serviceName = item.service || 'Unknown';

        totalCost += cost;

        // Get currency from first item
        if (!currency && item.currency) {
          currency = item.currency;
        }

        breakdown.push({
          serviceName,
          cost,
          currency: item.currency || currency,
        });
      }
    }

    return { totalCost, currency, breakdown };
  } catch (error: any) {
    console.error(`Failed to query costs for compartment ${compartmentId}:`, error.message);
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
function getCurrentMonthRange(): OracleDateRange {
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
function getLastMonthRange(): OracleDateRange {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Get custom date range
 */
export function getCustomDateRange(startDate: Date, endDate: Date): OracleDateRange {
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Aggregate costs from multiple compartments
 */
export function aggregateCosts(costs: OracleCostData[]): {
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

/**
 * Get cost forecast for next month
 */
export async function getCostForecast(
  oracleConfig: OracleClientConfig,
  compartmentId?: string
): Promise<{ forecastedCost: number; currency: string; confidence: number }> {
  // Get historical cost data for the last 3 months
  const compartId = compartmentId || oracleConfig.compartmentId || oracleConfig.tenancyId;
  const usageClient = new usageapi.UsageapiClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  try {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const dateRange: OracleDateRange = {
      startDate: threeMonthsAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };

    const historicalData = await queryCosts(
      usageClient,
      oracleConfig.tenancyId,
      compartId,
      dateRange
    );

    // Simple linear forecast based on average
    const forecastedCost = historicalData.totalCost / 3; // Average of last 3 months
    const confidence = 0.75; // 75% confidence (placeholder)

    return {
      forecastedCost,
      currency: historicalData.currency,
      confidence,
    };
  } catch (error: any) {
    console.error(`Failed to get cost forecast: ${error.message}`);
    return {
      forecastedCost: 0,
      currency: 'USD',
      confidence: 0,
    };
  }
}

/**
 * Get cost by resource tags
 */
export async function getCostsByTags(
  oracleConfig: OracleClientConfig,
  compartmentId: string,
  tagNamespace: string,
  tagKey: string,
  dateRange?: OracleDateRange
): Promise<Map<string, number>> {
  const usageClient = new usageapi.UsageapiClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  const range = dateRange || getCurrentMonthRange();
  const costsByTagValue = new Map<string, number>();

  try {
    const requestSummarizedUsagesDetails: usageapi.models.RequestSummarizedUsagesDetails = {
      tenantId: oracleConfig.tenancyId,
      timeUsageStarted: new Date(range.startDate),
      timeUsageEnded: new Date(range.endDate),
      granularity: usageapi.models.RequestSummarizedUsagesDetails.Granularity.Monthly,
      queryType: usageapi.models.RequestSummarizedUsagesDetails.QueryType.Cost,
      groupBy: [`tags/${tagNamespace}/${tagKey}`],
      compartmentDepth: 6,
      filter: {
        operator: usageapi.models.Filter.Operator.And,
        dimensions: [
          {
            key: 'compartmentId',
            value: compartmentId,
          },
        ],
        tags: [],
      },
    };

    const request: usageapi.requests.RequestSummarizedUsagesRequest = {
      requestSummarizedUsagesDetails: requestSummarizedUsagesDetails,
    };

    const response = await usageClient.requestSummarizedUsages(request);

    if (response.usageAggregation?.items) {
      for (const item of response.usageAggregation.items) {
        const tagValue = item.tags?.[`${tagNamespace}.${tagKey}`] || 'untagged';
        const cost = item.computedAmount || 0;

        costsByTagValue.set(
          tagValue,
          (costsByTagValue.get(tagValue) || 0) + cost
        );
      }
    }

    return costsByTagValue;
  } catch (error: any) {
    console.error(`Failed to get costs by tags: ${error.message}`);
    return costsByTagValue;
  }
}
