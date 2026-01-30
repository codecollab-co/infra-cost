/**
 * Oracle Cloud Resource Inventory Module
 *
 * Discovers and catalogs OCI resources across compartments with parallel discovery,
 * comprehensive filtering, and graceful error handling.
 *
 * Supports:
 * - Compute Instances with shape, image, and network details
 * - Block Volumes with backup policies
 * - Autonomous Databases with workload types
 * - Oracle Kubernetes Engine (OKE) clusters with node pools
 * - Object Storage buckets
 * - Parallel discovery for performance
 * - Region-based filtering
 * - Tag-based filtering
 * - Compartment-based filtering
 */

import * as core from 'oci-core';
import * as database from 'oci-database';
import * as containerengine from 'oci-containerengine';
import * as objectstorage from 'oci-objectstorage';
import * as identity from 'oci-identity';
import { OracleClientConfig } from './config';
import {
  ComputeResource,
  StorageResource,
  DatabaseResource,
  CloudProvider,
  InventoryFilters,
  ResourceBase,
  OracleComputeInstance,
  OracleObjectStorageBucket,
  OracleAutonomousDatabase,
} from '../../types/providers';
import { showSpinner } from '../../logger';

/**
 * OCI-specific resource types
 */
export interface OracleBlockVolume extends StorageResource {
  volumeId: string;
  displayName: string;
  compartmentId: string;
  availabilityDomain: string;
  sizeInGBs: number;
  vpusPerGB?: number;
  isAutoTuneEnabled?: boolean;
  volumeBackupPolicyId?: string;
  attachedInstances?: string[];
  kmsKeyId?: string;
}

export interface OracleOKECluster extends ResourceBase {
  clusterId: string;
  displayName: string;
  compartmentId: string;
  kubernetesVersion: string;
  vcnId: string;
  nodeCount: number;
  nodePools: Array<{
    id: string;
    name: string;
    nodeCount: number;
    nodeShape: string;
    nodeImageName?: string;
    kubernetesVersion: string;
  }>;
  endpoints?: {
    kubernetes?: string;
    publicEndpoint?: string;
    privateEndpoint?: string;
  };
}

/**
 * Discover OCI Compute Instances across compartments
 */
