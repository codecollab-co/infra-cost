import { CostBreakdown, CloudProvider } from '../types/providers';

export interface CostDataPoint {
  timestamp: Date;
  totalCost: number;
  serviceCosts: Record<string, number>;
  metadata?: {
    provider: CloudProvider;
    region?: string;
    tags?: Record<string, string>;
  };
}

export interface ForecastConfiguration {
  // Forecasting period
  forecastDays: number;
  predictionInterval: number; // 95, 90, 80 etc.

  // Model configuration
  modelType: 'LINEAR' | 'EXPONENTIAL' | 'SEASONAL' | 'AUTO';
  seasonalityPeriod?: number; // days (e.g., 7 for weekly, 30 for monthly)

  // External factors
  includeSeasonality: boolean;
  includeBusinessEvents: boolean;
  includeGrowthTrends: boolean;

  // Data requirements
  minDataPoints: number;
  outlierThreshold: number; // standard deviations
}

export interface ForecastResult {
  // Basic forecast
  forecastedCosts: Array<{
    date: Date;
    predictedCost: number;
    lowerBound: number;
    upperBound: number;
    confidence: number;
  }>;

  // Model performance
  modelAccuracy: number; // 0-1
  meanAbsoluteError: number;
  rootMeanSquareError: number;
  rSquared: number;

  // Insights
  insights: {
    trendDirection: 'increasing' | 'decreasing' | 'stable';
    trendStrength: number; // 0-1
    seasonalPattern: boolean;
    growthRate: number; // monthly %
    volatility: number; // 0-1
    costDrivers: Array<{
      service: string;
      impactScore: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }>;
  };

  // Recommendations
  recommendations: Array<{
    type: 'BUDGET_ADJUSTMENT' | 'COST_OPTIMIZATION' | 'RESOURCE_PLANNING' | 'ALERT_THRESHOLD';
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    potentialSavings?: number;
    implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
    timeline: string;
  }>;

  // Confidence metrics
  dataQuality: {
    completeness: number; // 0-1
    consistency: number; // 0-1
    outlierCount: number;
    dataPoints: number;
    timeRange: { start: Date; end: Date };
  };
}

export interface BusinessEvent {
  name: string;
  date: Date;
  impact: 'HIGH_INCREASE' | 'MEDIUM_INCREASE' | 'LOW_INCREASE' | 'HIGH_DECREASE' | 'MEDIUM_DECREASE' | 'LOW_DECREASE';
  description: string;
  duration: number; // days
}

export class CostForecastingEngine {
  private historicalData: CostDataPoint[] = [];
  private businessEvents: BusinessEvent[] = [];
  private configuration: ForecastConfiguration;

  constructor(config: Partial<ForecastConfiguration> = {}) {
    this.configuration = {
      forecastDays: 30,
      predictionInterval: 95,
      modelType: 'AUTO',
      includeSeasonality: true,
      includeBusinessEvents: false,
      includeGrowthTrends: true,
      minDataPoints: 14,
      outlierThreshold: 2.0,
      ...config
    };
  }

