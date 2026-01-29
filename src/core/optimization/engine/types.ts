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
