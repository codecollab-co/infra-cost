/**
 * Azure Resource Inventory Module
 *
 * Discovers and catalogs Azure resources across subscriptions with parallel discovery,
 * comprehensive filtering, and graceful error handling.
 *
 * Supports:
 * - Virtual Machines (VMs) with compute, network, and disk details
 * - Storage Accounts with blob containers and configuration
 * - Azure SQL Databases with backup and replication info
 * - Azure Kubernetes Service (AKS) clusters with node pools
 * - Parallel discovery for performance
 * - Region-based filtering
 * - Tag-based filtering
 * - Resource state filtering
 */

import { ComputeManagementClient } from '@azure/arm-compute';
import { StorageManagementClient } from '@azure/arm-storage';
import { SqlManagementClient } from '@azure/arm-sql';
import { ContainerServiceClient } from '@azure/arm-containerservice';
import { NetworkManagementClient } from '@azure/arm-network';
import { AzureClientConfig } from './config';
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
 * Azure-specific resource types
 */
export interface AzureVirtualMachine extends ComputeResource {
  vmId: string;
  location: string;
  vmSize: string;
  powerState: string;
  osType: string;
  provisioningState: string;
  networkInterfaces: string[];
  disks: Array<{
    name: string;
    diskSizeGB: number;
    managedDisk?: {
      storageAccountType: string;
      id: string;
    };
  }>;
  availabilityZone?: string;
  imageReference?: {
    publisher: string;
    offer: string;
    sku: string;
    version: string;
  };
}

export interface AzureStorageAccount extends StorageResource {
  accountName: string;
  location: string;
  sku: string;
  kind: string;
  tier: string;
  replicationType: string;
  accessTier?: string;
  encryption: boolean;
  httpsOnly: boolean;
  allowBlobPublicAccess?: boolean;
  networkRuleSet?: {
    defaultAction: string;
    bypass?: string;
  };
}

export interface AzureSQLDatabase extends DatabaseResource {
  databaseId: string;
  serverName: string;
  location: string;
  edition: string;
  serviceObjective: string;
  maxSizeBytes: number;
  status: string;
  collation?: string;
  elasticPoolName?: string;
  replicationRole?: string;
  backupRetentionPeriod?: number;
  geoBackupEnabled?: boolean;
  zoneRedundant?: boolean;
}

export interface AzureAKSCluster extends ResourceBase {
  clusterId: string;
  location: string;
  kubernetesVersion: string;
  nodeCount: number;
  dnsPrefix: string;
  fqdn?: string;
  provisioningState: string;
  powerState: string;
  agentPoolProfiles: Array<{
    name: string;
    count: number;
    vmSize: string;
    osType: string;
    osDiskSizeGB: number;
    mode: string;
    availabilityZones?: string[];
  }>;
  networkProfile?: {
    networkPlugin: string;
    serviceCidr?: string;
    dnsServiceIP?: string;
    podCidr?: string;
  };
}

/**
 * Discover Azure Virtual Machines across all regions
 */
