import Table from 'cli-table3';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import moment from 'moment';
import { CostBreakdown, TrendData, CostTrendAnalysis } from '../types/providers';

interface TableColumn {
  header: string;
  width?: number;
  align?: 'left' | 'right' | 'center';
  color?: keyof typeof chalk;
}

interface TableRow {
  [key: string]: string | number;
}

interface TrendChartOptions {
  width: number;
  showLabels: boolean;
  colorThreshold?: number;
  currency?: string;
}

interface CostTableOptions {
  showPercentages: boolean;
  highlightTop: number;
  currency: string;
  compact: boolean;
}

export class TerminalUIEngine {
  private progressBar: cliProgress.SingleBar | null = null;

  /**
   * Creates a formatted table with enhanced styling
   */
  createTable(columns: TableColumn[], rows: TableRow[]): string {
    const table = new Table({
      head: columns.map(col => chalk.bold(col.header)),
      colWidths: columns.map(col => col.width || 20),
      colAligns: columns.map(col => col.align || 'left'),
      style: {
        head: [],
        border: [],
        compact: false
      },
      chars: {
        'top': '─',
        'top-mid': '┬',
        'top-left': '┌',
        'top-right': '┐',
        'bottom': '─',
        'bottom-mid': '┴',
        'bottom-left': '└',
        'bottom-right': '┘',
        'left': '│',
        'left-mid': '├',
        'mid': '─',
        'mid-mid': '┼',
        'right': '│',
        'right-mid': '┤',
        'middle': '│'
      }
    });

    // Add rows with color formatting
    rows.forEach(row => {
      const formattedRow = columns.map((col, index) => {
        const value = Object.values(row)[index];
        const colorKey = col.color;

        if (colorKey && typeof value === 'string') {
          return chalk[colorKey](value);
        }

        return String(value);
      });

      table.push(formattedRow);
    });

    return table.toString();
  }

  /**
   * Creates a cost breakdown table with rich formatting
   * Optimized for large datasets with pagination and filtering
   */
  createCostTable(costBreakdown: CostBreakdown, options: CostTableOptions = {
    showPercentages: true,
    highlightTop: 5,
    currency: 'USD',
    compact: false
  }): string {
    const { totals, totalsByService } = costBreakdown;

    // Header with summary
    let output = '\n' + chalk.bold.cyan('💰 Cost Analysis Summary') + '\n';
    output += '═'.repeat(50) + '\n\n';

    // Create summary table
    const summaryColumns: TableColumn[] = [
      { header: 'Period', width: 15, align: 'left', color: 'cyan' },
      { header: 'Cost', width: 15, align: 'right', color: 'yellow' },
      { header: 'Change', width: 20, align: 'right' }
    ];

    const summaryRows: TableRow[] = [
      {
        period: 'Yesterday',
        cost: this.formatCurrency(totals.yesterday, options.currency),
        change: ''
      },
      {
        period: 'Last 7 Days',
        cost: this.formatCurrency(totals.last7Days, options.currency),
        change: this.calculateChange(totals.last7Days, totals.yesterday * 7)
      },
      {
        period: 'This Month',
        cost: this.formatCurrency(totals.thisMonth, options.currency),
        change: this.calculateChange(totals.thisMonth, totals.lastMonth)
      },
      {
        period: 'Last Month',
        cost: this.formatCurrency(totals.lastMonth, options.currency),
        change: ''
      }
    ];

    output += this.createTable(summaryColumns, summaryRows) + '\n\n';

    // Service breakdown for this month with performance optimizations
    output += chalk.bold.cyan('📊 Service Breakdown (This Month)') + '\n';
    output += '═'.repeat(50) + '\n\n';

    // Performance optimization: Pre-filter and batch process large datasets
    const allServiceEntries = Object.entries(totalsByService.thisMonth);
    const significantServices = allServiceEntries
      .filter(([_, cost]) => cost > 0.01) // Filter out negligible costs for performance
      .sort(([, a], [, b]) => b - a);

    const maxDisplay = options.highlightTop || 15;
    const serviceEntries = significantServices.slice(0, maxDisplay);

    // Show stats for large datasets
    if (allServiceEntries.length > maxDisplay) {
      const hiddenServices = allServiceEntries.length - maxDisplay;
      const hiddenCost = significantServices.slice(maxDisplay)
        .reduce((sum, [_, cost]) => sum + cost, 0);

      if (hiddenCost > 0) {
        output += chalk.gray(`Showing top ${maxDisplay} of ${allServiceEntries.length} services `) +
                  chalk.gray(`(${hiddenServices} services with $${hiddenCost.toFixed(2)} hidden)\n\n`);
      }
    }

    const serviceColumns: TableColumn[] = [
      { header: 'Service', width: 25, align: 'left', color: 'blue' },
      { header: 'Cost', width: 15, align: 'right', color: 'yellow' },
      { header: 'Share', width: 10, align: 'right' },
      { header: 'Trend', width: 15, align: 'center' }
    ];

    const serviceRows: TableRow[] = serviceEntries.map(([service, cost]) => {
      const share = (cost / totals.thisMonth * 100).toFixed(1);
      const lastMonthCost = totalsByService.lastMonth[service] || 0;
      const trend = this.getTrendIndicator(cost, lastMonthCost);

      return {
        service: service,
        cost: this.formatCurrency(cost, options.currency),
        share: `${share}%`,
        trend: trend
      };
    });

    output += this.createTable(serviceColumns, serviceRows);

    return output;
  }

