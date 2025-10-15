import puppeteer, { Browser, Page } from 'puppeteer';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import moment from 'moment';
import {
  CostBreakdown,
  CostTrendAnalysis,
  ResourceInventory,
  FinOpsRecommendation,
  AccountInfo,
  CloudProvider
} from '../types/providers';

interface PDFExportOptions {
  outputPath?: string;
  filename?: string;
  includeCharts: boolean;
  includeSummary: boolean;
  includeDetails: boolean;
  includeRecommendations: boolean;
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  theme?: 'light' | 'dark';
}

interface AuditReportData {
  accountInfo: AccountInfo;
  costBreakdown: CostBreakdown;
  trendAnalysis?: CostTrendAnalysis;
  resourceInventory?: ResourceInventory;
  recommendations?: FinOpsRecommendation[];
  anomalies?: Array<{
    date: string;
    actualCost: number;
    expectedCost: number;
    deviation: number;
    severity: string;
    description?: string;
  }>;
  generatedAt: Date;
  reportPeriod: {
    start: Date;
    end: Date;
  };
}

export class PDFExporter {
  private browser: Browser | null = null;
  private options: PDFExportOptions;

  constructor(options: Partial<PDFExportOptions> = {}) {
    this.options = {
      outputPath: './reports',
      includeCharts: true,
      includeSummary: true,
      includeDetails: true,
      includeRecommendations: true,
      format: 'A4',
      orientation: 'portrait',
      theme: 'light',
      ...options
    };
  }

