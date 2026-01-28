// Manual mock for @aws-sdk/client-iam
const jestGlobals = require('@jest/globals');

const mockIAMSend = jestGlobals.jest.fn();

// Export as a real class, not jest.fn()
class IAMClient {
  constructor(config) {
    this.send = mockIAMSend;
  }
}

const ListAccountAliasesCommand = jestGlobals.jest.fn((input) => input);

module.exports = {
  mockIAMSend,
  IAMClient,
  ListAccountAliasesCommand
};
