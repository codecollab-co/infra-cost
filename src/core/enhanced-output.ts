/**
 * Enhanced Output Module
 * Sprint 6: UX Improvements
 *
 * Enhances the default cost output with:
 * - Cost delta/changes from previous period
 * - Quick win optimization recommendations
 * - Smart insights and alerts
 */

import { CostBreakdown, ResourceInventory } from '../types/providers';

// Delta Information
export interface CostDelta {
  service: string;
  currentCost: number;
  previousCost: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

// Quick Win Recommendation
export interface QuickWin {
  id: string;
  title: string;
  savings: number;
  effort: 'minimal' | 'low' | 'medium';
  risk: 'none' | 'low' | 'medium';
  category: string;
}

// Enhanced Output Options
export interface EnhancedOutputOptions {
  showDelta: boolean;
  showQuickWins: boolean;
  deltaThreshold: number;      // Percentage threshold for highlighting changes
  quickWinsCount: number;      // Number of quick wins to show
  colorOutput: boolean;
}

// Enhanced Cost Report
export interface EnhancedCostReport {
  // Original cost data
  costs: CostBreakdown;

  // Delta analysis
  deltas?: {
    total: CostDelta;
    byService: CostDelta[];
    topIncreases: CostDelta[];
    topDecreases: CostDelta[];
    significantChanges: number;
  };

  // Quick wins
  quickWins?: QuickWin[];

  // Insights
  insights?: string[];
}

const DEFAULT_OPTIONS: EnhancedOutputOptions = {
  showDelta: true,
  showQuickWins: true,
  deltaThreshold: 10,
  quickWinsCount: 3,
  colorOutput: true,
};

/**
 * Calculate cost deltas from cost breakdown
 */
export function calculateDeltas(costs: CostBreakdown, threshold: number = 10): EnhancedCostReport['deltas'] {
  const deltas: CostDelta[] = [];
  let totalCurrent = 0;
  let totalPrevious = 0;

  // Process service costs
  const thisMonth = costs.totalsByService?.thisMonth || {};
  const lastMonth = costs.totalsByService?.lastMonth || {};

  // Get all services
  const allServices = new Set([...Object.keys(thisMonth), ...Object.keys(lastMonth)]);

  for (const service of allServices) {
    const current = thisMonth[service] || 0;
    const previous = lastMonth[service] || 0;
    totalCurrent += current;
    totalPrevious += previous;

    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0);

    deltas.push({
      service,
      currentCost: current,
      previousCost: previous,
      change,
      changePercent,
      trend: changePercent > 2 ? 'up' : changePercent < -2 ? 'down' : 'stable',
    });
  }

  // Sort by absolute change
  deltas.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  // Calculate total delta
  const totalChange = totalCurrent - totalPrevious;
  const totalChangePercent = totalPrevious > 0 ? (totalChange / totalPrevious) * 100 : 0;

  const totalDelta: CostDelta = {
    service: 'TOTAL',
    currentCost: totalCurrent,
    previousCost: totalPrevious,
    change: totalChange,
    changePercent: totalChangePercent,
    trend: totalChangePercent > 2 ? 'up' : totalChangePercent < -2 ? 'down' : 'stable',
  };

  // Filter significant changes
  const significantChanges = deltas.filter(d => Math.abs(d.changePercent) >= threshold);

  return {
    total: totalDelta,
    byService: deltas,
    topIncreases: deltas.filter(d => d.change > 0).slice(0, 5),
    topDecreases: deltas.filter(d => d.change < 0).slice(0, 5),
    significantChanges: significantChanges.length,
  };
}

/**
 * Generate quick win recommendations from cost data
 */
