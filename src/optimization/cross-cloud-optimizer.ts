import { CloudProvider, ResourceInventory, CostBreakdown, ProviderConfig } from '../types/providers';

export interface CrossCloudComparison {
  providers: CloudProvider[];
  comparisonDate: string;
  totalCostComparison: {
    [provider in CloudProvider]?: number;
  };
  resourceCountComparison: {
    [provider in CloudProvider]?: number;
  };
  costPerResourceComparison: {
    [provider in CloudProvider]?: number;
  };
  serviceComparison: {
    compute: CloudServiceComparison;
    storage: CloudServiceComparison;
    database: CloudServiceComparison;
    network: CloudServiceComparison;
  };
  optimizationOpportunities: CrossCloudOptimization[];
  migrationRecommendations: MigrationRecommendation[];
}

export interface CloudServiceComparison {
  [provider in CloudProvider]?: {
    resourceCount: number;
    totalCost: number;
    averageCostPerResource: number;
    utilizationRate?: number;
  };
}

export interface CrossCloudOptimization {
  id: string;
  type: 'COST_ARBITRAGE' | 'WORKLOAD_MIGRATION' | 'MULTI_CLOUD_STRATEGY' | 'RESERVED_CAPACITY_OPTIMIZATION';
  title: string;
  description: string;
  sourceProvider: CloudProvider;
  targetProvider: CloudProvider;
  affectedResources: string[];
  potentialSavings: {
    amount: number;
    percentage: number;
    timeframe: 'MONTHLY' | 'ANNUALLY';
  };
  complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  implementationSteps: string[];
  prerequisites: string[];
  estimatedMigrationTime: string;
  estimatedMigrationCost: number;
}

export interface MigrationRecommendation {
  workloadType: 'COMPUTE' | 'STORAGE' | 'DATABASE' | 'ANALYTICS';
  fromProvider: CloudProvider;
  toProvider: CloudProvider;
  reasoning: string;
  costImpact: {
    currentMonthlyCost: number;
    projectedMonthlyCost: number;
    netSavings: number;
    breakEvenPeriod: number; // months
  };
  technicalConsiderations: string[];
  businessConsiderations: string[];
}

export class CrossCloudOptimizer {
  private providerData: Map<CloudProvider, {
    inventory: ResourceInventory;
    costBreakdown: CostBreakdown;
  }> = new Map();

  public addProviderData(
    provider: CloudProvider,
    inventory: ResourceInventory,
    costBreakdown: CostBreakdown
  ): void {
    this.providerData.set(provider, { inventory, costBreakdown });
  }

  public generateComparison(): CrossCloudComparison {
    const providers = Array.from(this.providerData.keys());

    if (providers.length < 2) {
      throw new Error('At least two cloud providers are required for comparison');
    }

    const comparison: CrossCloudComparison = {
      providers,
      comparisonDate: new Date().toISOString(),
      totalCostComparison: {},
      resourceCountComparison: {},
      costPerResourceComparison: {},
      serviceComparison: {
        compute: {},
        storage: {},
        database: {},
        network: {}
      },
      optimizationOpportunities: [],
      migrationRecommendations: []
    };

    // Calculate cost and resource comparisons
    providers.forEach(provider => {
      const data = this.providerData.get(provider)!;
      const totalCost = data.costBreakdown.totals.thisMonth;
      const totalResources = data.inventory.totalResources;

      comparison.totalCostComparison[provider] = totalCost;
      comparison.resourceCountComparison[provider] = totalResources;
      comparison.costPerResourceComparison[provider] = totalResources > 0 ? totalCost / totalResources : 0;

      // Service-specific comparisons
      this.addServiceComparison(comparison, provider, data);
    });

    // Generate optimization opportunities
    comparison.optimizationOpportunities = this.generateOptimizationOpportunities(providers);

    // Generate migration recommendations
    comparison.migrationRecommendations = this.generateMigrationRecommendations(providers);

    return comparison;
  }

