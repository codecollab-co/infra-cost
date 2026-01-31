// Manual mock for oci-usageapi
const jestGlobals = require('@jest/globals');

const mockRequestSummarizedUsages = jestGlobals.jest.fn().mockResolvedValue({
  items: [
    {
      timeUsageStarted: new Date('2024-01-31T00:00:00Z'),
      timeUsageEnded: new Date('2024-01-31T23:59:59Z'),
      computedAmount: 142.30,
      computedQuantity: 24.0,
      currency: 'USD',
      service: 'COMPUTE',
      resourceName: 'VM.Standard.E4.Flex',
    },
    {
      timeUsageStarted: new Date('2024-01-31T00:00:00Z'),
      timeUsageEnded: new Date('2024-01-31T23:59:59Z'),
      computedAmount: 89.50,
      computedQuantity: 1000.0,
      currency: 'USD',
      service: 'BLOCK_STORAGE',
      resourceName: 'Block Volume',
    },
    {
      timeUsageStarted: new Date('2024-01-31T00:00:00Z'),
      timeUsageEnded: new Date('2024-01-31T23:59:59Z'),
      computedAmount: 45.20,
      computedQuantity: 500.0,
      currency: 'USD',
      service: 'OBJECT_STORAGE',
      resourceName: 'Object Storage',
    },
  ],
});

class UsageapiClient {
  constructor(params) {
    this.endpoint = params.endpoint || 'https://usageapi.us-ashburn-1.oraclecloud.com';
  }

  requestSummarizedUsages(request) {
    return mockRequestSummarizedUsages(request);
  }
}

module.exports = {
  UsageapiClient,
  mockRequestSummarizedUsages,
};
