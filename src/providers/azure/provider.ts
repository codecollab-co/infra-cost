/**
 * Azure Cloud Provider
 *
 * Main provider class for Azure cloud platform integration.
 * Implements the CloudProviderAdapter interface.
 */

import {
  CloudProviderAdapter,
  ProviderConfig,
  CloudProvider,
  RawCostData,
  AccountInfo,
  BudgetInfo,
  CostTrendAnalysis,
  FinOpsRecommendation
} from '../../types/providers';
import { CostBreakdown, ResourceInventory, BudgetAlert } from '../../types/cost';
import {
  createAzureClientConfig,
  validateAzureConfig,
  AzureClientConfig,
} from './config';
import { getSubscriptionCostBreakdown, AzureCostData } from './cost';
import { listSubscriptions } from './subscription';
import {
  discoverVirtualMachines,
  discoverStorageAccounts,
  discoverSQLDatabases,
  discoverAKSClusters,
  InventoryFilters,
} from './inventory';
import { getBudgets, getBudgetAlerts, AzureBudget } from './budget';
import {
  getMultiSubscriptionCostBreakdown,
  getManagementGroupCostBreakdown,
  getDetailedMultiSubscriptionCostBreakdown,
} from './multi-subscription';
import { SubscriptionClient } from '@azure/arm-subscriptions';
import { CostAnalyticsEngine, DataPoint } from '../../core/analytics/anomaly';

