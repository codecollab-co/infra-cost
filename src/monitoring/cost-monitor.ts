import EventEmitter from 'events';
import { CloudProvider, ResourceInventory, CostBreakdown } from '../types/providers';
import { CloudProviderFactory } from '../providers/factory';

// Enums for monitoring configuration
export enum AlertThresholdType {
  ABSOLUTE = 'ABSOLUTE',
  PERCENTAGE = 'PERCENTAGE',
  ANOMALY = 'ANOMALY',
  TREND = 'TREND',
  BUDGET_FORECAST = 'BUDGET_FORECAST'
}

export enum NotificationChannelType {
  EMAIL = 'EMAIL',
  SLACK = 'SLACK',
  WEBHOOK = 'WEBHOOK',
  SMS = 'SMS',
  TEAMS = 'TEAMS',
  DISCORD = 'DISCORD'
}

export enum AlertSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Configuration interfaces for the new config system
export interface AlertConfiguration {
  thresholdType: AlertThresholdType;
  thresholdValue: number;
  severity: AlertSeverity;
  enabled: boolean;
  cooldownMinutes: number;
  description: string;
}

export interface NotificationChannelConfig {
  type: NotificationChannelType;
  enabled: boolean;
  webhookUrl?: string;
  channel?: string;
  to?: string;
  from?: string;
  url?: string;
  phoneNumber?: string;
  [key: string]: any;
}

export interface MonitoringConfig {
  interval: number; // milliseconds
  providers: CloudProvider[];
  alertThresholds: AlertThreshold[];
  notificationChannels: NotificationChannel[];
  enablePredictiveAlerts: boolean;
  dataRetentionDays: number;
}

export interface AlertThreshold {
  id: string;
  name: string;
  type: 'ABSOLUTE' | 'PERCENTAGE' | 'ANOMALY' | 'TREND' | 'BUDGET_FORECAST';
  condition: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS' | 'DEVIATION';
  value: number;
  timeWindow: number; // minutes
  provider?: CloudProvider;
  service?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  cooldownPeriod: number; // minutes to wait before sending another alert
  description: string;
}

export interface NotificationChannel {
  id: string;
  type: 'EMAIL' | 'SLACK' | 'WEBHOOK' | 'SMS' | 'TEAMS' | 'DISCORD';
  config: Record<string, any>;
  enabled: boolean;
  filters: {
    minSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    providers?: CloudProvider[];
    services?: string[];
  };
}

