/**
 * Azure Budget Management
 *
 * Handles budget tracking and alert generation using Azure Consumption API.
 * Supports subscription-level and management group-level budgets.
 */

import { ConsumptionManagementClient } from '@azure/arm-consumption';
import { AzureClientConfig } from './config';
import { getSubscriptionCostBreakdown } from './cost';

export interface AzureBudget {
  budgetId: string;
  budgetName: string;
  subscriptionId: string;
  budgetAmount: number;
  spentAmount: number;
  currency: string;
  timeGrain: string; // 'Monthly', 'Quarterly', 'Annually'
  startDate: string;
  endDate: string;
  thresholds: number[]; // Alert thresholds in percentage
  category: string; // 'Cost', 'Usage'
}

export interface AzureBudgetAlert {
  budgetId: string;
  budgetName: string;
  subscriptionId: string;
  threshold: number;
  currentPercentage: number;
  budgetAmount: number;
  spentAmount: number;
  currency: string;
  status: 'approaching' | 'exceeded' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

/**
 * Get all budgets for a subscription
 */
export async function getBudgets(
  azureConfig: AzureClientConfig,
  subscriptionId?: string
): Promise<AzureBudget[]> {
  const subId = subscriptionId || azureConfig.subscriptionId;

  if (!subId) {
    throw new Error('Subscription ID is required');
  }

  const consumptionClient = new ConsumptionManagementClient(
    azureConfig.auth as any,
    subId
  );

  const budgets: AzureBudget[] = [];

  try {
    const scope = `/subscriptions/${subId}`;

    for await (const budget of consumptionClient.budgets.list(scope)) {
      // Get current spending for this budget
      const costData = await getSubscriptionCostBreakdown(azureConfig, subId);

      const budgetAmount = budget.amount || 0;
      const spentAmount = costData.thisMonth;

      // Extract thresholds from notifications
      const thresholds: number[] = [];
      if (budget.notifications) {
        for (const [, notification] of Object.entries(budget.notifications)) {
          if (notification.threshold) {
            thresholds.push(notification.threshold);
          }
        }
      }

      budgets.push({
        budgetId: budget.id || '',
        budgetName: budget.name || 'Unnamed Budget',
        subscriptionId: subId,
        budgetAmount,
        spentAmount,
        currency: costData.currency,
        timeGrain: budget.timeGrain || 'Monthly',
        startDate: budget.timePeriod?.startDate?.toISOString().split('T')[0] || '',
        endDate: budget.timePeriod?.endDate?.toISOString().split('T')[0] || '',
        thresholds: thresholds.sort((a, b) => a - b),
        category: budget.category || 'Cost',
      });
    }
  } catch (error: any) {
    console.error(`Failed to get budgets for subscription ${subId}:`, error.message);
  }

  return budgets;
}

/**
 * Get budget alerts for subscriptions
 */
export async function getBudgetAlerts(
  azureConfig: AzureClientConfig,
  subscriptionId?: string
): Promise<AzureBudgetAlert[]> {
  const budgets = await getBudgets(azureConfig, subscriptionId);
  const alerts: AzureBudgetAlert[] = [];

  for (const budget of budgets) {
    const percentUsed = (budget.spentAmount / budget.budgetAmount) * 100;

    // Check each threshold
    for (const threshold of budget.thresholds) {
      if (percentUsed >= threshold) {
        const status = getAlertStatus(percentUsed, threshold);
        const severity = getAlertSeverity(percentUsed, threshold);

        alerts.push({
          budgetId: budget.budgetId,
          budgetName: budget.budgetName,
          subscriptionId: budget.subscriptionId,
          threshold,
          currentPercentage: percentUsed,
          budgetAmount: budget.budgetAmount,
          spentAmount: budget.spentAmount,
          currency: budget.currency,
          status,
          severity,
          message: generateAlertMessage(budget, percentUsed, threshold),
        });
      }
    }
  }

  // Sort by severity (critical first)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}

/**
 * Get alert status based on percentage used
 */
function getAlertStatus(
  percentUsed: number,
  threshold: number
): 'approaching' | 'exceeded' | 'critical' {
  if (percentUsed >= 100) {
    return 'critical';
  } else if (percentUsed >= threshold) {
    return 'exceeded';
  } else {
    return 'approaching';
  }
}

/**
 * Get alert severity based on percentage used and threshold
 */
function getAlertSeverity(
  percentUsed: number,
  threshold: number
): 'low' | 'medium' | 'high' | 'critical' {
  const overagePercent = percentUsed - threshold;

  if (percentUsed >= 100) {
    return 'critical';
  } else if (overagePercent >= 20) {
    return 'high';
  } else if (overagePercent >= 10) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Generate alert message
 */
function generateAlertMessage(
  budget: AzureBudget,
  percentUsed: number,
  threshold: number
): string {
  const spent = budget.spentAmount.toFixed(2);
  const total = budget.budgetAmount.toFixed(2);
  const percent = percentUsed.toFixed(1);

  if (percentUsed >= 100) {
    return `CRITICAL: Budget "${budget.budgetName}" has been exceeded. Spent ${spent} ${budget.currency} of ${total} ${budget.currency} (${percent}%).`;
  } else if (percentUsed >= threshold) {
    return `WARNING: Budget "${budget.budgetName}" has exceeded ${threshold}% threshold. Spent ${spent} ${budget.currency} of ${total} ${budget.currency} (${percent}%).`;
  } else {
    return `INFO: Budget "${budget.budgetName}" is approaching ${threshold}% threshold. Spent ${spent} ${budget.currency} of ${total} ${budget.currency} (${percent}%).`;
  }
}

/**
 * Get budget utilization percentage
 */
export function getBudgetUtilization(budget: AzureBudget): number {
  if (budget.budgetAmount === 0) {
    return 0;
  }
  return (budget.spentAmount / budget.budgetAmount) * 100;
}

/**
 * Check if budget is at risk (> 80% used)
 */
export function isBudgetAtRisk(budget: AzureBudget): boolean {
  return getBudgetUtilization(budget) >= 80;
}

/**
 * Check if budget is exceeded (> 100% used)
 */
export function isBudgetExceeded(budget: AzureBudget): boolean {
  return getBudgetUtilization(budget) >= 100;
}