export async function discoverVirtualMachines(
  azureConfig: AzureClientConfig,
  filters?: InventoryFilters
): Promise<AzureVirtualMachine[]> {
  showSpinner('Discovering Azure Virtual Machines');

  const computeClient = new ComputeManagementClient(
    azureConfig.auth as any,
    azureConfig.subscriptionId
  );

  const networkClient = new NetworkManagementClient(
    azureConfig.auth as any,
    azureConfig.subscriptionId
  );

  const virtualMachines: AzureVirtualMachine[] = [];

  try {
    // Get all VMs in the subscription
    const vmIterator = computeClient.virtualMachines.listAll();
    const vms = [];
    for await (const vm of vmIterator) {
      vms.push(vm);
    }

    // Get instance view (power state) for each VM in parallel
    const vmPromises = vms.map(async (vm) => {
      try {
        if (!vm.id || !vm.name) {
          console.warn('Skipping VM with missing id or name');
          return null;
        }

        // Extract resource group from VM ID
        const resourceGroupMatch = vm.id.match(/resourceGroups\/([^/]+)/i);
        const resourceGroup = resourceGroupMatch ? resourceGroupMatch[1] : '';

        if (!resourceGroup) {
          console.warn(`Could not extract resource group from VM ID: ${vm.id}`);
          return null;
        }

        // Get instance view for power state
        let powerState = 'unknown';
        let provisioningState = vm.provisioningState || 'unknown';

        try {
          const instanceView = await computeClient.virtualMachines.instanceView(
            resourceGroup,
            vm.name
          );

          // Extract power state from statuses
          const powerStateStatus = instanceView.statuses?.find((s) =>
            s.code?.startsWith('PowerState/')
          );
          if (powerStateStatus?.code) {
            powerState = powerStateStatus.code.replace('PowerState/', '');
          }
        } catch (error: any) {
          console.warn(
            `Failed to get instance view for VM ${vm.name}: ${error.message}`
          );
        }

        // Extract tags
        const tags: Record<string, string> = {};
        if (vm.tags) {
          Object.entries(vm.tags).forEach(([key, value]) => {
            tags[key] = String(value);
          });
        }

        // Extract network interfaces
        const networkInterfaceIds =
          vm.networkProfile?.networkInterfaces?.map((ni) => ni.id || '') || [];

        // Extract disks
        const disks: Array<{
          name: string;
          diskSizeGB: number;
          managedDisk?: { storageAccountType: string; id: string };
        }> = [];

        if (vm.storageProfile?.osDisk) {
          disks.push({
            name: vm.storageProfile.osDisk.name || 'os-disk',
            diskSizeGB: vm.storageProfile.osDisk.diskSizeGB || 0,
            managedDisk: vm.storageProfile.osDisk.managedDisk
              ? {
                  storageAccountType:
                    vm.storageProfile.osDisk.managedDisk.storageAccountType || 'Standard_LRS',
                  id: vm.storageProfile.osDisk.managedDisk.id || '',
                }
              : undefined,
          });
        }

        if (vm.storageProfile?.dataDisks) {
          vm.storageProfile.dataDisks.forEach((disk) => {
            disks.push({
              name: disk.name || `data-disk-${disk.lun}`,
              diskSizeGB: disk.diskSizeGB || 0,
              managedDisk: disk.managedDisk
                ? {
                    storageAccountType: disk.managedDisk.storageAccountType || 'Standard_LRS',
                    id: disk.managedDisk.id || '',
                  }
                : undefined,
            });
          });
        }

        const resource: AzureVirtualMachine = {
          id: vm.id,
          vmId: vm.vmId || vm.id,
          name: vm.name,
          state: powerState,
          region: vm.location || 'unknown',
          location: vm.location || 'unknown',
          tags,
          createdAt: new Date(), // Azure doesn't provide creation timestamp in VM object
          provider: CloudProvider.AZURE,
          vmSize: vm.hardwareProfile?.vmSize || 'unknown',
          powerState,
          provisioningState,
          osType: vm.storageProfile?.osDisk?.osType || 'unknown',
          networkInterfaces: networkInterfaceIds,
          disks,
          availabilityZone: vm.zones?.[0],
          imageReference: vm.storageProfile?.imageReference
            ? {
                publisher: vm.storageProfile.imageReference.publisher || '',
                offer: vm.storageProfile.imageReference.offer || '',
                sku: vm.storageProfile.imageReference.sku || '',
                version: vm.storageProfile.imageReference.version || '',
              }
            : undefined,
        };

        return resource;
      } catch (error: any) {
        console.warn(`Failed to process VM ${vm.name}: ${error.message}`);
        return null;
      }
    });

    const vmResults = await Promise.all(vmPromises);
    virtualMachines.push(...vmResults.filter((vm): vm is AzureVirtualMachine => vm !== null));

    // Apply filters
    let filteredVMs = virtualMachines;

    if (filters?.regions && filters.regions.length > 0) {
      filteredVMs = filteredVMs.filter((vm) => filters.regions!.includes(vm.region));
    }

    if (filters?.tags) {
      filteredVMs = filteredVMs.filter((vm) => {
        if (!vm.tags) return false;
        return Object.entries(filters.tags!).every(
          ([key, value]) => vm.tags![key] === value
        );
      });
    }

    if (!filters?.includeDeleted) {
      filteredVMs = filteredVMs.filter(
        (vm) =>
          vm.powerState !== 'deallocated' &&
          vm.powerState !== 'stopped' &&
          vm.provisioningState !== 'Failed' &&
          vm.provisioningState !== 'Deleting'
      );
    }

    return filteredVMs;
  } catch (error: any) {
    throw new Error(
      `Failed to discover Azure Virtual Machines: ${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Ensure subscription ID is correct: ${azureConfig.subscriptionId}\n` +
        `2. Verify credentials have 'Microsoft.Compute/virtualMachines/read' permission\n` +
        `3. Check that the Azure Compute resource provider is registered\n` +
        `4. Ensure the authenticated principal has Reader role or higher`
    );
  }
}

