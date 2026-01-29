// @ts-nocheck
import { jest } from '@jest/globals';
import { AnomalyDetector } from '../../../src/analytics/anomaly-detector.js';

describe('AnomalyDetector', () => {
  let anomalyDetector: AnomalyDetector;

  beforeEach(() => {
    anomalyDetector = new AnomalyDetector({
      sensitivity: 0.8,
      minDataPoints: 30,
      seasonalityWindow: 7
    });
  });

  describe('detectAnomalies', () => {
    it('should detect cost anomalies in time series data', async () => {
      const mockCostData = [
        { timestamp: '2023-01-01', cost: 100, service: 'EC2' },
        { timestamp: '2023-01-02', cost: 105, service: 'EC2' },
        { timestamp: '2023-01-03', cost: 102, service: 'EC2' },
        { timestamp: '2023-01-04', cost: 500, service: 'EC2' }, // Anomaly
        { timestamp: '2023-01-05', cost: 98, service: 'EC2' },
        { timestamp: '2023-01-06', cost: 101, service: 'EC2' }
      ];

      const result = await anomalyDetector.detectAnomalies(mockCostData);

      expect(result.anomalies).toHaveLength(1);
      expect(result.anomalies[0]).toEqual(expect.objectContaining({
        timestamp: '2023-01-04',
        cost: 500,
        service: 'EC2',
        severity: expect.any(String),
        deviationScore: expect.any(Number),
        expectedRange: expect.objectContaining({
          min: expect.any(Number),
          max: expect.any(Number)
        })
      }));
    });

    it('should calculate statistical metrics correctly', async () => {
      const mockCostData = [
        { timestamp: '2023-01-01', cost: 100, service: 'EC2' },
        { timestamp: '2023-01-02', cost: 110, service: 'EC2' },
        { timestamp: '2023-01-03', cost: 95, service: 'EC2' },
        { timestamp: '2023-01-04', cost: 105, service: 'EC2' }
      ];

      const result = await anomalyDetector.detectAnomalies(mockCostData);

      expect(result.statistics).toEqual(expect.objectContaining({
        mean: expect.any(Number),
        standardDeviation: expect.any(Number),
        variance: expect.any(Number),
        totalDataPoints: 4,
        anomalyCount: expect.any(Number)
      }));
    });

    it('should handle seasonal patterns', async () => {
      const mockSeasonalData = Array.from({ length: 21 }, (_, i) => ({
        timestamp: `2023-01-${String(i + 1).padStart(2, '0')}`,
        cost: 100 + (i % 7 === 0 ? 50 : 0), // Weekly spike pattern
        service: 'EC2'
      }));

      const result = await anomalyDetector.detectAnomalies(mockSeasonalData);

      // Should recognize weekly spikes as normal pattern, not anomalies
      expect(result.seasonalityDetected).toBe(true);
      expect(result.pattern?.type).toBe('weekly');
    });

    it('should classify anomaly severity correctly', async () => {
      const mockData = [
        { timestamp: '2023-01-01', cost: 100, service: 'EC2' },
        { timestamp: '2023-01-02', cost: 100, service: 'EC2' },
        { timestamp: '2023-01-03', cost: 150, service: 'EC2' }, // Minor
        { timestamp: '2023-01-04', cost: 250, service: 'EC2' }, // Major
        { timestamp: '2023-01-05', cost: 500, service: 'EC2' }, // Critical
      ];

      const result = await anomalyDetector.detectAnomalies(mockData);

      const severities = result.anomalies.map(a => a.severity);
      expect(severities).toContain('minor');
      expect(severities).toContain('major');
      expect(severities).toContain('critical');
    });
  });

  describe('analyzeUsagePatterns', () => {
    it('should identify usage trends', async () => {
      const mockUsageData = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(2023, 0, i + 1).toISOString().split('T')[0],
        usage: 100 + i * 2, // Increasing trend
        resource: 'instances'
      }));

      const result = await anomalyDetector.analyzeUsagePatterns(mockUsageData);

      expect(result.trend).toBe('increasing');
      expect(result.trendStrength).toBeGreaterThan(0.8);
      expect(result.growthRate).toBeGreaterThan(0);
    });

    it('should detect cyclic patterns', async () => {
      const mockCyclicData = Array.from({ length: 28 }, (_, i) => ({
        timestamp: new Date(2023, 0, i + 1).toISOString().split('T')[0],
        usage: 100 + Math.sin(i * 2 * Math.PI / 7) * 30, // Weekly cycle
        resource: 'cpu'
      }));

      const result = await anomalyDetector.analyzeUsagePatterns(mockCyclicData);

      expect(result.cyclicPattern).toBe(true);
      expect(result.cycleLength).toBe(7);
    });
  });

  describe('predictFutureCosts', () => {
    it('should generate cost predictions', async () => {
      const mockHistoricalData = Array.from({ length: 30 }, (_, i) => ({
        timestamp: new Date(2023, 0, i + 1).toISOString().split('T')[0],
        cost: 100 + Math.random() * 20,
        service: 'EC2'
      }));

      const result = await anomalyDetector.predictFutureCosts(mockHistoricalData, 7);

      expect(result.predictions).toHaveLength(7);
      expect(result.predictions[0]).toEqual(expect.objectContaining({
        timestamp: expect.any(String),
        predictedCost: expect.any(Number),
        confidenceInterval: expect.objectContaining({
          lower: expect.any(Number),
          upper: expect.any(Number)
        }),
        confidence: expect.any(Number)
      }));
    });

    it('should include uncertainty in predictions', async () => {
      const mockVolatileData = Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date(2023, 0, i + 1).toISOString().split('T')[0],
        cost: 100 + (Math.random() - 0.5) * 100, // High volatility
        service: 'EC2'
      }));

      const result = await anomalyDetector.predictFutureCosts(mockVolatileData, 5);

      result.predictions.forEach(prediction => {
        expect(prediction.confidence).toBeLessThan(0.9); // Lower confidence for volatile data
        expect(prediction.confidenceInterval.upper - prediction.confidenceInterval.lower)
          .toBeGreaterThan(50); // Wide confidence interval
      });
    });
  });

  describe('generateAlerts', () => {
    it('should generate alerts for detected anomalies', async () => {
      const mockAnomalies = [{
        timestamp: '2023-01-04',
        cost: 500,
        service: 'EC2',
        severity: 'critical' as const,
        deviationScore: 5.2,
        expectedRange: { min: 80, max: 120 }
      }];

      const result = await anomalyDetector.generateAlerts(mockAnomalies);

      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0]).toEqual(expect.objectContaining({
        id: expect.any(String),
        type: 'cost_anomaly',
        severity: 'critical',
        title: expect.any(String),
        description: expect.any(String),
        timestamp: expect.any(String),
        data: expect.objectContaining({
          service: 'EC2',
          actualCost: 500,
          expectedRange: { min: 80, max: 120 }
        }),
        actions: expect.any(Array)
      }));
    });

    it('should suggest appropriate actions based on anomaly type', async () => {
      const mockBudgetAnomaly = [{
        timestamp: '2023-01-15',
        cost: 1500,
        service: 'EC2',
        severity: 'major' as const,
        deviationScore: 3.5,
        expectedRange: { min: 800, max: 1200 }
      }];

      const result = await anomalyDetector.generateAlerts(mockBudgetAnomaly);

      expect(result.alerts[0].actions).toContain('Review EC2 instance usage');
      expect(result.alerts[0].actions).toContain('Check for unscheduled scaling events');
    });
  });

  describe('analyzeCostDrivers', () => {
    it('should identify primary cost drivers', async () => {
      const mockServiceData = [
        { service: 'EC2', cost: 500, usage: 100 },
        { service: 'RDS', cost: 300, usage: 50 },
        { service: 'S3', cost: 50, usage: 1000 },
        { service: 'Lambda', cost: 25, usage: 10000 }
      ];

      const result = await anomalyDetector.analyzeCostDrivers(mockServiceData);

      expect(result.topDrivers).toHaveLength(4);
      expect(result.topDrivers[0]).toEqual(expect.objectContaining({
        service: 'EC2',
        costContribution: expect.any(Number),
        efficiencyScore: expect.any(Number),
        trend: expect.any(String)
      }));
    });

    it('should calculate cost efficiency metrics', async () => {
      const mockServiceData = [
        { service: 'EC2', cost: 1000, usage: 100 }, // High cost per unit
        { service: 'S3', cost: 100, usage: 10000 }  // Low cost per unit
      ];

      const result = await anomalyDetector.analyzeCostDrivers(mockServiceData);

      const ec2Driver = result.topDrivers.find(d => d.service === 'EC2');
      const s3Driver = result.topDrivers.find(d => d.service === 'S3');

      expect(ec2Driver?.efficiencyScore).toBeLessThan(s3Driver?.efficiencyScore);
    });
  });

  describe('configuration', () => {
    it('should apply custom sensitivity settings', async () => {
      const highSensitivityDetector = new AnomalyDetector({
        sensitivity: 0.95,
        minDataPoints: 10
      });

      const lowSensitivityDetector = new AnomalyDetector({
        sensitivity: 0.5,
        minDataPoints: 10
      });

      const mockData = [
        { timestamp: '2023-01-01', cost: 100, service: 'EC2' },
        { timestamp: '2023-01-02', cost: 100, service: 'EC2' },
        { timestamp: '2023-01-03', cost: 130, service: 'EC2' } // Minor deviation
      ];

      const highSensitivityResult = await highSensitivityDetector.detectAnomalies(mockData);
      const lowSensitivityResult = await lowSensitivityDetector.detectAnomalies(mockData);

      expect(highSensitivityResult.anomalies.length)
        .toBeGreaterThanOrEqual(lowSensitivityResult.anomalies.length);
    });

    it('should respect minimum data points requirement', async () => {
      const strictDetector = new AnomalyDetector({
        minDataPoints: 50
      });

      const mockData = Array.from({ length: 30 }, (_, i) => ({
        timestamp: `2023-01-${String(i + 1).padStart(2, '0')}`,
        cost: 100,
        service: 'EC2'
      }));

      const result = await strictDetector.detectAnomalies(mockData);

      expect(result.error).toContain('Insufficient data points');
    });
  });
});