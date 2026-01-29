/**
 * Optimization Engine Types
 */

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

export enum RiskLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum EffortLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ConfidenceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export interface OptimizationRecommendation {
  id: string;
  category: OptimizationCategory;
  title: string;
  description: string;
  estimatedMonthlySavings: number;
  estimatedAnnualSavings: number;
  implementationCost?: number;
  riskLevel: RiskLevel;
  effortLevel: EffortLevel;
  confidenceLevel: ConfidenceLevel;
  affectedResources: string[];
  steps: string[];
  priority: number;
  tags?: string[];
}

export interface OptimizationEngineConfig {
  enabledCategories: OptimizationCategory[];
  maxRiskLevel: RiskLevel;
  minSavings: number;
  includeArchitecturalRecommendations: boolean;
}
