/**
 * Quick Cost Command - `infra-cost now`
 *
 * Issue #41: Instant cost visibility with zero configuration
 * Provides today's cost with smart defaults and minimal output
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { CloudProviderFactory } from '../../providers/factory';
import { CloudProvider } from '../../types/providers';
import { autoLoadConfig } from '../../core/config';

interface NowOptions {
  provider?: string;
  profile?: string;
  allProfiles?: boolean;
  json?: boolean;
}

/**
 * Register the `now` command
 */
export function registerNowCommand(program: Command): void {
  program
    .command('now')
    .description('Quick cost check - see today\'s spending instantly')
    .option('--provider <provider>', 'Cloud provider (aws, gcp, azure)', 'aws')
    .option('-p, --profile <profile>', 'Cloud profile to use')
    .option('--all-profiles', 'Show summary across all configured profiles')
    .option('--json', 'Output in JSON format')
    .action(async (options: NowOptions) => {
      try {
        await handleNowCommand(options);
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}

/**
 * Handle the `now` command execution
 */
async function handleNowCommand(options: NowOptions): Promise<void> {
  // Load configuration with smart defaults
  const config = await autoLoadConfig();

  // Determine provider
  const provider = normalizeProvider(options.provider || config.provider || 'aws');

  if (options.allProfiles) {
    // TODO: Implement all-profiles summary in future enhancement
    throw new Error('--all-profiles not yet implemented. Use without this flag to see default profile.');
  }

  // Get today's cost
  const costData = await getTodaysCost(provider, options.profile || config.profile);

  if (options.json) {
    console.log(JSON.stringify(costData, null, 2));
  } else {
    displayFancyOutput(costData);
  }
}

/**
 * Normalize provider string to CloudProvider enum
 */
function normalizeProvider(providerStr: string): CloudProvider {
  const normalized = providerStr.toLowerCase();

  switch (normalized) {
    case 'aws':
      return CloudProvider.AWS;
    case 'gcp':
    case 'google':
    case 'google-cloud':
      return CloudProvider.GCP;
    case 'azure':
    case 'microsoft':
      return CloudProvider.AZURE;
    case 'alibaba':
    case 'alicloud':
      return CloudProvider.ALIBABA_CLOUD;
    case 'oracle':
    case 'oci':
      return CloudProvider.ORACLE_CLOUD;
    default:
      throw new Error(`Unsupported provider: ${providerStr}. Use: aws, gcp, azure, alibaba, or oracle`);
  }
}

/**
 * Get today's cost data from the cloud provider
 */
async function getTodaysCost(provider: CloudProvider, profile?: string) {
  // Create provider instance
  const factory = new CloudProviderFactory();

  // Build minimal config for provider
  const providerConfig = {
    provider,
    credentials: {
      profile: profile || process.env.AWS_PROFILE || 'default',
    },
  };

  const providerInstance = factory.createProvider(providerConfig);

  // Get cost breakdown
  const costBreakdown = await providerInstance.getCostBreakdown();

  // Calculate today's cost (use yesterday as approximation since most APIs don't show same-day)
  const todayCost = costBreakdown.totals.yesterday || 0;
  const yesterdayCost = costBreakdown.totals.last7Days
    ? (costBreakdown.totals.last7Days / 7)
    : todayCost * 0.95; // Estimate yesterday as ~95% of today if no data

  const costDelta = todayCost - yesterdayCost;

  // Get top 3 services
  const serviceEntries = Object.entries(costBreakdown.totalsByService.yesterday || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const topServices = serviceEntries.map(([name, cost]) => ({
    name,
    cost,
  }));

  // Calculate budget progress (if available)
  let budgetProgress = null;
  try {
    const budgets = await providerInstance.getBudgets();
    if (budgets && budgets.length > 0) {
      const mainBudget = budgets[0];
      const percentUsed = (costBreakdown.totals.thisMonth / mainBudget.budgetLimit) * 100;

      budgetProgress = {
        budgetName: mainBudget.budgetName,
        budgetLimit: mainBudget.budgetLimit,
        currentSpend: costBreakdown.totals.thisMonth,
        percentUsed,
        status: percentUsed >= 100 ? 'over' : percentUsed >= 80 ? 'warning' : 'ok',
      };
    }
  } catch (error) {
    // Budget data not available - that's okay, continue without it
  }

  return {
    provider,
    todayCost,
    yesterdayCost,
    costDelta,
    monthToDate: costBreakdown.totals.thisMonth,
    topServices,
    budgetProgress,
    currency: 'USD', // TODO: Get from provider
  };
}

/**
 * Display fancy formatted output
 */
function displayFancyOutput(data: any): void {
  const {
    provider,
    todayCost,
    costDelta,
    monthToDate,
    topServices,
    budgetProgress,
    currency,
  } = data;

  console.log();

  // Today's cost with delta
  const deltaSymbol = costDelta >= 0 ? '↑' : '↓';
  const deltaColor = costDelta >= 0 ? chalk.red : chalk.green;
  const deltaText = costDelta >= 0
    ? `+${currency}${Math.abs(costDelta).toFixed(2)}`
    : `-${currency}${Math.abs(costDelta).toFixed(2)}`;

  console.log(
    chalk.bold.cyan('💰 Today\'s Cost:'),
    chalk.bold.white(`${currency}${todayCost.toFixed(2)}`),
    deltaColor(`(${deltaText} ${deltaSymbol} from yesterday)`)
  );

  // Top services
  if (topServices && topServices.length > 0) {
    const servicesList = topServices
      .map((s: any) => `${chalk.yellow(s.name)} ${chalk.white(`${currency}${s.cost.toFixed(2)}`)}`)
      .join(' | ');

    console.log(chalk.bold.cyan('📊 Top Services:'), servicesList);
  }

  // Month-to-date with budget
  if (budgetProgress) {
    const budgetColor = budgetProgress.status === 'over'
      ? chalk.red
      : budgetProgress.status === 'warning'
      ? chalk.yellow
      : chalk.green;

    const budgetBar = createProgressBar(budgetProgress.percentUsed, 30);

    console.log(
      chalk.bold.cyan('📈 Month-to-Date:'),
      chalk.white(`${currency}${monthToDate.toFixed(2)}`),
      '/',
      budgetColor(`${currency}${budgetProgress.budgetLimit.toFixed(2)}`),
      budgetColor(`(${budgetProgress.percentUsed.toFixed(0)}%)`)
    );
    console.log('   ', budgetBar);
  } else {
    console.log(
      chalk.bold.cyan('📈 Month-to-Date:'),
      chalk.white(`${currency}${monthToDate.toFixed(2)}`)
    );
  }

  console.log();
  console.log(chalk.dim(`Provider: ${provider.toUpperCase()}`));
  console.log(chalk.dim('Run `infra-cost cost` for detailed breakdown'));
  console.log();
}

/**
 * Create a text-based progress bar
 */
function createProgressBar(percent: number, width: number = 30): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;

  const color = percent >= 100
    ? chalk.red
    : percent >= 80
    ? chalk.yellow
    : chalk.green;

  const bar = color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  return `[${bar}] ${percent.toFixed(0)}%`;
}