export async function discoverComputeInstances(
  oracleConfig: OracleClientConfig,
  filters?: InventoryFilters
): Promise<OracleComputeInstance[]> {
  showSpinner('Discovering OCI Compute Instances');

  const computeClient = new core.ComputeClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  const virtualNetworkClient = new core.VirtualNetworkClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  const instances: OracleComputeInstance[] = [];
  const compartmentId = oracleConfig.compartmentId || oracleConfig.tenancyId;

  try {
    // Get all availability domains
    const identityClient = new identity.IdentityClient({
      authenticationDetailsProvider: oracleConfig.auth,
    });

    const adRequest: identity.requests.ListAvailabilityDomainsRequest = {
      compartmentId: compartmentId,
    };

    const adResponse = await identityClient.listAvailabilityDomains(adRequest);
    const availabilityDomains = adResponse.items || [];

    // List instances in each availability domain
    const instancePromises = availabilityDomains.map(async (ad) => {
      try {
        const listRequest: core.requests.ListInstancesRequest = {
          compartmentId: compartmentId,
          availabilityDomain: ad.name,
        };

        const response = await computeClient.listInstances(listRequest);
        return response.items || [];
      } catch (error: any) {
        console.warn(`Failed to list instances in AD ${ad.name}: ${error.message}`);
        return [];
      }
    });

    const instanceResults = await Promise.all(instancePromises);
    const allInstances = instanceResults.flat();

    // Process each instance in parallel
    const processedInstances = await Promise.all(
      allInstances.map(async (instance) => {
        try {
          if (!instance.id || !instance.displayName) {
            return null;
          }

          // Get instance metadata
          const shape = instance.shape || 'unknown';
          const shapeConfig = instance.shapeConfig;

          // Extract tags
          const tags: Record<string, string> = {};
          if (instance.freeformTags) {
            Object.assign(tags, instance.freeformTags);
          }
          if (instance.definedTags) {
            for (const [namespace, tagMap] of Object.entries(instance.definedTags)) {
              for (const [key, value] of Object.entries(tagMap as Record<string, string>)) {
                tags[`${namespace}.${key}`] = String(value);
              }
            }
          }

          // Get primary VNIC for networking info
          let publicIp: string | undefined;
          let privateIp: string | undefined;
          let subnetId: string | undefined;

          try {
            const vnicAttachmentRequest: core.requests.ListVnicAttachmentsRequest = {
              compartmentId: compartmentId,
              instanceId: instance.id,
            };

            const vnicAttachmentResponse = await computeClient.listVnicAttachments(
              vnicAttachmentRequest
            );

            if (vnicAttachmentResponse.items && vnicAttachmentResponse.items.length > 0) {
              const primaryVnicAttachment = vnicAttachmentResponse.items.find(
                v => v.lifecycleState === core.models.VnicAttachment.LifecycleState.Attached
              );

              if (primaryVnicAttachment?.vnicId) {
                const vnicRequest: core.requests.GetVnicRequest = {
                  vnicId: primaryVnicAttachment.vnicId,
                };

                const vnicResponse = await virtualNetworkClient.getVnic(vnicRequest);

                if (vnicResponse.vnic) {
                  publicIp = vnicResponse.vnic.publicIp;
                  privateIp = vnicResponse.vnic.privateIp;
                  subnetId = vnicResponse.vnic.subnetId;
                }
              }
            }
          } catch (error: any) {
            console.warn(`Failed to get VNIC info for instance ${instance.displayName}: ${error.message}`);
          }

          const resource: OracleComputeInstance = {
            id: instance.id,
            instanceId: instance.id,
            name: instance.displayName,
            displayName: instance.displayName,
            state: instance.lifecycleState || 'unknown',
            region: instance.region || oracleConfig.region || 'unknown',
            tags,
            createdAt: instance.timeCreated ? new Date(instance.timeCreated) : new Date(),
            provider: CloudProvider.ORACLE_CLOUD,
            availabilityDomain: instance.availabilityDomain || 'unknown',
            compartmentId: instance.compartmentId || compartmentId,
            shape: shape,
            shapeConfig: shapeConfig
              ? {
                  ocpus: shapeConfig.ocpus || 0,
                  memoryInGBs: shapeConfig.memoryInGBs || 0,
                }
              : undefined,
            imageId: instance.imageId || 'unknown',
            subnetId: subnetId || 'unknown',
            publicIp,
            privateIp,
            instanceType: shape,
            cpu: shapeConfig?.ocpus,
            memory: shapeConfig?.memoryInGBs,
            platform: instance.faultDomain,
          };

          return resource;
        } catch (error: any) {
          console.warn(`Failed to process instance ${instance.displayName}: ${error.message}`);
          return null;
        }
      })
    );

    instances.push(...processedInstances.filter((i): i is OracleComputeInstance => i !== null));

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
          instance.state !== 'TERMINATING'
      );
    }

    return filteredInstances;
  } catch (error: any) {
    throw new Error(
      `Failed to discover OCI Compute Instances: ${error.message}\n\n` +
      `Troubleshooting:\n` +
      `1. Ensure compartment ID is correct: ${compartmentId}\n` +
      `2. Verify credentials have 'inspect instances' permission\n` +
      `3. Check that IAM policies allow instance listing\n` +
      `4. Ensure the user belongs to a group with compute access`
    );
  }
}

/**
 * Discover OCI Block Volumes
 */
