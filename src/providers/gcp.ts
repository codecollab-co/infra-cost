import { CloudProviderAdapter, ProviderConfig, AccountInfo, RawCostData, CostBreakdown, CloudProvider } from '../types/providers';
import { showSpinner } from '../logger';

export class GCPProvider extends CloudProviderAdapter {
  constructor(config: ProviderConfig) {
    super(config);
  }

  async validateCredentials(): Promise<boolean> {
    // TODO: Implement GCP credential validation
    // This would typically use Google Cloud SDK or REST API
    console.warn('GCP credential validation not yet implemented');
    return false;
  }

  async getAccountInfo(): Promise<AccountInfo> {
    showSpinner('Getting GCP project information');

    try {
      // TODO: Implement GCP project information retrieval
      // This would use the Google Cloud Resource Manager API
      throw new Error('GCP integration not yet implemented. Please use AWS for now.');
    } catch (error) {
      throw new Error(`Failed to get GCP project information: ${error.message}`);
    }
  }

  async getRawCostData(): Promise<RawCostData> {
    showSpinner('Getting GCP billing data');

    try {
      // TODO: Implement GCP Cloud Billing API integration
      // This would use the Google Cloud Billing API to get cost data
      // Example endpoints:
      // - projects/{project}/billingInfo
      // - billingAccounts/{account}/projects/{project}/billingInfo
      throw new Error('GCP cost analysis not yet implemented. Please use AWS for now.');
    } catch (error) {
      throw new Error(`Failed to get GCP cost data: ${error.message}`);
    }
  }

  async getCostBreakdown(): Promise<CostBreakdown> {
    const rawCostData = await this.getRawCostData();
    return this.calculateServiceTotals(rawCostData);
  }

  // Helper method to validate GCP-specific configuration
  static validateGCPConfig(config: ProviderConfig): boolean {
    // GCP typically uses:
    // - Service account key (JSON file path or content)
    // - Application Default Credentials
    // - OAuth 2.0 client credentials
    const requiredFields = ['projectId'];

    for (const field of requiredFields) {
      if (!config.credentials[field]) {
        return false;
      }
    }

    return true;
  }

  // Helper method to get required credential fields for GCP
  static getRequiredCredentials(): string[] {
    return [
      'projectId',
      'keyFilePath', // Path to service account JSON file
      // Alternative: 'serviceAccountKey' for JSON content
    ];
  }
}