  /**
   * Creates ASCII trend chart for cost visualization
   */
  createTrendChart(trendData: TrendData[], options: TrendChartOptions = {
    width: 60,
    showLabels: true,
    currency: 'USD'
  }): string {
    if (!trendData || trendData.length === 0) {
      return chalk.red('No trend data available');
    }

    let output = '\n' + chalk.bold.cyan('📈 Cost Trend Analysis') + '\n';
    output += '═'.repeat(50) + '\n\n';

    const maxCost = Math.max(...trendData.map(d => d.actualCost));
    const minCost = Math.min(...trendData.map(d => d.actualCost));
    const range = maxCost - minCost;

    trendData.forEach((data, index) => {
      const normalizedValue = range > 0 ? (data.actualCost - minCost) / range : 0.5;
      const barLength = Math.round(normalizedValue * options.width);

      // Create the bar
      const bar = '█'.repeat(barLength) + '░'.repeat(options.width - barLength);
      const coloredBar = this.colorizeBar(bar, normalizedValue, options.colorThreshold);

      // Format the line
      const period = moment(data.period).format('MMM YYYY');
      const cost = this.formatCurrency(data.actualCost, options.currency);
      const change = data.changeFromPrevious ?
        this.formatChangeIndicator(data.changeFromPrevious.percentage) : '';

      output += `${period.padEnd(10)} ${coloredBar} ${cost.padStart(10)} ${change}\n`;
    });

    output += '\n' + '─'.repeat(options.width + 25) + '\n';
    output += `Range: ${this.formatCurrency(minCost, options.currency)} - ${this.formatCurrency(maxCost, options.currency)}\n`;

    return output;
  }

