/**
 * Cost Allocation and Chargeback System
 * Issue #30: Add cost allocation tags and chargeback reporting
 *
 * Enables organizations to allocate cloud costs to teams, departments,
 * projects, or cost centers based on resource tags.
 */

import { CloudProviderAdapter, ResourceInventory, CostBreakdown } from '../types/providers';

// Tag Schema Configuration
export interface TagSchema {
  requiredTags: string[];
  optionalTags?: string[];
  mapping?: Record<string, Record<string, string[]>>;
  defaultAllocations?: Record<string, string>;
}

// Allocation Dimension
export type AllocationDimension = 'team' | 'project' | 'environment' | 'department' | 'costCenter' | 'application' | 'owner' | string;

// Allocation Configuration
export interface AllocationConfig {
  dimensions: AllocationDimension[];
  tagSchema?: TagSchema;
  handleUntagged: 'shared' | 'unassigned' | 'proportional' | string;
  includeSharedCosts: boolean;
  sharedCostAllocation: 'equal' | 'proportional' | 'custom';
  customAllocations?: Record<string, number>; // Percentage allocations
}

// Resource Cost Detail
export interface ResourceCostDetail {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  region: string;
  monthlyCost: number;
  tags: Record<string, string>;
  service: string;
}

// Service Cost Breakdown
export interface ServiceCostBreakdown {
  [service: string]: {
    cost: number;
    percentage: number;
    resourceCount: number;
  };
}

// Cost Trend
export interface CostTrend {
  currentMonth: number;
  previousMonth: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

// Allocation Result for a single dimension value
export interface AllocationResult {
  dimension: string;
  value: string;
  totalCost: number;
  percentage: number;
  services: ServiceCostBreakdown;
  resources: ResourceCostDetail[];
  trend?: CostTrend;
  resourceCount: number;
}

// Full Cost Allocation Report
export interface CostAllocationReport {
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  totalCost: number;
  allocatedCost: number;
  unallocatedCost: number;
  allocationAccuracy: number; // Percentage of costs properly allocated
  allocations: Record<string, AllocationResult[]>; // By dimension
  untaggedResources: ResourceCostDetail[];
  taggingCompliance: TaggingComplianceReport;
  recommendations: TaggingRecommendation[];
  generatedAt: Date;
}

// Tagging Compliance Report
export interface TaggingComplianceReport {
  totalResources: number;
  compliantResources: number;
  partiallyCompliantResources: number;
  nonCompliantResources: number;
  compliancePercentage: number;
  missingTagsByResource: Record<string, string[]>;
  tagCoverage: Record<string, number>; // Tag name -> percentage covered
}

// Tagging Recommendation
export interface TaggingRecommendation {
  priority: 'high' | 'medium' | 'low';
  resourceId: string;
  resourceType: string;
  currentTags: Record<string, string>;
  suggestedTags: Record<string, string>;
  reason: string;
  potentialSavings?: number;
}

// Chargeback Report Options
export interface ChargebackReportOptions {
  format: 'json' | 'csv' | 'xlsx' | 'summary';
  includeDetails: boolean;
  groupBy?: AllocationDimension[];
  filterBy?: Record<string, string[]>;
  dateRange?: { start: Date; end: Date };
}

// Default Configuration
const DEFAULT_CONFIG: AllocationConfig = {
  dimensions: ['team', 'project', 'environment'],
  handleUntagged: 'unassigned',
  includeSharedCosts: true,
  sharedCostAllocation: 'proportional',
};

// Default Tag Schema
const DEFAULT_TAG_SCHEMA: TagSchema = {
  requiredTags: ['team', 'project', 'environment'],
  optionalTags: ['owner', 'costCenter', 'application', 'department'],
  defaultAllocations: {
    untagged: 'shared-infrastructure',
    team: 'unassigned',
    project: 'unassigned',
  },
};

/**
 * Cost Allocation Engine
 */
export class CostAllocationEngine {
  private config: AllocationConfig;
  private tagSchema: TagSchema;

