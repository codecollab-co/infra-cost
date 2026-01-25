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
 * Compute the dollar delta, percent change, and trend between two cost values.
 *
 * @returns An object with:
 * - `absolute`: the dollar difference (current - previous).
 * - `percentage`: percent change relative to `previous` (if `previous` is 0, yields `100` when `current` > 0, otherwise `0`).
 * - `trend`: `'stable'` when the absolute percent change is less than 1, `'increasing'` when `absolute` > 0, otherwise `'decreasing'`.
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
 * Analyze raw cost-by-service data and produce a CostDeltaAnalysis covering totals, per-service deltas, top changes, and insights.
 *
 * Aggregates costs into periods (yesterday, previous day, last 7 days, previous 7 days, this month, last month), computes per-service day-over-day deltas, ranks top increases and decreases, and derives insights such as volatility score, anomaly detection, and significant changes.
 *
 * @param rawCostData - Mapping of service name to an object whose keys are date strings (ISO YYYY-MM-DD) and values are costs (number or numeric string).
 * @param options - Optional analysis controls. Recognized fields:
 *   - topN: number of top services to return for increases/decreases (default 5)
 *   - significantChangeThreshold: percentage threshold to mark a service change as significant (default 10)
 *   - includeZeroCost: whether to include services with zero cost in the analysis (default false)
 * @returns A CostDeltaAnalysis containing:
 *   - totals for yesterday, last7Days, and thisMonth (each with current, previous, and delta)
 *   - an array of per-service ServiceCostDelta entries
 *   - topIncreases and topDecreases arrays limited by `topN`
 *   - insights including `volatilityScore`, `anomalyDetected`, and up to five `significantChanges`
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
 * Attach cost-delta analysis to a TotalCosts object.
 *
 * @param costs - The aggregated cost totals to augment
 * @param rawCostData - Raw per-service cost data used to compute the delta analysis
 * @returns The original `costs` object augmented with a `delta` property containing the computed `CostDeltaAnalysis`
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
 * Produce a concise, human-readable representation of a cost delta.
 *
 * @param delta - The cost delta containing `absolute`, `percentage`, and `trend` fields
 * @returns A formatted string combining a trend arrow, dollar change, and percentage (e.g. "↑ +$12.34 (+10.0%)" or "→ $0.00 (0%)")
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
 * Produce a terminal-friendly text snippet and a color label representing a cost delta.
 *
 * @param delta - The cost delta to format.
 * @returns An object with `text` (arrow plus percentage or `0%`) and `color` where `red` indicates an increase, `green` indicates a decrease, and `gray` indicates stable.
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
 * Selects an emoji that represents the delta's trend and magnitude.
 *
 * @param delta - The cost delta whose `trend` and `percentage` determine the emoji
 * @returns An emoji representing the delta: '➡️' for stable; for increasing use '↗️' (small), '📈' (percentage > 20%), '🔺' (percentage > 50%); for decreasing use '↘️' (small), '📉' (percentage < -20%), '🔻' (percentage < -50%).
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

/**
 * Format a Date as a UTC date string in `YYYY-MM-DD` form.
 *
 * @param date - The date to format
 * @returns The UTC date formatted as `YYYY-MM-DD`
 */

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Normalize a Date to the start of its UTC day.
 *
 * @param date - The Date to normalize
 * @returns A new Date representing 00:00:00 UTC on the same UTC year, month, and day as `date`
 */
function normalizeToUTCDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * Determines whether two Date objects represent the same calendar day using UTC.
 *
 * @param date1 - The first date to compare (compared by UTC year, month, and day)
 * @param date2 - The second date to compare (compared by UTC year, month, and day)
 * @returns `true` if both dates fall on the same UTC calendar day, `false` otherwise
 */
function isSameDay(date1: Date, date2: Date): boolean {
  // Use UTC methods for consistent timezone-independent comparison
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/**
 * Computes a volatility score for a set of service cost deltas.
 *
 * @param serviceDeltas - Array of service cost delta objects to analyze.
 * @returns An integer score from 0 to 100 where higher values indicate greater variability in percentage changes across services; 50 corresponds approximately to a 20% standard deviation.
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
 * Builds a multi-line human-readable summary of a cost delta analysis suitable for Slack or plain-text output.
 *
 * @param deltaAnalysis - Analysis results containing totals, per-service deltas, and insights used to compose the summary
 * @returns A newline-separated string that includes yesterday's total with an emoji and formatted delta, a list of significant changes (if any), the top cost increases and decreases (up to three each), and an anomaly warning line when an anomaly is detected
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