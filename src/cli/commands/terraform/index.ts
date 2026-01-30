/**
 * Terraform Cost Preview Commands
 * Issue #47: Terraform Cost Preview (Shift-Left Cost Management)
 *
 * Analyzes Terraform plans to estimate infrastructure costs before deployment
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
import chalk from 'chalk';

interface TerraformPlan {
  resource_changes?: ResourceChange[];
  configuration?: any;
  planned_values?: any;
  prior_state?: any;
}

interface ResourceChange {
  type: string;
  name: string;
  address: string;
  change: {
    actions: string[];
    before: any;
    after: any;
  };
}

interface CostEstimate {
  resource: string;
  resourceType: string;
  action: 'create' | 'modify' | 'destroy';
  monthlyCost: number;
  hourlyCost: number;
  previousCost?: number;
  details: string;
}

interface CostSummary {
  creates: CostEstimate[];
  modifies: CostEstimate[];
  destroys: CostEstimate[];
  currentMonthlyCost: number;
  newMonthlyCost: number;
  difference: number;
  percentChange: number;
}

/**
 * AWS pricing data (simplified, real implementation would use AWS Pricing API)
 */
const AWS_PRICING: Record<string, any> = {
  // EC2 instances (us-east-1 on-demand hourly rates)
  ec2: {
    't2.micro': 0.0116,
    't2.small': 0.0232,
    't2.medium': 0.0464,
    't2.large': 0.0928,
    't2.xlarge': 0.1856,
    't3.micro': 0.0104,
    't3.small': 0.0208,
    't3.medium': 0.0416,
    't3.large': 0.0832,
    't3.xlarge': 0.1664,
    't3.2xlarge': 0.3328,
    'm5.large': 0.096,
    'm5.xlarge': 0.192,
    'm5.2xlarge': 0.384,
    'c5.large': 0.085,
    'c5.xlarge': 0.17,
    'r5.large': 0.126,
    'r5.xlarge': 0.252,
  },
  // RDS instances (db.r5 family)
  rds: {
    'db.t3.micro': 0.017,
    'db.t3.small': 0.034,
    'db.t3.medium': 0.068,
    'db.t3.large': 0.136,
    'db.r5.large': 0.24,
    'db.r5.xlarge': 0.48,
    'db.r5.2xlarge': 0.96,
    'db.m5.large': 0.196,
    'db.m5.xlarge': 0.392,
  },
  // EBS volumes (per GB-month)
  ebs: {
    gp2: 0.10,
    gp3: 0.08,
    io1: 0.125,
    io2: 0.125,
    st1: 0.045,
    sc1: 0.015,
  },
  // Load Balancers (per hour)
  alb: 0.0225,
  nlb: 0.0225,
  clb: 0.025,
  // NAT Gateway (per hour + data transfer)
  natgateway: 0.045,
  // ElastiCache (per hour)
  elasticache: {
    'cache.t3.micro': 0.017,
    'cache.t3.small': 0.034,
    'cache.m5.large': 0.161,
  },
};

/**
 * Parse Terraform plan file (JSON format)
 */
function parseTerraformPlan(planPath: string): TerraformPlan {
  try {
    // Convert binary plan to JSON if needed
    let planJson: string;

    if (planPath.endsWith('.json')) {
      planJson = readFileSync(planPath, 'utf-8');
    } else {
      // Use terraform show to convert binary plan to JSON
      planJson = execSync(`terraform show -json "${planPath}"`, {
        encoding: 'utf-8',
      });
    }

    return JSON.parse(planJson);
  } catch (error: any) {
    throw new Error(`Failed to parse Terraform plan: ${error.message}`);
  }
}

/**
 * Estimate cost for a single resource
 */
