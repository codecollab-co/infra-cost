/**
 * Example usage of Azure Resource Inventory Module
 *
 * This file demonstrates how to use the Azure inventory module
 * to discover and catalog Azure resources.
 */

import { createAzureClientConfig } from './config';
import {
  discoverVirtualMachines,
  discoverStorageAccounts,
  discoverSQLDatabases,
  discoverAKSClusters,
  discoverAllResources,
  getResourceCountsByRegion,
  filterResourcesByTag,
} from './inventory';
import { ProviderConfig, CloudProvider, InventoryFilters } from '../../types/providers';

/**
 * Example 1: Basic VM Discovery
 */
async function example1_BasicVMDiscovery() {
  console.log('\n=== Example 1: Basic VM Discovery ===\n');

  const config: ProviderConfig = {
    provider: CloudProvider.AZURE,
    credentials: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
  };

  const azureConfig = createAzureClientConfig(config);
  const vms = await discoverVirtualMachines(azureConfig);

  console.log(`Found ${vms.length} virtual machines\n`);

  vms.forEach((vm) => {
    console.log(`VM: ${vm.name}`);
    console.log(`  Location: ${vm.location}`);
    console.log(`  Size: ${vm.vmSize}`);
    console.log(`  Power State: ${vm.powerState}`);
    console.log(`  OS Type: ${vm.osType}`);
    console.log(`  Disks: ${vm.disks.length}`);
    console.log('');
  });
}

/**
 * Example 2: Filtered VM Discovery (Production VMs in specific regions)
 */
async function example2_FilteredDiscovery() {
  console.log('\n=== Example 2: Filtered VM Discovery ===\n');

  const config: ProviderConfig = {
    provider: CloudProvider.AZURE,
    credentials: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
  };

  const azureConfig = createAzureClientConfig(config);

  const filters: InventoryFilters = {
    regions: ['eastus', 'westus2'],
    tags: {
      environment: 'production',
    },
    includeDeleted: false,
  };

  const vms = await discoverVirtualMachines(azureConfig, filters);

  console.log(`Found ${vms.length} production VMs in East US and West US 2\n`);

  vms.forEach((vm) => {
    console.log(`${vm.name} - ${vm.location} - ${vm.vmSize} - ${vm.powerState}`);
  });
}

/**
 * Example 3: Storage Account Security Audit
 */
async function example3_StorageSecurityAudit() {
  console.log('\n=== Example 3: Storage Account Security Audit ===\n');

  const config: ProviderConfig = {
    provider: CloudProvider.AZURE,
    credentials: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
  };

  const azureConfig = createAzureClientConfig(config);
  const storageAccounts = await discoverStorageAccounts(azureConfig);

  console.log(`Found ${storageAccounts.length} storage accounts\n`);

  const insecureAccounts = storageAccounts.filter(
    (account) => !account.encryption || !account.httpsOnly
  );

  if (insecureAccounts.length === 0) {
    console.log('All storage accounts are secure!');
  } else {
    console.log(`Found ${insecureAccounts.length} insecure storage accounts:\n`);

    insecureAccounts.forEach((account) => {
      console.log(`Account: ${account.name}`);
      console.log(`  Location: ${account.location}`);
      console.log(`  Encryption: ${account.encryption}`);
      console.log(`  HTTPS Only: ${account.httpsOnly}`);
      console.log(`  Allow Public Blob Access: ${account.allowBlobPublicAccess}`);
      console.log('');
    });
  }
}

/**
 * Example 4: Database Backup Compliance Check
 */
async function example4_DatabaseBackupCompliance() {
  console.log('\n=== Example 4: Database Backup Compliance ===\n');

  const config: ProviderConfig = {
    provider: CloudProvider.AZURE,
    credentials: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
  };

  const azureConfig = createAzureClientConfig(config);
  const databases = await discoverSQLDatabases(azureConfig);

  console.log(`Found ${databases.length} SQL databases\n`);

  databases.forEach((db) => {
    console.log(`Database: ${db.name} (Server: ${db.serverName})`);
    console.log(`  Location: ${db.location}`);
    console.log(`  Edition: ${db.edition}`);
    console.log(`  Service Objective: ${db.serviceObjective}`);
    console.log(`  Zone Redundant: ${db.zoneRedundant}`);
    console.log(`  Geo-Backup: ${db.geoBackupEnabled ?? 'Unknown'}`);
    console.log('');
  });
}

