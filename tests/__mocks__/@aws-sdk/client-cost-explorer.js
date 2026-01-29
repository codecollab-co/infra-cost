// Manual mock for @aws-sdk/client-cost-explorer
const jestGlobals = require('@jest/globals');

const mockCESend = jestGlobals.jest.fn();

// Export as a real class, not jest.fn()
class CostExplorerClient {
  constructor(config) {
    this.send = mockCESend;
  }
}

const GetCostAndUsageCommand = jestGlobals.jest.fn((input) => input);

module.exports = {
  mockCESend,
  CostExplorerClient,
  GetCostAndUsageCommand
};
