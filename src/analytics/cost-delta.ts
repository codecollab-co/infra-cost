import { TotalCosts, RawCostByService } from '../cost';
import { CostBreakdown, RawCostData } from '../types/providers';

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
 * Compute absolute and percentage change between two cost values and determine the trend.
 *
 * @param current - Current period cost
 * @param previous - Previous period cost
 * @returns An object with:
 *  - `absolute`: `current - previous`
 *  - `percentage`: percentage change relative to `previous` (when `previous` is 0, `percentage` is `100` if `current > 0`, otherwise `0`)
 *  - `trend`: `'increasing'`, `'decreasing'`, or `'stable'` (stable when the absolute percentage is less than 1)
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
 * Analyze raw per-service cost data and produce deltas and insights across time windows.
 *
 * Computes totals and per-service deltas for yesterday, the last 7 days, and this month;
 * identifies top increases and decreases, detects anomalies, measures volatility, and
 * lists significant service-level changes.
 *
 * @param rawCostData - Raw cost data keyed by service name with date-keyed cost entries.
 * @param options - Optional analysis settings. Supported fields:
 *   - `topN`: max number of top increases/decreases to include (default 5)
 *   - `significantChangeThreshold`: percent threshold to mark a service change as significant (default 10)
 *   - `includeZeroCost`: include services with zero cost in the previous/current period (default false)
 * @returns A CostDeltaAnalysis containing period totals with deltas, per-service deltas,
 *          topIncreases, topDecreases, and insights (volatilityScore, anomalyDetected,
 *          and up to five significant change descriptions).
 */
export function analyzeCostDelta(
  rawCostData: RawCostByService | RawCostData,
  options: CostDeltaOptions = {}
): CostDeltaAnalysis {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const dayBeforeYesterday = new Date(now);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

  // Calculate date ranges
  const yesterdayStr = formatDate(yesterday);
  const dayBeforeYesterdayStr = formatDate(dayBeforeYesterday);

  // Calculate 7-day periods
  const last7DaysStart = new Date(now);
  last7DaysStart.setDate(last7DaysStart.getDate() - 7);
  const previous7DaysStart = new Date(now);
  previous7DaysStart.setDate(previous7DaysStart.getDate() - 14);
  const previous7DaysEnd = new Date(now);
  previous7DaysEnd.setDate(previous7DaysEnd.getDate() - 7);

  // Calculate monthly periods
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

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
 * Attach a cost delta analysis to a TotalCosts object.
 *
 * @param costs - Aggregate totals to augment with delta analysis
 * @param rawCostData - Raw per-service cost records (by service map or array) used to compute deltas
 * @returns The `costs` object extended with a `delta` property containing the computed CostDeltaAnalysis
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
 * Format a CostDelta into a compact, human-readable string with trend, absolute change, and percentage.
 *
 * @param delta - The cost delta to format.
 * @returns A string containing a trend arrow, the dollar change (prefixed with '+' for non-negative values), and the percentage change in parentheses; for a stable trend the percentage is shown as `0%`.
 */
export function formatDelta(delta: CostDelta): string {
  const sign = delta.absolute >= 0 ? '+' : '';
  const arrow = delta.trend === 'increasing' ? '↑' : delta.trend === 'decreasing' ? '↓' : '→';

  if (delta.trend === 'stable') {
    return `${arrow} $${Math.abs(delta.absolute).toFixed(2)} (0%)`;
  }

  return `${arrow} ${sign}$${delta.absolute.toFixed(2)} (${sign}${delta.percentage.toFixed(1)}%)`;
}

/**
 * Format a CostDelta into a human-friendly string and a color suitable for terminal display.
 *
 * @param delta - Cost delta describing absolute change, percentage change, and trend
 * @returns An object with:
 *  - `text`: a short formatted label (e.g. `"↑ +12.3%"` or `"→ 0%"`)
 *  - `color`: `'red'` for cost increases, `'green'` for cost decreases, or `'gray'` for stable
 */
export function formatDeltaWithColor(delta: CostDelta): { text: string; color: 'green' | 'red' | 'gray' } {
  const sign = delta.absolute >= 0 ? '+' : '';
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
    : `${arrow} ${sign}${delta.percentage.toFixed(1)}%`;

  return { text, color };
}

/**
 * Selects an emoji that represents the cost delta's trend and magnitude.
 *
 * @param delta - Delta object containing `trend` and `percentage` to evaluate
 * @returns An emoji: `➡️` for stable; for increasing: `🔺` when >50%, `📈` when >20%, `↗️` otherwise; for decreasing: `🔻` when < -50%, `📉` when < -20%, `↘️` otherwise
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
 * Format a Date as an ISO calendar date string in the form `YYYY-MM-DD`.
 *
 * @param date - The date to format; the output is derived from the date's UTC value.
 * @returns The calendar date portion of the given `date` as `YYYY-MM-DD` (UTC).
 */

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Determine whether two Date objects fall on the same calendar day in local time.
 *
 * @param date1 - First date to compare.
 * @param date2 - Second date to compare.
 * @returns `true` if both dates have the same year, month, and day in local time, `false` otherwise.
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Computes a 0–100 volatility score representing how much per-service percentage changes vary.
 *
 * Uses the standard deviation of each service's `delta.percentage` to produce a normalized score
 * where higher values indicate greater volatility. Returns 0 when there is no valid percentage data.
 *
 * @param serviceDeltas - Array of per-service delta objects whose `delta.percentage` values are used.
 * @returns A normalized volatility score between 0 and 100 (higher = more volatile).
 */
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
 * Create a human-readable multi-line summary of cost deltas suitable for Slack or plain text.
 *
 * @param deltaAnalysis - Analysis containing period totals, per-service deltas, top increases/decreases, and insights used to build the summary
 * @returns A multi-line string that includes yesterday's total with an emoji and formatted delta, an optional list of significant changes, up to three top cost increases, up to three top cost decreases, and an anomaly warning line if an anomaly was detected
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
      lines.push(`  - ${service.serviceName}: $${service.delta.absolute.toFixed(2)} (${service.delta.percentage.toFixed(1)}%)`);
    });
  }

  // Anomaly warning
  if (insights.anomalyDetected) {
    lines.push('');
    lines.push('⚠️ Anomaly detected: Cost change exceeds 25% threshold');
  }

  return lines.join('\n');
}