import {
  discoverGCEInstances,
  discoverStorageBuckets,
  discoverCloudSQLInstances,
  discoverGKEClusters,
} from '../../../../src/providers/gcp/inventory';
import { Compute } from '@google-cloud/compute';
import { Storage } from '@google-cloud/storage';
import { SQLAdminClient } from '@google-cloud/sql';
import { ClusterManagerClient } from '@google-cloud/container';

// Mock all GCP SDKs
jest.mock('@google-cloud/compute', () => ({
  Compute: jest.fn(),
}));
jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn(),
}));
jest.mock('@google-cloud/sql', () => ({
  SQLAdminClient: jest.fn(),
}));
jest.mock('@google-cloud/container', () => ({
  ClusterManagerClient: jest.fn(),
}));
jest.mock('../../../../src/logger', () => ({
  showSpinner: jest.fn(),
}));

describe('GCP Inventory', () => {
  const mockAuth = {
    getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
  };

  const mockGcpConfig = {
    auth: mockAuth as any,
    projectId: 'test-project',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('discoverGCEInstances', () => {
    it('should discover GCE instances across all zones', async () => {
      const mockInstance = {
        id: 'instance-1',
        name: 'test-instance',
        metadata: {
          id: '123456789',
          name: 'test-instance',
          status: 'RUNNING',
          zone: 'projects/test-project/zones/us-central1-a',
          machineType: 'projects/test-project/zones/us-central1-a/machineTypes/n1-standard-1',
          creationTimestamp: '2026-01-15T10:00:00Z',
          labels: {
            environment: 'production',
            team: 'backend',
          },
          networkInterfaces: [
            {
              name: 'nic0',
              network: 'default',
              networkIP: '10.0.0.1',
              accessConfigs: [{ natIP: '35.1.2.3' }],
            },
          ],
          disks: [
            {
              source: 'disk-1',
              diskSizeGb: '100',
            },
          ],
        },
      };

      const mockZone = {
        name: 'us-central1-a',
        getVMs: jest.fn().mockResolvedValue([[mockInstance]]),
      };

      (Compute as jest.Mock).mockImplementation(() => ({
        getZones: jest.fn().mockResolvedValue([[mockZone]]),
      }));

      const result = await discoverGCEInstances(mockGcpConfig);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-instance');
      expect(result[0].state).toBe('RUNNING');
      expect(result[0].zone).toBe('us-central1-a');
      expect(result[0].region).toBe('us-central1');
      expect(result[0].machineType).toBe('n1-standard-1');
      expect(result[0].tags).toEqual({
        environment: 'production',
        team: 'backend',
      });
      expect(result[0].networkInterfaces).toHaveLength(1);
      expect(result[0].disks).toHaveLength(1);
    });

    it('should filter instances by region', async () => {
      const mockInstance1 = {
        id: 'instance-1',
        name: 'test-instance-1',
        metadata: {
          status: 'RUNNING',
          zone: 'projects/test-project/zones/us-central1-a',
          machineType: 'projects/test-project/zones/us-central1-a/machineTypes/n1-standard-1',
          creationTimestamp: '2026-01-15T10:00:00Z',
        },
      };

      const mockInstance2 = {
        id: 'instance-2',
        name: 'test-instance-2',
        metadata: {
          status: 'RUNNING',
          zone: 'projects/test-project/zones/us-west1-a',
          machineType: 'projects/test-project/zones/us-west1-a/machineTypes/n1-standard-1',
          creationTimestamp: '2026-01-15T10:00:00Z',
        },
      };

      const mockZone1 = {
        name: 'us-central1-a',
        getVMs: jest.fn().mockResolvedValue([[mockInstance1]]),
      };

      const mockZone2 = {
        name: 'us-west1-a',
        getVMs: jest.fn().mockResolvedValue([[mockInstance2]]),
      };

      (Compute as jest.Mock).mockImplementation(() => ({
        getZones: jest.fn().mockResolvedValue([[mockZone1, mockZone2]]),
      }));

      const result = await discoverGCEInstances(mockGcpConfig, {
        regions: ['us-central1'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-instance-1');
      expect(result[0].region).toBe('us-central1');
    });

    it('should exclude terminated instances by default', async () => {
      const mockRunningInstance = {
        id: 'instance-1',
        name: 'running-instance',
        metadata: {
          status: 'RUNNING',
          zone: 'projects/test-project/zones/us-central1-a',
          machineType: 'projects/test-project/zones/us-central1-a/machineTypes/n1-standard-1',
          creationTimestamp: '2026-01-15T10:00:00Z',
        },
      };

      const mockTerminatedInstance = {
        id: 'instance-2',
        name: 'terminated-instance',
        metadata: {
          status: 'TERMINATED',
          zone: 'projects/test-project/zones/us-central1-a',
          machineType: 'projects/test-project/zones/us-central1-a/machineTypes/n1-standard-1',
          creationTimestamp: '2026-01-15T10:00:00Z',
        },
      };

      const mockZone = {
        name: 'us-central1-a',
        getVMs: jest.fn().mockResolvedValue([[mockRunningInstance, mockTerminatedInstance]]),
      };

      (Compute as jest.Mock).mockImplementation(() => ({
        getZones: jest.fn().mockResolvedValue([[mockZone]]),
      }));

      const result = await discoverGCEInstances(mockGcpConfig);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('running-instance');
    });

    it('should handle errors from individual zones gracefully', async () => {
      const mockSuccessZone = {
        name: 'us-central1-a',
        getVMs: jest.fn().mockResolvedValue([
          [
            {
              id: 'instance-1',
              name: 'test-instance',
              metadata: {
                status: 'RUNNING',
                zone: 'projects/test-project/zones/us-central1-a',
                machineType:
                  'projects/test-project/zones/us-central1-a/machineTypes/n1-standard-1',
                creationTimestamp: '2026-01-15T10:00:00Z',
              },
            },
          ],
        ]),
      };

      const mockFailZone = {
        name: 'us-west1-a',
        getVMs: jest.fn().mockRejectedValue(new Error('Access denied')),
      };

      (Compute as jest.Mock).mockImplementation(() => ({
        getZones: jest.fn().mockResolvedValue([[mockSuccessZone, mockFailZone]]),
      }));

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await discoverGCEInstances(mockGcpConfig);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-instance');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get instances in zone us-west1-a')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('discoverStorageBuckets', () => {
    it('should discover Cloud Storage buckets', async () => {
      const mockBucket = {
        id: 'bucket-1',
        name: 'test-bucket',
        getMetadata: jest.fn().mockResolvedValue([
          {
            id: 'bucket-1',
            name: 'test-bucket',
            location: 'US',
            storageClass: 'STANDARD',
            timeCreated: '2026-01-15T10:00:00Z',
            labels: {
              environment: 'production',
            },
            iamConfiguration: {
              uniformBucketLevelAccess: {
                enabled: true,
              },
            },
            versioning: {
              enabled: true,
            },
            encryption: {
              defaultKmsKeyName: 'projects/test/locations/us/keyRings/ring/cryptoKeys/key',
            },
          },
        ]),
      };

      (Storage as jest.Mock).mockImplementation(() => ({
        getBuckets: jest.fn().mockResolvedValue([[mockBucket]]),
      }));

      const result = await discoverStorageBuckets(mockGcpConfig);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-bucket');
      expect(result[0].location).toBe('US');
      expect(result[0].storageClass).toBe('STANDARD');
      expect(result[0].encrypted).toBe(true);
      expect(result[0].uniformBucketLevelAccess).toBe(true);
      expect(result[0].versioning).toBe(true);
      expect(result[0].tags).toEqual({ environment: 'production' });
    });

    it('should filter buckets by tags', async () => {
      const mockBucket1 = {
        id: 'bucket-1',
        name: 'prod-bucket',
        getMetadata: jest.fn().mockResolvedValue([
          {
            id: 'bucket-1',
            name: 'prod-bucket',
            location: 'US',
            storageClass: 'STANDARD',
            timeCreated: '2026-01-15T10:00:00Z',
            labels: {
              environment: 'production',
            },
          },
        ]),
      };

      const mockBucket2 = {
        id: 'bucket-2',
        name: 'dev-bucket',
        getMetadata: jest.fn().mockResolvedValue([
          {
            id: 'bucket-2',
            name: 'dev-bucket',
            location: 'US',
            storageClass: 'STANDARD',
            timeCreated: '2026-01-15T10:00:00Z',
            labels: {
              environment: 'development',
            },
          },
        ]),
      };

      (Storage as jest.Mock).mockImplementation(() => ({
        getBuckets: jest.fn().mockResolvedValue([[mockBucket1, mockBucket2]]),
      }));

      const result = await discoverStorageBuckets(mockGcpConfig, {
        tags: { environment: 'production' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('prod-bucket');
    });
  });

  describe('discoverCloudSQLInstances', () => {
    it('should discover Cloud SQL instances', async () => {
      const mockSQLInstance = {
        name: 'test-sql-instance',
        state: 'RUNNABLE',
        region: 'us-central1',
        databaseVersion: 'POSTGRES_14',
        createTime: '2026-01-15T10:00:00Z',
        settings: {
          tier: 'db-n1-standard-1',
          dataDiskSizeGb: 100,
          availabilityType: 'REGIONAL',
          userLabels: {
            environment: 'production',
          },
          backupConfiguration: {
            enabled: true,
            startTime: '03:00',
          },
        },
        ipAddresses: [
          {
            type: 'PRIMARY',
            ipAddress: '10.0.0.1',
          },
        ],
      };

      (SQLAdminClient as jest.Mock).mockImplementation(() => ({
        listInstances: jest.fn().mockResolvedValue([[mockSQLInstance]]),
      }));

      const result = await discoverCloudSQLInstances(mockGcpConfig);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-sql-instance');
      expect(result[0].state).toBe('RUNNABLE');
      expect(result[0].region).toBe('us-central1');
      expect(result[0].engine).toBe('POSTGRES');
      expect(result[0].version).toBe('POSTGRES_14');
      expect(result[0].tier).toBe('db-n1-standard-1');
      expect(result[0].storageGB).toBe(100);
      expect(result[0].multiAZ).toBe(true);
      expect(result[0].backupConfiguration?.enabled).toBe(true);
    });

    it('should exclude failed instances by default', async () => {
      const mockRunnableInstance = {
        name: 'runnable-instance',
        state: 'RUNNABLE',
        region: 'us-central1',
        databaseVersion: 'MYSQL_8_0',
        createTime: '2026-01-15T10:00:00Z',
        settings: {
          tier: 'db-n1-standard-1',
        },
      };

      const mockFailedInstance = {
        name: 'failed-instance',
        state: 'FAILED',
        region: 'us-central1',
        databaseVersion: 'MYSQL_8_0',
        createTime: '2026-01-15T10:00:00Z',
        settings: {
          tier: 'db-n1-standard-1',
        },
      };

      (SQLAdminClient as jest.Mock).mockImplementation(() => ({
        listInstances: jest
          .fn()
          .mockResolvedValue([[mockRunnableInstance, mockFailedInstance]]),
      }));

      const result = await discoverCloudSQLInstances(mockGcpConfig);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('runnable-instance');
    });
  });

  describe('discoverGKEClusters', () => {
    it('should discover GKE clusters', async () => {
      const mockCluster = {
        id: 'cluster-1',
        name: 'test-cluster',
        status: 'RUNNING',
        location: 'us-central1',
        createTime: '2026-01-15T10:00:00Z',
        currentMasterVersion: '1.28.5-gke.1000',
        currentNodeCount: 6,
        endpoint: '35.1.2.3',
        clusterIpv4Cidr: '10.0.0.0/14',
        resourceLabels: {
          environment: 'production',
        },
        nodePools: [
          {
            name: 'default-pool',
            version: '1.28.5-gke.1000',
            config: {
              machineType: 'n1-standard-2',
              diskSizeGb: 100,
            },
            initialNodeCount: 3,
          },
          {
            name: 'high-mem-pool',
            version: '1.28.5-gke.1000',
            config: {
              machineType: 'n1-highmem-4',
              diskSizeGb: 200,
            },
            initialNodeCount: 3,
          },
        ],
      };

      (ClusterManagerClient as jest.Mock).mockImplementation(() => ({
        listClusters: jest.fn().mockResolvedValue([{ clusters: [mockCluster] }]),
      }));

      const result = await discoverGKEClusters(mockGcpConfig);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-cluster');
      expect(result[0].status).toBe('RUNNING');
      expect(result[0].location).toBe('us-central1');
      expect(result[0].masterVersion).toBe('1.28.5-gke.1000');
      expect(result[0].nodeCount).toBe(6); // Sum of all node pools
      expect(result[0].nodePools).toHaveLength(2);
      expect(result[0].tags).toEqual({ environment: 'production' });
    });

    it('should filter clusters by region', async () => {
      const mockCluster1 = {
        name: 'central-cluster',
        status: 'RUNNING',
        location: 'us-central1',
        createTime: '2026-01-15T10:00:00Z',
        currentMasterVersion: '1.28.5-gke.1000',
        nodePools: [
          {
            name: 'default-pool',
            initialNodeCount: 3,
          },
        ],
      };

      const mockCluster2 = {
        name: 'west-cluster',
        status: 'RUNNING',
        location: 'us-west1',
        createTime: '2026-01-15T10:00:00Z',
        currentMasterVersion: '1.28.5-gke.1000',
        nodePools: [
          {
            name: 'default-pool',
            initialNodeCount: 3,
          },
        ],
      };

      (ClusterManagerClient as jest.Mock).mockImplementation(() => ({
        listClusters: jest.fn().mockResolvedValue([{ clusters: [mockCluster1, mockCluster2] }]),
      }));

      const result = await discoverGKEClusters(mockGcpConfig, {
        regions: ['us-central1'],
      });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('central-cluster');
    });

    it('should exclude error state clusters by default', async () => {
      const mockRunningCluster = {
        name: 'running-cluster',
        status: 'RUNNING',
        location: 'us-central1',
        createTime: '2026-01-15T10:00:00Z',
        currentMasterVersion: '1.28.5-gke.1000',
        nodePools: [],
      };

      const mockErrorCluster = {
        name: 'error-cluster',
        status: 'ERROR',
        location: 'us-central1',
        createTime: '2026-01-15T10:00:00Z',
        currentMasterVersion: '1.28.5-gke.1000',
        nodePools: [],
      };

      (ClusterManagerClient as jest.Mock).mockImplementation(() => ({
        listClusters: jest
          .fn()
          .mockResolvedValue([{ clusters: [mockRunningCluster, mockErrorCluster] }]),
      }));

      const result = await discoverGKEClusters(mockGcpConfig);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('running-cluster');
    });
  });
});