  /**
   * Creates a progress bar for long-running operations
   */
  startProgress(label: string, total: number = 100): void {
    if (this.progressBar) {
      this.progressBar.stop();
    }

    this.progressBar = new cliProgress.SingleBar({
      format: `${chalk.cyan(label)} ${chalk.cyan('[')}${chalk.yellow('{bar}')}${chalk.cyan(']')} {percentage}% | ETA: {eta}s | {value}/{total}`,
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    this.progressBar.start(total, 0);
  }

  /**
   * Updates progress bar
   */
  updateProgress(value: number, payload?: object): void {
    if (this.progressBar) {
      this.progressBar.update(value, payload);
    }
  }

  /**
   * Stops and clears progress bar
   */
  stopProgress(): void {
    if (this.progressBar) {
      this.progressBar.stop();
      this.progressBar = null;
    }
  }

  /**
   * Creates a cost anomaly alert box
   */
  createAnomalyAlert(anomalies: Array<{
    date: string;
    actualCost: number;
    expectedCost: number;
    deviation: number;
    severity: string;
    description?: string;
  }>): string {
    if (anomalies.length === 0) {
      return chalk.green('✅ No cost anomalies detected');
    }

    let output = '\n' + chalk.bold.red('🚨 Cost Anomalies Detected') + '\n';
    output += '═'.repeat(50) + '\n\n';

    anomalies.forEach(anomaly => {
      const severityColor = this.getSeverityColor(anomaly.severity);
      const icon = this.getSeverityIcon(anomaly.severity);

      output += chalk[severityColor](`${icon} ${anomaly.date}\n`);
      output += `   Expected: ${this.formatCurrency(anomaly.expectedCost, 'USD')}\n`;
      output += `   Actual:   ${this.formatCurrency(anomaly.actualCost, 'USD')}\n`;
      output += `   Deviation: ${anomaly.deviation > 0 ? '+' : ''}${anomaly.deviation.toFixed(1)}%\n`;

      if (anomaly.description) {
        output += `   ${chalk.gray(anomaly.description)}\n`;
      }
      output += '\n';
    });

    return output;
  }

  /**
   * Creates a fancy header with branding
   */
  createHeader(title: string, subtitle?: string): string {
    const width = 60;
    let output = '\n';

    // Top border
    output += chalk.cyan('┌' + '─'.repeat(width - 2) + '┐') + '\n';

    // Title line
    const titlePadding = Math.floor((width - title.length - 4) / 2);
    output += chalk.cyan('│') + ' '.repeat(titlePadding) + chalk.bold.white(title) +
              ' '.repeat(width - title.length - titlePadding - 2) + chalk.cyan('│') + '\n';

    // Subtitle if provided
    if (subtitle) {
      const subtitlePadding = Math.floor((width - subtitle.length - 4) / 2);
      output += chalk.cyan('│') + ' '.repeat(subtitlePadding) + chalk.gray(subtitle) +
                ' '.repeat(width - subtitle.length - subtitlePadding - 2) + chalk.cyan('│') + '\n';
    }

    // Bottom border
    output += chalk.cyan('└' + '─'.repeat(width - 2) + '┘') + '\n\n';

    return output;
  }

  // Helper methods
  private formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  private calculateChange(current: number, previous: number): string {
    if (previous === 0) return '';

    const change = ((current - previous) / previous) * 100;
    const changeStr = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;

    if (change > 0) {
      return chalk.red(`↗ ${changeStr}`);
    } else if (change < 0) {
      return chalk.green(`↘ ${changeStr}`);
    } else {
      return chalk.gray('→ 0.0%');
    }
  }

  private getTrendIndicator(current: number, previous: number): string {
    if (previous === 0) return chalk.gray('─');

    const change = ((current - previous) / previous) * 100;

    if (change > 10) return chalk.red('↗↗');
    if (change > 0) return chalk.yellow('↗');
    if (change < -10) return chalk.green('↘↘');
    if (change < 0) return chalk.green('↘');
    return chalk.gray('→');
  }

  private colorizeBar(bar: string, normalizedValue: number, threshold?: number): string {
    const thresholdValue = threshold || 0.7;

    if (normalizedValue > thresholdValue) {
      return chalk.red(bar);
    } else if (normalizedValue > 0.4) {
      return chalk.yellow(bar);
    } else {
      return chalk.green(bar);
    }
  }

  private formatChangeIndicator(percentage: number): string {
    const indicator = percentage >= 0 ? '↗' : '↘';
    const color = percentage >= 0 ? 'red' : 'green';
    const sign = percentage >= 0 ? '+' : '';

    return chalk[color](`${indicator} ${sign}${percentage.toFixed(1)}%`);
  }

  private getSeverityColor(severity: string): keyof typeof chalk {
    switch (severity.toLowerCase()) {
      case 'critical': return 'red';
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'cyan';
      default: return 'gray';
    }
  }

  private getSeverityIcon(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  }
}

export default TerminalUIEngine;