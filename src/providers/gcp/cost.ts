import { CloudBillingClient } from '@google-cloud/billing';
import { BigQuery } from '@google-cloud/bigquery';
import dayjs from 'dayjs';
import { GCPClientConfig } from './config';
import { showSpinner } from '../../logger';

export type RawCostByService = {
  [key: string]: {
    [date: string]: number;
  };
};

export interface CostQueryOptions {
  startDate?: Date;
  endDate?: Date;
  currency?: string; // Filter by specific currency
  maxResults?: number; // For pagination
  pageToken?: string; // For pagination
}

/**
 * Get billing account for the project
 */
async function getBillingAccountName(
  gcpConfig: GCPClientConfig
): Promise<string | null> {
  const billing = new CloudBillingClient({
    auth: gcpConfig.auth as any,
  });

  try {
    const [billingInfo] = await billing.getProjectBillingInfo({
      name: `projects/${gcpConfig.projectId}`,
    });

    return billingInfo.billingAccountName || null;
  } catch (error) {
    console.warn(`Failed to get billing account: ${error.message}`);
    return null;
  }
}

/**
 * Get raw cost data from BigQuery billing export
 *
 * NOTE: This requires BigQuery billing export to be enabled.
 * See: https://cloud.google.com/billing/docs/how-to/export-data-bigquery
 */
export async function getRawCostByService(
  gcpConfig: GCPClientConfig,
  billingDatasetId?: string,
  billingTableId?: string,
  options?: CostQueryOptions
): Promise<RawCostByService> {
  showSpinner('Getting GCP billing data');

  // Default billing export table names
  const datasetId = billingDatasetId || 'billing_export';
  const tableId = billingTableId || 'gcp_billing_export';

  const bigquery = new BigQuery({
    projectId: gcpConfig.projectId,
    auth: gcpConfig.auth as any,
  });

  // Use provided dates or default to last 65 days
  const endDate = options?.endDate ? dayjs(options.endDate) : dayjs().subtract(1, 'day');
  const startDate = options?.startDate ? dayjs(options.startDate) : endDate.subtract(65, 'day');

  // Build WHERE clause
  const whereConditions = [
    `DATE(usage_start_time) BETWEEN '${startDate.format('YYYY-MM-DD')}' AND '${endDate.format('YYYY-MM-DD')}'`,
    'cost > 0',
  ];

  // Add currency filter if specified
  if (options?.currency) {
    whereConditions.push(`currency = '${options.currency}'`);
  }

  // Query billing data from BigQuery export
  // This assumes standard billing export schema
  const query = `
    SELECT
      service.description AS service_name,
      DATE(usage_start_time) AS usage_date,
      SUM(cost) AS total_cost,
      currency
    FROM
      \`${gcpConfig.projectId}.${datasetId}.${tableId}\`
    WHERE
      ${whereConditions.join(' AND ')}
    GROUP BY
      service_name,
      usage_date,
      currency
    ORDER BY
      usage_date DESC,
      service_name
    ${options?.maxResults ? `LIMIT ${options.maxResults}` : ''}
  `;

  try {
    const queryOptions: any = {
      query,
      location: 'US', // BigQuery billing export is typically in US location
    };

    // Add pagination support
    if (options?.maxResults) {
      queryOptions.maxResults = options.maxResults;
    }
    if (options?.pageToken) {
      queryOptions.pageToken = options.pageToken;
    }

    const [rows] = await bigquery.query(queryOptions);

    // First pass: collect all currencies
    const currencies = new Set<string>();
    for (const row of rows) {
      const currency = row.currency || 'USD';
      currencies.add(currency);
    }

    const multiCurrency = currencies.size > 1;

    // Warn if multiple currencies detected
    if (multiCurrency) {
      console.warn(
        `⚠️  Multiple currencies detected in billing data: ${Array.from(currencies).join(', ')}. ` +
        `Costs are grouped by currency. Consider using --currency filter to analyze a specific currency.`
      );
    }

    // Second pass: aggregate costs
    const costByService: RawCostByService = {};

    for (const row of rows) {
      const serviceName = row.service_name || 'Unknown Service';
      const usageDate = dayjs(row.usage_date).format('YYYY-MM-DD');
      const cost = parseFloat(row.total_cost) || 0;
      const currency = row.currency || 'USD';

      // Append currency to service name if multiple currencies exist
      const serviceKey = multiCurrency ? `${serviceName} (${currency})` : serviceName;

      if (!costByService[serviceKey]) {
        costByService[serviceKey] = {};
      }

      costByService[serviceKey][usageDate] = cost;
    }

    return costByService;
  } catch (error) {
    // If BigQuery billing export is not set up, provide helpful error
    if (error.message?.includes('Not found: Table') || error.message?.includes('Not found: Dataset')) {
      throw new Error(
        `BigQuery billing export not found. Please enable billing export to BigQuery:

        1. Go to: https://console.cloud.google.com/billing
        2. Select your billing account
        3. Go to "Billing export"
        4. Enable "BigQuery export"
        5. Set dataset ID to: ${datasetId} (or provide custom via --billing-dataset)

        Note: It may take up to 24 hours for billing data to appear after enabling export.

        Original error: ${error.message}`
      );
    }

    throw new Error(`Failed to get GCP billing data: ${error.message}`);
  }
}

