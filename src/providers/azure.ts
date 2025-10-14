import { CloudProviderAdapter, ProviderConfig, AccountInfo, RawCostData, CostBreakdown, CloudProvider } from '../types/providers';
import { showSpinner } from '../logger';

export class AzureProvider extends CloudProviderAdapter {
  constructor(config: ProviderConfig) {
    super(config);
  }

  async validateCredentials(): Promise<boolean> {
    // TODO: Implement Azure credential validation
    // This would typically use Azure SDK or REST API
    console.warn('Azure credential validation not yet implemented');
    return false;
  }

  async getAccountInfo(): Promise<AccountInfo> {
    showSpinner('Getting Azure subscription information');

    try {
      // TODO: Implement Azure subscription information retrieval
      // This would use the Azure Resource Manager API
      // GET https://management.azure.com/subscriptions/{subscriptionId}
      throw new Error('Azure integration not yet implemented. Please use AWS for now.');
    } catch (error) {
      throw new Error(`Failed to get Azure subscription information: ${error.message}`);
    }
  }

  async getRawCostData(): Promise<RawCostData> {
    showSpinner('Getting Azure cost data');

    try {
      // TODO: Implement Azure Cost Management API integration
      // This would use the Azure Cost Management and Billing APIs
      // Example endpoints:
      // - /subscriptions/{subscriptionId}/providers/Microsoft.CostManagement/query
      // - /subscriptions/{subscriptionId}/providers/Microsoft.Consumption/usageDetails
      throw new Error('Azure cost analysis not yet implemented. Please use AWS for now.');
    } catch (error) {
      throw new Error(`Failed to get Azure cost data: ${error.message}`);
    }
  }

  async getCostBreakdown(): Promise<CostBreakdown> {
    const rawCostData = await this.getRawCostData();
    return this.calculateServiceTotals(rawCostData);
  }

  // Helper method to validate Azure-specific configuration
  static validateAzureConfig(config: ProviderConfig): boolean {
    // Azure typically uses:
    // - Service Principal (clientId, clientSecret, tenantId)
    // - Managed Identity
    // - Azure CLI authentication
    const requiredFields = ['subscriptionId', 'tenantId', 'clientId', 'clientSecret'];

    for (const field of requiredFields) {
      if (!config.credentials[field]) {
        return false;
      }
    }

    return true;
  }

  // Helper method to get required credential fields for Azure
  static getRequiredCredentials(): string[] {
    return [
      'subscriptionId',
      'tenantId',
      'clientId',
      'clientSecret'
    ];
  }
}