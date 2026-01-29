/**
 * Dashboard Command Group
 */

import { Command } from 'commander';

export function registerDashboardCommands(program: Command): void {
  const dashboard = program
    .command('dashboard')
    .description('Interactive dashboards and visualizations');

  dashboard
    .command('interactive')
    .description('Launch interactive terminal dashboard')
    .option('--refresh <seconds>', 'Auto-refresh interval', '60')
    .action(async (options, command) => {
      const { handleInteractive } = await import('./interactive');
      await handleInteractive(options, command);
    });

  dashboard
    .command('multicloud')
    .description('Multi-cloud comparison dashboard')
    .option('--providers <list>', 'Providers to include', 'aws,gcp,azure')
    .action(async (options, command) => {
      const { handleMulticloud } = await import('./multicloud');
      await handleMulticloud(options, command);
    });
}
