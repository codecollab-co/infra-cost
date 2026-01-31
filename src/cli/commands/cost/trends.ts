/**
 * Cost Trends Command Handler
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { getGlobalLogger } from '../../../core/logging';
import { getProviderFromConfig } from '../../../core/config/discovery';
import dayjs from 'dayjs';

interface TrendDataPoint {
  date: string;
  cost: number;
}

interface ServiceTrend {
  service: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
}

export async function handleTrends(options: any, command: any): Promise<void> {
  const logger = getGlobalLogger();
  logger.info('Analyzing cost trends', options);

  try {
    const period = options.period || '30d';
    const granularity = options.granularity || 'daily';
    const servicesToAnalyze = options.services
      ? options.services.split(',').map((s: string) => s.trim())
      : null;

    // Validate inputs
    if (!['7d', '30d', '90d', '12m'].includes(period)) {
      console.log(chalk.red('❌ Period must be one of: 7d, 30d, 90d, 12m'));
      return;
    }

    if (!['daily', 'weekly', 'monthly'].includes(granularity)) {
      console.log(chalk.red('❌ Granularity must be one of: daily, weekly, monthly'));
      return;
    }

    console.log(chalk.blue('📊 Analyzing cost trends...'));
    console.log();

    // Get provider and cost data
    const provider = await getProviderFromConfig();
    const rawCostData = await provider.getRawCostData();

    // Convert to trend data
    const trendData = convertToTrendData(rawCostData, period, granularity);

    if (trendData.length === 0) {
      console.log(chalk.yellow('⚠️  No trend data available'));
      return;
    }

    // Analyze trends
    const serviceTrends = analyzeServiceTrends(rawCostData, servicesToAnalyze);

    // Display results
    displayTrendOverview(trendData, period);
    displayServiceTrends(serviceTrends);
    displayTrendVisualization(trendData, granularity);
    displayInsights(trendData, serviceTrends);

  } catch (error: any) {
    console.error(chalk.red('❌ Failed to analyze trends:'), error.message);
    logger.error('Trends error', { error: error.message });
  }
}

/**
 * Convert raw cost data to trend data points
 */
function convertToTrendData(
  rawCostData: any,
  period: string,
  granularity: string
): TrendDataPoint[] {
  const dailyCosts = new Map<string, number>();

  // Aggregate costs by date
  for (const service in rawCostData) {
    for (const date in rawCostData[service]) {
      const existing = dailyCosts.get(date) || 0;
      dailyCosts.set(date, existing + rawCostData[service][date]);
    }
  }

  // Convert to array and sort
  let dataPoints: TrendDataPoint[] = Array.from(dailyCosts.entries())
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Apply granularity aggregation
  if (granularity === 'weekly') {
    dataPoints = aggregateWeekly(dataPoints);
  } else if (granularity === 'monthly') {
    dataPoints = aggregateMonthly(dataPoints);
  }

  return dataPoints;
}

/**
 * Aggregate daily data to weekly
 */