  /**
   * Add historical cost data for training
   */
  addHistoricalData(data: CostDataPoint[]): void {
    this.historicalData = [...this.historicalData, ...data].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Add business events that might impact costs
   */
  addBusinessEvents(events: BusinessEvent[]): void {
    this.businessEvents = [...this.businessEvents, ...events];
  }

  /**
   * Generate cost forecast using machine learning models
   */
  async generateForecast(): Promise<ForecastResult> {
    if (this.historicalData.length < this.configuration.minDataPoints) {
      throw new Error(`Insufficient data. Need at least ${this.configuration.minDataPoints} data points, got ${this.historicalData.length}`);
    }

    // Preprocess data
    const cleanedData = this.preprocessData();

    // Select best model
    const modelType = this.configuration.modelType === 'AUTO'
      ? this.selectBestModel(cleanedData)
      : this.configuration.modelType;

    // Generate forecast based on model type
    let forecast: ForecastResult;

    switch (modelType) {
      case 'LINEAR':
        forecast = this.linearRegression(cleanedData);
        break;
      case 'EXPONENTIAL':
        forecast = this.exponentialSmoothing(cleanedData);
        break;
      case 'SEASONAL':
        forecast = this.seasonalDecomposition(cleanedData);
        break;
      default:
        forecast = this.ensembleModel(cleanedData);
    }

    // Apply business events impact if configured
    if (this.configuration.includeBusinessEvents && this.businessEvents.length > 0) {
      forecast = this.adjustForBusinessEvents(forecast);
    }

    // Generate insights and recommendations
    forecast.insights = this.generateInsights(cleanedData);
    forecast.recommendations = this.generateRecommendations(forecast, cleanedData);
    forecast.dataQuality = this.assessDataQuality(cleanedData);

    return forecast;
  }

  /**
   * Generate forecasts for individual services
   */
  async generateServiceForecasts(): Promise<Record<string, ForecastResult>> {
    const services = this.getUniqueServices();
    const serviceForecasts: Record<string, ForecastResult> = {};

    for (const service of services) {
      const serviceData = this.historicalData.map(point => ({
        ...point,
        totalCost: point.serviceCosts[service] || 0,
        serviceCosts: { [service]: point.serviceCosts[service] || 0 }
      })).filter(point => point.totalCost > 0);

      if (serviceData.length >= this.configuration.minDataPoints) {
        const engine = new CostForecastingEngine(this.configuration);
        engine.addHistoricalData(serviceData);
        serviceForecasts[service] = await engine.generateForecast();
      }
    }

    return serviceForecasts;
  }

  /**
   * Preprocess historical data
   */
  private preprocessData(): CostDataPoint[] {
    let data = [...this.historicalData];

    // Remove outliers
    data = this.removeOutliers(data);

    // Fill missing data points
    data = this.interpolateMissingData(data);

    // Smooth data if needed
    if (this.isDataNoisy(data)) {
      data = this.smoothData(data);
    }

    return data;
  }

  /**
   * Remove statistical outliers
   */
  private removeOutliers(data: CostDataPoint[]): CostDataPoint[] {
    const costs = data.map(d => d.totalCost);
    const mean = costs.reduce((a, b) => a + b, 0) / costs.length;
    const stdDev = Math.sqrt(
      costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / costs.length
    );

    const threshold = this.configuration.outlierThreshold;
    return data.filter(point =>
      Math.abs(point.totalCost - mean) <= threshold * stdDev
    );
  }

  /**
   * Interpolate missing data points
   */
  private interpolateMissingData(data: CostDataPoint[]): CostDataPoint[] {
    if (data.length < 2) return data;

    const result: CostDataPoint[] = [];
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds

    for (let i = 0; i < data.length - 1; i++) {
      result.push(data[i]);

      const currentDate = data[i].timestamp;
      const nextDate = data[i + 1].timestamp;
      const daysDiff = (nextDate.getTime() - currentDate.getTime()) / oneDay;

      // If there's a gap larger than 1 day, interpolate
      if (daysDiff > 1.5) {
        const steps = Math.floor(daysDiff);
        const costDiff = data[i + 1].totalCost - data[i].totalCost;

        for (let j = 1; j < steps; j++) {
          const interpolatedDate = new Date(currentDate.getTime() + (j * oneDay));
          const interpolatedCost = data[i].totalCost + (costDiff * j / steps);

          result.push({
            timestamp: interpolatedDate,
            totalCost: interpolatedCost,
            serviceCosts: this.interpolateServiceCosts(data[i].serviceCosts, data[i + 1].serviceCosts, j / steps),
            metadata: data[i].metadata
          });
        }
      }
    }

    result.push(data[data.length - 1]);
    return result;
  }

  /**
   * Interpolate service costs
   */
  private interpolateServiceCosts(
    start: Record<string, number>,
    end: Record<string, number>,
    ratio: number
  ): Record<string, number> {
    const result: Record<string, number> = {};
    const allServices = new Set([...Object.keys(start), ...Object.keys(end)]);

    for (const service of allServices) {
      const startCost = start[service] || 0;
      const endCost = end[service] || 0;
      result[service] = startCost + (endCost - startCost) * ratio;
    }

    return result;
  }

  /**
   * Check if data is noisy
   */
  private isDataNoisy(data: CostDataPoint[]): boolean {
    if (data.length < 3) return false;

    const changes = data.slice(1).map((point, i) =>
      Math.abs(point.totalCost - data[i].totalCost) / data[i].totalCost
    );

    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    return avgChange > 0.2; // 20% average change indicates noise
  }

  /**
   * Smooth data using moving average
   */
  private smoothData(data: CostDataPoint[], windowSize: number = 3): CostDataPoint[] {
    if (data.length <= windowSize) return data;

    const result: CostDataPoint[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < Math.floor(windowSize / 2) || i >= data.length - Math.floor(windowSize / 2)) {
        result.push(data[i]);
      } else {
        const start = i - Math.floor(windowSize / 2);
        const end = start + windowSize;
        const window = data.slice(start, end);

        const avgCost = window.reduce((sum, p) => sum + p.totalCost, 0) / window.length;
        const avgServices = this.averageServiceCosts(window.map(p => p.serviceCosts));

        result.push({
          timestamp: data[i].timestamp,
          totalCost: avgCost,
          serviceCosts: avgServices,
          metadata: data[i].metadata
        });
      }
    }

    return result;
  }