  private addServiceComparison(
    comparison: CrossCloudComparison,
    provider: CloudProvider,
    data: { inventory: ResourceInventory; costBreakdown: CostBreakdown }
  ): void {
    const { inventory, costBreakdown } = data;

    // Compute comparison
    comparison.serviceComparison.compute[provider] = {
      resourceCount: inventory.resourcesByType.compute,
      totalCost: this.getServiceCost(costBreakdown, 'compute'),
      averageCostPerResource: this.calculateAverageCostPerResource(
        inventory.resourcesByType.compute,
        this.getServiceCost(costBreakdown, 'compute')
      ),
      utilizationRate: this.estimateUtilizationRate(provider, 'compute')
    };

    // Storage comparison
    comparison.serviceComparison.storage[provider] = {
      resourceCount: inventory.resourcesByType.storage,
      totalCost: this.getServiceCost(costBreakdown, 'storage'),
      averageCostPerResource: this.calculateAverageCostPerResource(
        inventory.resourcesByType.storage,
        this.getServiceCost(costBreakdown, 'storage')
      )
    };

    // Database comparison
    comparison.serviceComparison.database[provider] = {
      resourceCount: inventory.resourcesByType.database,
      totalCost: this.getServiceCost(costBreakdown, 'database'),
      averageCostPerResource: this.calculateAverageCostPerResource(
        inventory.resourcesByType.database,
        this.getServiceCost(costBreakdown, 'database')
      )
    };

    // Network comparison
    comparison.serviceComparison.network[provider] = {
      resourceCount: inventory.resourcesByType.network,
      totalCost: this.getServiceCost(costBreakdown, 'network'),
      averageCostPerResource: this.calculateAverageCostPerResource(
        inventory.resourcesByType.network,
        this.getServiceCost(costBreakdown, 'network')
      )
    };
  }

  private getServiceCost(costBreakdown: CostBreakdown, serviceType: string): number {
    // Simplified mapping - in reality, this would be more sophisticated
    const serviceMapping: Record<string, string[]> = {
      compute: ['EC2', 'Compute Engine', 'Virtual Machines', 'ECS'],
      storage: ['S3', 'Cloud Storage', 'Storage Accounts', 'EBS'],
      database: ['RDS', 'Cloud SQL', 'SQL Database', 'DynamoDB'],
      network: ['VPC', 'Virtual Network', 'CloudFront', 'Load Balancer']
    };

    const relevantServices = serviceMapping[serviceType] || [];
    let totalCost = 0;

    Object.entries(costBreakdown.totalsByService.thisMonth).forEach(([service, cost]) => {
      if (relevantServices.some(rs => service.toLowerCase().includes(rs.toLowerCase()))) {
        totalCost += cost;
      }
    });

    return totalCost;
  }

  private calculateAverageCostPerResource(resourceCount: number, totalCost: number): number {
    return resourceCount > 0 ? totalCost / resourceCount : 0;
  }

  private estimateUtilizationRate(provider: CloudProvider, serviceType: string): number {
    // Mock utilization rates - in reality, this would come from monitoring data
    const utilizationRates: Record<CloudProvider, Record<string, number>> = {
      [CloudProvider.AWS]: { compute: 0.65, storage: 0.80, database: 0.75, network: 0.70 },
      [CloudProvider.GOOGLE_CLOUD]: { compute: 0.70, storage: 0.85, database: 0.80, network: 0.75 },
      [CloudProvider.AZURE]: { compute: 0.68, storage: 0.82, database: 0.77, network: 0.72 },
      [CloudProvider.ALIBABA_CLOUD]: { compute: 0.60, storage: 0.75, database: 0.70, network: 0.65 },
      [CloudProvider.ORACLE_CLOUD]: { compute: 0.62, storage: 0.78, database: 0.85, network: 0.68 }
    };

    return utilizationRates[provider]?.[serviceType] || 0.65;
  }