export function generateQuickWins(
  costs: CostBreakdown,
  inventory?: ResourceInventory,
  count: number = 3
): QuickWin[] {
  const quickWins: QuickWin[] = [];
  const thisMonth = costs.totalsByService?.thisMonth || {};

  // Analyze services for quick wins
  for (const [service, cost] of Object.entries(thisMonth)) {
    if (cost < 10) continue; // Skip very small costs

    // EC2 - suggest Reserved Instances for high spend
    if (service.includes('EC2') && cost > 500) {
      quickWins.push({
        id: `ri-${service.toLowerCase().replace(/\s+/g, '-')}`,
        title: `Consider Reserved Instances for ${service}`,
        savings: cost * 0.3, // ~30% savings estimate
        effort: 'low',
        risk: 'low',
        category: 'Reserved Capacity',
      });
    }

    // S3 - suggest lifecycle policies for high storage costs
    if (service.includes('S3') && cost > 100) {
      quickWins.push({
        id: 's3-lifecycle',
        title: 'Implement S3 Lifecycle policies for infrequent data',
        savings: cost * 0.4, // ~40% savings estimate
        effort: 'minimal',
        risk: 'none',
        category: 'Storage',
      });
    }

    // RDS - suggest rightsizing
    if (service.includes('RDS') && cost > 200) {
      quickWins.push({
        id: 'rds-rightsize',
        title: 'Review RDS instance sizes for rightsizing',
        savings: cost * 0.25, // ~25% savings estimate
        effort: 'medium',
        risk: 'low',
        category: 'Database',
      });
    }

    // Lambda - suggest memory optimization
    if (service.includes('Lambda') && cost > 50) {
      quickWins.push({
        id: 'lambda-optimize',
        title: 'Optimize Lambda memory configuration',
        savings: cost * 0.2, // ~20% savings estimate
        effort: 'minimal',
        risk: 'none',
        category: 'Serverless',
      });
    }

    // NAT Gateway - suggest VPC endpoints
    if (service.includes('NAT') && cost > 100) {
      quickWins.push({
        id: 'vpc-endpoints',
        title: 'Use VPC Endpoints to reduce NAT Gateway costs',
        savings: cost * 0.5, // ~50% savings estimate
        effort: 'low',
        risk: 'none',
        category: 'Network',
      });
    }

    // EBS - suggest snapshot cleanup
    if (service.includes('EBS') && cost > 50) {
      quickWins.push({
        id: 'ebs-snapshots',
        title: 'Clean up unused EBS snapshots',
        savings: cost * 0.15, // ~15% savings estimate
        effort: 'minimal',
        risk: 'none',
        category: 'Storage',
      });
    }

    // CloudWatch - suggest log retention
    if (service.includes('CloudWatch') && cost > 50) {
      quickWins.push({
        id: 'cloudwatch-retention',
        title: 'Set CloudWatch Logs retention policies',
        savings: cost * 0.3, // ~30% savings estimate
        effort: 'minimal',
        risk: 'none',
        category: 'Monitoring',
      });
    }
  }

  // Sort by savings and return top N
  quickWins.sort((a, b) => b.savings - a.savings);
  return quickWins.slice(0, count);
}

/**
 * Generate insights from cost data
 */
