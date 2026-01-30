import { BudgetServiceClient } from '@google-cloud/billing/build/src/v1';
import { GCPClientConfig } from './config';
import { BudgetInfo, BudgetAlert } from '../../types/providers';
import { showSpinner } from '../../logger';
import { getTotalCosts } from './cost';

/**
 * Get billing account name from project
 */
async function getBillingAccountName(gcpConfig: GCPClientConfig): Promise<string | null> {
  // Note: This requires billing.accounts.get permission
  // If not available, user must provide billingAccountId in config
  try {
    const { CloudBillingClient } = await import('@google-cloud/billing');
    const billing = new CloudBillingClient({
      auth: gcpConfig.auth as any,
    });

    const [billingInfo] = await billing.getProjectBillingInfo({
      name: `projects/${gcpConfig.projectId}`,
    });

    return billingInfo.billingAccountName || null;
  } catch (error) {
    console.warn(
      `Failed to get billing account: ${error.message}. ` +
        `To use budget features, provide billingAccountId in credentials.`
    );
    return null;
  }
}

/**
 * Get current spend for a budget period
 */
async function getCurrentSpend(
  gcpConfig: GCPClientConfig,
  budgetFilter: any
): Promise<number> {
  try {
    // Get costs for the current period
    const costs = await getTotalCosts(gcpConfig);

    // Determine which period to use based on budget filter
    const calendarPeriod = budgetFilter?.calendarPeriod;

    switch (calendarPeriod) {
      case 'MONTH':
        return costs.totals.thisMonth;
      case 'QUARTER':
        // Approximate: 3 months
        return costs.totals.thisMonth * 3;
      case 'YEAR':
        // Approximate: 12 months
        return costs.totals.thisMonth * 12;
      default:
        return costs.totals.thisMonth;
    }
  } catch (error) {
    console.warn(`Failed to get current spend: ${error.message}`);
    return 0;
  }
}

/**
 * Get GCP budgets using Cloud Billing Budgets API
 */
export async function getBudgets(
  gcpConfig: GCPClientConfig,
  billingAccountId?: string
): Promise<BudgetInfo[]> {
  showSpinner('Fetching GCP budgets');

  const budgetClient = new BudgetServiceClient({
    auth: gcpConfig.auth as any,
  });

  // Get billing account ID
  let accountId = billingAccountId;
  if (!accountId) {
    const billingAccountName = await getBillingAccountName(gcpConfig);
    if (!billingAccountName) {
      throw new Error(
        `Unable to determine billing account. Please provide billingAccountId in credentials:\n` +
          `{\n` +
          `  "projectId": "${gcpConfig.projectId}",\n` +
          `  "billingAccountId": "012345-ABCDEF-678901",\n` +
          `  ...\n` +
          `}`
      );
    }
    // Extract account ID from name (format: billingAccounts/012345-ABCDEF-678901)
    accountId = billingAccountName.split('/').pop() || '';
  }

  try {
    const parent = `billingAccounts/${accountId}`;
    const [budgets] = await budgetClient.listBudgets({ parent });

    const budgetInfos: BudgetInfo[] = [];

    for (const budget of budgets || []) {
      // Parse budget amount
      let budgetAmount = 0;
      if (budget.amount?.specifiedAmount) {
        budgetAmount = Number(budget.amount.specifiedAmount.units || 0);
      } else if (budget.amount?.lastPeriodAmount) {
        // Last period amount - would need historical data
        budgetAmount = 0; // Placeholder
      }

      // Get current spend for this budget
      const spentAmount = await getCurrentSpend(gcpConfig, budget.budgetFilter);

      // Extract threshold percentages
      const thresholds =
        budget.thresholdRules?.map((rule) => {
          return Number(rule.thresholdPercent || 0) * 100;
        }) || [];

      budgetInfos.push({
        budgetId: budget.name || '',
        budgetName: budget.displayName || 'Unnamed Budget',
        budgetAmount,
        spentAmount,
        currency: budget.amount?.specifiedAmount?.currencyCode || 'USD',
        period: budget.budgetFilter?.calendarPeriod || 'MONTH',
        thresholds,
        startDate: budget.budgetFilter?.customPeriod?.startDate
          ? new Date(
              budget.budgetFilter.customPeriod.startDate.year!,
              (budget.budgetFilter.customPeriod.startDate.month || 1) - 1,
              budget.budgetFilter.customPeriod.startDate.day || 1
            )
          : undefined,
        endDate: budget.budgetFilter?.customPeriod?.endDate
          ? new Date(
              budget.budgetFilter.customPeriod.endDate.year!,
              (budget.budgetFilter.customPeriod.endDate.month || 1) - 1,
              budget.budgetFilter.customPeriod.endDate.day || 1
            )
          : undefined,
      });
    }

    return budgetInfos;
  } catch (error) {
    throw new Error(
      `Failed to fetch GCP budgets: ${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Ensure Cloud Billing Budget API is enabled\n` +
        `2. Verify credentials have 'billing.budgets.list' permission\n` +
        `3. Check billing account ID is correct: ${accountId}\n` +
        `4. Ensure you have at least one budget configured`
    );
  }
}

