// Manual mock for @alicloud/rds20140815
const jestGlobals = require('@jest/globals');

const mockDescribeDBInstances = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    requestId: 'mock-request-id',
    totalRecordCount: 2,
    pageNumber: 1,
    pageRecordCount: 2,
    items: {
      dBInstance: [
        {
          dBInstanceId: 'rm-bp1234567890',
          dBInstanceDescription: 'Production MySQL Database',
          engine: 'MySQL',
          engineVersion: '8.0',
          dBInstanceType: 'Primary',
          dBInstanceClass: 'rds.mysql.s3.large',
          dBInstanceStorage: 100,
          dBInstanceNetType: 'Internet',
          connectionString: 'rm-bp1234567890.mysql.rds.aliyuncs.com',
          port: '3306',
          regionId: 'cn-beijing',
          zoneId: 'cn-beijing-a',
          vpcId: 'vpc-bp1234567890',
          vSwitchId: 'vsw-bp1234567890',
          dBInstanceStatus: 'Running',
          createTime: '2024-01-01T00:00:00Z',
          expireTime: '2024-12-31T23:59:59Z',
          payType: 'Postpaid',
          lockMode: 'Unlock',
          category: 'HighAvailability',
          resourceGroupId: 'rg-bp1234567890',
          storageType: 'cloud_essd',
          instanceNetworkType: 'VPC',
        },
        {
          dBInstanceId: 'rm-bp0987654321',
          dBInstanceDescription: 'Development PostgreSQL Database',
          engine: 'PostgreSQL',
          engineVersion: '14.0',
          dBInstanceType: 'Primary',
          dBInstanceClass: 'rds.pg.s2.large',
          dBInstanceStorage: 50,
          dBInstanceNetType: 'Intranet',
          connectionString: 'rm-bp0987654321.pg.rds.aliyuncs.com',
          port: '5432',
          regionId: 'cn-shanghai',
          zoneId: 'cn-shanghai-b',
          vpcId: 'vpc-bp0987654321',
          vSwitchId: 'vsw-bp0987654321',
          dBInstanceStatus: 'Running',
          createTime: '2024-01-15T00:00:00Z',
          payType: 'Postpaid',
          lockMode: 'Unlock',
          category: 'Basic',
          resourceGroupId: 'rg-bp0987654321',
          storageType: 'cloud_ssd',
          instanceNetworkType: 'VPC',
        },
      ],
    },
  },
});

const mockDescribeDBInstanceAttribute = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    requestId: 'mock-request-id',
    items: {
      dBInstanceAttribute: [
        {
          dBInstanceId: 'rm-bp1234567890',
          dBInstanceDescription: 'Production MySQL Database',
          engine: 'MySQL',
          engineVersion: '8.0',
          dBInstanceType: 'Primary',
          dBInstanceClass: 'rds.mysql.s3.large',
          dBInstanceMemory: 8192,
          dBInstanceStorage: 100,
          dBInstanceCPU: '2',
          dBInstanceNetType: 'Internet',
          connectionString: 'rm-bp1234567890.mysql.rds.aliyuncs.com',
          port: '3306',
          regionId: 'cn-beijing',
          zoneId: 'cn-beijing-a',
          vpcId: 'vpc-bp1234567890',
          vSwitchId: 'vsw-bp1234567890',
          dBInstanceStatus: 'Running',
          createTime: '2024-01-01T00:00:00Z',
          expireTime: '2024-12-31T23:59:59Z',
          maintainTime: '02:00Z-03:00Z',
          payType: 'Postpaid',
          lockMode: 'Unlock',
          category: 'HighAvailability',
          accountMaxQuantity: 500,
          dBMaxQuantity: 200,
          maxConnections: 2000,
          maxIOPS: 8000,
          resourceGroupId: 'rg-bp1234567890',
          storageType: 'cloud_essd',
          instanceNetworkType: 'VPC',
          securityIPList: '0.0.0.0/0',
        },
      ],
    },
  },
});

const mockDescribeDBInstancePerformance = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    requestId: 'mock-request-id',
    dBInstanceId: 'rm-bp1234567890',
    engine: 'MySQL',
    startTime: '2024-01-31T00:00:00Z',
    endTime: '2024-01-31T23:59:59Z',
    performanceKeys: {
      performanceKey: [
        {
          key: 'MySQL_Sessions',
          unit: 'Sessions',
          valueFormat: 'avg',
          values: {
            performanceValue: [
              {
                value: '45',
                date: '2024-01-31T12:00:00Z',
              },
            ],
          },
        },
        {
          key: 'MySQL_IOPS',
          unit: 'IOPS',
          valueFormat: 'avg',
          values: {
            performanceValue: [
              {
                value: '1200',
                date: '2024-01-31T12:00:00Z',
              },
            ],
          },
        },
      ],
    },
  },
});

const mockDescribeRegions = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    requestId: 'mock-request-id',
    regions: {
      rDSRegion: [
        {
          regionId: 'cn-beijing',
          zoneId: 'cn-beijing-a',
          regionEndpoint: 'rds.cn-beijing.aliyuncs.com',
          localName: 'China (Beijing)',
        },
        {
          regionId: 'cn-shanghai',
          zoneId: 'cn-shanghai-a',
          regionEndpoint: 'rds.cn-shanghai.aliyuncs.com',
          localName: 'China (Shanghai)',
        },
        {
          regionId: 'us-west-1',
          zoneId: 'us-west-1a',
          regionEndpoint: 'rds.us-west-1.aliyuncs.com',
          localName: 'US (Silicon Valley)',
        },
      ],
    },
  },
});

class default_1 {
  constructor(config) {
    this.config = config;
    this.endpoint = config.endpoint || 'rds.aliyuncs.com';
  }

  async describeDBInstances(request) {
    return mockDescribeDBInstances(request);
  }

  async describeDBInstanceAttribute(request) {
    return mockDescribeDBInstanceAttribute(request);
  }

  async describeDBInstancePerformance(request) {
    return mockDescribeDBInstancePerformance(request);
  }

  async describeRegions(request) {
    return mockDescribeRegions(request);
  }
}

module.exports = {
  default: default_1,
  mockDescribeDBInstances,
  mockDescribeDBInstanceAttribute,
  mockDescribeDBInstancePerformance,
  mockDescribeRegions,
};