  private generateOptimizationOpportunities(providers: CloudProvider[]): CrossCloudOptimization[] {
    const opportunities: CrossCloudOptimization[] = [];

    // Cost arbitrage opportunities
    opportunities.push(...this.findCostArbitrageOpportunities(providers));

    // Workload migration opportunities
    opportunities.push(...this.findWorkloadMigrationOpportunities(providers));

    // Multi-cloud strategy opportunities
    opportunities.push(...this.findMultiCloudStrategyOpportunities(providers));

    // Reserved capacity optimization
    opportunities.push(...this.findReservedCapacityOpportunities(providers));

    return opportunities.sort((a, b) => b.potentialSavings.amount - a.potentialSavings.amount);
  }

  private findCostArbitrageOpportunities(providers: CloudProvider[]): CrossCloudOptimization[] {
    const opportunities: CrossCloudOptimization[] = [];

    // Find compute cost differences
    const computeCosts = new Map<CloudProvider, number>();
    providers.forEach(provider => {
      const data = this.providerData.get(provider)!;
      const computeCost = this.getServiceCost(data.costBreakdown, 'compute');
      computeCosts.set(provider, computeCost);
    });

    const sortedComputeCosts = Array.from(computeCosts.entries()).sort((a, b) => a[1] - b[1]);
    if (sortedComputeCosts.length >= 2) {
      const cheapest = sortedComputeCosts[0];
      const mostExpensive = sortedComputeCosts[sortedComputeCosts.length - 1];

      if (mostExpensive[1] > cheapest[1] * 1.2) { // At least 20% difference
        const savings = mostExpensive[1] - cheapest[1];
        opportunities.push({
          id: 'compute-arbitrage',
          type: 'COST_ARBITRAGE',
          title: 'Compute Cost Arbitrage Opportunity',
          description: `Migrate compute workloads from ${mostExpensive[0]} to ${cheapest[0]} for significant cost savings`,
          sourceProvider: mostExpensive[0],
          targetProvider: cheapest[0],
          affectedResources: ['compute-instances'],
          potentialSavings: {
            amount: savings,
            percentage: ((savings / mostExpensive[1]) * 100),
            timeframe: 'MONTHLY'
          },
          complexity: 'MEDIUM',
          riskLevel: 'MEDIUM',
          implementationSteps: [
            'Audit current compute workloads and dependencies',
            'Create migration plan with phased approach',
            'Set up target environment and test migrations',
            'Execute migration with rollback plan',
            'Monitor and optimize post-migration'
          ],
          prerequisites: [
            'Network connectivity between providers',
            'Data migration strategy',
            'Updated deployment pipelines'
          ],
          estimatedMigrationTime: '2-4 months',
          estimatedMigrationCost: savings * 0.15 // 15% of monthly savings
        });
      }
    }

    return opportunities;
  }

  private findWorkloadMigrationOpportunities(providers: CloudProvider[]): CrossCloudOptimization[] {
    const opportunities: CrossCloudOptimization[] = [];

    // Example: Database workload optimization
    providers.forEach(sourceProvider => {
      const sourceData = this.providerData.get(sourceProvider)!;
      const databaseCost = this.getServiceCost(sourceData.costBreakdown, 'database');

      if (databaseCost > 1000) { // Only consider if substantial database costs
        providers.forEach(targetProvider => {
          if (sourceProvider !== targetProvider) {
            const targetData = this.providerData.get(targetProvider)!;
            const targetDatabaseCost = this.getServiceCost(targetData.costBreakdown, 'database');
            const targetAverageCost = targetData.inventory.resourcesByType.database > 0
              ? targetDatabaseCost / targetData.inventory.resourcesByType.database
              : 0;

            // If target provider has better database cost efficiency
            if (targetAverageCost > 0 && (databaseCost / sourceData.inventory.resourcesByType.database) > targetAverageCost * 1.3) {
              const potentialSavings = databaseCost * 0.3; // Estimated 30% savings

              opportunities.push({
                id: `database-migration-${sourceProvider}-to-${targetProvider}`,
                type: 'WORKLOAD_MIGRATION',
                title: `Database Migration to ${targetProvider}`,
                description: `Migrate database workloads to ${targetProvider} for better cost efficiency and performance`,
                sourceProvider,
                targetProvider,
                affectedResources: ['database-instances'],
                potentialSavings: {
                  amount: potentialSavings,
                  percentage: 30,
                  timeframe: 'MONTHLY'
                },
                complexity: 'HIGH',
                riskLevel: 'HIGH',
                implementationSteps: [
                  'Assess database compatibility and requirements',
                  'Plan data migration strategy with minimal downtime',
                  'Set up replication and sync mechanisms',
                  'Execute phased migration with validation',
                  'Update applications and connection strings'
                ],
                prerequisites: [
                  'Database schema compatibility analysis',
                  'Application code review for provider-specific features',
                  'Backup and recovery procedures'
                ],
                estimatedMigrationTime: '3-6 months',
                estimatedMigrationCost: potentialSavings * 0.25
              });
            }
          }
        });
      }
    });

    return opportunities;
  }

