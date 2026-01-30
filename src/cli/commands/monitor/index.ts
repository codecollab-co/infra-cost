/**
 * Monitor Command Group
 */

import { Command } from 'commander';

export function registerMonitorCommands(program: Command): void {
  const monitor = program
    .command('monitor')
    .description('Cost monitoring and alerts');

  monitor
    .command('alerts')
    .description('Manage cost alerts and thresholds')
    .option('--list', 'List all configured alerts')
    .option('--add', 'Add new alert')
    .option('--threshold <amount>', 'Alert threshold amount')
    .action(async (options, command) => {
      const { handleAlerts } = await import('./alerts');
      await handleAlerts(options, command);
    });

  monitor
    .command('anomaly')
    .description('Anomaly detection and analysis')
    .option('--sensitivity <level>', 'Detection sensitivity (low, medium, high)', 'medium')
    .option('--days <n>', 'Days of history to analyze', '30')
    .action(async (options, command) => {
      const { handleAnomaly } = await import('./anomaly');
      await handleAnomaly(options, command);
    });

  monitor
    .command('watch')
    .description('Real-time cost monitoring')
    .option('--refresh <seconds>', 'Refresh interval in seconds', '60')
    .option('--dashboard', 'Show interactive dashboard')
    .action(async (options, command) => {
      const { handleWatch } = await import('./watch');
      await handleWatch(options, command);
    });

  monitor
    .command('budgets')
    .description('Budget tracking and forecasts')
    .option('--list', 'List all budgets')
    .option('--forecast', 'Show budget forecast')
    .action(async (options, command) => {
      const { handleBudgets } = await import('./budgets');
      await handleBudgets(options, command);
    });

  monitor
    .command('alert-pagerduty')
    .description('Send cost alert to PagerDuty')
    .option('--pagerduty-key <key>', 'PagerDuty routing key')
    .option('--severity <level>', 'Alert severity (critical, error, warning, info)', 'warning')
    .option('--threshold <percent>', 'Alert threshold percentage')
    .action(async (options) => {
      const { handlePagerDuty } = await import('./alert');
      await handlePagerDuty(options);
    });

  monitor
    .command('alert-opsgenie')
    .description('Send cost alert to OpsGenie')
    .option('--opsgenie-key <key>', 'OpsGenie API key')
    .option('--priority <level>', 'Alert priority (P1, P2, P3, P4, P5)', 'P3')
    .option('--threshold <percent>', 'Alert threshold percentage')
    .option('--team <name>', 'Team to notify')
    .action(async (options) => {
      const { handleOpsGenie } = await import('./alert');
      await handleOpsGenie(options);
    });
}
