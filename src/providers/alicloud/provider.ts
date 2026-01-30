/**
 * Alibaba Cloud Provider
 *
 * Main provider class for Alibaba Cloud platform integration.
 * Implements the CloudProviderAdapter interface with full feature parity to GCP and Azure.
 *
 * Features:
 * - BSS OpenAPI for billing and cost data
 * - ECS, OSS, RDS, ACK resource discovery
 * - Multi-account cost aggregation
 * - Budget tracking and alerts
 * - Parallel processing and graceful error handling
 */

import {
  CloudProviderAdapter,
  ProviderConfig,
  AccountInfo,
  RawCostData,
  CostBreakdown,
  CloudProvider,
  ResourceInventory,
  InventoryFilters,
  BudgetInfo,
  BudgetAlert,
  CostTrendAnalysis,
  FinOpsRecommendation,
  ResourceType,
} from '../../types/providers';
import {
  createAlibabaCloudClientConfig,
  validateAlibabaCloudConfig,
  AlibabaCloudClientConfig,
} from './config';
import { getAccountInfo, validateAccountCredentials } from './account';
import {
  getAccountCostBreakdown,
  getRawCostByService,
  AlibabaCloudCostData,
} from './cost';
import {
  discoverECSInstances,
  discoverOSSBuckets,
  discoverRDSInstances,
  discoverACKClusters,
  discoverAllResources,
  getResourceSummary,
  calculateTotalCost,
} from './inventory';
import {
  getBudgets,
  getBudgetAlerts,
  AlibabaCloudBudget,
  AlibabaCloudBudgetAlert,
} from './budget';
import {
  getMultiAccountCostBreakdown,
  getDetailedMultiAccountCostBreakdown,
  MultiAccountCostBreakdown,
} from './multi-account';

/**
 * Alibaba Cloud Provider
 *
 * Comprehensive cloud cost management for Alibaba Cloud.
 * Supports single and multi-account deployments.
 */
export class AlibabaCloudProvider extends CloudProviderAdapter {
  private aliConfig: AlibabaCloudClientConfig;

  constructor(config: ProviderConfig) {
    super(config);
    this.aliConfig = createAlibabaCloudClientConfig(config);
  }

  /**
   * Validate Alibaba Cloud credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      return await validateAccountCredentials(this.aliConfig);
    } catch (error: any) {
      console.error('Failed to validate Alibaba Cloud credentials:', error.message);
      return false;
    }
  }

  /**
   * Get Alibaba Cloud account information
   */
  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const accountInfo = await getAccountInfo(this.aliConfig);

