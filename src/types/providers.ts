export enum CloudProvider {
  AWS = 'aws',
  GOOGLE_CLOUD = 'gcp',
  GCP = 'gcp', // Alias for GOOGLE_CLOUD
  AZURE = 'azure',
  ALIBABA_CLOUD = 'alicloud',
  ALIBABA = 'alicloud', // Alias for ALIBABA_CLOUD
  ORACLE_CLOUD = 'oracle',
  OCI = 'oracle' // Alias for ORACLE_CLOUD
}

export interface ProviderCredentials {
  [key: string]: any;
}

export interface CostBreakdown {
  totals: {
    lastMonth: number;
    thisMonth: number;
    last7Days: number;
    yesterday: number;
  };
  totalsByService: {
    lastMonth: { [key: string]: number };
    thisMonth: { [key: string]: number };
    last7Days: { [key: string]: number };
    yesterday: { [key: string]: number };
  };
}

export interface RawCostData {
  [serviceName: string]: {
    [date: string]: number;
  };
}

export interface ProviderConfig {
  provider: CloudProvider;
  credentials: ProviderCredentials;
  region?: string;
  profile?: string;
}

export interface AccountInfo {
  id: string;
  name?: string;
  provider: CloudProvider;
}

export abstract class CloudProviderAdapter {
  protected config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  abstract getAccountInfo(): Promise<AccountInfo>;
  abstract getRawCostData(): Promise<RawCostData>;
  abstract getCostBreakdown(): Promise<CostBreakdown>;
  abstract validateCredentials(): Promise<boolean>;
  abstract getResourceInventory(filters?: InventoryFilters): Promise<ResourceInventory>;
  abstract getResourceCosts(resourceId: string): Promise<number>;
  abstract getOptimizationRecommendations(): Promise<string[]>;
  abstract getBudgets(): Promise<BudgetInfo[]>;
  abstract getBudgetAlerts(): Promise<BudgetAlert[]>;
  abstract getCostTrendAnalysis(months?: number): Promise<CostTrendAnalysis>;
  abstract getFinOpsRecommendations(): Promise<FinOpsRecommendation[]>;

  protected calculateServiceTotals(rawCostData: RawCostData): CostBreakdown {
    // This will be implemented by the base class
    // Common logic for all providers
    return this.processRawCostData(rawCostData);
  }

  private processRawCostData(rawCostData: RawCostData): CostBreakdown {
    const totals = {
      lastMonth: 0,
      thisMonth: 0,
      last7Days: 0,
      yesterday: 0,
    };

    const totalsByService = {
      lastMonth: {},
      thisMonth: {},
      last7Days: {},
      yesterday: {},
    };

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7DaysStart = new Date(now);
    last7DaysStart.setDate(last7DaysStart.getDate() - 7);

    for (const [serviceName, serviceCosts] of Object.entries(rawCostData)) {
      let lastMonthServiceTotal = 0;
      let thisMonthServiceTotal = 0;
      let last7DaysServiceTotal = 0;
      let yesterdayServiceTotal = 0;

      for (const [dateStr, cost] of Object.entries(serviceCosts)) {
        const date = new Date(dateStr);

        // Last month
        if (date >= startOfLastMonth && date <= endOfLastMonth) {
          lastMonthServiceTotal += cost;
        }

        // This month
        if (date >= startOfThisMonth) {
          thisMonthServiceTotal += cost;
        }

        // Last 7 days
        if (date >= last7DaysStart && date < yesterday) {
          last7DaysServiceTotal += cost;
        }

        // Yesterday
        if (date.toDateString() === yesterday.toDateString()) {
          yesterdayServiceTotal += cost;
        }
      }

      totalsByService.lastMonth[serviceName] = lastMonthServiceTotal;
      totalsByService.thisMonth[serviceName] = thisMonthServiceTotal;
      totalsByService.last7Days[serviceName] = last7DaysServiceTotal;
      totalsByService.yesterday[serviceName] = yesterdayServiceTotal;

      totals.lastMonth += lastMonthServiceTotal;
      totals.thisMonth += thisMonthServiceTotal;
      totals.last7Days += last7DaysServiceTotal;
      totals.yesterday += yesterdayServiceTotal;
    }

    return {
      totals,
      totalsByService,
    };
  }
}

export interface ProviderFactory {
  createProvider(config: ProviderConfig): CloudProviderAdapter;
  getSupportedProviders(): CloudProvider[];
  validateProviderConfig(config: ProviderConfig): boolean;
}

