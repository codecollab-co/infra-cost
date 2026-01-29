import chalk from 'chalk';
import { CostBreakdown } from '../types/providers';

interface AlertThreshold {
  name: string;
  type: 'ABSOLUTE' | 'PERCENTAGE' | 'TREND';
  value: number;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  comparison: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS';
}

interface CostAlert {
  id: string;
  threshold: AlertThreshold;
  triggered: boolean;
  currentValue: number;
  message: string;
  recommendation?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: Date;
}

interface AlertEngineConfig {
  enableSmartThresholds: boolean;
  customThresholds: AlertThreshold[];
  budgetBasedAlerts: boolean;
  anomalyDetection: boolean;
}

export class CostAlertEngine {
  private config: AlertEngineConfig;
  private defaultThresholds: AlertThreshold[];

  constructor(config: Partial<AlertEngineConfig> = {}) {
    this.config = {
      enableSmartThresholds: true,
      customThresholds: [],
      budgetBasedAlerts: true,
      anomalyDetection: true,
      ...config
    };

    this.defaultThresholds = this.createDefaultThresholds();
  }

  /**
   * Analyze costs and generate alerts
   */
  analyzeCostAlerts(costBreakdown: CostBreakdown, budgetLimit?: number): CostAlert[] {
    const alerts: CostAlert[] = [];

    // Combine default and custom thresholds
    const allThresholds = [
      ...this.defaultThresholds,
      ...this.config.customThresholds
    ];

    // Check each threshold
    allThresholds.forEach(threshold => {
      const alert = this.evaluateThreshold(threshold, costBreakdown, budgetLimit);
      if (alert && alert.triggered) {
        alerts.push(alert);
      }
    });

    // Sort alerts by severity
    return alerts.sort((a, b) => {
      const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Display alerts in terminal with rich formatting
   */
  displayAlertsInTerminal(alerts: CostAlert[]): string {
    if (alerts.length === 0) {
      return chalk.green('\n✅ No cost alerts detected - spending within normal parameters\n');
    }

    let output = '\n' + chalk.bold.red('🚨 Cost Alerts Detected') + '\n';
    output += '═'.repeat(60) + '\n';

    // Group alerts by severity
    const alertsBySeverity = this.groupAlertsBySeverity(alerts);

    Object.entries(alertsBySeverity).forEach(([severity, severityAlerts]) => {
      if (severityAlerts.length > 0) {
        const severityColor = this.getSeverityColor(severity as any);
        const severityIcon = this.getSeverityIcon(severity as any);

        output += `\n${severityIcon} ${(chalk[severityColor] as any).bold(severity)} (${severityAlerts.length})\n`;
        output += '─'.repeat(40) + '\n';

        severityAlerts.forEach(alert => {
          output += `\n${(chalk[severityColor] as any)('●')} ${chalk.bold(alert.threshold.name)}\n`;
          output += `  ${alert.message}\n`;
          output += `  ${chalk.gray('Current:')} ${chalk.yellow(this.formatValue(alert.currentValue, alert.threshold))}\n`;
          output += `  ${chalk.gray('Threshold:')} ${chalk.cyan(this.formatValue(alert.threshold.value, alert.threshold))}\n`;

          if (alert.recommendation) {
            output += `  ${chalk.blue('💡 Recommendation:')} ${alert.recommendation}\n`;
          }
        });
      }
    });

    // Add summary and action items
    const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
    const highCount = alerts.filter(a => a.severity === 'HIGH').length;

    output += '\n' + chalk.bold.yellow('⚡ Quick Actions:') + '\n';
    if (criticalCount > 0) {
      output += chalk.red(`• ${criticalCount} critical alerts require immediate attention\n`);
    }
    if (highCount > 0) {
      output += chalk.yellow(`• ${highCount} high-priority alerts need review\n`);
    }
    output += chalk.gray('• Use --audit for detailed cost optimization recommendations\n');
    output += chalk.gray('• Consider setting up automated alerting with --monitor-start\n');

    return output;
  }

  /**
   * Create smart threshold recommendations based on cost patterns
   */
  generateSmartThresholds(costBreakdown: CostBreakdown): AlertThreshold[] {
    const recommendations: AlertThreshold[] = [];

    // Monthly budget threshold (120% of current month if growing)
    const monthlyGrowth = this.calculateGrowthRate(
      costBreakdown.totals.thisMonth,
      costBreakdown.totals.lastMonth
    );

    if (monthlyGrowth > 10) {
      recommendations.push({
        name: 'Monthly Budget Overrun',
        type: 'ABSOLUTE',
        value: costBreakdown.totals.thisMonth * 1.2,
        period: 'MONTHLY',
        severity: 'HIGH',
        description: 'Alert when monthly spending exceeds 120% of current trajectory',
        comparison: 'GREATER_THAN'
      });
    }

    // Daily spike threshold (3x daily average)
    const avgDailySpend = costBreakdown.totals.thisMonth / new Date().getDate();
    recommendations.push({
      name: 'Daily Spending Spike',
      type: 'ABSOLUTE',
      value: avgDailySpend * 3,
      period: 'DAILY',
      severity: 'MEDIUM',
      description: 'Alert when daily spending is 3x above average',
      comparison: 'GREATER_THAN'
    });

    // Service concentration risk
    const topService = this.getTopService(costBreakdown.totalsByService.thisMonth);
    const serviceConcentration = topService.percentage;

    if (serviceConcentration > 60) {
      recommendations.push({
        name: 'Service Concentration Risk',
        type: 'PERCENTAGE',
        value: 70,
        period: 'MONTHLY',
        severity: 'MEDIUM',
        description: `Alert when ${topService.name} exceeds 70% of total costs`,
        comparison: 'GREATER_THAN'
      });
    }

    return recommendations;
  }

  /**
   * Create visual threshold indicators for terminal display
   */
  createThresholdIndicators(costBreakdown: CostBreakdown, budgetLimit?: number): string {
    let output = '\n' + chalk.bold.cyan('📊 Cost Threshold Indicators') + '\n';
    output += '═'.repeat(50) + '\n\n';

    // Monthly budget indicator
    if (budgetLimit && budgetLimit > 0) {
      const budgetUsed = (costBreakdown.totals.thisMonth / budgetLimit) * 100;
      const budgetBar = this.createProgressBar(budgetUsed, 100, 40);
      const budgetColor = budgetUsed > 90 ? 'red' : budgetUsed > 75 ? 'yellow' : 'green';

      output += `${chalk.bold('Monthly Budget Usage:')}\n`;
      output += `${budgetBar} ${chalk[budgetColor](budgetUsed.toFixed(1) + '%')}\n`;
      output += `$${costBreakdown.totals.thisMonth.toFixed(2)} / $${budgetLimit.toFixed(2)}\n\n`;
    }

    // Growth rate indicator
    const growthRate = this.calculateGrowthRate(
      costBreakdown.totals.thisMonth,
      costBreakdown.totals.lastMonth
    );

    const growthColor = growthRate > 20 ? 'red' : growthRate > 10 ? 'yellow' : 'green';
    const growthIcon = growthRate > 0 ? '📈' : growthRate < 0 ? '📉' : '➡️';

    output += `${chalk.bold('Month-over-Month Growth:')}\n`;
    output += `${growthIcon} ${chalk[growthColor](growthRate > 0 ? '+' : '')}${chalk[growthColor](growthRate.toFixed(1) + '%')}\n\n`;

    // Daily spend indicator
    const avgDaily = costBreakdown.totals.thisMonth / new Date().getDate();
    const yesterdayRatio = (costBreakdown.totals.yesterday / avgDaily) * 100;
    const dailyColor = yesterdayRatio > 150 ? 'red' : yesterdayRatio > 120 ? 'yellow' : 'green';

    output += `${chalk.bold('Daily Spending (vs Average):')}\n`;
    output += `${chalk[dailyColor](yesterdayRatio.toFixed(0) + '%')} of average (${chalk.gray('$' + avgDaily.toFixed(2))})\n`;
    output += `Yesterday: ${chalk.yellow('$' + costBreakdown.totals.yesterday.toFixed(2))}\n`;

    return output;
  }

  // Private helper methods
  private createDefaultThresholds(): AlertThreshold[] {
    return [
      {
        name: 'Daily Spending Spike',
        type: 'PERCENTAGE',
        value: 200, // 200% of normal daily spend
        period: 'DAILY',
        severity: 'HIGH',
        description: 'Daily spending is significantly higher than usual',
        comparison: 'GREATER_THAN'
      },
      {
        name: 'Weekly Growth Alert',
        type: 'PERCENTAGE',
        value: 25, // 25% increase week over week
        period: 'WEEKLY',
        severity: 'MEDIUM',
        description: 'Weekly spending growth exceeds threshold',
        comparison: 'GREATER_THAN'
      },
      {
        name: 'Monthly Budget Warning',
        type: 'PERCENTAGE',
        value: 80, // 80% of monthly budget
        period: 'MONTHLY',
        severity: 'MEDIUM',
        description: 'Monthly spending approaching budget limit',
        comparison: 'GREATER_THAN'
      },
      {
        name: 'Cost Decline Alert',
        type: 'PERCENTAGE',
        value: -50, // 50% decline (potential issue)
        period: 'DAILY',
        severity: 'LOW',
        description: 'Significant cost decrease detected',
        comparison: 'LESS_THAN'
      }
    ];
  }

  private evaluateThreshold(
    threshold: AlertThreshold,
    costBreakdown: CostBreakdown,
    budgetLimit?: number
  ): CostAlert | null {
    const currentValue = this.getCurrentValue(threshold, costBreakdown, budgetLimit);
    const triggered = this.isThresholdTriggered(threshold, currentValue);

    if (!triggered) return null;

    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      threshold,
      triggered: true,
      currentValue,
      message: this.generateAlertMessage(threshold, currentValue),
      recommendation: this.generateRecommendation(threshold, currentValue),
      severity: threshold.severity,
      timestamp: new Date()
    };
  }

  private getCurrentValue(
    threshold: AlertThreshold,
    costBreakdown: CostBreakdown,
    budgetLimit?: number
  ): number {
    switch (threshold.period) {
      case 'DAILY':
        if (threshold.type === 'PERCENTAGE') {
          const avgDaily = costBreakdown.totals.thisMonth / new Date().getDate();
          return (costBreakdown.totals.yesterday / avgDaily) * 100;
        }
        return costBreakdown.totals.yesterday;

      case 'WEEKLY':
        return costBreakdown.totals.last7Days;

      case 'MONTHLY':
        if (threshold.type === 'PERCENTAGE' && budgetLimit) {
          return (costBreakdown.totals.thisMonth / budgetLimit) * 100;
        }
        return costBreakdown.totals.thisMonth;

      default:
        return 0;
    }
  }

  private isThresholdTriggered(threshold: AlertThreshold, currentValue: number): boolean {
    switch (threshold.comparison) {
      case 'GREATER_THAN':
        return currentValue > threshold.value;
      case 'LESS_THAN':
        return currentValue < threshold.value;
      case 'EQUALS':
        return Math.abs(currentValue - threshold.value) < 0.01;
      default:
        return false;
    }
  }

  private generateAlertMessage(threshold: AlertThreshold, currentValue: number): string {
    const formattedCurrent = this.formatValue(currentValue, threshold);
    const formattedThreshold = this.formatValue(threshold.value, threshold);

    switch (threshold.comparison) {
      case 'GREATER_THAN':
        return `${threshold.description}. Current: ${formattedCurrent}, exceeds threshold: ${formattedThreshold}`;
      case 'LESS_THAN':
        return `${threshold.description}. Current: ${formattedCurrent}, below threshold: ${formattedThreshold}`;
      default:
        return threshold.description;
    }
  }

  private generateRecommendation(threshold: AlertThreshold, currentValue: number): string {
    if (threshold.name.includes('Spike')) {
      return 'Review recent resource changes, check for autoscaling events, or unexpected traffic increases';
    }
    if (threshold.name.includes('Budget')) {
      return 'Consider implementing cost controls, review optimization recommendations, or adjust budget';
    }
    if (threshold.name.includes('Growth')) {
      return 'Analyze cost drivers, review resource utilization, and implement cost optimization measures';
    }
    return 'Review cost patterns and consider optimization strategies';
  }

  private formatValue(value: number, threshold: AlertThreshold): string {
    if (threshold.type === 'PERCENTAGE') {
      return `${value.toFixed(1)}%`;
    }
    return `$${value.toFixed(2)}`;
  }

  private calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private getTopService(services: Record<string, number>): { name: string; percentage: number } {
    const entries = Object.entries(services);
    if (entries.length === 0) return { name: '', percentage: 0 };

    const total = Object.values(services).reduce((sum, cost) => sum + cost, 0);
    const [name, cost] = entries.reduce((max, current) => current[1] > max[1] ? current : max);

    return {
      name,
      percentage: (cost / total) * 100
    };
  }

  private groupAlertsBySeverity(alerts: CostAlert[]): Record<string, CostAlert[]> {
    return alerts.reduce((groups, alert) => {
      if (!groups[alert.severity]) {
        groups[alert.severity] = [];
      }
      groups[alert.severity].push(alert);
      return groups;
    }, {} as Record<string, CostAlert[]>);
  }

  private getSeverityColor(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): 'red' | 'yellow' | 'cyan' {
    const colors: Record<string, 'red' | 'yellow' | 'cyan'> = {
      'CRITICAL': 'red',
      'HIGH': 'red',
      'MEDIUM': 'yellow',
      'LOW': 'cyan'
    };
    return colors[severity];
  }

  private getSeverityIcon(severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string {
    const icons = {
      'CRITICAL': '🔴',
      'HIGH': '🟠',
      'MEDIUM': '🟡',
      'LOW': '🔵'
    };
    return icons[severity];
  }

  private createProgressBar(current: number, max: number, width: number): string {
    const filled = Math.round((current / max) * width);
    const empty = width - filled;

    const bar = '█'.repeat(filled) + '░'.repeat(empty);

    // Color based on percentage
    if (current / max > 0.9) return chalk.red(bar);
    if (current / max > 0.75) return chalk.yellow(bar);
    return chalk.green(bar);
  }
}

export default CostAlertEngine;