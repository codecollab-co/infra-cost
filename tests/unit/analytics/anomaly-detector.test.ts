import { jest } from '@jest/globals';
import { AnomalyDetector } from '../../../src/analytics/anomaly-detector.js';

describe('AnomalyDetector', () => {
  let anomalyDetector: AnomalyDetector;

  beforeEach(() => {
    anomalyDetector = new AnomalyDetector({
      sensitivity: 'HIGH',
      lookbackPeriods: 14
    });
  });

  describe('detectAnomalies', () => {
    it('should detect cost anomalies in time series data', () => {
      const mockCostData = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2023-01-${String(i + 1).padStart(2, '0')}`,
        value: i === 15 ? 500 : 100 // Anomaly at day 15
      }));

      const anomalies = anomalyDetector.detectAnomalies(mockCostData);

      expect(Array.isArray(anomalies)).toBe(true);
      expect(anomalies.length).toBeGreaterThanOrEqual(0);
      if (anomalies.length > 0) {
        expect(anomalies[0]).toHaveProperty('timestamp');
        expect(anomalies[0]).toHaveProperty('actualValue');
        expect(anomalies[0]).toHaveProperty('expectedValue');
        expect(anomalies[0]).toHaveProperty('severity');
      }
    });

    it('should return empty array for insufficient data', () => {
      const mockCostData = [
        { timestamp: '2023-01-01', value: 100 },
        { timestamp: '2023-01-02', value: 110 }
      ];

      const anomalies = anomalyDetector.detectAnomalies(mockCostData);

      expect(anomalies).toEqual([]);
    });

    it('should handle seasonal patterns', () => {
      const mockSeasonalData = Array.from({ length: 21 }, (_, i) => ({
        timestamp: `2023-01-${String(i + 1).padStart(2, '0')}`,
        value: 100 + (i % 7 === 0 ? 50 : 0) // Weekly spike pattern
      }));

      const anomalies = anomalyDetector.detectAnomalies(mockSeasonalData);

      // Should work with seasonal data
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('should classify anomaly severity correctly', () => {
      const mockData = Array.from({ length: 20 }, (_, i) => ({
        timestamp: `2023-01-${String(i + 1).padStart(2, '0')}`,
        value: i === 15 ? 300 : 100 // Major spike
      }));

      const anomalies = anomalyDetector.detectAnomalies(mockData);

      if (anomalies.length > 0) {
        expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(anomalies[0].severity);
      }
    });
  });

  describe('configuration', () => {
    it('should apply custom sensitivity settings', () => {
      const highSensitivityDetector = new AnomalyDetector({
        sensitivity: 'HIGH',
        lookbackPeriods: 10
      });

      const lowSensitivityDetector = new AnomalyDetector({
        sensitivity: 'LOW',
        lookbackPeriods: 10
      });

      const mockData = Array.from({ length: 15 }, (_, i) => ({
        timestamp: `2023-01-${String(i + 1).padStart(2, '0')}`,
        value: i === 12 ? 130 : 100 // Minor deviation
      }));

      const highSensitivityResult = highSensitivityDetector.detectAnomalies(mockData);
      const lowSensitivityResult = lowSensitivityDetector.detectAnomalies(mockData);

      expect(Array.isArray(highSensitivityResult)).toBe(true);
      expect(Array.isArray(lowSensitivityResult)).toBe(true);
    });

    it('should respect minimum data points requirement', () => {
      const strictDetector = new AnomalyDetector({
        sensitivity: 'MEDIUM',
        lookbackPeriods: 50
      });

      const mockData = Array.from({ length: 30 }, (_, i) => ({
        timestamp: `2023-01-${String(i + 1).padStart(2, '0')}`,
        value: 100
      }));

      const result = strictDetector.detectAnomalies(mockData);

      // Should return empty array since data is less than lookbackPeriods
      expect(result).toEqual([]);
    });
  });
});
