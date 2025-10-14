import AWS from 'aws-sdk';
import dayjs from 'dayjs';
import { CloudProviderAdapter, ProviderConfig, AccountInfo, RawCostData, CostBreakdown, CloudProvider } from '../types/providers';
import { showSpinner } from '../logger';

export class AWSProvider extends CloudProviderAdapter {
  private awsConfig: AWS.Config;

  constructor(config: ProviderConfig) {
    super(config);
    this.initializeAWSConfig();
  }

  private initializeAWSConfig(): void {
    this.awsConfig = new AWS.Config({
      accessKeyId: this.config.credentials.accessKeyId,
      secretAccessKey: this.config.credentials.secretAccessKey,
      sessionToken: this.config.credentials.sessionToken,
      region: this.config.region || 'us-east-1'
    });
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const sts = new AWS.STS(this.awsConfig);
      await sts.getCallerIdentity().promise();
      return true;
    } catch {
      return false;
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    showSpinner('Getting AWS account information');

    try {
      const iam = new AWS.IAM(this.awsConfig);
      const accountAliases = await iam.listAccountAliases().promise();
      const foundAlias = accountAliases?.AccountAliases?.[0];

      if (foundAlias) {
        return {
          id: foundAlias,
          name: foundAlias,
          provider: CloudProvider.AWS
        };
      }

      const sts = new AWS.STS(this.awsConfig);
      const accountInfo = await sts.getCallerIdentity().promise();

      return {
        id: accountInfo.Account || 'unknown',
        name: accountInfo.Account || 'unknown',
        provider: CloudProvider.AWS
      };
    } catch (error) {
      throw new Error(`Failed to get AWS account information: ${error.message}`);
    }
  }

  async getRawCostData(): Promise<RawCostData> {
    showSpinner('Getting AWS pricing data');

    try {
      const costExplorer = new AWS.CostExplorer(this.awsConfig);
      const endDate = dayjs().subtract(1, 'day');
      const startDate = endDate.subtract(65, 'day');

      const pricingData = await costExplorer
        .getCostAndUsage({
          TimePeriod: {
            Start: startDate.format('YYYY-MM-DD'),
            End: endDate.format('YYYY-MM-DD'),
          },
          Granularity: 'DAILY',
          Filter: {
            Not: {
              Dimensions: {
                Key: 'RECORD_TYPE',
                Values: ['Credit', 'Refund', 'Upfront', 'Support'],
              },
            },
          },
          Metrics: ['UnblendedCost'],
          GroupBy: [
            {
              Type: 'DIMENSION',
              Key: 'SERVICE',
            },
          ],
        })
        .promise();

      const costByService: RawCostData = {};

      for (const day of pricingData.ResultsByTime || []) {
        for (const group of day.Groups || []) {
          const serviceName = group.Keys?.[0];
          const cost = group.Metrics?.UnblendedCost?.Amount;
          const costDate = day.TimePeriod?.End;

          if (serviceName && cost && costDate) {
            costByService[serviceName] = costByService[serviceName] || {};
            costByService[serviceName][costDate] = parseFloat(cost);
          }
        }
      }

      return costByService;
    } catch (error) {
      throw new Error(`Failed to get AWS cost data: ${error.message}`);
    }
  }

  async getCostBreakdown(): Promise<CostBreakdown> {
    const rawCostData = await this.getRawCostData();
    return this.calculateServiceTotals(rawCostData);
  }

  static createFromLegacyConfig(legacyConfig: {
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken?: string;
    };
    region: string;
  }): AWSProvider {
    const config: ProviderConfig = {
      provider: CloudProvider.AWS,
      credentials: {
        accessKeyId: legacyConfig.credentials.accessKeyId,
        secretAccessKey: legacyConfig.credentials.secretAccessKey,
        sessionToken: legacyConfig.credentials.sessionToken,
      },
      region: legacyConfig.region
    };

    return new AWSProvider(config);
  }
}