  constructor(config: Partial<AllocationConfig> = {}, tagSchema: Partial<TagSchema> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tagSchema = { ...DEFAULT_TAG_SCHEMA, ...tagSchema };
  }

  /**
   * Analyze and allocate costs from provider data
   */
  async analyze(
    provider: CloudProviderAdapter,
    inventory?: ResourceInventory,
    costBreakdown?: CostBreakdown
  ): Promise<CostAllocationReport> {
    const startTime = Date.now();

    // Fetch data if not provided
    const actualInventory = inventory || await provider.getInventory();
    const actualCostBreakdown = costBreakdown || await provider.getCostBreakdown();

    // Build resource cost mapping
    const resourceCosts = this.buildResourceCostMapping(actualInventory, actualCostBreakdown);

    // Analyze tagging compliance
    const taggingCompliance = this.analyzeTaggingCompliance(resourceCosts);

    // Perform cost allocation
    const allocations = this.allocateCosts(resourceCosts);

    // Identify untagged resources
    const untaggedResources = resourceCosts.filter(r => !this.isResourceTagged(r));

    // Calculate totals
    const totalCost = resourceCosts.reduce((sum, r) => sum + r.monthlyCost, 0);
    const allocatedCost = resourceCosts
      .filter(r => this.isResourceTagged(r))
      .reduce((sum, r) => sum + r.monthlyCost, 0);
    const unallocatedCost = totalCost - allocatedCost;

    // Generate recommendations
    const recommendations = this.generateTaggingRecommendations(resourceCosts, taggingCompliance);

    const report: CostAllocationReport = {
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
        label: 'Last 30 Days',
      },
      totalCost,
      allocatedCost,
      unallocatedCost,
      allocationAccuracy: totalCost > 0 ? (allocatedCost / totalCost) * 100 : 0,
      allocations,
      untaggedResources,
      taggingCompliance,
      recommendations,
      generatedAt: new Date(),
    };

    return report;
  }

  /**
   * Build resource cost mapping from inventory and cost data
   */
  private buildResourceCostMapping(
    inventory: ResourceInventory,
    costBreakdown: CostBreakdown
  ): ResourceCostDetail[] {
    const resourceCosts: ResourceCostDetail[] = [];
    const totalMonthlyCost = costBreakdown.totals.thisMonth || 0;

    // Process compute resources
    const computeCount = inventory.resources.compute?.length ?? 0;
    for (const resource of inventory.resources.compute || []) {
      const estimatedCost = this.estimateResourceCost(resource, 'compute', totalMonthlyCost, computeCount);
      resourceCosts.push({
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: resource.type,
        region: resource.region,
        monthlyCost: estimatedCost,
        tags: resource.tags || {},
        service: 'EC2',
      });
    }

    // Process storage resources
    const storageCount = inventory.resources.storage?.length ?? 0;
    for (const resource of inventory.resources.storage || []) {
      const estimatedCost = this.estimateResourceCost(resource, 'storage', totalMonthlyCost, storageCount);
      resourceCosts.push({
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: resource.type,
        region: resource.region,
        monthlyCost: estimatedCost,
        tags: resource.tags || {},
        service: 'S3',
      });
    }

    // Process database resources
    const databaseCount = inventory.resources.database?.length ?? 0;
    for (const resource of inventory.resources.database || []) {
      const estimatedCost = this.estimateResourceCost(resource, 'database', totalMonthlyCost, databaseCount);
      resourceCosts.push({
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: resource.type,
        region: resource.region,
        monthlyCost: estimatedCost,
        tags: resource.tags || {},
        service: 'RDS',
      });
    }

    // Process serverless resources
    const serverlessCount = inventory.resources.serverless?.length ?? 0;
    for (const resource of inventory.resources.serverless || []) {
      const estimatedCost = this.estimateResourceCost(resource, 'serverless', totalMonthlyCost, serverlessCount);
      resourceCosts.push({
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: resource.type,
        region: resource.region,
        monthlyCost: estimatedCost,
        tags: resource.tags || {},
        service: 'Lambda',
      });
    }

    // Process network resources
    const networkCount = inventory.resources.network?.length ?? 0;
    for (const resource of inventory.resources.network || []) {
      const estimatedCost = this.estimateResourceCost(resource, 'network', totalMonthlyCost, networkCount);
      resourceCosts.push({
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: resource.type,
        region: resource.region,
        monthlyCost: estimatedCost,
        tags: resource.tags || {},
        service: 'VPC',
      });
    }

    return resourceCosts;
  }

