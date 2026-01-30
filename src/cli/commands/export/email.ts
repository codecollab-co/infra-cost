/**
 * Email export command
 * Send cost reports via email
 */

import { sendEmailReport, EmailCostData, EmailConfig } from '../../../integrations/email';
import chalk from 'chalk';

export async function handleEmail(options: any): Promise<void> {
  const { emailTo, emailFrom, emailProvider, sendgridKey, mailgunKey, mailgunDomain } = options;

  if (!emailTo) {
    console.error(chalk.red('Error: --email-to is required'));
    console.log('\nExample:');
    console.log(chalk.gray('  infra-cost export email --email-to finance@company.com --email-provider sendgrid --sendgrid-key YOUR_KEY'));
    process.exit(1);
  }

  if (!emailFrom) {
    console.error(chalk.red('Error: --email-from is required'));
    process.exit(1);
  }

  const provider = emailProvider || 'sendgrid';

  // Validate provider-specific config
  if (provider === 'sendgrid' && !sendgridKey) {
    console.error(chalk.red('Error: --sendgrid-key is required for SendGrid'));
    process.exit(1);
  }

  if (provider === 'mailgun' && (!mailgunKey || !mailgunDomain)) {
    console.error(chalk.red('Error: --mailgun-key and --mailgun-domain are required for Mailgun'));
    process.exit(1);
  }

  console.log(chalk.blue('📧 Generating and sending email report...\n'));

  try {
    // Simulate cost data (in real implementation, would fetch from provider)
    const costData: EmailCostData = {
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      todayCost: 142.30,
      mtdCost: 2847.50,
      budget: 5000,
      budgetPercent: 57,
      projectedMonthEnd: 4520,
      topServices: [
        { name: 'EC2', cost: 52.30, change: 8 },
        { name: 'RDS', cost: 38.50, change: 1 },
        { name: 'S3', cost: 22.10, change: -3 },
        { name: 'Lambda', cost: 15.20, change: 12 },
      ],
      alerts: ['Lambda costs increased 12% - investigate function usage'],
      accountName: options.account || 'Production',
      provider: options.provider?.toUpperCase() || 'AWS',
    };

    const emailConfig: EmailConfig = {
      provider: provider as any,
      from: emailFrom,
      to: emailTo.split(',').map((e: string) => e.trim()),
      subject: options.subject,
      sendgrid: sendgridKey ? { apiKey: sendgridKey } : undefined,
      mailgun:
        mailgunKey && mailgunDomain
          ? { apiKey: mailgunKey, domain: mailgunDomain }
          : undefined,
    };

    await sendEmailReport(costData, emailConfig);

    console.log(chalk.green('✅ Email report sent successfully'));
    console.log(chalk.gray(`   To: ${emailTo}`));
    console.log(chalk.gray(`   Provider: ${provider}`));
  } catch (error: any) {
    console.error(chalk.red('Error sending email report:', error.message));
    process.exit(1);
  }
}