function estimateResourceCost(change: ResourceChange): CostEstimate | null {
  const { type, name, address, change: changeDetails } = change;
  const action = changeDetails.actions[0] as 'create' | 'update' | 'delete';

  // Map action to our format
  const actionMap: Record<string, 'create' | 'modify' | 'destroy'> = {
    create: 'create',
    update: 'modify',
    delete: 'destroy',
  };

  const mappedAction = actionMap[action] || 'create';

  // Extract resource configuration
  const config = changeDetails.after || changeDetails.before || {};

  let monthlyCost = 0;
  let hourlyCost = 0;
  let details = '';

  // EC2 instances
  if (type === 'aws_instance') {
    const instanceType = config.instance_type || 't3.micro';
    hourlyCost = AWS_PRICING.ec2[instanceType] || 0.1;
    monthlyCost = hourlyCost * 730; // hours per month
    details = instanceType;
  }

  // RDS instances
  else if (type === 'aws_db_instance') {
    const instanceClass = config.instance_class || 'db.t3.micro';
    hourlyCost = AWS_PRICING.rds[instanceClass] || 0.1;
    monthlyCost = hourlyCost * 730;

    // Add storage cost
    const allocatedStorage = config.allocated_storage || 20;
    const storageType = config.storage_type || 'gp2';
    const storageCostPerGB = AWS_PRICING.ebs[storageType] || 0.1;
    monthlyCost += allocatedStorage * storageCostPerGB;

    details = `${instanceClass}, ${allocatedStorage}GB ${storageType}`;
  }

  // EBS volumes
  else if (type === 'aws_ebs_volume') {
    const size = config.size || 8;
    const volumeType = config.type || 'gp2';
    const costPerGB = AWS_PRICING.ebs[volumeType] || 0.1;
    monthlyCost = size * costPerGB;
    hourlyCost = monthlyCost / 730;
    details = `${size}GB ${volumeType}`;
  }

  // Load Balancers
  else if (type === 'aws_lb' || type === 'aws_alb') {
    const lbType = config.load_balancer_type || 'application';
    hourlyCost = lbType === 'network' ? AWS_PRICING.nlb : AWS_PRICING.alb;
    monthlyCost = hourlyCost * 730;
    details = `${lbType} load balancer`;
  }

  // Classic Load Balancer
  else if (type === 'aws_elb') {
    hourlyCost = AWS_PRICING.clb;
    monthlyCost = hourlyCost * 730;
    details = 'classic load balancer';
  }

  // NAT Gateway
  else if (type === 'aws_nat_gateway') {
    hourlyCost = AWS_PRICING.natgateway;
    monthlyCost = hourlyCost * 730;
    details = 'NAT gateway (base cost)';
  }

  // ElastiCache
  else if (type === 'aws_elasticache_cluster') {
    const nodeType = config.node_type || 'cache.t3.micro';
    const numNodes = config.num_cache_nodes || 1;
    hourlyCost = (AWS_PRICING.elasticache[nodeType] || 0.017) * numNodes;
    monthlyCost = hourlyCost * 730;
    details = `${numNodes}x ${nodeType}`;
  }

  // S3 bucket (storage costs are usage-based, estimate $5/bucket)
  else if (type === 'aws_s3_bucket') {
    monthlyCost = 5.0; // Minimal estimate
    hourlyCost = monthlyCost / 730;
    details = 'estimated storage cost';
  }

  // Lambda (minimal cost estimate)
  else if (type === 'aws_lambda_function') {
    monthlyCost = 1.0; // Minimal estimate
    hourlyCost = monthlyCost / 730;
    details = 'estimated execution cost';
  }

  // Unsupported resource
  else {
    return null;
  }

  // For destroy actions, make cost negative
  if (mappedAction === 'destroy') {
    monthlyCost = -monthlyCost;
    hourlyCost = -hourlyCost;
  }

  return {
    resource: address,
    resourceType: type,
    action: mappedAction,
    monthlyCost,
    hourlyCost,
    details,
  };
}

/**
 * Analyze Terraform plan and estimate costs
 */
