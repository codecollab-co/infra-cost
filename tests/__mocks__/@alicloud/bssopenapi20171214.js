// Manual mock for @alicloud/bssopenapi20171214
const jestGlobals = require('@jest/globals');

const mockQueryAccountBill = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    code: '200',
    message: 'Successful',
    requestId: 'mock-request-id',
    success: true,
    data: {
      accountID: '1234567890',
      billingCycle: '2024-01',
      accountName: 'test-account',
      items: {
        item: [
          {
            productCode: 'ecs',
            productName: 'Elastic Compute Service',
            pipCode: 'ecs',
            pretaxAmount: 142.30,
            pretaxGrossAmount: 142.30,
            currency: 'USD',
            billAccountID: '1234567890',
            billAccountName: 'test-account',
            costUnit: 'USD',
          },
          {
            productCode: 'oss',
            productName: 'Object Storage Service',
            pipCode: 'oss',
            pretaxAmount: 45.20,
            pretaxGrossAmount: 45.20,
            currency: 'USD',
            billAccountID: '1234567890',
            billAccountName: 'test-account',
            costUnit: 'USD',
          },
          {
            productCode: 'rds',
            productName: 'Relational Database Service',
            pipCode: 'rds',
            pretaxAmount: 89.50,
            pretaxGrossAmount: 89.50,
            currency: 'USD',
            billAccountID: '1234567890',
            billAccountName: 'test-account',
            costUnit: 'USD',
          },
        ],
      },
      totalCount: 3,
    },
  },
});

const mockQueryInstanceBill = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    code: '200',
    message: 'Successful',
    requestId: 'mock-request-id',
    success: true,
    data: {
      billingCycle: '2024-01',
      accountID: '1234567890',
      accountName: 'test-account',
      totalCount: 2,
      items: {
        item: [
          {
            instanceID: 'i-bp1234567890',
            productCode: 'ecs',
            productName: 'Elastic Compute Service',
            region: 'cn-beijing',
            pretaxAmount: 142.30,
            currency: 'USD',
            subscriptionType: 'PayAsYouGo',
            resourceGroup: 'default',
          },
          {
            instanceID: 'oss-bucket-test',
            productCode: 'oss',
            productName: 'Object Storage Service',
            region: 'cn-shanghai',
            pretaxAmount: 45.20,
            currency: 'USD',
            subscriptionType: 'PayAsYouGo',
            resourceGroup: 'default',
          },
        ],
      },
    },
  },
});

class default_1 {
  constructor(config) {
    this.config = config;
    this.endpoint = config.endpoint || 'business.aliyuncs.com';
  }

  async queryAccountBill(request) {
    return mockQueryAccountBill(request);
  }

  async queryInstanceBill(request) {
    return mockQueryInstanceBill(request);
  }
}

module.exports = {
  default: default_1,
  mockQueryAccountBill,
  mockQueryInstanceBill,
};
