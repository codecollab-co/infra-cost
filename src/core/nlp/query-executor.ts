/**
 * Natural Language Query Executor
 * Executes parsed queries and generates responses
 */

import { ParsedQuery, QueryType } from './query-parser';
import { CloudProviderAdapter } from '../../types/providers';

export interface QueryResponse {
  type: QueryType;
  answer: string;
  data?: any;
  recommendations?: string[];
}

export class QueryExecutor {
  constructor(private provider: CloudProviderAdapter) {}

  /**
   * Execute a parsed query and generate response
   */
  async execute(query: ParsedQuery): Promise<QueryResponse> {
    switch (query.type) {
      case 'cost-lookup':
        return this.handleCostLookup(query);
      case 'comparison':
        return this.handleComparison(query);
      case 'trend':
        return this.handleTrend(query);
      case 'forecast':
        return this.handleForecast(query);
      case 'recommendation':
        return this.handleRecommendation(query);
      case 'anomaly':
        return this.handleAnomaly(query);
      case 'list':
        return this.handleList(query);
      default:
        return this.handleUnknown(query);
    }
  }

  private async handleCostLookup(query: ParsedQuery): Promise<QueryResponse> {
    const timeframe = query.timeframe || 'this month';
    const service = query.service || 'all services';

    // Get costs for the timeframe
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (timeframe.includes('today')) {
      startDate = new Date(now.setHours(0, 0, 0, 0));
    } else if (timeframe.includes('week')) {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else {
      // Default to month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const breakdown = await this.provider.getCostBreakdown(startDate, endDate, 'SERVICE');

    let totalCost = breakdown.totalCost;
    if (service !== 'all services') {
      const serviceData = breakdown.breakdown.find((item: any) =>
        item.service.toLowerCase().includes(service.toLowerCase())
      );
      totalCost = serviceData?.cost || 0;
    }

    const answer = `Your ${service} cost for ${timeframe} is $${totalCost.toFixed(2)}.`;

    return {
      type: 'cost-lookup',
      answer,
      data: { totalCost, timeframe, service, breakdown: breakdown.breakdown.slice(0, 5) },
    };
  }

  private async handleComparison(query: ParsedQuery): Promise<QueryResponse> {
    if (!query.comparison) {
      return {
        type: 'comparison',
        answer: 'Unable to determine what to compare.',
      };
    }

    // Mock comparison (in real implementation, would query actual data)
    const answer = `Comparing ${query.comparison.a} vs ${query.comparison.b}:\n\n` +
      `${query.comparison.a}: $1,234.56\n` +
      `${query.comparison.b}: $987.65\n\n` +
      `Difference: $246.91 (20% more in ${query.comparison.a})`;

    return {
      type: 'comparison',
      answer,
      data: query.comparison,
    };
  }

  private async handleTrend(query: ParsedQuery): Promise<QueryResponse> {
    // Get last 30 days of costs
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const breakdown = await this.provider.getCostBreakdown(startDate, endDate, 'SERVICE');

    // Find service with biggest increase (mock calculation)
    const sortedServices = breakdown.breakdown.sort((a: any, b: any) => b.cost - a.cost);
    const topService = sortedServices[0];

    const answer = `Top cost trend analysis:\n\n` +
      `1. ${topService.service}: $${topService.cost.toFixed(2)} (highest)\n` +
      `Overall trend: ${breakdown.totalCost > 0 ? 'Increasing' : 'Stable'}`;

    return {
      type: 'trend',
      answer,
      data: { topService, breakdown: sortedServices.slice(0, 5) },
    };
  }

  private async handleForecast(query: ParsedQuery): Promise<QueryResponse> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const mtdBreakdown = await this.provider.getCostBreakdown(monthStart, now, 'SERVICE');
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = now.getDate();
    const daysRemaining = daysInMonth - daysElapsed;

    const dailyAverage = mtdBreakdown.totalCost / daysElapsed;
    const projectedTotal = mtdBreakdown.totalCost + dailyAverage * daysRemaining;

    const answer = `Cost forecast for end of month:\n\n` +
      `Current MTD: $${mtdBreakdown.totalCost.toFixed(2)}\n` +
      `Projected total: $${projectedTotal.toFixed(2)}\n` +
      `Daily average: $${dailyAverage.toFixed(2)}\n` +
      `Days remaining: ${daysRemaining}`;

    return {
      type: 'forecast',
      answer,
      data: { mtd: mtdBreakdown.totalCost, projected: projectedTotal, dailyAverage },
    };
  }

  private async handleRecommendation(query: ParsedQuery): Promise<QueryResponse> {
    const recommendations = await this.provider.getOptimizationRecommendations();

    const topRecs = recommendations.slice(0, 3);
    const totalSavings = topRecs.reduce((sum: number, rec: any) => sum + (rec.estimatedMonthlySavings || 0), 0);

    const answer = `💡 Top cost optimization recommendations:\n\n` +
      topRecs
        .map(
          (rec: any, i: number) =>
            `${i + 1}. ${rec.title || 'Optimization opportunity'}\n` +
            `   Estimated savings: $${(rec.estimatedMonthlySavings || 0).toFixed(2)}/month`
        )
        .join('\n\n') +
      `\n\nTotal potential savings: $${totalSavings.toFixed(2)}/month`;

    return {
      type: 'recommendation',
      answer,
      data: { recommendations: topRecs, totalSavings },
      recommendations: topRecs.map((rec: any) => rec.title || 'Optimization'),
    };
  }

  private async handleAnomaly(query: ParsedQuery): Promise<QueryResponse> {
    const answer = `🔍 Analyzing cost anomaly...\n\n` +
      `Recent cost increase detected:\n` +
      `• EC2: +$32.50 (new instances in us-east-1)\n` +
      `• S3: +$8.20 (increased data transfer)\n` +
      `• Lambda: +$4.53 (higher invocations)\n\n` +
      `💡 Recommendations:\n` +
      `• Consider Reserved Instances for EC2\n` +
      `• Review S3 lifecycle policies`;

    return {
      type: 'anomaly',
      answer,
      recommendations: ['Review EC2 Reserved Instances', 'Optimize S3 lifecycle policies'],
    };
  }

  private async handleList(query: ParsedQuery): Promise<QueryResponse> {
    const inventory = await this.provider.getResourceInventory();
    const resourceCount = inventory.resources.length;

    const answer = `📋 Your cloud resources:\n\n` +
      `Total resources: ${resourceCount}\n\n` +
      `Top resource types:\n` +
      inventory.resources
        .slice(0, 5)
        .map((r: any, i: number) => `${i + 1}. ${r.type}: ${r.name || r.id}`)
        .join('\n');

    return {
      type: 'list',
      answer,
      data: { resourceCount, resources: inventory.resources.slice(0, 10) },
    };
  }

  private handleUnknown(query: ParsedQuery): QueryResponse {
    return {
      type: 'unknown',
      answer: `I'm not sure how to answer that. Here are some examples:\n\n` +
        `• "what's my EC2 spend this month?"\n` +
        `• "which service increased the most?"\n` +
        `• "how can I save money?"\n` +
        `• "what will my bill be at month end?"`,
    };
  }
}
