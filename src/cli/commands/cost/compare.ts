/**
 * Cost Compare Command Handler
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { getGlobalLogger } from '../../../core/logging';
import { autoLoadConfig } from '../../../core/auto-config';
import { CloudProviderFactory } from '../../../providers/factory';
import { CloudProvider } from '../../../types/providers';

interface ProviderCosts {
  provider: string;
  totalCost: number;
  serviceCosts: Record<string, number>;
  topServices: Array<{ name: string; cost: number }>;
}

export async function handleCompare(options: any, command: any): Promise<void> {
  const logger = getGlobalLogger();
  logger.info('Comparing costs across clouds', options);

  try {
    const providersToCompare = options.providers
      ? options.providers.split(',').map((p: string) => p.trim().toLowerCase())
      : ['aws', 'gcp', 'azure'];

    const servicesToCompare = options.services
      ? options.services.split(',').map((s: string) => s.trim())
      : null;

    const normalize = options.normalize || false;

    console.log(chalk.blue('🌐 Comparing costs across cloud providers...'));
    console.log();

    // Collect costs from each provider
    const providerCosts: ProviderCosts[] = [];
    const factory = new CloudProviderFactory();

    for (const providerName of providersToCompare) {
      try {
        console.log(chalk.gray(`  Fetching ${providerName.toUpperCase()} costs...`));

        const config = autoLoadConfig({ provider: providerName as any });
        const provider = factory.createProvider({
          provider: providerName as CloudProvider,
          credentials: config.credentials || {},
        });

        const costBreakdown = await provider.getCostBreakdown();
        const serviceCosts = costBreakdown.byService;

        // Calculate total
        const totalCost = Object.values(serviceCosts).reduce(
          (sum, cost) => sum + cost,
          0
        );

        // Get top services
        const topServices = Object.entries(serviceCosts)
          .map(([name, cost]) => ({ name, cost }))
          .sort((a, b) => b.cost - a.cost)
          .slice(0, 5);

        providerCosts.push({
          provider: providerName.toUpperCase(),
          totalCost,
          serviceCosts,
          topServices,
        });
      } catch (error: any) {
        console.log(chalk.yellow(`  ⚠️  Could not fetch ${providerName.toUpperCase()} costs: ${error.message}`));
      }
    }

    if (providerCosts.length === 0) {
      console.log(chalk.red('❌ No provider costs could be retrieved'));
      return;
    }

    // Display comparison
    displayTotalComparison(providerCosts);
    displayServiceComparison(providerCosts, servicesToCompare);
    displayTopServicesComparison(providerCosts);
    displayRecommendations(providerCosts);

  } catch (error: any) {
    console.error(chalk.red('❌ Failed to compare costs:'), error.message);
    logger.error('Compare error', { error: error.message });
  }
}

/**
 * Display total cost comparison
 */
