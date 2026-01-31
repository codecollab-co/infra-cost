// Manual mock for @google-cloud/compute
const jestGlobals = require('@jest/globals');

const mockListInstances = jestGlobals.jest.fn().mockResolvedValue([
  [
    {
      id: '1234567890',
      name: 'test-instance-1',
      zone: 'us-central1-a',
      machineType: 'n1-standard-1',
      status: 'RUNNING',
      networkInterfaces: [{ networkIP: '10.0.0.1' }],
    },
  ],
]);

const mockListDisks = jestGlobals.jest.fn().mockResolvedValue([
  [
    {
      id: '9876543210',
      name: 'test-disk-1',
      zone: 'us-central1-a',
      sizeGb: '100',
      type: 'pd-standard',
      status: 'READY',
    },
  ],
]);

class InstancesClient {
  constructor(options) {
    this.options = options;
  }

  aggregatedList(request) {
    return mockListInstances(request);
  }
}

class DisksClient {
  constructor(options) {
    this.options = options;
  }

  aggregatedList(request) {
    return mockListDisks(request);
  }
}

module.exports = {
  InstancesClient,
  DisksClient,
  mockListInstances,
  mockListDisks,
};
