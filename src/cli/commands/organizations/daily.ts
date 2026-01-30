/**
 * Daily Cost Breakdown for AWS Organizations
 * Issue #61: Daily Slack Scheduling for AWS Organizations
 */

import chalk from 'chalk';
import dayjs from 'dayjs';
import { getGlobalLogger } from '../../../core/logging';
import {
  OrganizationsClient,
  ListAccountsCommand,
} from '@aws-sdk/client-organizations';
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from '@aws-sdk/client-cost-explorer';

interface DailyOptions {
  days?: string;
  slackWebhook?: string;
  scheduleDaily?: boolean;
  scheduleTime?: string;
  profile?: string;
  json?: boolean;
}

interface AccountCost {
  accountId: string;
  accountName: string;
  todayCost: number;
  yesterdayCost: number;
  weeklyAverage: number;
  delta: number;
  trend: 'up' | 'down' | 'stable';
}

interface DailyReport {
  date: string;
  totalCost: number;
  accountsCount: number;
  accounts: AccountCost[];
  weeklyTotal: number;
  topSpenders: AccountCost[];
}

/**
 * Handle the daily cost breakdown command
 */
export async function handleDaily(
  options: DailyOptions,
  command: any
): Promise<void> {
  const logger = getGlobalLogger();
  logger.info('Generating daily breakdown', options);

  try {
    // Generate the daily report
    const report = await generateDailyReport(options);

    // Send to Slack if webhook is provided
    if (options.slackWebhook) {
      await sendToSlack(report, options.slackWebhook);
      console.log(chalk.green('✅ Daily report sent to Slack successfully!'));
    }

    // Display the report
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      displayDailyReport(report);
    }

    // Set up daily scheduling if requested
    if (options.scheduleDaily) {
      setupDailySchedule(options);
    }
  } catch (error: any) {
    logger.error('Failed to generate daily report', error);
    throw error;
  }
}

/**
 * Generate daily cost report for all accounts in the organization
 */