// Base Resource Interfaces
export interface ResourceBase {
  id: string;
  name: string;
  state: string;
  region: string;
  tags?: Record<string, string>;
  createdAt: Date;
  costToDate?: number;
  provider: CloudProvider;
}

export interface NetworkResource extends ResourceBase {
  networkId?: string;
  subnetId?: string;
  securityGroups?: string[];
  publicIp?: string;
  privateIp?: string;
}

export interface StorageResource extends ResourceBase {
  sizeGB: number;
  storageType: string;
  encrypted?: boolean;
}

export interface DatabaseResource extends ResourceBase {
  engine: string;
  version: string;
  instanceClass?: string;
  storageGB?: number;
  multiAZ?: boolean;
}

export interface ComputeResource extends ResourceBase {
  instanceType?: string;
  cpu?: number;
  memory?: number;
  platform?: string;
}

// Resource Types Enum
export enum ResourceType {
  COMPUTE = 'compute',
  STORAGE = 'storage',
  DATABASE = 'database',
  NETWORK = 'network',
  SECURITY = 'security',
  SERVERLESS = 'serverless',
  CONTAINER = 'container',
  ANALYTICS = 'analytics'
}

// AWS Resource Types
export interface AWSEC2Instance extends ComputeResource {
  instanceId: string;
  imageId: string;
  keyName?: string;
  securityGroups: string[];
  subnetId: string;
  vpcId: string;
  publicDnsName?: string;
  privateDnsName?: string;
  publicIp?: string;
  privateIp?: string;
  monitoring?: boolean;
  placement: {
    availabilityZone: string;
    groupName?: string;
  };
}

export interface AWSS3Bucket extends StorageResource {
  bucketName: string;
  versioning?: boolean;
  publicRead?: boolean;
  publicWrite?: boolean;
  objects?: number;
  lastModified?: Date;
}

export interface AWSRDSInstance extends DatabaseResource {
  dbInstanceIdentifier: string;
  dbName?: string;
  masterUsername: string;
  endpoint?: string;
  port?: number;
  availabilityZone?: string;
  backupRetentionPeriod?: number;
  storageEncrypted?: boolean;
}

export interface AWSLambdaFunction extends ResourceBase {
  functionName: string;
  runtime: string;
  handler: string;
  codeSize: number;
  timeout: number;
  memorySize: number;
  lastModified: Date;
  version: string;
}

export interface AWSVPC extends ResourceBase {
  vpcId: string;
  cidrBlock: string;
  dhcpOptionsId: string;
  isDefault: boolean;
  subnets?: AWSSubnet[];
}

export interface AWSSubnet extends NetworkResource {
  subnetId: string;
  vpcId: string;
  cidrBlock: string;
  availableIpAddressCount: number;
  availabilityZone: string;
  mapPublicIpOnLaunch: boolean;
}

export interface AWSLoadBalancer extends NetworkResource {
  loadBalancerName: string;
  dnsName: string;
  scheme: string;
  type: 'application' | 'network' | 'gateway';
  ipAddressType?: string;
  listeners?: number;
  targetGroups?: number;
}

export interface AWSEBSVolume extends StorageResource {
  volumeId: string;
  volumeType: string;
  iops?: number;
  throughput?: number;
  attachments?: Array<{
    instanceId: string;
    device: string;
  }>;
  snapshotId?: string;
}

// GCP Resource Types
export interface GCPComputeInstance extends ComputeResource {
  instanceName: string;
  machineType: string;
  zone: string;
  image: string;
  disks: Array<{
    type: string;
    sizeGb: number;
    boot?: boolean;
  }>;
  networkInterfaces: Array<{
    network: string;
    subnetwork?: string;
  }>;
  serviceAccounts?: Array<{
    email: string;
    scopes: string[];
  }>;
}

export interface GCPStorageBucket extends StorageResource {
  bucketName: string;
  location: string;
  storageClass: string;
  versioning?: boolean;
  lifecycle?: any;
  cors?: any[];
}

export interface GCPCloudSQLInstance extends DatabaseResource {
  instanceId: string;
  databaseVersion: string;
  tier: string;
  diskSizeGb: number;
  diskType: string;
  ipAddresses: Array<{
    type: string;
    ipAddress: string;
  }>;
  backupConfiguration?: any;
  maintenanceWindow?: any;
}

