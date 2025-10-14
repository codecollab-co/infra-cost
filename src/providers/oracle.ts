import { CloudProviderAdapter, ProviderConfig, AccountInfo, RawCostData, CostBreakdown, CloudProvider } from '../types/providers';
import { showSpinner } from '../logger';

export class OracleCloudProvider extends CloudProviderAdapter {
  constructor(config: ProviderConfig) {
    super(config);
  }

  async validateCredentials(): Promise<boolean> {
    // TODO: Implement Oracle Cloud credential validation
    // This would typically use Oracle Cloud SDK or REST API
    console.warn('Oracle Cloud credential validation not yet implemented');
    return false;
  }

  async getAccountInfo(): Promise<AccountInfo> {
    showSpinner('Getting Oracle Cloud tenancy information');

    try {
      // TODO: Implement Oracle Cloud tenancy information retrieval
      // This would use the Oracle Cloud Identity API
      throw new Error('Oracle Cloud integration not yet implemented. Please use AWS for now.');
    } catch (error) {
      throw new Error(`Failed to get Oracle Cloud tenancy information: ${error.message}`);
    }
  }

  async getRawCostData(): Promise<RawCostData> {
    showSpinner('Getting Oracle Cloud usage data');

    try {
      // TODO: Implement Oracle Cloud Usage API integration
      // This would use the Oracle Cloud Usage and Cost Management APIs
      // Example endpoints:
      // - /20200107/usage
      // - /20200107/usageCosts
      throw new Error('Oracle Cloud cost analysis not yet implemented. Please use AWS for now.');
    } catch (error) {
      throw new Error(`Failed to get Oracle Cloud cost data: ${error.message}`);
    }
  }

  async getCostBreakdown(): Promise<CostBreakdown> {
    const rawCostData = await this.getRawCostData();
    return this.calculateServiceTotals(rawCostData);
  }

  // Helper method to validate Oracle Cloud-specific configuration
  static validateOracleCloudConfig(config: ProviderConfig): boolean {
    // Oracle Cloud typically uses:
    // - API Key authentication (user OCID, tenancy OCID, private key)
    // - Instance Principal (for compute instances)
    // - Resource Principal (for functions and other resources)
    const requiredFields = ['userId', 'tenancyId', 'fingerprint', 'privateKeyPath'];

    for (const field of requiredFields) {
      if (!config.credentials[field]) {
        return false;
      }
    }

    return true;
  }

  // Helper method to get required credential fields for Oracle Cloud
  static getRequiredCredentials(): string[] {
    return [
      'userId',        // User OCID
      'tenancyId',     // Tenancy OCID
      'fingerprint',   // Public key fingerprint
      'privateKeyPath', // Path to private key file
      // Optional: 'region', 'passphrase'
    ];
  }
}