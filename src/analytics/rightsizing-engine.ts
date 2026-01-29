import { CloudProvider, ResourceInventory } from '../types/providers';
import EventEmitter from 'events';

export interface UtilizationMetrics {
  // CPU metrics
  cpu: {
    average: number;      // 0-1 scale
    maximum: number;      // 0-1 scale
    p95: number;         // 95th percentile
    p99: number;         // 99th percentile
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: number;   // 0-1 scale
  };

  // Memory metrics
  memory: {
    average: number;
    maximum: number;
    p95: number;
    p99: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    volatility: number;
  };

  // Network metrics
  network?: {
    inbound: number;      // MB/s average
    outbound: number;     // MB/s average
    packets: number;      // packets/s average
    trend: 'increasing' | 'decreasing' | 'stable';
  };

  // Storage metrics
  storage?: {
    readIOPS: number;
    writeIOPS: number;
    readThroughput: number;  // MB/s
    writeThroughput: number; // MB/s
    utilization: number;     // 0-1 scale
  };

  // Time series data
  timeSeries: {
    timestamps: Date[];
    cpuValues: number[];
    memoryValues: number[];
    networkInValues?: number[];
    networkOutValues?: number[];
  };

  // Data quality
  dataQuality: {
    completeness: number;    // 0-1 scale
    timeRange: number;       // days of data
    sampleCount: number;     // number of data points
    outlierCount: number;    // number of outliers detected
  };
}

export interface ResourceConfiguration {
  instanceType: string;
  cpu: {
    cores: number;
    clockSpeed: number;   // GHz
    architecture: string; // x86_64, arm64, etc.
  };
  memory: {
    sizeGB: number;
    type: string;        // DDR4, DDR5, etc.
  };
  network: {
    bandwidth: number;   // Gbps
    pps: number;        // packets per second
  };
  storage?: {
    type: string;       // EBS, ephemeral, etc.
    sizeGB: number;
    iops: number;
    throughput: number; // MB/s
  };
  pricing: {
    onDemand: number;   // $/hour
    reserved1Year: number;
    reserved3Year: number;
    spot?: number;
  };
  provider: CloudProvider;
  region: string;
}

export interface RightsizingRecommendation {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  provider: CloudProvider;

  // Current configuration
  current: {
    instanceType: string;
    configuration: ResourceConfiguration;
    monthlyCost: number;
    utilization: UtilizationMetrics;
  };

  // Recommended configuration
  recommended: {
    instanceType: string;
    configuration: ResourceConfiguration;
    monthlyCost: number;
    expectedUtilization: {
      cpu: number;
      memory: number;
    };
  };

  // Analysis results
  analysis: {
    rightsizingType: 'DOWNSIZE' | 'UPSIZE' | 'CHANGE_FAMILY' | 'MODERNIZE' | 'TERMINATE';
    confidence: number;        // 0-1 scale
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    performanceImpact: number; // -1 to 1 (negative = worse, positive = better)
  };

  // Financial impact
  savings: {
    monthlyAmount: number;
    annualAmount: number;
    percentage: number;
    paybackPeriod?: number; // months
  };

  // Implementation details
  implementation: {
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    downtime: number;          // minutes
    steps: string[];
    prerequisites: string[];
    rollbackPlan: string[];
    timeline: string;
  };

  // Machine learning insights
  mlInsights: {
    modelUsed: string;
    predictionAccuracy: number;
    seasonalPatterns: boolean;
    growthTrend: 'increasing' | 'decreasing' | 'stable';
    anomaliesDetected: number;
    recommendationReasons: string[];
  };

  // Validation and monitoring
  validation: {
    benchmarkTests: string[];
    monitoringPeriod: number;  // days
    rollbackCriteria: string[];
    successMetrics: string[];
  };
}

export interface RightsizingConfiguration {
  // Analysis parameters
  analysis: {
    lookbackDays: number;
    minDataPoints: number;
    outlierThreshold: number;      // standard deviations
    confidenceThreshold: number;   // minimum confidence for recommendations
    utilizationTargets: {
      cpu: number;                 // target CPU utilization (0-1)
      memory: number;              // target memory utilization (0-1)
    };
  };

  // Business constraints
  constraints: {
    maxDowntimeMinutes: number;
    allowedInstanceFamilies: string[];
    excludedInstanceTypes: string[];
    minSavingsThreshold: number;   // minimum $ savings to recommend
    maxCostIncrease: number;       // maximum allowed cost increase for performance
  };

  // Risk management
  risk: {
    conservativeMode: boolean;     // prefer safer recommendations
    allowExperimentalInstances: boolean;
    requireLoadTesting: boolean;
    mandatoryRollbackPlan: boolean;
  };

  // Provider preferences
  providers: {
    preferSpotInstances: boolean;
    preferReservedInstances: boolean;
    preferLatestGeneration: boolean;
    crossRegionRecommendations: boolean;
  };
}