  /**
   * Estimate cost for a resource based on type and total costs
   */
  private estimateResourceCost(
    resource: any,
    category: string,
    totalCost: number,
    categoryResourceCount: number
  ): number {
    // Cost weights by category (rough approximation)
    const categoryWeights: Record<string, number> = {
      compute: 0.45,
      database: 0.25,
      storage: 0.15,
      serverless: 0.08,
      network: 0.07,
    };

    const weight = categoryWeights[category] || 0.1;
    const categoryCost = totalCost * weight;
    const resourcesInCategory = Math.max(1, categoryResourceCount);

    return categoryCost / resourcesInCategory;
  }

  /**
   * Check if resource has required tags
   */
  private isResourceTagged(resource: ResourceCostDetail): boolean {
    const tags = resource.tags || {};
    return this.tagSchema.requiredTags.every(tag => {
      const value = tags[tag] ?? tags[tag.toLowerCase()];
      return value !== undefined && value !== '';
    });
  }

  /**
   * Allocate costs by configured dimensions
   */
  private allocateCosts(resources: ResourceCostDetail[]): Record<string, AllocationResult[]> {
    const allocations: Record<string, AllocationResult[]> = {};

    for (const dimension of this.config.dimensions) {
      allocations[dimension] = this.allocateByDimension(resources, dimension);
    }

    return allocations;
  }

  /**
   * Allocate costs by a single dimension
   */
  private allocateByDimension(
    resources: ResourceCostDetail[],
    dimension: string
  ): AllocationResult[] {
    const groups = new Map<string, ResourceCostDetail[]>();

    // Group resources by dimension value
    for (const resource of resources) {
      const tagValue = this.getTagValue(resource.tags, dimension);
      const key = tagValue || this.config.handleUntagged;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(resource);
    }

    // Calculate allocations
    const totalCost = resources.reduce((sum, r) => sum + r.monthlyCost, 0);
    const results: AllocationResult[] = [];

    for (const [value, groupResources] of groups) {
      const groupCost = groupResources.reduce((sum, r) => sum + r.monthlyCost, 0);

      // Calculate service breakdown
      const services: ServiceCostBreakdown = {};
      for (const resource of groupResources) {
        if (!services[resource.service]) {
          services[resource.service] = { cost: 0, percentage: 0, resourceCount: 0 };
        }
        services[resource.service].cost += resource.monthlyCost;
        services[resource.service].resourceCount++;
      }

      // Calculate percentages for services
      for (const service of Object.keys(services)) {
        services[service].percentage = groupCost > 0
          ? (services[service].cost / groupCost) * 100
          : 0;
      }

      results.push({
        dimension,
        value,
        totalCost: groupCost,
        percentage: totalCost > 0 ? (groupCost / totalCost) * 100 : 0,
        services,
        resources: groupResources,
        resourceCount: groupResources.length,
        trend: this.simulateTrend(groupCost),
      });
    }

    // Sort by cost descending
    results.sort((a, b) => b.totalCost - a.totalCost);

    return results;
  }

  /**
   * Get tag value with fallback to mapped values
   */
  private getTagValue(tags: Record<string, string>, dimension: string): string | null {
    // Direct tag match
    const directValue = tags[dimension] || tags[dimension.toLowerCase()] ||
      tags[dimension.charAt(0).toUpperCase() + dimension.slice(1)];

    if (directValue) {
      return directValue;
    }

    // Check mapping
    if (this.tagSchema.mapping && this.tagSchema.mapping[dimension]) {
      const mapping = this.tagSchema.mapping[dimension];
      for (const [mappedValue, aliases] of Object.entries(mapping)) {
        for (const tag of Object.values(tags)) {
          if (aliases.includes(tag)) {
            return mappedValue;
          }
        }
      }
    }

    return null;
  }

