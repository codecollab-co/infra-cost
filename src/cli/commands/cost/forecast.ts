/**
 * Cost Forecast Command Handler
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { getGlobalLogger } from '../../../core/logging';
import { getProviderFromConfig } from '../../../core/config/discovery';
import { CostForecaster, ForecastDataPoint } from '../../../core/forecasting/forecaster';
import dayjs from 'dayjs';

export async function handleForecast(options: any, command: any): Promise<void> {
  const logger = getGlobalLogger();
  logger.info('Forecasting costs', options);

  try {
    const months = parseInt(options.months || '3', 10);
    const model = options.model || 'auto';
    const confidenceLevel = parseInt(options.confidence || '90', 10);

    // Validate inputs
    if (isNaN(months) || months < 1 || months > 12) {
      console.log(chalk.red('❌ Months must be between 1 and 12'));
      return;
    }

    if (!['linear', 'exponential', 'seasonal', 'auto'].includes(model)) {
      console.log(chalk.red('❌ Model must be one of: linear, exponential, seasonal, auto'));
      return;
    }

    if (![80, 90, 95].includes(confidenceLevel)) {
      console.log(chalk.red('❌ Confidence level must be 80, 90, or 95'));
      return;
    }

    console.log(chalk.blue('📊 Generating cost forecast...'));
    console.log();

    // Get provider and historical data
    const provider = await getProviderFromConfig();
    const rawCostData = await provider.getRawCostData();

    // Convert to historical data points
    const historicalData = convertToHistoricalData(rawCostData);

    if (historicalData.length < 7) {
      console.log(chalk.yellow('⚠️  Need at least 7 days of historical data'));
      console.log(chalk.gray('   Current data points:', historicalData.length));
      return;
    }

    // Generate forecast
    const forecaster = new CostForecaster();
    const result = await forecaster.forecast(historicalData, {
      months,
      model,
      confidenceLevel,
    });

    // Display results
    displayForecastSummary(result, months, confidenceLevel);
    displayForecastTable(result, months);
    displayTrendAnalysis(result, historicalData);

  } catch (error: any) {
    console.error(chalk.red('❌ Failed to generate forecast:'), error.message);
    logger.error('Forecast error', { error: error.message });
  }
}

/**
 * Convert raw cost data to historical data points
 */