export interface CostAlert {
  id: string;
  timestamp: Date;
  threshold: AlertThreshold;
  provider: CloudProvider;
  service?: string;
  currentValue: number;
  thresholdValue: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  details: Record<string, any>;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface CostDataPoint {
  timestamp: Date;
  provider: CloudProvider;
  service: string;
  cost: number;
  resourceCount: number;
  metadata: Record<string, any>;
}

export interface MonitoringMetrics {
  totalCostToday: number;
  costChangeToday: number;
  costChangePercentage: number;
  activeAlerts: number;
  resolvedAlerts: number;
  averageResolutionTime: number; // minutes
  topCostDrivers: Array<{
    provider: CloudProvider;
    service: string;
    cost: number;
    change: number;
  }>;
  healthScore: number; // 0-100
  dataCollections?: number;
  alertsTriggered?: number;
  notificationsSent?: number;
  avgCollectionTime?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  memoryUsage: number;
  activeAlerts: number;
  processedNotifications: number;
  lastError?: string;
}

export class CostMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private isMonitoring: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private dataHistory: CostDataPoint[] = [];
  private activeAlerts: Map<string, CostAlert> = new Map();
  private alertHistory: CostAlert[] = [];
  private providerFactory: CloudProviderFactory;
  private lastAlertTimes: Map<string, Date> = new Map();
  private startTime: Date = new Date();
  private metricsCollector = {
    dataCollections: 0,
    alertsTriggered: 0,
    notificationsSent: 0,
    collectionTimes: [] as number[]
  };

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.providerFactory = new CloudProviderFactory();
    this.setupEventHandlers();
  }

  public async start(): Promise<void> {
    return this.startMonitoring();
  }

  public stop(): void {
    this.stopMonitoring();
  }

  public async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      throw new Error('Monitoring is already running');
    }

    console.log('🔄 Starting real-time cost monitoring...');
    this.isMonitoring = true;

    // Initial data collection
    await this.collectCostData();

    // Set up periodic monitoring
    this.intervalId = setInterval(async () => {
      try {
        await this.collectCostData();
        await this.evaluateAlerts();
        await this.cleanupOldData();
      } catch (error) {
        console.error('Error during monitoring cycle:', error);
        this.emit('monitoringError', error);
      }
    }, this.config.interval);

    this.emit('monitoringStarted');
    console.log(`✅ Cost monitoring started with ${this.config.interval}ms interval`);
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isMonitoring = false;
    this.emit('monitoringStopped');
    console.log('🛑 Cost monitoring stopped');
  }

  public getHealthStatus(): HealthStatus {
    return {
      status: this.activeAlerts.size === 0 ? 'healthy' : this.activeAlerts.size < 3 ? 'warning' : 'critical',
      uptime: Date.now() - this.startTime.getTime(),
      memoryUsage: process.memoryUsage().heapUsed,
      activeAlerts: this.activeAlerts.size,
      processedNotifications: this.metricsCollector.notificationsSent,
      lastError: undefined
    };
  }

  public getMetrics(): MonitoringMetrics {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayData = this.dataHistory.filter(d => d.timestamp >= today);
    const totalCostToday = todayData.reduce((sum, d) => sum + d.cost, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayData = this.dataHistory.filter(d =>
      d.timestamp >= yesterday && d.timestamp < today
    );
    const totalCostYesterday = yesterdayData.reduce((sum, d) => sum + d.cost, 0);

    const costChangeToday = totalCostToday - totalCostYesterday;
    const costChangePercentage = totalCostYesterday > 0 ?
      (costChangeToday / totalCostYesterday) * 100 : 0;

    // Calculate top cost drivers
    const serviceAggregation: Record<string, { cost: number; previousCost: number }> = {};

    todayData.forEach(d => {
      const key = `${d.provider}-${d.service}`;
      if (!serviceAggregation[key]) {
        serviceAggregation[key] = { cost: 0, previousCost: 0 };
      }
      serviceAggregation[key].cost += d.cost;
    });

    yesterdayData.forEach(d => {
      const key = `${d.provider}-${d.service}`;
      if (!serviceAggregation[key]) {
        serviceAggregation[key] = { cost: 0, previousCost: 0 };
      }
      serviceAggregation[key].previousCost += d.cost;
    });

    const topCostDrivers = Object.entries(serviceAggregation)
      .map(([key, data]) => {
        const [provider, service] = key.split('-');
        return {
          provider: provider as CloudProvider,
          service,
          cost: data.cost,
          change: data.cost - data.previousCost
        };
      })
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    // Calculate resolution times
    const resolvedAlerts = this.alertHistory.filter(a => a.resolvedAt);
    const avgResolutionTime = resolvedAlerts.length > 0 ?
      resolvedAlerts.reduce((sum, alert) => {
        const resolutionTime = alert.resolvedAt!.getTime() - alert.timestamp.getTime();
        return sum + resolutionTime / (1000 * 60); // convert to minutes
      }, 0) / resolvedAlerts.length : 0;

    // Calculate health score
    const healthScore = this.calculateHealthScore(costChangePercentage, this.activeAlerts.size);

    const avgCollectionTime = this.metricsCollector.collectionTimes.length > 0
      ? this.metricsCollector.collectionTimes.reduce((a, b) => a + b, 0) / this.metricsCollector.collectionTimes.length
      : 0;

    return {
      totalCostToday,
      costChangeToday,
      costChangePercentage,
      activeAlerts: this.activeAlerts.size,
      resolvedAlerts: resolvedAlerts.length,
      averageResolutionTime: avgResolutionTime,
      topCostDrivers,
      healthScore,
      dataCollections: this.metricsCollector.dataCollections,
      alertsTriggered: this.metricsCollector.alertsTriggered,
      notificationsSent: this.metricsCollector.notificationsSent,
      avgCollectionTime
    };
  }

  public getActiveAlerts(): CostAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  public async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      this.emit('alertAcknowledged', alert);
    }
  }

  public async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      this.activeAlerts.delete(alertId);
      this.alertHistory.push(alert);
      this.emit('alertResolved', alert);
    }
  }

  public addThreshold(threshold: AlertThreshold): void {
    this.config.alertThresholds.push(threshold);
    this.emit('thresholdAdded', threshold);
  }

  public removeThreshold(thresholdId: string): void {
    const index = this.config.alertThresholds.findIndex(t => t.id === thresholdId);
    if (index > -1) {
      const threshold = this.config.alertThresholds.splice(index, 1)[0];
      this.emit('thresholdRemoved', threshold);
    }
  }

  public updateThreshold(thresholdId: string, updates: Partial<AlertThreshold>): void {
    const threshold = this.config.alertThresholds.find(t => t.id === thresholdId);
    if (threshold) {
      Object.assign(threshold, updates);
      this.emit('thresholdUpdated', threshold);
    }
  }

  private async collectCostData(): Promise<void> {
    const startTime = Date.now();

    for (const provider of this.config.providers) {
      try {
        const providerInstance = this.providerFactory.createProvider({
          provider,
          credentials: {}, // Would need proper credentials
          region: 'us-east-1' // Default region
        });

        const costBreakdown = await providerInstance.getCostBreakdown();

        // Store data points for each service
        Object.entries(costBreakdown.totalsByService.thisMonth).forEach(([service, cost]) => {
          const dataPoint: CostDataPoint = {
            timestamp: new Date(),
            provider,
            service,
            cost,
            resourceCount: 0, // Would need resource count from inventory
            metadata: {
              lastMonth: costBreakdown.totalsByService.lastMonth[service] || 0,
              last7Days: costBreakdown.totalsByService.last7Days[service] || 0,
              yesterday: costBreakdown.totalsByService.yesterday[service] || 0
            }
          };

          this.dataHistory.push(dataPoint);
        });

        this.emit('dataCollected', { provider, timestamp: new Date() });
      } catch (error) {
        console.error(`Failed to collect data from ${provider}:`, error);
        this.emit('dataCollectionError', { provider, error });
      }
    }

    const collectionTime = Date.now() - startTime;
    this.metricsCollector.dataCollections++;
    this.metricsCollector.collectionTimes.push(collectionTime);
    if (this.metricsCollector.collectionTimes.length > 100) {
      this.metricsCollector.collectionTimes.shift();
    }
  }

  private async evaluateAlerts(): Promise<void> {
    for (const threshold of this.config.alertThresholds) {
      if (!threshold.enabled) continue;

      // Check cooldown period
      const lastAlertTime = this.lastAlertTimes.get(threshold.id);
      if (lastAlertTime) {
        const timeSinceLastAlert = Date.now() - lastAlertTime.getTime();
        if (timeSinceLastAlert < threshold.cooldownPeriod * 60 * 1000) {
          continue; // Still in cooldown period
        }
      }

      const shouldAlert = await this.evaluateThreshold(threshold);
      if (shouldAlert.triggered) {
        const alert: CostAlert = {
          id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          threshold,
          provider: shouldAlert.provider!,
          service: shouldAlert.service,
          currentValue: shouldAlert.currentValue!,
          thresholdValue: threshold.value,
          severity: threshold.severity,
          message: this.generateAlertMessage(threshold, shouldAlert),
          details: shouldAlert.details || {},
          acknowledged: false
        };

        this.activeAlerts.set(alert.id, alert);
        this.lastAlertTimes.set(threshold.id, new Date());
        this.metricsCollector.alertsTriggered++;
        await this.sendAlert(alert);
        this.emit('alertTriggered', alert);
      }
    }
  }

  private async evaluateThreshold(threshold: AlertThreshold): Promise<{
    triggered: boolean;
    provider?: CloudProvider;
    service?: string;
    currentValue?: number;
    details?: Record<string, any>;
  }> {
    const timeWindow = new Date(Date.now() - threshold.timeWindow * 60 * 1000);
    const relevantData = this.dataHistory.filter(d =>
      d.timestamp >= timeWindow &&
      (!threshold.provider || d.provider === threshold.provider) &&
      (!threshold.service || d.service === threshold.service)
    );

    if (relevantData.length === 0) {
      return { triggered: false };
    }

    switch (threshold.type) {
      case 'ABSOLUTE':
        return this.evaluateAbsoluteThreshold(threshold, relevantData);

      case 'PERCENTAGE':
        return this.evaluatePercentageThreshold(threshold, relevantData);

      case 'ANOMALY':
        return this.evaluateAnomalyThreshold(threshold, relevantData);

      case 'TREND':
        return this.evaluateTrendThreshold(threshold, relevantData);

      case 'BUDGET_FORECAST':
        return this.evaluateBudgetForecastThreshold(threshold, relevantData);

      default:
        return { triggered: false };
    }
  }

  private evaluateAbsoluteThreshold(
    threshold: AlertThreshold,
    data: CostDataPoint[]
  ): { triggered: boolean; provider?: CloudProvider; service?: string; currentValue?: number; details?: Record<string, any> } {
    const currentValue = data.reduce((sum, d) => sum + d.cost, 0);

    const triggered = threshold.condition === 'GREATER_THAN' ?
      currentValue > threshold.value :
      threshold.condition === 'LESS_THAN' ?
      currentValue < threshold.value :
      currentValue === threshold.value;

    return {
      triggered,
      provider: data[0]?.provider,
      service: data[0]?.service,
      currentValue,
      details: {
        evaluationType: 'absolute',
        dataPoints: data.length,
        timeWindow: threshold.timeWindow
      }
    };
  }

  private evaluatePercentageThreshold(
    threshold: AlertThreshold,
    data: CostDataPoint[]
  ): { triggered: boolean; provider?: CloudProvider; service?: string; currentValue?: number; details?: Record<string, any> } {
    if (data.length < 2) return { triggered: false };

    const currentCost = data[data.length - 1].cost;
    const previousCost = data[0].cost;

    if (previousCost === 0) return { triggered: false };

    const changePercentage = ((currentCost - previousCost) / previousCost) * 100;

    const triggered = threshold.condition === 'GREATER_THAN' ?
      changePercentage > threshold.value :
      threshold.condition === 'LESS_THAN' ?
      changePercentage < threshold.value :
      Math.abs(changePercentage - threshold.value) < 0.01;

    return {
      triggered,
      provider: data[0].provider,
      service: data[0].service,
      currentValue: changePercentage,
      details: {
        evaluationType: 'percentage',
        currentCost,
        previousCost,
        changeAmount: currentCost - previousCost
      }
    };
  }

  private evaluateAnomalyThreshold(
    threshold: AlertThreshold,
    data: CostDataPoint[]
  ): { triggered: boolean; provider?: CloudProvider; service?: string; currentValue?: number; details?: Record<string, any> } {
    if (data.length < 5) return { triggered: false };

    const costs = data.map(d => d.cost);
    const currentCost = costs[costs.length - 1];
    const historicalCosts = costs.slice(0, -1);

    const mean = historicalCosts.reduce((sum, cost) => sum + cost, 0) / historicalCosts.length;
    const variance = historicalCosts.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / historicalCosts.length;
    const stdDev = Math.sqrt(variance);

    const zScore = stdDev > 0 ? Math.abs(currentCost - mean) / stdDev : 0;

    // Anomaly detected if z-score is greater than threshold value (typically 2.5-3.0)
    const triggered = zScore > threshold.value;

    return {
      triggered,
      provider: data[0].provider,
      service: data[0].service,
      currentValue: zScore,
      details: {
        evaluationType: 'anomaly',
        currentCost,
        historicalMean: mean,
        standardDeviation: stdDev,
        deviationFromMean: Math.abs(currentCost - mean)
      }
    };
  }

  private evaluateTrendThreshold(
    threshold: AlertThreshold,
    data: CostDataPoint[]
  ): { triggered: boolean; provider?: CloudProvider; service?: string; currentValue?: number; details?: Record<string, any> } {
    if (data.length < 3) return { triggered: false };

    const costs = data.map(d => d.cost);

    // Calculate linear trend using least squares
    const n = costs.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = costs.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * costs[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    // Convert slope to percentage change per time unit
    const avgCost = sumY / n;
    const trendPercentage = avgCost > 0 ? (slope / avgCost) * 100 : 0;

    const triggered = threshold.condition === 'GREATER_THAN' ?
      trendPercentage > threshold.value :
      threshold.condition === 'LESS_THAN' ?
      trendPercentage < threshold.value :
      Math.abs(trendPercentage - threshold.value) < 0.1;

    return {
      triggered,
      provider: data[0].provider,
      service: data[0].service,
      currentValue: trendPercentage,
      details: {
        evaluationType: 'trend',
        slope,
        averageCost: avgCost,
        dataPoints: n,
        timeRange: `${data[0].timestamp.toISOString()} to ${data[n-1].timestamp.toISOString()}`
      }
    };
  }

  private evaluateBudgetForecastThreshold(
    threshold: AlertThreshold,
    data: CostDataPoint[]
  ): { triggered: boolean; provider?: CloudProvider; service?: string; currentValue?: number; details?: Record<string, any> } {
    if (data.length === 0) return { triggered: false };

    const currentMonthCost = data.reduce((sum, d) => sum + d.cost, 0);

    // Simple forecast: project current spending for rest of month
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const projectedMonthlyCost = (currentMonthCost / currentDay) * daysInMonth;

    const budgetUtilization = (projectedMonthlyCost / threshold.value) * 100;

    const triggered = threshold.condition === 'GREATER_THAN' ?
      budgetUtilization > 100 : // Over budget forecast
      budgetUtilization < threshold.value; // Under budget by certain percentage

    return {
      triggered,
      provider: data[0].provider,
      service: data[0].service,
      currentValue: budgetUtilization,
      details: {
        evaluationType: 'budget_forecast',
        currentMonthCost,
        projectedMonthlyCost,
        budgetAmount: threshold.value,
        daysAnalyzed: currentDay,
        daysInMonth
      }
    };
  }

  private generateAlertMessage(
    threshold: AlertThreshold,
    evaluation: { triggered: boolean; provider?: CloudProvider; service?: string; currentValue?: number; details?: Record<string, any> }
  ): string {
    const provider = evaluation.provider || 'Unknown';
    const service = evaluation.service || 'All Services';
    const current = evaluation.currentValue?.toFixed(2) || 'N/A';
    const thresholdVal = threshold.value.toFixed(2);

    switch (threshold.type) {
      case 'ABSOLUTE':
        return `💰 ${provider.toUpperCase()} ${service}: Cost of $${current} ${threshold.condition.toLowerCase().replace('_', ' ')} threshold of $${thresholdVal}`;

      case 'PERCENTAGE':
        return `📈 ${provider.toUpperCase()} ${service}: Cost changed by ${current}% ${threshold.condition.toLowerCase().replace('_', ' ')} threshold of ${thresholdVal}%`;

      case 'ANOMALY':
        return `⚠️ ${provider.toUpperCase()} ${service}: Anomalous spending detected (z-score: ${current}, threshold: ${thresholdVal})`;

      case 'TREND':
        return `📊 ${provider.toUpperCase()} ${service}: Cost trend of ${current}%/period ${threshold.condition.toLowerCase().replace('_', ' ')} threshold of ${thresholdVal}%`;

      case 'BUDGET_FORECAST':
        return `🎯 ${provider.toUpperCase()} ${service}: Projected budget utilization of ${current}% for this month`;

      default:
        return `🚨 ${provider.toUpperCase()} ${service}: Alert threshold "${threshold.name}" triggered`;
    }
  }

  private async sendAlert(alert: CostAlert): Promise<void> {
    const applicableChannels = this.config.notificationChannels.filter(channel =>
      channel.enabled &&
      this.severityMeetsMinimum(alert.severity, channel.filters.minSeverity) &&
      (!channel.filters.providers || channel.filters.providers.includes(alert.provider)) &&
      (!channel.filters.services || !alert.service || channel.filters.services.includes(alert.service))
    );

    for (const channel of applicableChannels) {
      try {
        await this.sendNotification(alert, channel);
        this.metricsCollector.notificationsSent++;
      } catch (error) {
        console.error(`Failed to send alert via ${channel.type}:`, error);
        this.emit('notificationError', { channel, alert, error });
      }
    }
  }

  private async sendNotification(alert: CostAlert, channel: NotificationChannel): Promise<void> {
    switch (channel.type) {
      case 'SLACK':
        await this.sendSlackNotification(alert, channel);
        break;

      case 'EMAIL':
        await this.sendEmailNotification(alert, channel);
        break;

      case 'WEBHOOK':
        await this.sendWebhookNotification(alert, channel);
        break;

      case 'TEAMS':
        await this.sendTeamsNotification(alert, channel);
        break;

      default:
        console.warn(`Notification type ${channel.type} not implemented yet`);
    }
  }

  private async sendSlackNotification(alert: CostAlert, channel: NotificationChannel): Promise<void> {
    const webhookUrl = channel.config.webhookUrl;
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const color = this.getSeverityColor(alert.severity);
    const message = {
      text: `Cost Alert: ${alert.threshold.name}`,
      attachments: [
        {
          color,
          title: alert.message,
          fields: [
            { title: 'Provider', value: alert.provider.toUpperCase(), short: true },
            { title: 'Service', value: alert.service || 'All', short: true },
            { title: 'Current Value', value: alert.currentValue.toString(), short: true },
            { title: 'Threshold', value: alert.thresholdValue.toString(), short: true },
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Time', value: alert.timestamp.toISOString(), short: true }
          ],
          footer: 'Infra-Cost Monitoring',
          ts: Math.floor(alert.timestamp.getTime() / 1000)
        }
      ]
    };

    // In a real implementation, you would use fetch or axios to send to Slack
    console.log('Would send Slack notification:', message);
  }

  private async sendEmailNotification(alert: CostAlert, channel: NotificationChannel): Promise<void> {
    // In a real implementation, you would use nodemailer or similar
    console.log('Would send email notification for alert:', alert.id);
  }

  private async sendWebhookNotification(alert: CostAlert, channel: NotificationChannel): Promise<void> {
    const webhookUrl = channel.config.url;
    if (!webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const payload = {
      alert_id: alert.id,
      timestamp: alert.timestamp.toISOString(),
      severity: alert.severity,
      provider: alert.provider,
      service: alert.service,
      message: alert.message,
      current_value: alert.currentValue,
      threshold_value: alert.thresholdValue,
      details: alert.details
    };

    // In a real implementation, you would use fetch or axios
    console.log('Would send webhook notification to:', webhookUrl, payload);
  }

  private async sendTeamsNotification(alert: CostAlert, channel: NotificationChannel): Promise<void> {
    // Microsoft Teams webhook implementation would go here
    console.log('Would send Teams notification for alert:', alert.id);
  }

  private severityMeetsMinimum(alertSeverity: string, minSeverity: string): boolean {
    const severityOrder: Record<string, number> = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    return severityOrder[alertSeverity] >= severityOrder[minSeverity];
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'CRITICAL': return '#ff0000';
      case 'HIGH': return '#ff6600';
      case 'MEDIUM': return '#ffcc00';
      case 'LOW': return '#0099ff';
      default: return '#808080';
    }
  }

  private calculateHealthScore(costChangePercentage: number, activeAlerts: number): number {
    let score = 100;

    // Penalize for high cost increases
    if (costChangePercentage > 20) score -= 30;
    else if (costChangePercentage > 10) score -= 20;
    else if (costChangePercentage > 5) score -= 10;

    // Penalize for active alerts
    score -= activeAlerts * 5;

    // Bonus for cost decreases
    if (costChangePercentage < -5) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  private async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date(Date.now() - this.config.dataRetentionDays * 24 * 60 * 60 * 1000);

    const initialCount = this.dataHistory.length;
    this.dataHistory = this.dataHistory.filter(d => d.timestamp >= cutoffDate);

    const removedCount = initialCount - this.dataHistory.length;
    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} old data points`);
    }

    // Also cleanup old alert history
    this.alertHistory = this.alertHistory.filter(a => a.timestamp >= cutoffDate);
  }

  private setupEventHandlers(): void {
    this.on('alertTriggered', (alert) => {
      console.log(`🚨 Alert triggered: ${alert.message}`);
    });

    this.on('alertResolved', (alert) => {
      console.log(`✅ Alert resolved: ${alert.message}`);
    });

    this.on('monitoringError', (error) => {
      console.error('❌ Monitoring error:', error);
    });
  }

  // Static methods for creating common threshold configurations
  static createBudgetThreshold(
    name: string,
    budgetAmount: number,
    provider?: CloudProvider,
    service?: string
  ): AlertThreshold {
    return {
      id: `budget-${Date.now()}`,
      name,
      type: 'BUDGET_FORECAST',
      condition: 'GREATER_THAN',
      value: budgetAmount,
      timeWindow: 1440, // 24 hours
      provider,
      service,
      severity: 'HIGH',
      enabled: true,
      cooldownPeriod: 240, // 4 hours
      description: `Alert when projected monthly spend exceeds $${budgetAmount}`
    };
  }

  static createAnomalyThreshold(
    name: string,
    sensitivity: number = 3.0,
    provider?: CloudProvider
  ): AlertThreshold {
    return {
      id: `anomaly-${Date.now()}`,
      name,
      type: 'ANOMALY',
      condition: 'GREATER_THAN',
      value: sensitivity,
      timeWindow: 1440, // 24 hours
      provider,
      severity: 'MEDIUM',
      enabled: true,
      cooldownPeriod: 120, // 2 hours
      description: `Detect cost anomalies with ${sensitivity} standard deviation sensitivity`
    };
  }

  static createPercentageChangeThreshold(
    name: string,
    changePercentage: number,
    provider?: CloudProvider,
    service?: string
  ): AlertThreshold {
    return {
      id: `percentage-${Date.now()}`,
      name,
      type: 'PERCENTAGE',
      condition: 'GREATER_THAN',
      value: changePercentage,
      timeWindow: 60, // 1 hour
      provider,
      service,
      severity: changePercentage > 50 ? 'CRITICAL' : changePercentage > 20 ? 'HIGH' : 'MEDIUM',
      enabled: true,
      cooldownPeriod: 60, // 1 hour
      description: `Alert when cost changes by more than ${changePercentage}%`
    };
  }

  /**
   * Builder pattern for CostMonitor
   */
  static builder(): CostMonitorBuilder {
    return new CostMonitorBuilder();
  }

  /**
   * Create CostMonitor instance from configuration object
   */
  static fromConfiguration(config: any): CostMonitor {
    const builder = CostMonitor.builder()
      .setDataCollectionInterval(config.dataCollectionInterval || 60000)
      .setRetentionDays(config.retentionDays || 30);

    // Set up provider if specified
    if (config.provider) {
      // This would need to be implemented to create provider from config
      console.log(`Provider configuration: ${config.provider.type}`);
    }

    // Add alerts from configuration
    if (config.alerts) {
      Object.entries(config.alerts).forEach(([alertId, alertConfig]: [string, any]) => {
        builder.addAlert(alertId, {
          thresholdType: alertConfig.thresholdType,
          thresholdValue: alertConfig.thresholdValue,
          severity: alertConfig.severity,
          enabled: alertConfig.enabled,
          cooldownMinutes: alertConfig.cooldownMinutes,
          description: alertConfig.description
        });
      });
    }

    // Add notification channels from configuration
    if (config.notificationChannels) {
      Object.entries(config.notificationChannels).forEach(([channelId, channelConfig]: [string, any]) => {
        if (channelConfig.enabled) {
          builder.addNotificationChannel(channelId, channelConfig);
        }
      });
    }

    // Set analytics options
    if (config.analytics) {
      if (config.analytics.enableAnomalyDetection) {
        builder.enableAnomalyDetection(true, config.analytics.anomalySensitivity || 2.0);
      }
    }

    return builder.build();
  }
}

// Configuration builder helper
export class MonitoringConfigBuilder {
  private config: Partial<MonitoringConfig> = {};

  public interval(milliseconds: number): this {
    this.config.interval = milliseconds;
    return this;
  }

  public providers(providers: CloudProvider[]): this {
    this.config.providers = providers;
    return this;
  }

  public addThreshold(threshold: AlertThreshold): this {
    if (!this.config.alertThresholds) {
      this.config.alertThresholds = [];
    }
    this.config.alertThresholds.push(threshold);
    return this;
  }

  public addNotificationChannel(channel: NotificationChannel): this {
    if (!this.config.notificationChannels) {
      this.config.notificationChannels = [];
    }
    this.config.notificationChannels.push(channel);
    return this;
  }

  public enablePredictiveAlerts(enabled: boolean = true): this {
    this.config.enablePredictiveAlerts = enabled;
    return this;
  }

  public dataRetention(days: number): this {
    this.config.dataRetentionDays = days;
    return this;
  }

  public build(): MonitoringConfig {
    return {
      interval: this.config.interval || 300000, // 5 minutes default
      providers: this.config.providers || [CloudProvider.AWS],
      alertThresholds: this.config.alertThresholds || [],
      notificationChannels: this.config.notificationChannels || [],
      enablePredictiveAlerts: this.config.enablePredictiveAlerts || false,
      dataRetentionDays: this.config.dataRetentionDays || 30
    };
  }
}

// Builder class for CostMonitor
export class CostMonitorBuilder {
  private interval: number = 60000;
  private retentionDays: number = 30;
  private providers: CloudProvider[] = [];
  private alerts: Map<string, AlertConfiguration> = new Map();
  private channels: Map<string, NotificationChannelConfig> = new Map();
  private anomalyDetectionEnabled: boolean = false;
  private anomalySensitivity: number = 2.0;

  setDataCollectionInterval(interval: number): this {
    this.interval = interval;
    return this;
  }

  setRetentionDays(days: number): this {
    this.retentionDays = days;
    return this;
  }

  setProvider(provider: any): this {
    if (provider && provider.type) {
      this.providers.push(provider.type);
    }
    return this;
  }

  addAlert(id: string, config: AlertConfiguration): this {
    this.alerts.set(id, config);
    return this;
  }

  addNotificationChannel(id: string, config: NotificationChannelConfig | any): this {
    this.channels.set(id, config);
    return this;
  }

  enableAnomalyDetection(enabled: boolean, sensitivity?: number): this {
    this.anomalyDetectionEnabled = enabled;
    if (sensitivity !== undefined) {
      this.anomalySensitivity = sensitivity;
    }
    return this;
  }

  build(): CostMonitor {
    const alertThresholds: AlertThreshold[] = [];
    this.alerts.forEach((config, id) => {
      alertThresholds.push({
        id,
        name: id,
        type: config.thresholdType.toString() as AlertThreshold['type'],
        condition: 'GREATER_THAN',
        value: config.thresholdValue,
        timeWindow: 60,
        severity: config.severity.toString() as AlertThreshold['severity'],
        enabled: config.enabled,
        cooldownPeriod: config.cooldownMinutes,
        description: config.description
      });
    });

    const notificationChannels: NotificationChannel[] = [];
    this.channels.forEach((config, id) => {
      const channelConfig: Record<string, any> = {};
      if (config.webhookUrl) channelConfig.webhookUrl = config.webhookUrl;
      if (config.channel) channelConfig.channel = config.channel;
      if (config.to) channelConfig.to = config.to;
      if (config.from) channelConfig.from = config.from;
      if (config.url) channelConfig.url = config.url;
      if (config.phoneNumber) channelConfig.phoneNumber = config.phoneNumber;

      notificationChannels.push({
        id,
        type: config.type.toString() as NotificationChannel['type'],
        config: channelConfig,
        enabled: true,
        filters: {
          minSeverity: 'LOW',
          providers: this.providers.length > 0 ? this.providers : undefined,
          services: undefined
        }
      });
    });

    const monitoringConfig: MonitoringConfig = {
      interval: this.interval,
      providers: this.providers.length > 0 ? this.providers : [CloudProvider.AWS],
      alertThresholds,
      notificationChannels,
      enablePredictiveAlerts: this.anomalyDetectionEnabled,
      dataRetentionDays: this.retentionDays
    };

    return new CostMonitor(monitoringConfig);
  }
}