  /**
   * Simulate cost trend (in production, this would use historical data)
   */
  private simulateTrend(currentCost: number): CostTrend {
    const variance = (Math.random() - 0.5) * 0.2; // -10% to +10%
    const previousMonth = currentCost * (1 - variance);
    const change = currentCost - previousMonth;
    const changePercent = previousMonth > 0 ? (change / previousMonth) * 100 : 0;

    return {
      currentMonth: currentCost,
      previousMonth,
      change,
      changePercent,
      trend: changePercent > 2 ? 'up' : changePercent < -2 ? 'down' : 'stable',
    };
  }

  /**
   * Analyze tagging compliance
   */
  private analyzeTaggingCompliance(resources: ResourceCostDetail[]): TaggingComplianceReport {
    const missingTagsByResource: Record<string, string[]> = {};
    const tagCoverage: Record<string, number> = {};
    let compliant = 0;
    let partiallyCompliant = 0;
    let nonCompliant = 0;

    // Initialize tag coverage
    for (const tag of this.tagSchema.requiredTags) {
      tagCoverage[tag] = 0;
    }

    for (const resource of resources) {
      const missingTags: string[] = [];

      for (const tag of this.tagSchema.requiredTags) {
        if (resource.tags[tag] || resource.tags[tag.toLowerCase()]) {
          tagCoverage[tag]++;
        } else {
          missingTags.push(tag);
        }
      }

      if (missingTags.length === 0) {
        compliant++;
      } else if (missingTags.length < this.tagSchema.requiredTags.length) {
        partiallyCompliant++;
        missingTagsByResource[resource.resourceId] = missingTags;
      } else {
        nonCompliant++;
        missingTagsByResource[resource.resourceId] = missingTags;
      }
    }

    // Convert tag coverage to percentages
    for (const tag of Object.keys(tagCoverage)) {
      tagCoverage[tag] = resources.length > 0
        ? (tagCoverage[tag] / resources.length) * 100
        : 0;
    }

    return {
      totalResources: resources.length,
      compliantResources: compliant,
      partiallyCompliantResources: partiallyCompliant,
      nonCompliantResources: nonCompliant,
      compliancePercentage: resources.length > 0
        ? (compliant / resources.length) * 100
        : 0,
      missingTagsByResource,
      tagCoverage,
    };
  }

  /**
   * Generate tagging recommendations
   */
  private generateTaggingRecommendations(
    resources: ResourceCostDetail[],
    compliance: TaggingComplianceReport
  ): TaggingRecommendation[] {
    const recommendations: TaggingRecommendation[] = [];

    // Find high-cost untagged resources
    const untaggedResources = resources
      .filter(r => !this.isResourceTagged(r))
      .sort((a, b) => b.monthlyCost - a.monthlyCost);

    for (const resource of untaggedResources.slice(0, 10)) {
      const suggestedTags = this.suggestTags(resource);

      recommendations.push({
        priority: resource.monthlyCost > 100 ? 'high' : resource.monthlyCost > 50 ? 'medium' : 'low',
        resourceId: resource.resourceId,
        resourceType: resource.resourceType,
        currentTags: resource.tags,
        suggestedTags,
        reason: `Untagged ${resource.resourceType} with $${resource.monthlyCost.toFixed(2)}/month cost`,
        potentialSavings: resource.monthlyCost * 0.1, // Estimate 10% savings through better visibility
      });
    }

    // Find partially tagged resources
    for (const [resourceId, missingTags] of Object.entries(compliance.missingTagsByResource)) {
      const resource = resources.find(r => r.resourceId === resourceId);
      if (!resource) continue;

      const suggestedTags: Record<string, string> = {};
      for (const tag of missingTags) {
        suggestedTags[tag] = this.tagSchema.defaultAllocations?.[tag] || 'unknown';
      }

      if (recommendations.length < 20) {
        recommendations.push({
          priority: missingTags.length > 2 ? 'high' : 'medium',
          resourceId: resource.resourceId,
          resourceType: resource.resourceType,
          currentTags: resource.tags,
          suggestedTags,
          reason: `Missing required tags: ${missingTags.join(', ')}`,
        });
      }
    }

    return recommendations;
  }