function analyzePlan(plan: TerraformPlan): CostSummary {
  const creates: CostEstimate[] = [];
  const modifies: CostEstimate[] = [];
  const destroys: CostEstimate[] = [];

  const changes = plan.resource_changes || [];

  changes.forEach((change) => {
    const estimate = estimateResourceCost(change);
    if (!estimate) return;

    if (estimate.action === 'create') {
      creates.push(estimate);
    } else if (estimate.action === 'modify') {
      modifies.push(estimate);
    } else if (estimate.action === 'destroy') {
      destroys.push(estimate);
    }
  });

  // Calculate totals
  const createCost = creates.reduce((sum, e) => sum + e.monthlyCost, 0);
  const destroyCost = Math.abs(
    destroys.reduce((sum, e) => sum + e.monthlyCost, 0),
  );
  const modifyCost = modifies.reduce((sum, e) => sum + e.monthlyCost, 0);

  // Current cost = destroy cost (what we're removing)
  // New cost = create cost + modify cost
  const currentMonthlyCost = destroyCost;
  const newMonthlyCost = createCost + modifyCost;
  const difference = newMonthlyCost - currentMonthlyCost;
  const percentChange =
    currentMonthlyCost > 0
      ? (difference / currentMonthlyCost) * 100
      : difference > 0
        ? 100
        : 0;

  return {
    creates,
    modifies,
    destroys,
    currentMonthlyCost,
    newMonthlyCost,
    difference,
    percentChange,
  };
}

/**
 * Format cost estimate for display
 */
function formatCostEstimate(summary: CostSummary, options: any): string {
  const { output } = options;

  if (output === 'json') {
    return JSON.stringify(summary, null, 2);
  }

  // Text format with fancy box drawing
  let result = '';

  result += chalk.bold.blue(
    '╭─────────────────────────────────────────────────────────────╮\n',
  );
  result += chalk.bold.blue(
    '│' + chalk.white('             Terraform Cost Estimate                     ') + '│\n',
  );
  result += chalk.bold.blue(
    '├─────────────────────────────────────────────────────────────┤\n',
  );

  // Resources to CREATE
  if (summary.creates.length > 0) {
    result += chalk.bold.blue('│ ') + chalk.green('Resources to CREATE:') + ' '.repeat(38) + chalk.bold.blue('│\n');
    result += chalk.bold.blue(
      '│ ───────────────────────────────────────────────────────── │\n',
    );

    summary.creates.forEach((est) => {
      const resourceLine = `+ ${est.resource} (${est.details})`;
      const costLine = `  └── Monthly: $${est.monthlyCost.toFixed(2)} | Hourly: $${est.hourlyCost.toFixed(4)}`;

      result += chalk.bold.blue('│ ') + chalk.green(resourceLine.padEnd(59)) + chalk.bold.blue('│\n');
      result += chalk.bold.blue('│ ') + chalk.gray(costLine.padEnd(59)) + chalk.bold.blue('│\n');
    });

    result += chalk.bold.blue(
      '├─────────────────────────────────────────────────────────────┤\n',
    );
  }

  // Resources to MODIFY
  if (summary.modifies.length > 0) {
    result += chalk.bold.blue('│ ') + chalk.yellow('Resources to MODIFY:') + ' '.repeat(38) + chalk.bold.blue('│\n');
    result += chalk.bold.blue(
      '│ ───────────────────────────────────────────────────────── │\n',
    );

    summary.modifies.forEach((est) => {
      const resourceLine = `~ ${est.resource}`;
      const costLine = `  └── ${est.details}: ${est.monthlyCost >= 0 ? '+' : ''}$${est.monthlyCost.toFixed(2)}/month`;

      result += chalk.bold.blue('│ ') + chalk.yellow(resourceLine.padEnd(59)) + chalk.bold.blue('│\n');
      result += chalk.bold.blue('│ ') + chalk.gray(costLine.padEnd(59)) + chalk.bold.blue('│\n');
    });

    result += chalk.bold.blue(
      '├─────────────────────────────────────────────────────────────┤\n',
    );
  }

  // Resources to DESTROY
  if (summary.destroys.length > 0) {
    result += chalk.bold.blue('│ ') + chalk.red('Resources to DESTROY:') + ' '.repeat(37) + chalk.bold.blue('│\n');
    result += chalk.bold.blue(
      '│ ───────────────────────────────────────────────────────── │\n',
    );

    summary.destroys.forEach((est) => {
      const resourceLine = `- ${est.resource}`;
      const costLine = `  └── Savings: $${Math.abs(est.monthlyCost).toFixed(2)}/month`;

      result += chalk.bold.blue('│ ') + chalk.red(resourceLine.padEnd(59)) + chalk.bold.blue('│\n');
      result += chalk.bold.blue('│ ') + chalk.gray(costLine.padEnd(59)) + chalk.bold.blue('│\n');
    });

    result += chalk.bold.blue(
      '├─────────────────────────────────────────────────────────────┤\n',
    );
  }

  // Summary
  result += chalk.bold.blue('│ ') + chalk.bold.white('SUMMARY') + ' '.repeat(52) + chalk.bold.blue('│\n');
  result += chalk.bold.blue(
    '│ ───────────────────────────────────────────────────────── │\n',
  );

  const currentLine = `Current Monthly Cost:     $${summary.currentMonthlyCost.toFixed(2)}`;
  const newLine = `Estimated New Cost:       $${summary.newMonthlyCost.toFixed(2)}`;
  const diffSymbol = summary.difference >= 0 ? '+' : '';
  const diffLine = `Difference:               ${diffSymbol}$${summary.difference.toFixed(2)}/month (${diffSymbol}${summary.percentChange.toFixed(1)}%)`;

  result += chalk.bold.blue('│ ') + currentLine.padEnd(59) + chalk.bold.blue('│\n');
  result += chalk.bold.blue('│ ') + newLine.padEnd(59) + chalk.bold.blue('│\n');

  const diffColor = summary.difference > 0 ? chalk.red : chalk.green;
  result += chalk.bold.blue('│ ') + diffColor(diffLine).padEnd(69) + chalk.bold.blue('│\n');

  // Threshold warning
  const threshold = parseFloat(options.threshold || '20');
  if (Math.abs(summary.percentChange) > threshold) {
    result += chalk.bold.blue('│ ') + ' '.repeat(59) + chalk.bold.blue('│\n');
    const warning = `⚠️  Cost ${summary.difference > 0 ? 'increase' : 'decrease'} exceeds ${threshold}% threshold!`;
    result +=
      chalk.bold.blue('│ ') +
      chalk.yellow.bold(warning.padEnd(59)) +
      chalk.bold.blue('│\n');
  }

  result += chalk.bold.blue(
    '╰─────────────────────────────────────────────────────────────╯\n',
  );

  return result;
}

