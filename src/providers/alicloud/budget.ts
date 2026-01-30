/**
 * Alibaba Cloud Budget Management
 *
 * Handles budget tracking and alert generation using BSS Budget API.
 * Supports account-level budgets and threshold-based alerts.
 */

import { AlibabaCloudClientConfig, getBSSEndpoint } from './config';
import { getAccountCostBreakdown } from './cost';

export interface AlibabaCloudBudget {
  budgetId: string;
  budgetName: string;
  accountId: string;
  budgetAmount: number;
  spentAmount: number;
  currency: string;
  budgetType: string; // 'COST' | 'USAGE'
  timeUnit: string; // 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  startDate: string;
  endDate: string;
  thresholds: number[]; // Alert thresholds in percentage
  status: string;
}

export interface AlibabaCloudBudgetAlert {
  budgetId: string;
  budgetName: string;
  accountId: string;
  threshold: number;
  currentPercentage: number;
  budgetAmount: number;
  spentAmount: number;
  currency: string;
  status: 'approaching' | 'exceeded' | 'critical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  remainingAmount: number;
  daysRemaining?: number;
}

/**
 * Get all budgets for an account
 * Uses BSS OpenAPI QueryBudget
 */
export async function getBudgets(
  aliConfig: AlibabaCloudClientConfig,
  accountId?: string
): Promise<AlibabaCloudBudget[]> {
  const acctId = accountId || aliConfig.accountId || 'default';

  try {
    // This is a placeholder implementation
    // Real implementation would use @alicloud/bssopenapi20171214 SDK:
    //
    // import BssOpenApi from '@alicloud/bssopenapi20171214';
    // const client = new BssOpenApi({
    //   accessKeyId: aliConfig.accessKeyId,
    //   accessKeySecret: aliConfig.accessKeySecret,
    //   endpoint: getBSSEndpoint(aliConfig.regionId)
    // });
    //
    // const request = new BssOpenApi.QueryBudgetRequest({
    //   budgetType: 'COST'
    // });
    //
    // const response = await client.queryBudget(request);
    // return processBudgets(response.body.data.budgetList);

    console.warn('Budget retrieval pending - install @alicloud/bssopenapi20171214');

    // Get current spending to populate budget data
    const costData = await getAccountCostBreakdown(aliConfig, acctId);

    // Return empty array for now
    return [];
  } catch (error: any) {
    console.error(`Failed to get budgets for account ${acctId}:`, error.message);
    return [];
  }
}

/**
 * Get budget alerts for accounts
 */
