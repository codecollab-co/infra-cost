import { CostExplorerClient, GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer';
import { IAMClient, ListAccountAliasesCommand } from '@aws-sdk/client-iam';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { EC2Client, DescribeInstancesCommand, DescribeVolumesCommand, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { LambdaClient, ListFunctionsCommand } from '@aws-sdk/client-lambda';
import { BudgetsClient, DescribeBudgetsCommand, DescribeBudgetCommand } from '@aws-sdk/client-budgets';
import dayjs from 'dayjs';
import {
  CloudProviderAdapter,
  ProviderConfig,
  AccountInfo,
  RawCostData,
  CostBreakdown,
  CloudProvider,
  ResourceInventory,
  InventoryFilters,
  ResourceType,
  AWSEC2Instance,
  AWSS3Bucket,
  AWSRDSInstance,
  AWSLambdaFunction,
  AWSVPC,
  AWSSubnet,
  AWSEBSVolume,
  BudgetInfo,
  BudgetAlert,
  CostTrendAnalysis,
  FinOpsRecommendation,
  TrendData,
  BudgetThreshold
} from '../../types/providers';
import type { AwsCredentialIdentityProvider } from "@aws-sdk/types";
import { showSpinner } from '../../logger';
import { CostAnalyticsEngine, DataPoint, Anomaly } from '../../analytics/anomaly-detector';

export class AWSProvider extends CloudProviderAdapter {
  constructor(config: ProviderConfig) {
    super(config);
  }

  private getCredentials(): AwsCredentialIdentityProvider {
    return this.config.credentials as AwsCredentialIdentityProvider;
  }

  private getRegion(): string {
    return this.config.region || 'us-east-1';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const sts = new STSClient({
        credentials: this.getCredentials(),
        region: this.getRegion()
      });
      await sts.send(new GetCallerIdentityCommand({}));
      return true;
    } catch {
      return false;
    }
  }

  async getAccountInfo(): Promise<AccountInfo> {
    showSpinner('Getting AWS account information');

    try {
      const iam = new IAMClient({
        credentials: this.getCredentials(),
        region: this.getRegion()
      });

      const accountAliases = await iam.send(new ListAccountAliasesCommand({}));
      const foundAlias = accountAliases?.AccountAliases?.[0];

      if (foundAlias) {
        return {
          id: foundAlias,
          name: foundAlias,
          provider: CloudProvider.AWS
        };
      }

      const sts = new STSClient({
        credentials: this.getCredentials(),
        region: this.getRegion()
      });
      const accountInfo = await sts.send(new GetCallerIdentityCommand({}));

      return {
        id: accountInfo.Account || 'unknown',
        name: accountInfo.Account || 'unknown',
        provider: CloudProvider.AWS
      };
    } catch (error) {
      throw new Error(`Failed to get AWS account information: ${error.message}`);
    }
  }

  async getRawCostData(): Promise<RawCostData> {
    showSpinner('Getting AWS pricing data');

    try {
      const costExplorer = new CostExplorerClient({
        credentials: this.getCredentials(),
        region: this.getRegion()
      });
      const endDate = dayjs().subtract(1, 'day');
      const startDate = endDate.subtract(65, 'day');

      const pricingData = await costExplorer.send(new GetCostAndUsageCommand({
        TimePeriod: {
          Start: startDate.format('YYYY-MM-DD'),
          End: endDate.format('YYYY-MM-DD'),
        },
        Granularity: 'DAILY',
        Filter: {
          Not: {
            Dimensions: {
              Key: 'RECORD_TYPE',
              Values: ['Credit', 'Refund', 'Upfront', 'Support'],
            },
          },
        },
        Metrics: ['UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      }));

      const costByService: RawCostData = {};

      for (const day of pricingData.ResultsByTime || []) {
        for (const group of day.Groups || []) {
          const serviceName = group.Keys?.[0];
          const cost = group.Metrics?.UnblendedCost?.Amount;
          const costDate = day.TimePeriod?.End;

          if (serviceName && cost && costDate) {
            costByService[serviceName] = costByService[serviceName] || {};
            costByService[serviceName][costDate] = parseFloat(cost);
          }
        }
      }

      return costByService;
    } catch (error) {
      throw new Error(`Failed to get AWS cost data: ${error.message}`);
    }
  }

  async getCostBreakdown(): Promise<CostBreakdown> {
    const rawCostData = await this.getRawCostData();
    return this.calculateServiceTotals(rawCostData);
  }

  async getResourceInventory(filters?: InventoryFilters): Promise<ResourceInventory> {
    showSpinner('Discovering AWS resources');

    const regions = filters?.regions || [this.config.region || 'us-east-1'];
    const resourceTypes = filters?.resourceTypes || Object.values(ResourceType);
    const includeCosts = filters?.includeCosts || false;

    const inventory: ResourceInventory = {
      provider: CloudProvider.AWS,
      region: regions.join(', '),
      totalResources: 0,
      resourcesByType: {
        [ResourceType.COMPUTE]: 0,
        [ResourceType.STORAGE]: 0,
        [ResourceType.DATABASE]: 0,
        [ResourceType.NETWORK]: 0,
        [ResourceType.SECURITY]: 0,
        [ResourceType.SERVERLESS]: 0,
        [ResourceType.CONTAINER]: 0,
        [ResourceType.ANALYTICS]: 0
      },
      totalCost: 0,
      resources: {
        compute: [],
        storage: [],
        database: [],
        network: [],
        security: [],
        serverless: [],
        container: [],
        analytics: []
      },
      lastUpdated: new Date()
    };

    for (const region of regions) {
      try {
        // Discover compute resources (EC2)
        if (resourceTypes.includes(ResourceType.COMPUTE)) {
          const ec2Resources = await this.discoverEC2Instances(region, includeCosts);
          inventory.resources.compute.push(...ec2Resources);
          inventory.resourcesByType[ResourceType.COMPUTE] += ec2Resources.length;
        }

        // Discover storage resources (S3, EBS)
        if (resourceTypes.includes(ResourceType.STORAGE)) {
          const s3Resources = await this.discoverS3Buckets(region, includeCosts);
          const ebsResources = await this.discoverEBSVolumes(region, includeCosts);
          inventory.resources.storage.push(...s3Resources, ...ebsResources);
          inventory.resourcesByType[ResourceType.STORAGE] += s3Resources.length + ebsResources.length;
        }

        // Discover database resources (RDS)
        if (resourceTypes.includes(ResourceType.DATABASE)) {
          const rdsResources = await this.discoverRDSInstances(region, includeCosts);
          inventory.resources.database.push(...rdsResources);
          inventory.resourcesByType[ResourceType.DATABASE] += rdsResources.length;
        }

        // Discover serverless resources (Lambda)
        if (resourceTypes.includes(ResourceType.SERVERLESS)) {
          const lambdaResources = await this.discoverLambdaFunctions(region, includeCosts);
          inventory.resources.serverless.push(...lambdaResources);
          inventory.resourcesByType[ResourceType.SERVERLESS] += lambdaResources.length;
        }

        // Discover network resources (VPC, Subnets)
        if (resourceTypes.includes(ResourceType.NETWORK)) {
          const vpcResources = await this.discoverVPCs(region, includeCosts);
          const subnetResources = await this.discoverSubnets(region, includeCosts);
          inventory.resources.network.push(...vpcResources, ...subnetResources);
          inventory.resourcesByType[ResourceType.NETWORK] += vpcResources.length + subnetResources.length;
        }
      } catch (error) {
        console.warn(`Failed to discover resources in region ${region}: ${error.message}`);
      }
    }

    // Calculate totals
    inventory.totalResources = Object.values(inventory.resourcesByType).reduce((sum, count) => sum + count, 0);

    if (includeCosts) {
      inventory.totalCost = Object.values(inventory.resources)
        .flat()
        .reduce((sum, resource) => sum + (resource.costToDate || 0), 0);
    }

    return inventory;
  }

  private async discoverEC2Instances(region: string, includeCosts: boolean): Promise<AWSEC2Instance[]> {
    try {
      const ec2Client = new EC2Client({
        credentials: this.getCredentials(),
        region
      });

      const command = new DescribeInstancesCommand({});
      const result = await ec2Client.send(command);

      const instances: AWSEC2Instance[] = [];

      for (const reservation of result.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          const ec2Instance: AWSEC2Instance = {
            id: instance.InstanceId || '',
            name: instance.Tags?.find(tag => tag.Key === 'Name')?.Value || instance.InstanceId || '',
            state: instance.State?.Name || 'unknown',
            region,
            tags: instance.Tags?.reduce((acc, tag) => {
              if (tag.Key && tag.Value) acc[tag.Key] = tag.Value;
              return acc;
            }, {} as Record<string, string>),
            createdAt: instance.LaunchTime || new Date(),
            provider: CloudProvider.AWS,
            instanceType: instance.InstanceType,
            cpu: this.getCpuCountForInstanceType(instance.InstanceType),
            memory: this.getMemoryForInstanceType(instance.InstanceType),
            platform: instance.Platform || 'linux',
            instanceId: instance.InstanceId || '',
            imageId: instance.ImageId || '',
            keyName: instance.KeyName,
            securityGroups: instance.SecurityGroups?.map(sg => sg.GroupId || '') || [],
            subnetId: instance.SubnetId || '',
            vpcId: instance.VpcId || '',
            publicDnsName: instance.PublicDnsName,
            privateDnsName: instance.PrivateDnsName,
            monitoring: instance.Monitoring?.State === 'enabled',
            placement: {
              availabilityZone: instance.Placement?.AvailabilityZone || '',
              groupName: instance.Placement?.GroupName
            },
            publicIp: instance.PublicIpAddress,
            privateIp: instance.PrivateIpAddress
          };

          if (includeCosts) {
            ec2Instance.costToDate = await this.getResourceCosts(instance.InstanceId || '');
          }

          instances.push(ec2Instance);
        }
      }

      return instances;
    } catch (error) {
      console.warn(`Failed to discover EC2 instances in ${region}: ${error.message}`);
      return [];
    }
  }

  private async discoverS3Buckets(region: string, includeCosts: boolean): Promise<AWSS3Bucket[]> {
    try {
      const s3Client = new S3Client({
        credentials: this.getCredentials(),
        region
      });

      const command = new ListBucketsCommand({});
      const result = await s3Client.send(command);

      const buckets: AWSS3Bucket[] = [];

      for (const bucket of result.Buckets || []) {
        if (!bucket.Name) continue;

        const s3Bucket: AWSS3Bucket = {
          id: bucket.Name,
          name: bucket.Name,
          state: 'active',
          region,
          createdAt: bucket.CreationDate || new Date(),
          provider: CloudProvider.AWS,
          sizeGB: 0, // Would need additional API calls to get actual size
          storageType: 'S3',
          bucketName: bucket.Name
        };

        if (includeCosts) {
          s3Bucket.costToDate = await this.getResourceCosts(bucket.Name);
        }

        buckets.push(s3Bucket);
      }

      return buckets;
    } catch (error) {
      console.warn(`Failed to discover S3 buckets: ${error.message}`);
      return [];
    }
  }

  private async discoverEBSVolumes(region: string, includeCosts: boolean): Promise<AWSEBSVolume[]> {
    try {
      const ec2Client = new EC2Client({
        credentials: this.getCredentials(),
        region
      });

      const command = new DescribeVolumesCommand({});
      const result = await ec2Client.send(command);

      const volumes: AWSEBSVolume[] = [];

      for (const volume of result.Volumes || []) {
        if (!volume.VolumeId) continue;

        const ebsVolume: AWSEBSVolume = {
          id: volume.VolumeId,
          name: volume.Tags?.find(tag => tag.Key === 'Name')?.Value || volume.VolumeId,
          state: volume.State || 'unknown',
          region,
          tags: volume.Tags?.reduce((acc, tag) => {
            if (tag.Key && tag.Value) acc[tag.Key] = tag.Value;
            return acc;
          }, {} as Record<string, string>),
          createdAt: volume.CreateTime || new Date(),
          provider: CloudProvider.AWS,
          sizeGB: volume.Size || 0,
          storageType: volume.VolumeType || 'gp2',
          encrypted: volume.Encrypted,
          volumeId: volume.VolumeId,
          volumeType: volume.VolumeType || 'gp2',
          iops: volume.Iops,
          throughput: volume.Throughput,
          attachments: volume.Attachments?.map(attachment => ({
            instanceId: attachment.InstanceId || '',
            device: attachment.Device || ''
          })),
          snapshotId: volume.SnapshotId
        };

        if (includeCosts) {
          ebsVolume.costToDate = await this.getResourceCosts(volume.VolumeId);
        }

        volumes.push(ebsVolume);
      }

      return volumes;
    } catch (error) {
      console.warn(`Failed to discover EBS volumes in ${region}: ${error.message}`);
      return [];
    }
  }

  private async discoverRDSInstances(region: string, includeCosts: boolean): Promise<AWSRDSInstance[]> {
    try {
      const rdsClient = new RDSClient({
        credentials: this.getCredentials(),
        region
      });

      const command = new DescribeDBInstancesCommand({});
      const result = await rdsClient.send(command);

      const instances: AWSRDSInstance[] = [];

      for (const dbInstance of result.DBInstances || []) {
        if (!dbInstance.DBInstanceIdentifier) continue;

        const rdsInstance: AWSRDSInstance = {
          id: dbInstance.DBInstanceIdentifier,
          name: dbInstance.DBName || dbInstance.DBInstanceIdentifier,
          state: dbInstance.DBInstanceStatus || 'unknown',
          region,
          createdAt: dbInstance.InstanceCreateTime || new Date(),
          provider: CloudProvider.AWS,
          engine: dbInstance.Engine || '',
          version: dbInstance.EngineVersion || '',
          instanceClass: dbInstance.DBInstanceClass,
          storageGB: dbInstance.AllocatedStorage,
          multiAZ: dbInstance.MultiAZ,
          dbInstanceIdentifier: dbInstance.DBInstanceIdentifier,
          dbName: dbInstance.DBName,
          masterUsername: dbInstance.MasterUsername || '',
          endpoint: dbInstance.Endpoint?.Address,
          port: dbInstance.Endpoint?.Port,
          availabilityZone: dbInstance.AvailabilityZone,
          backupRetentionPeriod: dbInstance.BackupRetentionPeriod,
          storageEncrypted: dbInstance.StorageEncrypted
        };

        if (includeCosts) {
          rdsInstance.costToDate = await this.getResourceCosts(dbInstance.DBInstanceIdentifier);
        }

        instances.push(rdsInstance);
      }

      return instances;
    } catch (error) {
      console.warn(`Failed to discover RDS instances in ${region}: ${error.message}`);
      return [];
    }
  }

  private async discoverLambdaFunctions(region: string, includeCosts: boolean): Promise<AWSLambdaFunction[]> {
    try {
      const lambdaClient = new LambdaClient({
        credentials: this.getCredentials(),
        region
      });

      const command = new ListFunctionsCommand({});
      const result = await lambdaClient.send(command);

      const functions: AWSLambdaFunction[] = [];

      for (const func of result.Functions || []) {
        if (!func.FunctionName) continue;

        const lambdaFunction: AWSLambdaFunction = {
          id: func.FunctionArn || func.FunctionName,
          name: func.FunctionName,
          state: func.State || 'unknown',
          region,
          createdAt: new Date(), // Lambda doesn't provide creation time in list
          provider: CloudProvider.AWS,
          functionName: func.FunctionName,
          runtime: func.Runtime || '',
          handler: func.Handler || '',
          codeSize: func.CodeSize || 0,
          timeout: func.Timeout || 0,
          memorySize: func.MemorySize || 0,
          lastModified: new Date(func.LastModified || ''),
          version: func.Version || ''
        };

        if (includeCosts) {
          lambdaFunction.costToDate = await this.getResourceCosts(func.FunctionName);
        }

        functions.push(lambdaFunction);
      }

      return functions;
    } catch (error) {
      console.warn(`Failed to discover Lambda functions in ${region}: ${error.message}`);
      return [];
    }
  }

  private async discoverVPCs(region: string, includeCosts: boolean): Promise<AWSVPC[]> {
    try {
      const ec2Client = new EC2Client({
        credentials: this.getCredentials(),
        region
      });

      const command = new DescribeVpcsCommand({});
      const result = await ec2Client.send(command);

      const vpcs: AWSVPC[] = [];

      for (const vpc of result.Vpcs || []) {
        if (!vpc.VpcId) continue;

        const awsVpc: AWSVPC = {
          id: vpc.VpcId,
          name: vpc.Tags?.find(tag => tag.Key === 'Name')?.Value || vpc.VpcId,
          state: vpc.State || 'unknown',
          region,
          tags: vpc.Tags?.reduce((acc, tag) => {
            if (tag.Key && tag.Value) acc[tag.Key] = tag.Value;
            return acc;
          }, {} as Record<string, string>),
          createdAt: new Date(), // VPC doesn't provide creation time
          provider: CloudProvider.AWS,
          vpcId: vpc.VpcId,
          cidrBlock: vpc.CidrBlock || '',
          dhcpOptionsId: vpc.DhcpOptionsId || '',
          isDefault: vpc.IsDefault || false
        };

        if (includeCosts) {
          awsVpc.costToDate = await this.getResourceCosts(vpc.VpcId);
        }

        vpcs.push(awsVpc);
      }

      return vpcs;
    } catch (error) {
      console.warn(`Failed to discover VPCs in ${region}: ${error.message}`);
      return [];
    }
  }

  private async discoverSubnets(region: string, includeCosts: boolean): Promise<AWSSubnet[]> {
    try {
      const ec2Client = new EC2Client({
        credentials: this.getCredentials(),
        region
      });

      const command = new DescribeSubnetsCommand({});
      const result = await ec2Client.send(command);

      const subnets: AWSSubnet[] = [];

      for (const subnet of result.Subnets || []) {
        if (!subnet.SubnetId) continue;

        const awsSubnet: AWSSubnet = {
          id: subnet.SubnetId,
          name: subnet.Tags?.find(tag => tag.Key === 'Name')?.Value || subnet.SubnetId,
          state: subnet.State || 'unknown',
          region,
          tags: subnet.Tags?.reduce((acc, tag) => {
            if (tag.Key && tag.Value) acc[tag.Key] = tag.Value;
            return acc;
          }, {} as Record<string, string>),
          createdAt: new Date(), // Subnet doesn't provide creation time
          provider: CloudProvider.AWS,
          subnetId: subnet.SubnetId,
          vpcId: subnet.VpcId || '',
          cidrBlock: subnet.CidrBlock || '',
          availableIpAddressCount: subnet.AvailableIpAddressCount || 0,
          availabilityZone: subnet.AvailabilityZone || '',
          mapPublicIpOnLaunch: subnet.MapPublicIpOnLaunch || false
        };

        if (includeCosts) {
          awsSubnet.costToDate = await this.getResourceCosts(subnet.SubnetId);
        }

        subnets.push(awsSubnet);
      }

      return subnets;
    } catch (error) {
      console.warn(`Failed to discover Subnets in ${region}: ${error.message}`);
      return [];
    }
  }

  async getResourceCosts(resourceId: string): Promise<number> {
    // Placeholder implementation - would need to map resource IDs to cost data
    // This could be implemented by correlating with cost and usage reports
    return 0;
  }

  async getOptimizationRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];

    try {
      // Placeholder recommendations - in a real implementation, this would analyze
      // resource usage patterns, costs, and best practices
      recommendations.push(
        'Consider using Reserved Instances for long-running EC2 instances to save up to 72%',
        'Enable S3 Intelligent Tiering for automatic cost optimization',
        'Review underutilized RDS instances and consider right-sizing',
        'Implement lifecycle policies for EBS snapshots older than 30 days',
        'Consider using Spot Instances for fault-tolerant workloads'
      );
    } catch (error) {
      console.warn(`Failed to generate optimization recommendations: ${error.message}`);
    }

    return recommendations;
  }

  async getBudgets(): Promise<BudgetInfo[]> {
    showSpinner('Getting AWS budgets');

    try {
      const budgetsClient = new BudgetsClient({
        credentials: this.getCredentials(),
        region: this.getRegion()
      });

      // Get account ID for budgets API
      const sts = new STSClient({
        credentials: this.getCredentials(),
        region: this.getRegion()
      });
      const accountInfo = await sts.send(new GetCallerIdentityCommand({}));
      const accountId = accountInfo.Account;

      if (!accountId) {
        throw new Error('Unable to determine AWS account ID');
      }

      const budgetsResponse = await budgetsClient.send(new DescribeBudgetsCommand({
        AccountId: accountId
      }));

      const budgets: BudgetInfo[] = [];

      for (const budget of budgetsResponse.Budgets || []) {
        if (!budget.BudgetName || !budget.BudgetLimit) continue;

        const budgetInfo: BudgetInfo = {
          budgetName: budget.BudgetName,
          budgetLimit: parseFloat(budget.BudgetLimit.Amount || '0'),
          actualSpend: parseFloat(budget.CalculatedSpend?.ActualSpend?.Amount || '0'),
          forecastedSpend: parseFloat(budget.CalculatedSpend?.ForecastedSpend?.Amount || '0'),
          timeUnit: (budget.TimeUnit as 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY') || 'MONTHLY',
          timePeriod: {
            start: typeof budget.TimePeriod?.Start === 'string'
              ? budget.TimePeriod?.Start
              : budget.TimePeriod?.Start instanceof Date
                ? budget.TimePeriod?.Start.toISOString()
                : '',
            end: typeof budget.TimePeriod?.End === 'string'
              ? budget.TimePeriod?.End
              : budget.TimePeriod?.End instanceof Date
                ? budget.TimePeriod?.End.toISOString()
                : ''
          },
          budgetType: (budget.BudgetType as 'COST' | 'USAGE') || 'COST',
          status: this.determineBudgetStatus(budget),
          thresholds: this.parseBudgetThresholds(budget),
          costFilters: this.parseCostFilters(budget)
        };

        budgets.push(budgetInfo);
      }

      return budgets;
    } catch (error) {
      console.warn(`Failed to get AWS budgets: ${error.message}`);
      return [];
    }
  }

  async getBudgetAlerts(): Promise<BudgetAlert[]> {
    const budgets = await this.getBudgets();
    const alerts: BudgetAlert[] = [];

    for (const budget of budgets) {
      const percentageUsed = (budget.actualSpend / budget.budgetLimit) * 100;

      // Check each threshold
      for (const threshold of budget.thresholds) {
        let isExceeded = false;
        let currentValue = 0;

        if (threshold.thresholdType === 'PERCENTAGE') {
          currentValue = percentageUsed;
          if (threshold.notificationType === 'ACTUAL') {
            isExceeded = percentageUsed >= threshold.threshold;
          } else if (threshold.notificationType === 'FORECASTED' && budget.forecastedSpend) {
            const forecastedPercentage = (budget.forecastedSpend / budget.budgetLimit) * 100;
            isExceeded = forecastedPercentage >= threshold.threshold;
            currentValue = forecastedPercentage;
          }
        } else {
          currentValue = budget.actualSpend;
          if (threshold.notificationType === 'ACTUAL') {
            isExceeded = budget.actualSpend >= threshold.threshold;
          } else if (threshold.notificationType === 'FORECASTED' && budget.forecastedSpend) {
            isExceeded = budget.forecastedSpend >= threshold.threshold;
            currentValue = budget.forecastedSpend;
          }
        }

        if (isExceeded) {
          const alert: BudgetAlert = {
            budgetName: budget.budgetName,
            alertType: threshold.notificationType === 'FORECASTED' ? 'FORECAST_EXCEEDED' : 'THRESHOLD_EXCEEDED',
            currentSpend: budget.actualSpend,
            budgetLimit: budget.budgetLimit,
            threshold: threshold.threshold,
            percentageUsed,
            timeRemaining: this.calculateTimeRemaining(budget.timePeriod),
            severity: this.determineSeverity(percentageUsed),
            message: this.generateAlertMessage(budget, threshold, percentageUsed)
          };
          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  async getCostTrendAnalysis(months: number = 6): Promise<CostTrendAnalysis> {
    showSpinner('Analyzing cost trends');

    try {
      const costExplorer = new CostExplorerClient({
        credentials: this.getCredentials(),
        region: this.getRegion()
      });

      const endDate = dayjs();
      const startDate = endDate.subtract(months, 'month');

      // Get monthly cost data with service breakdown
      const monthlyData = await costExplorer.send(new GetCostAndUsageCommand({
        TimePeriod: {
          Start: startDate.format('YYYY-MM-DD'),
          End: endDate.format('YYYY-MM-DD')
        },
        Granularity: 'MONTHLY',
        Metrics: ['UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE'
          }
        ]
      }));

      const monthlyCosts: number[] = [];
      const monthlyBreakdown = [];
      const serviceTrends: Record<string, number[]> = {};
      let totalCost = 0;

      // Process monthly data
      for (const result of monthlyData.ResultsByTime || []) {
        const period = result.TimePeriod?.Start || '';
        const monthCost = result.Total?.UnblendedCost?.Amount ? parseFloat(result.Total.UnblendedCost.Amount) : 0;
        monthlyCosts.push(monthCost);
        totalCost += monthCost;

        // Build service breakdown
        const services: Record<string, number> = {};
        result.Groups?.forEach(group => {
          const serviceName = group.Keys?.[0] || 'Unknown';
          const cost = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
          services[serviceName] = cost;

          // Track service trends
          if (!serviceTrends[serviceName]) {
            serviceTrends[serviceName] = [];
          }
          serviceTrends[serviceName].push(cost);
        });

        monthlyBreakdown.push({
          month: period,
          cost: monthCost,
          services
        });
      }

      // Calculate enhanced metrics
      const averageDailyCost = totalCost / (months * 30);
      const projectedMonthlyCost = monthlyCosts.length > 0 ? monthlyCosts[monthlyCosts.length - 1] : averageDailyCost * 30;

      // Calculate month-over-month growth rate
      let avgMonthOverMonthGrowth = 0;
      if (monthlyCosts.length > 1) {
        const growthRates = [];
        for (let i = 1; i < monthlyCosts.length; i++) {
          const growth = ((monthlyCosts[i] - monthlyCosts[i - 1]) / monthlyCosts[i - 1]) * 100;
          growthRates.push(growth);
        }
        avgMonthOverMonthGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      }

      // Enhanced anomaly detection
      const costAnomalies = [];
      for (let i = 0; i < monthlyCosts.length; i++) {
        const monthCost = monthlyCosts[i];
        const period = monthlyBreakdown[i]?.month || '';

        // Month-over-month anomalies
        if (i > 0) {
          const prevMonthCost = monthlyCosts[i - 1];
          const monthOverMonthChange = ((monthCost - prevMonthCost) / prevMonthCost) * 100;

          if (Math.abs(monthOverMonthChange) > 25) {
            costAnomalies.push({
              date: period,
              deviation: Math.abs(monthOverMonthChange),
              severity: Math.abs(monthOverMonthChange) > 50 ? 'CRITICAL' : 'HIGH',
              description: `${monthOverMonthChange > 0 ? 'Spike' : 'Drop'} in monthly costs: ${monthOverMonthChange.toFixed(1)}% MoM change`
            });
          }
        }

        // Trend-based anomalies
        if (i > 2) {
          const avgOfPrevious = monthlyCosts.slice(0, i).reduce((a, b) => a + b, 0) / i;
          const deviation = ((monthCost - avgOfPrevious) / avgOfPrevious) * 100;

          if (Math.abs(deviation) > 30) {
            costAnomalies.push({
              date: period,
              deviation: Math.abs(deviation),
              severity: Math.abs(deviation) > 60 ? 'CRITICAL' : 'MEDIUM',
              description: `Cost ${deviation > 0 ? 'above' : 'below'} ${months}-month average by ${Math.abs(deviation).toFixed(1)}%`
            });
          }
        }
      }

      // Calculate service trends
      const serviceAnalysis: Record<string, {
        currentCost: number;
        growthRate: number;
        trend: 'increasing' | 'decreasing' | 'stable';
      }> = {};

      Object.entries(serviceTrends).forEach(([service, costs]) => {
        if (costs.length > 1) {
          const currentCost = costs[costs.length - 1];
          const previousCost = costs[costs.length - 2];
          const growthRate = ((currentCost - previousCost) / previousCost) * 100;
          const trend = Math.abs(growthRate) < 5 ? 'stable' :
                       growthRate > 0 ? 'increasing' : 'decreasing';

          serviceAnalysis[service] = {
            currentCost,
            growthRate,
            trend
          };
        }
      });

      // Apply advanced analytics
      const analyticsEngine = new CostAnalyticsEngine({
        sensitivity: 'MEDIUM',
        lookbackPeriods: Math.min(14, monthlyBreakdown.length),
        seasonalityPeriods: 12 // Monthly seasonality
      });

      const dataPoints: DataPoint[] = monthlyBreakdown.map(mb => ({
        timestamp: mb.month,
        value: mb.cost
      }));

      const analytics = analyticsEngine.analyzeProvider(CloudProvider.AWS, dataPoints);

      // Merge advanced anomalies with basic ones
      const enhancedAnomalies = [...costAnomalies];
      analytics.overallAnomalies.forEach(anomaly => {
        enhancedAnomalies.push({
          date: anomaly.timestamp,
          deviation: anomaly.deviationPercentage,
          severity: anomaly.severity,
          description: `${anomaly.description} (${anomaly.confidence.toFixed(0)}% confidence)`
        });
      });

      return {
        totalCost,
        averageDailyCost,
        projectedMonthlyCost,
        avgMonthOverMonthGrowth,
        costAnomalies: enhancedAnomalies,
        monthlyBreakdown,
        serviceTrends: serviceAnalysis,
        forecastAccuracy: monthlyCosts.length > 3 ? this.calculateForecastAccuracy(monthlyCosts) : 0,
        analytics: {
          insights: analytics.insights,
          recommendations: analytics.recommendations,
          volatilityScore: this.calculateVolatility(monthlyCosts),
          trendStrength: this.calculateTrendStrength(monthlyCosts)
        }
      };
    } catch (error) {
      console.error('Failed to get AWS cost trend analysis:', error);
      // Return mock data for now
      return this.getMockTrendAnalysis(months);
    }
  }

  private calculateForecastAccuracy(monthlyCosts: number[]): number {
    // Simple linear regression forecast accuracy calculation
    if (monthlyCosts.length < 4) return 0;

    const n = monthlyCosts.length;
    const lastThreeActual = monthlyCosts.slice(-3);
    const trainData = monthlyCosts.slice(0, -3);

    // Calculate simple moving average prediction
    const prediction = trainData.reduce((a, b) => a + b, 0) / trainData.length;
    const actualAvg = lastThreeActual.reduce((a, b) => a + b, 0) / lastThreeActual.length;

    const accuracy = Math.max(0, 100 - (Math.abs(prediction - actualAvg) / actualAvg) * 100);
    return Math.round(accuracy);
  }

  private getMockTrendAnalysis(months: number): CostTrendAnalysis {
    // Generate enhanced mock data for demonstration
    const monthlyCosts = Array.from({ length: months }, (_, i) => {
      const baseCost = 1500 + (Math.random() * 500); // Random between $1500-2000
      const trend = 1 + (i * 0.02); // Slight upward trend
      const volatility = 0.8 + (Math.random() * 0.4); // Add some volatility
      return baseCost * trend * volatility;
    });

    const totalCost = monthlyCosts.reduce((sum, cost) => sum + cost, 0);
    const averageDailyCost = totalCost / (months * 30);
    const projectedMonthlyCost = monthlyCosts[monthlyCosts.length - 1];

    // Calculate mock MoM growth
    let avgMonthOverMonthGrowth = 0;
    if (monthlyCosts.length > 1) {
      const growthRates = [];
      for (let i = 1; i < monthlyCosts.length; i++) {
        const growth = ((monthlyCosts[i] - monthlyCosts[i - 1]) / monthlyCosts[i - 1]) * 100;
        growthRates.push(growth);
      }
      avgMonthOverMonthGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    }

    const costAnomalies = [];
    // Add some mock anomalies with descriptions
    if (months >= 3) {
      costAnomalies.push({
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deviation: 35.2,
        severity: 'MEDIUM' as const,
        description: 'Cost spike due to increased EC2 usage during Black Friday traffic'
      });
      costAnomalies.push({
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        deviation: 28.7,
        severity: 'HIGH' as const,
        description: 'Month-over-month increase of 28.7% in data transfer costs'
      });
    }

    const mockServices = ['EC2-Instance', 'S3', 'RDS', 'Lambda', 'CloudFront'];
    const monthlyBreakdown = monthlyCosts.map((cost, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - i - 1));

      const services: Record<string, number> = {};
      mockServices.forEach(service => {
        services[service] = cost * (0.1 + Math.random() * 0.3); // Random distribution
      });

      return {
        month: date.toISOString().split('T')[0],
        cost,
        services
      };
    });

    // Mock service trends
    const serviceTrends: Record<string, {
      currentCost: number;
      growthRate: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    }> = {
      'EC2-Instance': { currentCost: 850, growthRate: 12.3, trend: 'increasing' },
      'S3': { currentCost: 125, growthRate: -5.2, trend: 'decreasing' },
      'RDS': { currentCost: 420, growthRate: 2.1, trend: 'stable' },
      'Lambda': { currentCost: 45, growthRate: 25.6, trend: 'increasing' },
      'CloudFront': { currentCost: 78, growthRate: -1.8, trend: 'stable' }
    };

    return {
      totalCost,
      averageDailyCost,
      projectedMonthlyCost,
      avgMonthOverMonthGrowth,
      costAnomalies,
      monthlyBreakdown,
      serviceTrends,
      forecastAccuracy: 87
    };
  }

  async getFinOpsRecommendations(): Promise<FinOpsRecommendation[]> {
    const recommendations: FinOpsRecommendation[] = [
      {
        id: 'aws-ri-ec2',
        type: 'RESERVED_CAPACITY',
        title: 'Purchase EC2 Reserved Instances',
        description: 'Long-running EC2 instances can benefit from Reserved Instance pricing',
        potentialSavings: {
          amount: 500,
          percentage: 72,
          timeframe: 'MONTHLY'
        },
        effort: 'LOW',
        priority: 'HIGH',
        implementationSteps: [
          'Analyze EC2 usage patterns over the past 30 days',
          'Identify instances running >75% of the time',
          'Purchase 1-year or 3-year Reserved Instances',
          'Monitor utilization and adjust as needed'
        ],
        tags: ['ec2', 'reserved-instances', 'cost-optimization']
      },
      {
        id: 'aws-s3-lifecycle',
        type: 'COST_OPTIMIZATION',
        title: 'Implement S3 Lifecycle Policies',
        description: 'Automatically transition old S3 data to cheaper storage classes',
        potentialSavings: {
          amount: 150,
          percentage: 40,
          timeframe: 'MONTHLY'
        },
        effort: 'MEDIUM',
        priority: 'MEDIUM',
        implementationSteps: [
          'Analyze S3 access patterns',
          'Create lifecycle policies for infrequently accessed data',
          'Transition to IA after 30 days, Glacier after 90 days',
          'Enable Intelligent Tiering for dynamic workloads'
        ],
        tags: ['s3', 'lifecycle', 'storage-optimization']
      },
      {
        id: 'aws-rightsizing',
        type: 'RESOURCE_RIGHTSIZING',
        title: 'Right-size Underutilized Resources',
        description: 'Reduce costs by downsizing underutilized EC2 and RDS instances',
        potentialSavings: {
          amount: 300,
          percentage: 25,
          timeframe: 'MONTHLY'
        },
        effort: 'HIGH',
        priority: 'HIGH',
        implementationSteps: [
          'Enable CloudWatch detailed monitoring',
          'Analyze CPU, memory, and network utilization',
          'Identify instances with <40% average utilization',
          'Plan maintenance windows for resizing',
          'Test application performance after changes'
        ],
        tags: ['rightsizing', 'ec2', 'rds', 'performance-optimization']
      }
    ];

    return recommendations;
  }

  // Helper methods for instance types (simplified mapping)
  private getCpuCountForInstanceType(instanceType?: string): number {
    if (!instanceType) return 0;
    const cpuMap: Record<string, number> = {
      't2.nano': 1, 't2.micro': 1, 't2.small': 1, 't2.medium': 2, 't2.large': 2,
      'm5.large': 2, 'm5.xlarge': 4, 'm5.2xlarge': 8, 'm5.4xlarge': 16,
      'c5.large': 2, 'c5.xlarge': 4, 'c5.2xlarge': 8, 'c5.4xlarge': 16
    };
    return cpuMap[instanceType] || 1;
  }

  private getMemoryForInstanceType(instanceType?: string): number {
    if (!instanceType) return 0;
    const memoryMap: Record<string, number> = {
      't2.nano': 0.5, 't2.micro': 1, 't2.small': 2, 't2.medium': 4, 't2.large': 8,
      'm5.large': 8, 'm5.xlarge': 16, 'm5.2xlarge': 32, 'm5.4xlarge': 64,
      'c5.large': 4, 'c5.xlarge': 8, 'c5.2xlarge': 16, 'c5.4xlarge': 32
    };
    return memoryMap[instanceType] || 1;
  }

  // Helper methods for budget functionality
  private determineBudgetStatus(budget: any): 'OK' | 'ALARM' | 'FORECASTED_ALARM' {
    if (!budget.CalculatedSpend) return 'OK';

    const actual = parseFloat(budget.CalculatedSpend.ActualSpend?.Amount || '0');
    const limit = parseFloat(budget.BudgetLimit?.Amount || '0');
    const forecasted = parseFloat(budget.CalculatedSpend.ForecastedSpend?.Amount || '0');

    if (actual >= limit) return 'ALARM';
    if (forecasted >= limit) return 'FORECASTED_ALARM';
    return 'OK';
  }

  private parseBudgetThresholds(budget: any): BudgetThreshold[] {
    // In a real implementation, this would parse AWS Budget notification thresholds
    // For now, return default thresholds
    return [
      {
        threshold: 80,
        thresholdType: 'PERCENTAGE',
        comparisonOperator: 'GREATER_THAN',
        notificationType: 'ACTUAL'
      },
      {
        threshold: 100,
        thresholdType: 'PERCENTAGE',
        comparisonOperator: 'GREATER_THAN',
        notificationType: 'FORECASTED'
      }
    ];
  }

  private parseCostFilters(budget: any): any {
    // In a real implementation, this would parse AWS Budget cost filters
    return budget.CostFilters || {};
  }

  private calculateTimeRemaining(timePeriod: { start: string; end: string }): string {
    if (!timePeriod.end) return 'Unknown';

    const endDate = dayjs(timePeriod.end);
    const now = dayjs();
    const daysRemaining = endDate.diff(now, 'day');

    if (daysRemaining <= 0) return 'Period ended';
    if (daysRemaining === 1) return '1 day';
    return `${daysRemaining} days`;
  }

  private determineSeverity(percentageUsed: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (percentageUsed >= 100) return 'CRITICAL';
    if (percentageUsed >= 90) return 'HIGH';
    if (percentageUsed >= 75) return 'MEDIUM';
    return 'LOW';
  }

  private generateAlertMessage(budget: BudgetInfo, threshold: BudgetThreshold, percentageUsed: number): string {
    const thresholdType = threshold.thresholdType === 'PERCENTAGE' ? '%' : '$';
    return `Budget "${budget.budgetName}" has ${threshold.notificationType.toLowerCase()} ${threshold.threshold}${thresholdType} threshold (currently at ${percentageUsed.toFixed(1)}%)`;
  }

  private async getTopServices(startDate: string, endDate: string): Promise<Array<{
    serviceName: string;
    cost: number;
    percentage: number;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  }>> {
    // In a real implementation, this would analyze service costs and trends
    // For now, return mock data
    return [
      {
        serviceName: 'Amazon Elastic Compute Cloud - Compute',
        cost: 1250.45,
        percentage: 45.2,
        trend: 'INCREASING'
      },
      {
        serviceName: 'Amazon Simple Storage Service',
        cost: 680.23,
        percentage: 24.6,
        trend: 'STABLE'
      },
      {
        serviceName: 'Amazon Relational Database Service',
        cost: 445.67,
        percentage: 16.1,
        trend: 'DECREASING'
      }
    ];
  }

  private detectCostAnomalies(trendData: TrendData[]): Array<{
    date: string;
    actualCost: number;
    expectedCost: number;
    deviation: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    possibleCause?: string;
  }> {
    const anomalies: any[] = [];

    // Simple anomaly detection based on percentage change
    for (let i = 1; i < trendData.length; i++) {
      const current = trendData[i];
      const changePercentage = Math.abs(current.changeFromPrevious.percentage);

      if (changePercentage > 50) {
        anomalies.push({
          date: current.period,
          actualCost: current.actualCost,
          expectedCost: current.actualCost - current.changeFromPrevious.amount,
          deviation: changePercentage,
          severity: changePercentage > 100 ? 'HIGH' : 'MEDIUM',
          possibleCause: changePercentage > 0 ? 'Unexpected cost increase' : 'Significant cost reduction'
        });
      }
    }

    return anomalies;
  }

  static createFromLegacyConfig(legacyConfig: {
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
      sessionToken?: string;
    };
    region: string;
  }): AWSProvider {
    const config: ProviderConfig = {
      provider: CloudProvider.AWS,
      credentials: {
        accessKeyId: legacyConfig.credentials.accessKeyId,
        secretAccessKey: legacyConfig.credentials.secretAccessKey,
        sessionToken: legacyConfig.credentials.sessionToken,
      },
      region: legacyConfig.region
    };

    return new AWSProvider(config);
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return mean > 0 ? stdDev / mean : 0;
  }

  private calculateTrendStrength(values: number[]): number {
    if (values.length < 3) return 0;

    // Calculate linear trend strength using R-squared
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = values.reduce((a, b) => a + b, 0) / n;

    const ssXY = x.reduce((sum, xi, i) => sum + (xi - meanX) * (values[i] - meanY), 0);
    const ssXX = x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0);
    const ssYY = values.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);

    const correlation = ssXX === 0 || ssYY === 0 ? 0 : ssXY / Math.sqrt(ssXX * ssYY);
    return Math.abs(correlation);
  }
}