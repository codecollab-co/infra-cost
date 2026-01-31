// Manual mock for @google-cloud/billing
const jestGlobals = require('@jest/globals');

const mockGetBillingAccount = jestGlobals.jest.fn().mockResolvedValue([
  {
    name: 'billingAccounts/012345-ABCDEF-678901',
    displayName: 'Test Billing Account',
    open: true,
  },
]);

const mockListProjectBillingInfo = jestGlobals.jest.fn().mockResolvedValue([
  [
    {
      name: 'projects/test-project-123/billingInfo',
      projectId: 'test-project-123',
      billingAccountName: 'billingAccounts/012345-ABCDEF-678901',
      billingEnabled: true,
    },
  ],
]);

class CloudBillingClient {
  constructor(options) {
    this.options = options;
  }

  getBillingAccount(request) {
    return mockGetBillingAccount(request);
  }

  listProjectBillingInfo(request) {
    return mockListProjectBillingInfo(request);
  }
}

module.exports = {
  CloudBillingClient,
  mockGetBillingAccount,
  mockListProjectBillingInfo,
};
