import { Compute } from '@google-cloud/compute';
import { Storage } from '@google-cloud/storage';
import { SQLAdminClient } from '@google-cloud/sql';
import { ClusterManagerClient } from '@google-cloud/container';
import { GCPClientConfig } from './config';
import {
  ComputeResource,
  StorageResource,
  DatabaseResource,
  CloudProvider,
  InventoryFilters,
  ResourceBase,
} from '../../types/providers';
import { showSpinner } from '../../logger';

/**
 * GCP-specific resource types
 */
export interface GCPComputeInstance extends ComputeResource {
  zone: string;
  machineType: string;
  status: string;
  networkInterfaces?: Array<{
    name: string;
    network: string;
    networkIP: string;
    accessConfigs?: Array<{ natIP: string }>;
  }>;
  disks?: Array<{
    source: string;
    sizeGb: string;
  }>;
}

export interface GCPStorageBucket extends StorageResource {
  location: string;
  storageClass: string;
  uniformBucketLevelAccess: boolean;
  versioning?: boolean;
}

export interface GCPCloudSQLInstance extends DatabaseResource {
  databaseVersion: string;
  region: string;
  tier: string;
  availabilityType: string;
  backupConfiguration?: {
    enabled: boolean;
    startTime?: string;
  };
  ipAddresses?: Array<{
    type: string;
    ipAddress: string;
  }>;
}

export interface GCPGKECluster extends ResourceBase {
  status: string;
  location: string;
  nodeCount: number;
  currentNodeCount?: number;
  masterVersion: string;
  nodePools?: Array<{
    name: string;
    version: string;
    config: {
      machineType: string;
      diskSizeGb: number;
    };
    initialNodeCount: number;
  }>;
  endpoint?: string;
  clusterIpv4Cidr?: string;
}

/**
 * Discover Google Compute Engine instances
 */
export async function discoverGCEInstances(
  gcpConfig: GCPClientConfig,
  filters?: InventoryFilters
): Promise<GCPComputeInstance[]> {
  showSpinner('Discovering GCE instances');

  const compute = new Compute({
    projectId: gcpConfig.projectId,
    auth: gcpConfig.auth as any,
  });

  const instances: GCPComputeInstance[] = [];

  try {
    // Get all zones
    const [zones] = await compute.getZones();

    // Discover instances in all zones (parallel)
    const zonePromises = zones.map(async (zone) => {
      try {
        const [zoneInstances] = await zone.getVMs();

        return zoneInstances.map((instance) => {
          const metadata = instance.metadata || {};
          const machineType = metadata.machineType?.split('/').pop() || 'unknown';
          const zoneName = metadata.zone?.split('/').pop() || 'unknown';

          // Extract tags from labels
          const labels = metadata.labels || {};
          const tags: Record<string, string> = {};
          Object.keys(labels).forEach((key) => {
            tags[key] = String(labels[key]);
          });

          // Extract network interfaces
          const networkInterfaces = metadata.networkInterfaces?.map((ni: any) => ({
            name: ni.name,
            network: ni.network,
            networkIP: ni.networkIP,
            accessConfigs: ni.accessConfigs?.map((ac: any) => ({
              natIP: ac.natIP,
            })),
          }));

          // Extract disks
          const disks = metadata.disks?.map((disk: any) => ({
            source: disk.source,
            sizeGb: disk.diskSizeGb,
          }));

          const resource: GCPComputeInstance = {
            id: metadata.id || instance.id || '',
            name: metadata.name || instance.name || '',
            state: metadata.status || 'UNKNOWN',
            region: zoneName.substring(0, zoneName.lastIndexOf('-')) || 'unknown',
            zone: zoneName,
            tags,
            createdAt: metadata.creationTimestamp
              ? new Date(metadata.creationTimestamp)
              : new Date(),
            provider: CloudProvider.GOOGLE_CLOUD,
            machineType,
            status: metadata.status || 'UNKNOWN',
            networkInterfaces,
            disks,
            // CPU and memory can be extracted from machine type if needed
            cpu: undefined,
            memory: undefined,
          };

          return resource;
        });
      } catch (error) {
        console.warn(`Failed to get instances in zone ${zone.name}: ${error.message}`);
        return [];
      }
    });

    const zoneResults = await Promise.all(zonePromises);
    instances.push(...zoneResults.flat());

    // Apply filters
    let filteredInstances = instances;

    if (filters?.regions && filters.regions.length > 0) {
      filteredInstances = filteredInstances.filter((instance) =>
        filters.regions!.includes(instance.region)
      );
    }

    if (filters?.tags) {
      filteredInstances = filteredInstances.filter((instance) => {
        if (!instance.tags) return false;
        return Object.entries(filters.tags!).every(
          ([key, value]) => instance.tags![key] === value
        );
      });
    }

    if (!filters?.includeDeleted) {
      filteredInstances = filteredInstances.filter(
        (instance) =>
          instance.state !== 'TERMINATED' &&
          instance.state !== 'STOPPING' &&
          instance.state !== 'STOPPED'
      );
    }

    return filteredInstances;
  } catch (error) {
    throw new Error(
      `Failed to discover GCE instances: ${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Ensure Compute Engine API is enabled\n` +
        `2. Verify credentials have 'compute.instances.list' permission\n` +
        `3. Check that the project ID is correct: ${gcpConfig.projectId}`
    );
  }
}

