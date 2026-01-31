// Manual mock for @azure/identity
const jestGlobals = require('@jest/globals');

const mockGetToken = jestGlobals.jest.fn().mockResolvedValue({
  token: 'mock-azure-token',
  expiresOnTimestamp: Date.now() + 3600000,
});

class DefaultAzureCredential {
  constructor(options) {
    this.options = options;
  }

  getToken(scopes, options) {
    return mockGetToken(scopes, options);
  }
}

class ClientSecretCredential {
  constructor(tenantId, clientId, clientSecret, options) {
    this.tenantId = tenantId;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  getToken(scopes, options) {
    return mockGetToken(scopes, options);
  }
}

module.exports = {
  DefaultAzureCredential,
  ClientSecretCredential,
  mockGetToken,
};