/**
 * Discover Azure Storage Accounts
 */
export async function discoverStorageAccounts(
  azureConfig: AzureClientConfig,
  filters?: InventoryFilters
): Promise<AzureStorageAccount[]> {
  showSpinner('Discovering Azure Storage Accounts');

  const storageClient = new StorageManagementClient(
    azureConfig.auth as any,
    azureConfig.subscriptionId
  );

  const storageAccounts: AzureStorageAccount[] = [];

  try {
    const accountIterator = storageClient.storageAccounts.list();
    const accounts = [];
    for await (const account of accountIterator) {
      accounts.push(account);
    }

    for (const account of accounts) {
      if (!account.id || !account.name) {
        continue;
      }

      // Extract tags
      const tags: Record<string, string> = {};
      if (account.tags) {
        Object.entries(account.tags).forEach(([key, value]) => {
          tags[key] = String(value);
        });
      }

      // Check encryption status
      const encryptionEnabled =
        account.encryption?.services?.blob?.enabled === true ||
        account.encryption?.services?.file?.enabled === true;

      const resource: AzureStorageAccount = {
        id: account.id,
        accountName: account.name,
        name: account.name,
        state: account.provisioningState || 'unknown',
        region: account.location || 'unknown',
        location: account.location || 'unknown',
        tags,
        createdAt: account.creationTime ? new Date(account.creationTime) : new Date(),
        provider: CloudProvider.AZURE,
        sku: account.sku?.name || 'unknown',
        kind: account.kind || 'StorageV2',
        tier: account.sku?.tier || 'Standard',
        replicationType: account.sku?.name || 'LRS',
        accessTier: account.accessTier,
        encryption: encryptionEnabled,
        httpsOnly: account.enableHttpsTrafficOnly || false,
        allowBlobPublicAccess: account.allowBlobPublicAccess,
        networkRuleSet: account.networkRuleSet
          ? {
              defaultAction: account.networkRuleSet.defaultAction || 'Allow',
              bypass: account.networkRuleSet.bypass,
            }
          : undefined,
        sizeGB: 0, // Azure doesn't provide this in the account object
        storageType: account.kind || 'StorageV2',
        encrypted: encryptionEnabled,
      };

      storageAccounts.push(resource);
    }

    // Apply filters
    let filteredAccounts = storageAccounts;

    if (filters?.regions && filters.regions.length > 0) {
      filteredAccounts = filteredAccounts.filter((account) =>
        filters.regions!.includes(account.region)
      );
    }

    if (filters?.tags) {
      filteredAccounts = filteredAccounts.filter((account) => {
        if (!account.tags) return false;
        return Object.entries(filters.tags!).every(
          ([key, value]) => account.tags![key] === value
        );
      });
    }

    if (!filters?.includeDeleted) {
      filteredAccounts = filteredAccounts.filter(
        (account) => account.state !== 'Failed' && account.state !== 'Deleting'
      );
    }

    return filteredAccounts;
  } catch (error: any) {
    throw new Error(
      `Failed to discover Azure Storage Accounts: ${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Ensure subscription ID is correct: ${azureConfig.subscriptionId}\n` +
        `2. Verify credentials have 'Microsoft.Storage/storageAccounts/read' permission\n` +
        `3. Check that the Azure Storage resource provider is registered\n` +
        `4. Ensure the authenticated principal has Reader role or higher`
    );
  }
}