export interface GCPCloudFunction extends ResourceBase {
  functionName: string;
  runtime: string;
  entryPoint: string;
  sourceArchiveUrl?: string;
  httpsTrigger?: any;
  eventTrigger?: any;
  timeout?: string;
  availableMemoryMb?: number;
}

export interface GCPGKECluster extends ResourceBase {
  clusterName: string;
  zone?: string;
  location: string;
  nodeCount: number;
  currentMasterVersion: string;
  currentNodeVersion: string;
  network?: string;
  subnetwork?: string;
  nodePools?: Array<{
    name: string;
    nodeCount: number;
    config: any;
  }>;
}

// Azure Resource Types
export interface AzureVirtualMachine extends ComputeResource {
  resourceId: string;
  vmSize: string;
  osType: string;
  imageReference: {
    publisher: string;
    offer: string;
    sku: string;
    version: string;
  };
  osDisk: {
    osType: string;
    diskSizeGB: number;
    managedDisk: {
      storageAccountType: string;
    };
  };
  networkProfile: {
    networkInterfaces: Array<{
      id: string;
    }>;
  };
}

export interface AzureStorageAccount extends StorageResource {
  accountName: string;
  kind: string;
  tier: string;
  replicationType: string;
  accessTier: string;
  encryption: {
    services: {
      blob: { enabled: boolean };
      file: { enabled: boolean };
    };
  };
}

export interface AzureSQLDatabase extends DatabaseResource {
  databaseId: string;
  serverName: string;
  edition: string;
  serviceObjective: string;
  collation: string;
  maxSizeBytes: number;
  status: string;
  elasticPoolName?: string;
}

export interface AzureFunctionApp extends ResourceBase {
  functionAppName: string;
  kind: string;
  runtime: string;
  runtimeVersion: string;
  hostingPlan: {
    name: string;
    tier: string;
  };
}

export interface AzureAKSCluster extends ResourceBase {
  clusterName: string;
  kubernetesVersion: string;
  nodeCount: number;
  dnsPrefix: string;
  agentPoolProfiles: Array<{
    name: string;
    count: number;
    vmSize: string;
    osType: string;
    osDiskSizeGB: number;
  }>;
  networkProfile: {
    networkPlugin: string;
    serviceCidr: string;
    dnsServiceIP: string;
  };
}

export interface AzureVirtualNetwork extends ResourceBase {
  vnetName: string;
  addressSpace: {
    addressPrefixes: string[];
  };
  subnets: Array<{
    name: string;
    addressPrefix: string;
  }>;
}

// Alibaba Cloud Resource Types
export interface AlibabaECSInstance extends ComputeResource {
  instanceId: string;
  instanceName?: string;
  imageId: string;
  instanceType: string;
  vpcAttributes?: {
    vpcId: string;
    vswitchId: string;
    privateIpAddress: string;
  };
  publicIpAddress?: string;
  internetChargeType?: string;
  securityGroupIds: string[];
  zoneId: string;
}

export interface AlibabaOSSBucket extends StorageResource {
  bucketName: string;
  location: string;
  storageClass: string;
  dataRedundancyType?: string;
  accessControlList?: string;
  serverSideEncryption?: string;
  versioning?: string;
}

export interface AlibabaRDSInstance extends DatabaseResource {
  dbInstanceId: string;
  dbInstanceDescription?: string;
  payType: string;
  dbInstanceType: string;
  engine: string;
  engineVersion: string;
  dbInstanceClass: string;
  dbInstanceStorage: number;
  vpcId?: string;
  vswitchId?: string;
  connectionString?: string;
}

export interface AlibabaVPC extends ResourceBase {
  vpcId: string;
  vpcName?: string;
  cidrBlock: string;
  isDefault: boolean;
  routerTableIds: string[];
  vswitchIds: string[];
  description?: string;
}

// Oracle Cloud Resource Types
export interface OracleComputeInstance extends ComputeResource {
  instanceId: string;
  displayName: string;
  availabilityDomain: string;
  compartmentId: string;
  shape: string;
  shapeConfig?: {
    ocpus: number;
    memoryInGBs: number;
  };
  imageId: string;
  subnetId: string;
  publicIp?: string;
  privateIp?: string;
}

export interface OracleObjectStorageBucket extends StorageResource {
  bucketName: string;
  namespace: string;
  compartmentId: string;
  publicAccessType?: string;
  approximateCount?: number;
  approximateSize?: number;
  etag: string;
  kmsKeyId?: string;
  objectEventsEnabled?: boolean;
}