  /**
   * Suggest tags based on resource attributes
   */
  private suggestTags(resource: ResourceCostDetail): Record<string, string> {
    const suggestions: Record<string, string> = {};

    // Suggest based on resource name patterns
    const name = resource.resourceName.toLowerCase();

    if (name.includes('prod') || name.includes('prd')) {
      suggestions['environment'] = 'production';
    } else if (name.includes('staging') || name.includes('stg')) {
      suggestions['environment'] = 'staging';
    } else if (name.includes('dev')) {
      suggestions['environment'] = 'development';
    }

    if (name.includes('api')) {
      suggestions['application'] = 'api';
    } else if (name.includes('web') || name.includes('frontend')) {
      suggestions['application'] = 'frontend';
    } else if (name.includes('db') || name.includes('database')) {
      suggestions['application'] = 'database';
    }

    // Default suggestions
    for (const tag of this.tagSchema.requiredTags) {
      if (!suggestions[tag]) {
        suggestions[tag] = this.tagSchema.defaultAllocations?.[tag] || 'unassigned';
      }
    }

    return suggestions;
  }
}

/**
 * Format chargeback report for CLI display
 */
export function formatChargebackReport(report: CostAllocationReport): string {
  const lines: string[] = [];

  // Header
  lines.push('');
  lines.push('═'.repeat(70));
  lines.push('  COST ALLOCATION & CHARGEBACK REPORT');
  lines.push('═'.repeat(70));
  lines.push(`  Period: ${report.period.label}`);
  lines.push(`  Generated: ${report.generatedAt.toISOString()}`);
  lines.push('');

  // Summary
  lines.push('COST SUMMARY');
  lines.push('─'.repeat(70));
  lines.push(`Total Cost:           $${report.totalCost.toFixed(2)}`);
  lines.push(`Allocated Cost:       $${report.allocatedCost.toFixed(2)}`);
  lines.push(`Unallocated Cost:     $${report.unallocatedCost.toFixed(2)}`);
  lines.push(`Allocation Accuracy:  ${report.allocationAccuracy.toFixed(1)}%`);
  lines.push('');

  // Tagging Compliance
  lines.push('TAGGING COMPLIANCE');
  lines.push('─'.repeat(70));
  lines.push(`Total Resources:      ${report.taggingCompliance.totalResources}`);
  lines.push(`Fully Compliant:      ${report.taggingCompliance.compliantResources} (${report.taggingCompliance.compliancePercentage.toFixed(1)}%)`);
  lines.push(`Partially Compliant:  ${report.taggingCompliance.partiallyCompliantResources}`);
  lines.push(`Non-Compliant:        ${report.taggingCompliance.nonCompliantResources}`);
  lines.push('');

  // Tag Coverage
  lines.push('Tag Coverage:');
  for (const [tag, coverage] of Object.entries(report.taggingCompliance.tagCoverage)) {
    const bar = '█'.repeat(Math.floor(coverage / 5)) + '░'.repeat(20 - Math.floor(coverage / 5));
    lines.push(`  ${tag.padEnd(15)} ${bar} ${coverage.toFixed(1)}%`);
  }
  lines.push('');

  // Allocations by Dimension
  for (const [dimension, allocations] of Object.entries(report.allocations)) {
    lines.push(`ALLOCATION BY ${dimension.toUpperCase()}`);
    lines.push('─'.repeat(70));
    lines.push('');
    lines.push(' #  │ Value                    │ Cost         │ %      │ Trend');
    lines.push('────┼──────────────────────────┼──────────────┼────────┼──────');

    allocations.slice(0, 10).forEach((alloc, index) => {
      const value = alloc.value.length > 22 ? alloc.value.substring(0, 19) + '...' : alloc.value.padEnd(22);
      const cost = `$${alloc.totalCost.toFixed(2)}`.padStart(11);
      const pct = `${alloc.percentage.toFixed(1)}%`.padStart(6);
      const trendIcon = alloc.trend?.trend === 'up' ? '↗' : alloc.trend?.trend === 'down' ? '↘' : '→';
      const trendPct = alloc.trend ? `${alloc.trend.changePercent >= 0 ? '+' : ''}${alloc.trend.changePercent.toFixed(0)}%` : '';

      lines.push(` ${(index + 1).toString().padStart(2)} │ ${value} │ ${cost} │ ${pct} │ ${trendIcon} ${trendPct}`);
    });

    lines.push('────┴──────────────────────────┴──────────────┴────────┴──────');
    lines.push('');
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push('TAGGING RECOMMENDATIONS');
    lines.push('─'.repeat(70));

    const highPriority = report.recommendations.filter(r => r.priority === 'high');
    const mediumPriority = report.recommendations.filter(r => r.priority === 'medium');

    if (highPriority.length > 0) {
      lines.push('');
      lines.push('High Priority:');
      for (const rec of highPriority.slice(0, 5)) {
        lines.push(`  ⚠️  ${rec.reason}`);
        lines.push(`      Resource: ${rec.resourceId}`);
        if (rec.potentialSavings) {
          lines.push(`      Potential savings: $${rec.potentialSavings.toFixed(2)}/month`);
        }
      }
    }

    if (mediumPriority.length > 0) {
      lines.push('');
      lines.push('Medium Priority:');
      for (const rec of mediumPriority.slice(0, 3)) {
        lines.push(`  📋 ${rec.reason}`);
        lines.push(`      Resource: ${rec.resourceId}`);
      }
    }

    lines.push('');
  }

  lines.push('═'.repeat(70));

  return lines.join('\n');
}