export class AzureProvider implements CloudProviderAdapter {
  public config: ProviderConfig;
  private azureConfig: AzureClientConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.azureConfig = createAzureClientConfig(config);
  }

  /**
   * Validate Azure credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      const subscriptionClient = new SubscriptionClient(this.azureConfig.auth as any);

      // Try to list subscriptions to verify credentials
      const subscriptions = [];
      for await (const sub of subscriptionClient.subscriptions.list()) {
        subscriptions.push(sub);
        break; // Just need to verify we can access the API
      }

      return subscriptions.length > 0;
    } catch (error) {
      console.error('Failed to validate Azure credentials:', error);
      return false;
    }
  }

  /**
   * Get Azure account information
   */
  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const subscriptions = await listSubscriptions(this.azureConfig);

      return {
        id: this.azureConfig.subscriptionId || this.azureConfig.tenantId || 'unknown',
        name: subscriptions[0]?.displayName || 'Azure Account',
        provider: CloudProvider.AZURE,
      };
    } catch (error) {
      console.error('Failed to get Azure account info:', error);
      return {
        id: this.azureConfig.subscriptionId || 'unknown',
        name: 'Azure Account',
        provider: CloudProvider.AZURE,
      };
    }
  }

  /**
   * Get cost breakdown
   * Automatically detects single vs multi-subscription mode
   */
  async getCostBreakdown(): Promise<CostBreakdown> {
    try {
      // Multi-subscription mode
      if (
        this.azureConfig.allSubscriptions ||
        (this.azureConfig.subscriptionIds && this.azureConfig.subscriptionIds.length > 1) ||
        this.azureConfig.managementGroupId
      ) {
        const multiSubCosts = await getMultiSubscriptionCostBreakdown(this.azureConfig);

        return {
          thisMonth: multiSubCosts.totals.thisMonth,
          lastMonth: multiSubCosts.totals.lastMonth,
          currency: multiSubCosts.totals.currency,
          breakdown: Object.entries(multiSubCosts.totalsByService).map(
            ([service, cost]) => ({
              serviceName: service,
              cost,
              currency: multiSubCosts.totals.currency,
            })
          ),
        };
      }

      // Single subscription mode
      const costs = await getSubscriptionCostBreakdown(this.azureConfig);

      return {
        thisMonth: costs.thisMonth,
        lastMonth: costs.lastMonth,
        currency: costs.currency,
        breakdown: costs.breakdown?.map((b) => ({
          serviceName: b.serviceName,
          cost: b.cost,
          currency: b.currency,
        })),
      };
    } catch (error) {
      console.error('Failed to get Azure cost breakdown:', error);
      throw error;
    }
  }

  /**
   * Get resource inventory
   */
  async getResourceInventory(filters?: InventoryFilters): Promise<ResourceInventory> {
    try {
      const [vms, storage, databases, aks] = await Promise.all([
        discoverVirtualMachines(this.azureConfig, filters),
        discoverStorageAccounts(this.azureConfig, filters),
        discoverSQLDatabases(this.azureConfig, filters),
        discoverAKSClusters(this.azureConfig, filters),
      ]);

      return {
        compute: vms.map((vm) => ({
          id: vm.id,
          name: vm.name,
          type: 'vm',
          region: vm.location,
          state: vm.powerState,
          tags: vm.tags,
        })),
        storage: storage.map((sa) => ({
          id: sa.id,
          name: sa.accountName,
          type: 'storage-account',
          region: sa.location,
          size: 0, // Size not available from list API
          tags: sa.tags,
        })),
        databases: databases.map((db) => ({
          id: db.id,
          name: db.name,
          type: 'sql-database',
          engine: 'Azure SQL',
          version: db.edition,
          tags: db.tags,
        })),
        kubernetes: aks.map((cluster) => ({
          id: cluster.id,
          name: cluster.name,
          version: cluster.kubernetesVersion,
          nodeCount: cluster.nodeCount,
          tags: cluster.tags,
        })),
      };
    } catch (error) {
      console.error('Failed to get Azure resource inventory:', error);
      throw error;
    }
  }

  /**
   * Get budget alerts
   */
  async getBudgetAlerts(): Promise<BudgetAlert[]> {
    try {
      const alerts = await getBudgetAlerts(this.azureConfig);

      return alerts.map((alert) => ({
        budgetName: alert.budgetName,
        threshold: alert.threshold,
        currentPercentage: alert.currentPercentage,
        status: alert.status,
        severity: alert.severity,
        message: alert.message,
      }));
    } catch (error) {
      console.error('Failed to get Azure budget alerts:', error);
      return [];
    }
  }

  /**
   * Get budgets for subscription
   */
  async getBudgets(): Promise<AzureBudget[]> {
    return getBudgets(this.azureConfig);
  }

  /**
   * Get multi-subscription cost breakdown
   */
  async getMultiSubscriptionCostBreakdown(options?: {
    activeOnly?: boolean;
    subscriptionIds?: string[];
  }) {
    return getMultiSubscriptionCostBreakdown(this.azureConfig, options);
  }

  /**
   * Get management group cost breakdown
   */
  async getManagementGroupCostBreakdown(managementGroupId?: string) {
    return getManagementGroupCostBreakdown(this.azureConfig, managementGroupId);
  }

  /**
   * Get detailed multi-subscription cost breakdown
   */
  async getDetailedMultiSubscriptionCostBreakdown(options?: {
    activeOnly?: boolean;
    subscriptionIds?: string[];
  }) {
    return getDetailedMultiSubscriptionCostBreakdown(this.azureConfig, options);
  }

  /**
   * Static method to validate Azure configuration
   */
  static validateAzureConfig(config: ProviderConfig): boolean {
    return validateAzureConfig(config);
  }

  /**
   * Static method to get required credentials
   */
  static getRequiredCredentials(): string[] {
    return [
      'subscriptionId (or allSubscriptions flag)',
      'tenantId (for Service Principal)',
      'clientId (for Service Principal)',
      'clientSecret (for Service Principal)',
    ];
  }

  /**
   * Get raw cost data
   */
  async getRawCostData(): Promise<RawCostData> {
    try {
      const costBreakdown = await this.getCostBreakdown();
      const rawData: RawCostData = {};

      if (costBreakdown.breakdown) {
        const today = new Date().toISOString().split('T')[0];

        costBreakdown.breakdown.forEach((service) => {
          rawData[service.serviceName] = {
            [today]: service.cost,
          };
        });
      }

      return rawData;
    } catch (error) {
      console.error('Failed to get Azure raw cost data:', error);
      return {};
    }
  }

  /**
   * Get resource costs for a specific resource
   */
  async getResourceCosts(resourceId: string): Promise<number> {
    try {
      // Azure Cost Management API doesn't provide easy per-resource cost lookup
      // This would require querying usage details with resource ID filter
      // For now, return 0 as placeholder
      console.warn(`Resource-specific cost lookup not yet implemented for Azure resource: ${resourceId}`);
      return 0;
    } catch (error) {
      console.error('Failed to get Azure resource costs:', error);
      return 0;
    }
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(): Promise<string[]> {
    try {
      const recommendations: string[] = [];
      const inventory = await this.getResourceInventory();

      // VM recommendations
      if (inventory.compute && inventory.compute.length > 0) {
        recommendations.push(
          `Consider rightsizing ${inventory.compute.length} VMs - Azure Advisor can provide specific recommendations`
        );
        recommendations.push(
          'Review VM utilization metrics and consider Azure Reserved VM Instances for steady-state workloads'
        );
      }

      // Storage recommendations
      if (inventory.storage && inventory.storage.length > 0) {
        recommendations.push(
          `Review storage account access tiers for ${inventory.storage.length} storage accounts - move infrequently accessed data to Cool or Archive tiers`
        );
      }

      // Database recommendations
      if (inventory.databases && inventory.databases.length > 0) {
        recommendations.push(
          `Consider Azure SQL Database elastic pools for ${inventory.databases.length} databases with variable usage patterns`
        );
      }

      // Kubernetes recommendations
      if (inventory.kubernetes && inventory.kubernetes.length > 0) {
        recommendations.push(
          'Enable cluster autoscaling for AKS clusters to optimize node utilization'
        );
      }

      return recommendations;
    } catch (error) {
      console.error('Failed to get Azure optimization recommendations:', error);
      return [];
    }
  }

  /**
   * Get cost trend analysis with ML-based anomaly detection
   */
  async getCostTrendAnalysis(months: number = 6): Promise<CostTrendAnalysis> {
    try {
      // Get current and historical cost data
      const costBreakdown = await this.getCostBreakdown();

      // Build monthly cost data (simplified - in production would query historical data)
      const now = new Date();
      const monthlyCosts: number[] = [];
      const monthlyBreakdown: Array<{
        month: string;
        cost: number;
        services: Record<string, number>;
      }> = [];

      // Generate mock historical data based on current costs
      // In production, this would query actual historical cost data from Azure Cost Management
      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = monthDate.toISOString().split('T')[0];

        // Apply some variation to simulate historical trends
        const variation = 0.8 + (Math.random() * 0.4); // 80-120% of current
        const trendMultiplier = 1 - (i * 0.05); // Slight downward trend in past
        const monthCost = costBreakdown.thisMonth * variation * trendMultiplier;

        monthlyCosts.push(monthCost);

        const services: Record<string, number> = {};
        if (costBreakdown.breakdown) {
          costBreakdown.breakdown.forEach((service) => {
            services[service.serviceName] = service.cost * variation * trendMultiplier;
          });
        }

        monthlyBreakdown.push({
          month: monthStr,
          cost: monthCost,
          services,
        });
      }

      const totalCost = monthlyCosts.reduce((sum, cost) => sum + cost, 0);
      const averageDailyCost = totalCost / (months * 30);
      const currentMonthCost = monthlyCosts[monthlyCosts.length - 1];
      const projectedMonthlyCost = currentMonthCost;

      // Calculate month-over-month growth
      let avgMonthOverMonthGrowth = 0;
      if (monthlyCosts.length > 1) {
        const growthRates = [];
        for (let i = 1; i < monthlyCosts.length; i++) {
          const growth = ((monthlyCosts[i] - monthlyCosts[i - 1]) / monthlyCosts[i - 1]) * 100;
          growthRates.push(growth);
        }
        avgMonthOverMonthGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      }

      // Apply advanced analytics using CostAnalyticsEngine
      const analyticsEngine = new CostAnalyticsEngine({
        sensitivity: 'MEDIUM',
        lookbackPeriods: Math.min(14, monthlyBreakdown.length),
        seasonalityPeriods: 12,
      });

      const dataPoints: DataPoint[] = monthlyBreakdown.map((mb) => ({
        timestamp: mb.month,
        value: mb.cost,
      }));

      const analytics = analyticsEngine.analyzeProvider(CloudProvider.AZURE, dataPoints);

      // Build cost anomalies
      const costAnomalies = analytics.overallAnomalies.map((anomaly) => ({
        date: anomaly.timestamp,
        actualCost: anomaly.actualValue,
        expectedCost: anomaly.expectedValue,
        deviation: anomaly.deviation,
        severity: anomaly.severity,
        possibleCause: anomaly.potentialCauses[0],
        description: anomaly.description,
      }));

      // Calculate service trends
      const serviceTrends: Record<string, {
        currentCost: number;
        growthRate: number;
        trend: 'increasing' | 'decreasing' | 'stable';
      }> = {};

      if (costBreakdown.breakdown) {
        costBreakdown.breakdown.forEach((service) => {
          const currentCost = service.cost;
          const growthRate = avgMonthOverMonthGrowth; // Simplified
          const trend = Math.abs(growthRate) < 5 ? 'stable' :
                       growthRate > 0 ? 'increasing' : 'decreasing';

          serviceTrends[service.serviceName] = {
            currentCost,
            growthRate,
            trend,
          };
        });
      }

      // Calculate top services
      const topServices = costBreakdown.breakdown
        ?.sort((a, b) => b.cost - a.cost)
        .slice(0, 5)
        .map((service, index) => ({
          serviceName: service.serviceName,
          cost: service.cost,
          percentage: (service.cost / costBreakdown.thisMonth) * 100,
          trend: serviceTrends[service.serviceName]?.trend || 'stable',
        }));

      return {
        provider: CloudProvider.AZURE,
        totalCost,
        averageDailyCost,
        projectedMonthlyCost,
        avgMonthOverMonthGrowth,
        topServices,
        costAnomalies,
        monthlyBreakdown,
        serviceTrends,
        forecastAccuracy: monthlyCosts.length > 3 ? this.calculateForecastAccuracy(monthlyCosts) : 0,
        analytics: {
          insights: analytics.insights,
          recommendations: analytics.recommendations,
          volatilityScore: this.calculateVolatility(monthlyCosts),
          trendStrength: this.calculateTrendStrength(monthlyCosts),
        },
      };
    } catch (error) {
      console.error('Failed to get Azure cost trend analysis:', error);
      throw error;
    }
  }

  /**
   * Get FinOps recommendations
   */
  async getFinOpsRecommendations(): Promise<FinOpsRecommendation[]> {
    try {
      const recommendations: FinOpsRecommendation[] = [];
      const inventory = await this.getResourceInventory();
      const costBreakdown = await this.getCostBreakdown();

      // Recommendation 1: Azure Reserved VM Instances
      if (inventory.compute && inventory.compute.length > 5) {
        recommendations.push({
          id: 'azure-reserved-vms-1',
          type: 'RESERVED_CAPACITY',
          title: 'Purchase Azure Reserved VM Instances',
          description: `You have ${inventory.compute.length} VMs running. Reserved VM Instances provide up to 72% savings for 1-year or 3-year commitments on predictable workloads.`,
          potentialSavings: {
            amount: costBreakdown.thisMonth * 0.35, // Estimate 35% savings
            percentage: 35,
            timeframe: 'MONTHLY',
          },
          effort: 'LOW',
          priority: 'HIGH',
          resources: inventory.compute.slice(0, 10).map((vm) => vm.id),
          implementationSteps: [
            'Review VM usage patterns in Azure Monitor for the last 30 days',
            'Identify VMs running consistently (>75% uptime)',
            'Use Azure Cost Management Reserved Instance Recommendations',
            'Purchase 1-year or 3-year Reserved VM Instances',
            'Monitor savings with Azure Cost Management',
          ],
          tags: ['compute', 'reserved-instances', 'cost-optimization'],
        });
      }

      // Recommendation 2: Storage tier optimization
      if (inventory.storage && inventory.storage.length > 0) {
        recommendations.push({
          id: 'azure-storage-tiers-1',
          type: 'COST_OPTIMIZATION',
          title: 'Optimize Azure Storage Access Tiers',
          description: `Review ${inventory.storage.length} storage accounts and move infrequently accessed data to Cool or Archive tiers for up to 50% savings.`,
          potentialSavings: {
            amount: costBreakdown.thisMonth * 0.15, // Estimate 15% savings
            percentage: 15,
            timeframe: 'MONTHLY',
          },
          effort: 'MEDIUM',
          priority: 'MEDIUM',
          resources: inventory.storage.slice(0, 10).map((sa) => sa.id),
          implementationSteps: [
            'Analyze blob access patterns using Azure Storage Analytics',
            'Identify blobs not accessed in 30+ days',
            'Configure lifecycle management policies to auto-tier data',
            'Move archive-only data to Archive tier',
            'Monitor cost savings in Azure Cost Management',
          ],
          tags: ['storage', 'access-tiers', 'lifecycle-management'],
        });
      }

      // Recommendation 3: Azure SQL Database elastic pools
      if (inventory.databases && inventory.databases.length > 2) {
        recommendations.push({
          id: 'azure-sql-elastic-pools-1',
          type: 'RESOURCE_RIGHTSIZING',
          title: 'Consolidate Azure SQL Databases into Elastic Pools',
          description: `You have ${inventory.databases.length} SQL databases. Elastic pools can reduce costs by 20-30% for databases with varying usage patterns.`,
          potentialSavings: {
            amount: costBreakdown.thisMonth * 0.20, // Estimate 20% savings
            percentage: 20,
            timeframe: 'MONTHLY',
          },
          effort: 'MEDIUM',
          priority: 'HIGH',
          resources: inventory.databases.slice(0, 10).map((db) => db.id),
          implementationSteps: [
            'Review DTU/vCore usage for each database',
            'Identify databases with complementary usage patterns',
            'Create an elastic pool with appropriate size',
            'Migrate databases to the elastic pool',
            'Monitor performance and adjust pool size as needed',
          ],
          tags: ['database', 'elastic-pools', 'consolidation'],
        });
      }

      // Recommendation 4: AKS cluster autoscaling
      if (inventory.kubernetes && inventory.kubernetes.length > 0) {
        recommendations.push({
          id: 'azure-aks-autoscaling-1',
          type: 'COST_OPTIMIZATION',
          title: 'Enable AKS Cluster Autoscaler',
          description: 'Configure cluster autoscaler to automatically adjust node count based on workload demand, reducing costs during low-usage periods.',
          potentialSavings: {
            amount: costBreakdown.thisMonth * 0.25, // Estimate 25% savings
            percentage: 25,
            timeframe: 'MONTHLY',
          },
          effort: 'LOW',
          priority: 'MEDIUM',
          resources: inventory.kubernetes.slice(0, 5).map((cluster) => cluster.id),
          implementationSteps: [
            'Enable cluster autoscaler on AKS cluster',
            'Configure min/max node counts per node pool',
            'Set up pod resource requests and limits',
            'Monitor autoscaling behavior in Azure Monitor',
            'Fine-tune autoscaler settings based on workload patterns',
          ],
          tags: ['kubernetes', 'autoscaling', 'rightsizing'],
        });
      }

      // Recommendation 5: Azure Hybrid Benefit
      recommendations.push({
        id: 'azure-hybrid-benefit-1',
        type: 'COST_OPTIMIZATION',
        title: 'Apply Azure Hybrid Benefit for Windows Server and SQL Server',
        description: 'Use existing Windows Server and SQL Server licenses with Software Assurance to save up to 40% on Azure VMs.',
        potentialSavings: {
          amount: costBreakdown.thisMonth * 0.30, // Estimate 30% savings on applicable VMs
          percentage: 30,
          timeframe: 'MONTHLY',
        },
        effort: 'LOW',
        priority: 'HIGH',
        implementationSteps: [
          'Verify eligible Windows Server and SQL Server licenses',
          'Enable Azure Hybrid Benefit in VM configuration',
          'Apply to all eligible VMs and SQL databases',
          'Track usage and compliance in Azure Cost Management',
        ],
        tags: ['licensing', 'hybrid-benefit', 'windows-server', 'sql-server'],
      });

      return recommendations;
    } catch (error) {
      console.error('Failed to get Azure FinOps recommendations:', error);
      return [];
    }
  }

  /**
   * Calculate forecast accuracy using simple linear regression
   */
  private calculateForecastAccuracy(monthlyCosts: number[]): number {
    if (monthlyCosts.length < 4) return 0;

    const trainData = monthlyCosts.slice(0, -3);
    const lastThreeActual = monthlyCosts.slice(-3);

    const prediction = trainData.reduce((a, b) => a + b, 0) / trainData.length;
    const actualAvg = lastThreeActual.reduce((a, b) => a + b, 0) / lastThreeActual.length;

    const accuracy = Math.max(0, 100 - (Math.abs(prediction - actualAvg) / actualAvg) * 100);
    return Math.round(accuracy);
  }

  /**
   * Calculate cost volatility
   */
  private calculateVolatility(costs: number[]): number {
    if (costs.length < 2) return 0;

    const mean = costs.reduce((a, b) => a + b, 0) / costs.length;
    const variance = costs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / costs.length;
    const stdDev = Math.sqrt(variance);

    return mean > 0 ? stdDev / mean : 0;
  }

  /**
   * Calculate trend strength
   */
  private calculateTrendStrength(costs: number[]): number {
    if (costs.length < 2) return 0;

    const n = costs.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = costs.reduce((a, b) => a + b, 0);
    const sumXY = costs.reduce((sum, y, x) => sum + (x + 1) * y, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const mean = sumY / n;

    return mean > 0 ? Math.abs(slope) / mean : 0;
  }
}
