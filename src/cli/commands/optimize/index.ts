/**
 * Optimize Command Group
 *
 * Commands for cost optimization:
 * - infra-cost optimize recommendations
 * - infra-cost optimize rightsizing
 * - infra-cost optimize quickwins
 * - infra-cost optimize cross-cloud
 */

import { Command } from 'commander';

export function registerOptimizeCommands(program: Command): void {
  const optimize = program
    .command('optimize')
    .description('Cost optimization and recommendations');

  optimize
    .command('recommendations')
    .description('Get comprehensive optimization recommendations')
    .option('--category <type>', 'Filter by category (compute, storage, database, network)')
    .option('--risk <level>', 'Maximum risk level (none, low, medium, high)', 'medium')
    .option('--min-savings <amount>', 'Minimum monthly savings to show', '10')
    .action(async (options, command) => {
      const { handleRecommendations } = await import('./recommendations');
      await handleRecommendations(options, command);
    });

  optimize
    .command('rightsizing')
    .description('Resource rightsizing analysis')
    .option('--resource-type <type>', 'Filter by resource type (compute, database)')
    .option('--utilization-threshold <percent>', 'Utilization threshold', '30')
    .action(async (options, command) => {
      const { handleRightsizing } = await import('./rightsizing');
      await handleRightsizing(options, command);
    });

  optimize
    .command('quickwins')
    .description('Quick win optimization opportunities')
    .option('--count <n>', 'Number of quick wins to show', '5')
    .option('--effort <level>', 'Maximum effort level (minimal, low, medium)', 'low')
    .action(async (options, command) => {
      const { handleQuickwins } = await import('./quickwins');
      await handleQuickwins(options, command);
    });

  optimize
    .command('cross-cloud')
    .description('Cross-cloud optimization comparison')
    .option('--target-provider <provider>', 'Target provider for migration analysis')
    .option('--workload <type>', 'Workload type (compute, storage, database)')
    .action(async (options, command) => {
      const { handleCrossCloud } = await import('./cross-cloud');
      await handleCrossCloud(options, command);
    });
}