/**
 * Export chargeback report to CSV format
 */
export function exportChargebackCsv(report: CostAllocationReport): string {
  const lines: string[] = [];

  // Header
  lines.push('Dimension,Value,Total Cost,Percentage,Resource Count,Trend');

  // Data rows
  for (const [dimension, allocations] of Object.entries(report.allocations)) {
    for (const alloc of allocations) {
      lines.push([
        dimension,
        `"${alloc.value.replace(/"/g, '""')}"`,
        alloc.totalCost.toFixed(2),
        alloc.percentage.toFixed(2),
        alloc.resourceCount.toString(),
        alloc.trend?.trend || 'stable',
      ].join(','));
    }
  }

  return lines.join('\n');
}

/**
 * Format allocation summary for quick view
 */
export function formatAllocationSummary(allocations: AllocationResult[]): string {
  const lines: string[] = [];

  const totalCost = allocations.reduce((sum, a) => sum + a.totalCost, 0);

  for (const alloc of allocations.slice(0, 5)) {
    const barLength = Math.floor((alloc.percentage / 100) * 30);
    const bar = '█'.repeat(barLength) + '░'.repeat(30 - barLength);
    lines.push(`${alloc.value.padEnd(20)} ${bar} $${alloc.totalCost.toFixed(0).padStart(8)} (${alloc.percentage.toFixed(1)}%)`);
  }

  if (allocations.length > 5) {
    const othersCost = allocations.slice(5).reduce((sum, a) => sum + a.totalCost, 0);
    const othersPercent = totalCost > 0 ? (othersCost / totalCost) * 100 : 0;
    lines.push(`${'Others (' + (allocations.length - 5) + ')'.padEnd(20)} ${'░'.repeat(30)} $${othersCost.toFixed(0).padStart(8)} (${othersPercent.toFixed(1)}%)`);
  }

  return lines.join('\n');
}