/**
 * Discover Cloud Storage buckets
 */
export async function discoverStorageBuckets(
  gcpConfig: GCPClientConfig,
  filters?: InventoryFilters
): Promise<GCPStorageBucket[]> {
  showSpinner('Discovering Cloud Storage buckets');

  const storage = new Storage({
    projectId: gcpConfig.projectId,
    auth: gcpConfig.auth as any,
  });

  const buckets: GCPStorageBucket[] = [];

  try {
    const [storageBuckets] = await storage.getBuckets();

    for (const bucket of storageBuckets) {
      const [metadata] = await bucket.getMetadata();

      // Extract labels as tags
      const labels = metadata.labels || {};
      const tags: Record<string, string> = {};
      Object.keys(labels).forEach((key) => {
        tags[key] = String(labels[key]);
      });

      // Calculate total size (requires listing all objects - expensive)
      // For now, we'll set it to 0 and calculate on-demand if needed
      const sizeGB = 0;

      const resource: GCPStorageBucket = {
        id: metadata.id || bucket.id || '',
        name: metadata.name || bucket.name || '',
        state: 'ACTIVE', // Buckets don't have state like instances
        region: metadata.location || 'unknown',
        location: metadata.location || 'unknown',
        tags,
        createdAt: metadata.timeCreated ? new Date(metadata.timeCreated) : new Date(),
        provider: CloudProvider.GOOGLE_CLOUD,
        sizeGB,
        storageType: metadata.storageClass || 'STANDARD',
        storageClass: metadata.storageClass || 'STANDARD',
        encrypted: metadata.encryption?.defaultKmsKeyName ? true : false,
        uniformBucketLevelAccess:
          metadata.iamConfiguration?.uniformBucketLevelAccess?.enabled || false,
        versioning: metadata.versioning?.enabled,
      };

      buckets.push(resource);
    }

    // Apply filters
    let filteredBuckets = buckets;

    if (filters?.regions && filters.regions.length > 0) {
      filteredBuckets = filteredBuckets.filter((bucket) =>
        filters.regions!.includes(bucket.region)
      );
    }

    if (filters?.tags) {
      filteredBuckets = filteredBuckets.filter((bucket) => {
        if (!bucket.tags) return false;
        return Object.entries(filters.tags!).every(
          ([key, value]) => bucket.tags![key] === value
        );
      });
    }

    return filteredBuckets;
  } catch (error) {
    throw new Error(
      `Failed to discover Cloud Storage buckets: ${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Ensure Cloud Storage API is enabled\n` +
        `2. Verify credentials have 'storage.buckets.list' permission\n` +
        `3. Check that the project ID is correct: ${gcpConfig.projectId}`
    );
  }
}

/**
 * Discover Cloud SQL instances
 */
export async function discoverCloudSQLInstances(
  gcpConfig: GCPClientConfig,
  filters?: InventoryFilters
): Promise<GCPCloudSQLInstance[]> {
  showSpinner('Discovering Cloud SQL instances');

  const sql = new SQLAdminClient({
    auth: gcpConfig.auth as any,
  });

  const instances: GCPCloudSQLInstance[] = [];

  try {
    const [sqlInstances] = await sql.listInstances({
      project: gcpConfig.projectId,
    });

    for (const instance of sqlInstances) {
      // Extract labels as tags
      const labels = instance.settings?.userLabels || {};
      const tags: Record<string, string> = {};
      Object.keys(labels).forEach((key) => {
        tags[key] = String(labels[key]);
      });

      const resource: GCPCloudSQLInstance = {
        id: instance.name || '',
        name: instance.name || '',
        state: instance.state || 'UNKNOWN',
        region: instance.region || 'unknown',
        tags,
        createdAt: instance.createTime ? new Date(instance.createTime) : new Date(),
        provider: CloudProvider.GOOGLE_CLOUD,
        engine: instance.databaseVersion?.split('_')[0] || 'unknown',
        version: instance.databaseVersion || 'unknown',
        databaseVersion: instance.databaseVersion || 'unknown',
        instanceClass: instance.settings?.tier,
        tier: instance.settings?.tier || 'unknown',
        storageGB: instance.settings?.dataDiskSizeGb
          ? Number(instance.settings.dataDiskSizeGb)
          : undefined,
        multiAZ: instance.settings?.availabilityType === 'REGIONAL',
        availabilityType: instance.settings?.availabilityType || 'ZONAL',
        backupConfiguration: {
          enabled: instance.settings?.backupConfiguration?.enabled || false,
          startTime: instance.settings?.backupConfiguration?.startTime,
        },
        ipAddresses: instance.ipAddresses?.map((ip) => ({
          type: ip.type || 'UNKNOWN',
          ipAddress: ip.ipAddress || '',
        })),
      };

      instances.push(resource);
    }

    // Apply filters
    let filteredInstances = instances;

    if (filters?.regions && filters.regions.length > 0) {
      filteredInstances = filteredInstances.filter((instance) =>
        filters.regions!.includes(instance.region)
      );
    }

    if (filters?.tags) {
      filteredInstances = filteredInstances.filter((instance) => {
        if (!instance.tags) return false;
        return Object.entries(filters.tags!).every(
          ([key, value]) => instance.tags![key] === value
        );
      });
    }

    if (!filters?.includeDeleted) {
      filteredInstances = filteredInstances.filter(
        (instance) =>
          instance.state !== 'FAILED' &&
          instance.state !== 'SUSPENDED' &&
          instance.state !== 'UNKNOWN_STATE'
      );
    }

    return filteredInstances;
  } catch (error) {
    throw new Error(
      `Failed to discover Cloud SQL instances: ${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Ensure Cloud SQL Admin API is enabled\n` +
        `2. Verify credentials have 'cloudsql.instances.list' permission\n` +
        `3. Check that the project ID is correct: ${gcpConfig.projectId}`
    );
  }
}