export class RightsizingEngine extends EventEmitter {
  private configuration: RightsizingConfiguration;
  private instanceCatalog: Map<CloudProvider, Map<string, ResourceConfiguration>> = new Map();
  private utilizationHistory: Map<string, UtilizationMetrics[]> = new Map();

  constructor(config: Partial<RightsizingConfiguration> = {}) {
    super();

    this.configuration = {
      analysis: {
        lookbackDays: 30,
        minDataPoints: 100,
        outlierThreshold: 2.0,
        confidenceThreshold: 0.8,
        utilizationTargets: {
          cpu: 0.7,    // 70% CPU target
          memory: 0.8  // 80% memory target
        }
      },
      constraints: {
        maxDowntimeMinutes: 10,
        allowedInstanceFamilies: [],
        excludedInstanceTypes: [],
        minSavingsThreshold: 10,
        maxCostIncrease: 0.2 // 20% max increase
      },
      risk: {
        conservativeMode: true,
        allowExperimentalInstances: false,
        requireLoadTesting: true,
        mandatoryRollbackPlan: true
      },
      providers: {
        preferSpotInstances: false,
        preferReservedInstances: true,
        preferLatestGeneration: true,
        crossRegionRecommendations: false
      },
      ...config
    };

    this.initializeInstanceCatalogs();
  }

  /**
   * Generate rightsizing recommendations for resources
   */
  async generateRecommendations(
    resources: any[],
    utilizationData: Map<string, UtilizationMetrics>
  ): Promise<RightsizingRecommendation[]> {
    this.emit('analysisStarted', { resourceCount: resources.length });

    const recommendations: RightsizingRecommendation[] = [];

    for (const resource of resources) {
      try {
        const utilization = utilizationData.get(resource.id);

        if (!utilization) {
          this.emit('missingUtilizationData', { resourceId: resource.id });
          continue;
        }

        // Validate data quality
        if (!this.isDataQualitySufficient(utilization)) {
          this.emit('insufficientData', {
            resourceId: resource.id,
            dataQuality: utilization.dataQuality
          });
          continue;
        }

        const recommendation = await this.analyzeResource(resource, utilization);

        if (recommendation && recommendation.analysis.confidence >= this.configuration.analysis.confidenceThreshold) {
          recommendations.push(recommendation);
          this.emit('recommendationGenerated', recommendation);
        }

      } catch (error) {
        this.emit('analysisError', { resourceId: resource.id, error: error.message });
      }
    }

    // Sort by savings potential
    recommendations.sort((a, b) => b.savings.monthlyAmount - a.savings.monthlyAmount);

    this.emit('analysisCompleted', {
      totalRecommendations: recommendations.length,
      totalMonthlySavings: recommendations.reduce((sum, r) => sum + r.savings.monthlyAmount, 0)
    });

    return recommendations;
  }

  /**
   * Analyze a single resource for rightsizing opportunities
   */
  private async analyzeResource(
    resource: any,
    utilization: UtilizationMetrics
  ): Promise<RightsizingRecommendation | null> {
    const currentConfig = await this.getCurrentConfiguration(resource);
    if (!currentConfig) {
      return null;
    }

    // Apply ML analysis to determine optimal sizing
    const mlAnalysis = this.performMLAnalysis(utilization);

    // Find optimal instance type based on utilization patterns
    const optimalConfig = await this.findOptimalConfiguration(
      resource,
      utilization,
      currentConfig,
      mlAnalysis
    );

    if (!optimalConfig) {
      return null;
    }

    // Calculate rightsizing type and impact
    const rightsizingType = this.determineRightsizingType(currentConfig, optimalConfig);
    const savings = this.calculateSavings(currentConfig, optimalConfig);
    const riskLevel = this.assessRiskLevel(currentConfig, optimalConfig, utilization);

    // Skip if savings don't meet threshold
    if (savings.monthlyAmount < this.configuration.constraints.minSavingsThreshold &&
        rightsizingType !== 'UPSIZE') {
      return null;
    }

    const recommendation: RightsizingRecommendation = {
      resourceId: resource.id,
      resourceName: resource.name || resource.id,
      resourceType: resource.type || 'instance',
      provider: resource.provider,

      current: {
        instanceType: currentConfig.instanceType,
        configuration: currentConfig,
        monthlyCost: currentConfig.pricing.onDemand * 24 * 30,
        utilization
      },

      recommended: {
        instanceType: optimalConfig.instanceType,
        configuration: optimalConfig,
        monthlyCost: optimalConfig.pricing.onDemand * 24 * 30,
        expectedUtilization: {
          cpu: Math.min(1.0, utilization.cpu.average * (currentConfig.cpu.cores / optimalConfig.cpu.cores)),
          memory: Math.min(1.0, utilization.memory.average * (currentConfig.memory.sizeGB / optimalConfig.memory.sizeGB))
        }
      },

      analysis: {
        rightsizingType,
        confidence: mlAnalysis.predictionAccuracy,
        riskLevel,
        performanceImpact: this.calculatePerformanceImpact(currentConfig, optimalConfig)
      },

      savings,

      implementation: {
        complexity: this.assessImplementationComplexity(rightsizingType, currentConfig, optimalConfig),
        downtime: this.estimateDowntime(rightsizingType),
        steps: this.generateImplementationSteps(rightsizingType, resource, optimalConfig),
        prerequisites: this.getPrerequisites(rightsizingType),
        rollbackPlan: this.generateRollbackPlan(rightsizingType, currentConfig),
        timeline: this.estimateTimeline(rightsizingType)
      },

      mlInsights: mlAnalysis,

      validation: {
        benchmarkTests: this.getBenchmarkTests(resource.type),
        monitoringPeriod: this.getMonitoringPeriod(riskLevel),
        rollbackCriteria: this.getRollbackCriteria(utilization),
        successMetrics: this.getSuccessMetrics(rightsizingType)
      }
    };

    return recommendation;
  }

