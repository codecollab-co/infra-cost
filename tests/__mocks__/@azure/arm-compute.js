// Manual mock for @azure/arm-compute
const jestGlobals = require('@jest/globals');

const mockListVMs = jestGlobals.jest.fn().mockImplementation(async function* () {
  yield {
    id: '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/test-rg/providers/Microsoft.Compute/virtualMachines/test-vm-1',
    name: 'test-vm-1',
    location: 'eastus',
    type: 'Microsoft.Compute/virtualMachines',
    properties: {
      hardwareProfile: {
        vmSize: 'Standard_D2s_v3',
      },
      provisioningState: 'Succeeded',
      osProfile: {
        computerName: 'test-vm-1',
      },
    },
  };
});

const mockListDisks = jestGlobals.jest.fn().mockImplementation(async function* () {
  yield {
    id: '/subscriptions/12345678-1234-1234-1234-123456789012/resourceGroups/test-rg/providers/Microsoft.Compute/disks/test-disk-1',
    name: 'test-disk-1',
    location: 'eastus',
    type: 'Microsoft.Compute/disks',
    properties: {
      diskSizeGB: 128,
      diskState: 'Attached',
      creationData: {
        createOption: 'Empty',
      },
    },
  };
});

class ComputeManagementClient {
  constructor(credential, subscriptionId, options) {
    this.credential = credential;
    this.subscriptionId = subscriptionId;
    this.virtualMachines = {
      listAll: mockListVMs,
    };
    this.disks = {
      list: mockListDisks,
    };
  }
}

module.exports = {
  ComputeManagementClient,
  mockListVMs,
  mockListDisks,
};
