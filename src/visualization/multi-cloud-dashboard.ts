import chalk from 'chalk';
import { CloudProvider, ResourceInventory, CloudProviderAdapter, ResourceType, ResourceBase } from '../types/providers';
import { CloudProviderFactory } from '../providers/factory';
import { CloudProfileDiscovery } from '../discovery/profile-discovery';
import { TerminalUIEngine } from './terminal-ui';

interface MultiCloudInventorySummary {
  totalProviders: number;
  totalResources: number;
  totalCost: number;
  providerBreakdown: Record<CloudProvider, {
    inventory: ResourceInventory | null;
    status: 'active' | 'unavailable' | 'error';
    errorMessage?: string;
    resourceCount: number;
    cost: number;
  }>;
  consolidatedResourcesByType: Record<ResourceType, number>;
  topResourcesByProvider: Array<{
    provider: CloudProvider;
    resourceType: ResourceType;
    count: number;
    percentage: number;
  }>;
}

export class MultiCloudDashboard {
  private ui: TerminalUIEngine;
  private factory: CloudProviderFactory;
  private discovery: CloudProfileDiscovery;

  constructor() {
    this.ui = new TerminalUIEngine();
    this.factory = new CloudProviderFactory();
    this.discovery = new CloudProfileDiscovery();
  }

  /**
   * Create comprehensive multi-cloud inventory dashboard
   */
  async generateMultiCloudInventoryDashboard(providers?: CloudProvider[]): Promise<string> {
    console.log(chalk.yellow('🌐 Gathering multi-cloud inventory...'));

    const summary = await this.collectMultiCloudInventory(providers);
    return this.renderMultiCloudDashboard(summary);
  }