export async function getBudgetAlerts(
  aliConfig: AlibabaCloudClientConfig,
  accountId?: string
): Promise<AlibabaCloudBudgetAlert[]> {
  const budgets = await getBudgets(aliConfig, accountId);
  const alerts: AlibabaCloudBudgetAlert[] = [];

  for (const budget of budgets) {
    const percentUsed = (budget.spentAmount / budget.budgetAmount) * 100;

    // Check each threshold
    for (const threshold of budget.thresholds) {
      if (percentUsed >= threshold) {
        const status = getAlertStatus(percentUsed, threshold);
        const severity = getAlertSeverity(percentUsed, threshold);
        const remainingAmount = budget.budgetAmount - budget.spentAmount;

        alerts.push({
          budgetId: budget.budgetId,
          budgetName: budget.budgetName,
          accountId: budget.accountId,
          threshold,
          currentPercentage: percentUsed,
          budgetAmount: budget.budgetAmount,
          spentAmount: budget.spentAmount,
          currency: budget.currency,
          status,
          severity,
          message: generateAlertMessage(budget, percentUsed, threshold),
          remainingAmount: Math.max(0, remainingAmount),
          daysRemaining: calculateDaysRemaining(budget),
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
 * Create a new budget
 * Uses BSS OpenAPI CreateBudget
 */
export async function createBudget(
  aliConfig: AlibabaCloudClientConfig,
  budgetConfig: {
    budgetName: string;
    budgetAmount: number;
    timeUnit: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
    thresholds?: number[];
    startDate?: string;
    endDate?: string;
  }
): Promise<AlibabaCloudBudget | null> {
  try {
    // Real implementation would use BSS CreateBudget API
    console.warn('Budget creation pending - install @alicloud/bssopenapi20171214');
    return null;
  } catch (error: any) {
    console.error('Failed to create budget:', error.message);
    return null;
  }
}

/**
 * Update an existing budget
 */
export async function updateBudget(
  aliConfig: AlibabaCloudClientConfig,
  budgetId: string,
  updates: Partial<{
    budgetAmount: number;
    thresholds: number[];
    endDate: string;
  }>
): Promise<boolean> {
  try {
    // Real implementation would use BSS UpdateBudget API
    console.warn('Budget update pending - install @alicloud/bssopenapi20171214');
    return false;
  } catch (error: any) {
    console.error(`Failed to update budget ${budgetId}:`, error.message);
    return false;
  }
}

/**
 * Delete a budget
 */
export async function deleteBudget(
  aliConfig: AlibabaCloudClientConfig,
  budgetId: string
): Promise<boolean> {
  try {
    // Real implementation would use BSS DeleteBudget API
    console.warn('Budget deletion pending - install @alicloud/bssopenapi20171214');
    return false;
  } catch (error: any) {
    console.error(`Failed to delete budget ${budgetId}:`, error.message);
    return false;
  }
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
  } else if (percentUsed >= threshold + 10) {
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
  if (percentUsed >= 100) {
    return 'critical';
  } else if (percentUsed >= threshold + 20) {
    return 'high';
  } else if (percentUsed >= threshold + 10) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Generate alert message
 */
function generateAlertMessage(
  budget: AlibabaCloudBudget,
  percentUsed: number,
  threshold: number
): string {
  const spent = budget.spentAmount.toFixed(2);
  const total = budget.budgetAmount.toFixed(2);
  const percent = percentUsed.toFixed(1);
  const remaining = (budget.budgetAmount - budget.spentAmount).toFixed(2);

  if (percentUsed >= 100) {
    return `CRITICAL: Budget "${budget.budgetName}" has been exceeded. Spent ${spent} ${budget.currency} of ${total} ${budget.currency} (${percent}%).`;
  } else if (percentUsed >= threshold + 10) {
    return `WARNING: Budget "${budget.budgetName}" has significantly exceeded ${threshold}% threshold. Spent ${spent} ${budget.currency} of ${total} ${budget.currency} (${percent}%). Remaining: ${remaining} ${budget.currency}.`;
  } else if (percentUsed >= threshold) {
    return `ALERT: Budget "${budget.budgetName}" has reached ${threshold}% threshold. Spent ${spent} ${budget.currency} of ${total} ${budget.currency} (${percent}%). Remaining: ${remaining} ${budget.currency}.`;
  } else {
    return `INFO: Budget "${budget.budgetName}" is approaching ${threshold}% threshold. Spent ${spent} ${budget.currency} of ${total} ${budget.currency} (${percent}%).`;
  }
}

/**
 * Calculate days remaining in budget period
 */
function calculateDaysRemaining(budget: AlibabaCloudBudget): number {
  try {
    const endDate = new Date(budget.endDate);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch (error) {
    return 0;
  }
}

/**
 * Get budget utilization percentage
 */
export function getBudgetUtilization(budget: AlibabaCloudBudget): number {
  if (budget.budgetAmount === 0) {
    return 0;
  }
  return (budget.spentAmount / budget.budgetAmount) * 100;
}

/**
 * Check if budget is at risk (> 80% used)
 */
export function isBudgetAtRisk(budget: AlibabaCloudBudget): boolean {
  return getBudgetUtilization(budget) >= 80;
}

/**
 * Check if budget is exceeded (> 100% used)
 */
export function isBudgetExceeded(budget: AlibabaCloudBudget): boolean {
  return getBudgetUtilization(budget) >= 100;
}

/**
 * Get budget forecast (estimate end-of-period spend)
 */
export function getForecastedSpend(budget: AlibabaCloudBudget): number {
  try {
    const startDate = new Date(budget.startDate);
    const endDate = new Date(budget.endDate);
    const now = new Date();

    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    if (elapsedDays <= 0) return 0;

    const dailyRate = budget.spentAmount / elapsedDays;
    const forecastedTotal = dailyRate * totalDays;

    return Math.max(budget.spentAmount, forecastedTotal);
  } catch (error) {
    return budget.spentAmount;
  }
}
