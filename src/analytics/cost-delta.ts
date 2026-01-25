import { TotalCosts, RawCostByService } from '../cost';
import { RawCostData } from '../types/providers';

/**
 * Cost Delta Analysis
 * Computes and displays differences between cost periods
 * Issue #7: Add columns to display the difference (delta) for Yesterday's costs
 */

export interface CostDelta {
  absolute: number;      // $ change
  percentage: number;    // % change
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface ServiceCostDelta {
  serviceName: string;
  currentCost: number;
  previousCost: number;
  delta: CostDelta;
}

export interface CostDeltaAnalysis {
  // Overall totals delta
  totals: {
    yesterday: {
      current: number;
      previous: number;
      delta: CostDelta;
    };
    last7Days: {
      current: number;
      previous: number;
      delta: CostDelta;
    };
    thisMonth: {
      current: number;
      previous: number;
      delta: CostDelta;
    };
  };

  // Per-service deltas for yesterday
  serviceDeltas: ServiceCostDelta[];

  // Top changes
  topIncreases: ServiceCostDelta[];
  topDecreases: ServiceCostDelta[];

  // Analysis insights
  insights: {
    volatilityScore: number;      // 0-100 score indicating cost stability
    anomalyDetected: boolean;
    significantChanges: string[];
  };
}

export interface CostDeltaOptions {
  // Number of top services to highlight
  topN?: number;
  // Threshold for significant change (percentage)
  significantChangeThreshold?: number;
  // Include services with zero cost
  includeZeroCost?: boolean;
}

const DEFAULT_OPTIONS: CostDeltaOptions = {
  topN: 5,
  significantChangeThreshold: 10, // 10% change is significant
  includeZeroCost: false,
};

/**
 * Calculate delta between two cost values
 */
export function calculateDelta(current: number, previous: number): CostDelta {
  const absolute = current - previous;

  // Handle zero previous cost
  let percentage: number;
  if (previous === 0) {
    percentage = current > 0 ? 100 : 0;
  } else {
    percentage = ((current - previous) / previous) * 100;
  }

  let trend: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(percentage) < 1) {
    trend = 'stable';
  } else if (absolute > 0) {
    trend = 'increasing';
  } else {
    trend = 'decreasing';
  }

  return {
    absolute,
    percentage,
    trend,
  };
}

/**
 * Calculate cost delta analysis from raw cost data
 */
