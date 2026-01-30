/**
 * Microsoft Teams Chargeback Integration
 * Send chargeback reports to Microsoft Teams
 */

import { sendTeamsReport, TeamsCostData } from '../../../integrations/teams';
import chalk from 'chalk';

export async function handleTeams(options: any, command: any): Promise<void> {
  const { teamsWebhook, provider = 'aws' } = options;

  if (!teamsWebhook) {
    console.error(chalk.red('Error: --teams-webhook is required'));
    console.log('\nExample:');
    console.log(chalk.gray('  infra-cost chargeback teams --teams-webhook https://outlook.office.com/webhook/...'));
    process.exit(1);
  }

  console.log(chalk.blue('📊 Generating chargeback report for Teams...\n'));

  try {
    // Simulate getting cost data (in real implementation, would fetch from provider)
    const costData: TeamsCostData = {
      todayCost: 142.30,
      mtdCost: 2847.50,
      budget: 5000,
      budgetPercent: 57,
      topServices: [
        { name: 'EC2', cost: 52.30, change: 8 },
        { name: 'RDS', cost: 38.50, change: 1 },
        { name: 'S3', cost: 22.10, change: -3 },
        { name: 'Lambda', cost: 15.20, change: 12 },
      ],
      alerts: ['Lambda costs increased 12% - investigate function usage'],
      accountName: options.account || 'Production',
      provider: provider.toUpperCase(),
    };

    await sendTeamsReport(teamsWebhook, costData, {
      cardStyle: options.cardStyle || 'detailed',
    });

    console.log(chalk.green('✅ Chargeback report sent to Microsoft Teams'));
  } catch (error: any) {
    console.error(chalk.red('Error sending to Teams:', error.message));
    process.exit(1);
  }
}