/**
 * Example 5: AKS Cluster Analysis
 */
async function example5_AKSClusterAnalysis() {
  console.log('\n=== Example 5: AKS Cluster Analysis ===\n');

  const config: ProviderConfig = {
    provider: CloudProvider.AZURE,
    credentials: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
  };

  const azureConfig = createAzureClientConfig(config);
  const aksClusters = await discoverAKSClusters(azureConfig);

  console.log(`Found ${aksClusters.length} AKS clusters\n`);

  aksClusters.forEach((cluster) => {
    console.log(`Cluster: ${cluster.name}`);
    console.log(`  Location: ${cluster.location}`);
    console.log(`  Kubernetes Version: ${cluster.kubernetesVersion}`);
    console.log(`  Total Nodes: ${cluster.nodeCount}`);
    console.log(`  Power State: ${cluster.powerState}`);
    console.log('  Node Pools:');

    cluster.agentPoolProfiles.forEach((pool) => {
      console.log(`    - ${pool.name}: ${pool.count}x ${pool.vmSize} (${pool.osType})`);
    });

    if (cluster.networkProfile) {
      console.log(`  Network Plugin: ${cluster.networkProfile.networkPlugin}`);
    }
    console.log('');
  });
}

/**
 * Example 6: Parallel Discovery of All Resources
 */
async function example6_ParallelDiscoveryAllResources() {
  console.log('\n=== Example 6: Parallel Discovery of All Resources ===\n');

  const config: ProviderConfig = {
    provider: CloudProvider.AZURE,
    credentials: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
  };

  const azureConfig = createAzureClientConfig(config);

  console.log('Discovering all resources in parallel...\n');
  const startTime = Date.now();

  const allResources = await discoverAllResources(azureConfig);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`Discovery completed in ${duration} seconds\n`);
  console.log('Resource Summary:');
  console.log(`  Virtual Machines: ${allResources.virtualMachines.length}`);
  console.log(`  Storage Accounts: ${allResources.storageAccounts.length}`);
  console.log(`  SQL Databases: ${allResources.sqlDatabases.length}`);
  console.log(`  AKS Clusters: ${allResources.aksClusters.length}`);
  console.log(`  Total: ${
    allResources.virtualMachines.length +
    allResources.storageAccounts.length +
    allResources.sqlDatabases.length +
    allResources.aksClusters.length
  }`);
}

/**
 * Example 7: Resource Distribution by Region
 */
async function example7_ResourceDistributionByRegion() {
  console.log('\n=== Example 7: Resource Distribution by Region ===\n');

  const config: ProviderConfig = {
    provider: CloudProvider.AZURE,
    credentials: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
  };

  const azureConfig = createAzureClientConfig(config);
  const allResources = await discoverAllResources(azureConfig);

  const regionCounts = getResourceCountsByRegion(allResources);

  console.log('Resources by Region:\n');

  Object.entries(regionCounts)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([region, counts]) => {
      console.log(`${region}:`);
      console.log(`  VMs: ${counts.vms}`);
      console.log(`  Storage: ${counts.storage}`);
      console.log(`  Databases: ${counts.databases}`);
      console.log(`  AKS: ${counts.aks}`);
      console.log(`  Total: ${counts.total}`);
      console.log('');
    });
}

/**
 * Example 8: Filter Resources by Tag
 */
async function example8_FilterResourcesByTag() {
  console.log('\n=== Example 8: Filter Resources by Tag ===\n');

  const config: ProviderConfig = {
    provider: CloudProvider.AZURE,
    credentials: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
  };

  const azureConfig = createAzureClientConfig(config);
  const allResources = await discoverAllResources(azureConfig);

  // Get all production resources
  const productionResources = filterResourcesByTag(
    allResources,
    'environment',
    'production'
  );

  console.log('Production Resources:');
  console.log(`  VMs: ${productionResources.virtualMachines.length}`);
  console.log(`  Storage: ${productionResources.storageAccounts.length}`);
  console.log(`  Databases: ${productionResources.sqlDatabases.length}`);
  console.log(`  AKS: ${productionResources.aksClusters.length}\n`);

  // Get all resources with 'team' tag
  const teamResources = filterResourcesByTag(allResources, 'team');

  console.log('Resources with Team Tag:');
  console.log(`  VMs: ${teamResources.virtualMachines.length}`);
  console.log(`  Storage: ${teamResources.storageAccounts.length}`);
  console.log(`  Databases: ${teamResources.sqlDatabases.length}`);
  console.log(`  AKS: ${teamResources.aksClusters.length}`);
}