function convertToHistoricalData(rawCostData: any): ForecastDataPoint[] {
  const dailyCosts = new Map<string, number>();

  // Aggregate costs by date
  for (const service in rawCostData) {
    for (const date in rawCostData[service]) {
      const existing = dailyCosts.get(date) || 0;
      dailyCosts.set(date, existing + rawCostData[service][date]);
    }
  }

  // Convert to array and sort by date
  const dataPoints: ForecastDataPoint[] = Array.from(dailyCosts.entries())
    .map(([date, cost]) => ({ date, cost }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return dataPoints;
}

/**
 * Display forecast summary
 */
function displayForecastSummary(result: any, months: number, confidenceLevel: number): void {
  console.log(chalk.bold.blue('📈 Cost Forecast Summary'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();

  const table = new Table({
    head: ['Metric', 'Value'],
    style: {
      head: ['cyan'],
    },
  });

  table.push(
    ['Forecast Period', `${months} month${months > 1 ? 's' : ''}`],
    ['Forecasting Model', result.model.toUpperCase()],
    ['Confidence Level', `${confidenceLevel}%`],
    ['Average Confidence', `${(result.confidence * 100).toFixed(1)}%`],
    [''],
    ['Total Predicted Cost', chalk.yellow(`$${result.totalPredicted.toFixed(2)}`)],
    ['Average Daily Cost', chalk.cyan(`$${result.averageDaily.toFixed(2)}`)],
    ['Average Monthly Cost', chalk.cyan(`$${result.averageMonthly.toFixed(2)}`)],
  );

  console.log(table.toString());
  console.log();
}

/**
 * Display forecast table
 */
function displayForecastTable(result: any, months: number): void {
  console.log(chalk.bold.blue('📅 Monthly Forecast Breakdown'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();

  const table = new Table({
    head: ['Month', 'Predicted Cost', 'Range', 'Avg Confidence'],
    style: {
      head: ['cyan'],
    },
  });

  // Group forecasts by month
  const monthlyForecasts = new Map<string, typeof result.forecasts>();
  result.forecasts.forEach((forecast: any) => {
    const month = forecast.date.substring(0, 7); // YYYY-MM
    if (!monthlyForecasts.has(month)) {
      monthlyForecasts.set(month, []);
    }
    monthlyForecasts.get(month)!.push(forecast);
  });

  // Display each month
  Array.from(monthlyForecasts.entries()).forEach(([month, forecasts]) => {
    const totalPredicted = forecasts.reduce((sum: number, f: any) => sum + f.predicted, 0);
    const avgLower = forecasts.reduce((sum: number, f: any) => sum + f.lower, 0) / forecasts.length;
    const avgUpper = forecasts.reduce((sum: number, f: any) => sum + f.upper, 0) / forecasts.length;
    const avgConfidence = forecasts.reduce((sum: number, f: any) => sum + f.confidence, 0) / forecasts.length;

    const monthName = dayjs(month).format('MMM YYYY');

    table.push([
      monthName,
      chalk.yellow(`$${totalPredicted.toFixed(2)}`),
      chalk.gray(`$${(avgLower * forecasts.length).toFixed(0)} - $${(avgUpper * forecasts.length).toFixed(0)}`),
      chalk.cyan(`${(avgConfidence * 100).toFixed(0)}%`),
    ]);
  });

  console.log(table.toString());
  console.log();
}

/**
 * Display trend analysis
 */
function displayTrendAnalysis(result: any, historicalData: ForecastDataPoint[]): void {
  console.log(chalk.bold.blue('📊 Trend Analysis'));
  console.log(chalk.gray('━'.repeat(60)));
  console.log();

  const historicalAvg = historicalData.reduce((sum, d) => sum + d.cost, 0) / historicalData.length;

  let trendIcon = '📈';
  let trendColor = chalk.yellow;
  let trendText = 'Increasing';

  if (result.trend === 'decreasing') {
    trendIcon = '📉';
    trendColor = chalk.green;
    trendText = 'Decreasing';
  } else if (result.trend === 'stable') {
    trendIcon = '📊';
    trendColor = chalk.blue;
    trendText = 'Stable';
  }

  console.log(trendIcon, trendColor.bold(` ${trendText} Trend`));
  console.log();
  console.log(chalk.gray('Historical Average:'), chalk.cyan(`$${historicalAvg.toFixed(2)}/day`));
  console.log(chalk.gray('Forecast Average:  '), chalk.yellow(`$${result.averageDaily.toFixed(2)}/day`));
  console.log(chalk.gray('Change:            '), trendColor(`${result.trendPercentage > 0 ? '+' : ''}${result.trendPercentage.toFixed(1)}%`));
  console.log();

  // Recommendations
  console.log(chalk.bold('💡 Recommendations:'));
  console.log();

  if (result.trend === 'increasing' && result.trendPercentage > 10) {
    console.log(chalk.yellow('  ⚠️  Costs are projected to increase significantly'));
    console.log(chalk.gray('     • Review resource utilization'));
    console.log(chalk.gray('     • Consider implementing cost optimization strategies'));
    console.log(chalk.gray('     • Set up budget alerts'));
  } else if (result.trend === 'decreasing') {
    console.log(chalk.green('  ✅ Costs are projected to decrease'));
    console.log(chalk.gray('     • Current optimization efforts are working'));
    console.log(chalk.gray('     • Continue monitoring for further savings'));
  } else {
    console.log(chalk.blue('  ℹ️  Costs are projected to remain stable'));
    console.log(chalk.gray('     • Maintain current resource allocation'));
    console.log(chalk.gray('     • Monitor for unexpected spikes'));
  }

  console.log();
}
