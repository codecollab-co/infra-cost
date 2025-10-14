export enum CloudProvider {
  AWS = 'aws',
  GOOGLE_CLOUD = 'gcp',
  AZURE = 'azure',
  ALIBABA_CLOUD = 'alicloud',
  ORACLE_CLOUD = 'oracle'
}

export interface ProviderCredentials {
  [key: string]: string | undefined;
}

export interface CostBreakdown {
  totals: {
    lastMonth: number;
    thisMonth: number;
    last7Days: number;
    yesterday: number;
  };
  totalsByService: {
    lastMonth: { [key: string]: number };
    thisMonth: { [key: string]: number };
    last7Days: { [key: string]: number };
    yesterday: { [key: string]: number };
  };
}

export interface RawCostData {
  [serviceName: string]: {
    [date: string]: number;
  };
}

export interface ProviderConfig {
  provider: CloudProvider;
  credentials: ProviderCredentials;
  region?: string;
  profile?: string;
}

export interface AccountInfo {
  id: string;
  name?: string;
  provider: CloudProvider;
}

export abstract class CloudProviderAdapter {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract getAccountInfo(): Promise<AccountInfo>;
  abstract getRawCostData(): Promise<RawCostData>;
  abstract getCostBreakdown(): Promise<CostBreakdown>;
  abstract validateCredentials(): Promise<boolean>;

  protected calculateServiceTotals(rawCostData: RawCostData): CostBreakdown {
    // This will be implemented by the base class
    // Common logic for all providers
    return this.processRawCostData(rawCostData);
  }

  private processRawCostData(rawCostData: RawCostData): CostBreakdown {
    const totals = {
      lastMonth: 0,
      thisMonth: 0,
      last7Days: 0,
      yesterday: 0,
    };

    const totalsByService = {
      lastMonth: {},
      thisMonth: {},
      last7Days: {},
      yesterday: {},
    };

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7DaysStart = new Date(now);
    last7DaysStart.setDate(last7DaysStart.getDate() - 7);

    for (const [serviceName, serviceCosts] of Object.entries(rawCostData)) {
      let lastMonthServiceTotal = 0;
      let thisMonthServiceTotal = 0;
      let last7DaysServiceTotal = 0;
      let yesterdayServiceTotal = 0;

      for (const [dateStr, cost] of Object.entries(serviceCosts)) {
        const date = new Date(dateStr);

        // Last month
        if (date >= startOfLastMonth && date <= endOfLastMonth) {
          lastMonthServiceTotal += cost;
        }

        // This month
        if (date >= startOfThisMonth) {
          thisMonthServiceTotal += cost;
        }

        // Last 7 days
        if (date >= last7DaysStart && date < yesterday) {
          last7DaysServiceTotal += cost;
        }

        // Yesterday
        if (date.toDateString() === yesterday.toDateString()) {
          yesterdayServiceTotal += cost;
        }
      }

      totalsByService.lastMonth[serviceName] = lastMonthServiceTotal;
      totalsByService.thisMonth[serviceName] = thisMonthServiceTotal;
      totalsByService.last7Days[serviceName] = last7DaysServiceTotal;
      totalsByService.yesterday[serviceName] = yesterdayServiceTotal;

      totals.lastMonth += lastMonthServiceTotal;
      totals.thisMonth += thisMonthServiceTotal;
      totals.last7Days += last7DaysServiceTotal;
      totals.yesterday += yesterdayServiceTotal;
    }

    return {
      totals,
      totalsByService,
    };
  }
}

export interface ProviderFactory {
  createProvider(config: ProviderConfig): CloudProviderAdapter;
  getSupportedProviders(): CloudProvider[];
  validateProviderConfig(config: ProviderConfig): boolean;
}