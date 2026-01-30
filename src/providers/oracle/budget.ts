/**
 * Oracle Cloud Budget Management
 *
 * Handles budget tracking and alert generation using OCI Budgets API.
 * Supports compartment-level and tenancy-level budgets.
 */

import * as budget from 'oci-budget';
import { OracleClientConfig } from './config';
import { getCompartmentCostBreakdown } from './cost';

export interface OracleBudget {
  budgetId: string;
  budgetName: string;
  compartmentId: string;
  budgetAmount: number;
  spentAmount: number;
  currency: string;
  timeGrain: string; // 'MONTHLY', 'QUARTERLY', 'ANNUALLY'
  startDate: string;
  endDate?: string;
  thresholds: number[]; // Alert thresholds in percentage
  targetType: string; // 'COMPARTMENT', 'TAG'
  targetCompartmentIds?: string[];
}

export interface OracleBudgetAlert {
  budgetId: string;
  budgetName: string;
  compartmentId: string;
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
 * Get all budgets for a compartment
 */
export async function getBudgets(
  oracleConfig: OracleClientConfig,
  compartmentId?: string
): Promise<OracleBudget[]> {
  const compartId = compartmentId || oracleConfig.compartmentId || oracleConfig.tenancyId;

  if (!compartId) {
    throw new Error('Compartment ID is required');
  }

  const budgetClient = new budget.BudgetClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  const budgets: OracleBudget[] = [];

  try {
    const listRequest: budget.requests.ListBudgetsRequest = {
      compartmentId: compartId,
      targetType: budget.requests.ListBudgetsRequest.TargetType.Compartment,
    };

    const response = await budgetClient.listBudgets(listRequest);

    if (response.items) {
      // Process each budget in parallel to get current spending
      const budgetPromises = response.items.map(async (budgetItem) => {
        try {
          // Get current spending for this budget's target compartments
          const targetCompartmentIds = budgetItem.targets || [compartId];
          let totalSpent = 0;

          // Get spending for each target compartment
          for (const targetId of targetCompartmentIds) {
            try {
              const costData = await getCompartmentCostBreakdown(oracleConfig, targetId);
              totalSpent += costData.thisMonth;
            } catch (error: any) {
              console.warn(`Failed to get costs for compartment ${targetId}: ${error.message}`);
            }
          }

          // Extract thresholds from alert rules
          const thresholds: number[] = [];
          if (budgetItem.alertRuleCount && budgetItem.alertRuleCount > 0) {
            try {
              const alertRulesRequest: budget.requests.ListAlertRulesRequest = {
                budgetId: budgetItem.id!,
              };

              const alertRulesResponse = await budgetClient.listAlertRules(alertRulesRequest);

              if (alertRulesResponse.items) {
                for (const rule of alertRulesResponse.items) {
                  if (rule.threshold) {
                    thresholds.push(rule.threshold);
                  }
                }
              }
            } catch (error: any) {
              console.warn(`Failed to get alert rules for budget ${budgetItem.displayName}: ${error.message}`);
            }
          }

          return {
            budgetId: budgetItem.id || '',
            budgetName: budgetItem.displayName || 'Unnamed Budget',
            compartmentId: budgetItem.compartmentId || compartId,
            budgetAmount: budgetItem.amount || 0,
            spentAmount: totalSpent,
            currency: 'USD', // OCI budgets are typically in USD
            timeGrain: budgetItem.resetPeriod || 'MONTHLY',
            startDate: budgetItem.timeCreated
              ? budgetItem.timeCreated.toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0],
            endDate: budgetItem.timeExpend
              ? budgetItem.timeExpend.toISOString().split('T')[0]
              : undefined,
            thresholds: thresholds.sort((a, b) => a - b),
            targetType: budgetItem.targetType || 'COMPARTMENT',
            targetCompartmentIds: budgetItem.targets,
          };
        } catch (error: any) {
          console.error(`Failed to process budget ${budgetItem.displayName}: ${error.message}`);
          return null;
        }
      });

      const budgetResults = await Promise.all(budgetPromises);
      budgets.push(...budgetResults.filter((b): b is OracleBudget => b !== null));
    }
  } catch (error: any) {
    console.error(`Failed to get budgets for compartment ${compartId}:`, error.message);
  }

  return budgets;
}

/**
 * Get budget alerts for compartments
 */
