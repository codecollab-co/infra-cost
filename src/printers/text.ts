import { TotalCosts } from '../cost';
import { hideSpinner } from '../logger';
import { CostDeltaAnalysis, formatDelta, getDeltaEmoji } from '../analytics/cost-delta';

export interface TotalCostsWithDelta extends TotalCosts {
  delta?: CostDeltaAnalysis;
}

/**
 * Prints a concise plain-text cost summary for an account to the console.
 *
 * When a delta is present on `costs`, the "Yesterday" line includes an emoji and a formatted
 * delta description; otherwise it prints the plain yesterday total.
 *
 * @param accountAlias - Human-readable account label displayed in the header
 * @param costs - Aggregated cost totals and optional delta analysis used to enrich the "Yesterday" line
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
 * Print a plain-text cost report for an account, including per-service breakdowns and optional delta insights.
 *
 * When `isSummary` is true, only the high-level summary is printed; otherwise the function prints totals by service
 * for last month, this month, last 7 days, and yesterday. If `totals.delta` is present, per-service yesterday lines
 * and the summary may include change emojis, formatted deltas, a "Significant Changes" list, and an anomaly warning.
 *
 * @param accountAlias - Human-readable account name shown in the report header
 * @param totals - Aggregated cost totals and optional delta analysis to drive per-service and summary deltas
 * @param isSummary - If true, print only the summary and skip the per-service sections
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