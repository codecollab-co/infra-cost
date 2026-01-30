/**
 * Oracle Cloud Infrastructure (OCI) Provider
 *
 * Main provider class for Oracle Cloud platform integration.
 * Implements the CloudProviderAdapter interface with full feature parity to Azure and GCP providers.
 *
 * Features:
 * - API Key, Instance Principal, Resource Principal, and Config File authentication
 * - Multi-compartment cost aggregation (similar to AWS multi-account or Azure multi-subscription)
 * - Comprehensive resource discovery (Compute, Block Storage, Autonomous DB, OKE)
 * - Budget tracking and alerts
 * - Cost trend analysis and forecasting
 * - FinOps recommendations
 * - Parallel processing for performance
 * - Graceful error handling
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
  createOracleClientConfig,
  validateOracleConfig,
  OracleClientConfig,
} from './config';
import { getCompartmentCostBreakdown, OracleCostData, getCostForecast } from './cost';
import { listCompartments, getTenancyInfo } from './compartment';
import {
  discoverComputeInstances,
  discoverBlockVolumes,
  discoverAutonomousDatabases,
  discoverOKEClusters,
  discoverAllResources,
} from './inventory';
import { getBudgets, getBudgetAlerts, OracleBudget } from './budget';
import {
  getMultiCompartmentCostBreakdown,
  getTenancyCostBreakdown,
  getDetailedMultiCompartmentCostBreakdown,
  getTopSpendingCompartments,
} from './multi-compartment';

export class OracleCloudProvider extends CloudProviderAdapter {
  private oracleConfig: OracleClientConfig;

  constructor(config: ProviderConfig) {
    super(config);
    this.oracleConfig = createOracleClientConfig(config);
  }

  /**
   * Validate OCI credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      // Try to get tenancy information to verify credentials
      const tenancyInfo = await getTenancyInfo(this.oracleConfig);
      return !!tenancyInfo.tenancyId;
    } catch (error: any) {
      console.error('Failed to validate OCI credentials:', error.message);
      return false;
    }
  }

  /**
   * Get OCI account information
   */
  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const tenancyInfo = await getTenancyInfo(this.oracleConfig);
      const compartments = await listCompartments(this.oracleConfig, { activeOnly: true });

      return {
        id: tenancyInfo.tenancyId,
        name: tenancyInfo.name,
        provider: CloudProvider.ORACLE_CLOUD,
      };
    } catch (error: any) {
      console.error('Failed to get OCI account info:', error.message);
      return {
        id: this.oracleConfig.tenancyId || 'unknown',
        name: 'Oracle Cloud Tenancy',
        provider: CloudProvider.ORACLE_CLOUD,
      };
    }
  }

  /**
   * Get raw cost data for processing
   */
  async getRawCostData(): Promise<RawCostData> {
    try {
      const costData = await this.getCostDataInternal();

      // Convert OCI cost data to RawCostData format
      const rawData: RawCostData = {};

      if (costData.breakdown) {
        for (const service of costData.breakdown) {
          if (!rawData[service.serviceName]) {
            rawData[service.serviceName] = {};
          }

          // Use current date as key
          const now = new Date();
          const dateKey = now.toISOString().split('T')[0];
          rawData[service.serviceName][dateKey] = service.cost;
        }
      }

      return rawData;
    } catch (error: any) {
      console.error('Failed to get OCI raw cost data:', error.message);
      return {};
    }
  }

  /**
   * Get cost breakdown
   * Automatically detects single vs multi-compartment mode
   */
  async getCostBreakdown(): Promise<CostBreakdown> {
    try {
      const costData = await this.getCostDataInternal();

      return {
        totals: {
          thisMonth: costData.thisMonth,
          lastMonth: costData.lastMonth,
          last7Days: 0, // Not available in OCI Usage API
          yesterday: 0, // Not available in OCI Usage API
        },
        totalsByService: {
          thisMonth: this.convertBreakdownToMap(costData.breakdown || []),
          lastMonth: {},
          last7Days: {},
          yesterday: {},
        },
      };
    } catch (error: any) {
      console.error('Failed to get OCI cost breakdown:', error.message);
      throw error;
    }
  }

  /**
   * Internal method to get cost data with multi-compartment support
   */
  private async getCostDataInternal(): Promise<OracleCostData> {
    // Multi-compartment mode
    if (
      this.oracleConfig.allCompartments ||
      (this.oracleConfig.compartmentIds && this.oracleConfig.compartmentIds.length > 1)
    ) {
      const multiCompartmentCosts = await getMultiCompartmentCostBreakdown(this.oracleConfig);

      return {
        compartmentId: this.oracleConfig.tenancyId,
        compartmentName: 'All Compartments',
        thisMonth: multiCompartmentCosts.totals.thisMonth,
        lastMonth: multiCompartmentCosts.totals.lastMonth,
        currency: multiCompartmentCosts.totals.currency,
        breakdown: Object.entries(multiCompartmentCosts.totalsByService).map(
          ([serviceName, cost]) => ({
            serviceName,
            cost,
            currency: multiCompartmentCosts.totals.currency,
          })
        ),
      };
    }

    // Single compartment mode
    return await getCompartmentCostBreakdown(this.oracleConfig);
  }

  /**
   * Get resource inventory
   */
  async getResourceInventory(filters?: InventoryFilters): Promise<ResourceInventory> {
    try {
      const resources = await discoverAllResources(this.oracleConfig, filters);

      const resourcesByType: Record<ResourceType, number> = {
        [ResourceType.COMPUTE]: resources.computeInstances.length,
        [ResourceType.STORAGE]: resources.blockVolumes.length,
        [ResourceType.DATABASE]: resources.autonomousDatabases.length,
        [ResourceType.CONTAINER]: resources.okeClusters.length,
        [ResourceType.NETWORK]: 0,
        [ResourceType.SECURITY]: 0,
        [ResourceType.SERVERLESS]: 0,
        [ResourceType.ANALYTICS]: 0,
      };

      const totalResources = Object.values(resourcesByType).reduce((sum, count) => sum + count, 0);

      return {
        provider: CloudProvider.ORACLE_CLOUD,
        region: this.oracleConfig.region || 'unknown',
        totalResources,
        resourcesByType,
        totalCost: 0, // Would need to aggregate from cost data
        resources: {
          compute: resources.computeInstances,
          storage: resources.blockVolumes,
          database: resources.autonomousDatabases,
          container: resources.okeClusters,
          network: [],
        },
        lastUpdated: new Date(),
      };
    } catch (error: any) {
      console.error('Failed to get OCI resource inventory:', error.message);
      throw error;
    }
  }

  /**
   * Get resource costs by resource ID
   */
  async getResourceCosts(resourceId: string): Promise<number> {
    // OCI Usage API doesn't provide per-resource costs easily
    // This would require querying with resource tags or compartment filters
    console.warn('Per-resource cost tracking not yet implemented for OCI');
    return 0;
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    try {
      // Get resource inventory
      const inventory = await this.getResourceInventory();

      // Check for idle compute instances
      const computeInstances = inventory.resources.compute || [];
      const stoppedInstances = computeInstances.filter(i => i.state === 'STOPPED');

      if (stoppedInstances.length > 0) {
        recommendations.push(
          `Found ${stoppedInstances.length} stopped compute instances. Consider terminating unused instances to reduce costs.`
        );
      }

      // Check for unattached block volumes
      const blockVolumes = inventory.resources.storage || [];
      if (blockVolumes.length > 0) {
        recommendations.push(
          `Review ${blockVolumes.length} block volumes for unattached volumes that can be deleted.`
        );
      }

      // Check for auto-scaling opportunities
      const databases = inventory.resources.database || [];
      const nonAutoScalingDBs = databases.filter(
        (db: any) => !db.isAutoScalingEnabled
      );

      if (nonAutoScalingDBs.length > 0) {
        recommendations.push(
          `${nonAutoScalingDBs.length} Autonomous Databases don't have auto-scaling enabled. Enable auto-scaling to optimize costs.`
        );
      }

      // General recommendations
      recommendations.push(
        'Review OCI Cost Analysis reports regularly to identify cost anomalies.',
        'Consider using Reserved Instances for predictable workloads to save up to 60%.',
        'Enable cost tracking tags on all resources for better cost attribution.',
        'Use OCI Resource Manager to automate resource lifecycle management.'
      );

      return recommendations;
    } catch (error: any) {
      console.error('Failed to get optimization recommendations:', error.message);
      return [
        'Unable to generate recommendations due to API error.',
        'Review OCI documentation for cost optimization best practices.',
      ];
    }
  }

  /**
   * Get budget information
   */
  async getBudgets(): Promise<BudgetInfo[]> {
    try {
      const budgets = await getBudgets(this.oracleConfig);

      return budgets.map((budget) => ({
        budgetName: budget.budgetName,
        budgetLimit: budget.budgetAmount,
        actualSpend: budget.spentAmount,
        timeUnit: budget.timeGrain === 'MONTHLY' ? 'MONTHLY' : 'QUARTERLY',
        timePeriod: {
          start: budget.startDate,
          end: budget.endDate || new Date().toISOString().split('T')[0],
        },
        budgetType: 'COST' as const,
        status: this.getBudgetStatus(budget),
        thresholds: budget.thresholds.map((threshold) => ({
          threshold: threshold,
          thresholdType: 'PERCENTAGE' as const,
          comparisonOperator: 'GREATER_THAN' as const,
          notificationType: 'ACTUAL' as const,
        })),
      }));
    } catch (error: any) {
      console.error('Failed to get OCI budgets:', error.message);
      return [];
    }
  }

  /**
   * Get budget alerts
   */
  async getBudgetAlerts(): Promise<BudgetAlert[]> {
    try {
      const alerts = await getBudgetAlerts(this.oracleConfig);

      return alerts.map((alert) => ({
        budgetName: alert.budgetName,
        alertType: alert.status === 'critical' ? 'THRESHOLD_EXCEEDED' : 'FORECAST_EXCEEDED',
        currentSpend: alert.spentAmount,
        budgetLimit: alert.budgetAmount,
        threshold: alert.threshold,
        percentageUsed: alert.currentPercentage,
        timeRemaining: this.calculateTimeRemaining(),
        severity: alert.severity.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        message: alert.message,
      }));
    } catch (error: any) {
      console.error('Failed to get OCI budget alerts:', error.message);
      return [];
    }
  }

  /**
   * Get cost trend analysis
   */
  async getCostTrendAnalysis(months: number = 3): Promise<CostTrendAnalysis> {
    try {
      const costData = await this.getCostDataInternal();
      const forecast = await getCostForecast(this.oracleConfig);

      // Calculate month-over-month growth
      const growthRate = costData.lastMonth > 0
        ? ((costData.thisMonth - costData.lastMonth) / costData.lastMonth) * 100
        : 0;

      return {
        provider: CloudProvider.ORACLE_CLOUD,
        totalCost: costData.thisMonth,
        averageDailyCost: costData.thisMonth / new Date().getDate(),
        projectedMonthlyCost: forecast.forecastedCost,
        avgMonthOverMonthGrowth: growthRate,
        topServices: this.getTopServices(costData.breakdown || []),
        costAnomalies: [],
        monthlyBreakdown: [
          {
            month: 'Current',
            cost: costData.thisMonth,
            services: this.convertBreakdownToMap(costData.breakdown || []),
          },
          {
            month: 'Previous',
            cost: costData.lastMonth,
            services: {},
          },
        ],
      };
    } catch (error: any) {
      console.error('Failed to get cost trend analysis:', error.message);
      throw error;
    }
  }

  /**
   * Get FinOps recommendations
   */
  async getFinOpsRecommendations(): Promise<FinOpsRecommendation[]> {
    const recommendations: FinOpsRecommendation[] = [];

    try {
      const costData = await this.getCostDataInternal();
      const inventory = await this.getResourceInventory();

      // Recommendation 1: Reserved Capacity
      if (inventory.resources.compute && inventory.resources.compute.length > 5) {
        recommendations.push({
          id: 'oci-reserved-capacity-1',
          type: 'RESERVED_CAPACITY',
          title: 'Consider Reserved Capacity for Compute Instances',
          description: `You have ${inventory.resources.compute.length} compute instances. Reserved Capacity can save up to 60% for predictable workloads.`,
          potentialSavings: {
            amount: costData.thisMonth * 0.4, // Estimate 40% savings
            percentage: 40,
            timeframe: 'ANNUALLY',
          },
          effort: 'MEDIUM',
          priority: 'HIGH',
          implementationSteps: [
            'Analyze compute usage patterns for the last 30 days',
            'Identify instances with steady-state workloads',
            'Purchase 1-year or 3-year Reserved Capacity commitments',
            'Monitor savings with OCI Cost Analysis',
          ],
          tags: ['compute', 'reserved-capacity', 'cost-optimization'],
        });
      }

      // Recommendation 2: Auto-Scaling
      const databases = inventory.resources.database || [];
      if (databases.length > 0) {
        recommendations.push({
          id: 'oci-autoscaling-1',
          type: 'COST_OPTIMIZATION',
          title: 'Enable Auto-Scaling for Autonomous Databases',
          description: 'Auto-scaling allows databases to automatically scale based on demand, optimizing costs.',
          potentialSavings: {
            amount: costData.thisMonth * 0.15,
            percentage: 15,
            timeframe: 'MONTHLY',
          },
          effort: 'LOW',
          priority: 'MEDIUM',
          implementationSteps: [
            'Review database utilization patterns',
            'Enable auto-scaling in Autonomous Database settings',
            'Set appropriate scaling limits',
            'Monitor performance and costs',
          ],
          tags: ['database', 'auto-scaling', 'autonomous-database'],
        });
      }

      // Recommendation 3: Resource Tagging
      recommendations.push({
        id: 'oci-tagging-1',
        type: 'ARCHITECTURE',
        title: 'Implement Cost Tracking Tags',
        description: 'Use defined tags to track costs by project, department, or environment for better cost attribution.',
        potentialSavings: {
          amount: 0,
          percentage: 0,
          timeframe: 'MONTHLY',
        },
        effort: 'MEDIUM',
        priority: 'MEDIUM',
        implementationSteps: [
          'Create tag namespaces and keys in OCI Console',
          'Define tagging strategy aligned with business units',
          'Apply tags to all resources using OCI CLI or Console',
          'Enable cost tracking by tags in Cost Analysis',
        ],
        tags: ['governance', 'cost-attribution', 'tagging'],
      });

      // Recommendation 4: Block Volume Optimization
      const blockVolumes = inventory.resources.storage || [];
      if (blockVolumes.length > 10) {
        recommendations.push({
          id: 'oci-storage-1',
          type: 'RESOURCE_RIGHTSIZING',
          title: 'Optimize Block Volume Performance Tiers',
          description: `Review ${blockVolumes.length} block volumes and adjust performance tiers based on actual usage.`,
          potentialSavings: {
            amount: costData.thisMonth * 0.1,
            percentage: 10,
            timeframe: 'MONTHLY',
          },
          effort: 'LOW',
          priority: 'MEDIUM',
          implementationSteps: [
            'Analyze volume performance metrics',
            'Identify over-provisioned volumes',
            'Adjust VPUs per GB to match workload requirements',
            'Delete unattached volumes',
          ],
          tags: ['storage', 'block-volume', 'rightsizing'],
        });
      }

      return recommendations;
    } catch (error: any) {
      console.error('Failed to get FinOps recommendations:', error.message);
      return [];
    }
  }

  /**
   * Get multi-compartment cost breakdown
   */
  async getMultiCompartmentCostBreakdown(options?: {
    activeOnly?: boolean;
    compartmentIds?: string[];
  }) {
    return getMultiCompartmentCostBreakdown(this.oracleConfig, options);
  }

  /**
   * Get tenancy-wide cost breakdown
   */
  async getTenancyCostBreakdown() {
    return getTenancyCostBreakdown(this.oracleConfig);
  }

  /**
   * Get detailed multi-compartment cost breakdown
   */
  async getDetailedMultiCompartmentCostBreakdown(options?: {
    activeOnly?: boolean;
    compartmentIds?: string[];
  }) {
    return getDetailedMultiCompartmentCostBreakdown(this.oracleConfig, options);
  }

  /**
   * Get top spending compartments
   */
  async getTopSpendingCompartments(limit: number = 10) {
    return getTopSpendingCompartments(this.oracleConfig, limit);
  }

  /**
   * Helper method to convert breakdown array to map
   */
  private convertBreakdownToMap(breakdown: Array<{ serviceName: string; cost: number }>): Record<string, number> {
    const map: Record<string, number> = {};
    for (const item of breakdown) {
      map[item.serviceName] = item.cost;
    }
    return map;
  }

  /**
   * Helper method to get top services
   */
  private getTopServices(breakdown: Array<{ serviceName: string; cost: number }>) {
    const total = breakdown.reduce((sum, item) => sum + item.cost, 0);

    return breakdown
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)
      .map((item) => ({
        serviceName: item.serviceName,
        cost: item.cost,
        percentage: total > 0 ? (item.cost / total) * 100 : 0,
        trend: 'STABLE' as const,
      }));
  }

  /**
   * Helper method to get budget status
   */
  private getBudgetStatus(budget: OracleBudget): 'OK' | 'ALARM' | 'FORECASTED_ALARM' {
    const percentUsed = (budget.spentAmount / budget.budgetAmount) * 100;

    if (percentUsed >= 100) {
      return 'ALARM';
    } else if (percentUsed >= 80) {
      return 'FORECASTED_ALARM';
    } else {
      return 'OK';
    }
  }

  /**
   * Helper method to calculate time remaining in month
   */
  private calculateTimeRemaining(): string {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysRemaining = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return `${daysRemaining} days`;
  }

  /**
   * Static method to validate OCI configuration
   */
  static validateOracleConfig(config: ProviderConfig): boolean {
    return validateOracleConfig(config);
  }

  /**
   * Static method to get required credentials
   */
  static getRequiredCredentials(): string[] {
    return [
      'tenancyId (Tenancy OCID)',
      'userId (User OCID)',
      'fingerprint (Public key fingerprint)',
      'privateKey or privateKeyPath (Private key content or path)',
      'region (optional, defaults to us-phoenix-1)',
      '',
      'Alternative authentication methods:',
      '- useInstancePrincipal: true (for compute instances)',
      '- useResourcePrincipal: true (for functions)',
      '- configFilePath + profile (for OCI config file)',
    ];
  }
}
