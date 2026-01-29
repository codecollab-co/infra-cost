/**
 * Chargeback Command Group
 */

import { Command } from 'commander';

export function registerChargebackCommands(program: Command): void {
  const chargeback = program
    .command('chargeback')
    .description('Cost allocation and chargeback reports');

  chargeback
    .command('allocate')
    .description('Allocate costs to teams/projects')
    .option('--dimensions <list>', 'Allocation dimensions (team, project, env)', 'team,project')
    .option('--handle-untagged <method>', 'Handle untagged resources (ignore, shared, proportional)', 'shared')
    .action(async (options, command) => {
      const { handleAllocate } = await import('./allocate');
      await handleAllocate(options, command);
    });

  chargeback
    .command('report')
    .description('Generate chargeback report')
    .option('--period <duration>', 'Reporting period (7d, 30d, 90d)', '30d')
    .option('--format <type>', 'Output format (text, csv, xlsx)', 'text')
    .action(async (options, command) => {
      const { handleReport } = await import('./report');
      await handleReport(options, command);
    });

  chargeback
    .command('slack')
    .description('Send chargeback report to Slack')
    .option('--channel <name>', 'Slack channel')
    .option('--include-details', 'Include detailed breakdown')
    .action(async (options, command) => {
      const { handleSlack } = await import('./slack');
      await handleSlack(options, command);
    });
}