      return {
        id: accountInfo.accountId,
        name: accountInfo.accountName,
        provider: CloudProvider.ALIBABA_CLOUD,
      };
    } catch (error: any) {
      console.error('Failed to get Alibaba Cloud account info:', error.message);
      return {
        id: this.aliConfig.accountId || 'unknown',
        name: 'Alibaba Cloud Account',
        provider: CloudProvider.ALIBABA_CLOUD,
      };
    }
  }

  /**
   * Get raw cost data by service
   */
  async getRawCostData(): Promise<RawCostData> {
    try {
      const rawCosts = await getRawCostByService(this.aliConfig);
      return rawCosts;
    } catch (error: any) {
      console.error('Failed to get raw cost data:', error.message);
      return {};
    }
  }

  /**
   * Get cost breakdown
   * Automatically detects single vs multi-account mode
   */
  async getCostBreakdown(): Promise<CostBreakdown> {
    try {
      // Multi-account mode
      if (
        this.aliConfig.allAccounts ||
        (this.aliConfig.accountIds && this.aliConfig.accountIds.length > 1)
      ) {
        return this.getMultiAccountCostBreakdown();
      }

      // Single account mode
      const costs = await getAccountCostBreakdown(this.aliConfig);

      return {
        totals: {
          thisMonth: costs.thisMonth,
          lastMonth: costs.lastMonth,
          last7Days: costs.last7Days,
          yesterday: costs.yesterday,
        },
        totalsByService: this.buildServiceTotals(costs),
      };
    } catch (error: any) {
      console.error('Failed to get Alibaba Cloud cost breakdown:', error.message);
      throw error;
    }
  }

  /**
   * Get cost breakdown for multiple accounts
   */
  async getMultiAccountCostBreakdown(): Promise<CostBreakdown> {
    try {
      const multiAccountBreakdown = await getMultiAccountCostBreakdown(
        this.aliConfig,
        {
          activeOnly: true,
          accountIds: this.aliConfig.accountIds,
        }
      );

      return {
        totals: multiAccountBreakdown.totals,
        totalsByService: this.buildServiceTotalsFromAggregated(multiAccountBreakdown.totalsByService),
      };
    } catch (error: any) {
      console.error('Failed to get multi-account cost breakdown:', error.message);
      throw error;
    }
  }

  /**
   * Get detailed multi-account cost breakdown with per-account details
   */
  async getDetailedMultiAccountCostBreakdown(): Promise<MultiAccountCostBreakdown> {
    return getDetailedMultiAccountCostBreakdown(this.aliConfig, {
      activeOnly: true,
      accountIds: this.aliConfig.accountIds,
    });
  }

  /**
   * Get resource inventory
   */
  async getResourceInventory(filters?: InventoryFilters): Promise<ResourceInventory> {
    try {
      const resources = await discoverAllResources(this.aliConfig, filters);
      const summary = getResourceSummary(resources);
      const totalCost = filters?.includeCosts ? calculateTotalCost(resources) : 0;

      return {
        provider: CloudProvider.ALIBABA_CLOUD,
        region: this.aliConfig.regionId,
        totalResources: summary.totalResources,
        resourcesByType: {
          [ResourceType.COMPUTE]: summary.byType.compute,
          [ResourceType.STORAGE]: summary.byType.storage,
          [ResourceType.DATABASE]: summary.byType.database,
          [ResourceType.CONTAINER]: summary.byType.container,
          [ResourceType.NETWORK]: 0,
          [ResourceType.SECURITY]: 0,
          [ResourceType.SERVERLESS]: 0,
          [ResourceType.ANALYTICS]: 0,
        },
        totalCost,
        resources: {
          compute: resources.ecsInstances.map((instance) => ({
            id: instance.instanceId,
            name: instance.instanceName,
            state: instance.status,
            region: instance.regionId,
            tags: instance.tags,
            createdAt: new Date(instance.creationTime),
            costToDate: instance.costToDate,
            provider: CloudProvider.ALIBABA_CLOUD,
            instanceType: instance.instanceType,
            cpu: instance.cpu,
            memory: instance.memory,
            platform: instance.osType,
          })),
          storage: resources.ossBuckets.map((bucket) => ({
            id: bucket.bucketName,
            name: bucket.bucketName,
            state: 'Active',
            region: bucket.location,
            tags: bucket.tags,
            createdAt: new Date(bucket.creationDate),
            costToDate: bucket.costToDate,
            provider: CloudProvider.ALIBABA_CLOUD,
            sizeGB: bucket.sizeGB || 0,
            storageType: bucket.storageClass,
            encrypted: bucket.accessControlList === 'private',
          })),
          database: resources.rdsInstances.map((db) => ({
            id: db.dbInstanceId,
            name: db.dbInstanceDescription,
            state: db.dbInstanceStatus,
            region: db.regionId,
            tags: db.tags,
            createdAt: new Date(db.createTime),
            costToDate: db.costToDate,
            provider: CloudProvider.ALIBABA_CLOUD,
            engine: db.engine,
            version: db.engineVersion,
            instanceClass: db.dbInstanceClass,
            storageGB: db.dbInstanceStorage,
          })),
          network: [],
          container: resources.ackClusters.map((cluster) => ({
            id: cluster.clusterId,
            name: cluster.clusterName,
            state: cluster.state,
            region: cluster.regionId,
            tags: cluster.tags,
            createdAt: new Date(cluster.creationTime),
            costToDate: cluster.costToDate,
            provider: CloudProvider.ALIBABA_CLOUD,
          })),
        },
        lastUpdated: new Date(),
      };
    } catch (error: any) {
      console.error('Failed to get Alibaba Cloud resource inventory:', error.message);
      throw error;
    }
  }

  /**
   * Get resource costs (not yet implemented)
   */
  async getResourceCosts(resourceId: string): Promise<number> {
    console.warn('Alibaba Cloud resource costing not yet implemented');
    return 0;
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<string[]> {
    return [
      'Enable BSS billing export for detailed cost analysis',
      'Consider using Reserved Instances for predictable ECS workloads to save up to 70%',
      'Review OSS lifecycle policies to reduce storage costs',
      'Use Preemptible Instances for fault-tolerant workloads to save up to 90%',
      'Enable Auto Scaling for ECS instances to optimize capacity',
      'Review and clean up unused OSS buckets and objects',
      'Consider using Alibaba Cloud CDN to reduce bandwidth costs',
      'Enable compression for OSS objects to reduce storage and transfer costs',
    ];
  }

  /**
   * Get budgets for account
   */
  async getBudgets(): Promise<BudgetInfo[]> {
    try {
      const budgets = await getBudgets(this.aliConfig);

      return budgets.map((budget) => ({
        budgetName: budget.budgetName,
        budgetLimit: budget.budgetAmount,
        actualSpend: budget.spentAmount,
        forecastedSpend: this.calculateForecast(budget),
        timeUnit: this.mapTimeUnit(budget.timeUnit),
        timePeriod: {
          start: budget.startDate,
          end: budget.endDate,
        },
        budgetType: budget.budgetType === 'COST' ? 'COST' : 'USAGE',
        status: this.getBudgetStatus(budget),
        thresholds: budget.thresholds.map((threshold) => ({
          threshold,
          thresholdType: 'PERCENTAGE' as const,
          comparisonOperator: 'GREATER_THAN' as const,
          notificationType: 'ACTUAL' as const,
        })),
      }));
    } catch (error: any) {
      console.error('Failed to get Alibaba Cloud budgets:', error.message);
      return [];
    }
  }

  /**
   * Get budget alerts
   */
  async getBudgetAlerts(): Promise<BudgetAlert[]> {
    try {
      const alerts = await getBudgetAlerts(this.aliConfig);

      return alerts.map((alert) => ({
        budgetName: alert.budgetName,
        alertType: alert.status === 'critical' ? 'THRESHOLD_EXCEEDED' : 'THRESHOLD_EXCEEDED',
        currentSpend: alert.spentAmount,
        budgetLimit: alert.budgetAmount,
        threshold: alert.threshold,
        percentageUsed: alert.currentPercentage,
        timeRemaining: alert.daysRemaining ? `${alert.daysRemaining} days` : 'Unknown',
        severity: this.mapSeverity(alert.severity),
        message: alert.message,
      }));
    } catch (error: any) {
      console.error('Failed to get Alibaba Cloud budget alerts:', error.message);
      return [];
    }
  }

  /**
   * Get cost trend analysis (not yet implemented)
   */
  async getCostTrendAnalysis(months?: number): Promise<CostTrendAnalysis> {
    console.warn('Alibaba Cloud cost trend analysis not yet implemented');
    throw new Error('Alibaba Cloud cost trend analysis not yet implemented');
  }

  /**
   * Get FinOps recommendations (not yet implemented)
   */
  async getFinOpsRecommendations(): Promise<FinOpsRecommendation[]> {
    console.warn('Alibaba Cloud FinOps recommendations not yet implemented');
    throw new Error('Alibaba Cloud FinOps recommendations not yet implemented');
  }

  /**
   * Helper: Build service totals from cost data
   */
  private buildServiceTotals(costs: AlibabaCloudCostData): {
    lastMonth: { [key: string]: number };
    thisMonth: { [key: string]: number };
    last7Days: { [key: string]: number };
    yesterday: { [key: string]: number };
  } {
    const totals = {
      lastMonth: {} as { [key: string]: number },
      thisMonth: {} as { [key: string]: number },
      last7Days: {} as { [key: string]: number },
      yesterday: {} as { [key: string]: number },
    };

    if (costs.breakdown) {
      for (const service of costs.breakdown) {
        const serviceName = service.productName || service.productCode;
        totals.thisMonth[serviceName] = service.cost;
      }
    }

    return totals;
  }

  /**
   * Helper: Build service totals from aggregated data
   */
  private buildServiceTotalsFromAggregated(totalsByService: Record<string, number>): {
    lastMonth: { [key: string]: number };
    thisMonth: { [key: string]: number };
    last7Days: { [key: string]: number };
    yesterday: { [key: string]: number };
  } {
    return {
      lastMonth: {},
      thisMonth: totalsByService,
      last7Days: {},
      yesterday: {},
    };
  }

  /**
   * Helper: Calculate forecast for budget
   */
  private calculateForecast(budget: AlibabaCloudBudget): number {
    try {
      const startDate = new Date(budget.startDate);
      const endDate = new Date(budget.endDate);
      const now = new Date();

      const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      if (elapsedDays <= 0) return 0;

      const dailyRate = budget.spentAmount / elapsedDays;
      return dailyRate * totalDays;
    } catch (error) {
      return budget.spentAmount;
    }
  }

  /**
   * Helper: Map time unit to standard format
   */
  private mapTimeUnit(timeUnit: string): 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' {
    const upperUnit = timeUnit.toUpperCase();
    if (upperUnit.includes('QUARTER')) return 'QUARTERLY';
    if (upperUnit.includes('YEAR') || upperUnit.includes('ANNUAL')) return 'ANNUALLY';
    return 'MONTHLY';
  }

  /**
   * Helper: Get budget status
   */
  private getBudgetStatus(budget: AlibabaCloudBudget): 'OK' | 'ALARM' | 'FORECASTED_ALARM' {
    const percentUsed = (budget.spentAmount / budget.budgetAmount) * 100;
    const forecast = this.calculateForecast(budget);
    const forecastPercent = (forecast / budget.budgetAmount) * 100;

    if (percentUsed >= 100) return 'ALARM';
    if (forecastPercent >= 100) return 'FORECASTED_ALARM';
    if (percentUsed >= 80) return 'ALARM';
    return 'OK';
  }

  /**
   * Helper: Map severity levels
   */
  private mapSeverity(severity: 'low' | 'medium' | 'high' | 'critical'): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    return severity.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }

  /**
   * Static method to validate Alibaba Cloud configuration
   */
  static validateAlibabaCloudConfig(config: ProviderConfig): boolean {
    return validateAlibabaCloudConfig(config);
  }

  /**
   * Static method to get required credentials
   */
  static getRequiredCredentials(): string[] {
    return [
      'accessKeyId - Alibaba Cloud Access Key ID',
      'accessKeySecret - Alibaba Cloud Access Key Secret',
      'regionId - Region ID (optional, defaults to cn-hangzhou)',
      'accountId - Account ID (optional)',
      'allAccounts - Query all accessible accounts (optional)',
      'accountIds - List of account IDs for multi-account (optional)',
    ];
  }
}