  private findMultiCloudStrategyOpportunities(providers: CloudProvider[]): CrossCloudOptimization[] {
    const opportunities: CrossCloudOptimization[] = [];

    if (providers.length >= 2) {
      // Multi-cloud disaster recovery opportunity
      const totalCosts = Array.from(this.providerData.values())
        .reduce((sum, data) => sum + data.costBreakdown.totals.thisMonth, 0);

      if (totalCosts > 5000) { // Only for substantial workloads
        opportunities.push({
          id: 'multi-cloud-dr',
          type: 'MULTI_CLOUD_STRATEGY',
          title: 'Multi-Cloud Disaster Recovery Strategy',
          description: 'Implement disaster recovery across multiple cloud providers for enhanced resilience',
          sourceProvider: providers[0],
          targetProvider: providers[1],
          affectedResources: ['critical-workloads'],
          potentialSavings: {
            amount: totalCosts * 0.02, // 2% operational efficiency gain
            percentage: 2,
            timeframe: 'MONTHLY'
          },
          complexity: 'HIGH',
          riskLevel: 'LOW', // Actually reduces risk
          implementationSteps: [
            'Identify critical workloads and data',
            'Design cross-cloud replication strategy',
            'Implement automated backup and sync',
            'Create disaster recovery runbooks',
            'Regular testing and validation'
          ],
          prerequisites: [
            'Cross-cloud networking setup',
            'Identity and access management alignment',
            'Monitoring and alerting integration'
          ],
          estimatedMigrationTime: '4-8 months',
          estimatedMigrationCost: totalCosts * 0.05 // 5% of total monthly cost
        });
      }
    }

    return opportunities;
  }

  private findReservedCapacityOpportunities(providers: CloudProvider[]): CrossCloudOptimization[] {
    const opportunities: CrossCloudOptimization[] = [];

    providers.forEach(provider => {
      const data = this.providerData.get(provider)!;
      const computeCost = this.getServiceCost(data.costBreakdown, 'compute');

      if (computeCost > 2000 && data.inventory.resourcesByType.compute > 5) {
        // Opportunity for reserved instances
        const reservedSavings = computeCost * 0.4; // Up to 40% savings with reserved capacity

        opportunities.push({
          id: `reserved-capacity-${provider}`,
          type: 'RESERVED_CAPACITY_OPTIMIZATION',
          title: `Reserved Capacity Optimization for ${provider}`,
          description: `Purchase reserved instances on ${provider} for predictable workloads to achieve significant cost savings`,
          sourceProvider: provider,
          targetProvider: provider, // Same provider
          affectedResources: ['long-running-compute-instances'],
          potentialSavings: {
            amount: reservedSavings,
            percentage: 40,
            timeframe: 'MONTHLY'
          },
          complexity: 'LOW',
          riskLevel: 'LOW',
          implementationSteps: [
            'Analyze compute usage patterns over 3-6 months',
            'Identify stable, long-running workloads',
            'Calculate optimal reserved capacity mix',
            'Purchase reserved instances with appropriate terms',
            'Monitor and adjust reserved capacity as needed'
          ],
          prerequisites: [
            'Historical usage data analysis',
            'Budget approval for upfront payments',
            'Workload stability assessment'
          ],
          estimatedMigrationTime: '1-2 months',
          estimatedMigrationCost: 0 // No migration cost, just planning effort
        });
      }
    });

    return opportunities;
  }

