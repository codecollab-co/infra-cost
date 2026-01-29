/**
 * AWS Organizations Support
 * Issue #10: Add support for AWS Organizations
 *
 * Enables cost analysis across all accounts in an AWS Organization,
 * with consolidated reporting and Slack notifications.
 */

import { EventEmitter } from 'events';

/**
 * Formats a Date object to YYYY-MM-DD string using local timezone components
 * Avoids timezone offset issues that occur with toISOString()
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// AWS Organizations Account
export interface OrganizationAccount {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_CLOSURE';
  joinedMethod: 'INVITED' | 'CREATED';
  joinedTimestamp?: Date;
  arn: string;
  parentId?: string;
  tags?: Record<string, string>;
}

// Organizational Unit (OU)
export interface OrganizationalUnit {
  id: string;
  name: string;
  arn: string;
  parentId: string;
  accounts: OrganizationAccount[];
  children: OrganizationalUnit[];
}

// Organization Structure
export interface OrganizationStructure {
  id: string;
  arn: string;
  masterAccountId: string;
  masterAccountEmail: string;
  featureSet: 'ALL' | 'CONSOLIDATED_BILLING';
  rootId: string;
  organizationalUnits: OrganizationalUnit[];
  accounts: OrganizationAccount[];
  totalAccounts: number;
}

// Account Cost Summary
export interface AccountCostSummary {
  accountId: string;
  accountName: string;
  currentMonthCost: number;
  previousMonthCost: number;
  costChange: number;
  costChangePercent: number;
  trend: 'up' | 'down' | 'stable';
  topServices: ServiceCost[];
  forecastedMonthEnd?: number;
}

// Service Cost
export interface ServiceCost {
  service: string;
  cost: number;
  percentage: number;
}

// Organization Cost Report
export interface OrganizationCostReport {
  organization: {
    id: string;
    masterAccountId: string;
    totalAccounts: number;
  };
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  summary: {
    totalCurrentMonth: number;
    totalPreviousMonth: number;
    totalChange: number;
    totalChangePercent: number;
    trend: 'up' | 'down' | 'stable';
    forecastedMonthEnd: number;
  };
  accountCosts: AccountCostSummary[];
  costByOU: Record<string, { name: string; cost: number; accountCount: number }>;
  topSpenders: AccountCostSummary[];
  alerts: CostAlert[];
  generatedAt: Date;
}

// Cost Alert
export interface CostAlert {
  type: 'spike' | 'anomaly' | 'budget_exceeded' | 'forecast_warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  accountId: string;
  accountName: string;
  message: string;
  value: number;
  threshold?: number;
}

// Organizations Configuration
export interface OrganizationsConfig {
  masterAccountProfile?: string;
  includeInactiveAccounts: boolean;
  excludeAccountIds?: string[];
  includeAccountIds?: string[];
  assumeRoleName?: string;
  costExplorerRegion: string;
  alertThresholds: {
    spikePercent: number;      // Alert if cost increases by this %
    budgetPercent: number;     // Alert if forecast exceeds budget by this %
    anomalyThreshold: number;  // Standard deviations for anomaly detection
  };
}

// Default Configuration
const DEFAULT_CONFIG: OrganizationsConfig = {
  includeInactiveAccounts: false,
  assumeRoleName: 'OrganizationAccountAccessRole',
  costExplorerRegion: 'us-east-1',
  alertThresholds: {
    spikePercent: 20,
    budgetPercent: 90,
    anomalyThreshold: 2,
  },
};

/**
 * AWS Organizations Manager
 */
export class AWSOrganizationsManager extends EventEmitter {
  private config: OrganizationsConfig;
  private organizationsClient: any;
  private costExplorerClient: any;