  /**
   * Collect inventory from all available cloud providers
   */
  private async collectMultiCloudInventory(providers?: CloudProvider[]): Promise<MultiCloudInventorySummary> {
    const summary: MultiCloudInventorySummary = {
      totalProviders: 0,
      totalResources: 0,
      totalCost: 0,
      providerBreakdown: {} as any,
      consolidatedResourcesByType: {
        [ResourceType.COMPUTE]: 0,
        [ResourceType.STORAGE]: 0,
        [ResourceType.DATABASE]: 0,
        [ResourceType.NETWORK]: 0,
        [ResourceType.SECURITY]: 0,
        [ResourceType.SERVERLESS]: 0,
        [ResourceType.CONTAINER]: 0,
        [ResourceType.ANALYTICS]: 0
      },
      topResourcesByProvider: []
    };

    // Discover available profiles
    const discoveryResults = await this.discovery.discoverAllProfiles();
    const targetProviders = providers || this.factory.getSupportedProviders();

    // Process each provider
    for (const provider of targetProviders) {
      const profiles = discoveryResults.byProvider[provider];

      summary.providerBreakdown[provider] = {
        inventory: null,
        status: 'unavailable',
        resourceCount: 0,
        cost: 0
      };

      if (profiles.length === 0) {
        continue;
      }

      try {
        // Use the first available profile for each provider
        const profile = profiles.find(p => p.status === 'available');
        if (!profile) {
          summary.providerBreakdown[provider].status = 'unavailable';
          continue;
        }

        console.log(chalk.gray(`  Scanning ${provider.toUpperCase()} resources...`));

        // Create provider adapter
        const providerAdapter = this.createProviderAdapter(provider, profile);

        if (!providerAdapter) {
          summary.providerBreakdown[provider].status = 'error';
          summary.providerBreakdown[provider].errorMessage = 'Failed to initialize provider';
          continue;
        }

        // Get inventory
        const inventory = await providerAdapter.getResourceInventory({
          includeCosts: true,
          resourceTypes: Object.values(ResourceType)
        });

        summary.providerBreakdown[provider] = {
          inventory,
          status: 'active',
          resourceCount: inventory.totalResources,
          cost: inventory.totalCost
        };

        summary.totalProviders++;
        summary.totalResources += inventory.totalResources;
        summary.totalCost += inventory.totalCost;

        // Aggregate resource types
        Object.entries(inventory.resourcesByType).forEach(([type, count]) => {
          summary.consolidatedResourcesByType[type as ResourceType] += count;
        });

      } catch (error) {
        console.warn(chalk.yellow(`⚠️  Failed to scan ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`));
        summary.providerBreakdown[provider].status = 'error';
        summary.providerBreakdown[provider].errorMessage = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Calculate top resources by provider
    summary.topResourcesByProvider = this.calculateTopResourcesByProvider(summary);

    return summary;
  }

  /**
   * Render the multi-cloud dashboard
   */
  private renderMultiCloudDashboard(summary: MultiCloudInventorySummary): string {
    let output = '';

    // Header
    output += this.ui.createHeader('🌐 Multi-Cloud Infrastructure Dashboard',
      `Comprehensive view across ${summary.totalProviders} cloud providers`);

    // Executive Summary
    output += chalk.bold.cyan('📊 Executive Summary') + '\n';
    output += '═'.repeat(60) + '\n\n';

    const summaryTable = this.ui.createTable([
      { header: 'Metric', width: 25, align: 'left', color: 'cyan' },
      { header: 'Value', width: 20, align: 'right', color: 'yellow' },
      { header: 'Details', width: 30, align: 'left' }
    ], [
      {
        metric: 'Active Providers',
        value: summary.totalProviders.toString(),
        details: this.getActiveProvidersList(summary)
      },
      {
        metric: 'Total Resources',
        value: summary.totalResources.toLocaleString(),
        details: this.getResourceTypeBreakdown(summary)
      },
      {
        metric: 'Total Monthly Cost',
        value: `$${summary.totalCost.toFixed(2)}`,
        details: this.getCostBreakdownByProvider(summary)
      }
    ]);

    output += summaryTable + '\n\n';

    // Provider-by-Provider Breakdown
    output += chalk.bold.cyan('☁️ Provider Breakdown') + '\n';
    output += '═'.repeat(60) + '\n\n';

    for (const [provider, data] of Object.entries(summary.providerBreakdown)) {
      const providerName = this.getProviderDisplayName(provider as CloudProvider);
      const statusIcon = this.getStatusIcon(data.status);
      const statusColor = this.getStatusColor(data.status);

      output += `${statusIcon} ${chalk.bold[statusColor](providerName)}\n`;

      if (data.status === 'active' && data.inventory) {
        output += `   Resources: ${chalk.yellow(data.resourceCount.toLocaleString())}\n`;
        output += `   Cost: ${chalk.green(`$${data.cost.toFixed(2)}`)}\n`;
        output += `   Regions: ${chalk.blue(data.inventory.region)}\n`;
        output += `   Last Updated: ${chalk.gray(data.inventory.lastUpdated.toLocaleString())}\n`;

        // Top resource types for this provider
        const topTypes = Object.entries(data.inventory.resourcesByType)
          .filter(([, count]) => count > 0)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([type, count]) => `${count} ${type}`)
          .join(', ');

        if (topTypes) {
          output += `   Top Types: ${chalk.gray(topTypes)}\n`;
        }
      } else if (data.status === 'error') {
        output += `   ${chalk.red('Error: ' + (data.errorMessage || 'Unknown error'))}\n`;
      } else if (data.status === 'unavailable') {
        output += `   ${chalk.gray('No credentials or profiles configured')}\n`;
      }

      output += '\n';
    }

    // Consolidated Resource Type Analysis
    output += chalk.bold.cyan('📈 Consolidated Resource Analysis') + '\n';
    output += '═'.repeat(60) + '\n\n';

    const resourceTypeTable = this.ui.createTable([
      { header: 'Resource Type', width: 20, align: 'left', color: 'blue' },
      { header: 'Total Count', width: 15, align: 'right', color: 'yellow' },
      { header: 'Percentage', width: 12, align: 'right' },
      { header: 'Top Provider', width: 20, align: 'left' }
    ], this.createResourceTypeRows(summary));

    output += resourceTypeTable + '\n\n';

    // Multi-Cloud Insights
    output += this.generateMultiCloudInsights(summary);

    // Recommendations
    output += chalk.bold.cyan('💡 Multi-Cloud Recommendations') + '\n';
    output += '═'.repeat(60) + '\n';
    output += this.generateMultiCloudRecommendations(summary);

    return output;
  }

  /**
   * Generate actionable multi-cloud insights
   */
  private generateMultiCloudInsights(summary: MultiCloudInventorySummary): string {
    let output = chalk.bold.cyan('🧠 Multi-Cloud Insights') + '\n';
    output += '═'.repeat(60) + '\n\n';

    const insights = [];

    // Provider diversity analysis
    const activeProviders = Object.values(summary.providerBreakdown)
      .filter(p => p.status === 'active').length;

    if (activeProviders === 1) {
      insights.push('📍 Single-cloud deployment detected - consider multi-cloud strategy for resilience');
    } else if (activeProviders > 3) {
      insights.push('🌍 Excellent cloud diversity - you have strong vendor independence');
    }

    // Cost concentration analysis
    const providerCosts = Object.entries(summary.providerBreakdown)
      .filter(([, data]) => data.status === 'active')
      .map(([provider, data]) => ({ provider, cost: data.cost }))
      .sort((a, b) => b.cost - a.cost);

    if (providerCosts.length > 1) {
      const topProvider = providerCosts[0];
      const costPercentage = (topProvider.cost / summary.totalCost) * 100;

      if (costPercentage > 70) {
        insights.push(`💰 ${topProvider.provider.toUpperCase()} dominates ${costPercentage.toFixed(1)}% of costs - consider rebalancing`);
      }
    }

    // Resource distribution analysis
    const topResourceType = Object.entries(summary.consolidatedResourcesByType)
      .sort(([, a], [, b]) => b - a)[0];

    if (topResourceType && topResourceType[1] > 0) {
      const percentage = (topResourceType[1] / summary.totalResources) * 100;
      insights.push(`🔧 ${topResourceType[0]} resources account for ${percentage.toFixed(1)}% of total infrastructure`);
    }

    // Add insights to output
    insights.forEach((insight, index) => {
      output += `${index + 1}. ${insight}\n`;
    });

    return output + '\n';
  }

  /**
   * Generate multi-cloud optimization recommendations
   */
  private generateMultiCloudRecommendations(summary: MultiCloudInventorySummary): string {
    let output = '';
    const recommendations = [];

    // Cost optimization recommendations
    const activeProviders = Object.entries(summary.providerBreakdown)
      .filter(([, data]) => data.status === 'active');

    if (activeProviders.length > 1) {
      recommendations.push('🔄 Use --compare-clouds to identify cost arbitrage opportunities');
      recommendations.push('📊 Run --optimization-report for cross-cloud resource rightsizing');
    }

    // Profile management recommendations
    const unavailableProviders = Object.entries(summary.providerBreakdown)
      .filter(([, data]) => data.status === 'unavailable');

    if (unavailableProviders.length > 0) {
      recommendations.push('🔧 Configure credentials for unavailable providers to get complete visibility');
      recommendations.push('🔍 Use --discover-profiles to check for existing but unconfigured profiles');
    }

    // Monitoring recommendations
    if (summary.totalCost > 1000) {
      recommendations.push('📈 Set up --monitor for real-time cost tracking across all providers');
      recommendations.push('🚨 Configure --alert-threshold for multi-cloud budget management');
    }

    // Security recommendations
    recommendations.push('🏷️ Implement consistent tagging strategy across all cloud providers');
    recommendations.push('🔒 Use --dependency-mapping to understand cross-cloud resource relationships');

    // Display recommendations
    recommendations.forEach((rec, index) => {
      output += chalk.gray(`${index + 1}. ${rec}\n`);
    });

    output += '\n' + chalk.bold.yellow('⚡ Quick Actions:') + '\n';
    output += chalk.gray('• infra-cost --all-profiles --combine-profiles  # Aggregate view\n');
    output += chalk.gray('• infra-cost --compare-clouds aws,gcp,azure     # Cost comparison\n');
    output += chalk.gray('• infra-cost --inventory --group-by provider    # Detailed inventory\n');

    return output;
  }

  // Helper methods
  private createProviderAdapter(provider: CloudProvider, profile: any): CloudProviderAdapter | null {
    try {
      // This is a simplified approach - in practice, you'd need to properly
      // construct credentials from the discovered profile
      const config = {
        provider,
        credentials: profile.credentials || {},
        region: profile.region,
        profile: profile.name
      };

      return this.factory.createProvider(config);
    } catch (error) {
      console.warn(`Failed to create provider adapter for ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  private getProviderDisplayName(provider: CloudProvider): string {
    const names = CloudProviderFactory.getProviderDisplayNames();
    return names[provider] || provider.toUpperCase();
  }

  private getStatusIcon(status: 'active' | 'unavailable' | 'error'): string {
    switch (status) {
      case 'active': return '✅';
      case 'unavailable': return '⚪';
      case 'error': return '❌';
      default: return '⚪';
    }
  }

  private getStatusColor(status: 'active' | 'unavailable' | 'error'): 'green' | 'gray' | 'red' {
    switch (status) {
      case 'active': return 'green';
      case 'unavailable': return 'gray';
      case 'error': return 'red';
      default: return 'gray';
    }
  }

  private getActiveProvidersList(summary: MultiCloudInventorySummary): string {
    const active = Object.entries(summary.providerBreakdown)
      .filter(([, data]) => data.status === 'active')
      .map(([provider]) => provider.toUpperCase());

    return active.join(', ') || 'None';
  }

  private getResourceTypeBreakdown(summary: MultiCloudInventorySummary): string {
    const top3 = Object.entries(summary.consolidatedResourcesByType)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => `${count} ${type}`);

    return top3.join(', ') || 'None';
  }

  private getCostBreakdownByProvider(summary: MultiCloudInventorySummary): string {
    const costs = Object.entries(summary.providerBreakdown)
      .filter(([, data]) => data.status === 'active' && data.cost > 0)
      .map(([provider, data]) => `${provider}: $${data.cost.toFixed(0)}`);

    return costs.join(', ') || 'None';
  }

  private createResourceTypeRows(summary: MultiCloudInventorySummary): any[] {
    return Object.entries(summary.consolidatedResourcesByType)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([type, count]) => {
        const percentage = ((count / summary.totalResources) * 100).toFixed(1) + '%';
        const topProvider = this.getTopProviderForResourceType(summary, type as ResourceType);

        return {
          resourceType: type.charAt(0).toUpperCase() + type.slice(1),
          totalCount: count.toLocaleString(),
          percentage,
          topProvider: topProvider ? topProvider.toUpperCase() : 'N/A'
        };
      });
  }

  private getTopProviderForResourceType(summary: MultiCloudInventorySummary, resourceType: ResourceType): CloudProvider | null {
    let maxCount = 0;
    let topProvider: CloudProvider | null = null;

    Object.entries(summary.providerBreakdown).forEach(([provider, data]) => {
      if (data.inventory && data.inventory.resourcesByType[resourceType] > maxCount) {
        maxCount = data.inventory.resourcesByType[resourceType];
        topProvider = provider as CloudProvider;
      }
    });

    return topProvider;
  }

  private calculateTopResourcesByProvider(summary: MultiCloudInventorySummary): Array<{
    provider: CloudProvider;
    resourceType: ResourceType;
    count: number;
    percentage: number;
  }> {
    const results: Array<{
      provider: CloudProvider;
      resourceType: ResourceType;
      count: number;
      percentage: number;
    }> = [];

    Object.entries(summary.providerBreakdown).forEach(([provider, data]) => {
      if (data.inventory && data.resourceCount > 0) {
        Object.entries(data.inventory.resourcesByType).forEach(([type, count]) => {
          if (count > 0) {
            results.push({
              provider: provider as CloudProvider,
              resourceType: type as ResourceType,
              count,
              percentage: (count / summary.totalResources) * 100
            });
          }
        });
      }
    });

    return results.sort((a, b) => b.count - a.count).slice(0, 10);
  }
}

export default MultiCloudDashboard;