/**
 * Cost Command Group
 *
 * Commands for cost analysis:
 * - infra-cost cost analyze
 * - infra-cost cost forecast
 * - infra-cost cost trends
 * - infra-cost cost compare
 */

import { Command } from 'commander';

// Import individual command handlers
import { handleAnalyze } from './analyze';
import { handleForecast } from './forecast';
import { handleTrends } from './trends';
import { handleCompare } from './compare';

/**
 * Register cost commands with the main program
 */
export function registerCostCommands(program: Command): void {
  const cost = program
    .command('cost')
    .description('Cost analysis and reporting commands');

  // cost analyze - Analyze current costs
  cost
    .command('analyze')
    .description('Analyze current cloud costs')
    .option('--start-date <date>', 'Start date for analysis (YYYY-MM-DD)')
    .option('--end-date <date>', 'End date for analysis (YYYY-MM-DD)')
    .option('--show-delta', 'Show cost changes compared to previous period', true)
    .option('--show-quick-wins', 'Show quick win opportunities', true)
    .option('--delta-threshold <percent>', 'Threshold for highlighting changes', '10')
    .option('--group-by <field>', 'Group by (service, region, tag)')
    .action(handleAnalyze);

  // cost forecast - Forecast future costs
  cost
    .command('forecast')
    .description('Forecast future cloud costs')
    .option('--months <n>', 'Number of months to forecast', '3')
    .option('--model <type>', 'Forecasting model (linear, exponential, seasonal, auto)', 'auto')
    .option('--confidence <level>', 'Confidence interval (80, 90, 95)', '90')
    .action(handleForecast);

  // cost trends - Show cost trends
  cost
    .command('trends')
    .description('Show cost trends over time')
    .option('--period <duration>', 'Time period (7d, 30d, 90d, 12m)', '30d')
    .option('--granularity <level>', 'Granularity (daily, weekly, monthly)', 'daily')
    .option('--services <list>', 'Comma-separated list of services to analyze')
    .action(handleTrends);

  // cost compare - Compare costs across clouds
  cost
    .command('compare')
    .description('Compare costs across multiple cloud providers')
    .option('--providers <list>', 'Comma-separated list of providers to compare', 'aws,gcp,azure')
    .option('--services <list>', 'Services to compare')
    .option('--normalize', 'Normalize costs for fair comparison', false)
    .action(handleCompare);
}