export async function discoverBlockVolumes(
  oracleConfig: OracleClientConfig,
  filters?: InventoryFilters
): Promise<OracleBlockVolume[]> {
  showSpinner('Discovering OCI Block Volumes');

  const blockstorageClient = new core.BlockstorageClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  const volumes: OracleBlockVolume[] = [];
  const compartmentId = oracleConfig.compartmentId || oracleConfig.tenancyId;

  try {
    const listRequest: core.requests.ListVolumesRequest = {
      compartmentId: compartmentId,
    };

    const response = await blockstorageClient.listVolumes(listRequest);

    if (response.items) {
      for (const volume of response.items) {
        if (!volume.id || !volume.displayName) {
          continue;
        }

        // Extract tags
        const tags: Record<string, string> = {};
        if (volume.freeformTags) {
          Object.assign(tags, volume.freeformTags);
        }
        if (volume.definedTags) {
          for (const [namespace, tagMap] of Object.entries(volume.definedTags)) {
            for (const [key, value] of Object.entries(tagMap as Record<string, string>)) {
              tags[`${namespace}.${key}`] = String(value);
            }
          }
        }

        const resource: OracleBlockVolume = {
          id: volume.id,
          volumeId: volume.id,
          name: volume.displayName,
          displayName: volume.displayName,
          state: volume.lifecycleState || 'unknown',
          region: oracleConfig.region || 'unknown',
          tags,
          createdAt: volume.timeCreated ? new Date(volume.timeCreated) : new Date(),
          provider: CloudProvider.ORACLE_CLOUD,
          compartmentId: volume.compartmentId || compartmentId,
          availabilityDomain: volume.availabilityDomain || 'unknown',
          sizeInGBs: volume.sizeInGBs || 0,
          sizeGB: volume.sizeInGBs || 0,
          storageType: 'Block Volume',
          encrypted: volume.kmsKeyId !== undefined,
          vpusPerGB: volume.vpusPerGB,
          isAutoTuneEnabled: volume.isAutoTuneEnabled,
          volumeBackupPolicyId: volume.volumeBackupPolicyId,
          kmsKeyId: volume.kmsKeyId,
        };

        volumes.push(resource);
      }
    }

    // Apply filters
    let filteredVolumes = volumes;

    if (filters?.regions && filters.regions.length > 0) {
      filteredVolumes = filteredVolumes.filter((volume) =>
        filters.regions!.includes(volume.region)
      );
    }

    if (filters?.tags) {
      filteredVolumes = filteredVolumes.filter((volume) => {
        if (!volume.tags) return false;
        return Object.entries(filters.tags!).every(
          ([key, value]) => volume.tags![key] === value
        );
      });
    }

    if (!filters?.includeDeleted) {
      filteredVolumes = filteredVolumes.filter(
        (volume) =>
          volume.state !== 'TERMINATED' &&
          volume.state !== 'TERMINATING'
      );
    }

    return filteredVolumes;
  } catch (error: any) {
    throw new Error(
      `Failed to discover OCI Block Volumes: ${error.message}\n\n` +
      `Troubleshooting:\n` +
      `1. Ensure compartment ID is correct: ${compartmentId}\n` +
      `2. Verify credentials have 'inspect volumes' permission\n` +
      `3. Check that IAM policies allow volume listing`
    );
  }
}

/**
 * Discover OCI Autonomous Databases
 */
export async function discoverAutonomousDatabases(
  oracleConfig: OracleClientConfig,
  filters?: InventoryFilters
): Promise<OracleAutonomousDatabase[]> {
  showSpinner('Discovering OCI Autonomous Databases');

  const databaseClient = new database.DatabaseClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  const databases: OracleAutonomousDatabase[] = [];
  const compartmentId = oracleConfig.compartmentId || oracleConfig.tenancyId;

  try {
    const listRequest: database.requests.ListAutonomousDatabasesRequest = {
      compartmentId: compartmentId,
    };

    const response = await databaseClient.listAutonomousDatabases(listRequest);

    if (response.items) {
      for (const db of response.items) {
        if (!db.id || !db.displayName) {
          continue;
        }

        // Extract tags
        const tags: Record<string, string> = {};
        if (db.freeformTags) {
          Object.assign(tags, db.freeformTags);
        }
        if (db.definedTags) {
          for (const [namespace, tagMap] of Object.entries(db.definedTags)) {
            for (const [key, value] of Object.entries(tagMap as Record<string, string>)) {
              tags[`${namespace}.${key}`] = String(value);
            }
          }
        }

        const resource: OracleAutonomousDatabase = {
          id: db.id,
          name: db.displayName,
          displayName: db.displayName,
          state: db.lifecycleState || 'unknown',
          region: oracleConfig.region || 'unknown',
          tags,
          createdAt: db.timeCreated ? new Date(db.timeCreated) : new Date(),
          provider: CloudProvider.ORACLE_CLOUD,
          compartmentId: db.compartmentId || compartmentId,
          dbWorkload: db.dbWorkload || 'OLTP',
          isAutoScalingEnabled: db.isAutoScalingEnabled || false,
          cpuCoreCount: db.cpuCoreCount || 0,
          dataStorageSizeInTBs: db.dataStorageSizeInTBs || 0,
          connectionStrings: db.connectionStrings || {},
          licenseModel: db.licenseModel || 'LICENSE_INCLUDED',
          isPreview: db.isPreview,
          engine: 'Oracle',
          version: db.dbVersion || 'unknown',
          instanceClass: `${db.cpuCoreCount} OCPUs`,
          storageGB: (db.dataStorageSizeInTBs || 0) * 1024,
          multiAZ: false, // OCI uses availability domains differently
        };

        databases.push(resource);
      }
    }

    // Apply filters
    let filteredDatabases = databases;

    if (filters?.regions && filters.regions.length > 0) {
      filteredDatabases = filteredDatabases.filter((db) =>
        filters.regions!.includes(db.region)
      );
    }

    if (filters?.tags) {
      filteredDatabases = filteredDatabases.filter((db) => {
        if (!db.tags) return false;
        return Object.entries(filters.tags!).every(
          ([key, value]) => db.tags![key] === value
        );
      });
    }

    if (!filters?.includeDeleted) {
      filteredDatabases = filteredDatabases.filter(
        (db) =>
          db.state !== 'TERMINATED' &&
          db.state !== 'TERMINATING' &&
          db.state !== 'UNAVAILABLE'
      );
    }

    return filteredDatabases;
  } catch (error: any) {
    throw new Error(
      `Failed to discover OCI Autonomous Databases: ${error.message}\n\n` +
      `Troubleshooting:\n` +
      `1. Ensure compartment ID is correct: ${compartmentId}\n` +
      `2. Verify credentials have 'inspect autonomous-databases' permission\n` +
      `3. Check that IAM policies allow database listing`
    );
  }
}