/**
 * Alternative method: Get cost data using Cloud Billing API (less detailed)
 * This provides project-level billing info but not detailed cost breakdowns
 */
export async function getProjectBillingInfo(gcpConfig: GCPClientConfig): Promise<{
  billingAccountName: string | null;
  billingEnabled: boolean;
}> {
  const billing = new CloudBillingClient({
    auth: gcpConfig.auth as any,
  });

  try {
    const [billingInfo] = await billing.getProjectBillingInfo({
      name: `projects/${gcpConfig.projectId}`,
    });

    return {
      billingAccountName: billingInfo.billingAccountName || null,
      billingEnabled: billingInfo.billingEnabled || false,
    };
  } catch (error) {
    throw new Error(`Failed to get project billing info: ${error.message}`);
  }
}

export type TotalCosts = {
  totals: {
    lastMonth: number;
    thisMonth: number;
    last7Days: number;
    yesterday: number;
  };
  totalsByService: {
    lastMonth: { [key: string]: number };
    thisMonth: { [key: string]: number };
    last7Days: { [key: string]: number };
    yesterday: { [key: string]: number };
  };
};

function calculateServiceTotals(rawCostByService: RawCostByService): TotalCosts {
  const totals = {
    lastMonth: 0,
    thisMonth: 0,
    last7Days: 0,
    yesterday: 0,
  };

  const totalsByService = {
    lastMonth: {},
    thisMonth: {},
    last7Days: {},
    yesterday: {},
  };

  const startOfLastMonth = dayjs().subtract(1, 'month').startOf('month');
  const startOfThisMonth = dayjs().startOf('month');
  const startOfLast7Days = dayjs().subtract(7, 'day');
  const startOfYesterday = dayjs().subtract(1, 'day');

  for (const service of Object.keys(rawCostByService)) {
    const servicePrices = rawCostByService[service];

    let lastMonthServiceTotal = 0;
    let thisMonthServiceTotal = 0;
    let last7DaysServiceTotal = 0;
    let yesterdayServiceTotal = 0;

    for (const date of Object.keys(servicePrices)) {
      const price = servicePrices[date];
      const dateObj = dayjs(date);

      if (dateObj.isSame(startOfLastMonth, 'month')) {
        lastMonthServiceTotal += price;
      }

      if (dateObj.isSame(startOfThisMonth, 'month')) {
        thisMonthServiceTotal += price;
      }

      if (dateObj.isSame(startOfLast7Days, 'week') && !dateObj.isSame(startOfYesterday, 'day')) {
        last7DaysServiceTotal += price;
      }

      if (dateObj.isSame(startOfYesterday, 'day')) {
        yesterdayServiceTotal += price;
      }
    }

    totalsByService.lastMonth[service] = lastMonthServiceTotal;
    totalsByService.thisMonth[service] = thisMonthServiceTotal;
    totalsByService.last7Days[service] = last7DaysServiceTotal;
    totalsByService.yesterday[service] = yesterdayServiceTotal;

    totals.lastMonth += lastMonthServiceTotal;
    totals.thisMonth += thisMonthServiceTotal;
    totals.last7Days += last7DaysServiceTotal;
    totals.yesterday += yesterdayServiceTotal;
  }

  return {
    totals,
    totalsByService,
  };
}

export async function getTotalCosts(
  gcpConfig: GCPClientConfig,
  billingDatasetId?: string,
  billingTableId?: string,
  options?: CostQueryOptions
): Promise<TotalCosts> {
  const rawCosts = await getRawCostByService(gcpConfig, billingDatasetId, billingTableId, options);
  const totals = calculateServiceTotals(rawCosts);

  return totals;
}

/**
 * Get detailed cost breakdown with additional metadata
 */
export async function getDetailedCostBreakdown(
  gcpConfig: GCPClientConfig,
  billingDatasetId?: string,
  billingTableId?: string,
  options?: CostQueryOptions
): Promise<{
  costByService: RawCostByService;
  metadata: {
    totalCost: number;
    serviceCount: number;
    dateRange: { start: string; end: string };
    currencies: string[];
    rowCount: number;
  };
}> {
  const costByService = await getRawCostByService(
    gcpConfig,
    billingDatasetId,
    billingTableId,
    options
  );

  // Calculate metadata
  let totalCost = 0;
  const currencies = new Set<string>();
  let rowCount = 0;

  for (const service of Object.keys(costByService)) {
    // Extract currency from service name if present
    const currencyMatch = service.match(/\(([A-Z]{3})\)$/);
    if (currencyMatch) {
      currencies.add(currencyMatch[1]);
    }

    for (const cost of Object.values(costByService[service])) {
      totalCost += cost;
      rowCount++;
    }
  }

  const endDate = options?.endDate ? dayjs(options.endDate) : dayjs().subtract(1, 'day');
  const startDate = options?.startDate ? dayjs(options.startDate) : endDate.subtract(65, 'day');

  return {
    costByService,
    metadata: {
      totalCost,
      serviceCount: Object.keys(costByService).length,
      dateRange: {
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD'),
      },
      currencies: Array.from(currencies),
      rowCount,
    },
  };
}