  constructor(config: Partial<OrganizationsConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize AWS clients
   */
  async initialize(credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    region?: string;
  }): Promise<void> {
    try {
      // Dynamic import of AWS SDK
      const { OrganizationsClient, ListAccountsCommand, DescribeOrganizationCommand, ListRootsCommand, ListOrganizationalUnitsForParentCommand } = await import('@aws-sdk/client-organizations');
      const { CostExplorerClient, GetCostAndUsageCommand } = await import('@aws-sdk/client-cost-explorer');

      // Determine AWS partition and Organizations endpoint region
      // AWS Organizations is a global service with fixed endpoints per partition:
      // - Commercial (aws): us-east-1
      // - GovCloud (aws-us-gov): us-gov-west-1
      // - China (aws-cn): cn-northwest-1
      const region = credentials?.region || this.config.costExplorerRegion || 'us-east-1';
      let organizationsRegion = 'us-east-1'; // Default to commercial

      if (region.startsWith('us-gov-')) {
        organizationsRegion = 'us-gov-west-1';
      } else if (region.startsWith('cn-')) {
        organizationsRegion = 'cn-northwest-1';
      }

      // Config for Organizations client (must use partition-specific fixed region)
      const clientConfig: any = {
        region: organizationsRegion,
      };

      if (credentials?.accessKeyId && credentials?.secretAccessKey) {
        clientConfig.credentials = {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        };
      }

      // Config for Cost Explorer client (must use us-east-1)
      const costExplorerConfig: any = {
        region: this.config.costExplorerRegion, // Force us-east-1
      };

      if (credentials?.accessKeyId && credentials?.secretAccessKey) {
        costExplorerConfig.credentials = {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken,
        };
      }

      this.organizationsClient = new OrganizationsClient(clientConfig);
      this.costExplorerClient = new CostExplorerClient(costExplorerConfig);

      this.emit('initialized');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Get organization structure
   */
  async getOrganizationStructure(): Promise<OrganizationStructure> {
    const { DescribeOrganizationCommand, ListAccountsCommand, ListRootsCommand } = await import('@aws-sdk/client-organizations');

    // Get organization details
    const orgResponse = await this.organizationsClient.send(new DescribeOrganizationCommand({}));
    const organization = orgResponse.Organization;

    // Get root
    const rootsResponse = await this.organizationsClient.send(new ListRootsCommand({}));
    const rootId = rootsResponse.Roots?.[0]?.Id || '';

    // Get all accounts
    const accounts = await this.listAllAccounts();

    // Filter accounts based on configuration
    const filteredAccounts = this.filterAccounts(accounts);

    return {
      id: organization.Id,
      arn: organization.Arn,
      masterAccountId: organization.MasterAccountId,
      masterAccountEmail: organization.MasterAccountEmail,
      featureSet: organization.FeatureSet,
      rootId,
      organizationalUnits: [], // Would need recursive fetching
      accounts: filteredAccounts,
      totalAccounts: filteredAccounts.length,
    };
  }

  /**
   * List all accounts in the organization
   */
  private async listAllAccounts(): Promise<OrganizationAccount[]> {
    const { ListAccountsCommand } = await import('@aws-sdk/client-organizations');
    const accounts: OrganizationAccount[] = [];
    let nextToken: string | undefined;

    do {
      const response = await this.organizationsClient.send(
        new ListAccountsCommand({ NextToken: nextToken })
      );

      for (const account of response.Accounts || []) {
        accounts.push({
          id: account.Id,
          name: account.Name,
          email: account.Email,
          status: account.Status,
          joinedMethod: account.JoinedMethod,
          joinedTimestamp: account.JoinedTimestamp ? new Date(account.JoinedTimestamp) : undefined,
          arn: account.Arn,
        });
      }

      nextToken = response.NextToken;
    } while (nextToken);

    return accounts;
  }

  /**
   * Filter accounts based on configuration
   */
  private filterAccounts(accounts: OrganizationAccount[]): OrganizationAccount[] {
    return accounts.filter(account => {
      // Filter by status
      if (!this.config.includeInactiveAccounts && account.status !== 'ACTIVE') {
        return false;
      }

      // Filter by include list first (if specified, it takes precedence)
      if (this.config.includeAccountIds && this.config.includeAccountIds.length > 0) {
        return this.config.includeAccountIds.includes(account.id);
      }

      // Filter by exclude list (only applies if no include list is specified)
      if (this.config.excludeAccountIds?.includes(account.id)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get cost data for all accounts
   */
  async getOrganizationCosts(): Promise<OrganizationCostReport> {
    const structure = await this.getOrganizationStructure();
    const accountCosts: AccountCostSummary[] = [];
    const alerts: CostAlert[] = [];

    // Date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // Cost Explorer End is exclusive, so use the first day of current month
    const previousMonthEnd = currentMonthStart;

    // Get costs for each account
    for (const account of structure.accounts) {
      try {
        const costSummary = await this.getAccountCostSummary(
          account,
          currentMonthStart,
          now,
          previousMonthStart,
          previousMonthEnd
        );
        accountCosts.push(costSummary);

        // Check for alerts
        const accountAlerts = this.checkForAlerts(costSummary);
        alerts.push(...accountAlerts);

        this.emit('accountProcessed', account.id, costSummary);
      } catch (error) {
        this.emit('accountError', account.id, error);
        // Add placeholder with zero costs
        accountCosts.push({
          accountId: account.id,
          accountName: account.name,
          currentMonthCost: 0,
          previousMonthCost: 0,
          costChange: 0,
          costChangePercent: 0,
          trend: 'stable',
          topServices: [],
        });
      }
    }

    // Calculate totals
    const totalCurrentMonth = accountCosts.reduce((sum, a) => sum + a.currentMonthCost, 0);
    const totalPreviousMonth = accountCosts.reduce((sum, a) => sum + a.previousMonthCost, 0);
    const totalChange = totalCurrentMonth - totalPreviousMonth;
    const totalChangePercent = totalPreviousMonth > 0
      ? (totalChange / totalPreviousMonth) * 100
      : 0;

    // Forecast (simple linear projection)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const forecastedMonthEnd = (totalCurrentMonth / dayOfMonth) * daysInMonth;

    // Sort by cost to get top spenders
    const topSpenders = [...accountCosts]
      .sort((a, b) => b.currentMonthCost - a.currentMonthCost)
      .slice(0, 10);

    // Group costs by OU (simplified - would need actual OU data)
    const costByOU: Record<string, { name: string; cost: number; accountCount: number }> = {
      'root': {
        name: 'Organization Root',
        cost: totalCurrentMonth,
        accountCount: accountCosts.length,
      },
    };

    return {
      organization: {
        id: structure.id,
        masterAccountId: structure.masterAccountId,
        totalAccounts: structure.totalAccounts,
      },
      period: {
        start: currentMonthStart,
        end: now,
        label: `${currentMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} MTD`,
      },
      summary: {
        totalCurrentMonth,
        totalPreviousMonth,
        totalChange,
        totalChangePercent,
        trend: totalChangePercent > 2 ? 'up' : totalChangePercent < -2 ? 'down' : 'stable',
        forecastedMonthEnd,
      },
      accountCosts,
      costByOU,
      topSpenders,
      alerts,
      generatedAt: new Date(),
    };
  }

  /**
   * Get cost summary for a single account
   */
  private async getAccountCostSummary(
    account: OrganizationAccount,
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
  ): Promise<AccountCostSummary> {
    const { GetCostAndUsageCommand } = await import('@aws-sdk/client-cost-explorer');

    // Get current month costs
    const currentCostResponse = await this.costExplorerClient.send(
      new GetCostAndUsageCommand({
        TimePeriod: {
          Start: formatLocalDate(currentStart),
          End: formatLocalDate(currentEnd),
        },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost'],
        Filter: {
          Dimensions: {
            Key: 'LINKED_ACCOUNT',
            Values: [account.id],
          },
        },
        GroupBy: [
          { Type: 'DIMENSION', Key: 'SERVICE' },
        ],
      })
    );

    // Get previous month costs
    const previousCostResponse = await this.costExplorerClient.send(
      new GetCostAndUsageCommand({
        TimePeriod: {
          Start: formatLocalDate(previousStart),
          End: formatLocalDate(previousEnd),
        },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost'],
        Filter: {
          Dimensions: {
            Key: 'LINKED_ACCOUNT',
            Values: [account.id],
          },
        },
      })
    );

    // Parse current month costs and top services
    let currentMonthCost = 0;
    const serviceCosts: ServiceCost[] = [];

    for (const result of currentCostResponse.ResultsByTime || []) {
      for (const group of result.Groups || []) {
        const service = group.Keys?.[0] || 'Unknown';
        const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
        currentMonthCost += cost;
        serviceCosts.push({ service, cost, percentage: 0 });
      }
    }

    // Calculate service percentages
    for (const sc of serviceCosts) {
      sc.percentage = currentMonthCost > 0 ? (sc.cost / currentMonthCost) * 100 : 0;
    }

    // Sort and get top 5 services
    const topServices = serviceCosts
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    // Parse previous month cost
    let previousMonthCost = 0;
    for (const result of previousCostResponse.ResultsByTime || []) {
      previousMonthCost += parseFloat(result.Total?.UnblendedCost?.Amount || '0');
    }

    // Calculate change
    const costChange = currentMonthCost - previousMonthCost;
    const costChangePercent = previousMonthCost > 0
      ? (costChange / previousMonthCost) * 100
      : 0;

    // Forecast
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const forecastedMonthEnd = dayOfMonth > 0 ? (currentMonthCost / dayOfMonth) * daysInMonth : 0;

    return {
      accountId: account.id,
      accountName: account.name,
      currentMonthCost,
      previousMonthCost,
      costChange,
      costChangePercent,
      trend: costChangePercent > 5 ? 'up' : costChangePercent < -5 ? 'down' : 'stable',
      topServices,
      forecastedMonthEnd,
    };
  }

  /**
   * Check for cost alerts
   */
  private checkForAlerts(summary: AccountCostSummary): CostAlert[] {
    const alerts: CostAlert[] = [];

    // Check for cost spike
    if (summary.costChangePercent > this.config.alertThresholds.spikePercent) {
      alerts.push({
        type: 'spike',
        severity: summary.costChangePercent > 50 ? 'high' : 'medium',
        accountId: summary.accountId,
        accountName: summary.accountName,
        message: `Cost increased by ${summary.costChangePercent.toFixed(1)}% compared to last month`,
        value: summary.costChangePercent,
        threshold: this.config.alertThresholds.spikePercent,
      });
    }

    return alerts;
  }

  /**
   * Generate Slack message for organization costs
   */
  formatSlackMessage(report: OrganizationCostReport): object {
    const trendEmoji = report.summary.trend === 'up' ? '📈' : report.summary.trend === 'down' ? '📉' : '➡️';
    const changeSign = report.summary.totalChange >= 0 ? '+' : '';

    const blocks: any[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '☁️ AWS Organization Cost Report',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Period:* ${report.period.label}\n*Total Accounts:* ${report.organization.totalAccounts}`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Current Month (MTD)*\n$${report.summary.totalCurrentMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
          {
            type: 'mrkdwn',
            text: `*Previous Month*\n$${report.summary.totalPreviousMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
          {
            type: 'mrkdwn',
            text: `*Change ${trendEmoji}*\n${changeSign}$${report.summary.totalChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${changeSign}${report.summary.totalChangePercent.toFixed(1)}%)`,
          },
          {
            type: 'mrkdwn',
            text: `*Forecasted Month-End*\n$${report.summary.forecastedMonthEnd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Top 5 Spending Accounts:*',
        },
      },
    ];

    // Add top spenders
    const topSpendersText = report.topSpenders.length > 0
      ? report.topSpenders
          .slice(0, 5)
          .map((account, index) => {
            const trend = account.trend === 'up' ? '🔺' : account.trend === 'down' ? '🔻' : '➡️';
            return `${index + 1}. *${account.accountName}* (${account.accountId})\n    $${account.currentMonthCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${trend} ${account.costChangePercent >= 0 ? '+' : ''}${account.costChangePercent.toFixed(1)}%`;
          })
          .join('\n')
      : '_No accounts matched the filters for this period._';

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: topSpendersText,
      },
    });

    // Add alerts if any
    if (report.alerts.length > 0) {
      blocks.push({
        type: 'divider',
      });
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*⚠️ Alerts:*',
        },
      });

      const alertsText = report.alerts
        .slice(0, 5)
        .map(alert => {
          const severityEmoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢';
          return `${severityEmoji} *${alert.accountName}*: ${alert.message}`;
        })
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: alertsText,
        },
      });
    }

    // Footer
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Generated by infra-cost | ${report.generatedAt.toISOString()}`,
        },
      ],
    });

    // Build plain-text fallback summary
    const topSpendersSnippet = report.topSpenders.length > 0
      ? report.topSpenders
          .slice(0, 3)
          .map(a => `${a.accountName}: $${a.currentMonthCost.toFixed(2)}`)
          .join(', ')
      : 'none';

    const alertsSnippet = report.alerts.length > 0
      ? ` | ${report.alerts.length} alert${report.alerts.length > 1 ? 's' : ''}`
      : '';

    const summaryText = `${report.period.label}: $${report.summary.totalCurrentMonth.toFixed(2)} (${changeSign}${report.summary.totalChangePercent.toFixed(1)}% ${trendEmoji}) | Top spenders: ${topSpendersSnippet}${alertsSnippet}`;

    return { text: summaryText, blocks };
  }
}

/**
 * Format organization cost report for CLI display
 */
export function formatOrganizationReport(report: OrganizationCostReport): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push('═'.repeat(80));
  lines.push('  AWS ORGANIZATION COST REPORT');
  lines.push('═'.repeat(80));
  lines.push(`  Organization ID: ${report.organization.id}`);
  lines.push(`  Master Account: ${report.organization.masterAccountId}`);
  lines.push(`  Total Accounts: ${report.organization.totalAccounts}`);
  lines.push(`  Period: ${report.period.label}`);
  lines.push('');

  // Summary
  const trendIcon = report.summary.trend === 'up' ? '↗' : report.summary.trend === 'down' ? '↘' : '→';
  const changeSign = report.summary.totalChange >= 0 ? '+' : '';

  lines.push('COST SUMMARY');
  lines.push('─'.repeat(80));
  lines.push(`  Current Month (MTD):    $${report.summary.totalCurrentMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  lines.push(`  Previous Month:         $${report.summary.totalPreviousMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  lines.push(`  Change:                 ${changeSign}$${report.summary.totalChange.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${changeSign}${report.summary.totalChangePercent.toFixed(1)}%) ${trendIcon}`);
  lines.push(`  Forecasted Month-End:   $${report.summary.forecastedMonthEnd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  lines.push('');

  // Top Spenders
  lines.push('TOP SPENDING ACCOUNTS');
  lines.push('─'.repeat(80));
  lines.push('');
  lines.push('  #  │ Account Name                    │ Account ID    │ Current MTD   │ Change');
  lines.push(' ────┼─────────────────────────────────┼───────────────┼───────────────┼────────');

  report.topSpenders.slice(0, 10).forEach((account, index) => {
    const name = account.accountName.length > 29
      ? account.accountName.substring(0, 26) + '...'
      : account.accountName.padEnd(29);
    const id = account.accountId.padEnd(13);
    const cost = `$${account.currentMonthCost.toFixed(2)}`.padStart(12);
    const change = `${account.costChangePercent >= 0 ? '+' : ''}${account.costChangePercent.toFixed(1)}%`;
    const trendIcon = account.trend === 'up' ? '↗' : account.trend === 'down' ? '↘' : '→';

    lines.push(` ${(index + 1).toString().padStart(2)}  │ ${name} │ ${id} │ ${cost} │ ${trendIcon} ${change}`);
  });

  lines.push(' ────┴─────────────────────────────────┴───────────────┴───────────────┴────────');
  lines.push('');

  // Alerts
  if (report.alerts.length > 0) {
    lines.push('ALERTS');
    lines.push('─'.repeat(80));

    for (const alert of report.alerts.slice(0, 10)) {
      const severityIcon = alert.severity === 'critical' ? '🚨' : alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢';
      lines.push(`  ${severityIcon} [${alert.type.toUpperCase()}] ${alert.accountName}: ${alert.message}`);
    }
    lines.push('');
  }

  // All Accounts Summary
  lines.push('ALL ACCOUNTS');
  lines.push('─'.repeat(80));
  lines.push('');

  // Group by cost ranges
  const ranges = [
    { label: '$10,000+', min: 10000, accounts: [] as AccountCostSummary[] },
    { label: '$1,000 - $10,000', min: 1000, max: 10000, accounts: [] as AccountCostSummary[] },
    { label: '$100 - $1,000', min: 100, max: 1000, accounts: [] as AccountCostSummary[] },
    { label: '$0 - $100', min: 0, max: 100, accounts: [] as AccountCostSummary[] },
  ];

  for (const account of report.accountCosts) {
    for (const range of ranges) {
      if (account.currentMonthCost >= range.min && (!range.max || account.currentMonthCost < range.max)) {
        range.accounts.push(account);
        break;
      }
    }
  }

  for (const range of ranges) {
    if (range.accounts.length > 0) {
      const totalCost = range.accounts.reduce((sum, a) => sum + a.currentMonthCost, 0);
      lines.push(`  ${range.label}: ${range.accounts.length} accounts ($${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total)`);
    }
  }

  lines.push('');
  lines.push('─'.repeat(80));
  lines.push(`  Generated: ${report.generatedAt.toISOString()}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Export organization report to CSV
 */
export function exportOrganizationReportCsv(report: OrganizationCostReport): string {
  const lines: string[] = [];

  // Header
  lines.push('Account ID,Account Name,Current Month (MTD),Previous Month,Change ($),Change (%),Trend,Top Service');

  // Data rows
  for (const account of report.accountCosts) {
    const topService = account.topServices[0]?.service || 'N/A';
    lines.push([
      account.accountId,
      `"${account.accountName.replace(/"/g, '""')}"`,
      account.currentMonthCost.toFixed(2),
      account.previousMonthCost.toFixed(2),
      account.costChange.toFixed(2),
      account.costChangePercent.toFixed(2),
      account.trend,
      `"${topService}"`,
    ].join(','));
  }

  return lines.join('\n');
}

/**
 * Create a simple daily summary for Slack
 */
export function formatDailySummary(report: OrganizationCostReport): string {
  const trendEmoji = report.summary.trend === 'up' ? '📈' : report.summary.trend === 'down' ? '📉' : '➡️';
  const changeSign = report.summary.totalChange >= 0 ? '+' : '';

  let summary = `☁️ *AWS Organization Daily Cost Summary*\n`;
  summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  summary += `📅 ${report.period.label}\n`;
  summary += `💰 Current MTD: *$${report.summary.totalCurrentMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n`;
  summary += `${trendEmoji} Change: ${changeSign}${report.summary.totalChangePercent.toFixed(1)}% vs last month\n`;
  summary += `🔮 Forecast: $${report.summary.forecastedMonthEnd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} by month end\n\n`;

  summary += `*Top 3 Spenders:*\n`;
  if (report.topSpenders.length > 0) {
    report.topSpenders.slice(0, 3).forEach((account, index) => {
      summary += `${index + 1}. ${account.accountName}: $${account.currentMonthCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    });
  } else {
    summary += `_No accounts matched the filters for this period._\n`;
  }

  if (report.alerts.length > 0) {
    summary += `\n⚠️ *${report.alerts.length} Alert(s)*\n`;
    report.alerts.slice(0, 2).forEach(alert => {
      summary += `• ${alert.accountName}: ${alert.message}\n`;
    });
  }

  return summary;
}