function aggregateWeekly(data: TrendDataPoint[]): TrendDataPoint[] {
  const weekly = new Map<string, { total: number; count: number }>();

  data.forEach(point => {
    const weekStart = dayjs(point.date).startOf('week').format('YYYY-MM-DD');
    const existing = weekly.get(weekStart) || { total: 0, count: 0 };
    weekly.set(weekStart, {
      total: existing.total + point.cost,
      count: existing.count + 1,
    });
  });

  return Array.from(weekly.entries())
    .map(([date, { total }]) => ({ date, cost: total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Aggregate daily data to monthly
 */
function aggregateMonthly(data: TrendDataPoint[]): TrendDataPoint[] {
  const monthly = new Map<string, { total: number; count: number }>();

  data.forEach(point => {
    const month = point.date.substring(0, 7); // YYYY-MM
    const existing = monthly.get(month) || { total: 0, count: 0 };
    monthly.set(month, {
      total: existing.total + point.cost,
      count: existing.count + 1,
    });
  });

  return Array.from(monthly.entries())
    .map(([date, { total }]) => ({ date: `${date}-01`, cost: total }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Analyze service-level trends
 */
function analyzeServiceTrends(
  rawCostData: any,
  servicesToAnalyze: string[] | null
): ServiceTrend[] {
  const trends: ServiceTrend[] = [];

  for (const service in rawCostData) {
    // Filter services if specified
    if (servicesToAnalyze && !servicesToAnalyze.includes(service)) {
      continue;
    }

    const dates = Object.keys(rawCostData[service]).sort();
    if (dates.length < 2) continue;

    // Split into two periods
    const midPoint = Math.floor(dates.length / 2);
    const previousDates = dates.slice(0, midPoint);
    const currentDates = dates.slice(midPoint);

    const previousTotal = previousDates.reduce(
      (sum, date) => sum + rawCostData[service][date],
      0
    );
    const currentTotal = currentDates.reduce(
      (sum, date) => sum + rawCostData[service][date],
      0
    );

    const previous = previousTotal / previousDates.length;
    const current = currentTotal / currentDates.length;
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;

    let trend: 'up' | 'down' | 'stable';
    if (Math.abs(changePercent) < 5) {
      trend = 'stable';
    } else if (changePercent > 0) {
      trend = 'up';
    } else {
      trend = 'down';
    }

    trends.push({
      service,
      current,
      previous,
      change,
      changePercent,
      trend,
    });
  }

  // Sort by absolute change
  return trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

/**
 * Display trend overview
 */
function displayTrendOverview(data: TrendDataPoint[], period: string): void {
  console.log(chalk.bold.blue('📈 Trend Overview'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();

  const totalCost = data.reduce((sum, d) => sum + d.cost, 0);
  const avgCost = totalCost / data.length;
  const minCost = Math.min(...data.map(d => d.cost));
  const maxCost = Math.max(...data.map(d => d.cost));

  // Calculate overall trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));

  const firstAvg = firstHalf.reduce((sum, d) => sum + d.cost, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.cost, 0) / secondHalf.length;
  const trendChange = ((secondAvg - firstAvg) / firstAvg) * 100;

  const table = new Table({
    head: ['Metric', 'Value'],
    style: {
      head: ['cyan'],
    },
  });

  let trendEmoji = '📊';
  let trendText = 'Stable';
  let trendColor = chalk.blue;

  if (trendChange > 5) {
    trendEmoji = '📈';
    trendText = 'Increasing';
    trendColor = chalk.red;
  } else if (trendChange < -5) {
    trendEmoji = '📉';
    trendText = 'Decreasing';
    trendColor = chalk.green;
  }

  table.push(
    ['Period', period],
    ['Data Points', data.length.toString()],
    [''],
    ['Total Cost', chalk.yellow(`$${totalCost.toFixed(2)}`)],
    ['Average Cost', chalk.cyan(`$${avgCost.toFixed(2)}`)],
    ['Min Cost', chalk.green(`$${minCost.toFixed(2)}`)],
    ['Max Cost', chalk.red(`$${maxCost.toFixed(2)}`)],
    [''],
    ['Overall Trend', `${trendEmoji} ${trendColor(trendText)}`],
    ['Trend Change', trendColor(`${trendChange > 0 ? '+' : ''}${trendChange.toFixed(1)}%`)],
  );

  console.log(table.toString());
  console.log();
}

/**
 * Display service-level trends
 */
function displayServiceTrends(trends: ServiceTrend[]): void {
  console.log(chalk.bold.blue('🔧 Service Trends'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();

  if (trends.length === 0) {
    console.log(chalk.gray('  No service trends available'));
    console.log();
    return;
  }

  const table = new Table({
    head: ['Service', 'Previous Avg', 'Current Avg', 'Change', 'Trend'],
    style: {
      head: ['cyan'],
    },
  });

  trends.slice(0, 10).forEach(trend => {
    let trendIcon = '→';
    let changeColor = chalk.blue;

    if (trend.trend === 'up') {
      trendIcon = '↑';
      changeColor = chalk.red;
    } else if (trend.trend === 'down') {
      trendIcon = '↓';
      changeColor = chalk.green;
    }

    table.push([
      trend.service,
      chalk.gray(`$${trend.previous.toFixed(2)}`),
      chalk.yellow(`$${trend.current.toFixed(2)}`),
      changeColor(`${trend.changePercent > 0 ? '+' : ''}${trend.changePercent.toFixed(1)}%`),
      `${trendIcon} ${trend.trend}`,
    ]);
  });

  console.log(table.toString());
  console.log();
}

/**
 * Display ASCII trend visualization
 */
function displayTrendVisualization(data: TrendDataPoint[], granularity: string): void {
  console.log(chalk.bold.blue('📊 Cost Trend Visualization'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();

  // Limit to last 30 data points for visualization
  const vizData = data.slice(-30);

  const minCost = Math.min(...vizData.map(d => d.cost));
  const maxCost = Math.max(...vizData.map(d => d.cost));
  const range = maxCost - minCost;

  const height = 10;
  const width = Math.min(vizData.length, 60);

  // Create ASCII chart
  for (let row = height; row >= 0; row--) {
    const threshold = minCost + (range * row) / height;
    let line = '';

    vizData.slice(-width).forEach((point, idx) => {
      if (point.cost >= threshold) {
        // Color based on cost level
        if (point.cost > minCost + range * 0.75) {
          line += chalk.red('█');
        } else if (point.cost > minCost + range * 0.5) {
          line += chalk.yellow('█');
        } else {
          line += chalk.green('█');
        }
      } else {
        line += ' ';
      }
    });

    console.log(chalk.gray(`$${threshold.toFixed(0).padStart(6)} │`) + line);
  }

  console.log(chalk.gray('       └' + '─'.repeat(width)));
  console.log();

  // Legend
  console.log(chalk.gray('  Legend:'), chalk.green('█ Low'), chalk.yellow('█ Medium'), chalk.red('█ High'));
  console.log();
}

/**
 * Display trend insights
 */
function displayInsights(data: TrendDataPoint[], trends: ServiceTrend[]): void {
  console.log(chalk.bold.blue('💡 Insights & Recommendations'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();

  // Find biggest changes
  const increasingServices = trends.filter(t => t.trend === 'up').slice(0, 3);
  const decreasingServices = trends.filter(t => t.trend === 'down').slice(0, 3);

  if (increasingServices.length > 0) {
    console.log(chalk.red('  ⚠️  Services with increasing costs:'));
    increasingServices.forEach(service => {
      console.log(chalk.gray(`     • ${service.service}: +${service.changePercent.toFixed(1)}%`));
    });
    console.log();
  }

  if (decreasingServices.length > 0) {
    console.log(chalk.green('  ✅ Services with decreasing costs:'));
    decreasingServices.forEach(service => {
      console.log(chalk.gray(`     • ${service.service}: ${service.changePercent.toFixed(1)}%`));
    });
    console.log();
  }

  // Volatility analysis
  const costs = data.map(d => d.cost);
  const mean = costs.reduce((sum, c) => sum + c, 0) / costs.length;
  const variance = costs.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / costs.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / mean) * 100;

  if (coefficientOfVariation > 20) {
    console.log(chalk.yellow('  ⚠️  High cost volatility detected'));
    console.log(chalk.gray('     • Costs vary significantly day-to-day'));
    console.log(chalk.gray('     • Consider investigating unexpected spikes'));
    console.log(chalk.gray('     • Review auto-scaling policies'));
    console.log();
  } else {
    console.log(chalk.green('  ✅ Cost patterns are stable'));
    console.log(chalk.gray('     • Low variance in daily costs'));
    console.log(chalk.gray('     • Predictable spending patterns'));
    console.log();
  }

  console.log(chalk.blue('  📊 General Recommendations:'));
  console.log(chalk.gray('     • Monitor services with upward trends'));
  console.log(chalk.gray('     • Set up alerts for cost anomalies'));
  console.log(chalk.gray('     • Review resource utilization patterns'));
  console.log();
}
