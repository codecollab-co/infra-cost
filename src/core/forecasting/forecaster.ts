/**
 * Cost Forecasting Engine
 * Provides multiple forecasting models for predicting future cloud costs
 */

export interface ForecastDataPoint {
  date: string;
  cost: number;
}

export interface ForecastResult {
  date: string;
  predicted: number;
  lower: number; // Lower confidence bound
  upper: number; // Upper confidence bound
  confidence: number;
}

export interface ForecastOptions {
  months: number;
  model: 'linear' | 'exponential' | 'seasonal' | 'auto';
  confidenceLevel: number; // 80, 90, or 95
}

export interface ForecastSummary {
  model: string;
  totalPredicted: number;
  averageDaily: number;
  averageMonthly: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  confidence: number;
  forecasts: ForecastResult[];
}

export class CostForecaster {
  /**
   * Generate cost forecast using specified model
   */
  async forecast(
    historicalData: ForecastDataPoint[],
    options: ForecastOptions
  ): Promise<ForecastSummary> {
    if (historicalData.length < 7) {
      throw new Error('Need at least 7 days of historical data for forecasting');
    }

    // Auto-select best model if requested
    const model = options.model === 'auto'
      ? this.selectBestModel(historicalData)
      : options.model;

    let forecasts: ForecastResult[];
    switch (model) {
      case 'linear':
        forecasts = this.linearForecast(historicalData, options);
        break;
      case 'exponential':
        forecasts = this.exponentialForecast(historicalData, options);
        break;
      case 'seasonal':
        forecasts = this.seasonalForecast(historicalData, options);
        break;
      default:
        throw new Error(`Unknown model: ${model}`);
    }

    const totalPredicted = forecasts.reduce((sum, f) => sum + f.predicted, 0);
    const averageDaily = totalPredicted / forecasts.length;
    const averageMonthly = averageDaily * 30;

    // Calculate trend
    const trend = this.calculateTrend(historicalData, forecasts);

    return {
      model,
      totalPredicted,
      averageDaily,
      averageMonthly,
      trend: trend.direction,
      trendPercentage: trend.percentage,
      confidence: this.calculateOverallConfidence(forecasts),
      forecasts,
    };
  }

  /**
   * Linear regression forecast
   */
  private linearForecast(
    data: ForecastDataPoint[],
    options: ForecastOptions
  ): ForecastResult[] {
    // Calculate linear regression parameters
    const { slope, intercept } = this.linearRegression(data);

    const forecasts: ForecastResult[] = [];
    const startDate = new Date(data[data.length - 1].date);
    const daysToForecast = options.months * 30;

    // Calculate standard error for confidence intervals
    const stderr = this.calculateStandardError(data, slope, intercept);
    const zScore = this.getZScore(options.confidenceLevel);

    for (let i = 1; i <= daysToForecast; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const x = data.length + i;
      const predicted = slope * x + intercept;

      // Confidence interval widens as we forecast further
      const margin = zScore * stderr * Math.sqrt(1 + 1 / data.length + Math.pow(x - data.length / 2, 2) / this.variance(data.map((_, idx) => idx)));

      forecasts.push({
        date: date.toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        lower: Math.max(0, predicted - margin),
        upper: predicted + margin,
        confidence: Math.max(0.5, 1 - (i / daysToForecast) * 0.5), // Decreasing confidence
      });
    }

    return forecasts;
  }

  /**
   * Exponential growth forecast
   */
  private exponentialForecast(
    data: ForecastDataPoint[],
    options: ForecastOptions
  ): ForecastResult[] {
    // Transform to log space for exponential regression
    const logData = data.map((d, i) => ({
      x: i,
      y: Math.log(d.cost + 1), // Add 1 to avoid log(0)
    }));

    const { slope, intercept } = this.linearRegressionXY(logData);

    const forecasts: ForecastResult[] = [];
    const startDate = new Date(data[data.length - 1].date);
    const daysToForecast = options.months * 30;
    const zScore = this.getZScore(options.confidenceLevel);

    for (let i = 1; i <= daysToForecast; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      const x = data.length + i;
      const logPredicted = slope * x + intercept;
      const predicted = Math.exp(logPredicted) - 1;

      // Wider confidence intervals for exponential
      const margin = predicted * 0.2 * (i / 30) * (zScore / 1.96);

      forecasts.push({
        date: date.toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        lower: Math.max(0, predicted - margin),
        upper: predicted + margin,
        confidence: Math.max(0.4, 1 - (i / daysToForecast) * 0.6),
      });
    }

    return forecasts;
  }