/**
 * Handle terraform cost preview command
 */
async function handleTerraform(options: any): Promise<void> {
  const { plan, threshold, output } = options;

  if (!plan) {
    console.error(chalk.red('Error: --plan argument is required'));
    console.log('Usage: infra-cost terraform --plan <path-to-terraform-plan>');
    process.exit(1);
  }

  try {
    console.log(chalk.blue('📊 Analyzing Terraform plan...\n'));

    // Parse plan
    const terraformPlan = parseTerraformPlan(plan);

    // Analyze costs
    const summary = analyzePlan(terraformPlan);

    // Display results
    const formatted = formatCostEstimate(summary, options);
    console.log(formatted);

    // Check threshold and exit accordingly
    const thresholdValue = parseFloat(threshold || '0');
    if (
      thresholdValue > 0 &&
      Math.abs(summary.percentChange) > thresholdValue
    ) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Register terraform command
 */
export function registerTerraformCommand(program: Command): void {
  program
    .command('terraform')
    .description('Estimate costs from Terraform plan (shift-left cost management)')
    .option(
      '--plan <path>',
      'Path to terraform plan file (binary or JSON)',
      '',
    )
    .option(
      '--threshold <percent>',
      'Fail if cost change exceeds threshold percentage',
      '0',
    )
    .action(handleTerraform);
}
