/**
 * Alert integration commands
 * Send cost alerts to PagerDuty and OpsGenie
 */

import { sendPagerDutyAlert, PagerDutyAlert } from '../../../integrations/pagerduty';
import { sendOpsGenieAlert, OpsGenieAlert } from '../../../integrations/opsgenie';
import chalk from 'chalk';

export async function handlePagerDuty(options: any): Promise<void> {
  const { pagerdutyKey, severity, threshold } = options;

  if (!pagerdutyKey) {
    console.error(chalk.red('Error: --pagerduty-key is required'));
    console.log('\nExample:');
    console.log(chalk.gray('  infra-cost monitor alert-pagerduty --pagerduty-key YOUR_ROUTING_KEY'));
    process.exit(1);
  }

  console.log(chalk.blue('🚨 Checking for cost anomalies...\n'));

  // Simulate cost data (in real implementation, would fetch from provider)
  const alert: PagerDutyAlert = {
    accountId: '123456789012',
    accountName: 'Production',
    todayCost: 1850.23,
    yesterdayCost: 1400.0,
    increaseAmount: 450.23,
    increasePercent: 32.0,
    topService: 'EC2',
    topServiceIncrease: 320.0,
    threshold: threshold ? parseFloat(threshold) : undefined,
  };

  // Check if alert should be triggered
  if (threshold && alert.increasePercent < parseFloat(threshold)) {
    console.log(chalk.green(`✅ No alert needed (${alert.increasePercent.toFixed(1)}% < ${threshold}% threshold)`));
    return;
  }

  try {
    await sendPagerDutyAlert(alert, {
      routingKey: pagerdutyKey,
      severity: severity || 'warning',
      component: 'aws-cost-monitoring',
    });

    console.log(chalk.green('✅ Alert sent to PagerDuty'));
    console.log(chalk.gray(`   Severity: ${severity || 'warning'}`));
    console.log(chalk.gray(`   Increase: +$${alert.increaseAmount.toFixed(2)} (+${alert.increasePercent.toFixed(1)}%)`));
  } catch (error: any) {
    console.error(chalk.red('Error sending PagerDuty alert:', error.message));
    process.exit(1);
  }
}

export async function handleOpsGenie(options: any): Promise<void> {
  const { opsgenieKey, priority, threshold } = options;

  if (!opsgenieKey) {
    console.error(chalk.red('Error: --opsgenie-key is required'));
    console.log('\nExample:');
    console.log(chalk.gray('  infra-cost monitor alert-opsgenie --opsgenie-key YOUR_API_KEY'));
    process.exit(1);
  }

  console.log(chalk.blue('🚨 Checking for cost anomalies...\n'));

  // Simulate cost data
  const alert: OpsGenieAlert = {
    accountId: '123456789012',
    accountName: 'Production',
    todayCost: 1850.23,
    yesterdayCost: 1400.0,
    increaseAmount: 450.23,
    increasePercent: 32.0,
    topService: 'EC2',
    topServiceIncrease: 320.0,
    threshold: threshold ? parseFloat(threshold) : undefined,
  };

  // Check if alert should be triggered
  if (threshold && alert.increasePercent < parseFloat(threshold)) {
    console.log(chalk.green(`✅ No alert needed (${alert.increasePercent.toFixed(1)}% < ${threshold}% threshold)`));
    return;
  }

  try {
    await sendOpsGenieAlert(alert, {
      apiKey: opsgenieKey,
      priority: priority || 'P3',
      tags: ['cost-alert', 'finops', 'aws'],
      responders: options.team ? [{ type: 'team', name: options.team }] : undefined,
    });

    console.log(chalk.green('✅ Alert sent to OpsGenie'));
    console.log(chalk.gray(`   Priority: ${priority || 'P3'}`));
    console.log(chalk.gray(`   Increase: +$${alert.increaseAmount.toFixed(2)} (+${alert.increasePercent.toFixed(1)}%)`));
  } catch (error: any) {
    console.error(chalk.red('Error sending OpsGenie alert:', error.message));
    process.exit(1);
  }
}