  /**
   * Perform machine learning analysis on utilization data
   */
  private performMLAnalysis(utilization: UtilizationMetrics): RightsizingRecommendation['mlInsights'] {
    const insights: RightsizingRecommendation['mlInsights'] = {
      modelUsed: 'ensemble_rightsizing_model',
      predictionAccuracy: 0.85, // Would be calculated from historical validation
      seasonalPatterns: this.detectSeasonalPatterns(utilization),
      growthTrend: utilization.cpu.trend,
      anomaliesDetected: utilization.dataQuality.outlierCount,
      recommendationReasons: []
    };

    // Analyze utilization patterns
    if (utilization.cpu.average < 0.2) {
      insights.recommendationReasons.push('Low CPU utilization detected (< 20%)');
    }

    if (utilization.memory.average < 0.3) {
      insights.recommendationReasons.push('Low memory utilization detected (< 30%)');
    }

    if (utilization.cpu.volatility > 0.5) {
      insights.recommendationReasons.push('High CPU volatility suggests burstable instance suitability');
    }

    if (utilization.cpu.trend === 'increasing') {
      insights.recommendationReasons.push('Increasing CPU trend suggests future capacity needs');
    }

    // Apply ML-specific insights
    const cpuEfficiencyScore = this.calculateEfficiencyScore(utilization.cpu);
    const memoryEfficiencyScore = this.calculateEfficiencyScore(utilization.memory);

    if (cpuEfficiencyScore < 0.4) {
      insights.recommendationReasons.push(`CPU efficiency score: ${(cpuEfficiencyScore * 100).toFixed(1)}%`);
    }

    if (memoryEfficiencyScore < 0.4) {
      insights.recommendationReasons.push(`Memory efficiency score: ${(memoryEfficiencyScore * 100).toFixed(1)}%`);
    }

    // Confidence scoring based on data quality and pattern consistency
    const dataQualityScore = utilization.dataQuality.completeness;
    const patternConsistencyScore = 1 - Math.min(utilization.cpu.volatility, utilization.memory.volatility);

    insights.predictionAccuracy = (dataQualityScore + patternConsistencyScore) / 2;

    return insights;
  }