/**
 * Calculate alert severity based on percentage used
 */
function getAlertSeverity(
  percentUsed: number,
  threshold: number
): 'low' | 'medium' | 'high' | 'critical' {
  const overagePercent = percentUsed - threshold;

  if (percentUsed >= 100) {
    return 'critical'; // Over budget
  } else if (overagePercent >= 20) {
    return 'high'; // 20%+ over threshold
  } else if (overagePercent >= 10) {
    return 'medium'; // 10-20% over threshold
  } else {
    return 'low'; // Just crossed threshold
  }
}

/**
 * Get alert status based on percentage
 */
function getAlertStatus(
  percentUsed: number,
  threshold: number
): 'warning' | 'alert' | 'critical' {
  if (percentUsed >= 100) {
    return 'critical';
  } else if (percentUsed >= threshold + 10) {
    return 'alert';
  } else {
    return 'warning';
  }
}

/**
 * Get budget alerts based on threshold breaches
 */
export async function getBudgetAlerts(
  gcpConfig: GCPClientConfig,
  billingAccountId?: string
): Promise<BudgetAlert[]> {
  showSpinner('Checking budget alerts');

  const budgets = await getBudgets(gcpConfig, billingAccountId);
  const alerts: BudgetAlert[] = [];

  for (const budget of budgets) {
    if (budget.budgetAmount === 0) {
      // Skip budgets with zero amount (e.g., last period amount not yet calculated)
      continue;
    }

    const percentUsed = (budget.spentAmount / budget.budgetAmount) * 100;

    // Check each threshold
    for (const threshold of budget.thresholds) {
      if (percentUsed >= threshold) {
        alerts.push({
          budgetId: budget.budgetId,
          budgetName: budget.budgetName,
          threshold,
          currentPercentage: percentUsed,
          budgetAmount: budget.budgetAmount,
          spentAmount: budget.spentAmount,
          remainingAmount: Math.max(0, budget.budgetAmount - budget.spentAmount),
          status: getAlertStatus(percentUsed, threshold),
          severity: getAlertSeverity(percentUsed, threshold),
          message: `Budget "${budget.budgetName}" has exceeded ${threshold}% threshold (currently at ${percentUsed.toFixed(1)}%)`,
          triggeredAt: new Date(),
        });
      }
    }
  }

  // Sort alerts by severity (critical first)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;

    // If same severity, sort by percentage used (highest first)
    return b.currentPercentage - a.currentPercentage;
  });

  return alerts;
}

/**
 * Get budget summary with alert counts
 */
export async function getBudgetSummary(
  gcpConfig: GCPClientConfig,
  billingAccountId?: string
): Promise<{
  totalBudgets: number;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  budgetsOverLimit: number;
  budgetsNearLimit: number; // Within 10% of limit
  totalBudgetAmount: number;
  totalSpent: number;
  averageUtilization: number; // Percentage
}> {
  const budgets = await getBudgets(gcpConfig, billingAccountId);
  const alerts = await getBudgetAlerts(gcpConfig, billingAccountId);

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
  const budgetsOverLimit = budgets.filter((b) => b.spentAmount > b.budgetAmount).length;
  const budgetsNearLimit = budgets.filter((b) => {
    const percentUsed = (b.spentAmount / b.budgetAmount) * 100;
    return percentUsed >= 90 && percentUsed < 100;
  }).length;

  const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const averageUtilization =
    totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0;

  return {
    totalBudgets: budgets.length,
    totalAlerts: alerts.length,
    criticalAlerts,
    warningAlerts: alerts.length - criticalAlerts,
    budgetsOverLimit,
    budgetsNearLimit,
    totalBudgetAmount,
    totalSpent,
    averageUtilization,
  };
}
