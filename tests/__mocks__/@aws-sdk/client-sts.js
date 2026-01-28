// Manual mock for @aws-sdk/client-sts
const jestGlobals = require('@jest/globals');

const mockSTSSend = jestGlobals.jest.fn().mockResolvedValue({ Account: 'default-account' });

// Export as a real class, not jest.fn()
class STSClient {
  constructor(config) {
    this.send = mockSTSSend;
  }
}

const GetCallerIdentityCommand = jestGlobals.jest.fn((input) => input);

module.exports = {
  mockSTSSend,
  STSClient,
  GetCallerIdentityCommand
};
