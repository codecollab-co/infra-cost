import chalk from 'chalk';
import { ResourceInventory, ResourceType, ResourceBase } from '../types/providers';
import { hideSpinner } from '../logger';

export function printInventory(accountAlias: string, inventory: ResourceInventory, detailed: boolean = false) {
  hideSpinner();
  console.clear();

  // Enhanced Header with Provider Branding
  const providerIcons = {
    'aws': '☁️',
    'gcp': '🌐',
    'azure': '🔷',
    'alicloud': '🟠',
    'oracle': '🔴'
  };

  const providerNames = {
    'aws': 'Amazon Web Services (AWS)',
    'gcp': 'Google Cloud Platform (GCP)',
    'azure': 'Microsoft Azure',
    'alicloud': 'Alibaba Cloud',
    'oracle': 'Oracle Cloud Infrastructure (OCI)'
  };

  const providerIcon = providerIcons[inventory.provider] || '☁️';
  const providerName = providerNames[inventory.provider] || inventory.provider.toUpperCase();

  console.log('');
  console.log('═'.repeat(80));
  console.log(`${providerIcon}  ${chalk.bold.cyan('INFRASTRUCTURE INVENTORY')} - ${chalk.bold.yellow(providerName)}`);
  console.log('═'.repeat(80));
  console.log(`${'🏗️  Account/Project:'.padEnd(30)} ${chalk.bold.cyan(accountAlias)}`);
  console.log(`${'☁️  Provider:'.padEnd(30)} ${chalk.green(providerName)}`);
  console.log(`${'🌍 Region(s):'.padEnd(30)} ${chalk.blue(inventory.region)}`);
  console.log(`${'📅 Last Updated:'.padEnd(30)} ${chalk.gray(inventory.lastUpdated.toLocaleString())}`);
  console.log('');

  // Summary Stats
  console.log(chalk.bold.yellow('📊 Summary Statistics'));
  console.log('─'.repeat(50));
  console.log(`${'Total Resources:'.padEnd(25)} ${chalk.bold.white(inventory.totalResources.toString())}`);
  if (inventory.totalCost > 0) {
    console.log(`${'Total Cost to Date:'.padEnd(25)} ${chalk.bold.green(`$${inventory.totalCost.toFixed(2)}`)}`);
  }
  console.log('');

  // Resource Type Breakdown
  console.log(chalk.bold.yellow('📈 Resources by Type'));
  console.log('─'.repeat(50));

  const typeIcons = {
    [ResourceType.COMPUTE]: '💻',
    [ResourceType.STORAGE]: '💾',
    [ResourceType.DATABASE]: '🗄️',
    [ResourceType.NETWORK]: '🌐',
    [ResourceType.SECURITY]: '🔒',
    [ResourceType.SERVERLESS]: '⚡',
    [ResourceType.CONTAINER]: '🐳',
    [ResourceType.ANALYTICS]: '📊'
  };

  Object.entries(inventory.resourcesByType).forEach(([type, count]) => {
    if (count > 0) {
      const icon = typeIcons[type as ResourceType] || '📦';
      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      console.log(`${icon} ${typeLabel.padEnd(15)} ${chalk.bold.cyan(count.toString().padStart(6))}`);
    }
  });
  console.log('');

  if (detailed && inventory.totalResources > 0) {
    // Detailed Resource Lists
    Object.entries(inventory.resources).forEach(([category, resources]) => {
      if (resources.length > 0) {
        const icon = typeIcons[category as ResourceType] || '📦';
        const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);

        console.log(chalk.bold.yellow(`${icon} ${categoryLabel} Resources (${resources.length})`));
        console.log('─'.repeat(80));

        // Table headers
        const nameHeader = 'Name'.padEnd(25);
        const stateHeader = 'State'.padEnd(12);
        const regionHeader = 'Region'.padEnd(15);
        const costHeader = inventory.totalCost > 0 ? 'Cost'.padStart(10) : '';

        console.log(chalk.white(`${nameHeader} ${stateHeader} ${regionHeader} ${costHeader}`));
        console.log('─'.repeat(80));

        resources.forEach((resource: ResourceBase) => {
          const name = chalk.cyan((resource.name || resource.id).substring(0, 24).padEnd(25));
          const state = getStateColor(resource.state).padEnd(12);
          const region = chalk.blue(resource.region.substring(0, 14).padEnd(15));
          const cost = resource.costToDate ? chalk.green(`$${resource.costToDate.toFixed(2)}`.padStart(10)) : ''.padStart(10);

          console.log(`${name} ${state} ${region} ${cost}`);
        });
        console.log('');
      }
    });

    // Resource Tags Summary (if any resources have tags)
    const resourcesWithTags = Object.values(inventory.resources)
      .flat()
      .filter(resource => resource.tags && Object.keys(resource.tags).length > 0);

    if (resourcesWithTags.length > 0) {
      console.log(chalk.bold.yellow('🏷️  Common Tags'));
      console.log('─'.repeat(50));

      const tagCounts: Record<string, number> = {};
      resourcesWithTags.forEach(resource => {
        Object.keys(resource.tags || {}).forEach(tagKey => {
          tagCounts[tagKey] = (tagCounts[tagKey] || 0) + 1;
        });
      });

      Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([tag, count]) => {
          console.log(`${tag.padEnd(20)} ${chalk.cyan(count.toString().padStart(6))}`);
        });
      console.log('');
    }
  }

  // Footer with tips
  console.log(chalk.gray('💡 Tips:'));
  console.log(chalk.gray('   • Use --resource-costs to include cost analysis'));
  console.log(chalk.gray('   • Use --inventory-type <type> to filter by resource type'));
  console.log(chalk.gray('   • Use --optimization-tips to get cost optimization recommendations'));
  console.log(chalk.gray('   • Use --inventory-export <format> to export data'));
  console.log('');
}

function getStateColor(state: string): string {
  const lowerState = state.toLowerCase();

  if (lowerState.includes('running') || lowerState.includes('active') || lowerState.includes('available')) {
    return chalk.green(state);
  } else if (lowerState.includes('stopped') || lowerState.includes('terminated')) {
    return chalk.red(state);
  } else if (lowerState.includes('pending') || lowerState.includes('starting')) {
    return chalk.yellow(state);
  } else {
    return chalk.gray(state);
  }
}

export function printResourceSummary(inventory: ResourceInventory) {
  console.log(`\n📊 Found ${inventory.totalResources} resources across ${inventory.provider.toUpperCase()}`);

  if (inventory.totalCost > 0) {
    console.log(`💰 Total estimated cost: ${chalk.green(`$${inventory.totalCost.toFixed(2)}`)}`);
  }

  const activeTypes = Object.entries(inventory.resourcesByType)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');

  if (activeTypes) {
    console.log(`📈 Resource breakdown: ${activeTypes}`);
  }
}

export function printOptimizationRecommendations(recommendations: string[]) {
  if (recommendations.length === 0) {
    console.log('\n🎉 No optimization recommendations at this time.');
    return;
  }

  console.log('\n🔧 Cost Optimization Recommendations:');
  console.log('─'.repeat(60));

  recommendations.forEach((recommendation, index) => {
    console.log(`${chalk.yellow(`${index + 1}.`)} ${recommendation}`);
  });

  console.log('\n💡 Implementing these recommendations could significantly reduce your cloud costs.');
  console.log('');
}