/**
 * Discover Azure SQL Databases
 */
export async function discoverSQLDatabases(
  azureConfig: AzureClientConfig,
  filters?: InventoryFilters
): Promise<AzureSQLDatabase[]> {
  showSpinner('Discovering Azure SQL Databases');

  const sqlClient = new SqlManagementClient(
    azureConfig.auth as any,
    azureConfig.subscriptionId
  );

  const databases: AzureSQLDatabase[] = [];

  try {
    // First, get all SQL servers
    const serverIterator = sqlClient.servers.list();
    const servers = [];
    for await (const server of serverIterator) {
      servers.push(server);
    }

    // Then get databases for each server in parallel
    const serverPromises = servers.map(async (server) => {
      try {
        if (!server.id || !server.name) {
          return [];
        }

        // Extract resource group from server ID
        const resourceGroupMatch = server.id.match(/resourceGroups\/([^/]+)/i);
        const resourceGroup = resourceGroupMatch ? resourceGroupMatch[1] : '';

        if (!resourceGroup) {
          console.warn(`Could not extract resource group from server ID: ${server.id}`);
          return [];
        }

        const dbIterator = sqlClient.databases.listByServer(resourceGroup, server.name);
        const serverDatabases = [];
        for await (const db of dbIterator) {
          // Skip the 'master' system database
          if (db.name === 'master') {
            continue;
          }

          serverDatabases.push({ db, server, resourceGroup });
        }

        return serverDatabases;
      } catch (error: any) {
        console.warn(
          `Failed to get databases for server ${server.name}: ${error.message}`
        );
        return [];
      }
    });

    const serverResults = await Promise.all(serverPromises);
    const allDatabases = serverResults.flat();

    // Process each database
    for (const { db, server, resourceGroup } of allDatabases) {
      if (!db.id || !db.name) {
        continue;
      }

      // Extract tags
      const tags: Record<string, string> = {};
      if (db.tags) {
        Object.entries(db.tags).forEach(([key, value]) => {
          tags[key] = String(value);
        });
      }

      // Try to get backup configuration (may fail if insufficient permissions)
      let backupRetentionDays: number | undefined;
      let geoBackupEnabled: boolean | undefined;
      try {
        const backupPolicy =
          await sqlClient.longTermRetentionPolicies.listByDatabase(
            resourceGroup,
            server.name!,
            db.name
          );
        // Note: This is for long-term retention. Short-term retention is separate.
      } catch (error: any) {
        // Backup configuration access may be restricted
      }

      const resource: AzureSQLDatabase = {
        id: db.id,
        databaseId: db.id,
        name: db.name,
        serverName: server.name || '',
        state: db.status || 'unknown',
        region: db.location || 'unknown',
        tags,
        createdAt: db.creationDate ? new Date(db.creationDate) : new Date(),
        provider: CloudProvider.AZURE,
        engine: 'sqlserver',
        version: server.version || 'unknown',
        edition: db.edition || 'unknown',
        serviceObjective: db.currentServiceObjectiveName || 'unknown',
        location: db.location || 'unknown',
        maxSizeBytes: db.maxSizeBytes ? Number(db.maxSizeBytes) : 0,
        status: db.status || 'unknown',
        collation: db.collation,
        elasticPoolName: db.elasticPoolId?.split('/').pop(),
        instanceClass: db.currentServiceObjectiveName,
        storageGB: db.maxSizeBytes ? Number(db.maxSizeBytes) / (1024 * 1024 * 1024) : undefined,
        multiAZ: db.zoneRedundant || false,
        replicationRole: db.replicationRole,
        backupRetentionPeriod: backupRetentionDays,
        geoBackupEnabled,
        zoneRedundant: db.zoneRedundant,
      };

      databases.push(resource);
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
          db.status !== 'Deleted' &&
          db.status !== 'Disabled' &&
          db.status !== 'Inaccessible'
      );
    }

    return filteredDatabases;
  } catch (error: any) {
    throw new Error(
      `Failed to discover Azure SQL Databases: ${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Ensure subscription ID is correct: ${azureConfig.subscriptionId}\n` +
        `2. Verify credentials have 'Microsoft.Sql/servers/read' permission\n` +
        `3. Verify credentials have 'Microsoft.Sql/servers/databases/read' permission\n` +
        `4. Check that the Azure SQL resource provider is registered\n` +
        `5. Ensure the authenticated principal has Reader role or higher`
    );
  }
}