  /**
   * Seasonal forecast with weekly patterns
   */
  private seasonalForecast(
    data: ForecastDataPoint[],
    options: ForecastOptions
  ): ForecastResult[] {
    // Calculate day-of-week seasonality
    const weekdayAverages = this.calculateWeekdayAverages(data);

    // Base trend using linear regression
    const { slope, intercept } = this.linearRegression(data);

    const forecasts: ForecastResult[] = [];
    const startDate = new Date(data[data.length - 1].date);
    const daysToForecast = options.months * 30;
    const zScore = this.getZScore(options.confidenceLevel);

    for (let i = 1; i <= daysToForecast; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dayOfWeek = date.getDay();

      const x = data.length + i;
      const basePrediction = slope * x + intercept;
      const seasonalFactor = weekdayAverages[dayOfWeek];
      const predicted = basePrediction * seasonalFactor;

      const margin = predicted * 0.15 * (zScore / 1.96);

      forecasts.push({
        date: date.toISOString().split('T')[0],
        predicted: Math.max(0, predicted),
        lower: Math.max(0, predicted - margin),
        upper: predicted + margin,
        confidence: Math.max(0.6, 1 - (i / daysToForecast) * 0.4),
      });
    }

    return forecasts;
  }

  /**
   * Auto-select best forecasting model based on data characteristics
   */
  private selectBestModel(data: ForecastDataPoint[]): 'linear' | 'exponential' | 'seasonal' {
    // Check for exponential growth
    const growthRate = this.calculateGrowthRate(data);
    if (Math.abs(growthRate) > 0.1) {
      return 'exponential';
    }

    // Check for seasonality
    const seasonality = this.detectSeasonality(data);
    if (seasonality > 0.3) {
      return 'seasonal';
    }

    // Default to linear
    return 'linear';
  }

  /**
   * Linear regression helper
   */
  private linearRegression(data: ForecastDataPoint[]): { slope: number; intercept: number } {
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    data.forEach((point, i) => {
      sumX += i;
      sumY += point.cost;
      sumXY += i * point.cost;
      sumXX += i * i;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Linear regression for x,y data
   */
  private linearRegressionXY(data: Array<{ x: number; y: number }>): { slope: number; intercept: number } {
    const n = data.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    data.forEach(point => {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumXX += point.x * point.x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Calculate standard error for confidence intervals
   */
  private calculateStandardError(data: ForecastDataPoint[], slope: number, intercept: number): number {
    const squaredErrors = data.map((point, i) => {
      const predicted = slope * i + intercept;
      return Math.pow(point.cost - predicted, 2);
    });

    const mse = squaredErrors.reduce((sum, err) => sum + err, 0) / (data.length - 2);
    return Math.sqrt(mse);
  }

  /**
   * Get Z-score for confidence level
   */
  private getZScore(confidenceLevel: number): number {
    switch (confidenceLevel) {
      case 80:
        return 1.28;
      case 90:
        return 1.645;
      case 95:
        return 1.96;
      default:
        return 1.96;
    }
  }

  /**
   * Calculate variance
   */
  private variance(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  }

  /**
   * Calculate weekday averages for seasonality
   */
  private calculateWeekdayAverages(data: ForecastDataPoint[]): number[] {
    const weekdaySums = new Array(7).fill(0);
    const weekdayCounts = new Array(7).fill(0);

    data.forEach(point => {
      const date = new Date(point.date);
      const dayOfWeek = date.getDay();
      weekdaySums[dayOfWeek] += point.cost;
      weekdayCounts[dayOfWeek]++;
    });

    const weekdayAverages = weekdaySums.map((sum, i) =>
      weekdayCounts[i] > 0 ? sum / weekdayCounts[i] : 0
    );

    // Normalize to average = 1.0
    const overallAverage = weekdayAverages.reduce((sum, val) => sum + val, 0) / 7;
    return weekdayAverages.map(val => val / overallAverage);
  }

  /**
   * Calculate growth rate
   */
  private calculateGrowthRate(data: ForecastDataPoint[]): number {
    if (data.length < 2) return 0;

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.cost, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.cost, 0) / secondHalf.length;

    return (secondAvg - firstAvg) / firstAvg;
  }

  /**
   * Detect seasonality strength
   */
  private detectSeasonality(data: ForecastDataPoint[]): number {
    const weekdayAverages = this.calculateWeekdayAverages(data);
    const variance = this.variance(weekdayAverages);
    return Math.min(variance / 0.5, 1); // Normalize to 0-1
  }

  /**
   * Calculate trend direction and percentage
   */
  private calculateTrend(
    historical: ForecastDataPoint[],
    forecasts: ForecastResult[]
  ): { direction: 'increasing' | 'decreasing' | 'stable'; percentage: number } {
    const historicalAvg = historical.reduce((sum, d) => sum + d.cost, 0) / historical.length;
    const forecastAvg = forecasts.reduce((sum, f) => sum + f.predicted, 0) / forecasts.length;

    const percentage = ((forecastAvg - historicalAvg) / historicalAvg) * 100;

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (percentage > 5) {
      direction = 'increasing';
    } else if (percentage < -5) {
      direction = 'decreasing';
    } else {
      direction = 'stable';
    }

    return { direction, percentage };
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(forecasts: ForecastResult[]): number {
    return forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length;
  }
}
