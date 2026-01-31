// Manual mock for @azure/arm-costmanagement
const jestGlobals = require('@jest/globals');

const mockUsage = jestGlobals.jest.fn().mockResolvedValue({
  properties: {
    rows: [
      ['20240131', 142.30, 'USD', 'Microsoft.Compute'],
      ['20240131', 89.50, 'USD', 'Microsoft.Storage'],
      ['20240131', 45.20, 'USD', 'Microsoft.Sql'],
    ],
    columns: [
      { name: 'UsageDate', type: 'String' },
      { name: 'PreTaxCost', type: 'Number' },
      { name: 'Currency', type: 'String' },
      { name: 'ResourceType', type: 'String' },
    ],
    nextLink: null,
  },
});

class CostManagementClient {
  constructor(credential, subscriptionId, options) {
    this.credential = credential;
    this.subscriptionId = subscriptionId;
    this.query = {
      usage: mockUsage,
    };
  }
}

module.exports = {
  CostManagementClient,
  mockUsage,
};