function displayTotalComparison(providerCosts: ProviderCosts[]): void {
  console.log(chalk.bold.blue('💰 Total Cost Comparison'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();

  const table = new Table({
    head: ['Provider', 'Total Cost (MTD)', '% of Total', 'Rank'],
    style: {
      head: ['cyan'],
    },
  });

  const grandTotal = providerCosts.reduce((sum, p) => sum + p.totalCost, 0);

  // Sort by total cost descending
  const sorted = [...providerCosts].sort((a, b) => b.totalCost - a.totalCost);

  sorted.forEach((provider, index) => {
    const percentage = (provider.totalCost / grandTotal) * 100;
    const rankColor = index === 0 ? chalk.red : index === sorted.length - 1 ? chalk.green : chalk.yellow;

    table.push([
      provider.provider,
      chalk.yellow(`$${provider.totalCost.toFixed(2)}`),
      chalk.cyan(`${percentage.toFixed(1)}%`),
      rankColor(`#${index + 1}`),
    ]);
  });

  table.push([
    chalk.bold('TOTAL'),
    chalk.bold.yellow(`$${grandTotal.toFixed(2)}`),
    chalk.bold.cyan('100.0%'),
    '',
  ]);

  console.log(table.toString());
  console.log();
}

/**
 * Display service-level comparison
 */
function displayServiceComparison(
  providerCosts: ProviderCosts[],
  servicesToCompare: string[] | null
): void {
  console.log(chalk.bold.blue('🔧 Service-Level Comparison'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();

  // Collect all unique services
  const allServices = new Set<string>();
  providerCosts.forEach(provider => {
    Object.keys(provider.serviceCosts).forEach(service => allServices.add(service));
  });

  // Filter if specific services requested
  let servicesToShow = Array.from(allServices);
  if (servicesToCompare) {
    servicesToShow = servicesToShow.filter(s =>
      servicesToCompare.some(filter =>
        s.toLowerCase().includes(filter.toLowerCase())
      )
    );
  }

  // Limit to top 10 services by total cost
  const serviceTotals = servicesToShow.map(service => ({
    service,
    total: providerCosts.reduce(
      (sum, provider) => sum + (provider.serviceCosts[service] || 0),
      0
    ),
  }));

  const topServices = serviceTotals
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  if (topServices.length === 0) {
    console.log(chalk.gray('  No matching services found'));
    console.log();
    return;
  }

  const table = new Table({
    head: ['Service', ...providerCosts.map(p => p.provider), 'Total'],
    style: {
      head: ['cyan'],
    },
  });

  topServices.forEach(({ service, total }) => {
    const row = [
      service,
      ...providerCosts.map(provider => {
        const cost = provider.serviceCosts[service] || 0;
        return cost > 0 ? chalk.yellow(`$${cost.toFixed(2)}`) : chalk.gray('-');
      }),
      chalk.bold.yellow(`$${total.toFixed(2)}`),
    ];
    table.push(row);
  });

  console.log(table.toString());
  console.log();
}

/**
 * Display top services per provider
 */
function displayTopServicesComparison(providerCosts: ProviderCosts[]): void {
  console.log(chalk.bold.blue('🏆 Top 5 Services per Provider'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();

  providerCosts.forEach(provider => {
    console.log(chalk.bold.cyan(`${provider.provider}:`));

    const table = new Table({
      head: ['Service', 'Cost', '% of Provider'],
      style: {
        head: ['cyan'],
      },
    });

    provider.topServices.forEach((service, index) => {
      const percentage = (service.cost / provider.totalCost) * 100;
      const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';

      table.push([
        `${rankEmoji} ${service.name}`,
        chalk.yellow(`$${service.cost.toFixed(2)}`),
        chalk.cyan(`${percentage.toFixed(1)}%`),
      ]);
    });

    console.log(table.toString());
    console.log();
  });
}

/**
 * Display cost optimization recommendations
 */
function displayRecommendations(providerCosts: ProviderCosts[]): void {
  console.log(chalk.bold.blue('💡 Cost Optimization Recommendations'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();

  const sorted = [...providerCosts].sort((a, b) => b.totalCost - a.totalCost);
  const highestCostProvider = sorted[0];
  const lowestCostProvider = sorted[sorted.length - 1];

  if (providerCosts.length === 1) {
    console.log(chalk.blue('  ℹ️  Single provider comparison'));
    console.log(chalk.gray('     • Add more providers to see cross-cloud opportunities'));
    console.log();
    return;
  }

  // Cost distribution analysis
  const grandTotal = providerCosts.reduce((sum, p) => sum + p.totalCost, 0);
  const highestPercentage = (highestCostProvider.totalCost / grandTotal) * 100;

  if (highestPercentage > 60) {
    console.log(chalk.yellow(`  ⚠️  ${highestCostProvider.provider} represents ${highestPercentage.toFixed(1)}% of total costs`));
    console.log(chalk.gray('     • Consider multi-cloud strategy to reduce vendor lock-in'));
    console.log(chalk.gray('     • Evaluate workload migration opportunities'));
    console.log();
  }

  // Service overlap analysis
  const commonServices = findCommonServices(providerCosts);
  if (commonServices.length > 0) {
    console.log(chalk.blue(`  🔄 ${commonServices.length} services running across multiple providers`));
    console.log(chalk.gray('     • Review for potential consolidation opportunities'));
    console.log(chalk.gray('     • Consider reserved instances/committed use discounts'));
    console.log();
  }

  // Cost efficiency comparison
  const costDifference = highestCostProvider.totalCost - lowestCostProvider.totalCost;
  const savingsPercentage = (costDifference / highestCostProvider.totalCost) * 100;

  if (savingsPercentage > 20) {
    console.log(chalk.green(`  💰 Potential savings: $${costDifference.toFixed(2)}/month (${savingsPercentage.toFixed(1)}%)`));
    console.log(chalk.gray(`     • Migrate workloads from ${highestCostProvider.provider} to ${lowestCostProvider.provider}`));
    console.log(chalk.gray('     • Review pricing models and reserved capacity options'));
    console.log();
  }

  console.log(chalk.blue('  📊 General Recommendations:'));
  console.log(chalk.gray('     • Set up cross-cloud cost allocation tags'));
  console.log(chalk.gray('     • Implement automated resource scaling'));
  console.log(chalk.gray('     • Review and optimize data transfer costs between clouds'));
  console.log();
}

/**
 * Find services that appear in multiple providers
 */
function findCommonServices(providerCosts: ProviderCosts[]): string[] {
  if (providerCosts.length < 2) return [];

  const serviceCounts = new Map<string, number>();

  providerCosts.forEach(provider => {
    Object.keys(provider.serviceCosts).forEach(service => {
      serviceCounts.set(service, (serviceCounts.get(service) || 0) + 1);
    });
  });

  return Array.from(serviceCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([service]) => service);
}