async function generateDailyReport(
  options: DailyOptions
): Promise<DailyReport> {
  const profile = options.profile || process.env.AWS_PROFILE || 'default';
  const days = parseInt(options.days || '7', 10);

  // Initialize AWS clients
  const orgsClient = new OrganizationsClient({
    credentials: { profile } as any,
    region: 'us-east-1', // Organizations is global
  });

  const ceClient = new CostExplorerClient({
    credentials: { profile } as any,
    region: 'us-east-1', // Cost Explorer is us-east-1 only
  });

  // Get all accounts in the organization
  const accountsResponse = await orgsClient.send(new ListAccountsCommand({}));
  const accounts = accountsResponse.Accounts?.filter(
    (acc) => acc.Status === 'ACTIVE'
  ) || [];

  // Calculate date ranges
  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const weekAgo = dayjs().subtract(days, 'days').format('YYYY-MM-DD');

  const accountCosts: AccountCost[] = [];
  let totalCost = 0;
  let weeklyTotal = 0;

  // Get costs for each account
  for (const account of accounts) {
    const accountId = account.Id!;
    const accountName = account.Name || accountId;

    try {
      // Get today's cost
      const todayResponse = await ceClient.send(
        new GetCostAndUsageCommand({
          TimePeriod: {
            Start: yesterday,
            End: today,
          },
          Granularity: 'DAILY',
          Metrics: ['UnblendedCost'],
          Filter: {
            Dimensions: {
              Key: 'LINKED_ACCOUNT',
              Values: [accountId],
            },
          },
        })
      );

      const todayCost = parseFloat(
        todayResponse.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount || '0'
      );

      // Get yesterday's cost
      const dayBeforeYesterday = dayjs().subtract(2, 'days').format('YYYY-MM-DD');
      const yesterdayResponse = await ceClient.send(
        new GetCostAndUsageCommand({
          TimePeriod: {
            Start: dayBeforeYesterday,
            End: yesterday,
          },
          Granularity: 'DAILY',
          Metrics: ['UnblendedCost'],
          Filter: {
            Dimensions: {
              Key: 'LINKED_ACCOUNT',
              Values: [accountId],
            },
          },
        })
      );

      const yesterdayCost = parseFloat(
        yesterdayResponse.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount || '0'
      );

      // Get weekly costs
      const weeklyResponse = await ceClient.send(
        new GetCostAndUsageCommand({
          TimePeriod: {
            Start: weekAgo,
            End: today,
          },
          Granularity: 'DAILY',
          Metrics: ['UnblendedCost'],
          Filter: {
            Dimensions: {
              Key: 'LINKED_ACCOUNT',
              Values: [accountId],
            },
          },
        })
      );

      const weeklySum = weeklyResponse.ResultsByTime?.reduce((sum, day) => {
        return sum + parseFloat(day.Total?.UnblendedCost?.Amount || '0');
      }, 0) || 0;

      const weeklyAverage = weeklySum / days;
      const delta = todayCost - yesterdayCost;
      const deltaPercent = yesterdayCost > 0 ? (delta / yesterdayCost) * 100 : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (deltaPercent > 5) trend = 'up';
      else if (deltaPercent < -5) trend = 'down';

      accountCosts.push({
        accountId,
        accountName,
        todayCost,
        yesterdayCost,
        weeklyAverage,
        delta,
        trend,
      });

      totalCost += todayCost;
      weeklyTotal += weeklySum;
    } catch (error) {
      // Skip accounts with no cost data or permission issues
      getGlobalLogger().debug(`Skipping account ${accountId}:`, error);
    }
  }

  // Sort by today's cost descending
  accountCosts.sort((a, b) => b.todayCost - a.todayCost);

  // Get top 5 spenders
  const topSpenders = accountCosts.slice(0, 5);

  return {
    date: today,
    totalCost,
    accountsCount: accountCosts.length,
    accounts: accountCosts,
    weeklyTotal,
    topSpenders,
  };
}

/**
 * Display daily report in fancy format
 */
function displayDailyReport(report: DailyReport): void {
  console.log();
  console.log(
    chalk.bold.cyan('📊 AWS Organizations Daily Cost Report'),
    chalk.dim(`(${report.date})`)
  );
  console.log(chalk.dim('═'.repeat(70)));
  console.log();

  // Total costs
  console.log(chalk.bold('💰 Total Costs'));
  console.log(
    `├── Today: ${chalk.green('$' + report.totalCost.toFixed(2))}`
  );
  console.log(
    `├── Weekly Total: ${chalk.cyan('$' + report.weeklyTotal.toFixed(2))}`
  );
  console.log(`└── Active Accounts: ${chalk.yellow(report.accountsCount)}`);
  console.log();

  // Top spenders
  console.log(chalk.bold('🔥 Top 5 Spenders Today'));
  report.topSpenders.forEach((account, index) => {
    const trendIcon =
      account.trend === 'up' ? '📈' : account.trend === 'down' ? '📉' : '➡️';
    const deltaColor =
      account.trend === 'up'
        ? chalk.red
        : account.trend === 'down'
          ? chalk.green
          : chalk.gray;

    const prefix = index === report.topSpenders.length - 1 ? '└──' : '├──';
    console.log(
      `${prefix} ${trendIcon} ${chalk.bold(account.accountName)} ${chalk.dim(`(${account.accountId})`)}`
    );
    console.log(
      `    Today: ${chalk.green('$' + account.todayCost.toFixed(2))} | Yesterday: $${account.yesterdayCost.toFixed(2)} | ${deltaColor(account.delta >= 0 ? '+' : '')}${deltaColor('$' + account.delta.toFixed(2))}`
    );
  });
  console.log();

  // All accounts summary
  console.log(chalk.bold('📋 All Accounts'));
  console.log(chalk.dim('─'.repeat(70)));
  report.accounts.forEach((account) => {
    const trendIcon =
      account.trend === 'up' ? '⬆️' : account.trend === 'down' ? '⬇️' : '➡️';
    console.log(
      `${trendIcon} ${account.accountName.padEnd(30)} $${account.todayCost.toFixed(2).padStart(8)} ${chalk.dim('(7d avg: $' + account.weeklyAverage.toFixed(2) + ')')}`
    );
  });
  console.log();
}

