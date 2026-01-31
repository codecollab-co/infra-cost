// Manual mock for @azure/arm-subscriptions
const jestGlobals = require('@jest/globals');

const mockListSubscriptions = jestGlobals.jest.fn().mockImplementation(async function* () {
  yield {
    subscriptionId: '12345678-1234-1234-1234-123456789012',
    displayName: 'Test Subscription',
    state: 'Enabled',
    subscriptionPolicies: {
      locationPlacementId: 'Public_2014-09-01',
      quotaId: 'EnterpriseAgreement_2014-09-01',
      spendingLimit: 'Off',
    },
  };
  yield {
    subscriptionId: '87654321-4321-4321-4321-210987654321',
    displayName: 'Test Subscription 2',
    state: 'Enabled',
  };
});

class SubscriptionClient {
  constructor(credential, options) {
    this.credential = credential;
    this.subscriptions = {
      list: mockListSubscriptions,
    };
  }
}

module.exports = {
  SubscriptionClient,
  mockListSubscriptions,
};