export function analyzeCostDelta(
  rawCostData: RawCostByService | RawCostData,
  options: CostDeltaOptions = {}
): CostDeltaAnalysis {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Use UTC dates for consistent timezone-independent comparisons with AWS cost data
  const now = new Date();
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const dayBeforeYesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 2));

  // Calculate date ranges
  const yesterdayStr = formatDate(yesterday);
  const dayBeforeYesterdayStr = formatDate(dayBeforeYesterday);

  // Calculate 7-day periods (using UTC)
  const last7DaysStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));
  const previous7DaysStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 14));
  const previous7DaysEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7));

  // Calculate monthly periods (using UTC)
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));

  // Aggregate costs by period
  let yesterdayCost = 0;
  let dayBeforeYesterdayCost = 0;
  let last7DaysCost = 0;
  let previous7DaysCost = 0;
  let thisMonthCost = 0;
  let lastMonthCost = 0;

  const serviceYesterdayCosts: Map<string, number> = new Map();
  const serviceDayBeforeYesterdayCosts: Map<string, number> = new Map();

  for (const [serviceName, serviceCosts] of Object.entries(rawCostData)) {
    let serviceYesterday = 0;
    let serviceDayBefore = 0;

    for (const [dateStr, cost] of Object.entries(serviceCosts)) {
      const date = new Date(dateStr);
      const costValue = typeof cost === 'number' ? cost : parseFloat(cost as string);

      // Yesterday
      if (isSameDay(date, yesterday)) {
        yesterdayCost += costValue;
        serviceYesterday += costValue;
      }

      // Day before yesterday
      if (isSameDay(date, dayBeforeYesterday)) {
        dayBeforeYesterdayCost += costValue;
        serviceDayBefore += costValue;
      }

      // Last 7 days
      if (date >= last7DaysStart && date < yesterday) {
        last7DaysCost += costValue;
      }

      // Previous 7 days
      if (date >= previous7DaysStart && date < previous7DaysEnd) {
        previous7DaysCost += costValue;
      }

      // This month
      if (date >= thisMonthStart) {
        thisMonthCost += costValue;
      }

      // Last month
      if (date >= lastMonthStart && date <= lastMonthEnd) {
        lastMonthCost += costValue;
      }
    }

    if (opts.includeZeroCost || serviceYesterday > 0 || serviceDayBefore > 0) {
      serviceYesterdayCosts.set(serviceName, serviceYesterday);
      serviceDayBeforeYesterdayCosts.set(serviceName, serviceDayBefore);
    }
  }

  // Calculate service deltas
  const serviceDeltas: ServiceCostDelta[] = [];
  for (const [serviceName, currentCost] of serviceYesterdayCosts.entries()) {
    const previousCost = serviceDayBeforeYesterdayCosts.get(serviceName) || 0;
    serviceDeltas.push({
      serviceName,
      currentCost,
      previousCost,
      delta: calculateDelta(currentCost, previousCost),
    });
  }

  // Sort by absolute delta for top increases/decreases
  const sortedByDelta = [...serviceDeltas].sort(
    (a, b) => Math.abs(b.delta.absolute) - Math.abs(a.delta.absolute)
  );

  const topIncreases = sortedByDelta
    .filter(s => s.delta.absolute > 0)
    .slice(0, opts.topN);

  const topDecreases = sortedByDelta
    .filter(s => s.delta.absolute < 0)
    .slice(0, opts.topN);

  // Calculate insights
  const significantChanges: string[] = [];
  for (const service of serviceDeltas) {
    if (Math.abs(service.delta.percentage) >= (opts.significantChangeThreshold || 10)) {
      const direction = service.delta.absolute > 0 ? 'increased' : 'decreased';
      significantChanges.push(
        `${service.serviceName} ${direction} by ${Math.abs(service.delta.percentage).toFixed(1)}%`
      );
    }
  }

  // Calculate volatility score (0-100)
  const volatilityScore = calculateVolatilityScore(serviceDeltas);
  const yesterdayDelta = calculateDelta(yesterdayCost, dayBeforeYesterdayCost);
  const anomalyDetected = Math.abs(yesterdayDelta.percentage) > 25;

  return {
    totals: {
      yesterday: {
        current: yesterdayCost,
        previous: dayBeforeYesterdayCost,
        delta: yesterdayDelta,
      },
      last7Days: {
        current: last7DaysCost,
        previous: previous7DaysCost,
        delta: calculateDelta(last7DaysCost, previous7DaysCost),
      },
      thisMonth: {
        current: thisMonthCost,
        previous: lastMonthCost,
        delta: calculateDelta(thisMonthCost, lastMonthCost),
      },
    },
    serviceDeltas,
    topIncreases,
    topDecreases,
    insights: {
      volatilityScore,
      anomalyDetected,
      significantChanges: significantChanges.slice(0, 5),
    },
  };
}

/**
 * Enhance TotalCosts with delta information
 */
export function enhanceCostsWithDelta(
  costs: TotalCosts,
  rawCostData: RawCostByService | RawCostData
): TotalCosts & { delta: CostDeltaAnalysis } {
  const deltaAnalysis = analyzeCostDelta(rawCostData);

  return {
    ...costs,
    delta: deltaAnalysis,
  };
}

/**
 * Format delta for display
 */
export function formatDelta(delta: CostDelta): string {
  const sign = delta.absolute >= 0 ? '+' : '-';
  const arrow = delta.trend === 'increasing' ? '↑' : delta.trend === 'decreasing' ? '↓' : '→';

  if (delta.trend === 'stable') {
    return `${arrow} $${Math.abs(delta.absolute).toFixed(2)} (0%)`;
  }

  return `${arrow} ${sign}$${Math.abs(delta.absolute).toFixed(2)} (${sign}${Math.abs(delta.percentage).toFixed(1)}%)`;
}