/**
 * Discover Google Kubernetes Engine (GKE) clusters
 */
export async function discoverGKEClusters(
  gcpConfig: GCPClientConfig,
  filters?: InventoryFilters
): Promise<GCPGKECluster[]> {
  showSpinner('Discovering GKE clusters');

  const container = new ClusterManagerClient({
    auth: gcpConfig.auth as any,
  });

  const clusters: GCPGKECluster[] = [];

  try {
    // List clusters across all locations (zones and regions)
    const parent = `projects/${gcpConfig.projectId}/locations/-`;
    const [response] = await container.listClusters({ parent });

    for (const cluster of response.clusters || []) {
      // Extract labels as tags
      const labels = cluster.resourceLabels || {};
      const tags: Record<string, string> = {};
      Object.keys(labels).forEach((key) => {
        tags[key] = String(labels[key]);
      });

      // Calculate total node count from node pools
      let totalNodeCount = 0;
      const nodePools = cluster.nodePools?.map((pool) => {
        const poolNodeCount = pool.initialNodeCount || 0;
        totalNodeCount += poolNodeCount;

        return {
          name: pool.name || '',
          version: pool.version || '',
          config: {
            machineType: pool.config?.machineType || 'unknown',
            diskSizeGb: pool.config?.diskSizeGb || 0,
          },
          initialNodeCount: poolNodeCount,
        };
      });

      const location = cluster.location || cluster.zone || 'unknown';

      const resource: GCPGKECluster = {
        id: cluster.id || cluster.name || '',
        name: cluster.name || '',
        state: cluster.status || 'UNKNOWN',
        region: location,
        tags,
        createdAt: cluster.createTime ? new Date(cluster.createTime) : new Date(),
        provider: CloudProvider.GOOGLE_CLOUD,
        status: cluster.status || 'UNKNOWN',
        location,
        nodeCount: totalNodeCount,
        currentNodeCount: cluster.currentNodeCount,
        masterVersion: cluster.currentMasterVersion || 'unknown',
        nodePools,
        endpoint: cluster.endpoint,
        clusterIpv4Cidr: cluster.clusterIpv4Cidr,
      };

      clusters.push(resource);
    }

    // Apply filters
    let filteredClusters = clusters;

    if (filters?.regions && filters.regions.length > 0) {
      filteredClusters = filteredClusters.filter((cluster) =>
        filters.regions!.includes(cluster.region)
      );
    }

    if (filters?.tags) {
      filteredClusters = filteredClusters.filter((cluster) => {
        if (!cluster.tags) return false;
        return Object.entries(filters.tags!).every(
          ([key, value]) => cluster.tags![key] === value
        );
      });
    }

    if (!filters?.includeDeleted) {
      filteredClusters = filteredClusters.filter(
        (cluster) =>
          cluster.state !== 'ERROR' &&
          cluster.state !== 'DEGRADED' &&
          cluster.state !== 'STOPPING'
      );
    }

    return filteredClusters;
  } catch (error) {
    throw new Error(
      `Failed to discover GKE clusters: ${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Ensure Kubernetes Engine API is enabled\n` +
        `2. Verify credentials have 'container.clusters.list' permission\n` +
        `3. Check that the project ID is correct: ${gcpConfig.projectId}`
    );
  }
}

/**
 * Calculate total size of a storage bucket (expensive operation)
 */
export async function calculateBucketSize(
  gcpConfig: GCPClientConfig,
  bucketName: string
): Promise<number> {
  const storage = new Storage({
    projectId: gcpConfig.projectId,
    auth: gcpConfig.auth as any,
  });

  try {
    const bucket = storage.bucket(bucketName);
    const [files] = await bucket.getFiles();

    let totalSizeBytes = 0;
    for (const file of files) {
      const [metadata] = await file.getMetadata();
      totalSizeBytes += parseInt(metadata.size || '0', 10);
    }

    return totalSizeBytes / (1024 * 1024 * 1024); // Convert to GB
  } catch (error) {
    console.warn(`Failed to calculate size for bucket ${bucketName}: ${error.message}`);
    return 0;
  }
}
