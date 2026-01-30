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
import { getProjectInfo, listProjects, getMultipleProjects } from './project';
import { getRawCostByService, getTotalCosts, TotalCosts } from './cost';
import {
  discoverGCEInstances,
  discoverStorageBuckets,
  discoverCloudSQLInstances,
  discoverGKEClusters,
} from './inventory';
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

    try {
      const projectInfo = await getProjectInfo(config);

      // Warn if project is not active
      if (projectInfo.state !== 'ACTIVE') {
        console.warn(
          `⚠️  Warning: Project ${projectInfo.projectId} is in state: ${projectInfo.state}`
        );
      }

      return {
        id: projectInfo.projectId,
        name: projectInfo.projectName,
        provider: CloudProvider.GOOGLE_CLOUD,
      };
    } catch (error) {
      // Provide helpful error message
      throw new Error(
        `Failed to get account information for project ${config.projectId}: ${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Verify project ID is correct: ${config.projectId}\n` +
        `2. Ensure credentials have 'resourcemanager.projects.get' permission\n` +
        `3. Check that the project is not deleted or suspended`
      );
    }
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
      totals: totalCosts.totals,
      totalsByService: totalCosts.totalsByService,
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
    const config = await this.initializeConfig();

    try {
      // Discover resources in parallel
      const [computeInstances, storageBuckets, databases, gkeClusters] = await Promise.all([
        discoverGCEInstances(config, filters),
        discoverStorageBuckets(config, filters),
        discoverCloudSQLInstances(config, filters),
        discoverGKEClusters(config, filters),
      ]);

      // Count resources by type
      const resourcesByType: Record<string, number> = {
        compute: computeInstances.length,
        storage: storageBuckets.length,
        database: databases.length,
        container: gkeClusters.length,
        network: 0,
        security: 0,
        serverless: 0,
        analytics: 0,
      };

      // Calculate total cost
      let totalCost = 0;
      if (filters?.includeCosts) {
        const allResources = [
          ...computeInstances,
          ...storageBuckets,
          ...databases,
          ...gkeClusters,
        ];
        totalCost = allResources.reduce(
          (sum, resource) => sum + (resource.costToDate || 0),
          0
        );
      }

      return {
        provider: CloudProvider.GOOGLE_CLOUD,
        region: config.projectId, // Use project ID as region for GCP
        totalResources:
          computeInstances.length +
          storageBuckets.length +
          databases.length +
          gkeClusters.length,
        resourcesByType,
        totalCost,
        resources: {
          compute: computeInstances,
          storage: storageBuckets,
          database: databases,
          network: [],
          container: gkeClusters,
        },
        lastUpdated: new Date(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get resource inventory: ${error.message}\n\n` +
          `Common issues:\n` +
          `1. Ensure required APIs are enabled (Compute, Storage, SQL Admin)\n` +
          `2. Verify credentials have necessary permissions\n` +
          `3. Check project ID is correct: ${config.projectId}`
      );
    }
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
   * List all accessible GCP projects
   * Useful for discovering projects available to current credentials
   */
  async listAccessibleProjects(options?: {
    activeOnly?: boolean;
  }): Promise<Array<{
    projectId: string;
    projectNumber: string;
    name: string;
    state: string;
    labels?: Record<string, string>;
  }>> {
    const config = await this.initializeConfig();
    return listProjects(config, options);
  }

  /**
   * Get account info for multiple projects
   * Useful for multi-project cost aggregation
   */
  async getMultiProjectInfo(projectIds: string[]): Promise<
    Array<{
      projectId: string;
      projectNumber: string;
      projectName: string;
      state: string;
      labels?: Record<string, string>;
      error?: string;
    }>
  > {
    const config = await this.initializeConfig();
    return getMultipleProjects(config, projectIds);
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
