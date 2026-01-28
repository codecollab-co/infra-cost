import {
  CloudProvider,
  CostBreakdown,
  TrendData,
  CostTrendAnalysis,
  FinOpsRecommendation,
  AccountInfo,
  ResourceInventory,
  ResourceType
} from '../types/providers';

/**
 * Demo data generator for testing enhanced features without real cloud credentials
 */
export class DemoDataGenerator {

  /**
   * Generate sample account information
   */
  static generateAccountInfo(): AccountInfo {
    return {
      id: '123456789012',
      name: 'Demo Production Account',
      provider: CloudProvider.AWS
    };
  }

  /**
   * Generate realistic cost breakdown data
   */
  static generateCostBreakdown(): CostBreakdown {
    const services = [
      'Amazon EC2-Instance', 'Amazon S3', 'Amazon RDS', 'AWS Lambda',
      'Amazon CloudFront', 'Amazon EBS', 'Amazon VPC', 'Amazon Route 53',
      'AWS Application Load Balancer', 'Amazon ElastiCache', 'Amazon SES',
      'Amazon CloudWatch', 'AWS Data Transfer', 'Amazon DynamoDB'
    ];

    const generateServiceCosts = (baseMultiplier: number) => {
      const costs: { [key: string]: number } = {};
      services.forEach(service => {
        // Generate realistic cost variations
        const baseCost = Math.random() * 1000 * baseMultiplier;
        const serviceMultiplier = this.getServiceMultiplier(service);
        costs[service] = Math.round(baseCost * serviceMultiplier * 100) / 100;
      });
      return costs;
    };

    const lastMonth = generateServiceCosts(1.0);
    const thisMonth = generateServiceCosts(0.85); // 15% decrease this month
    const last7Days = generateServiceCosts(0.2); // Proportional to monthly
    const yesterday = generateServiceCosts(0.03); // Daily portion

    return {
      totals: {
        lastMonth: Object.values(lastMonth).reduce((sum, cost) => sum + cost, 0),
        thisMonth: Object.values(thisMonth).reduce((sum, cost) => sum + cost, 0),
        last7Days: Object.values(last7Days).reduce((sum, cost) => sum + cost, 0),
        yesterday: Object.values(yesterday).reduce((sum, cost) => sum + cost, 0)
      },
      totalsByService: {
        lastMonth,
        thisMonth,
        last7Days,
        yesterday
      }
    };
  }

  /**
   * Generate trend analysis data for the last 6 months
   */
  static generateTrendAnalysis(): CostTrendAnalysis {
    const months = 6;
    const trendData: TrendData[] = [];

    // Generate trend data with some seasonal patterns
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);

      const baselineCost = 3500;
      const seasonalFactor = 1 + 0.2 * Math.sin((date.getMonth() / 12) * 2 * Math.PI);
      const trendFactor = 1 + (months - i - 1) * 0.05; // Gradual increase
      const randomVariation = 0.9 + Math.random() * 0.2;

      const actualCost = baselineCost * seasonalFactor * trendFactor * randomVariation;
      const previousCost = i === months - 1 ? actualCost * 0.95 : trendData[i - 1]?.actualCost ?? actualCost;