/**
 * Send daily report to Slack
 */
async function sendToSlack(
  report: DailyReport,
  webhookUrl: string
): Promise<void> {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📊 AWS Daily Cost Report - ${report.date}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Total Today:*\n$${report.totalCost.toFixed(2)}`,
        },
        {
          type: 'mrkdwn',
          text: `*Active Accounts:*\n${report.accountsCount}`,
        },
        {
          type: 'mrkdwn',
          text: `*Weekly Total:*\n$${report.weeklyTotal.toFixed(2)}`,
        },
        {
          type: 'mrkdwn',
          text: `*Daily Average:*\n$${(report.weeklyTotal / 7).toFixed(2)}`,
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
        text: '*🔥 Top 5 Spenders Today:*',
      },
    },
  ];

  // Add top spenders
  report.topSpenders.forEach((account) => {
    const trendEmoji =
      account.trend === 'up' ? '📈' : account.trend === 'down' ? '📉' : '➡️';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${trendEmoji} *${account.accountName}*\n$${account.todayCost.toFixed(2)} today | Yesterday: $${account.yesterdayCost.toFixed(2)} | Change: ${account.delta >= 0 ? '+' : ''}$${account.delta.toFixed(2)}`,
      },
    });
  });

  // Send to Slack
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ blocks }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.statusText}`);
  }
}

/**
 * Set up daily scheduling (placeholder - requires cron or external scheduler)
 */
function setupDailySchedule(options: DailyOptions): void {
  const scheduleTime = options.scheduleTime || '09:00';

  console.log();
  console.log(chalk.bold.yellow('⚙️  Daily Scheduling Setup'));
  console.log(chalk.dim('─'.repeat(70)));
  console.log(
    chalk.yellow(
      '⚠️  Note: Automated scheduling requires an external scheduler (cron, AWS Lambda, GitHub Actions)'
    )
  );
  console.log();
  console.log(
    chalk.bold('Option 1: Cron (Linux/macOS)'),
    chalk.dim('- Best for servers')
  );
  console.log(
    `Add this to your crontab (run ${chalk.cyan('crontab -e')}):\n`
  );
  console.log(
    chalk.cyan(
      `  0 9 * * * cd $(pwd) && npx infra-cost organizations daily --slack-webhook="${options.slackWebhook}" > /dev/null 2>&1`
    )
  );
  console.log();

  console.log(
    chalk.bold('Option 2: AWS Lambda + EventBridge'),
    chalk.dim('- Best for AWS-native')
  );
  console.log(
    '  1. Deploy this CLI as a Lambda function\n' +
      `  2. Set environment variable: SLACK_WEBHOOK_URL="${options.slackWebhook}"\n` +
      '  3. Create EventBridge rule: rate(1 day)\n' +
      '  4. Configure Lambda to run: infra-cost organizations daily\n'
  );
  console.log();

  console.log(
    chalk.bold('Option 3: GitHub Actions'),
    chalk.dim('- Best for CI/CD workflows')
  );
  console.log('  Create .github/workflows/daily-cost-report.yml:\n');
  console.log(
    chalk.cyan(`  name: Daily Cost Report
  on:
    schedule:
      - cron: '0 ${scheduleTime.split(':')[0]} * * *'
  jobs:
    report:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - run: npx infra-cost organizations daily --slack-webhook=\${{ secrets.SLACK_WEBHOOK }}`)
  );
  console.log();
  console.log(
    chalk.green(
      `💡 Tip: Store your Slack webhook URL in environment variables or secrets manager`
    )
  );
  console.log();
}
