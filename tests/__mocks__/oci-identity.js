// Manual mock for oci-identity
const jestGlobals = require('@jest/globals');

const mockGetTenancy = jestGlobals.jest.fn().mockResolvedValue({
  tenancy: {
    id: 'ocid1.tenancy.oc1..test',
    name: 'test-tenancy',
    description: 'Test Tenancy',
    homeRegionKey: 'IAD',
  },
});

const mockListCompartments = jestGlobals.jest.fn().mockResolvedValue({
  items: [
    {
      id: 'ocid1.compartment.oc1..test1',
      name: 'test-compartment-1',
      description: 'Test Compartment 1',
      lifecycleState: 'ACTIVE',
      timeCreated: new Date('2024-01-01'),
    },
    {
      id: 'ocid1.compartment.oc1..test2',
      name: 'test-compartment-2',
      description: 'Test Compartment 2',
      lifecycleState: 'ACTIVE',
      timeCreated: new Date('2024-01-15'),
    },
  ],
});

class IdentityClient {
  constructor(params) {
    this.endpoint = params.endpoint || 'https://identity.us-ashburn-1.oraclecloud.com';
  }

  getTenancy(request) {
    return mockGetTenancy(request);
  }

  listCompartments(request) {
    return mockListCompartments(request);
  }
}

module.exports = {
  IdentityClient,
  mockGetTenancy,
  mockListCompartments,
};