/**
 * Example 9: Cost Analysis Preparation
 */
async function example9_CostAnalysisPreparation() {
  console.log('\n=== Example 9: Cost Analysis Preparation ===\n');

  const config: ProviderConfig = {
    provider: CloudProvider.AZURE,
    credentials: {
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
      tenantId: process.env.AZURE_TENANT_ID,
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
    },
  };

  const azureConfig = createAzureClientConfig(config);
  const allResources = await discoverAllResources(azureConfig);

  console.log('Resource Inventory for Cost Analysis:\n');

  // Group VMs by size
  const vmsBySizeType: Record<string, number> = {};
  allResources.virtualMachines.forEach((vm) => {
    vmsBySizeType[vm.vmSize] = (vmsBySizeType[vm.vmSize] || 0) + 1;
  });

  console.log('VMs by Size:');
  Object.entries(vmsBySizeType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([size, count]) => {
      console.log(`  ${size}: ${count}`);
    });

  // Group storage by SKU
  const storageBySKU: Record<string, number> = {};
  allResources.storageAccounts.forEach((account) => {
    storageBySKU[account.sku] = (storageBySKU[account.sku] || 0) + 1;
  });

  console.log('\nStorage Accounts by SKU:');
  Object.entries(storageBySKU)
    .sort((a, b) => b[1] - a[1])
    .forEach(([sku, count]) => {
      console.log(`  ${sku}: ${count}`);
    });

  // Group databases by edition
  const databasesByEdition: Record<string, number> = {};
  allResources.sqlDatabases.forEach((db) => {
    databasesByEdition[db.edition] = (databasesByEdition[db.edition] || 0) + 1;
  });

  console.log('\nSQL Databases by Edition:');
  Object.entries(databasesByEdition)
    .sort((a, b) => b[1] - a[1])
    .forEach(([edition, count]) => {
      console.log(`  ${edition}: ${count}`);
    });
}

/**
 * Run all examples
 */
async function runAllExamples() {
  try {
    // Check if credentials are configured
    if (!process.env.AZURE_SUBSCRIPTION_ID) {
      console.log('\nPlease set the following environment variables:');
      console.log('  AZURE_SUBSCRIPTION_ID - Your Azure subscription ID (required)');
      console.log('  AZURE_TENANT_ID - Your Azure tenant ID (optional, for service principal)');
      console.log('  AZURE_CLIENT_ID - Your Azure client ID (optional, for service principal)');
      console.log('  AZURE_CLIENT_SECRET - Your Azure client secret (optional, for service principal)');
      console.log('\nAlternatively, use Azure CLI authentication:');
      console.log('  az login');
      console.log('  az account set --subscription "your-subscription-id"');
      return;
    }

    // Run individual examples (comment out the ones you don't want to run)
    // await example1_BasicVMDiscovery();
    // await example2_FilteredDiscovery();
    // await example3_StorageSecurityAudit();
    // await example4_DatabaseBackupCompliance();
    // await example5_AKSClusterAnalysis();
    await example6_ParallelDiscoveryAllResources();
    // await example7_ResourceDistributionByRegion();
    // await example8_FilterResourcesByTag();
    // await example9_CostAnalysisPreparation();

    console.log('\nExamples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();

export {
  example1_BasicVMDiscovery,
  example2_FilteredDiscovery,
  example3_StorageSecurityAudit,
  example4_DatabaseBackupCompliance,
  example5_AKSClusterAnalysis,
  example6_ParallelDiscoveryAllResources,
  example7_ResourceDistributionByRegion,
  example8_FilterResourcesByTag,
  example9_CostAnalysisPreparation,
};