  /**
   * Generate comprehensive audit report PDF
   */
  async generateAuditReport(data: AuditReportData): Promise<string> {
    try {
      await this.initializeBrowser();

      const html = this.generateAuditHTML(data);
      const filename = this.options.filename ||
        `infra-cost-audit-${moment(data.generatedAt).format('YYYY-MM-DD-HHmm')}.pdf`;

      const outputPath = this.ensureOutputDirectory();
      const fullPath = join(outputPath, filename);

      const page = await this.browser!.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      await page.pdf({
        path: fullPath,
        format: this.options.format,
        orientation: this.options.orientation,
        printBackground: true,
        margin: {
          top: '1in',
          bottom: '1in',
          left: '0.8in',
          right: '0.8in'
        },
        displayHeaderFooter: true,
        headerTemplate: this.generateHeaderTemplate(data.accountInfo),
        footerTemplate: this.generateFooterTemplate()
      });

      await page.close();
      await this.closeBrowser();

      return fullPath;
    } catch (error) {
      await this.closeBrowser();
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate cost trend report PDF
   */
  async generateTrendReport(
    accountInfo: AccountInfo,
    trendAnalysis: CostTrendAnalysis
  ): Promise<string> {
    const data: AuditReportData = {
      accountInfo,
      costBreakdown: {
        totals: {
          lastMonth: 0,
          thisMonth: 0,
          last7Days: 0,
          yesterday: 0
        },
        totalsByService: {
          lastMonth: {},
          thisMonth: {},
          last7Days: {},
          yesterday: {}
        }
      },
      trendAnalysis,
      generatedAt: new Date(),
      reportPeriod: {
        start: new Date(trendAnalysis.timeRange?.start || Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
        end: new Date(trendAnalysis.timeRange?.end || Date.now())
      }
    };

    return this.generateAuditReport(data);
  }

  /**
   * Generate executive summary PDF
   */
  async generateExecutiveSummary(data: AuditReportData): Promise<string> {
    this.options.includeDetails = false;
    this.options.includeCharts = true;
    this.options.includeSummary = true;
    this.options.includeRecommendations = true;

    const filename = `infra-cost-executive-summary-${moment(data.generatedAt).format('YYYY-MM-DD')}.pdf`;
    this.options.filename = filename;

    return this.generateAuditReport(data);
  }

  private generateAuditHTML(data: AuditReportData): string {
    const theme = this.getThemeStyles();

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Infrastructure Cost Audit Report</title>
      <style>
        ${theme}
        ${this.getBaseStyles()}
      </style>
    </head>
    <body>
      <div class="report-container">
        ${this.generateCoverPage(data)}
        ${this.options.includeSummary ? this.generateExecutiveSummary(data) : ''}
        ${this.generateCostBreakdownSection(data.costBreakdown)}
        ${data.trendAnalysis && this.options.includeCharts ? this.generateTrendAnalysisSection(data.trendAnalysis) : ''}
        ${data.resourceInventory && this.options.includeDetails ? this.generateResourceInventorySection(data.resourceInventory) : ''}
        ${data.anomalies && data.anomalies.length > 0 ? this.generateAnomaliesSection(data.anomalies) : ''}
        ${data.recommendations && this.options.includeRecommendations ? this.generateRecommendationsSection(data.recommendations) : ''}
        ${this.generateAppendixSection(data)}
      </div>
    </body>
    </html>`;
  }

  private generateCoverPage(data: AuditReportData): string {
    return `
    <div class="cover-page">
      <div class="header">
        <h1>Infrastructure Cost Analysis Report</h1>
        <div class="subtitle">Comprehensive Cloud Cost Audit & Optimization</div>
      </div>

      <div class="account-info">
        <h2>Account Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <strong>Account ID:</strong> ${data.accountInfo.id}
          </div>
          <div class="info-item">
            <strong>Account Name:</strong> ${data.accountInfo.name || 'N/A'}
          </div>
          <div class="info-item">
            <strong>Cloud Provider:</strong> ${this.getProviderDisplayName(data.accountInfo.provider)}
          </div>
          <div class="info-item">
            <strong>Report Generated:</strong> ${moment(data.generatedAt).format('MMMM Do YYYY, h:mm:ss a')}
          </div>
          <div class="info-item">
            <strong>Report Period:</strong>
            ${moment(data.reportPeriod.start).format('MMM DD, YYYY')} -
            ${moment(data.reportPeriod.end).format('MMM DD, YYYY')}
          </div>
        </div>
      </div>

      <div class="cost-summary-card">
        <h2>Cost Summary</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="amount">${this.formatCurrency(data.costBreakdown.totals.thisMonth)}</div>
            <div class="label">This Month</div>
          </div>
          <div class="summary-item">
            <div class="amount">${this.formatCurrency(data.costBreakdown.totals.lastMonth)}</div>
            <div class="label">Last Month</div>
          </div>
          <div class="summary-item">
            <div class="amount">${this.formatCurrency(data.costBreakdown.totals.last7Days)}</div>
            <div class="label">Last 7 Days</div>
          </div>
          <div class="summary-item">
            <div class="amount">${this.formatCurrency(data.costBreakdown.totals.yesterday)}</div>
            <div class="label">Yesterday</div>
          </div>
        </div>
      </div>

      <div class="report-scope">
        <h2>Report Scope</h2>
        <ul>
          ${this.options.includeSummary ? '<li>Executive Summary</li>' : ''}
          <li>Cost Breakdown Analysis</li>
          ${this.options.includeCharts ? '<li>Trend Analysis & Visualizations</li>' : ''}
          ${this.options.includeDetails ? '<li>Resource Inventory</li>' : ''}
          ${this.options.includeRecommendations ? '<li>Cost Optimization Recommendations</li>' : ''}
        </ul>
      </div>
    </div>
    <div class="page-break"></div>`;
  }

  private generateExecutiveSummary(data: AuditReportData): string {
    const monthlyChange = this.calculatePercentageChange(
      data.costBreakdown.totals.thisMonth,
      data.costBreakdown.totals.lastMonth
    );

    const topServices = Object.entries(data.costBreakdown.totalsByService.thisMonth)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return `
    <div class="section">
      <h1>Executive Summary</h1>

      <div class="executive-insights">
        <div class="insight-card ${monthlyChange >= 0 ? 'warning' : 'success'}">
          <h3>Monthly Cost Trend</h3>
          <p>Your cloud spending has ${monthlyChange >= 0 ? 'increased' : 'decreased'} by
          <strong>${Math.abs(monthlyChange).toFixed(1)}%</strong> compared to last month.</p>
        </div>

        <div class="insight-card info">
          <h3>Top Cost Drivers</h3>
          <ul>
            ${topServices.map(([service, cost]) => `
              <li>${service}: ${this.formatCurrency(cost)}
                  (${((cost / data.costBreakdown.totals.thisMonth) * 100).toFixed(1)}% of total)
              </li>
            `).join('')}
          </ul>
        </div>

        ${data.anomalies && data.anomalies.length > 0 ? `
          <div class="insight-card warning">
            <h3>Cost Anomalies</h3>
            <p><strong>${data.anomalies.length}</strong> cost anomalies detected requiring attention.</p>
          </div>
        ` : ''}
      </div>

      <div class="key-metrics">
        <h3>Key Performance Indicators</h3>
        <div class="metrics-grid">
          <div class="metric">
            <div class="metric-value">${this.formatCurrency(data.costBreakdown.totals.thisMonth / moment().date())}</div>
            <div class="metric-label">Avg Daily Spend</div>
          </div>
          <div class="metric">
            <div class="metric-value">${topServices.length}</div>
            <div class="metric-label">Active Services</div>
          </div>
          <div class="metric">
            <div class="metric-value">${data.trendAnalysis?.projectedMonthlyCost ? this.formatCurrency(data.trendAnalysis.projectedMonthlyCost) : 'N/A'}</div>
            <div class="metric-label">Projected Monthly</div>
          </div>
        </div>
      </div>
    </div>
    <div class="page-break"></div>`;
  }

  private generateCostBreakdownSection(costBreakdown: CostBreakdown): string {
    const serviceEntries = Object.entries(costBreakdown.totalsByService.thisMonth)
      .filter(([, cost]) => cost > 0)
      .sort(([, a], [, b]) => b - a);

    return `
    <div class="section">
      <h1>Cost Breakdown Analysis</h1>

      <div class="cost-comparison">
        <h3>Period Comparison</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Total Cost</th>
              <th>Change</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>This Month</td>
              <td>${this.formatCurrency(costBreakdown.totals.thisMonth)}</td>
              <td>${this.formatChangePercentage(costBreakdown.totals.thisMonth, costBreakdown.totals.lastMonth)}</td>
              <td>${this.getTrendIcon(costBreakdown.totals.thisMonth, costBreakdown.totals.lastMonth)}</td>
            </tr>
            <tr>
              <td>Last Month</td>
              <td>${this.formatCurrency(costBreakdown.totals.lastMonth)}</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Last 7 Days</td>
              <td>${this.formatCurrency(costBreakdown.totals.last7Days)}</td>
              <td>${this.formatChangePercentage(costBreakdown.totals.last7Days, costBreakdown.totals.yesterday * 7)}</td>
              <td>${this.getTrendIcon(costBreakdown.totals.last7Days, costBreakdown.totals.yesterday * 7)}</td>
            </tr>
            <tr>
              <td>Yesterday</td>
              <td>${this.formatCurrency(costBreakdown.totals.yesterday)}</td>
              <td>-</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="service-breakdown">
        <h3>Service-Level Breakdown (This Month)</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Cost</th>
              <th>Share</th>
              <th>vs Last Month</th>
            </tr>
          </thead>
          <tbody>
            ${serviceEntries.map(([service, cost]) => {
              const share = ((cost / costBreakdown.totals.thisMonth) * 100).toFixed(1);
              const lastMonthCost = costBreakdown.totalsByService.lastMonth[service] || 0;
              const change = this.formatChangePercentage(cost, lastMonthCost);

              return `
                <tr>
                  <td>${service}</td>
                  <td>${this.formatCurrency(cost)}</td>
                  <td>${share}%</td>
                  <td>${change}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="page-break"></div>`;
  }

  private generateTrendAnalysisSection(trendAnalysis: CostTrendAnalysis): string {
    return `
    <div class="section">
      <h1>Trend Analysis</h1>

      <div class="trend-insights">
        <div class="insight-grid">
          <div class="insight-item">
            <div class="insight-value">${this.formatCurrency(trendAnalysis.totalCost)}</div>
            <div class="insight-label">Total Period Cost</div>
          </div>
          <div class="insight-item">
            <div class="insight-value">${this.formatCurrency(trendAnalysis.averageDailyCost)}</div>
            <div class="insight-label">Average Daily Cost</div>
          </div>
          <div class="insight-item">
            <div class="insight-value">${this.formatCurrency(trendAnalysis.projectedMonthlyCost)}</div>
            <div class="insight-label">Projected Monthly</div>
          </div>
          <div class="insight-item">
            <div class="insight-value">${trendAnalysis.avgMonthOverMonthGrowth?.toFixed(1) || 'N/A'}%</div>
            <div class="insight-label">Avg MoM Growth</div>
          </div>
        </div>
      </div>

      ${trendAnalysis.topServices ? `
        <div class="top-services">
          <h3>Top Services by Cost</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Cost</th>
                <th>Share</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              ${trendAnalysis.topServices.map(service => `
                <tr>
                  <td>${service.serviceName}</td>
                  <td>${this.formatCurrency(service.cost)}</td>
                  <td>${service.percentage.toFixed(1)}%</td>
                  <td>${service.trend}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      ${trendAnalysis.analytics ? `
        <div class="analytics-insights">
          <h3>Analytics Insights</h3>
          <ul>
            ${trendAnalysis.analytics.insights.map(insight => `<li>${insight}</li>`).join('')}
          </ul>

          <div class="analytics-metrics">
            <div class="metric-row">
              <span>Volatility Score:</span>
              <span class="metric-value">${trendAnalysis.analytics.volatilityScore.toFixed(2)}</span>
            </div>
            <div class="metric-row">
              <span>Trend Strength:</span>
              <span class="metric-value">${trendAnalysis.analytics.trendStrength.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
    <div class="page-break"></div>`;
  }

  private generateResourceInventorySection(inventory: ResourceInventory): string {
    return `
    <div class="section">
      <h1>Resource Inventory</h1>

      <div class="inventory-summary">
        <div class="summary-stats">
          <div class="stat">
            <div class="stat-value">${inventory.totalResources}</div>
            <div class="stat-label">Total Resources</div>
          </div>
          <div class="stat">
            <div class="stat-value">${this.formatCurrency(inventory.totalCost)}</div>
            <div class="stat-label">Total Cost</div>
          </div>
          <div class="stat">
            <div class="stat-value">${inventory.region}</div>
            <div class="stat-label">Primary Region</div>
          </div>
        </div>
      </div>

      <div class="resource-breakdown">
        <h3>Resources by Type</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Resource Type</th>
              <th>Count</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(inventory.resourcesByType).map(([type, count]) => `
              <tr>
                <td>${type.charAt(0).toUpperCase() + type.slice(1)}</td>
                <td>${count}</td>
                <td>${((count / inventory.totalResources) * 100).toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <div class="page-break"></div>`;
  }

  private generateAnomaliesSection(anomalies: Array<{
    date: string;
    actualCost: number;
    expectedCost: number;
    deviation: number;
    severity: string;
    description?: string;
  }>): string {
    return `
    <div class="section">
      <h1>Cost Anomalies</h1>

      <div class="anomalies-overview">
        <p class="overview-text">
          <strong>${anomalies.length}</strong> cost anomalies have been detected during the report period.
          These represent significant deviations from expected spending patterns and require investigation.
        </p>
      </div>

      <div class="anomalies-list">
        ${anomalies.map(anomaly => `
          <div class="anomaly-card severity-${anomaly.severity.toLowerCase()}">
            <div class="anomaly-header">
              <h4>${moment(anomaly.date).format('MMMM DD, YYYY')}</h4>
              <span class="severity-badge ${anomaly.severity.toLowerCase()}">${anomaly.severity}</span>
            </div>
            <div class="anomaly-details">
              <div class="detail-row">
                <span>Expected Cost:</span>
                <span>${this.formatCurrency(anomaly.expectedCost)}</span>
              </div>
              <div class="detail-row">
                <span>Actual Cost:</span>
                <span>${this.formatCurrency(anomaly.actualCost)}</span>
              </div>
              <div class="detail-row">
                <span>Deviation:</span>
                <span class="${anomaly.deviation > 0 ? 'increase' : 'decrease'}">
                  ${anomaly.deviation > 0 ? '+' : ''}${anomaly.deviation.toFixed(1)}%
                </span>
              </div>
              ${anomaly.description ? `
                <div class="anomaly-description">
                  <p>${anomaly.description}</p>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="page-break"></div>`;
  }

  private generateRecommendationsSection(recommendations: FinOpsRecommendation[]): string {
    const totalPotentialSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings.amount, 0);

    return `
    <div class="section">
      <h1>Cost Optimization Recommendations</h1>

      <div class="recommendations-overview">
        <div class="savings-potential">
          <h3>Potential Savings: ${this.formatCurrency(totalPotentialSavings)}</h3>
          <p>${recommendations.length} optimization opportunities identified</p>
        </div>
      </div>

      <div class="recommendations-list">
        ${recommendations.map(rec => `
          <div class="recommendation-card priority-${rec.priority.toLowerCase()}">
            <div class="recommendation-header">
              <h4>${rec.title}</h4>
              <div class="recommendation-meta">
                <span class="priority-badge ${rec.priority.toLowerCase()}">${rec.priority}</span>
                <span class="effort-badge effort-${rec.effort.toLowerCase()}">${rec.effort} Effort</span>
              </div>
            </div>

            <div class="recommendation-body">
              <p>${rec.description}</p>

              <div class="savings-info">
                <div class="savings-amount">
                  Potential Savings: <strong>${this.formatCurrency(rec.potentialSavings.amount)}</strong>
                  <span class="timeframe">(${rec.potentialSavings.timeframe.toLowerCase()})</span>
                </div>
                <div class="savings-percentage">
                  ${rec.potentialSavings.percentage.toFixed(1)}% reduction
                </div>
              </div>

              ${rec.implementationSteps.length > 0 ? `
                <div class="implementation-steps">
                  <h5>Implementation Steps:</h5>
                  <ol>
                    ${rec.implementationSteps.map(step => `<li>${step}</li>`).join('')}
                  </ol>
                </div>
              ` : ''}

              ${rec.resources && rec.resources.length > 0 ? `
                <div class="affected-resources">
                  <h5>Affected Resources:</h5>
                  <ul>
                    ${rec.resources.map(resource => `<li>${resource}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}

              ${rec.tags.length > 0 ? `
                <div class="recommendation-tags">
                  ${rec.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    <div class="page-break"></div>`;
  }

  private generateAppendixSection(data: AuditReportData): string {
    return `
    <div class="section">
      <h1>Appendix</h1>

      <div class="report-metadata">
        <h3>Report Generation Details</h3>
        <table class="metadata-table">
          <tr>
            <td>Report Generated:</td>
            <td>${moment(data.generatedAt).format('MMMM Do YYYY, h:mm:ss a')}</td>
          </tr>
          <tr>
            <td>Tool Version:</td>
            <td>infra-cost v0.1.0</td>
          </tr>
          <tr>
            <td>Report Type:</td>
            <td>Comprehensive Audit Report</td>
          </tr>
          <tr>
            <td>Data Source:</td>
            <td>${this.getProviderDisplayName(data.accountInfo.provider)} Cost Explorer API</td>
          </tr>
          <tr>
            <td>Analysis Period:</td>
            <td>${moment(data.reportPeriod.start).format('MMM DD, YYYY')} - ${moment(data.reportPeriod.end).format('MMM DD, YYYY')}</td>
          </tr>
        </table>
      </div>

      <div class="methodology">
        <h3>Methodology</h3>
        <ul>
          <li>Cost data retrieved from cloud provider's native billing APIs</li>
          <li>Trend analysis based on historical spending patterns</li>
          <li>Anomaly detection using statistical analysis and machine learning algorithms</li>
          <li>Recommendations generated based on FinOps best practices and usage patterns</li>
          <li>All costs displayed in USD unless otherwise specified</li>
        </ul>
      </div>

      <div class="disclaimers">
        <h3>Important Notes</h3>
        <ul>
          <li>Cost data is subject to cloud provider billing cycles and may include estimates</li>
          <li>Savings projections are estimates based on current usage patterns</li>
          <li>Implementation of recommendations should be carefully planned and tested</li>
          <li>This report is generated automatically and should be reviewed by qualified personnel</li>
        </ul>
      </div>
    </div>`;
  }

  // Helper methods and styles...
  private getThemeStyles(): string {
    if (this.options.theme === 'dark') {
      return `
        :root {
          --primary-color: #2563eb;
          --secondary-color: #64748b;
          --background-color: #1e293b;
          --text-color: #f8fafc;
          --border-color: #374151;
          --success-color: #10b981;
          --warning-color: #f59e0b;
          --danger-color: #ef4444;
          --card-background: #334155;
        }
      `;
    }

    return `
      :root {
        --primary-color: #2563eb;
        --secondary-color: #64748b;
        --background-color: #ffffff;
        --text-color: #1f2937;
        --border-color: #e5e7eb;
        --success-color: #10b981;
        --warning-color: #f59e0b;
        --danger-color: #ef4444;
        --card-background: #f9fafb;
      }
    `;
  }

  private getBaseStyles(): string {
    return `
      body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: var(--text-color);
        background-color: var(--background-color);
        margin: 0;
        padding: 0;
      }

      .report-container {
        max-width: 100%;
        margin: 0 auto;
      }

      .page-break {
        page-break-before: always;
      }

      .cover-page {
        text-align: center;
        padding: 2rem;
        min-height: 80vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .header h1 {
        font-size: 2.5rem;
        color: var(--primary-color);
        margin-bottom: 0.5rem;
      }

      .subtitle {
        font-size: 1.2rem;
        color: var(--secondary-color);
        margin-bottom: 3rem;
      }

      .section {
        padding: 2rem;
        margin-bottom: 2rem;
      }

      .section h1 {
        color: var(--primary-color);
        border-bottom: 2px solid var(--primary-color);
        padding-bottom: 0.5rem;
        margin-bottom: 2rem;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
      }

      .data-table th,
      .data-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }

      .data-table th {
        background-color: var(--card-background);
        font-weight: 600;
      }

      .cost-summary-card {
        background: var(--card-background);
        border-radius: 8px;
        padding: 2rem;
        margin: 2rem 0;
        border: 1px solid var(--border-color);
      }

      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1rem;
        text-align: center;
      }

      .summary-item .amount {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--primary-color);
      }

      .summary-item .label {
        color: var(--secondary-color);
        font-size: 0.9rem;
      }

      .anomaly-card {
        border-left: 4px solid;
        padding: 1rem;
        margin: 1rem 0;
        background: var(--card-background);
        border-radius: 0 8px 8px 0;
      }

      .anomaly-card.severity-critical {
        border-left-color: var(--danger-color);
      }

      .anomaly-card.severity-high {
        border-left-color: #ff6b35;
      }

      .anomaly-card.severity-medium {
        border-left-color: var(--warning-color);
      }

      .anomaly-card.severity-low {
        border-left-color: #3b82f6;
      }

      .recommendation-card {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 1.5rem;
        margin: 1rem 0;
        background: var(--card-background);
      }

      .priority-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .priority-badge.critical {
        background-color: var(--danger-color);
        color: white;
      }

      .priority-badge.high {
        background-color: #ff6b35;
        color: white;
      }

      .priority-badge.medium {
        background-color: var(--warning-color);
        color: white;
      }

      .priority-badge.low {
        background-color: #3b82f6;
        color: white;
      }

      .trend-chart {
        font-family: monospace;
        background: var(--card-background);
        padding: 1rem;
        border-radius: 4px;
        margin: 1rem 0;
      }

      @media print {
        body { print-color-adjust: exact; }
        .page-break { page-break-before: always; }
      }
    `;
  }

  private generateHeaderTemplate(accountInfo: AccountInfo): string {
    return `
    <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-top: 10px;">
      Infrastructure Cost Report - ${accountInfo.name || accountInfo.id} - ${this.getProviderDisplayName(accountInfo.provider)}
    </div>`;
  }

  private generateFooterTemplate(): string {
    return `
    <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-bottom: 10px;">
      <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
        <span>Generated by infra-cost v0.1.0</span>
        <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        <span>${moment().format('YYYY-MM-DD HH:mm')}</span>
      </div>
    </div>`;
  }

  private async initializeBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private ensureOutputDirectory(): string {
    const outputPath = this.options.outputPath!;

    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
    }

    return outputPath;
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  private formatChangePercentage(current: number, previous: number): string {
    const change = this.calculatePercentageChange(current, previous);
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  }

  private getTrendIcon(current: number, previous: number): string {
    const change = this.calculatePercentageChange(current, previous);
    if (change > 5) return '↗️';
    if (change < -5) return '↘️';
    return '➡️';
  }

  private getProviderDisplayName(provider: CloudProvider): string {
    const displayNames = {
      [CloudProvider.AWS]: 'Amazon Web Services',
      [CloudProvider.GOOGLE_CLOUD]: 'Google Cloud Platform',
      [CloudProvider.AZURE]: 'Microsoft Azure',
      [CloudProvider.ALIBABA_CLOUD]: 'Alibaba Cloud',
      [CloudProvider.ORACLE_CLOUD]: 'Oracle Cloud Infrastructure'
    };

    return displayNames[provider] || provider;
  }
}

export default PDFExporter;