export async function getBudgetAlerts(
  oracleConfig: OracleClientConfig,
  compartmentId?: string
): Promise<OracleBudgetAlert[]> {
  const budgets = await getBudgets(oracleConfig, compartmentId);
  const alerts: OracleBudgetAlert[] = [];

  for (const budgetItem of budgets) {
    const percentUsed = (budgetItem.spentAmount / budgetItem.budgetAmount) * 100;

    // Check each threshold
    for (const threshold of budgetItem.thresholds) {
      if (percentUsed >= threshold) {
        const status = getAlertStatus(percentUsed, threshold);
        const severity = getAlertSeverity(percentUsed, threshold);

        alerts.push({
          budgetId: budgetItem.budgetId,
          budgetName: budgetItem.budgetName,
          compartmentId: budgetItem.compartmentId,
          threshold,
          currentPercentage: percentUsed,
          budgetAmount: budgetItem.budgetAmount,
          spentAmount: budgetItem.spentAmount,
          currency: budgetItem.currency,
          status,
          severity,
          message: generateAlertMessage(budgetItem, percentUsed, threshold),
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
 */
export async function createBudget(
  oracleConfig: OracleClientConfig,
  budgetDetails: {
    displayName: string;
    compartmentId: string;
    amount: number;
    resetPeriod: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
    targetCompartmentIds?: string[];
    alertThresholds?: number[];
  }
): Promise<string> {
  const budgetClient = new budget.BudgetClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  try {
    const createBudgetDetails: budget.models.CreateBudgetDetails = {
      compartmentId: budgetDetails.compartmentId,
      displayName: budgetDetails.displayName,
      amount: budgetDetails.amount,
      resetPeriod: budgetDetails.resetPeriod,
      targetType: budget.models.CreateBudgetDetails.TargetType.Compartment,
      targets: budgetDetails.targetCompartmentIds || [budgetDetails.compartmentId],
    };

    const createRequest: budget.requests.CreateBudgetRequest = {
      createBudgetDetails: createBudgetDetails,
    };

    const response = await budgetClient.createBudget(createRequest);

    if (!response.budget?.id) {
      throw new Error('Failed to create budget: no budget ID returned');
    }

    const budgetId = response.budget.id;

    // Create alert rules if thresholds are provided
    if (budgetDetails.alertThresholds && budgetDetails.alertThresholds.length > 0) {
      for (const threshold of budgetDetails.alertThresholds) {
        try {
          await createAlertRule(budgetClient, budgetId, threshold);
        } catch (error: any) {
          console.warn(`Failed to create alert rule for threshold ${threshold}%: ${error.message}`);
        }
      }
    }

    return budgetId;
  } catch (error: any) {
    throw new Error(`Failed to create budget: ${error.message}`);
  }
}

/**
 * Create an alert rule for a budget
 */
async function createAlertRule(
  budgetClient: budget.BudgetClient,
  budgetId: string,
  threshold: number
): Promise<void> {
  const createAlertRuleDetails: budget.models.CreateAlertRuleDetails = {
    displayName: `Alert at ${threshold}%`,
    type: budget.models.CreateAlertRuleDetails.Type.Actual,
    threshold: threshold,
    thresholdType: budget.models.CreateAlertRuleDetails.ThresholdType.Percentage,
    recipients: '', // Email recipients should be configured
  };

  const createRequest: budget.requests.CreateAlertRuleRequest = {
    budgetId: budgetId,
    createAlertRuleDetails: createAlertRuleDetails,
  };

  await budgetClient.createAlertRule(createRequest);
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
  budgetItem: OracleBudget,
  percentUsed: number,
  threshold: number
): string {
  const spent = budgetItem.spentAmount.toFixed(2);
  const total = budgetItem.budgetAmount.toFixed(2);
  const percent = percentUsed.toFixed(1);

  if (percentUsed >= 100) {
    return `CRITICAL: Budget "${budgetItem.budgetName}" has been exceeded. Spent ${spent} ${budgetItem.currency} of ${total} ${budgetItem.currency} (${percent}%).`;
  } else if (percentUsed >= threshold) {
    return `WARNING: Budget "${budgetItem.budgetName}" has exceeded ${threshold}% threshold. Spent ${spent} ${budgetItem.currency} of ${total} ${budgetItem.currency} (${percent}%).`;
  } else {
    return `INFO: Budget "${budgetItem.budgetName}" is approaching ${threshold}% threshold. Spent ${spent} ${budgetItem.currency} of ${total} ${budgetItem.currency} (${percent}%).`;
  }
}

/**
 * Get budget utilization percentage
 */
export function getBudgetUtilization(budgetItem: OracleBudget): number {
  if (budgetItem.budgetAmount === 0) {
    return 0;
  }
  return (budgetItem.spentAmount / budgetItem.budgetAmount) * 100;
}

/**
 * Check if budget is at risk (> 80% used)
 */
export function isBudgetAtRisk(budgetItem: OracleBudget): boolean {
  return getBudgetUtilization(budgetItem) >= 80;
}

/**
 * Check if budget is exceeded (> 100% used)
 */
export function isBudgetExceeded(budgetItem: OracleBudget): boolean {
  return getBudgetUtilization(budgetItem) >= 100;
}

/**
 * Delete a budget
 */
export async function deleteBudget(
  oracleConfig: OracleClientConfig,
  budgetId: string
): Promise<void> {
  const budgetClient = new budget.BudgetClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  try {
    const deleteRequest: budget.requests.DeleteBudgetRequest = {
      budgetId: budgetId,
    };

    await budgetClient.deleteBudget(deleteRequest);
  } catch (error: any) {
    throw new Error(`Failed to delete budget: ${error.message}`);
  }
}
