// Manual mock for @alicloud/oss20190517
const jestGlobals = require('@jest/globals');

const mockListBuckets = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    requestId: 'mock-request-id',
    buckets: {
      bucket: [
        {
          name: 'test-bucket-1',
          location: 'oss-cn-beijing',
          creationDate: '2024-01-01T00:00:00.000Z',
          storageClass: 'Standard',
          extranetEndpoint: 'oss-cn-beijing.aliyuncs.com',
          intranetEndpoint: 'oss-cn-beijing-internal.aliyuncs.com',
          region: 'cn-beijing',
        },
        {
          name: 'test-bucket-2',
          location: 'oss-cn-shanghai',
          creationDate: '2024-01-15T00:00:00.000Z',
          storageClass: 'IA',
          extranetEndpoint: 'oss-cn-shanghai.aliyuncs.com',
          intranetEndpoint: 'oss-cn-shanghai-internal.aliyuncs.com',
          region: 'cn-shanghai',
        },
        {
          name: 'archive-bucket',
          location: 'oss-us-west-1',
          creationDate: '2023-12-01T00:00:00.000Z',
          storageClass: 'Archive',
          extranetEndpoint: 'oss-us-west-1.aliyuncs.com',
          intranetEndpoint: 'oss-us-west-1-internal.aliyuncs.com',
          region: 'us-west-1',
        },
      ],
    },
  },
});

const mockGetBucketInfo = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    requestId: 'mock-request-id',
    bucketInfo: {
      bucket: {
        name: 'test-bucket-1',
        location: 'oss-cn-beijing',
        creationDate: '2024-01-01T00:00:00.000Z',
        storageClass: 'Standard',
        extranetEndpoint: 'oss-cn-beijing.aliyuncs.com',
        intranetEndpoint: 'oss-cn-beijing-internal.aliyuncs.com',
        acl: {
          grant: 'private',
        },
        dataRedundancyType: 'LRS',
        owner: {
          id: '1234567890',
          displayName: 'test-account',
        },
        versioning: 'Enabled',
        serverSideEncryptionRule: {
          sseAlgorithm: 'AES256',
        },
      },
    },
  },
});

const mockGetBucketStat = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    requestId: 'mock-request-id',
    storage: 1024000000,
    objectCount: 1500,
    multipartUploadCount: 2,
    liveChannelCount: 0,
    lastModifiedTime: 1706745600,
    standardStorage: 512000000,
    standardObjectCount: 1000,
    infrequentAccessStorage: 512000000,
    infrequentAccessRealStorage: 512000000,
    infrequentAccessObjectCount: 500,
    archiveStorage: 0,
    archiveRealStorage: 0,
    archiveObjectCount: 0,
    coldArchiveStorage: 0,
    coldArchiveRealStorage: 0,
    coldArchiveObjectCount: 0,
  },
});

const mockListObjects = jestGlobals.jest.fn().mockResolvedValue({
  body: {
    requestId: 'mock-request-id',
    name: 'test-bucket-1',
    prefix: '',
    marker: '',
    maxKeys: 100,
    delimiter: '/',
    isTruncated: false,
    contents: {
      content: [
        {
          key: 'folder/file1.txt',
          lastModified: '2024-01-20T10:00:00.000Z',
          eTag: '"abc123"',
          size: 1024,
          storageClass: 'Standard',
          owner: {
            id: '1234567890',
            displayName: 'test-account',
          },
        },
        {
          key: 'folder/file2.jpg',
          lastModified: '2024-01-21T10:00:00.000Z',
          eTag: '"def456"',
          size: 204800,
          storageClass: 'Standard',
          owner: {
            id: '1234567890',
            displayName: 'test-account',
          },
        },
      ],
    },
  },
});

class default_1 {
  constructor(config) {
    this.config = config;
    this.endpoint = config.endpoint || 'oss-cn-beijing.aliyuncs.com';
  }

  async listBuckets(request) {
    return mockListBuckets(request);
  }

  async getBucketInfo(request) {
    return mockGetBucketInfo(request);
  }

  async getBucketStat(request) {
    return mockGetBucketStat(request);
  }

  async listObjects(request) {
    return mockListObjects(request);
  }
}

module.exports = {
  default: default_1,
  mockListBuckets,
  mockGetBucketInfo,
  mockGetBucketStat,
  mockListObjects,
};
