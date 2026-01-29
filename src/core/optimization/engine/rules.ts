/**
 * Optimization Rules
 * Extracted from cost-optimization-engine.ts
 */

import { OptimizationCategory, RiskLevel, EffortLevel } from './types';

export interface OptimizationRule {
  id: string;
  name: string;
  category: OptimizationCategory;
  condition: (resource: any) => boolean;
  recommendation: (resource: any) => string;
  savingsEstimate: (resource: any) => number;
  riskLevel: RiskLevel;
  effortLevel: EffortLevel;
}

export const optimizationRules: OptimizationRule[] = [
  // Compute rules
  {
    id: 'ec2-reserved-instances',
    name: 'Use Reserved Instances for predictable workloads',
    category: OptimizationCategory.COMPUTE,
    condition: (resource) => resource.type === 'ec2' && resource.utilizationPercent > 70,
    recommendation: (resource) => `Convert ${resource.name} to Reserved Instance`,
    savingsEstimate: (resource) => resource.monthlyCost * 0.3,
    riskLevel: RiskLevel.LOW,
    effortLevel: EffortLevel.LOW,
  },
  {
    id: 'ec2-rightsizing',
    name: 'Rightsize underutilized EC2 instances',
    category: OptimizationCategory.COMPUTE,
    condition: (resource) => resource.type === 'ec2' && resource.cpuUtilization < 30,
    recommendation: (resource) => `Downsize ${resource.name} to smaller instance type`,
    savingsEstimate: (resource) => resource.monthlyCost * 0.25,
    riskLevel: RiskLevel.MEDIUM,
    effortLevel: EffortLevel.MEDIUM,
  },

  // Storage rules
  {
    id: 's3-lifecycle-policy',
    name: 'Implement S3 lifecycle policies',
    category: OptimizationCategory.STORAGE,
    condition: (resource) => resource.type === 's3' && resource.sizeGB > 100,
    recommendation: (resource) => `Add lifecycle policy to ${resource.name} for infrequent access`,
    savingsEstimate: (resource) => resource.monthlyCost * 0.4,
    riskLevel: RiskLevel.NONE,
    effortLevel: EffortLevel.MINIMAL,
  },

  // Add more rules...
];