/**
 * Format delta for display with color indicators (for terminal)
 */
export function formatDeltaWithColor(delta: CostDelta): { text: string; color: 'green' | 'red' | 'gray' } {
  const sign = delta.absolute >= 0 ? '+' : '-';
  const arrow = delta.trend === 'increasing' ? '↑' : delta.trend === 'decreasing' ? '↓' : '→';

  let color: 'green' | 'red' | 'gray';
  if (delta.trend === 'stable') {
    color = 'gray';
  } else if (delta.absolute > 0) {
    color = 'red'; // Cost increase is bad
  } else {
    color = 'green'; // Cost decrease is good
  }

  const text = delta.trend === 'stable'
    ? `${arrow} 0%`
    : `${arrow} ${sign}${Math.abs(delta.percentage).toFixed(1)}%`;

  return { text, color };
}

/**
 * Get delta indicator emoji
 */
export function getDeltaEmoji(delta: CostDelta): string {
  if (delta.trend === 'stable') return '➡️';
  if (delta.trend === 'increasing') {
    if (delta.percentage > 50) return '🔺';
    if (delta.percentage > 20) return '📈';
    return '↗️';
  }
  // Decreasing
  if (delta.percentage < -50) return '🔻';
  if (delta.percentage < -20) return '📉';
  return '↘️';
}

// Helper functions

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Normalize a date to start of day in UTC for consistent comparisons
 */
function normalizeToUTCDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isSameDay(date1: Date, date2: Date): boolean {
  // Use UTC methods for consistent timezone-independent comparison
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

function calculateVolatilityScore(serviceDeltas: ServiceCostDelta[]): number {
  if (serviceDeltas.length === 0) return 0;

  // Calculate standard deviation of percentage changes
  const percentages = serviceDeltas
    .map(s => s.delta.percentage)
    .filter(p => !isNaN(p) && isFinite(p));

  if (percentages.length === 0) return 0;

  const mean = percentages.reduce((a, b) => a + b, 0) / percentages.length;
  const squaredDiffs = percentages.map(p => Math.pow(p - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / percentages.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  // Convert to 0-100 score (higher = more volatile)
  // stdDev of 20% = score of 50
  return Math.min(100, Math.round((stdDev / 20) * 50));
}

/**
 * Generate delta summary for Slack/text output
 */
export function generateDeltaSummary(deltaAnalysis: CostDeltaAnalysis): string {
  const { totals, topIncreases, topDecreases, insights } = deltaAnalysis;
  const lines: string[] = [];

  // Yesterday's delta
  const yesterdayDelta = totals.yesterday.delta;
  const emoji = getDeltaEmoji(yesterdayDelta);
  lines.push(`Yesterday: $${totals.yesterday.current.toFixed(2)} ${emoji} ${formatDelta(yesterdayDelta)}`);

  // Significant changes
  if (insights.significantChanges.length > 0) {
    lines.push('');
    lines.push('Significant changes:');
    insights.significantChanges.forEach(change => {
      lines.push(`  - ${change}`);
    });
  }

  // Top increases
  if (topIncreases.length > 0) {
    lines.push('');
    lines.push('Top cost increases:');
    topIncreases.slice(0, 3).forEach(service => {
      lines.push(`  - ${service.serviceName}: +$${service.delta.absolute.toFixed(2)} (+${service.delta.percentage.toFixed(1)}%)`);
    });
  }

  // Top decreases
  if (topDecreases.length > 0) {
    lines.push('');
    lines.push('Top cost decreases:');
    topDecreases.slice(0, 3).forEach(service => {
      lines.push(`  - ${service.serviceName}: -$${Math.abs(service.delta.absolute).toFixed(2)} (${service.delta.percentage.toFixed(1)}%)`);
    });
  }

  // Anomaly warning
  if (insights.anomalyDetected) {
    lines.push('');
    lines.push('⚠️ Anomaly detected: Cost change exceeds 25% threshold');
  }

  return lines.join('\n');
}
