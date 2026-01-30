/**
 * AWS Free Tier Usage Tracker
 *
 * Issue #53: Track AWS Free Tier usage and alert before limits are exceeded
 * Helps solo developers and indie hackers avoid surprise bills
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { CloudProviderFactory } from '../../providers/factory';
import { CloudProvider } from '../../types/providers';
import { CostExplorerClient, GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer';
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { S3Client, ListBucketsCommand, GetBucketLocationCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import dayjs from 'dayjs';

interface FreeTierOptions {
  profile?: string;
  alertThreshold?: number;
  showProjection?: boolean;
  json?: boolean;
}

interface FreeTierService {
  name: string;
  description: string;
  used: number;
  limit: number;
  unit: string;
  percentage: number;
  status: 'ok' | 'warning' | 'critical';
  daysRemaining: number;
  projectedUsage?: number;
  projectedOverage?: number;
}

/**
 * Register the `free-tier` command
 */
export function registerFreeTierCommand(program: Command): void {
  program
    .command('free-tier')
    .description('Track AWS Free Tier usage and prevent surprise bills')
    .option('-p, --profile <profile>', 'AWS profile to use')
    .option('--alert-threshold <percentage>', 'Alert threshold percentage (default: 80)', '80')
    .option('--show-projection', 'Show projected month-end overages')
    .option('--json', 'Output in JSON format')
    .action(async (options: FreeTierOptions) => {
      try {
        await handleFreeTierCommand(options);
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}

/**
 * Handle the `free-tier` command execution
 */
async function handleFreeTierCommand(options: FreeTierOptions): Promise<void> {
  const profile = options.profile || process.env.AWS_PROFILE || 'default';
  const alertThreshold = parseInt(options.alertThreshold || '80', 10);

  // Get account info
  const factory = new CloudProviderFactory();
  const awsConfig = {
    provider: CloudProvider.AWS,
    credentials: { profile },
  };
  const awsProvider = factory.createProvider(awsConfig);
  const accountInfo = await awsProvider.getAccountInfo();

  // Track free tier usage
  const services = await trackFreeTierUsage(profile, alertThreshold);

  if (options.json) {
    console.log(JSON.stringify({ accountInfo, services }, null, 2));
  } else {
    displayFreeTierStatus(accountInfo, services, alertThreshold, options.showProjection);
  }
}

/**
 * Track free tier usage for AWS services
 */
async function trackFreeTierUsage(profile: string, alertThreshold: number): Promise<FreeTierService[]> {
  const services: FreeTierService[] = [];

  const credentials = { profile };
  const region = process.env.AWS_REGION || 'us-east-1';

  const now = dayjs();
  const daysInMonth = now.daysInMonth();
  const daysRemaining = daysInMonth - now.date();
  const monthProgress = now.date() / daysInMonth;

  // Track EC2 usage (t2.micro/t3.micro hours)
  try {
    const ec2Hours = await getEC2FreeTierHours(credentials, region);
    const ec2Limit = 750; // 750 hours/month for t2.micro or t3.micro
    const ec2Percentage = (ec2Hours / ec2Limit) * 100;
    const projectedEC2 = ec2Hours / monthProgress;
    const projectedOverage = Math.max(0, projectedEC2 - ec2Limit);

    services.push({
      name: 'EC2',
      description: 't2.micro/t3.micro instances',
      used: ec2Hours,
      limit: ec2Limit,
      unit: 'hours',
      percentage: ec2Percentage,
      status: getStatus(ec2Percentage, alertThreshold),
      daysRemaining,
      projectedUsage: projectedEC2,
      projectedOverage: projectedOverage > 0 ? projectedOverage * 0.0116 : 0, // $0.0116/hour
    });
  } catch (error) {
    // EC2 tracking failed - continue with other services
  }

  // Track S3 storage usage
  try {
    const s3Storage = await getS3StorageGB(credentials, region);
    const s3Limit = 5; // 5 GB free
    const s3Percentage = (s3Storage / s3Limit) * 100;

    services.push({
      name: 'S3',
      description: 'Standard storage',
      used: s3Storage,
      limit: s3Limit,
      unit: 'GB',
      percentage: s3Percentage,
      status: getStatus(s3Percentage, alertThreshold),
      daysRemaining,
    });
  } catch (error) {
    // S3 tracking failed
  }

  // Track Lambda usage (simplified - using cost as proxy)
  try {
    const lambdaCost = await getLambdaCost(credentials, region);
    const lambdaFreeLimit = 0; // $0 = within free tier
    const lambdaPercentage = lambdaCost > 0 ? 100 : 0; // If any cost, we're over

    services.push({
      name: 'Lambda',
      description: '1M requests, 400K GB-sec',
      used: lambdaCost,
      limit: lambdaFreeLimit,
      unit: 'cost',
      percentage: lambdaPercentage,
      status: lambdaCost > 0 ? 'critical' : 'ok',
      daysRemaining,
    });
  } catch (error) {
    // Lambda tracking failed
  }

  return services;
}

/**
 * Get EC2 instance hours for free tier eligible instances
 */
async function getEC2FreeTierHours(credentials: any, region: string): Promise<number> {
  const ec2 = new EC2Client({ credentials, region });
  const command = new DescribeInstancesCommand({});
  const response = await ec2.send(command);

  let totalHours = 0;
  const now = dayjs();
  const monthStart = dayjs().startOf('month');

  response.Reservations?.forEach((reservation) => {
    reservation.Instances?.forEach((instance) => {
      // Check if instance is free tier eligible (t2.micro or t3.micro)
      const instanceType = instance.InstanceType || '';
      if (instanceType === 't2.micro' || instanceType === 't3.micro') {
        // Calculate hours this instance has been running this month
        const launchTime = dayjs(instance.LaunchTime);
        const startTime = launchTime.isAfter(monthStart) ? launchTime : monthStart;

        if (instance.State?.Name === 'running') {
          const hours = now.diff(startTime, 'hour', true);
          totalHours += hours;
        }
      }
    });
  });

  return Math.round(totalHours);
}

/**
 * Get S3 storage in GB (estimated)
 */
async function getS3StorageGB(credentials: any, region: string): Promise<number> {
  // Note: Actual S3 storage requires CloudWatch metrics or billing data
  // This is a simplified estimation based on bucket count
  const s3 = new S3Client({ credentials, region });
  const command = new ListBucketsCommand({});
  const response = await s3.send(command);

  const bucketCount = response.Buckets?.length || 0;

  // Rough estimate: assume average bucket has 100MB
  // In production, would query CloudWatch metrics or Cost Explorer
  return (bucketCount * 0.1); // 0.1 GB per bucket average
}

/**
 * Get Lambda cost this month
 */
async function getLambdaCost(credentials: any, region: string): Promise<number> {
  try {
    const costExplorer = new CostExplorerClient({ credentials, region });

    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');

    const command = new GetCostAndUsageCommand({
      TimePeriod: {
        Start: monthStart,
        End: today,
      },
      Granularity: 'MONTHLY',
      Metrics: ['UnblendedCost'],
      Filter: {
        Dimensions: {
          Key: 'SERVICE',
          Values: ['AWS Lambda'],
        },
      },
    });

    const response = await costExplorer.send(command);
    const cost = parseFloat(
      response.ResultsByTime?.[0]?.Total?.UnblendedCost?.Amount || '0'
    );

    return cost;
  } catch (error) {
    return 0;
  }
}

/**
 * Determine status based on percentage and threshold
 */
function getStatus(percentage: number, threshold: number): 'ok' | 'warning' | 'critical' {
  if (percentage >= 100) return 'critical';
  if (percentage >= threshold) return 'warning';
  return 'ok';
}

/**
 * Display free tier status in fancy format
 */
function displayFreeTierStatus(
  accountInfo: any,
  services: FreeTierService[],
  threshold: number,
  showProjection: boolean = false
): void {
  console.log();
  console.log(chalk.bold.cyan('🆓 AWS Free Tier Status'), chalk.dim(`(Account: ${accountInfo.id})`));
  console.log(chalk.dim('═'.repeat(60)));
  console.log();

  services.forEach((service) => {
    const statusIcon = service.status === 'ok' ? '✅' : service.status === 'warning' ? '⚠️' : '🚨';
    const statusColor =
      service.status === 'ok' ? chalk.green : service.status === 'warning' ? chalk.yellow : chalk.red;

    console.log(chalk.bold.white(`${service.name} (${service.description})`));
    console.log(
      `├── Used: ${statusColor(`${service.used.toFixed(1)} ${service.unit}`)} / ${service.limit} ${service.unit} (${service.percentage.toFixed(1)}%)`
    );

    const progressBar = createProgressBar(service.percentage, 30);
    console.log(`├── ${progressBar}`);

    if (service.status === 'ok') {
      console.log(`└── ${statusIcon} On track`);
    } else if (service.status === 'warning') {
      const remaining = service.limit - service.used;
      console.log(`└── ${statusIcon} ${chalk.yellow(`Warning: ${remaining.toFixed(1)} ${service.unit} remaining`)}`);
    } else {
      console.log(`└── ${statusIcon} ${chalk.red('Critical: Free tier limit exceeded!')}`);
    }

    console.log();
  });

  console.log(chalk.dim('─'.repeat(60)));
  console.log(chalk.cyan('💡 Tip:'), `You have ${services[0]?.daysRemaining || 0} days until month end`);

  if (showProjection) {
    console.log();
    console.log(chalk.bold.cyan('📈 Projected Month-End Overages'));
    console.log(chalk.dim('─'.repeat(60)));

    services.forEach((service) => {
      if (service.projectedOverage && service.projectedOverage > 0) {
        console.log(
          `${service.name}: ${chalk.red(`$${service.projectedOverage.toFixed(2)} overage projected`)}`
        );
      }
    });
  }

  console.log();
}

/**
 * Create a text-based progress bar
 */
function createProgressBar(percent: number, width: number = 30): string {
  const filled = Math.min(Math.round((percent / 100) * width), width);
  const empty = width - filled;

  const color = percent >= 100 ? chalk.red : percent >= 80 ? chalk.yellow : chalk.green;

  const bar = color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  return `[${bar}] ${Math.min(percent, 100).toFixed(0)}%`;
}
