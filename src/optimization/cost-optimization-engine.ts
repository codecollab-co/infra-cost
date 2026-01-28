import { CloudProviderAdapter, CostBreakdown, ResourceInventory, FinOpsRecommendation } from '../types/providers';
import { RightsizingEngine, RightsizingRecommendation, RightsizingConfiguration } from '../analytics/rightsizing-engine';

/**
 * Cost Optimization Engine
 * Issue #31: Implement cost optimization recommendations engine
 *
 * This engine aggregates recommendations from multiple sources and provides
 * a unified, prioritized view of optimization opportunities.
 */

// Optimization Categories
export enum OptimizationCategory {
  COMPUTE = 'compute',
  STORAGE = 'storage',
  DATABASE = 'database',
  NETWORK = 'network',
  SERVERLESS = 'serverless',
  RESERVED_CAPACITY = 'reserved_capacity',
  UNUSED_RESOURCES = 'unused_resources',
  ARCHITECTURE = 'architecture',
}

// Risk Levels
export enum RiskLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

// Effort Levels
export enum EffortLevel {
  MINIMAL = 'minimal',      // < 1 hour
  LOW = 'low',              // 1-4 hours
  MEDIUM = 'medium',        // 1-2 days
  HIGH = 'high',            // 1 week+
}

// Confidence Levels
export enum ConfidenceLevel {
  LOW = 'low',              // < 60%
  MEDIUM = 'medium',        // 60-80%
  HIGH = 'high',            // 80-95%
  VERY_HIGH = 'very_high',  // > 95%
}

// Unified Optimization Recommendation
export interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  category: OptimizationCategory;

  // Resource information
  resource: {
    id: string;
    name: string;
    type: string;
    region: string;
    tags?: Record<string, string>;
  };

  // Current state
  current: {
    configuration: string;
    monthlyCost: number;
    utilization?: {
      cpu?: number;
      memory?: number;
      storage?: number;
      network?: number;
    };
  };

  // Recommended state
  recommended: {
    configuration: string;
    monthlyCost: number;
    description: string;
  };

  // Savings projection
  savings: {
    monthly: number;
    annual: number;
    percentage: number;
  };

  // Assessment
  risk: RiskLevel;
  effort: EffortLevel;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0-100

  // Implementation
  implementation: {
    steps: string[];
    estimatedTime: string;
    downtime: string;
    rollbackPlan: string;
    prerequisites?: string[];
  };

  // Metadata
  source: string;
  createdAt: Date;
  expiresAt?: Date;
}

// Optimization Report
export interface OptimizationReport {
  summary: {
    totalRecommendations: number;
    totalMonthlySavings: number;
    totalAnnualSavings: number;
    byCategory: Record<OptimizationCategory, {
      count: number;
      savings: number;
    }>;
    byRisk: Record<RiskLevel, number>;
    byEffort: Record<EffortLevel, number>;
  };

  // Prioritized recommendations
  recommendations: OptimizationRecommendation[];

  // Quick wins (high savings, low effort, low risk)
  quickWins: OptimizationRecommendation[];

  // Top opportunities by savings
  topOpportunities: OptimizationRecommendation[];

  // Analysis metadata
  metadata: {
    analyzedAt: Date;
    resourcesAnalyzed: number;
    analysisTimeMs: number;
    dataQuality: 'high' | 'medium' | 'low';
  };
}

// Engine Configuration
export interface OptimizationEngineConfig {
  // Minimum savings threshold (monthly)
  minSavingsThreshold: number;
  // Maximum risk level to include
  maxRiskLevel: RiskLevel;
  // Categories to analyze
  categories: OptimizationCategory[];
  // Sort criteria
  sortBy: 'savings' | 'effort' | 'risk' | 'confidence';
  // Include recommendations below confidence threshold
  minConfidence: number;
  // Number of top recommendations to highlight
  topN: number;
}

const DEFAULT_CONFIG: OptimizationEngineConfig = {
  minSavingsThreshold: 10, // $10/month minimum
  maxRiskLevel: RiskLevel.HIGH,
  categories: Object.values(OptimizationCategory),
  sortBy: 'savings',
  minConfidence: 50,
  topN: 10,
};

/**
 * Cost Optimization Engine
 * Aggregates and prioritizes optimization recommendations
 */
export class CostOptimizationEngine {
  private config: OptimizationEngineConfig;
  private recommendations: OptimizationRecommendation[] = [];

