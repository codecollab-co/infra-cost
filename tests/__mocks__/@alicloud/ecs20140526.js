// Manual mock for @alicloud/ecs20140526
const jestGlobals = require('@jest/globals');

const mockDescribeInstances = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    requestId: 'mock-request-id',
    totalCount: 2,
    pageNumber: 1,
    pageSize: 10,
    instances: {
      instance: [
        {
          instanceId: 'i-bp1234567890',
          instanceName: 'test-instance-1',
          regionId: 'cn-beijing',
          zoneId: 'cn-beijing-a',
          instanceType: 'ecs.g6.large',
          cpu: 2,
          memory: 8192,
          osName: 'Ubuntu 20.04',
          status: 'Running',
          creationTime: '2024-01-01T00:00:00Z',
          internetMaxBandwidthIn: 100,
          internetMaxBandwidthOut: 5,
          vpcAttributes: {
            vpcId: 'vpc-bp1234567890',
            vSwitchId: 'vsw-bp1234567890',
            privateIpAddress: {
              ipAddress: ['172.16.0.1'],
            },
          },
          publicIpAddress: {
            ipAddress: ['47.93.1.1'],
          },
          resourceGroupId: 'rg-bp1234567890',
        },
        {
          instanceId: 'i-bp0987654321',
          instanceName: 'test-instance-2',
          regionId: 'cn-shanghai',
          zoneId: 'cn-shanghai-a',
          instanceType: 'ecs.c6.xlarge',
          cpu: 4,
          memory: 8192,
          osName: 'CentOS 7.9',
          status: 'Running',
          creationTime: '2024-01-15T00:00:00Z',
          internetMaxBandwidthIn: 100,
          internetMaxBandwidthOut: 10,
          vpcAttributes: {
            vpcId: 'vpc-bp0987654321',
            vSwitchId: 'vsw-bp0987654321',
            privateIpAddress: {
              ipAddress: ['172.16.1.1'],
            },
          },
          publicIpAddress: {
            ipAddress: ['47.100.1.1'],
          },
          resourceGroupId: 'rg-bp0987654321',
        },
      ],
    },
  },
});

const mockDescribeDisks = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    requestId: 'mock-request-id',
    totalCount: 3,
    pageNumber: 1,
    pageSize: 10,
    disks: {
      disk: [
        {
          diskId: 'd-bp1234567890',
          diskName: 'system-disk-1',
          regionId: 'cn-beijing',
          zoneId: 'cn-beijing-a',
          category: 'cloud_essd',
          size: 100,
          type: 'system',
          status: 'In_use',
          instanceId: 'i-bp1234567890',
          device: '/dev/xvda',
          deleteWithInstance: true,
          creationTime: '2024-01-01T00:00:00Z',
        },
        {
          diskId: 'd-bp0987654321',
          diskName: 'data-disk-1',
          regionId: 'cn-beijing',
          zoneId: 'cn-beijing-a',
          category: 'cloud_efficiency',
          size: 500,
          type: 'data',
          status: 'In_use',
          instanceId: 'i-bp1234567890',
          device: '/dev/xvdb',
          deleteWithInstance: false,
          creationTime: '2024-01-02T00:00:00Z',
        },
        {
          diskId: 'd-bp5555555555',
          diskName: 'system-disk-2',
          regionId: 'cn-shanghai',
          zoneId: 'cn-shanghai-a',
          category: 'cloud_ssd',
          size: 80,
          type: 'system',
          status: 'In_use',
          instanceId: 'i-bp0987654321',
          device: '/dev/xvda',
          deleteWithInstance: true,
          creationTime: '2024-01-15T00:00:00Z',
        },
      ],
    },
  },
});

const mockDescribeRegions = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    requestId: 'mock-request-id',
    regions: {
      region: [
        {
          regionId: 'cn-beijing',
          regionEndpoint: 'ecs.cn-beijing.aliyuncs.com',
          localName: 'China (Beijing)',
        },
        {
          regionId: 'cn-shanghai',
          regionEndpoint: 'ecs.cn-shanghai.aliyuncs.com',
          localName: 'China (Shanghai)',
        },
        {
          regionId: 'us-west-1',
          regionEndpoint: 'ecs.us-west-1.aliyuncs.com',
          localName: 'US (Silicon Valley)',
        },
      ],
    },
  },
});

class default_1 {
  constructor(config) {
    this.config = config;
    this.endpoint = config.endpoint || 'ecs.aliyuncs.com';
  }

  async describeInstances(request) {
    return mockDescribeInstances(request);
  }

  async describeDisks(request) {
    return mockDescribeDisks(request);
  }

  async describeRegions(request) {
    return mockDescribeRegions(request);
  }
}

module.exports = {
  default: default_1,
  mockDescribeInstances,
  mockDescribeDisks,
  mockDescribeRegions,
};