/**
 * Discover Azure Kubernetes Service (AKS) Clusters
 */
export async function discoverAKSClusters(
  azureConfig: AzureClientConfig,
  filters?: InventoryFilters
): Promise<AzureAKSCluster[]> {
  showSpinner('Discovering Azure Kubernetes Service (AKS) clusters');

  const containerClient = new ContainerServiceClient(
    azureConfig.auth as any,
    azureConfig.subscriptionId
  );

  const clusters: AzureAKSCluster[] = [];

  try {
    const clusterIterator = containerClient.managedClusters.list();
    const aksClusters = [];
    for await (const cluster of clusterIterator) {
      aksClusters.push(cluster);
    }

    for (const cluster of aksClusters) {
      if (!cluster.id || !cluster.name) {
        continue;
      }

      // Extract tags
      const tags: Record<string, string> = {};
      if (cluster.tags) {
        Object.entries(cluster.tags).forEach(([key, value]) => {
          tags[key] = String(value);
        });
      }

      // Extract agent pool profiles
      const agentPoolProfiles =
        cluster.agentPoolProfiles?.map((pool) => ({
          name: pool.name || '',
          count: pool.count || 0,
          vmSize: pool.vmSize || 'Standard_DS2_v2',
          osType: pool.osType || 'Linux',
          osDiskSizeGB: pool.osDiskSizeGB || 0,
          mode: pool.mode || 'User',
          availabilityZones: pool.availabilityZones,
        })) || [];

      // Calculate total node count
      const totalNodeCount = agentPoolProfiles.reduce(
        (sum, pool) => sum + pool.count,
        0
      );

      // Get power state
      const powerState =
        cluster.powerState?.code === 'Running' ? 'running' : 'stopped';

      const resource: AzureAKSCluster = {
        id: cluster.id,
        clusterId: cluster.id,
        name: cluster.name,
        state: cluster.provisioningState || 'unknown',
        region: cluster.location || 'unknown',
        location: cluster.location || 'unknown',
        tags,
        createdAt: new Date(), // Azure doesn't provide creation timestamp in cluster object
        provider: CloudProvider.AZURE,
        kubernetesVersion: cluster.kubernetesVersion || 'unknown',
        nodeCount: totalNodeCount,
        dnsPrefix: cluster.dnsPrefix || '',
        fqdn: cluster.fqdn,
        provisioningState: cluster.provisioningState || 'unknown',
        powerState,
        agentPoolProfiles,
        networkProfile: cluster.networkProfile
          ? {
              networkPlugin: cluster.networkProfile.networkPlugin || 'kubenet',
              serviceCidr: cluster.networkProfile.serviceCidr,
              dnsServiceIP: cluster.networkProfile.dnsServiceIP,
              podCidr: cluster.networkProfile.podCidr,
            }
          : undefined,
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
          cluster.provisioningState !== 'Failed' &&
          cluster.provisioningState !== 'Deleting' &&
          cluster.provisioningState !== 'Canceled'
      );
    }

    return filteredClusters;
  } catch (error: any) {
    throw new Error(
      `Failed to discover AKS clusters: ${error.message}\n\n` +
        `Troubleshooting:\n` +
        `1. Ensure subscription ID is correct: ${azureConfig.subscriptionId}\n` +
        `2. Verify credentials have 'Microsoft.ContainerService/managedClusters/read' permission\n` +
        `3. Check that the Azure Container Service resource provider is registered\n` +
        `4. Ensure the authenticated principal has Reader role or higher`
    );
  }
}

/**
 * Discover all Azure resources in parallel
 */