  constructor(config: Partial<OptimizationEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Analyze resources and generate optimization report
   */
  async analyze(
    provider: CloudProviderAdapter,
    inventory?: ResourceInventory,
    costBreakdown?: CostBreakdown
  ): Promise<OptimizationReport> {
    const startTime = Date.now();
    this.recommendations = [];

    // Get inventory if not provided
    if (!inventory) {
      inventory = await provider.getResourceInventory();
    }

    // Get cost breakdown if not provided
    if (!costBreakdown) {
      costBreakdown = await provider.getCostBreakdown();
    }

    // Run different analyzers based on configured categories
    if (this.config.categories.includes(OptimizationCategory.COMPUTE)) {
      await this.analyzeComputeResources(inventory, costBreakdown);
    }

    if (this.config.categories.includes(OptimizationCategory.STORAGE)) {
      await this.analyzeStorageResources(inventory, costBreakdown);
    }

    if (this.config.categories.includes(OptimizationCategory.UNUSED_RESOURCES)) {
      await this.analyzeUnusedResources(inventory, costBreakdown);
    }

    if (this.config.categories.includes(OptimizationCategory.RESERVED_CAPACITY)) {
      await this.analyzeReservedCapacity(inventory, costBreakdown);
    }

    // Get provider recommendations
    try {
      const finopsRecs = await provider.getFinOpsRecommendations();
      this.integrateFinOpsRecommendations(finopsRecs);
    } catch {
      // Provider may not support this
    }

    // Filter and sort recommendations
    const filteredRecs = this.filterRecommendations();
    const sortedRecs = this.sortRecommendations(filteredRecs);

    // Generate report
    const report = this.generateReport(sortedRecs, inventory, Date.now() - startTime);

    return report;
  }

  /**
   * Analyze compute resources for rightsizing opportunities
   */
  private async analyzeComputeResources(
    inventory: ResourceInventory,
    costBreakdown: CostBreakdown
  ): Promise<void> {
    const computeResources = inventory.resources.compute || [];

    for (const resource of computeResources) {
      // Check for potential rightsizing
      const instanceType = resource.instanceType || 'unknown';
      const estimatedMonthlyCost = this.estimateResourceCost(resource, costBreakdown);

      // Simulate utilization analysis (in production, this would use CloudWatch metrics)
      const simulatedUtilization = this.simulateUtilization(resource);

      if (simulatedUtilization.cpu < 30 || simulatedUtilization.memory < 40) {
        // Underutilized - recommend downsizing
        const downsizeRec = this.createDownsizeRecommendation(
          resource,
          instanceType,
          estimatedMonthlyCost,
          simulatedUtilization
        );
        if (downsizeRec) {
          this.recommendations.push(downsizeRec);
        }
      }

      // Check for stopped instances
      if (resource.state === 'stopped') {
        this.recommendations.push(this.createStoppedInstanceRecommendation(resource, estimatedMonthlyCost));
      }
    }
  }

  /**
   * Analyze storage resources for optimization opportunities
   */
  private async analyzeStorageResources(
    inventory: ResourceInventory,
    costBreakdown: CostBreakdown
  ): Promise<void> {
    const storageResources = inventory.resources.storage || [];

    for (const resource of storageResources) {
      const estimatedMonthlyCost = this.estimateResourceCost(resource, costBreakdown);

      // Check storage type optimization
      if (resource.storageType === 'gp2') {
        // Recommend gp3 migration
        this.recommendations.push(this.createStorageTypeRecommendation(
          resource,
          'gp2',
          'gp3',
          estimatedMonthlyCost
        ));
      }

      // Check for unattached volumes
      if (!resource['attachments'] || resource['attachments'].length === 0) {
        this.recommendations.push(this.createUnattachedVolumeRecommendation(resource, estimatedMonthlyCost));
      }
    }
  }

  /**
   * Analyze for unused resources
   */
  private async analyzeUnusedResources(
    inventory: ResourceInventory,
    costBreakdown: CostBreakdown
  ): Promise<void> {
    // Check for unused load balancers, elastic IPs, etc.
    const networkResources = inventory.resources.network || [];

    for (const resource of networkResources) {
      // Check for idle load balancers
      if (resource['type'] === 'load_balancer' && resource['targetGroups'] === 0) {
        const estimatedCost = this.estimateResourceCost(resource, costBreakdown);
        this.recommendations.push(this.createUnusedResourceRecommendation(
          resource,
          'Load Balancer',
          estimatedCost
        ));
      }
    }
  }

  /**
   * Analyze reserved capacity opportunities
   */
  private async analyzeReservedCapacity(
    inventory: ResourceInventory,
    costBreakdown: CostBreakdown
  ): Promise<void> {
    const computeResources = inventory.resources.compute || [];

    // Group instances by type and region
    const instanceGroups = new Map<string, { count: number; totalCost: number; instanceType: string; region: string }>();

    for (const resource of computeResources) {
      if (resource.state !== 'running') continue;

      const key = JSON.stringify([resource.instanceType, resource.region]);
      const existing = instanceGroups.get(key) || { count: 0, totalCost: 0, instanceType: resource.instanceType, region: resource.region };
      const cost = this.estimateResourceCost(resource, costBreakdown);

      instanceGroups.set(key, {
        count: existing.count + 1,
        totalCost: existing.totalCost + cost,
        instanceType: resource.instanceType,
        region: resource.region,
      });
    }

    // Recommend reserved instances for groups with 3+ instances
    for (const [, data] of instanceGroups.entries()) {
      if (data.count >= 3) {
        this.recommendations.push(this.createReservedInstanceRecommendation(
          data.instanceType,
          data.region,
          data.count,
          data.totalCost
        ));
      }
    }
  }

  /**
   * Integrate FinOps recommendations from provider
   */
  private integrateFinOpsRecommendations(finopsRecs: FinOpsRecommendation[]): void {
    for (const rec of finopsRecs) {
      const category = this.mapFinOpsTypeToCategory(rec.type);

      // Normalize savings to monthly amount
      const monthlySavings = rec.potentialSavings.timeframe === 'ANNUALLY'
        ? rec.potentialSavings.amount / 12
        : rec.potentialSavings.amount;

      // Calculate current and recommended costs, guard against division by zero
      let currentMonthlyCost = 0;
      let recommendedMonthlyCost = 0;

      if (rec.potentialSavings.percentage > 0) {
        currentMonthlyCost = monthlySavings / (rec.potentialSavings.percentage / 100);
        recommendedMonthlyCost = currentMonthlyCost - monthlySavings;
      }

      this.recommendations.push({
        id: `finops-${rec.id}`,
        title: rec.title,
        description: rec.description,
        category,
        resource: {
          id: rec.resources?.[0] || 'multiple',
          name: rec.resources?.join(', ') || 'Multiple Resources',
          type: rec.type,
          region: 'various',
        },
        current: {
          configuration: 'Current configuration',
          monthlyCost: currentMonthlyCost,
        },
        recommended: {
          configuration: rec.title,
          monthlyCost: recommendedMonthlyCost,
          description: rec.description,
        },
        savings: {
          monthly: monthlySavings,
          annual: monthlySavings * 12,
          percentage: rec.potentialSavings.percentage,
        },
        risk: this.mapEffortToRisk(rec.effort),
        effort: rec.effort.toLowerCase() as EffortLevel,
        confidence: ConfidenceLevel.HIGH,
        confidenceScore: 85,
        implementation: {
          steps: rec.implementationSteps,
          estimatedTime: this.effortToTime(rec.effort),
          downtime: 'Varies',
          rollbackPlan: 'Revert configuration changes',
        },
        source: 'provider-finops',
        createdAt: new Date(),
      });
    }
  }

  /**
   * Create downsize recommendation
   */
  private createDownsizeRecommendation(
    resource: any,
    currentType: string,
    monthlyCost: number,
    utilization: { cpu: number; memory: number }
  ): OptimizationRecommendation | null {
    const recommendedType = this.getDownsizedInstanceType(currentType);
    if (!recommendedType) return null;

    const savingsPercent = this.getDownsizeSavingsPercent(currentType, recommendedType);
    const monthlySavings = monthlyCost * (savingsPercent / 100);

    return {
      id: `rightsize-${resource.id}`,
      title: `Rightsize ${resource.name || resource.id}`,
      description: `Instance is underutilized (${utilization.cpu}% CPU, ${utilization.memory}% memory). Consider downsizing to reduce costs.`,
      category: OptimizationCategory.COMPUTE,
      resource: {
        id: resource.id,
        name: resource.name || resource.id,
        type: 'EC2 Instance',
        region: resource.region,
        tags: resource.tags,
      },
      current: {
        configuration: currentType,
        monthlyCost,
        utilization,
      },
      recommended: {
        configuration: recommendedType,
        monthlyCost: monthlyCost - monthlySavings,
        description: `Downsize to ${recommendedType} based on actual utilization`,
      },
      savings: {
        monthly: monthlySavings,
        annual: monthlySavings * 12,
        percentage: savingsPercent,
      },
      risk: RiskLevel.LOW,
      effort: EffortLevel.LOW,
      confidence: utilization.cpu < 20 ? ConfidenceLevel.VERY_HIGH : ConfidenceLevel.HIGH,
      confidenceScore: utilization.cpu < 20 ? 95 : 85,
      implementation: {
        steps: [
          'Create AMI snapshot of the instance',
          `Launch new ${recommendedType} instance from AMI`,
          'Update DNS/load balancer to point to new instance',
          'Monitor performance for 24 hours',
          'Terminate old instance after validation',
        ],
        estimatedTime: '1-2 hours',
        downtime: '< 5 minutes with proper migration',
        rollbackPlan: 'Restore from AMI snapshot if performance issues occur',
        prerequisites: ['Recent backup/snapshot', 'Maintenance window scheduled'],
      },
      source: 'compute-analyzer',
      createdAt: new Date(),
    };
  }

  /**
   * Create stopped instance recommendation
   */
  private createStoppedInstanceRecommendation(
    resource: any,
    monthlyCost: number
  ): OptimizationRecommendation {
    // Stopped instances still incur EBS costs (~20% of running cost)
    const stoppedCost = monthlyCost * 0.2;

    return {
      id: `stopped-${resource.id}`,
      title: `Terminate stopped instance ${resource.name || resource.id}`,
      description: 'Instance has been stopped but still incurs storage costs. Consider terminating if no longer needed.',
      category: OptimizationCategory.UNUSED_RESOURCES,
      resource: {
        id: resource.id,
        name: resource.name || resource.id,
        type: 'EC2 Instance (Stopped)',
        region: resource.region,
        tags: resource.tags,
      },
      current: {
        configuration: `${resource.instanceType} (stopped)`,
        monthlyCost: stoppedCost,
      },
      recommended: {
        configuration: 'Terminate instance',
        monthlyCost: 0,
        description: 'Delete instance and associated EBS volumes to eliminate costs',
      },
      savings: {
        monthly: stoppedCost,
        annual: stoppedCost * 12,
        percentage: 100,
      },
      risk: RiskLevel.MEDIUM,
      effort: EffortLevel.MINIMAL,
      confidence: ConfidenceLevel.HIGH,
      confidenceScore: 90,
      implementation: {
        steps: [
          'Verify instance is no longer needed',
          'Create final AMI backup if needed',
          'Terminate the instance',
          'Delete associated EBS volumes if not needed',
        ],
        estimatedTime: '15-30 minutes',
        downtime: 'N/A - instance already stopped',
        rollbackPlan: 'Restore from AMI backup if needed',
        prerequisites: ['Confirmation instance is not needed', 'Backup completed if required'],
      },
      source: 'unused-analyzer',
      createdAt: new Date(),
    };
  }

  /**
   * Create storage type recommendation (gp2 -> gp3)
   */
  private createStorageTypeRecommendation(
    resource: any,
    currentType: string,
    recommendedType: string,
    monthlyCost: number
  ): OptimizationRecommendation {
    const savingsPercent = 20; // gp3 is typically 20% cheaper than gp2
    const monthlySavings = monthlyCost * (savingsPercent / 100);

    return {
      id: `storage-${resource.id}`,
      title: `Migrate ${resource.name || resource.id} to ${recommendedType}`,
      description: `EBS volume is using ${currentType}. Migrate to ${recommendedType} for better price-performance.`,
      category: OptimizationCategory.STORAGE,
      resource: {
        id: resource.id,
        name: resource.name || resource.id,
        type: 'EBS Volume',
        region: resource.region,
        tags: resource.tags,
      },
      current: {
        configuration: `${currentType} ${resource.sizeGB}GB`,
        monthlyCost,
      },
      recommended: {
        configuration: `${recommendedType} ${resource.sizeGB}GB`,
        monthlyCost: monthlyCost - monthlySavings,
        description: `gp3 offers better baseline performance and lower cost`,
      },
      savings: {
        monthly: monthlySavings,
        annual: monthlySavings * 12,
        percentage: savingsPercent,
      },
      risk: RiskLevel.LOW,
      effort: EffortLevel.LOW,
      confidence: ConfidenceLevel.VERY_HIGH,
      confidenceScore: 98,
      implementation: {
        steps: [
          'Create snapshot of the volume',
          'Modify volume type to gp3',
          'Wait for modification to complete',
          'Verify performance',
        ],
        estimatedTime: '30-60 minutes',
        downtime: 'None - modification is online',
        rollbackPlan: 'Modify volume type back to gp2 if needed',
      },
      source: 'storage-analyzer',
      createdAt: new Date(),
    };
  }

  /**
   * Create unattached volume recommendation
   */
  private createUnattachedVolumeRecommendation(
    resource: any,
    monthlyCost: number
  ): OptimizationRecommendation {
    return {
      id: `unattached-${resource.id}`,
      title: `Delete unattached volume ${resource.name || resource.id}`,
      description: 'EBS volume is not attached to any instance. Consider deleting if no longer needed.',
      category: OptimizationCategory.UNUSED_RESOURCES,
      resource: {
        id: resource.id,
        name: resource.name || resource.id,
        type: 'EBS Volume (Unattached)',
        region: resource.region,
        tags: resource.tags,
      },
      current: {
        configuration: `${resource.storageType} ${resource.sizeGB}GB (unattached)`,
        monthlyCost,
      },
      recommended: {
        configuration: 'Delete volume',
        monthlyCost: 0,
        description: 'Remove unused storage to eliminate costs',
      },
      savings: {
        monthly: monthlyCost,
        annual: monthlyCost * 12,
        percentage: 100,
      },
      risk: RiskLevel.MEDIUM,
      effort: EffortLevel.MINIMAL,
      confidence: ConfidenceLevel.HIGH,
      confidenceScore: 85,
      implementation: {
        steps: [
          'Verify volume data is not needed',
          'Create snapshot backup if needed',
          'Delete the EBS volume',
        ],
        estimatedTime: '10-15 minutes',
        downtime: 'N/A - volume not in use',
        rollbackPlan: 'Restore from snapshot if needed',
        prerequisites: ['Confirm data not needed', 'Snapshot created if required'],
      },
      source: 'storage-analyzer',
      createdAt: new Date(),
    };
  }

  /**
   * Create unused resource recommendation
   */
  private createUnusedResourceRecommendation(
    resource: any,
    resourceType: string,
    monthlyCost: number
  ): OptimizationRecommendation {
    return {
      id: `unused-${resource.id}`,
      title: `Delete unused ${resourceType} ${resource.name || resource.id}`,
      description: `${resourceType} appears to be unused. Consider deleting to reduce costs.`,
      category: OptimizationCategory.UNUSED_RESOURCES,
      resource: {
        id: resource.id,
        name: resource.name || resource.id,
        type: resourceType,
        region: resource.region,
        tags: resource.tags,
      },
      current: {
        configuration: `${resourceType} (unused)`,
        monthlyCost,
      },
      recommended: {
        configuration: `Delete ${resourceType}`,
        monthlyCost: 0,
        description: 'Remove unused resource to eliminate costs',
      },
      savings: {
        monthly: monthlyCost,
        annual: monthlyCost * 12,
        percentage: 100,
      },
      risk: RiskLevel.LOW,
      effort: EffortLevel.MINIMAL,
      confidence: ConfidenceLevel.MEDIUM,
      confidenceScore: 75,
      implementation: {
        steps: [
          `Verify ${resourceType} is not in use`,
          `Delete the ${resourceType}`,
          'Update any references if needed',
        ],
        estimatedTime: '10-15 minutes',
        downtime: 'N/A - resource not in use',
        rollbackPlan: `Recreate ${resourceType} if needed`,
      },
      source: 'unused-analyzer',
      createdAt: new Date(),
    };
  }

  /**
   * Create reserved instance recommendation
   */
  private createReservedInstanceRecommendation(
    instanceType: string,
    region: string,
    count: number,
    totalMonthlyCost: number
  ): OptimizationRecommendation {
    const riSavingsPercent = 40; // ~40% savings with 1-year RI
    const monthlySavings = totalMonthlyCost * (riSavingsPercent / 100);

    return {
      id: `ri-${instanceType}-${region}`,
      title: `Purchase Reserved Instances for ${count}x ${instanceType}`,
      description: `You have ${count} ${instanceType} instances running consistently in ${region}. Reserved Instances could significantly reduce costs.`,
      category: OptimizationCategory.RESERVED_CAPACITY,
      resource: {
        id: `${instanceType}-${region}`,
        name: `${count}x ${instanceType}`,
        type: 'EC2 Reserved Instance Opportunity',
        region,
      },
      current: {
        configuration: `${count}x ${instanceType} On-Demand`,
        monthlyCost: totalMonthlyCost,
      },
      recommended: {
        configuration: `${count}x ${instanceType} 1-Year Reserved`,
        monthlyCost: totalMonthlyCost - monthlySavings,
        description: 'Purchase 1-year Standard Reserved Instances',
      },
      savings: {
        monthly: monthlySavings,
        annual: monthlySavings * 12,
        percentage: riSavingsPercent,
      },
      risk: RiskLevel.LOW,
      effort: EffortLevel.LOW,
      confidence: ConfidenceLevel.HIGH,
      confidenceScore: 88,
      implementation: {
        steps: [
          'Analyze instance usage patterns for the past 3 months',
          'Verify instances will be needed for the commitment period',
          'Purchase Reserved Instances through AWS Console or CLI',
          'Monitor RI utilization',
        ],
        estimatedTime: '1-2 hours',
        downtime: 'None',
        rollbackPlan: 'RIs can be sold on the AWS Reserved Instance Marketplace',
        prerequisites: ['Stable workload for 12+ months', 'Budget approval for upfront payment (if applicable)'],
      },
      source: 'ri-analyzer',
      createdAt: new Date(),
    };
  }

  /**
   * Filter recommendations based on configuration
   */
  private filterRecommendations(): OptimizationRecommendation[] {
    const riskOrder = [RiskLevel.NONE, RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH];
    const maxRiskIndex = riskOrder.indexOf(this.config.maxRiskLevel);

    return this.recommendations.filter(rec => {
      // Filter by minimum savings
      if (rec.savings.monthly < this.config.minSavingsThreshold) {
        return false;
      }

      // Filter by risk level
      const recRiskIndex = riskOrder.indexOf(rec.risk);
      if (recRiskIndex > maxRiskIndex) {
        return false;
      }

      // Filter by confidence
      if (rec.confidenceScore < this.config.minConfidence) {
        return false;
      }

      // Filter by category
      if (!this.config.categories.includes(rec.category)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sort recommendations based on configuration
   */
  private sortRecommendations(recs: OptimizationRecommendation[]): OptimizationRecommendation[] {
    const sorted = [...recs];

    switch (this.config.sortBy) {
      case 'savings':
        sorted.sort((a, b) => b.savings.monthly - a.savings.monthly);
        break;
      case 'effort': {
        const effortOrder = [EffortLevel.MINIMAL, EffortLevel.LOW, EffortLevel.MEDIUM, EffortLevel.HIGH];
        sorted.sort((a, b) => effortOrder.indexOf(a.effort) - effortOrder.indexOf(b.effort));
        break;
      }
      case 'risk': {
        const riskOrder = [RiskLevel.NONE, RiskLevel.LOW, RiskLevel.MEDIUM, RiskLevel.HIGH];
        sorted.sort((a, b) => riskOrder.indexOf(a.risk) - riskOrder.indexOf(b.risk));
        break;
      }
      case 'confidence':
        sorted.sort((a, b) => b.confidenceScore - a.confidenceScore);
        break;
    }

    return sorted;
  }

  /**
   * Generate optimization report
   */
  private generateReport(
    recommendations: OptimizationRecommendation[],
    inventory: ResourceInventory,
    analysisTimeMs: number
  ): OptimizationReport {
    // Calculate summary statistics
    const summary = {
      totalRecommendations: recommendations.length,
      totalMonthlySavings: recommendations.reduce((sum, r) => sum + r.savings.monthly, 0),
      totalAnnualSavings: recommendations.reduce((sum, r) => sum + r.savings.annual, 0),
      byCategory: {} as Record<OptimizationCategory, { count: number; savings: number }>,
      byRisk: {} as Record<RiskLevel, number>,
      byEffort: {} as Record<EffortLevel, number>,
    };

    // Initialize category stats
    for (const cat of Object.values(OptimizationCategory)) {
      summary.byCategory[cat] = { count: 0, savings: 0 };
    }

    // Initialize risk/effort stats
    for (const risk of Object.values(RiskLevel)) {
      summary.byRisk[risk] = 0;
    }
    for (const effort of Object.values(EffortLevel)) {
      summary.byEffort[effort] = 0;
    }

    // Calculate stats
    for (const rec of recommendations) {
      summary.byCategory[rec.category].count++;
      summary.byCategory[rec.category].savings += rec.savings.monthly;
      summary.byRisk[rec.risk]++;
      summary.byEffort[rec.effort]++;
    }

    // Identify quick wins (high savings, low effort, low risk)
    const quickWins = recommendations.filter(rec =>
      rec.savings.monthly >= 50 &&
      (rec.effort === EffortLevel.MINIMAL || rec.effort === EffortLevel.LOW) &&
      (rec.risk === RiskLevel.NONE || rec.risk === RiskLevel.LOW)
    ).slice(0, 5);

    // Top opportunities by savings
    const topOpportunities = [...recommendations]
      .sort((a, b) => b.savings.monthly - a.savings.monthly)
      .slice(0, this.config.topN);

    return {
      summary,
      recommendations,
      quickWins,
      topOpportunities,
      metadata: {
        analyzedAt: new Date(),
        resourcesAnalyzed: inventory.totalResources,
        analysisTimeMs,
        dataQuality: this.assessDataQuality(inventory),
      },
    };
  }

  // Helper methods

  private estimateResourceCost(resource: any, costBreakdown: CostBreakdown): number {
    // Simplified cost estimation based on resource type
    // In production, this would use actual cost allocation data
    const totalCost = costBreakdown.totals.thisMonth || 0;
    const totalResources = Object.keys(costBreakdown.totalsByService.thisMonth || {}).length || 1;
    return totalCost / totalResources / 10; // Rough per-resource estimate
  }

  private simulateUtilization(resource: any): { cpu: number; memory: number } {
    // Simulate utilization for demo purposes
    // In production, this would query CloudWatch metrics
    return {
      cpu: Math.random() * 60 + 10, // 10-70%
      memory: Math.random() * 50 + 20, // 20-70%
    };
  }

  private getDownsizedInstanceType(currentType: string): string | null {
    const downsizeMap: Record<string, string> = {
      't3.xlarge': 't3.large',
      't3.large': 't3.medium',
      't3.medium': 't3.small',
      'm5.xlarge': 'm5.large',
      'm5.large': 'm5.medium',
      'c5.xlarge': 'c5.large',
      'c5.large': 'c5.medium',
      'r5.xlarge': 'r5.large',
      'r5.large': 'r5.medium',
    };
    return downsizeMap[currentType] || null;
  }

  private getDownsizeSavingsPercent(currentType: string, recommendedType: string): number {
    // Simplified savings calculation
    if (currentType.includes('xlarge') && recommendedType.includes('large')) {
      return 50;
    }
    if (currentType.includes('large') && recommendedType.includes('medium')) {
      return 50;
    }
    if (currentType.includes('medium') && recommendedType.includes('small')) {
      return 50;
    }
    return 30;
  }

  private mapFinOpsTypeToCategory(type: string): OptimizationCategory {
    switch (type) {
      case 'RESOURCE_RIGHTSIZING':
        return OptimizationCategory.COMPUTE;
      case 'RESERVED_CAPACITY':
        return OptimizationCategory.RESERVED_CAPACITY;
      case 'ARCHITECTURE':
        return OptimizationCategory.ARCHITECTURE;
      default:
        return OptimizationCategory.COMPUTE;
    }
  }

  private mapEffortToRisk(effort: string): RiskLevel {
    switch (effort.toUpperCase()) {
      case 'LOW':
        return RiskLevel.LOW;
      case 'MEDIUM':
        return RiskLevel.MEDIUM;
      case 'HIGH':
        return RiskLevel.HIGH;
      default:
        return RiskLevel.MEDIUM;
    }
  }

  private effortToTime(effort: string): string {
    switch (effort.toUpperCase()) {
      case 'LOW':
        return '1-2 hours';
      case 'MEDIUM':
        return '1-2 days';
      case 'HIGH':
        return '1 week+';
      default:
        return 'Varies';
    }
  }

  private assessDataQuality(inventory: ResourceInventory): 'high' | 'medium' | 'low' {
    if (inventory.totalResources > 50) return 'high';
    if (inventory.totalResources > 10) return 'medium';
    return 'low';
  }
}

/**
 * Format optimization report for CLI display
 */
export function formatOptimizationReport(report: OptimizationReport): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push('═'.repeat(70));
  lines.push('  COST OPTIMIZATION REPORT');
  lines.push('═'.repeat(70));
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push('─'.repeat(70));
  lines.push(`Total Recommendations: ${report.summary.totalRecommendations}`);
  lines.push(`Potential Monthly Savings: $${report.summary.totalMonthlySavings.toFixed(2)}`);
  lines.push(`Potential Annual Savings: $${report.summary.totalAnnualSavings.toFixed(2)}`);
  lines.push('');

  // Quick Wins
  if (report.quickWins.length > 0) {
    lines.push('QUICK WINS (High Impact, Low Effort)');
    lines.push('─'.repeat(70));
    for (const rec of report.quickWins) {
      lines.push(`  ⚡ ${rec.title}`);
      lines.push(`     Savings: $${rec.savings.monthly.toFixed(2)}/month | Effort: ${rec.effort} | Risk: ${rec.risk}`);
    }
    lines.push('');
  }

  // Top Opportunities
  lines.push('TOP OPPORTUNITIES');
  lines.push('─'.repeat(70));
  lines.push('');
  lines.push(' #  │ Recommendation                        │ Monthly     │ Effort  │ Risk');
  lines.push('────┼───────────────────────────────────────┼─────────────┼─────────┼──────');

  report.topOpportunities.slice(0, 10).forEach((rec, index) => {
    const title = rec.title.length > 37 ? rec.title.substring(0, 34) + '...' : rec.title.padEnd(37);
    const savings = `$${rec.savings.monthly.toFixed(0)}`.padStart(10);
    const effort = rec.effort.padEnd(7);
    const risk = rec.risk;
    lines.push(` ${(index + 1).toString().padStart(2)} │ ${title} │ ${savings} │ ${effort} │ ${risk}`);
  });

  lines.push('────┴───────────────────────────────────────┴─────────────┴─────────┴──────');
  lines.push('');

  // By Category
  lines.push('SAVINGS BY CATEGORY');
  lines.push('─'.repeat(70));
  for (const [category, data] of Object.entries(report.summary.byCategory)) {
    if (data.count > 0) {
      lines.push(`  ${category}: ${data.count} recommendations, $${data.savings.toFixed(2)}/month`);
    }
  }
  lines.push('');

  // Metadata
  lines.push('─'.repeat(70));
  lines.push(`Analyzed: ${report.metadata.resourcesAnalyzed} resources in ${report.metadata.analysisTimeMs}ms`);
  lines.push(`Data Quality: ${report.metadata.dataQuality}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Format single recommendation for detailed view
 */
export function formatRecommendationDetail(rec: OptimizationRecommendation): string {
  const lines: string[] = [];

  lines.push('');
  lines.push('═'.repeat(70));
  lines.push(`  ${rec.title}`);
  lines.push('═'.repeat(70));
  lines.push('');

  lines.push('OVERVIEW');
  lines.push('─'.repeat(70));
  lines.push(`Description: ${rec.description}`);
  lines.push(`Category: ${rec.category}`);
  lines.push(`Confidence: ${rec.confidence} (${rec.confidenceScore}%)`);
  lines.push('');

  lines.push('RESOURCE');
  lines.push('─'.repeat(70));
  lines.push(`ID: ${rec.resource.id}`);
  lines.push(`Name: ${rec.resource.name}`);
  lines.push(`Type: ${rec.resource.type}`);
  lines.push(`Region: ${rec.resource.region}`);
  lines.push('');

  lines.push('CURRENT STATE');
  lines.push('─'.repeat(70));
  lines.push(`Configuration: ${rec.current.configuration}`);
  lines.push(`Monthly Cost: $${rec.current.monthlyCost.toFixed(2)}`);
  if (rec.current.utilization) {
    lines.push(`Utilization: CPU ${rec.current.utilization.cpu?.toFixed(1)}%, Memory ${rec.current.utilization.memory?.toFixed(1)}%`);
  }
  lines.push('');

  lines.push('RECOMMENDATION');
  lines.push('─'.repeat(70));
  lines.push(`Configuration: ${rec.recommended.configuration}`);
  lines.push(`Projected Cost: $${rec.recommended.monthlyCost.toFixed(2)}`);
  lines.push(`Description: ${rec.recommended.description}`);
  lines.push('');

  lines.push('SAVINGS');
  lines.push('─'.repeat(70));
  lines.push(`Monthly: $${rec.savings.monthly.toFixed(2)} (${rec.savings.percentage}%)`);
  lines.push(`Annual: $${rec.savings.annual.toFixed(2)}`);
  lines.push('');

  lines.push('ASSESSMENT');
  lines.push('─'.repeat(70));
  lines.push(`Risk: ${rec.risk}`);
  lines.push(`Effort: ${rec.effort}`);
  lines.push(`Estimated Time: ${rec.implementation.estimatedTime}`);
  lines.push(`Downtime: ${rec.implementation.downtime}`);
  lines.push('');

  lines.push('IMPLEMENTATION STEPS');
  lines.push('─'.repeat(70));
  rec.implementation.steps.forEach((step, i) => {
    lines.push(`  ${i + 1}. ${step}`);
  });
  lines.push('');

  lines.push('ROLLBACK PLAN');
  lines.push('─'.repeat(70));
  lines.push(`  ${rec.implementation.rollbackPlan}`);
  lines.push('');

  if (rec.implementation.prerequisites && rec.implementation.prerequisites.length > 0) {
    lines.push('PREREQUISITES');
    lines.push('─'.repeat(70));
    rec.implementation.prerequisites.forEach(prereq => {
      lines.push(`  • ${prereq}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}
