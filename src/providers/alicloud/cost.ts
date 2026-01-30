/**
 * Alibaba Cloud Cost Management
 *
 * Handles cost data retrieval from BSS (Business Support System) OpenAPI.
 * Supports billing data queries, cost analysis, and spending trends.
 */

import { AlibabaCloudClientConfig, getBSSEndpoint } from './config';

export interface AlibabaCloudCostData {
  accountId: string;
  thisMonth: number;
  lastMonth: number;
  last7Days: number;
  yesterday: number;
  currency: string;
  breakdown?: AlibabaCloudCostByService[];
}

export interface AlibabaCloudCostByService {
  productCode: string;
  productName: string;
  cost: number;
  currency: string;
  billingDate?: string;
}

export interface AlibabaCloudDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/**
 * Get cost breakdown for Alibaba Cloud account
 * Uses BSS OpenAPI QueryBill or QueryAccountBill
 */
export async function getAccountCostBreakdown(
  aliConfig: AlibabaCloudClientConfig,
  accountId?: string,
  dateRange?: AlibabaCloudDateRange
): Promise<AlibabaCloudCostData> {
  const acctId = accountId || aliConfig.accountId || 'default';

  try {
    // Get costs for different time periods in parallel
    const [thisMonth, lastMonth, last7Days, yesterday] = await Promise.all([
      queryCosts(aliConfig, acctId, getCurrentMonthRange()),
      queryCosts(aliConfig, acctId, getLastMonthRange()),
      queryCosts(aliConfig, acctId, getLast7DaysRange()),
      queryCosts(aliConfig, acctId, getYesterdayRange()),
    ]);

    return {
      accountId: acctId,
      thisMonth: thisMonth.totalCost,
      lastMonth: lastMonth.totalCost,
      last7Days: last7Days.totalCost,
      yesterday: yesterday.totalCost,
      currency: thisMonth.currency,
      breakdown: thisMonth.breakdown,
    };
  } catch (error: any) {
    console.error(`Failed to get cost breakdown for account ${acctId}:`, error.message);
    return {
      accountId: acctId,
      thisMonth: 0,
      lastMonth: 0,
      last7Days: 0,
      yesterday: 0,
      currency: 'CNY',
      breakdown: [],
    };
  }
}

/**
 * Query BSS OpenAPI for cost data
 * In production, this would use @alicloud/bssopenapi20171214 SDK
 */
async function queryCosts(
  aliConfig: AlibabaCloudClientConfig,
  accountId: string,
  dateRange: AlibabaCloudDateRange
): Promise<{ totalCost: number; currency: string; breakdown: AlibabaCloudCostByService[] }> {
  try {
    // This is a placeholder implementation
    // Real implementation would use BSS OpenAPI client:
    //
    // import BssOpenApi from '@alicloud/bssopenapi20171214';
    // const client = new BssOpenApi({
    //   accessKeyId: aliConfig.accessKeyId,
    //   accessKeySecret: aliConfig.accessKeySecret,
    //   endpoint: getBSSEndpoint(aliConfig.regionId)
    // });
    //
    // const request = new BssOpenApi.QueryBillRequest({
    //   billingCycle: formatBillingCycle(dateRange),
    //   productCode: '', // Empty for all products
    //   granularity: 'DAILY'
    // });
    //
    // const response = await client.queryBill(request);

    // For now, return mock structure
    console.warn('BSS OpenAPI integration pending - install @alicloud/bssopenapi20171214');

    return {
      totalCost: 0,
      currency: 'CNY', // Default currency for Alibaba Cloud
      breakdown: [],
    };
  } catch (error: any) {
    console.error(`Failed to query costs for date range ${dateRange.startDate} to ${dateRange.endDate}:`, error.message);
    return {
      totalCost: 0,
      currency: 'CNY',
      breakdown: [],
    };
  }
}

/**
 * Get raw cost data by service (for detailed analysis)
 */
export async function getRawCostByService(
  aliConfig: AlibabaCloudClientConfig,
  accountId?: string,
  dateRange?: AlibabaCloudDateRange
): Promise<{ [serviceName: string]: { [date: string]: number } }> {
  const acctId = accountId || aliConfig.accountId || 'default';
  const range = dateRange || getLastMonthRange();

  try {
    // Would use BSS QueryInstanceBill for detailed per-instance costs
    // Returns format: { "ECS": { "2024-01-01": 100, "2024-01-02": 120 }, ... }

    console.warn('Raw cost data retrieval pending - install @alicloud/bssopenapi20171214');
    return {};
  } catch (error: any) {
    console.error(`Failed to get raw cost data:`, error.message);
    return {};
  }
}

/**
 * Get cost by product (ECS, OSS, RDS, etc.)
 */
export async function getCostByProduct(
  aliConfig: AlibabaCloudClientConfig,
  productCode: string,
  dateRange?: AlibabaCloudDateRange
): Promise<number> {
  const range = dateRange || getCurrentMonthRange();

  try {
    // Would use BSS QueryBill with specific productCode filter
    // Product codes: ecs, oss, rds, cs (Container Service), etc.

    console.warn('Product-specific cost query pending - install @alicloud/bssopenapi20171214');
    return 0;
  } catch (error: any) {
    console.error(`Failed to get cost for product ${productCode}:`, error.message);
    return 0;
  }
}

/**
 * Aggregate costs from multiple accounts
 */
export function aggregateCosts(costs: AlibabaCloudCostData[]): {
  totalThisMonth: number;
  totalLastMonth: number;
  totalLast7Days: number;
  totalYesterday: number;
  currency: string;
  totalsByService: Record<string, number>;
} {
  let totalThisMonth = 0;
  let totalLastMonth = 0;
  let totalLast7Days = 0;
  let totalYesterday = 0;
  const currency = costs[0]?.currency || 'CNY';
  const totalsByService: Record<string, number> = {};

  for (const cost of costs) {
    totalThisMonth += cost.thisMonth;
    totalLastMonth += cost.lastMonth;
    totalLast7Days += cost.last7Days;
    totalYesterday += cost.yesterday;

    // Aggregate by service/product
    if (cost.breakdown) {
      for (const service of cost.breakdown) {
        const serviceName = service.productName || service.productCode;
        totalsByService[serviceName] =
          (totalsByService[serviceName] || 0) + service.cost;
      }
    }
  }

  return {
    totalThisMonth,
    totalLastMonth,
    totalLast7Days,
    totalYesterday,
    currency,
    totalsByService,
  };
}

/**
 * Get current month date range
 */
function getCurrentMonthRange(): AlibabaCloudDateRange {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date();

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Get last month date range
 */
function getLastMonthRange(): AlibabaCloudDateRange {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Get last 7 days date range
 */
function getLast7DaysRange(): AlibabaCloudDateRange {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 7);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
  };
}

/**
 * Get yesterday date range
 */
function getYesterdayRange(): AlibabaCloudDateRange {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return {
    startDate: yesterday.toISOString().split('T')[0],
    endDate: yesterday.toISOString().split('T')[0],
  };
}

/**
 * Format billing cycle for BSS API (YYYY-MM format)
 */
export function formatBillingCycle(dateRange: AlibabaCloudDateRange): string {
  const startDate = new Date(dateRange.startDate);
  const year = startDate.getFullYear();
  const month = String(startDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