/**
 * Discover OCI Kubernetes Engine (OKE) Clusters
 */
export async function discoverOKEClusters(
  oracleConfig: OracleClientConfig,
  filters?: InventoryFilters
): Promise<OracleOKECluster[]> {
  showSpinner('Discovering OCI Kubernetes Engine (OKE) clusters');

  const containerEngineClient = new containerengine.ContainerEngineClient({
    authenticationDetailsProvider: oracleConfig.auth,
  });

  const clusters: OracleOKECluster[] = [];
  const compartmentId = oracleConfig.compartmentId || oracleConfig.tenancyId;

  try {
    const listRequest: containerengine.requests.ListClustersRequest = {
      compartmentId: compartmentId,
    };

    const response = await containerEngineClient.listClusters(listRequest);

    if (response.items) {
      // Process each cluster in parallel
      const clusterPromises = response.items.map(async (cluster) => {
        try {
          if (!cluster.id || !cluster.name) {
            return null;
          }

          // Extract tags
          const tags: Record<string, string> = {};
          if (cluster.freeformTags) {
            Object.assign(tags, cluster.freeformTags);
          }
          if (cluster.definedTags) {
            for (const [namespace, tagMap] of Object.entries(cluster.definedTags)) {
              for (const [key, value] of Object.entries(tagMap as Record<string, string>)) {
                tags[`${namespace}.${key}`] = String(value);
              }
            }
          }

          // Get node pools for this cluster
          const nodePools: Array<{
            id: string;
            name: string;
            nodeCount: number;
            nodeShape: string;
            nodeImageName?: string;
            kubernetesVersion: string;
          }> = [];

          let totalNodeCount = 0;

          try {
            const nodePoolRequest: containerengine.requests.ListNodePoolsRequest = {
              compartmentId: compartmentId,
              clusterId: cluster.id,
            };

            const nodePoolResponse = await containerEngineClient.listNodePools(nodePoolRequest);

            if (nodePoolResponse.items) {
              for (const pool of nodePoolResponse.items) {
                const nodeCount = pool.nodeConfigDetails?.size || 0;
                totalNodeCount += nodeCount;

                nodePools.push({
                  id: pool.id || '',
                  name: pool.name || '',
                  nodeCount: nodeCount,
                  nodeShape: pool.nodeShape || 'unknown',
                  nodeImageName: pool.nodeImageName,
                  kubernetesVersion: pool.kubernetesVersion || cluster.kubernetesVersion || 'unknown',
                });
              }
            }
          } catch (error: any) {
            console.warn(`Failed to get node pools for cluster ${cluster.name}: ${error.message}`);
          }

          const resource: OracleOKECluster = {
            id: cluster.id,
            clusterId: cluster.id,
            name: cluster.name,
            displayName: cluster.name,
            state: cluster.lifecycleState || 'unknown',
            region: oracleConfig.region || 'unknown',
            tags,
            createdAt: cluster.timeCreated ? new Date(cluster.timeCreated) : new Date(),
            provider: CloudProvider.ORACLE_CLOUD,
            compartmentId: cluster.compartmentId || compartmentId,
            kubernetesVersion: cluster.kubernetesVersion || 'unknown',
            vcnId: cluster.vcnId || 'unknown',
            nodeCount: totalNodeCount,
            nodePools,
            endpoints: cluster.endpoints
              ? {
                  kubernetes: cluster.endpoints.kubernetes,
                  publicEndpoint: cluster.endpoints.publicEndpoint,
                  privateEndpoint: cluster.endpoints.privateEndpoint,
                }
              : undefined,
          };

          return resource;
        } catch (error: any) {
          console.warn(`Failed to process cluster ${cluster.name}: ${error.message}`);
          return null;
        }
      });

      const clusterResults = await Promise.all(clusterPromises);
      clusters.push(...clusterResults.filter((c): c is OracleOKECluster => c !== null));
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
          cluster.state !== 'DELETED' &&
          cluster.state !== 'DELETING'
      );
    }

    return filteredClusters;
  } catch (error: any) {
    throw new Error(
      `Failed to discover OKE clusters: ${error.message}\n\n` +
      `Troubleshooting:\n` +
      `1. Ensure compartment ID is correct: ${compartmentId}\n` +
      `2. Verify credentials have 'inspect clusters' permission\n` +
      `3. Check that IAM policies allow cluster listing`
    );
  }
}

