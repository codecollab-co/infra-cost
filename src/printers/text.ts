import { TotalCosts } from '../cost';
import { hideSpinner } from '../logger';
import { CostDeltaAnalysis, formatDelta, getDeltaEmoji } from '../analytics/cost-delta';

export interface TotalCostsWithDelta extends TotalCosts {
  delta?: CostDeltaAnalysis;
}

/**
 * Prints a plain-text summary of an account's cost totals to the console.
 *
 * Clears the console, hides any active spinner, and writes overall totals (Last Month, This Month, Last 7 Days)
 * plus Yesterday. If `costs.delta` is present, Yesterday includes a delta emoji and formatted delta value.
 *
 * @param accountAlias - Human-readable name or alias of the account being reported
 * @param costs - Total costs for the account; may include `delta` to display yesterday's change with an emoji and formatted delta
 */
function printPlainSummary(accountAlias: string, costs: TotalCostsWithDelta) {
  hideSpinner();
  console.clear();
  console.log('');
  console.log(`Account: ${accountAlias}`);
  console.log('');
  console.log('Totals:');
  console.log(`  Last Month: $${costs.totals.lastMonth.toFixed(2)}`);
  console.log(`  This Month: $${costs.totals.thisMonth.toFixed(2)}`);
  console.log(`  Last 7 Days: $${costs.totals.last7Days.toFixed(2)}`);

  // Print yesterday with delta if available
  if (costs.delta) {
    const delta = costs.delta.totals.yesterday.delta;
    const emoji = getDeltaEmoji(delta);
    console.log(`  Yesterday: $${costs.totals.yesterday.toFixed(2)} ${emoji} ${formatDelta(delta)}`);
  } else {
    console.log(`  Yesterday: $${costs.totals.yesterday.toFixed(2)}`);
  }
}

/**
 * Print a plain-text cost report for an account, including overall totals, per-service breakdowns, and optional delta insights.
 *
 * If `isSummary` is true, only the summary section is printed. When `totals.delta` is present, yesterday's per-service line is annotated with an emoji and formatted delta for non-stable trends; significant changes and an anomaly warning are also printed when provided.
 *
 * @param accountAlias - Display name or alias of the account being reported
 * @param totals - Aggregated cost totals with optional delta analysis
 * @param isSummary - If true, only prints the high-level summary and returns early
 */
export function printPlainText(accountAlias: string, totals: TotalCostsWithDelta, isSummary: boolean = false) {
  printPlainSummary(accountAlias, totals);
  if (isSummary) {
    return;
  }

  const serviceTotals = totals.totalsByService;

  const allServices = Object.keys(serviceTotals.yesterday).sort((a, b) => b.length - a.length);

  console.log('');
  console.log('Totals by Service:');

  console.log('  Last Month:');
  allServices.forEach((service) => {
    console.log(`    ${service}: $${serviceTotals.lastMonth[service].toFixed(2)}`);
  });

  console.log('');
  console.log('  This Month:');
  allServices.forEach((service) => {
    console.log(`    ${service}: $${serviceTotals.thisMonth[service].toFixed(2)}`);
  });

  console.log('');
  console.log('  Last 7 Days:');
  allServices.forEach((service) => {
    console.log(`    ${service}: $${serviceTotals.last7Days[service].toFixed(2)}`);
  });

  console.log('');
  console.log('  Yesterday:');
  allServices.forEach((service) => {
    const cost = serviceTotals.yesterday[service];
    // Find service delta if available
    if (totals.delta) {
      const serviceDelta = totals.delta.serviceDeltas.find(s => s.serviceName === service);
      if (serviceDelta && serviceDelta.delta.trend !== 'stable') {
        const delta = serviceDelta.delta;
        const emoji = getDeltaEmoji(delta);
        console.log(`    ${service}: $${cost.toFixed(2)} ${emoji} ${formatDelta(delta)}`);
        return;
      }
    }
    console.log(`    ${service}: $${cost.toFixed(2)}`);
  });

  // Print delta insights if available
  if (totals.delta && totals.delta.insights.significantChanges.length > 0) {
    console.log('');
    console.log('Significant Changes:');
    totals.delta.insights.significantChanges.forEach(change => {
      console.log(`  - ${change}`);
    });
  }

  // Print anomaly warning if detected
  if (totals.delta && totals.delta.insights.anomalyDetected) {
    console.log('');
    console.log('WARNING: Cost anomaly detected - change exceeds 25% threshold');
  }
}