  private generateMigrationRecommendations(providers: CloudProvider[]): MigrationRecommendation[] {
    const recommendations: MigrationRecommendation[] = [];

    // Storage migration recommendations
    const storageCosts = new Map<CloudProvider, number>();
    providers.forEach(provider => {
      const data = this.providerData.get(provider)!;
      storageCosts.set(provider, this.getServiceCost(data.costBreakdown, 'storage'));
    });

    const sortedStorage = Array.from(storageCosts.entries()).sort((a, b) => a[1] - b[1]);
    if (sortedStorage.length >= 2 && sortedStorage[1][1] > sortedStorage[0][1] * 1.3) {
      recommendations.push({
        workloadType: 'STORAGE',
        fromProvider: sortedStorage[1][0],
        toProvider: sortedStorage[0][0],
        reasoning: `${sortedStorage[0][0]} offers more cost-effective storage solutions for your current usage patterns`,
        costImpact: {
          currentMonthlyCost: sortedStorage[1][1],
          projectedMonthlyCost: sortedStorage[0][1],
          netSavings: sortedStorage[1][1] - sortedStorage[0][1],
          breakEvenPeriod: 2 // Assume 2 months break-even for storage migration
        },
        technicalConsiderations: [
          'Data transfer costs during migration',
          'API compatibility and application updates',
          'Backup and disaster recovery procedures'
        ],
        businessConsiderations: [
          'Minimal business disruption during migration',
          'Compliance and data sovereignty requirements',
          'Long-term strategic cloud partnerships'
        ]
      });
    }

    return recommendations;
  }

  public generateOptimizationReport(): string {
    const comparison = this.generateComparison();

    let report = '# Cross-Cloud Optimization Report\n\n';
    report += `Generated on: ${new Date(comparison.comparisonDate).toLocaleDateString()}\n`;
    report += `Providers analyzed: ${comparison.providers.join(', ')}\n\n`;

    // Cost comparison summary
    report += '## Cost Comparison Summary\n\n';
    Object.entries(comparison.totalCostComparison).forEach(([provider, cost]) => {
      report += `- **${provider}**: $${cost?.toFixed(2)} monthly\n`;
    });

    // Top optimization opportunities
    report += '\n## Top Optimization Opportunities\n\n';
    comparison.optimizationOpportunities.slice(0, 5).forEach((opp, index) => {
      report += `### ${index + 1}. ${opp.title}\n`;
      report += `**Potential Monthly Savings**: $${opp.potentialSavings.amount.toFixed(2)} (${opp.potentialSavings.percentage.toFixed(1)}%)\n`;
      report += `**Complexity**: ${opp.complexity} | **Risk**: ${opp.riskLevel}\n`;
      report += `**Migration Time**: ${opp.estimatedMigrationTime}\n\n`;
      report += `${opp.description}\n\n`;
    });

    // Migration recommendations
    if (comparison.migrationRecommendations.length > 0) {
      report += '## Migration Recommendations\n\n';
      comparison.migrationRecommendations.forEach((rec, index) => {
        report += `### ${index + 1}. ${rec.workloadType} Migration: ${rec.fromProvider} → ${rec.toProvider}\n`;
        report += `**Monthly Savings**: $${rec.costImpact.netSavings.toFixed(2)}\n`;
        report += `**Break-even Period**: ${rec.costImpact.breakEvenPeriod} months\n`;
        report += `**Reasoning**: ${rec.reasoning}\n\n`;
      });
    }

    return report;
  }
}