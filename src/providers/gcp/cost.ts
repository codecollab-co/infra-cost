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
  billingTableId?: string
): Promise<RawCostByService> {
  showSpinner('Getting GCP billing data');

  // Default billing export table names
  const datasetId = billingDatasetId || 'billing_export';
  const tableId = billingTableId || 'gcp_billing_export';

  const bigquery = new BigQuery({
    projectId: gcpConfig.projectId,
    auth: gcpConfig.auth as any,
  });

  const endDate = dayjs().subtract(1, 'day');
  const startDate = endDate.subtract(65, 'day');

  // Query billing data from BigQuery export
  // This assumes standard billing export schema
  const query = `
    SELECT
      service.description AS service_name,
      DATE(usage_start_time) AS usage_date,
      SUM(cost) AS total_cost
    FROM
      \`${gcpConfig.projectId}.${datasetId}.${tableId}\`
    WHERE
      DATE(usage_start_time) BETWEEN '${startDate.format('YYYY-MM-DD')}' AND '${endDate.format('YYYY-MM-DD')}'
      AND cost > 0
    GROUP BY
      service_name,
      usage_date
    ORDER BY
      usage_date DESC,
      service_name
  `;

  try {
    const [rows] = await bigquery.query({
      query,
      location: 'US', // BigQuery billing export is typically in US location
    });

    const costByService: RawCostByService = {};

    for (const row of rows) {
      const serviceName = row.service_name || 'Unknown Service';
      const usageDate = dayjs(row.usage_date).format('YYYY-MM-DD');
      const cost = parseFloat(row.total_cost) || 0;

      if (!costByService[serviceName]) {
        costByService[serviceName] = {};
      }

      costByService[serviceName][usageDate] = cost;
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
  billingTableId?: string
): Promise<TotalCosts> {
  const rawCosts = await getRawCostByService(gcpConfig, billingDatasetId, billingTableId);
  const totals = calculateServiceTotals(rawCosts);

  return totals;
}
