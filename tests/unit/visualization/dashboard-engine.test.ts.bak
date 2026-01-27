// @ts-nocheck
import { jest } from '@jest/globals';
import { AdvancedVisualizationEngine } from '../../../src/visualization/dashboard-engine.js';

describe('AdvancedVisualizationEngine', () => {
  let visualizationEngine: AdvancedVisualizationEngine;

  beforeEach(() => {
    visualizationEngine = new AdvancedVisualizationEngine({
      defaultTheme: 'default',
      outputDirectory: './test-output',
      enableInteractivity: true,
      responsiveBreakpoints: {
        mobile: 768,
        tablet: 1024,
        desktop: 1200
      }
    });
  });

  describe('createChart', () => {
    it('should create a line chart with cost data', async () => {
      const mockData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Monthly Costs',
          data: [100, 150, 120, 180, 160],
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)'
        }]
      };

      const chartConfig = await visualizationEngine.createChart({
        id: 'cost-trend-chart',
        type: 'line',
        title: 'Monthly Cost Trends'
      }, mockData);

      expect(chartConfig.id).toBe('cost-trend-chart');
      expect(chartConfig.type).toBe('line');
      expect(chartConfig.title).toBe('Monthly Cost Trends');
      expect(chartConfig.data).toEqual(mockData);
      expect(chartConfig.createdAt).toBeInstanceOf(Date);
    });

    it('should apply theme to chart configuration', async () => {
      const mockData = {
        labels: ['EC2', 'RDS', 'S3', 'Lambda'],
        datasets: [{
          label: 'Service Costs',
          data: [500, 300, 100, 50],
          backgroundColor: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12']
        }]
      };

      const chartConfig = await visualizationEngine.createChart({
        id: 'service-breakdown',
        type: 'pie',
        title: 'Service Cost Breakdown',
        theme: 'dark'
      }, mockData);

      expect(chartConfig.theme).toBe('dark');
      expect(chartConfig.options.plugins?.legend?.labels?.color).toBe('#ffffff');
      expect(chartConfig.options.scales?.x?.ticks?.color).toBe('#ffffff');
    });

    it('should handle interactive features', async () => {
      const mockData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Weekly Usage',
          data: [75, 85, 65, 90]
        }]
      };

      const chartConfig = await visualizationEngine.createChart({
        id: 'usage-chart',
        type: 'bar',
        interactive: true,
        animations: true
      }, mockData);

      expect(chartConfig.options.interaction?.intersect).toBe(false);
      expect(chartConfig.options.interaction?.mode).toBe('index');
      expect(chartConfig.options.animation?.duration).toBeGreaterThan(0);
    });

    it('should emit chart.created event', async () => {
      const eventSpy = jest.fn();
      visualizationEngine.on('chart.created', eventSpy);

      const mockData = { labels: [], datasets: [] };

      await visualizationEngine.createChart({
        id: 'event-test-chart',
        type: 'line'
      }, mockData);

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'event-test-chart',
          type: 'line'
        })
      );
    });
  });

  describe('createDashboard', () => {
    it('should create dashboard with multiple charts', async () => {
      const costChart = await visualizationEngine.createChart({
        id: 'cost-chart',
        type: 'line',
        title: 'Cost Trends'
      }, { labels: [], datasets: [] });

      const usageChart = await visualizationEngine.createChart({
        id: 'usage-chart',
        type: 'bar',
        title: 'Resource Usage'
      }, { labels: [], datasets: [] });

      const dashboard = await visualizationEngine.createDashboard(
        'monthly-report',
        [costChart, usageChart],
        {
          title: 'Monthly Infrastructure Report',
          layout: 'grid',
          columns: 2
        }
      );

      expect(dashboard.id).toBe('monthly-report');
      expect(dashboard.title).toBe('Monthly Infrastructure Report');
      expect(dashboard.charts).toHaveLength(2);
      expect(dashboard.layout.type).toBe('grid');
      expect(dashboard.layout.columns).toBe(2);
    });

    it('should apply responsive layout', async () => {
      const chart = await visualizationEngine.createChart({
        id: 'responsive-chart',
        type: 'line'
      }, { labels: [], datasets: [] });

      const dashboard = await visualizationEngine.createDashboard(
        'responsive-dashboard',
        [chart],
        {
          responsive: true,
          layout: 'responsive'
        }
      );

      expect(dashboard.responsive).toBe(true);
      expect(dashboard.breakpoints).toEqual(expect.objectContaining({
        mobile: 768,
        tablet: 1024,
        desktop: 1200
      }));
    });

    it('should emit dashboard.created event', async () => {
      const eventSpy = jest.fn();
      visualizationEngine.on('dashboard.created', eventSpy);

      const dashboard = await visualizationEngine.createDashboard(
        'event-test-dashboard',
        [],
        { title: 'Test Dashboard' }
      );

      expect(eventSpy).toHaveBeenCalledWith(dashboard);
    });
  });

  describe('themes', () => {
    it('should register custom theme', () => {
      const customTheme = {
        name: 'custom',
        colors: {
          primary: '#ff6b6b',
          secondary: '#4ecdc4',
          background: '#f8f9fa',
          text: '#343a40'
        },
        chartDefaults: {
          backgroundColor: '#f8f9fa',
          borderColor: '#dee2e6'
        }
      };

      visualizationEngine.registerTheme('custom', customTheme);

      const themes = visualizationEngine.getAvailableThemes();
      expect(themes).toContain('custom');
    });

    it('should apply theme to multiple charts consistently', async () => {
      const theme = 'corporate';

      const chart1 = await visualizationEngine.createChart({
        id: 'chart1',
        type: 'line',
        theme
      }, { labels: [], datasets: [] });

      const chart2 = await visualizationEngine.createChart({
        id: 'chart2',
        type: 'bar',
        theme
      }, { labels: [], datasets: [] });

      expect(chart1.theme).toBe(theme);
      expect(chart2.theme).toBe(theme);
      expect(chart1.options.plugins?.legend?.labels?.color)
        .toBe(chart2.options.plugins?.legend?.labels?.color);
    });
  });

  describe('templates', () => {
    it('should create dashboard from cost-overview template', async () => {
      const mockCostData = {
        totalCost: 1500,
        services: [
          { name: 'EC2', cost: 800, percentage: 53.33 },
          { name: 'RDS', cost: 400, percentage: 26.67 },
          { name: 'S3', cost: 300, percentage: 20 }
        ],
        trends: {
          daily: [100, 110, 105, 120, 115],
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        }
      };

      const dashboard = await visualizationEngine.createFromTemplate(
        'cost-overview',
        mockCostData,
        { title: 'Cost Overview Dashboard' }
      );

      expect(dashboard.charts.length).toBeGreaterThan(0);
      expect(dashboard.charts.some(c => c.type === 'pie')).toBe(true);
      expect(dashboard.charts.some(c => c.type === 'line')).toBe(true);
    });

    it('should create dashboard from resource-optimization template', async () => {
      const mockOptimizationData = {
        recommendations: [
          { type: 'rightsizing', potential_savings: 200, resources: 5 },
          { type: 'scheduling', potential_savings: 150, resources: 3 }
        ],
        efficiency_scores: {
          compute: 78,
          storage: 85,
          network: 72
        }
      };

      const dashboard = await visualizationEngine.createFromTemplate(
        'resource-optimization',
        mockOptimizationData,
        { title: 'Optimization Dashboard' }
      );

      expect(dashboard.charts.length).toBeGreaterThan(0);
      expect(dashboard.charts.some(c => c.type === 'bar')).toBe(true);
      expect(dashboard.charts.some(c => c.type === 'gauge')).toBe(true);
    });
  });

  describe('export functionality', () => {
    it('should export chart as HTML', async () => {
      const chart = await visualizationEngine.createChart({
        id: 'export-test-chart',
        type: 'line',
        title: 'Export Test'
      }, { labels: ['A', 'B', 'C'], datasets: [{ data: [1, 2, 3] }] });

      const htmlContent = await visualizationEngine.exportChart(
        'export-test-chart',
        'html'
      );

      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<script src="https://cdn.jsdelivr.net/npm/chart.js">');
      expect(htmlContent).toContain('Export Test');
    });

    it('should export dashboard as PDF', async () => {
      const chart = await visualizationEngine.createChart({
        id: 'pdf-chart',
        type: 'bar'
      }, { labels: [], datasets: [] });

      const dashboard = await visualizationEngine.createDashboard(
        'pdf-dashboard',
        [chart],
        { title: 'PDF Export Test' }
      );

      const pdfBuffer = await visualizationEngine.exportDashboard(
        'pdf-dashboard',
        'pdf'
      );

      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should export chart data as CSV', async () => {
      const chart = await visualizationEngine.createChart({
        id: 'csv-chart',
        type: 'line'
      }, {
        labels: ['Jan', 'Feb', 'Mar'],
        datasets: [{
          label: 'Costs',
          data: [100, 200, 150]
        }]
      });

      const csvContent = await visualizationEngine.exportChart(
        'csv-chart',
        'csv'
      );

      expect(csvContent).toContain('Month,Costs');
      expect(csvContent).toContain('Jan,100');
      expect(csvContent).toContain('Feb,200');
      expect(csvContent).toContain('Mar,150');
    });
  });

  describe('real-time updates', () => {
    it('should enable real-time chart updates', async () => {
      const chart = await visualizationEngine.createChart({
        id: 'realtime-chart',
        type: 'line',
        realtime: true,
        refreshInterval: 1000
      }, { labels: [], datasets: [] });

      expect(chart.realtime).toBe(true);
      expect(chart.refreshInterval).toBe(1000);
    });

    it('should update chart data in real-time', async () => {
      await visualizationEngine.createChart({
        id: 'update-chart',
        type: 'line',
        realtime: true
      }, { labels: ['A'], datasets: [{ data: [1] }] });

      const newData = {
        labels: ['A', 'B'],
        datasets: [{ data: [1, 2] }]
      };

      await visualizationEngine.updateChart('update-chart', newData);

      const updatedChart = visualizationEngine.getChart('update-chart');
      expect(updatedChart?.data).toEqual(newData);
    });

    it('should emit chart.updated event', async () => {
      const eventSpy = jest.fn();
      visualizationEngine.on('chart.updated', eventSpy);

      await visualizationEngine.createChart({
        id: 'event-update-chart',
        type: 'line'
      }, { labels: [], datasets: [] });

      await visualizationEngine.updateChart('event-update-chart', {
        labels: ['Updated'],
        datasets: []
      });

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'event-update-chart'
        })
      );
    });
  });

  describe('filtering and data manipulation', () => {
    it('should filter dashboard charts', async () => {
      const chart1 = await visualizationEngine.createChart({
        id: 'chart1',
        type: 'line',
        tags: ['costs', 'trends']
      }, { labels: [], datasets: [] });

      const chart2 = await visualizationEngine.createChart({
        id: 'chart2',
        type: 'pie',
        tags: ['services', 'breakdown']
      }, { labels: [], datasets: [] });

      const dashboard = await visualizationEngine.createDashboard(
        'filter-test',
        [chart1, chart2]
      );

      const filteredCharts = visualizationEngine.filterCharts(dashboard.id, {
        tags: ['costs']
      });

      expect(filteredCharts).toHaveLength(1);
      expect(filteredCharts[0].id).toBe('chart1');
    });

    it('should aggregate chart data', async () => {
      const chart = await visualizationEngine.createChart({
        id: 'aggregate-chart',
        type: 'bar'
      }, {
        labels: ['Service A', 'Service B', 'Service A', 'Service C'],
        datasets: [{
          data: [100, 200, 150, 75]
        }]
      });

      const aggregated = await visualizationEngine.aggregateData(
        'aggregate-chart',
        'sum'
      );

      expect(aggregated.labels).toContain('Service A');
      expect(aggregated.labels).toContain('Service B');
      expect(aggregated.labels).toContain('Service C');
      // Service A should be aggregated: 100 + 150 = 250
      const serviceAIndex = aggregated.labels.indexOf('Service A');
      expect(aggregated.datasets[0].data[serviceAIndex]).toBe(250);
    });
  });

  describe('error handling', () => {
    it('should handle invalid chart type', async () => {
      await expect(
        visualizationEngine.createChart({
          id: 'invalid-chart',
          type: 'invalid-type' as any
        }, { labels: [], datasets: [] })
      ).rejects.toThrow('Unsupported chart type: invalid-type');
    });

    it('should handle missing chart data', async () => {
      await expect(
        visualizationEngine.createChart({
          id: 'no-data-chart',
          type: 'line'
        }, null as any)
      ).rejects.toThrow('Chart data is required');
    });

    it('should handle export errors gracefully', async () => {
      await expect(
        visualizationEngine.exportChart('non-existent-chart', 'html')
      ).rejects.toThrow('Chart not found: non-existent-chart');
    });
  });

  describe('performance', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = {
        labels: Array.from({ length: 10000 }, (_, i) => `Label ${i}`),
        datasets: [{
          label: 'Large Dataset',
          data: Array.from({ length: 10000 }, () => Math.random() * 1000)
        }]
      };

      const startTime = Date.now();

      await visualizationEngine.createChart({
        id: 'large-chart',
        type: 'line'
      }, largeDataset);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle large datasets within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds
    });

    it('should optimize chart rendering options', async () => {
      const chart = await visualizationEngine.createChart({
        id: 'optimized-chart',
        type: 'line',
        optimized: true
      }, { labels: [], datasets: [] });

      expect(chart.options.animation?.duration).toBe(0);
      expect(chart.options.elements?.point?.radius).toBe(0);
    });
  });
});