export function generateInsights(costs: CostBreakdown, deltas?: EnhancedCostReport['deltas']): string[] {
  const insights: string[] = [];
  const thisMonth = costs.totals?.thisMonth || 0;
  const lastMonth = costs.totals?.lastMonth || 0;

  // Overall trend insight
  if (deltas?.total) {
    if (deltas.total.changePercent > 20) {
      insights.push(`⚠️ Costs increased significantly (+${deltas.total.changePercent.toFixed(1)}%) compared to last month`);
    } else if (deltas.total.changePercent < -10) {
      insights.push(`✅ Great job! Costs decreased by ${Math.abs(deltas.total.changePercent).toFixed(1)}% compared to last month`);
    }
  }

  // Top service insight
  const topServices = Object.entries(costs.totalsByService?.thisMonth || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (topServices.length > 0) {
    const topServicePercent = thisMonth > 0 ? (topServices[0][1] / thisMonth) * 100 : 0;
    if (topServicePercent > 50) {
      insights.push(`📊 ${topServices[0][0]} accounts for ${topServicePercent.toFixed(0)}% of your costs`);
    }
  }

  // Significant changes insight
  if (deltas?.significantChanges && deltas.significantChanges > 3) {
    insights.push(`🔍 ${deltas.significantChanges} services have significant cost changes this month`);
  }

  // Forecast insight
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dayOfMonth = new Date().getDate();
  const forecastedCost = (thisMonth / dayOfMonth) * daysInMonth;

  if (forecastedCost > lastMonth * 1.2 && lastMonth > 0) {
    insights.push(`🔮 Projected month-end cost: $${forecastedCost.toFixed(2)} (${((forecastedCost / lastMonth - 1) * 100).toFixed(0)}% higher than last month)`);
  } else if (forecastedCost > 0 && lastMonth === 0) {
    insights.push(`🔮 Projected month-end cost: $${forecastedCost.toFixed(2)} (new spending this month)`);
  }

  return insights;
}

/**
 * Format delta for display
 */
export function formatDelta(delta: CostDelta, useColor: boolean = true): string {
  const sign = delta.change >= 0 ? '+' : '';
  const trendIcon = delta.trend === 'up' ? '↑' : delta.trend === 'down' ? '↓' : '→';

  let changeStr = `${sign}$${delta.change.toFixed(2)} (${sign}${delta.changePercent.toFixed(1)}%)`;

  if (useColor) {
    if (delta.trend === 'up') {
      changeStr = `\x1b[31m${trendIcon} ${changeStr}\x1b[0m`; // Red
    } else if (delta.trend === 'down') {
      changeStr = `\x1b[32m${trendIcon} ${changeStr}\x1b[0m`; // Green
    } else {
      changeStr = `${trendIcon} ${changeStr}`;
    }
  } else {
    changeStr = `${trendIcon} ${changeStr}`;
  }

  return changeStr;
}

/**
 * Format quick win for display
 */
export function formatQuickWin(quickWin: QuickWin, index: number): string {
  const effortEmoji = quickWin.effort === 'minimal' ? '⚡' : quickWin.effort === 'low' ? '🔧' : '🛠️';
  const riskEmoji = quickWin.risk === 'none' ? '✅' : quickWin.risk === 'low' ? '🟡' : '🟠';

  return `  ${index + 1}. ${effortEmoji} ${quickWin.title}
     💰 Est. savings: $${quickWin.savings.toFixed(2)}/month | Risk: ${riskEmoji} ${quickWin.risk}`;
}

/**
 * Format enhanced output section for deltas
 */
export function formatDeltaSection(deltas: EnhancedCostReport['deltas'], options: EnhancedOutputOptions): string {
  if (!deltas) return '';

  const lines: string[] = [];

  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('📊 COST CHANGES (vs Last Month)');
  lines.push('─'.repeat(60));

  // Total change
  lines.push(`Total: $${deltas.total.currentCost.toFixed(2)} ${formatDelta(deltas.total, options.colorOutput)}`);
  lines.push('');

  // Top increases
  if (deltas.topIncreases.length > 0) {
    lines.push('Top Increases:');
    for (const delta of deltas.topIncreases.slice(0, 3)) {
      lines.push(`  • ${delta.service}: ${formatDelta(delta, options.colorOutput)}`);
    }
  }

  // Top decreases
  if (deltas.topDecreases.length > 0) {
    lines.push('');
    lines.push('Top Decreases:');
    for (const delta of deltas.topDecreases.slice(0, 3)) {
      lines.push(`  • ${delta.service}: ${formatDelta(delta, options.colorOutput)}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format enhanced output section for quick wins
 */
export function formatQuickWinsSection(quickWins: QuickWin[], options: EnhancedOutputOptions): string {
  if (!quickWins || quickWins.length === 0) return '';

  const lines: string[] = [];
  const totalSavings = quickWins.reduce((sum, qw) => sum + qw.savings, 0);

  lines.push('');
  lines.push('─'.repeat(60));
  lines.push(`⚡ QUICK WINS (Est. $${totalSavings.toFixed(2)}/month savings)`);
  lines.push('─'.repeat(60));

  for (let i = 0; i < quickWins.length; i++) {
    lines.push(formatQuickWin(quickWins[i], i));
  }

  lines.push('');
  lines.push('💡 Run --recommendations for detailed optimization analysis');

  return lines.join('\n');
}

/**
 * Format insights section
 */
export function formatInsightsSection(insights: string[]): string {
  if (!insights || insights.length === 0) return '';

  const lines: string[] = [];

  lines.push('');
  lines.push('─'.repeat(60));
  lines.push('💡 INSIGHTS');
  lines.push('─'.repeat(60));

  for (const insight of insights) {
    lines.push(`  ${insight}`);
  }

  return lines.join('\n');
}

/**
 * Generate complete enhanced output
 */
export function generateEnhancedOutput(
  costs: CostBreakdown,
  inventory?: ResourceInventory,
  options: Partial<EnhancedOutputOptions> = {}
): EnhancedCostReport {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const report: EnhancedCostReport = {
    costs,
  };

  // Calculate deltas if enabled
  if (opts.showDelta) {
    report.deltas = calculateDeltas(costs, opts.deltaThreshold);
  }

  // Generate quick wins if enabled
  if (opts.showQuickWins) {
    report.quickWins = generateQuickWins(costs, inventory, opts.quickWinsCount);
  }

  // Generate insights
  report.insights = generateInsights(costs, report.deltas);

  return report;
}

/**
 * Format the enhanced sections for appending to main output
 */
export function formatEnhancedSections(
  report: EnhancedCostReport,
  options: Partial<EnhancedOutputOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const sections: string[] = [];

  // Add insights
  if (report.insights && report.insights.length > 0) {
    sections.push(formatInsightsSection(report.insights));
  }

  // Add delta section
  if (opts.showDelta && report.deltas) {
    sections.push(formatDeltaSection(report.deltas, opts));
  }

  // Add quick wins section
  if (opts.showQuickWins && report.quickWins && report.quickWins.length > 0) {
    sections.push(formatQuickWinsSection(report.quickWins, opts));
  }

  return sections.join('\n');
}