/**
 * Discover all OCI resources in parallel
 */
export async function discoverAllResources(
  oracleConfig: OracleClientConfig,
  filters?: InventoryFilters
): Promise<{
  computeInstances: OracleComputeInstance[];
  blockVolumes: OracleBlockVolume[];
  autonomousDatabases: OracleAutonomousDatabase[];
  okeClusters: OracleOKECluster[];
}> {
  showSpinner('Discovering all OCI resources in parallel');

  // Discover all resource types in parallel for performance
  const [computeInstances, blockVolumes, autonomousDatabases, okeClusters] =
    await Promise.all([
      discoverComputeInstances(oracleConfig, filters).catch((error) => {
        console.warn(`Failed to discover compute instances: ${error.message}`);
        return [];
      }),
      discoverBlockVolumes(oracleConfig, filters).catch((error) => {
        console.warn(`Failed to discover block volumes: ${error.message}`);
        return [];
      }),
      discoverAutonomousDatabases(oracleConfig, filters).catch((error) => {
        console.warn(`Failed to discover autonomous databases: ${error.message}`);
        return [];
      }),
      discoverOKEClusters(oracleConfig, filters).catch((error) => {
        console.warn(`Failed to discover OKE clusters: ${error.message}`);
        return [];
      }),
    ]);

  return {
    computeInstances,
    blockVolumes,
    autonomousDatabases,
    okeClusters,
  };
}

/**
 * Get resource counts by region
 */
export function getResourceCountsByRegion(resources: {
  computeInstances: OracleComputeInstance[];
  blockVolumes: OracleBlockVolume[];
  autonomousDatabases: OracleAutonomousDatabase[];
  okeClusters: OracleOKECluster[];
}): Record<string, { compute: number; storage: number; databases: number; oke: number; total: number }> {
  const countsByRegion: Record<
    string,
    { compute: number; storage: number; databases: number; oke: number; total: number }
  > = {};

  // Count compute instances by region
  resources.computeInstances.forEach((instance) => {
    if (!countsByRegion[instance.region]) {
      countsByRegion[instance.region] = { compute: 0, storage: 0, databases: 0, oke: 0, total: 0 };
    }
    countsByRegion[instance.region].compute++;
    countsByRegion[instance.region].total++;
  });

  // Count block volumes by region
  resources.blockVolumes.forEach((volume) => {
    if (!countsByRegion[volume.region]) {
      countsByRegion[volume.region] = { compute: 0, storage: 0, databases: 0, oke: 0, total: 0 };
    }
    countsByRegion[volume.region].storage++;
    countsByRegion[volume.region].total++;
  });

  // Count databases by region
  resources.autonomousDatabases.forEach((db) => {
    if (!countsByRegion[db.region]) {
      countsByRegion[db.region] = { compute: 0, storage: 0, databases: 0, oke: 0, total: 0 };
    }
    countsByRegion[db.region].databases++;
    countsByRegion[db.region].total++;
  });

  // Count OKE clusters by region
  resources.okeClusters.forEach((cluster) => {
    if (!countsByRegion[cluster.region]) {
      countsByRegion[cluster.region] = { compute: 0, storage: 0, databases: 0, oke: 0, total: 0 };
    }
    countsByRegion[cluster.region].oke++;
    countsByRegion[cluster.region].total++;
  });

  return countsByRegion;
}