      trendData.push({
        period: date.toISOString().substring(0, 7), // YYYY-MM format
        actualCost: Math.round(actualCost * 100) / 100,
        forecastedCost: actualCost * (0.95 + Math.random() * 0.1),
        budgetLimit: 4000,
        previousPeriodCost: previousCost,
        changeFromPrevious: {
          amount: actualCost - previousCost,
          percentage: ((actualCost - previousCost) / previousCost) * 100
        }
      });
    }

    // Generate top services data
    const topServices = [
      { serviceName: 'Amazon EC2-Instance', cost: 1250.80, percentage: 32.1, trend: 'INCREASING' as const },
      { serviceName: 'Amazon RDS', cost: 890.45, percentage: 22.9, trend: 'STABLE' as const },
      { serviceName: 'Amazon S3', cost: 420.30, percentage: 10.8, trend: 'DECREASING' as const },
      { serviceName: 'AWS Lambda', cost: 380.70, percentage: 9.8, trend: 'INCREASING' as const },
      { serviceName: 'Amazon CloudFront', cost: 220.15, percentage: 5.7, trend: 'STABLE' as const }
    ];

    // Generate cost anomalies
    const costAnomalies = [
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        actualCost: 4850.30,
        expectedCost: 3200.50,
        deviation: 51.6,
        severity: 'HIGH' as const,
        possibleCause: 'EC2 instance scale-out event',
        description: 'Unusual spike in EC2 costs detected during weekend scaling event'
      },
      {
        date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        actualCost: 2100.80,
        expectedCost: 3100.20,
        deviation: -32.2,
        severity: 'MEDIUM' as const,
        possibleCause: 'Scheduled maintenance window',
        description: 'Lower than expected costs during planned maintenance'
      }
    ];

    return {
      provider: CloudProvider.AWS,
      timeRange: {
        start: trendData[0].period + '-01',
        end: trendData[trendData.length - 1].period + '-28'
      },
      granularity: 'MONTHLY',
      trendData,
      totalCost: trendData.reduce((sum, data) => sum + data.actualCost, 0),
      averageDailyCost: trendData[trendData.length - 1].actualCost / 30,
      projectedMonthlyCost: trendData[trendData.length - 1].actualCost * 1.05,
      avgMonthOverMonthGrowth: 5.2,
      topServices,
      costAnomalies,
      analytics: {
        insights: [
          'EC2 costs have increased by 15% over the last 3 months due to increased workload',
          'S3 storage costs decreased by 8% after implementing lifecycle policies',
          'Lambda usage shows steady growth pattern aligned with application scaling',
          'RDS costs remain stable with good resource utilization',
          'CloudFront costs show seasonal variation with higher usage in Q4'
        ],
        recommendations: [
          'Consider Reserved Instances for EC2 to reduce costs by up to 30%',
          'Implement automated S3 lifecycle management for additional savings',
          'Review Lambda memory allocation for cost optimization',
          'Consider RDS instance rightsizing based on utilization metrics'
        ],
        volatilityScore: 0.15,
        trendStrength: 0.72
      }
    };
  }

  /**
   * Generate realistic FinOps recommendations
   */
  static generateRecommendations(): FinOpsRecommendation[] {
    return [
      {
        id: 'rec-001',
        type: 'COST_OPTIMIZATION',
        title: 'Purchase EC2 Reserved Instances',
        description: 'Based on your consistent EC2 usage patterns, purchasing Reserved Instances could save up to 30% on compute costs.',
        potentialSavings: {
          amount: 450.30,
          percentage: 30,
          timeframe: 'MONTHLY'
        },
        effort: 'LOW',
        priority: 'HIGH',
        resources: ['i-1234567890abcdef0', 'i-0987654321fedcba0'],
        implementationSteps: [
          'Analyze current EC2 usage patterns over the last 12 months',
          'Purchase 1-year Reserved Instances for consistent workloads',
          'Set up automated monitoring for RI utilization',
          'Review and optimize instance sizing before purchasing RIs'
        ],
        tags: ['ec2', 'reserved-instances', 'cost-optimization']
      },
      {
        id: 'rec-002',
        type: 'RESOURCE_RIGHTSIZING',
        title: 'Rightsize RDS Instances',
        description: 'Several RDS instances show low CPU utilization. Downsizing these instances could reduce costs without impacting performance.',
        potentialSavings: {
          amount: 280.75,
          percentage: 25,
          timeframe: 'MONTHLY'
        },
        effort: 'MEDIUM',
        priority: 'MEDIUM',
        resources: ['mydb-instance-1', 'mydb-instance-2'],
        implementationSteps: [
          'Review RDS CloudWatch metrics for CPU, memory, and I/O utilization',
          'Create RDS snapshots before making changes',
          'Modify instance class during maintenance window',
          'Monitor performance after changes for 1 week'
        ],
        tags: ['rds', 'rightsizing', 'database-optimization']
      },
      {
        id: 'rec-003',
        type: 'ARCHITECTURE',
        title: 'Implement S3 Intelligent Tiering',
        description: 'Enable S3 Intelligent Tiering to automatically optimize storage costs based on access patterns.',
        potentialSavings: {
          amount: 125.50,
          percentage: 15,
          timeframe: 'MONTHLY'
        },
        effort: 'LOW',
        priority: 'MEDIUM',
        resources: ['s3-bucket-logs', 's3-bucket-backups'],
        implementationSteps: [
          'Enable S3 Intelligent Tiering on identified buckets',
          'Set up lifecycle policies for automatic transitions',
          'Monitor cost impact over 3 months',
          'Review and adjust policies based on access patterns'
        ],
        tags: ['s3', 'storage-optimization', 'intelligent-tiering']
      },
      {
        id: 'rec-004',
        type: 'COST_OPTIMIZATION',
        title: 'Optimize Lambda Memory Allocation',
        description: 'Lambda functions are over-provisioned with memory. Optimizing memory allocation can reduce costs significantly.',
        potentialSavings: {
          amount: 95.80,
          percentage: 20,
          timeframe: 'MONTHLY'
        },
        effort: 'HIGH',
        priority: 'LOW',
        resources: ['process-images-lambda', 'data-processor-lambda'],
        implementationSteps: [
          'Use AWS Lambda Power Tuning tool to find optimal memory settings',
          'Test performance with different memory allocations',
          'Update Lambda configurations incrementally',
          'Set up monitoring for execution duration and cost metrics'
        ],
        tags: ['lambda', 'serverless-optimization', 'memory-tuning']
      }
    ];
  }

  /**
   * Generate sample resource inventory
   */
  static generateResourceInventory(): ResourceInventory {
    return {
      provider: CloudProvider.AWS,
      region: 'us-east-1',
      totalResources: 145,
      resourcesByType: {
        [ResourceType.COMPUTE]: 35,
        [ResourceType.STORAGE]: 28,
        [ResourceType.DATABASE]: 12,
        [ResourceType.NETWORK]: 25,
        [ResourceType.SECURITY]: 18,
        [ResourceType.SERVERLESS]: 15,
        [ResourceType.CONTAINER]: 8,
        [ResourceType.ANALYTICS]: 4
      },
      totalCost: 3890.50,
      resources: {
        compute: [],
        storage: [],
        database: [],
        network: []
      },
      lastUpdated: new Date()
    };
  }

  /**
   * Generate cost anomalies for testing
   */
  static generateCostAnomalies() {
    return [
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        actualCost: 5200.80,
        expectedCost: 3500.20,
        deviation: 48.6,
        severity: 'CRITICAL',
        description: 'Significant cost spike detected in EC2 Auto Scaling group due to unexpected traffic surge'
      },
      {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
        actualCost: 2800.30,
        expectedCost: 3200.50,
        deviation: -12.5,
        severity: 'LOW',
        description: 'Lower than expected S3 costs due to successful data archiving policies'
      }
    ];
  }

  /**
   * Helper method to generate realistic service cost multipliers
   */
  private static getServiceMultiplier(serviceName: string): number {
    const multipliers: { [key: string]: number } = {
      'Amazon EC2-Instance': 2.5,
      'Amazon RDS': 1.8,
      'Amazon S3': 1.0,
      'AWS Lambda': 0.8,
      'Amazon CloudFront': 0.6,
      'Amazon EBS': 0.9,
      'Amazon VPC': 0.3,
      'Amazon Route 53': 0.2,
      'AWS Application Load Balancer': 0.4,
      'Amazon ElastiCache': 0.7,
      'Amazon SES': 0.1,
      'Amazon CloudWatch': 0.3,
      'AWS Data Transfer': 0.5,
      'Amazon DynamoDB': 0.6
    };

    return multipliers[serviceName] ?? 0.5;
  }
}

export default DemoDataGenerator;