export interface OracleAutonomousDatabase extends DatabaseResource {
  id: string;
  displayName: string;
  compartmentId: string;
  dbWorkload: string;
  isAutoScalingEnabled: boolean;
  cpuCoreCount: number;
  dataStorageSizeInTBs: number;
  connectionStrings?: any;
  licenseModel: string;
  isPreview?: boolean;
}

export interface OracleVCN extends ResourceBase {
  vcnId: string;
  displayName: string;
  compartmentId: string;
  cidrBlocks: string[];
  defaultDhcpOptionsId: string;
  defaultRouteTableId: string;
  defaultSecurityListId: string;
  dnsLabel?: string;
}

// Cloud Resource Inventory
export interface ResourceInventory {
  provider: CloudProvider;
  region: string;
  totalResources: number;
  resourcesByType: Record<ResourceType, number>;
  totalCost: number;
  resources: {
    compute: ComputeResource[];
    storage: StorageResource[];
    database: DatabaseResource[];
    network: NetworkResource[];
    [key: string]: ResourceBase[];
  };
  lastUpdated: Date;
}

export interface InventoryFilters {
  provider?: CloudProvider;
  regions?: string[];
  resourceTypes?: ResourceType[];
  tags?: Record<string, string>;
  includeDeleted?: boolean;
  includeCosts?: boolean;
}

export interface InventoryExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeMetadata?: boolean;
  includeCosts?: boolean;
  groupByProvider?: boolean;
  groupByRegion?: boolean;
}

// Budget and Alerts Types
export interface BudgetInfo {
  budgetName: string;
  budgetLimit: number;
  actualSpend: number;
  forecastedSpend?: number;
  timeUnit: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  timePeriod: {
    start: string;
    end: string;
  };
  budgetType: 'COST' | 'USAGE';
  status: 'OK' | 'ALARM' | 'FORECASTED_ALARM';
  thresholds: BudgetThreshold[];
  costFilters?: {
    services?: string[];
    tags?: Record<string, string[]>;
    linkedAccounts?: string[];
  };
}

export interface BudgetThreshold {
  threshold: number;
  thresholdType: 'PERCENTAGE' | 'ABSOLUTE_VALUE';
  comparisonOperator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL_TO';
  notificationType: 'ACTUAL' | 'FORECASTED';
}

export interface BudgetAlert {
  budgetName: string;
  alertType: 'THRESHOLD_EXCEEDED' | 'FORECAST_EXCEEDED';
  currentSpend: number;
  budgetLimit: number;
  threshold: number;
  percentageUsed: number;
  timeRemaining: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
}

export interface TrendData {
  period: string;
  actualCost: number;
  forecastedCost?: number;
  budgetLimit?: number;
  previousPeriodCost?: number;
  changeFromPrevious: {
    amount: number;
    percentage: number;
  };
}

export interface CostTrendAnalysis {
  provider?: CloudProvider;
  timeRange?: {
    start: string;
    end: string;
  };
  granularity?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  trendData?: TrendData[];
  totalCost: number;
  averageDailyCost: number;
  projectedMonthlyCost: number;
  avgMonthOverMonthGrowth?: number;
  topServices?: Array<{
    serviceName: string;
    cost: number;
    percentage: number;
    trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  }>;
  costAnomalies: Array<{
    date: string;
    actualCost?: number;
    expectedCost?: number;
    deviation: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    possibleCause?: string;
    description?: string;
  }>;
  monthlyBreakdown?: Array<{
    month: string;
    cost: number;
    services: Record<string, number>;
  }>;
  serviceTrends?: Record<string, {
    currentCost: number;
    growthRate: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }>;
  forecastAccuracy?: number;
  analytics?: {
    insights: string[];
    recommendations: string[];
    volatilityScore: number;
    trendStrength: number;
  };
}

export interface FinOpsRecommendation {
  id: string;
  type: 'COST_OPTIMIZATION' | 'RESOURCE_RIGHTSIZING' | 'RESERVED_CAPACITY' | 'ARCHITECTURE';
  title: string;
  description: string;
  potentialSavings: {
    amount: number;
    percentage: number;
    timeframe: 'MONTHLY' | 'ANNUALLY';
  };
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resources?: string[];
  implementationSteps: string[];
  tags: string[];
}