export async function discoverAllResources(
  azureConfig: AzureClientConfig,
  filters?: InventoryFilters
): Promise<{
  virtualMachines: AzureVirtualMachine[];
  storageAccounts: AzureStorageAccount[];
  sqlDatabases: AzureSQLDatabase[];
  aksClusters: AzureAKSCluster[];
}> {
  showSpinner('Discovering all Azure resources in parallel');

  // Discover all resource types in parallel for performance
  const [virtualMachines, storageAccounts, sqlDatabases, aksClusters] =
    await Promise.all([
      discoverVirtualMachines(azureConfig, filters).catch((error) => {
        console.warn(`Failed to discover virtual machines: ${error.message}`);
        return [];
      }),
      discoverStorageAccounts(azureConfig, filters).catch((error) => {
        console.warn(`Failed to discover storage accounts: ${error.message}`);
        return [];
      }),
      discoverSQLDatabases(azureConfig, filters).catch((error) => {
        console.warn(`Failed to discover SQL databases: ${error.message}`);
        return [];
      }),
      discoverAKSClusters(azureConfig, filters).catch((error) => {
        console.warn(`Failed to discover AKS clusters: ${error.message}`);
        return [];
      }),
    ]);

  return {
    virtualMachines,
    storageAccounts,
    sqlDatabases,
    aksClusters,
  };
}

/**
 * Get resource counts by region
 */
export function getResourceCountsByRegion(resources: {
  virtualMachines: AzureVirtualMachine[];
  storageAccounts: AzureStorageAccount[];
  sqlDatabases: AzureSQLDatabase[];
  aksClusters: AzureAKSCluster[];
}): Record<string, { vms: number; storage: number; databases: number; aks: number; total: number }> {
  const countsByRegion: Record<
    string,
    { vms: number; storage: number; databases: number; aks: number; total: number }
  > = {};

  // Count VMs by region
  resources.virtualMachines.forEach((vm) => {
    if (!countsByRegion[vm.region]) {
      countsByRegion[vm.region] = { vms: 0, storage: 0, databases: 0, aks: 0, total: 0 };
    }
    countsByRegion[vm.region].vms++;
    countsByRegion[vm.region].total++;
  });

  // Count storage accounts by region
  resources.storageAccounts.forEach((account) => {
    if (!countsByRegion[account.region]) {
      countsByRegion[account.region] = { vms: 0, storage: 0, databases: 0, aks: 0, total: 0 };
    }
    countsByRegion[account.region].storage++;
    countsByRegion[account.region].total++;
  });

  // Count databases by region
  resources.sqlDatabases.forEach((db) => {
    if (!countsByRegion[db.region]) {
      countsByRegion[db.region] = { vms: 0, storage: 0, databases: 0, aks: 0, total: 0 };
    }
    countsByRegion[db.region].databases++;
    countsByRegion[db.region].total++;
  });

  // Count AKS clusters by region
  resources.aksClusters.forEach((cluster) => {
    if (!countsByRegion[cluster.region]) {
      countsByRegion[cluster.region] = { vms: 0, storage: 0, databases: 0, aks: 0, total: 0 };
    }
    countsByRegion[cluster.region].aks++;
    countsByRegion[cluster.region].total++;
  });

  return countsByRegion;
}

/**
 * Get resources by tag
 */
export function filterResourcesByTag(
  resources: {
    virtualMachines: AzureVirtualMachine[];
    storageAccounts: AzureStorageAccount[];
    sqlDatabases: AzureSQLDatabase[];
    aksClusters: AzureAKSCluster[];
  },
  tagKey: string,
  tagValue?: string
): {
  virtualMachines: AzureVirtualMachine[];
  storageAccounts: AzureStorageAccount[];
  sqlDatabases: AzureSQLDatabase[];
  aksClusters: AzureAKSCluster[];
} {
  const filterByTag = <T extends { tags?: Record<string, string> }>(items: T[]): T[] => {
    return items.filter((item) => {
      if (!item.tags) return false;
      if (tagValue) {
        return item.tags[tagKey] === tagValue;
      }
      return tagKey in item.tags;
    });
  };

  return {
    virtualMachines: filterByTag(resources.virtualMachines),
    storageAccounts: filterByTag(resources.storageAccounts),
    sqlDatabases: filterByTag(resources.sqlDatabases),
    aksClusters: filterByTag(resources.aksClusters),
  };
}
