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
} from '../../types/providers';
import { getGcpConfigFromOptionsOrEnv, GCPClientConfig } from './config';
import { getProjectInfo } from './project';
import { getRawCostByService, getTotalCosts, TotalCosts } from './cost';
import { showSpinner } from '../../logger';

/**
 * Google Cloud Platform Provider
 *
 * Implements cloud cost analysis for GCP using:
 * - Cloud Billing API for billing account info
 * - BigQuery for detailed cost data (requires billing export)
 * - Compute Engine API for resource inventory
 * - Cloud Monitoring API for metrics
 */
export class GCPProvider extends CloudProviderAdapter {
  private gcpConfig?: GCPClientConfig;
  private billingDatasetId?: string;
  private billingTableId?: string;

  constructor(config: ProviderConfig) {
    super(config);

    // Extract GCP-specific configuration
    if (config.credentials?.billingDatasetId) {
      this.billingDatasetId = config.credentials.billingDatasetId;
    }
    if (config.credentials?.billingTableId) {
      this.billingTableId = config.credentials.billingTableId;
    }
  }

  /**
   * Initialize GCP client configuration
   */
  private async initializeConfig(): Promise<GCPClientConfig> {
    if (this.gcpConfig) {
      return this.gcpConfig;
    }

    this.gcpConfig = await getGcpConfigFromOptionsOrEnv({
      projectId: this.config.credentials.projectId || '',
      keyFilePath: this.config.credentials.keyFilePath,
      profile: this.config.credentials.profile,
    });

    return this.gcpConfig;
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const config = await this.initializeConfig();
      // If we got here, authentication succeeded
      return true;
    } catch (error) {
      console.error(`GCP credential validation failed: ${error.message}`);
      return false;
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    const config = await this.initializeConfig();
    const projectInfo = await getProjectInfo(config);

    return {
      id: projectInfo.projectId,
      name: projectInfo.projectName,
      provider: CloudProvider.GOOGLE_CLOUD,
    };
  }

  async getRawCostData(): Promise<RawCostData> {
    const config = await this.initializeConfig();
    const costByService = await getRawCostByService(
      config,
      this.billingDatasetId,
      this.billingTableId
    );

    return costByService;
  }

  async getCostBreakdown(): Promise<CostBreakdown> {
    const config = await this.initializeConfig();
    const totalCosts = await getTotalCosts(
      config,
      this.billingDatasetId,
      this.billingTableId
    );

    return {
      provider: CloudProvider.GOOGLE_CLOUD,
      accountId: config.projectId,
      totalCost: totalCosts.totals.thisMonth,
      costByService: totalCosts.totalsByService.thisMonth,
      costByRegion: {}, // Will implement in future issue
      topServices: this.getTopServices(totalCosts.totalsByService.thisMonth),
      period: {
        start: new Date(),
        end: new Date(),
      },
    };
  }

  private getTopServices(costByService: { [key: string]: number }): Array<{
    name: string;
    cost: number;
  }> {
    return Object.entries(costByService)
      .map(([name, cost]) => ({ name, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);
  }

  async getResourceInventory(filters?: InventoryFilters): Promise<ResourceInventory> {
    // Will implement in Issue #73 (Implement resource inventory discovery)
    throw new Error('GCP resource inventory not yet implemented - see Issue #73');
  }

  async getResourceCosts(resourceId: string): Promise<number> {
    // Will implement with resource inventory
    throw new Error('GCP resource costing not yet implemented');
  }

  async getOptimizationRecommendations(): Promise<string[]> {
    // Will implement in Issue #76 (Implement cost optimization recommendations)
    return [
      'Enable BigQuery billing export for detailed cost analysis',
      'Consider using Committed Use Discounts for predictable workloads',
      'Review Cloud Storage lifecycle policies to reduce storage costs',
      'Use Preemptible VMs for fault-tolerant workloads to save up to 80%',
    ];
  }

  async getBudgets(): Promise<BudgetInfo[]> {
    // Will implement in Issue #75 (Implement budget tracking and alerts)
    throw new Error('GCP budget tracking not yet implemented - see Issue #75');
  }

  async getBudgetAlerts(): Promise<BudgetAlert[]> {
    // Will implement in Issue #75
    throw new Error('GCP budget alerts not yet implemented - see Issue #75');
  }

  async getCostTrendAnalysis(months?: number): Promise<CostTrendAnalysis> {
    // Will implement in future analytics module
    throw new Error('GCP cost trend analysis not yet implemented');
  }

  async getFinOpsRecommendations(): Promise<FinOpsRecommendation[]> {
    // Will implement in future analytics module
    throw new Error('GCP FinOps recommendations not yet implemented');
  }

  /**
   * Helper method to validate GCP-specific configuration
   */
  static validateGCPConfig(config: ProviderConfig): boolean {
    const requiredFields = ['projectId'];

    for (const field of requiredFields) {
      if (!config.credentials[field]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Helper method to get required credential fields for GCP
   */
  static getRequiredCredentials(): string[] {
    return [
      'projectId', // GCP project ID (required)
      'keyFilePath', // Path to service account JSON file (optional - uses ADC if not provided)
      'billingDatasetId', // BigQuery dataset ID for billing export (optional - defaults to 'billing_export')
      'billingTableId', // BigQuery table ID for billing export (optional - defaults to 'gcp_billing_export')
    ];
  }
}
