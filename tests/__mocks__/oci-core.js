// Manual mock for oci-core
const jestGlobals = require('@jest/globals');

const mockListInstances = jestGlobals.jest.fn().mockResolvedValue({
  items: [
    {
      id: 'ocid1.instance.oc1.iad.test1',
      displayName: 'test-instance-1',
      compartmentId: 'ocid1.compartment.oc1..test',
      availabilityDomain: 'AD-1',
      lifecycleState: 'RUNNING',
      shape: 'VM.Standard.E4.Flex',
      timeCreated: new Date('2024-01-01'),
    },
    {
      id: 'ocid1.instance.oc1.iad.test2',
      displayName: 'test-instance-2',
      compartmentId: 'ocid1.compartment.oc1..test',
      availabilityDomain: 'AD-2',
      lifecycleState: 'RUNNING',
      shape: 'VM.Standard2.1',
      timeCreated: new Date('2024-01-15'),
    },
  ],
});

const mockListBootVolumes = jestGlobals.jest.fn().mockResolvedValue({
  items: [
    {
      id: 'ocid1.bootvolume.oc1.iad.test1',
      displayName: 'boot-volume-1',
      compartmentId: 'ocid1.compartment.oc1..test',
      availabilityDomain: 'AD-1',
      sizeInGBs: 50,
      lifecycleState: 'AVAILABLE',
    },
  ],
});

class ComputeClient {
  constructor(params) {
    this.endpoint = params.endpoint || 'https://iaas.us-ashburn-1.oraclecloud.com';
  }

  listInstances(request) {
    return mockListInstances(request);
  }
}

class BlockstorageClient {
  constructor(params) {
    this.endpoint = params.endpoint || 'https://iaas.us-ashburn-1.oraclecloud.com';
  }

  listBootVolumes(request) {
    return mockListBootVolumes(request);
  }
}

module.exports = {
  ComputeClient,
  BlockstorageClient,
  mockListInstances,
  mockListBootVolumes,
};