  /**
   * Average service costs across multiple data points
   */
  private averageServiceCosts(serviceCostsArray: Record<string, number>[]): Record<string, number> {
    const result: Record<string, number> = {};
    const allServices = new Set(serviceCostsArray.flatMap(sc => Object.keys(sc)));

    for (const service of allServices) {
      const costs = serviceCostsArray.map(sc => sc[service] || 0);
      result[service] = costs.reduce((a, b) => a + b, 0) / costs.length;
    }

    return result;
  }

  /**
   * Select the best forecasting model based on data characteristics
   */
  private selectBestModel(data: CostDataPoint[]): 'LINEAR' | 'EXPONENTIAL' | 'SEASONAL' {
    // Test different models and select best performing one
    const models = ['LINEAR', 'EXPONENTIAL', 'SEASONAL'] as const;
    const scores: Record<string, number> = {};

    // Use cross-validation to score models
    const trainSize = Math.floor(data.length * 0.8);
    const trainData = data.slice(0, trainSize);
    const testData = data.slice(trainSize);

    for (const modelType of models) {
      let prediction: ForecastResult;

      const tempEngine = new CostForecastingEngine({
        ...this.configuration,
        modelType,
        forecastDays: testData.length
      });
      tempEngine.addHistoricalData(trainData);

      try {
        switch (modelType) {
          case 'LINEAR':
            prediction = this.linearRegression(trainData);
            break;
          case 'EXPONENTIAL':
            prediction = this.exponentialSmoothing(trainData);
            break;
          case 'SEASONAL':
            prediction = this.seasonalDecomposition(trainData);
            break;
        }

        // Calculate accuracy against test data
        scores[modelType] = this.calculateAccuracy(prediction.forecastedCosts, testData);
      } catch (error) {
        scores[modelType] = 0; // Model failed
      }
    }

    // Return model with highest score
    const bestModel = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];
    return bestModel as 'LINEAR' | 'EXPONENTIAL' | 'SEASONAL';
  }

  /**
   * Calculate forecast accuracy
   */
  private calculateAccuracy(
    predictions: Array<{ date: Date; predictedCost: number }>,
    actual: CostDataPoint[]
  ): number {
    if (predictions.length === 0 || actual.length === 0) return 0;

    const errors = predictions.map((pred, i) => {
      if (i >= actual.length) return 0;
      return Math.abs(pred.predictedCost - actual[i].totalCost) / actual[i].totalCost;
    });

    const mape = errors.reduce((a, b) => a + b, 0) / errors.length;
    return Math.max(0, 1 - mape); // Convert MAPE to accuracy
  }

  /**
   * Linear regression forecasting
   */
  private linearRegression(data: CostDataPoint[]): ForecastResult {
    const n = data.length;
    const x = data.map((_, i) => i);
    const y = data.map(d => d.totalCost);

    // Calculate linear regression coefficients
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => sum + Math.pow(yi - (slope * i + intercept), 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    // Generate forecasted values
    const forecastedCosts = [];
    const lastIndex = n - 1;

    for (let i = 1; i <= this.configuration.forecastDays; i++) {
      const futureIndex = lastIndex + i;
      const predictedCost = slope * futureIndex + intercept;
      const standardError = Math.sqrt(ssResidual / (n - 2));
      const tValue = this.getTValue(this.configuration.predictionInterval, n - 2);
      const margin = tValue * standardError * Math.sqrt(1 + 1/n + Math.pow(futureIndex - sumX/n, 2) / (sumXX - sumX*sumX/n));

      const futureDate = new Date(data[data.length - 1].timestamp);
      futureDate.setDate(futureDate.getDate() + i);

      forecastedCosts.push({
        date: futureDate,
        predictedCost: Math.max(0, predictedCost),
        lowerBound: Math.max(0, predictedCost - margin),
        upperBound: predictedCost + margin,
        confidence: this.configuration.predictionInterval / 100
      });
    }

    // Calculate error metrics
    const predictions = y.map((_, i) => slope * i + intercept);
    const mae = y.reduce((sum, actual, i) => sum + Math.abs(actual - predictions[i]), 0) / n;
    const rmse = Math.sqrt(y.reduce((sum, actual, i) => sum + Math.pow(actual - predictions[i], 2), 0) / n);

    return {
      forecastedCosts,
      modelAccuracy: Math.max(0, rSquared),
      meanAbsoluteError: mae,
      rootMeanSquareError: rmse,
      rSquared,
      insights: {
        trendDirection: 'stable',
        trendStrength: 0,
        seasonalPattern: false,
        growthRate: 0,
        volatility: 0,
        costDrivers: []
      },
      recommendations: [],
      dataQuality: {
        completeness: 0,
        consistency: 0,
        outlierCount: 0,
        dataPoints: 0
      }
    };
  }

  /**
   * Exponential smoothing forecasting
   */
  private exponentialSmoothing(data: CostDataPoint[]): ForecastResult {
    const alpha = 0.3; // Smoothing parameter
    const beta = 0.3;  // Trend parameter

    const costs = data.map(d => d.totalCost);
    const n = costs.length;

    // Initialize
    let level = costs[0];
    let trend = costs[1] - costs[0];
    const smoothedValues: number[] = [costs[0]];

    // Apply exponential smoothing
    for (let i = 1; i < n; i++) {
      const prevLevel = level;
      level = alpha * costs[i] + (1 - alpha) * (level + trend);
      trend = beta * (level - prevLevel) + (1 - beta) * trend;
      smoothedValues.push(level);
    }

    // Generate forecasts
    const forecastedCosts = [];
    let currentLevel = level;
    let currentTrend = trend;

    for (let i = 1; i <= this.configuration.forecastDays; i++) {
      const predictedCost = currentLevel + (i * currentTrend);

      // Calculate prediction intervals (simplified)
      const variance = costs.reduce((sum, cost, idx) =>
        sum + Math.pow(cost - smoothedValues[idx], 2), 0) / (n - 1);
      const standardError = Math.sqrt(variance * (1 + Math.pow(i, 2) * 0.1)); // Simplified
      const margin = this.getTValue(this.configuration.predictionInterval, n - 2) * standardError;

      const futureDate = new Date(data[data.length - 1].timestamp);
      futureDate.setDate(futureDate.getDate() + i);

      forecastedCosts.push({
        date: futureDate,
        predictedCost: Math.max(0, predictedCost),
        lowerBound: Math.max(0, predictedCost - margin),
        upperBound: predictedCost + margin,
        confidence: this.configuration.predictionInterval / 100
      });
    }

    // Calculate metrics
    const mae = costs.reduce((sum, actual, i) =>
      sum + Math.abs(actual - smoothedValues[i]), 0) / n;
    const rmse = Math.sqrt(costs.reduce((sum, actual, i) =>
      sum + Math.pow(actual - smoothedValues[i], 2), 0) / n);

    const yMean = costs.reduce((a, b) => a + b, 0) / n;
    const ssTotal = costs.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = costs.reduce((sum, actual, i) => sum + Math.pow(actual - smoothedValues[i], 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    return {
      forecastedCosts,
      modelAccuracy: Math.max(0, rSquared),
      meanAbsoluteError: mae,
      rootMeanSquareError: rmse,
      rSquared,
      insights: {
        trendDirection: 'stable',
        trendStrength: 0,
        seasonalPattern: false,
        growthRate: 0,
        volatility: 0,
        costDrivers: []
      },
      recommendations: [],
      dataQuality: {
        completeness: 0,
        consistency: 0,
        outlierCount: 0,
        dataPoints: 0
      }
    };
  }

  /**
   * Seasonal decomposition forecasting
   */
  private seasonalDecomposition(data: CostDataPoint[]): ForecastResult {
    const seasonalPeriod = this.configuration.seasonalityPeriod || 7; // Weekly by default
    const costs = data.map(d => d.totalCost);
    const n = costs.length;

    if (n < seasonalPeriod * 2) {
      // Fall back to exponential smoothing if not enough data
      return this.exponentialSmoothing(data);
    }

    // Calculate seasonal components
    const seasonal: number[] = new Array(seasonalPeriod).fill(0);
    const seasonalCounts: number[] = new Array(seasonalPeriod).fill(0);

    // Calculate averages for each period
    for (let i = 0; i < n; i++) {
      const seasonIndex = i % seasonalPeriod;
      seasonal[seasonIndex] += costs[i];
      seasonalCounts[seasonIndex]++;
    }

    for (let i = 0; i < seasonalPeriod; i++) {
      if (seasonalCounts[i] > 0) {
        seasonal[i] /= seasonalCounts[i];
      }
    }

    const overallMean = costs.reduce((a, b) => a + b, 0) / n;
    const seasonalFactors = seasonal.map(s => s / overallMean);

    // Deseasonalize data
    const deseasonalized = costs.map((cost, i) => {
      const seasonIndex = i % seasonalPeriod;
      return cost / seasonalFactors[seasonIndex];
    });

    // Apply trend to deseasonalized data
    const x = deseasonalized.map((_, i) => i);
    const y = deseasonalized;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate forecasts
    const forecastedCosts = [];

    for (let i = 1; i <= this.configuration.forecastDays; i++) {
      const futureIndex = n + i - 1;
      const seasonIndex = futureIndex % seasonalPeriod;
      const trendValue = slope * futureIndex + intercept;
      const predictedCost = trendValue * seasonalFactors[seasonIndex];

      const futureDate = new Date(data[data.length - 1].timestamp);
      futureDate.setDate(futureDate.getDate() + i);

      // Simplified confidence intervals
      const variance = deseasonalized.reduce((sum, val, idx) =>
        sum + Math.pow(val - (slope * idx + intercept), 2), 0) / (n - 2);
      const standardError = Math.sqrt(variance) * seasonalFactors[seasonIndex];
      const margin = this.getTValue(this.configuration.predictionInterval, n - 2) * standardError;

      forecastedCosts.push({
        date: futureDate,
        predictedCost: Math.max(0, predictedCost),
        lowerBound: Math.max(0, predictedCost - margin),
        upperBound: predictedCost + margin,
        confidence: this.configuration.predictionInterval / 100
      });
    }

    // Calculate metrics
    const predictions = x.map(xi => (slope * xi + intercept) * seasonalFactors[xi % seasonalPeriod]);
    const mae = costs.reduce((sum, actual, i) => sum + Math.abs(actual - predictions[i]), 0) / n;
    const rmse = Math.sqrt(costs.reduce((sum, actual, i) => sum + Math.pow(actual - predictions[i], 2), 0) / n);

    const yMean = costs.reduce((a, b) => a + b, 0) / n;
    const ssTotal = costs.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = costs.reduce((sum, actual, i) => sum + Math.pow(actual - predictions[i], 2), 0);
    const rSquared = 1 - (ssResidual / ssTotal);

    return {
      forecastedCosts,
      modelAccuracy: Math.max(0, rSquared),
      meanAbsoluteError: mae,
      rootMeanSquareError: rmse,
      rSquared,
      insights: {
        trendDirection: 'stable',
        trendStrength: 0,
        seasonalPattern: false,
        growthRate: 0,
        volatility: 0,
        costDrivers: []
      },
      recommendations: [],
      dataQuality: {
        completeness: 0,
        consistency: 0,
        outlierCount: 0,
        dataPoints: 0
      }
    };
  }

  /**
   * Ensemble model combining multiple approaches
   */
  private ensembleModel(data: CostDataPoint[]): ForecastResult {
    // Generate forecasts from all models
    const linearForecast = this.linearRegression(data);
    const exponentialForecast = this.exponentialSmoothing(data);
    const seasonalForecast = this.seasonalDecomposition(data);

    // Weight models based on their accuracy
    const totalAccuracy = linearForecast.modelAccuracy +
                         exponentialForecast.modelAccuracy +
                         seasonalForecast.modelAccuracy;

    const linearWeight = totalAccuracy > 0 ? linearForecast.modelAccuracy / totalAccuracy : 0.33;
    const exponentialWeight = totalAccuracy > 0 ? exponentialForecast.modelAccuracy / totalAccuracy : 0.33;
    const seasonalWeight = totalAccuracy > 0 ? seasonalForecast.modelAccuracy / totalAccuracy : 0.34;

    // Combine forecasts
    const forecastedCosts = linearForecast.forecastedCosts.map((_, i) => {
      const linearPoint = linearForecast.forecastedCosts[i];
      const exponentialPoint = exponentialForecast.forecastedCosts[i];
      const seasonalPoint = seasonalForecast.forecastedCosts[i];

      const weightedPrediction =
        linearPoint.predictedCost * linearWeight +
        exponentialPoint.predictedCost * exponentialWeight +
        seasonalPoint.predictedCost * seasonalWeight;

      const weightedLowerBound =
        linearPoint.lowerBound * linearWeight +
        exponentialPoint.lowerBound * exponentialWeight +
        seasonalPoint.lowerBound * seasonalWeight;

      const weightedUpperBound =
        linearPoint.upperBound * linearWeight +
        exponentialPoint.upperBound * exponentialWeight +
        seasonalPoint.upperBound * seasonalWeight;

      return {
        date: linearPoint.date,
        predictedCost: weightedPrediction,
        lowerBound: weightedLowerBound,
        upperBound: weightedUpperBound,
        confidence: (linearPoint.confidence + exponentialPoint.confidence + seasonalPoint.confidence) / 3
      };
    });

    // Combine metrics
    const combinedAccuracy = (linearForecast.modelAccuracy + exponentialForecast.modelAccuracy + seasonalForecast.modelAccuracy) / 3;
    const combinedMAE = (linearForecast.meanAbsoluteError + exponentialForecast.meanAbsoluteError + seasonalForecast.meanAbsoluteError) / 3;
    const combinedRMSE = (linearForecast.rootMeanSquareError + exponentialForecast.rootMeanSquareError + seasonalForecast.rootMeanSquareError) / 3;
    const combinedRSquared = (linearForecast.rSquared + exponentialForecast.rSquared + seasonalForecast.rSquared) / 3;

    return {
      forecastedCosts,
      modelAccuracy: combinedAccuracy,
      meanAbsoluteError: combinedMAE,
      rootMeanSquareError: combinedRMSE,
      rSquared: combinedRSquared,
      insights: {
        trendDirection: 'stable',
        trendStrength: 0,
        seasonalPattern: false,
        growthRate: 0,
        volatility: 0,
        costDrivers: []
      },
      recommendations: [],
      dataQuality: {
        completeness: 0,
        consistency: 0,
        outlierCount: 0,
        dataPoints: 0
      }
    };
  }

  /**
   * Adjust forecast for known business events
   */
  private adjustForBusinessEvents(forecast: ForecastResult): ForecastResult {
    const adjustedForecast = { ...forecast };

    adjustedForecast.forecastedCosts = forecast.forecastedCosts.map(point => {
      let adjustmentFactor = 1.0;

      // Check if any business events affect this date
      this.businessEvents.forEach(event => {
        const eventStart = event.date;
        const eventEnd = new Date(eventStart);
        eventEnd.setDate(eventEnd.getDate() + event.duration);

        if (point.date >= eventStart && point.date <= eventEnd) {
          const impact = this.getEventImpactFactor(event.impact);
          adjustmentFactor *= impact;
        }
      });

      return {
        ...point,
        predictedCost: point.predictedCost * adjustmentFactor,
        lowerBound: point.lowerBound * adjustmentFactor,
        upperBound: point.upperBound * adjustmentFactor
      };
    });

    return adjustedForecast;
  }

  /**
   * Get numeric impact factor for business events
   */
  private getEventImpactFactor(impact: BusinessEvent['impact']): number {
    const impactMap = {
      HIGH_INCREASE: 1.5,
      MEDIUM_INCREASE: 1.25,
      LOW_INCREASE: 1.1,
      HIGH_DECREASE: 0.5,
      MEDIUM_DECREASE: 0.75,
      LOW_DECREASE: 0.9
    };

    return impactMap[impact] || 1.0;
  }

  /**
   * Generate insights from forecast
   */
  private generateInsights(data: CostDataPoint[]): ForecastResult['insights'] {
    const costs = data.map(d => d.totalCost);
    const n = costs.length;

    // Calculate trend
    const firstHalf = costs.slice(0, Math.floor(n / 2));
    const secondHalf = costs.slice(Math.floor(n / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const growthRate = ((secondAvg - firstAvg) / firstAvg) * 100;

    let trendDirection: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(growthRate) < 5) {
      trendDirection = 'stable';
    } else if (growthRate > 0) {
      trendDirection = 'increasing';
    } else {
      trendDirection = 'decreasing';
    }

    const trendStrength = Math.min(1, Math.abs(growthRate) / 50);

    // Calculate volatility
    const mean = costs.reduce((a, b) => a + b, 0) / n;
    const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / n;
    const volatility = Math.sqrt(variance) / mean;

    // Detect seasonality
    const seasonalPattern = this.detectSeasonality(costs);

    // Analyze cost drivers
    const costDrivers = this.analyzeCostDrivers(data);

    return {
      trendDirection,
      trendStrength,
      seasonalPattern,
      growthRate,
      volatility: Math.min(1, volatility),
      costDrivers
    };
  }

  /**
   * Detect seasonal patterns
   */
  private detectSeasonality(costs: number[]): boolean {
    if (costs.length < 14) return false; // Need at least 2 weeks of data

    // Simple autocorrelation check for weekly pattern
    const weeklyCorrelation = this.calculateAutocorrelation(costs, 7);
    return weeklyCorrelation > 0.3; // Threshold for seasonal pattern
  }

  /**
   * Calculate autocorrelation at given lag
   */
  private calculateAutocorrelation(data: number[], lag: number): number {
    if (data.length <= lag) return 0;

    const n = data.length - lag;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean);
    }

    for (let i = 0; i < data.length; i++) {
      denominator += Math.pow(data[i] - mean, 2);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Analyze cost drivers by service
   */
  private analyzeCostDrivers(data: CostDataPoint[]): Array<{
    service: string;
    impactScore: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }> {
    const services = this.getUniqueServices();
    const costDrivers: Array<{
      service: string;
      impactScore: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }> = [];

    services.forEach(service => {
      const serviceCosts = data.map(d => d.serviceCosts[service] || 0);
      const totalServiceCost = serviceCosts.reduce((a, b) => a + b, 0);
      const totalCost = data.reduce((sum, d) => sum + d.totalCost, 0);

      const impactScore = totalServiceCost / totalCost;

      // Calculate trend for this service
      const n = serviceCosts.length;
      const firstHalf = serviceCosts.slice(0, Math.floor(n / 2));
      const secondHalf = serviceCosts.slice(Math.floor(n / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 0;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length || 0;

      let trend: 'increasing' | 'decreasing' | 'stable';
      if (firstAvg === 0) {
        trend = secondAvg > 0 ? 'increasing' : 'stable';
      } else {
        const change = (secondAvg - firstAvg) / firstAvg;
        if (Math.abs(change) < 0.1) {
          trend = 'stable';
        } else if (change > 0) {
          trend = 'increasing';
        } else {
          trend = 'decreasing';
        }
      }

      if (impactScore > 0.01) { // Only include services with >1% impact
        costDrivers.push({ service, impactScore, trend });
      }
    });

    return costDrivers.sort((a, b) => b.impactScore - a.impactScore).slice(0, 10);
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    forecast: ForecastResult,
    data: CostDataPoint[]
  ): ForecastResult['recommendations'] {
    const recommendations: ForecastResult['recommendations'] = [];

    // Budget recommendations
    const currentMonthlyAvg = data.slice(-30).reduce((sum, d) => sum + d.totalCost, 0) / Math.min(30, data.length);
    const forecastedMonthlyAvg = forecast.forecastedCosts.slice(0, 30).reduce((sum, d) => sum + d.predictedCost, 0) / 30;

    if (forecastedMonthlyAvg > currentMonthlyAvg * 1.2) {
      recommendations.push({
        type: 'BUDGET_ADJUSTMENT',
        title: 'Increase Monthly Budget',
        description: `Forecasted costs are 20% higher than current average. Consider increasing budget by $${(forecastedMonthlyAvg - currentMonthlyAvg).toFixed(2)} per month.`,
        priority: 'HIGH',
        implementationEffort: 'LOW',
        timeline: 'Immediate'
      });
    }

    // Cost optimization recommendations
    if (forecast.insights && forecast.insights.volatility > 0.3) {
      recommendations.push({
        type: 'COST_OPTIMIZATION',
        title: 'Investigate Cost Volatility',
        description: 'High cost volatility detected. Review resource scaling policies and usage patterns.',
        priority: 'MEDIUM',
        implementationEffort: 'MEDIUM',
        timeline: '1-2 weeks'
      });
    }

    // Resource planning recommendations
    if (forecast.insights && forecast.insights.trendDirection === 'increasing') {
      const projectedIncrease = forecastedMonthlyAvg - currentMonthlyAvg;
      recommendations.push({
        type: 'RESOURCE_PLANNING',
        title: 'Plan for Growing Infrastructure',
        description: `Upward cost trend detected. Plan for ${forecast.insights.growthRate.toFixed(1)}% monthly growth.`,
        priority: 'MEDIUM',
        potentialSavings: projectedIncrease * 0.15, // 15% savings from proper planning
        implementationEffort: 'HIGH',
        timeline: '2-4 weeks'
      });
    }

    // Alert threshold recommendations
    const upperBoundMax = Math.max(...forecast.forecastedCosts.map(f => f.upperBound));
    recommendations.push({
      type: 'ALERT_THRESHOLD',
      title: 'Update Alert Thresholds',
      description: `Set cost alert threshold to $${upperBoundMax.toFixed(2)} based on forecast upper bound.`,
      priority: 'LOW',
      implementationEffort: 'LOW',
      timeline: 'Immediate'
    });

    return recommendations;
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(data: CostDataPoint[]): ForecastResult['dataQuality'] {
    const totalDays = data.length;
    const dateRange = {
      start: data[0].timestamp,
      end: data[data.length - 1].timestamp
    };

    // Calculate expected data points
    const daysDiff = (dateRange.end.getTime() - dateRange.start.getTime()) / (24 * 60 * 60 * 1000);
    const expectedPoints = Math.floor(daysDiff) + 1;
    const completeness = Math.min(1, totalDays / expectedPoints);

    // Calculate consistency (fewer gaps = higher consistency)
    let gaps = 0;
    for (let i = 1; i < data.length; i++) {
      const daysBetween = (data[i].timestamp.getTime() - data[i-1].timestamp.getTime()) / (24 * 60 * 60 * 1000);
      if (daysBetween > 1.5) {
        gaps++;
      }
    }
    const consistency = Math.max(0, 1 - (gaps / totalDays));

    // Count outliers
    const costs = data.map(d => d.totalCost);
    const mean = costs.reduce((a, b) => a + b, 0) / costs.length;
    const stdDev = Math.sqrt(costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / costs.length);
    const outlierCount = costs.filter(cost =>
      Math.abs(cost - mean) > this.configuration.outlierThreshold * stdDev
    ).length;

    return {
      completeness,
      consistency,
      outlierCount,
      dataPoints: totalDays,
      timeRange: dateRange
    };
  }

  /**
   * Get unique services from historical data
   */
  private getUniqueServices(): string[] {
    const services = new Set<string>();
    this.historicalData.forEach(point => {
      Object.keys(point.serviceCosts).forEach(service => services.add(service));
    });
    return Array.from(services);
  }

  /**
   * Get t-value for confidence intervals
   */
  private getTValue(confidenceLevel: number, degreesOfFreedom: number): number {
    // Simplified t-values for common confidence levels
    const tTable: Record<string, number> = {
      '80': 1.282,
      '90': 1.645,
      '95': 1.96,
      '99': 2.576
    };

    // Adjust for small sample sizes
    let tValue = tTable[confidenceLevel.toString()] || 1.96;
    if (degreesOfFreedom < 30) {
      tValue *= 1.2; // Rough adjustment for small samples
    }

    return tValue;
  }

  /**
   * Convert cost breakdown to historical data format
   */
  static convertFromCostBreakdown(
    costBreakdowns: Array<{ date: Date; breakdown: CostBreakdown }>,
    provider: CloudProvider
  ): CostDataPoint[] {
    return costBreakdowns.map(({ date, breakdown }) => ({
      timestamp: date,
      totalCost: breakdown.totals.thisMonth || breakdown.totals.last7Days || 0,
      serviceCosts: breakdown.totalsByService.thisMonth || breakdown.totalsByService.last7Days || {},
      metadata: {
        provider,
        region: 'unknown'
      }
    }));
  }
}