  /**
   * Find optimal configuration for a resource
   */
  private async findOptimalConfiguration(
    resource: any,
    utilization: UtilizationMetrics,
    currentConfig: ResourceConfiguration,
    mlAnalysis: RightsizingRecommendation['mlInsights']
  ): Promise<ResourceConfiguration | null> {
    const providerCatalog = this.instanceCatalog.get(resource.provider);
    if (!providerCatalog) {
      return null;
    }

    // Calculate required resources based on utilization and targets
    const targetCpu = this.configuration.analysis.utilizationTargets.cpu;
    const targetMemory = this.configuration.analysis.utilizationTargets.memory;

    const requiredCpuCores = Math.max(1, Math.ceil(
      (utilization.cpu.p95 / targetCpu) * currentConfig.cpu.cores
    ));

    const requiredMemoryGB = Math.max(1, Math.ceil(
      (utilization.memory.p95 / targetMemory) * currentConfig.memory.sizeGB
    ));

    // Account for growth trend
    let growthMultiplier = 1.0;
    if (mlAnalysis.growthTrend === 'increasing') {
      growthMultiplier = 1.2; // 20% buffer for growing workloads
    }

    const finalRequiredCpu = Math.ceil(requiredCpuCores * growthMultiplier);
    const finalRequiredMemory = Math.ceil(requiredMemoryGB * growthMultiplier);

    // Find candidate configurations
    const candidates: Array<{ config: ResourceConfiguration; score: number }> = [];

    for (const [instanceType, config] of providerCatalog) {
      // Skip if excluded
      if (this.configuration.constraints.excludedInstanceTypes.includes(instanceType)) {
        continue;
      }

      // Check if it meets requirements
      if (config.cpu.cores < finalRequiredCpu || config.memory.sizeGB < finalRequiredMemory) {
        continue;
      }

      // Skip oversized instances (more than 50% over requirement)
      if (config.cpu.cores > finalRequiredCpu * 1.5 || config.memory.sizeGB > finalRequiredMemory * 1.5) {
        continue;
      }

      // Calculate score based on multiple factors
      const score = this.calculateConfigurationScore(
        config,
        utilization,
        finalRequiredCpu,
        finalRequiredMemory,
        currentConfig
      );

      candidates.push({ config, score });
    }

    if (candidates.length === 0) {
      return null;
    }

    // Sort by score and return best option
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].config;
  }

  /**
   * Calculate configuration score for selection
   */
  private calculateConfigurationScore(
    config: ResourceConfiguration,
    utilization: UtilizationMetrics,
    requiredCpu: number,
    requiredMemory: number,
    currentConfig: ResourceConfiguration
  ): number {
    let score = 0;

    // Cost efficiency (40% weight)
    const currentCostPerHour = currentConfig.pricing.onDemand;
    const newCostPerHour = config.pricing.onDemand;
    const costRatio = currentCostPerHour / newCostPerHour;
    score += costRatio * 0.4;

    // Resource efficiency (30% weight)
    const cpuUtilization = requiredCpu / config.cpu.cores;
    const memoryUtilization = requiredMemory / config.memory.sizeGB;
    const avgUtilization = (cpuUtilization + memoryUtilization) / 2;

    // Prefer configurations that get us close to target utilization
    const targetUtilization = (this.configuration.analysis.utilizationTargets.cpu +
                             this.configuration.analysis.utilizationTargets.memory) / 2;
    const utilizationScore = 1 - Math.abs(avgUtilization - targetUtilization);
    score += utilizationScore * 0.3;

    // Performance impact (20% weight)
    const cpuPerformanceRatio = (config.cpu.cores * config.cpu.clockSpeed) /
                               (currentConfig.cpu.cores * currentConfig.cpu.clockSpeed);
    const performanceScore = Math.min(1.5, cpuPerformanceRatio); // Cap at 1.5x
    score += (performanceScore - 1) * 0.2;

    // Network and other factors (10% weight)
    const networkRatio = config.network.bandwidth / currentConfig.network.bandwidth;
    const networkScore = Math.min(1.2, networkRatio);
    score += (networkScore - 1) * 0.1;

    // Prefer latest generation instances
    if (this.configuration.providers.preferLatestGeneration) {
      if (config.instanceType.includes('5') || config.instanceType.includes('6')) {
        score += 0.1;
      }
    }

    // Penalty for high volatility workloads on non-burstable instances
    if (utilization.cpu.volatility > 0.6 && !config.instanceType.includes('t')) {
      score -= 0.2;
    }

    return Math.max(0, score);
  }

  /**
   * Initialize instance catalogs for different providers
   */
  private initializeInstanceCatalogs(): void {
    // AWS instances
    const awsCatalog = new Map<string, ResourceConfiguration>();

    // General purpose instances
    awsCatalog.set('t3.micro', {
      instanceType: 't3.micro',
      cpu: { cores: 2, clockSpeed: 2.5, architecture: 'x86_64' },
      memory: { sizeGB: 1, type: 'DDR4' },
      network: { bandwidth: 5, pps: 1000000 },
      pricing: { onDemand: 0.0104, reserved1Year: 0.0062, reserved3Year: 0.0042 },
      provider: CloudProvider.AWS,
      region: 'us-east-1'
    });

    awsCatalog.set('t3.small', {
      instanceType: 't3.small',
      cpu: { cores: 2, clockSpeed: 2.5, architecture: 'x86_64' },
      memory: { sizeGB: 2, type: 'DDR4' },
      network: { bandwidth: 5, pps: 1000000 },
      pricing: { onDemand: 0.0208, reserved1Year: 0.0125, reserved3Year: 0.0083 },
      provider: CloudProvider.AWS,
      region: 'us-east-1'
    });

    awsCatalog.set('m5.large', {
      instanceType: 'm5.large',
      cpu: { cores: 2, clockSpeed: 3.1, architecture: 'x86_64' },
      memory: { sizeGB: 8, type: 'DDR4' },
      network: { bandwidth: 10, pps: 2500000 },
      pricing: { onDemand: 0.096, reserved1Year: 0.058, reserved3Year: 0.038 },
      provider: CloudProvider.AWS,
      region: 'us-east-1'
    });

    awsCatalog.set('m5.xlarge', {
      instanceType: 'm5.xlarge',
      cpu: { cores: 4, clockSpeed: 3.1, architecture: 'x86_64' },
      memory: { sizeGB: 16, type: 'DDR4' },
      network: { bandwidth: 10, pps: 2500000 },
      pricing: { onDemand: 0.192, reserved1Year: 0.115, reserved3Year: 0.076 },
      provider: CloudProvider.AWS,
      region: 'us-east-1'
    });

    awsCatalog.set('c5.large', {
      instanceType: 'c5.large',
      cpu: { cores: 2, clockSpeed: 3.4, architecture: 'x86_64' },
      memory: { sizeGB: 4, type: 'DDR4' },
      network: { bandwidth: 10, pps: 2500000 },
      pricing: { onDemand: 0.085, reserved1Year: 0.051, reserved3Year: 0.034 },
      provider: CloudProvider.AWS,
      region: 'us-east-1'
    });

    awsCatalog.set('r5.large', {
      instanceType: 'r5.large',
      cpu: { cores: 2, clockSpeed: 3.1, architecture: 'x86_64' },
      memory: { sizeGB: 16, type: 'DDR4' },
      network: { bandwidth: 10, pps: 2500000 },
      pricing: { onDemand: 0.126, reserved1Year: 0.076, reserved3Year: 0.050 },
      provider: CloudProvider.AWS,
      region: 'us-east-1'
    });

    this.instanceCatalog.set(CloudProvider.AWS, awsCatalog);

    // GCP instances
    const gcpCatalog = new Map<string, ResourceConfiguration>();

    gcpCatalog.set('e2-micro', {
      instanceType: 'e2-micro',
      cpu: { cores: 2, clockSpeed: 2.8, architecture: 'x86_64' },
      memory: { sizeGB: 1, type: 'DDR4' },
      network: { bandwidth: 1, pps: 250000 },
      pricing: { onDemand: 0.008, reserved1Year: 0.005, reserved3Year: 0.003 },
      provider: CloudProvider.GOOGLE_CLOUD,
      region: 'us-central1'
    });

    gcpCatalog.set('n2-standard-2', {
      instanceType: 'n2-standard-2',
      cpu: { cores: 2, clockSpeed: 2.8, architecture: 'x86_64' },
      memory: { sizeGB: 8, type: 'DDR4' },
      network: { bandwidth: 10, pps: 2000000 },
      pricing: { onDemand: 0.097, reserved1Year: 0.069, reserved3Year: 0.048 },
      provider: CloudProvider.GOOGLE_CLOUD,
      region: 'us-central1'
    });

    this.instanceCatalog.set(CloudProvider.GOOGLE_CLOUD, gcpCatalog);

    // Azure instances
    const azureCatalog = new Map<string, ResourceConfiguration>();

    azureCatalog.set('B1ms', {
      instanceType: 'B1ms',
      cpu: { cores: 1, clockSpeed: 2.4, architecture: 'x86_64' },
      memory: { sizeGB: 2, type: 'DDR4' },
      network: { bandwidth: 0.75, pps: 500000 },
      pricing: { onDemand: 0.0208, reserved1Year: 0.0150, reserved3Year: 0.0104 },
      provider: CloudProvider.AZURE,
      region: 'eastus'
    });

    azureCatalog.set('D2s_v3', {
      instanceType: 'D2s_v3',
      cpu: { cores: 2, clockSpeed: 2.4, architecture: 'x86_64' },
      memory: { sizeGB: 8, type: 'DDR4' },
      network: { bandwidth: 1, pps: 1000000 },
      pricing: { onDemand: 0.096, reserved1Year: 0.062, reserved3Year: 0.041 },
      provider: CloudProvider.AZURE,
      region: 'eastus'
    });

    this.instanceCatalog.set(CloudProvider.AZURE, azureCatalog);
  }

  /**
   * Helper methods for analysis
   */
  private isDataQualitySufficient(utilization: UtilizationMetrics): boolean {
    return (
      utilization.dataQuality.completeness >= 0.8 &&
      utilization.dataQuality.sampleCount >= this.configuration.analysis.minDataPoints &&
      utilization.dataQuality.timeRange >= 7 // At least 1 week of data
    );
  }

  private async getCurrentConfiguration(resource: any): Promise<ResourceConfiguration | null> {
    const catalog = this.instanceCatalog.get(resource.provider);
    if (!catalog) return null;

    const instanceType = resource.instanceType || resource.size || 'm5.large'; // Default fallback
    return catalog.get(instanceType) || null;
  }

  private determineRightsizingType(
    current: ResourceConfiguration,
    optimal: ResourceConfiguration
  ): RightsizingRecommendation['analysis']['rightsizingType'] {
    const currentSpecs = current.cpu.cores + current.memory.sizeGB;
    const optimalSpecs = optimal.cpu.cores + optimal.memory.sizeGB;

    if (optimalSpecs < currentSpecs * 0.8) {
      return 'DOWNSIZE';
    } else if (optimalSpecs > currentSpecs * 1.2) {
      return 'UPSIZE';
    } else if (current.instanceType.charAt(0) !== optimal.instanceType.charAt(0)) {
      return 'CHANGE_FAMILY';
    } else if (this.isNewerGeneration(optimal.instanceType, current.instanceType)) {
      return 'MODERNIZE';
    } else {
      return 'DOWNSIZE'; // Default for similar specs
    }
  }

  private calculateSavings(
    current: ResourceConfiguration,
    optimal: ResourceConfiguration
  ): RightsizingRecommendation['savings'] {
    const currentMonthlyCost = current.pricing.onDemand * 24 * 30;
    const optimalMonthlyCost = optimal.pricing.onDemand * 24 * 30;

    const monthlyAmount = currentMonthlyCost - optimalMonthlyCost;
    const percentage = (monthlyAmount / currentMonthlyCost) * 100;

    return {
      monthlyAmount,
      annualAmount: monthlyAmount * 12,
      percentage,
      paybackPeriod: monthlyAmount > 0 ? 0 : undefined // Immediate savings or N/A for cost increases
    };
  }

  private assessRiskLevel(
    current: ResourceConfiguration,
    optimal: ResourceConfiguration,
    utilization: UtilizationMetrics
  ): RightsizingRecommendation['analysis']['riskLevel'] {
    let riskFactors = 0;

    // Resource reduction risk
    const cpuReduction = (current.cpu.cores - optimal.cpu.cores) / current.cpu.cores;
    const memoryReduction = (current.memory.sizeGB - optimal.memory.sizeGB) / current.memory.sizeGB;

    if (cpuReduction > 0.5) riskFactors += 2;
    else if (cpuReduction > 0.3) riskFactors += 1;

    if (memoryReduction > 0.5) riskFactors += 2;
    else if (memoryReduction > 0.3) riskFactors += 1;

    // High utilization risk
    if (utilization.cpu.maximum > 0.9) riskFactors += 1;
    if (utilization.memory.maximum > 0.9) riskFactors += 1;

    // Volatility risk
    if (utilization.cpu.volatility > 0.7) riskFactors += 1;
    if (utilization.memory.volatility > 0.7) riskFactors += 1;

    // Data quality risk
    if (utilization.dataQuality.completeness < 0.9) riskFactors += 1;

    if (riskFactors >= 5) return 'CRITICAL';
    if (riskFactors >= 3) return 'HIGH';
    if (riskFactors >= 1) return 'MEDIUM';
    return 'LOW';
  }

  private calculatePerformanceImpact(
    current: ResourceConfiguration,
    optimal: ResourceConfiguration
  ): number {
    const cpuImpact = ((optimal.cpu.cores * optimal.cpu.clockSpeed) -
                      (current.cpu.cores * current.cpu.clockSpeed)) /
                     (current.cpu.cores * current.cpu.clockSpeed);

    const memoryImpact = (optimal.memory.sizeGB - current.memory.sizeGB) / current.memory.sizeGB;

    return (cpuImpact + memoryImpact) / 2;
  }

  private detectSeasonalPatterns(utilization: UtilizationMetrics): boolean {
    // Simple pattern detection - in production this would be more sophisticated
    if (utilization.dataQuality.timeRange < 14) return false;

    const values = utilization.timeSeries.cpuValues;
    if (values.length < 168) return false; // Need at least a week of hourly data

    // Check for weekly patterns (simplified)
    let weeklyCorrelation = 0;
    for (let i = 0; i < values.length - 168; i++) {
      if (Math.abs(values[i] - values[i + 168]) < 0.1) {
        weeklyCorrelation++;
      }
    }

    return weeklyCorrelation / (values.length - 168) > 0.6;
  }

  private calculateEfficiencyScore(metric: UtilizationMetrics['cpu'] | UtilizationMetrics['memory']): number {
    // Efficiency score based on utilization vs. volatility
    const utilizationScore = metric.average;
    const stabilityScore = 1 - metric.volatility;
    return (utilizationScore + stabilityScore) / 2;
  }

  private assessImplementationComplexity(
    rightsizingType: RightsizingRecommendation['analysis']['rightsizingType'],
    current: ResourceConfiguration,
    optimal: ResourceConfiguration
  ): RightsizingRecommendation['implementation']['complexity'] {
    switch (rightsizingType) {
      case 'TERMINATE':
        return 'HIGH';
      case 'CHANGE_FAMILY':
        return 'HIGH';
      case 'MODERNIZE':
        return 'MEDIUM';
      case 'UPSIZE':
        return 'LOW';
      case 'DOWNSIZE':
        return current.cpu.cores - optimal.cpu.cores > 2 ? 'MEDIUM' : 'LOW';
      default:
        return 'MEDIUM';
    }
  }

  private estimateDowntime(rightsizingType: RightsizingRecommendation['analysis']['rightsizingType']): number {
    const downtimeMap = {
      'DOWNSIZE': 5,
      'UPSIZE': 3,
      'CHANGE_FAMILY': 10,
      'MODERNIZE': 8,
      'TERMINATE': 0
    };
    return downtimeMap[rightsizingType] || 5;
  }

  private generateImplementationSteps(
    rightsizingType: RightsizingRecommendation['analysis']['rightsizingType'],
    resource: any,
    optimalConfig: ResourceConfiguration
  ): string[] {
    const baseSteps = [
      'Create backup/snapshot of current instance',
      'Schedule maintenance window',
      'Notify stakeholders of planned changes'
    ];

    const rightsizingSteps = {
      'DOWNSIZE': [
        ...baseSteps,
        `Stop instance ${resource.id}`,
        `Change instance type to ${optimalConfig.instanceType}`,
        'Start instance and verify functionality',
        'Monitor performance for 24 hours',
        'Update monitoring thresholds'
      ],
      'UPSIZE': [
        ...baseSteps,
        `Stop instance ${resource.id}`,
        `Change instance type to ${optimalConfig.instanceType}`,
        'Start instance and verify functionality',
        'Update monitoring thresholds'
      ],
      'CHANGE_FAMILY': [
        ...baseSteps,
        'Test application compatibility with new instance family',
        'Create AMI/image of current instance',
        'Launch new instance with optimal configuration',
        'Migrate data and applications',
        'Update DNS/load balancer configuration',
        'Terminate old instance after validation'
      ],
      'MODERNIZE': [
        ...baseSteps,
        `Stop instance ${resource.id}`,
        `Change instance type to ${optimalConfig.instanceType}`,
        'Verify application compatibility',
        'Start instance and run compatibility tests',
        'Monitor performance and stability'
      ],
      'TERMINATE': [
        'Verify instance is truly unused',
        'Check for any dependencies',
        'Create final backup if needed',
        'Remove from load balancers',
        'Terminate instance'
      ]
    };

    return rightsizingSteps[rightsizingType] || rightsizingSteps['DOWNSIZE'];
  }

  private getPrerequisites(rightsizingType: RightsizingRecommendation['analysis']['rightsizingType']): string[] {
    const common = [
      'Maintenance window approval',
      'Backup verification',
      'Stakeholder notification'
    ];

    const specific = {
      'CHANGE_FAMILY': ['Application compatibility testing', 'Performance benchmarking'],
      'MODERNIZE': ['New generation compatibility verification'],
      'TERMINATE': ['Dependency analysis', 'Final data backup'],
      'UPSIZE': ['Budget approval for cost increase'],
      'DOWNSIZE': ['Performance impact assessment']
    };

    return [...common, ...(specific[rightsizingType] || [])];
  }

  private generateRollbackPlan(
    rightsizingType: RightsizingRecommendation['analysis']['rightsizingType'],
    currentConfig: ResourceConfiguration
  ): string[] {
    return [
      'Monitor key performance metrics',
      `If performance degrades, revert to ${currentConfig.instanceType}`,
      'Restore from backup if data corruption occurs',
      'Contact on-call engineer if issues persist',
      'Document lessons learned'
    ];
  }

  private estimateTimeline(rightsizingType: RightsizingRecommendation['analysis']['rightsizingType']): string {
    const timelineMap = {
      'DOWNSIZE': '1-2 hours',
      'UPSIZE': '30 minutes',
      'CHANGE_FAMILY': '4-8 hours',
      'MODERNIZE': '2-4 hours',
      'TERMINATE': '15 minutes'
    };
    return timelineMap[rightsizingType] || '2-4 hours';
  }

  private getBenchmarkTests(resourceType: string): string[] {
    return [
      'CPU stress test',
      'Memory utilization test',
      'Network throughput test',
      'Application-specific performance test',
      'Load balancer health check'
    ];
  }

  private getMonitoringPeriod(riskLevel: RightsizingRecommendation['analysis']['riskLevel']): number {
    const periodMap = {
      'LOW': 3,
      'MEDIUM': 7,
      'HIGH': 14,
      'CRITICAL': 30
    };
    return periodMap[riskLevel];
  }

  private getRollbackCriteria(utilization: UtilizationMetrics): string[] {
    return [
      'CPU utilization > 90% for sustained period',
      'Memory utilization > 95%',
      'Response time increase > 50%',
      'Error rate increase > 5%',
      'Application crashes or instability'
    ];
  }

  private getSuccessMetrics(rightsizingType: RightsizingRecommendation['analysis']['rightsizingType']): string[] {
    const common = [
      'Stable application performance',
      'No increase in error rates',
      'Acceptable response times'
    ];

    if (rightsizingType === 'DOWNSIZE') {
      return [...common, 'Cost savings achieved', 'Resource utilization improved'];
    }

    return [...common, 'Performance requirements met'];
  }

  private isNewerGeneration(newType: string, currentType: string): boolean {
    const getGeneration = (type: string) => {
      const match = type.match(/\d+/);
      return match ? parseInt(match[0]) : 0;
    };

    return getGeneration(newType) > getGeneration(currentType);
  }

  /**
   * Generate mock utilization data for demonstration
   */
  static generateMockUtilizationData(resourceId: string, resourceType: string = 'instance'): UtilizationMetrics {
    // Generate realistic utilization patterns
    const timestamps: Date[] = [];
    const cpuValues: number[] = [];
    const memoryValues: number[] = [];

    const now = new Date();

    // Generate 30 days of hourly data
    for (let i = 720; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      timestamps.push(timestamp);

      // Simulate daily patterns with some randomness
      const hour = timestamp.getHours();
      let baseCpu = 0.15; // Base utilization
      let baseMemory = 0.25;

      // Business hours pattern (higher usage 9-17)
      if (hour >= 9 && hour <= 17) {
        baseCpu += 0.3;
        baseMemory += 0.2;
      }

      // Add some randomness and spikes
      const cpuNoise = (Math.random() - 0.5) * 0.2;
      const memoryNoise = (Math.random() - 0.5) * 0.15;

      // Occasional spikes
      const spike = Math.random() < 0.05 ? Math.random() * 0.4 : 0;

      const cpu = Math.max(0.01, Math.min(0.95, baseCpu + cpuNoise + spike));
      const memory = Math.max(0.05, Math.min(0.9, baseMemory + memoryNoise));

      cpuValues.push(cpu);
      memoryValues.push(memory);
    }

    // Calculate statistics
    const cpuAverage = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length;
    const memoryAverage = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;

    const cpuSorted = [...cpuValues].sort((a, b) => a - b);
    const memorySorted = [...memoryValues].sort((a, b) => a - b);

    const cpuP95 = cpuSorted[Math.floor(cpuValues.length * 0.95)];
    const cpuP99 = cpuSorted[Math.floor(cpuValues.length * 0.99)];
    const memoryP95 = memorySorted[Math.floor(memoryValues.length * 0.95)];
    const memoryP99 = memorySorted[Math.floor(memoryValues.length * 0.99)];

    const cpuMax = Math.max(...cpuValues);
    const memoryMax = Math.max(...memoryValues);

    // Calculate volatility (coefficient of variation)
    const cpuVariance = cpuValues.reduce((sum, val) => sum + Math.pow(val - cpuAverage, 2), 0) / cpuValues.length;
    const memoryVariance = memoryValues.reduce((sum, val) => sum + Math.pow(val - memoryAverage, 2), 0) / memoryValues.length;

    const cpuVolatility = Math.sqrt(cpuVariance) / cpuAverage;
    const memoryVolatility = Math.sqrt(memoryVariance) / memoryAverage;

    // Determine trends
    const firstHalfCpu = cpuValues.slice(0, cpuValues.length / 2);
    const secondHalfCpu = cpuValues.slice(cpuValues.length / 2);
    const firstHalfCpuAvg = firstHalfCpu.reduce((a, b) => a + b, 0) / firstHalfCpu.length;
    const secondHalfCpuAvg = secondHalfCpu.reduce((a, b) => a + b, 0) / secondHalfCpu.length;

    let cpuTrend: 'increasing' | 'decreasing' | 'stable';
    const cpuTrendDiff = (secondHalfCpuAvg - firstHalfCpuAvg) / firstHalfCpuAvg;

    if (cpuTrendDiff > 0.1) cpuTrend = 'increasing';
    else if (cpuTrendDiff < -0.1) cpuTrend = 'decreasing';
    else cpuTrend = 'stable';

    return {
      cpu: {
        average: cpuAverage,
        maximum: cpuMax,
        p95: cpuP95,
        p99: cpuP99,
        trend: cpuTrend,
        volatility: Math.min(1, cpuVolatility)
      },
      memory: {
        average: memoryAverage,
        maximum: memoryMax,
        p95: memoryP95,
        p99: memoryP99,
        trend: 'stable', // Simplified
        volatility: Math.min(1, memoryVolatility)
      },
      network: {
        inbound: Math.random() * 100 + 10,
        outbound: Math.random() * 50 + 5,
        packets: Math.random() * 10000 + 1000,
        trend: 'stable'
      },
      timeSeries: {
        timestamps,
        cpuValues,
        memoryValues
      },
      dataQuality: {
        completeness: 0.98,
        timeRange: 30,
        sampleCount: cpuValues.length,
        outlierCount: Math.floor(Math.random() * 5)
      }
    };
  }
}