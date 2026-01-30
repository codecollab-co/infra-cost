/**
 * Organizations Command Group
 */

import { Command } from 'commander';

export function registerOrganizationsCommands(program: Command): void {
  const orgs = program
    .command('organizations')
    .alias('orgs')
    .description('AWS Organizations multi-account management');

  orgs
    .command('list')
    .description('List all accounts in the organization')
    .option('--include-inactive', 'Include suspended/closed accounts')
    .action(async (options, command) => {
      const { handleList } = await import('./list');
      await handleList(options, command);
    });

  orgs
    .command('summary')
    .description('Multi-account cost summary')
    .option('--group-by <field>', 'Group by (account, ou, tag)', 'account')
    .action(async (options, command) => {
      const { handleSummary } = await import('./summary');
      await handleSummary(options, command);
    });

  orgs
    .command('daily')
    .description('Daily cost breakdown by account')
    .option('--days <n>', 'Number of days to show', '7')
    .option('--slack-webhook <url>', 'Send report to Slack webhook URL')
    .option('--schedule-daily', 'Show instructions to set up daily automated reports')
    .option('--schedule-time <time>', 'Preferred schedule time (HH:MM)', '09:00')
    .option('--json', 'Output in JSON format')
    .action(async (options, command) => {
      const { handleDaily } = await import('./daily');
      await handleDaily(options, command);
    });
}
