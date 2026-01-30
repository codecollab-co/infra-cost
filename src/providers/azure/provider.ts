/**
 * Azure Cloud Provider
 *
 * Main provider class for Azure cloud platform integration.
 * Implements the CloudProviderAdapter interface.
 */

import { CloudProviderAdapter, ProviderConfig } from '../../types/providers';
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
  async getAccountInfo(): Promise<{
    accountId: string;
    accountName: string;
    subscriptions?: number;
  }> {
    try {
      const subscriptions = await listSubscriptions(this.azureConfig);

      return {
        accountId: this.azureConfig.subscriptionId || this.azureConfig.tenantId || 'unknown',
        accountName: subscriptions[0]?.displayName || 'Azure Account',
        subscriptions: subscriptions.length,
      };
    } catch (error) {
      console.error('Failed to get Azure account info:', error);
      return {
        accountId: this.azureConfig.subscriptionId || 'unknown',
        accountName: 'Azure Account',
        subscriptions: 0,
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
}
