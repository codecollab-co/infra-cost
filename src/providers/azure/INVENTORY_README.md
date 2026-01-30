# Azure Resource Inventory Module

Comprehensive resource discovery module for Azure that catalogs Virtual Machines, Storage Accounts, SQL Databases, and AKS clusters across subscriptions with advanced filtering and parallel processing.

## Features

- **Virtual Machine Discovery**: Complete VM inventory with compute, network, and disk details
- **Storage Account Discovery**: Storage accounts with blob containers and security configuration
- **SQL Database Discovery**: Azure SQL databases with backup and replication information
- **AKS Cluster Discovery**: Kubernetes clusters with node pool details
- **Parallel Discovery**: High-performance parallel resource discovery using Promise.all()
- **Advanced Filtering**: Region-based, tag-based, and state-based filtering
- **Graceful Error Handling**: Continues discovery even if individual regions fail
- **Multi-Subscription Support**: Discover resources across multiple Azure subscriptions

## Installation

The module requires the following Azure SDK packages (already included in package.json):

```bash
npm install @azure/arm-compute @azure/arm-storage @azure/arm-sql @azure/arm-containerservice @azure/arm-network @azure/identity
```

## Quick Start

```typescript
import { createAzureClientConfig } from './providers/azure/config';
import {
  discoverVirtualMachines,
  discoverStorageAccounts,
  discoverSQLDatabases,
  discoverAKSClusters,
  discoverAllResources,
} from './providers/azure/inventory';
import { ProviderConfig, CloudProvider } from './types/providers';

// Create Azure configuration
const config: ProviderConfig = {
  provider: CloudProvider.AZURE,
  credentials: {
    subscriptionId: 'your-subscription-id',
    tenantId: 'your-tenant-id',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
};

const azureConfig = createAzureClientConfig(config);

// Discover all Virtual Machines
const vms = await discoverVirtualMachines(azureConfig);
console.log(`Found ${vms.length} virtual machines`);

// Discover all Storage Accounts
const storageAccounts = await discoverStorageAccounts(azureConfig);
console.log(`Found ${storageAccounts.length} storage accounts`);

// Discover all SQL Databases
const databases = await discoverSQLDatabases(azureConfig);
console.log(`Found ${databases.length} SQL databases`);

// Discover all AKS Clusters
const aksClusters = await discoverAKSClusters(azureConfig);
console.log(`Found ${aksClusters.length} AKS clusters`);

// Discover everything in parallel (recommended)
const allResources = await discoverAllResources(azureConfig);
console.log('Total resources:', {
  vms: allResources.virtualMachines.length,
  storage: allResources.storageAccounts.length,
  databases: allResources.sqlDatabases.length,
  aks: allResources.aksClusters.length,
});
```

## Advanced Filtering

### Filter by Region

```typescript
import { InventoryFilters } from './types/providers';

const filters: InventoryFilters = {
  regions: ['eastus', 'westus2', 'centralus'],
};

const vms = await discoverVirtualMachines(azureConfig, filters);
// Returns only VMs in East US, West US 2, and Central US
```

### Filter by Tags

```typescript
const filters: InventoryFilters = {
  tags: {
    environment: 'production',
    team: 'platform',
  },
};

const vms = await discoverVirtualMachines(azureConfig, filters);
// Returns only VMs with matching tags
```

### Include Stopped/Deleted Resources

```typescript
const filters: InventoryFilters = {
  includeDeleted: true,
};

const vms = await discoverVirtualMachines(azureConfig, filters);
// Includes stopped, deallocated, and failed VMs
```

### Combine Multiple Filters

```typescript
const filters: InventoryFilters = {
  regions: ['eastus', 'westus2'],
  tags: {
    environment: 'production',
  },
  includeDeleted: false,
};

const vms = await discoverVirtualMachines(azureConfig, filters);
// Returns only running production VMs in East US and West US 2
```

## Resource Types

### Virtual Machines

```typescript
interface AzureVirtualMachine {
  id: string;
  vmId: string;
  name: string;
  location: string;
  vmSize: string; // e.g., 'Standard_D2s_v3'
  powerState: string; // 'running', 'stopped', 'deallocated'
  osType: string; // 'Linux' or 'Windows'
  provisioningState: string;
  networkInterfaces: string[];
  disks: Array<{
    name: string;
    diskSizeGB: number;
    managedDisk?: {
      storageAccountType: string; // 'Premium_LRS', 'Standard_LRS'
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
  tags?: Record<string, string>;
}
```

### Storage Accounts

```typescript
interface AzureStorageAccount {
  id: string;
  accountName: string;
  location: string;
  sku: string; // 'Standard_LRS', 'Premium_LRS', etc.
  kind: string; // 'StorageV2', 'BlobStorage', etc.
  tier: string; // 'Standard' or 'Premium'
  replicationType: string;
  accessTier?: string; // 'Hot', 'Cool', 'Archive'
  encryption: boolean;
  httpsOnly: boolean;
  allowBlobPublicAccess?: boolean;
  networkRuleSet?: {
    defaultAction: string;
    bypass?: string;
  };
  tags?: Record<string, string>;
}
```

### SQL Databases

```typescript
interface AzureSQLDatabase {
  id: string;
  databaseId: string;
  name: string;
  serverName: string;
  location: string;
  edition: string; // 'Basic', 'Standard', 'Premium', 'GeneralPurpose'
  serviceObjective: string;
  maxSizeBytes: number;
  status: string;
  collation?: string;
  elasticPoolName?: string;
  replicationRole?: string;
  backupRetentionPeriod?: number;
  geoBackupEnabled?: boolean;
  zoneRedundant?: boolean;
  tags?: Record<string, string>;
}
```

### AKS Clusters

```typescript
interface AzureAKSCluster {
  id: string;
  clusterId: string;
  name: string;
  location: string;
  kubernetesVersion: string;
  nodeCount: number;
  dnsPrefix: string;
  fqdn?: string;
  provisioningState: string;
  powerState: string; // 'running' or 'stopped'
  agentPoolProfiles: Array<{
    name: string;
    count: number;
    vmSize: string;
    osType: string;
    osDiskSizeGB: number;
    mode: string; // 'System' or 'User'
    availabilityZones?: string[];
  }>;
  networkProfile?: {
    networkPlugin: string; // 'azure', 'kubenet'
    serviceCidr?: string;
    dnsServiceIP?: string;
    podCidr?: string;
  };
  tags?: Record<string, string>;
}
```

## Utility Functions

### Get Resource Counts by Region

```typescript
import { getResourceCountsByRegion } from './providers/azure/inventory';

const allResources = await discoverAllResources(azureConfig);
const regionCounts = getResourceCountsByRegion(allResources);

console.log(regionCounts);
// {
//   'eastus': { vms: 15, storage: 8, databases: 3, aks: 2, total: 28 },
//   'westus2': { vms: 10, storage: 5, databases: 2, aks: 1, total: 18 }
// }
```

### Filter Resources by Tag

```typescript
import { filterResourcesByTag } from './providers/azure/inventory';

const allResources = await discoverAllResources(azureConfig);

// Get all production resources
const productionResources = filterResourcesByTag(
  allResources,
  'environment',
  'production'
);

// Get all resources with a specific tag key (any value)
const teamResources = filterResourcesByTag(allResources, 'team');
```

## Authentication

The module supports multiple Azure authentication methods:

### Service Principal (Recommended for CI/CD)

```typescript
const config: ProviderConfig = {
  provider: CloudProvider.AZURE,
  credentials: {
    subscriptionId: 'your-subscription-id',
    tenantId: 'your-tenant-id',
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
  },
};
```

### Azure CLI Credentials (Recommended for Local Development)

```bash
# Login with Azure CLI
az login

# Set default subscription
az account set --subscription "your-subscription-id"
```

```typescript
const config: ProviderConfig = {
  provider: CloudProvider.AZURE,
  credentials: {
    subscriptionId: 'your-subscription-id',
  },
};
// Will use DefaultAzureCredential which picks up Azure CLI credentials
```

### Managed Identity (For Azure Resources)

When running on Azure (VMs, App Service, Functions, etc.), the module automatically uses the assigned managed identity:

```typescript
const config: ProviderConfig = {
  provider: CloudProvider.AZURE,
  credentials: {
    subscriptionId: 'your-subscription-id',
  },
};
```

## Required Permissions

The authenticated identity needs the following Azure RBAC permissions:

### Minimum Required Roles

- **Reader** role at subscription level (provides read access to all resources)

### Specific Permissions

If using custom roles, ensure these permissions are granted:

```
Microsoft.Compute/virtualMachines/read
Microsoft.Compute/virtualMachines/instanceView/read
Microsoft.Storage/storageAccounts/read
Microsoft.Sql/servers/read
Microsoft.Sql/servers/databases/read
Microsoft.ContainerService/managedClusters/read
Microsoft.Network/networkInterfaces/read
```

### Creating a Service Principal with Reader Access

```bash
# Create a service principal with Reader role
az ad sp create-for-rbac \
  --name "infra-cost-reader" \
  --role "Reader" \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID

# Output will include:
# {
#   "appId": "CLIENT_ID",
#   "password": "CLIENT_SECRET",
#   "tenant": "TENANT_ID"
# }
```

## Performance Optimization

### Parallel Discovery

The module uses `Promise.all()` for parallel discovery:

```typescript
// Discover all resource types in parallel (fastest)
const allResources = await discoverAllResources(azureConfig);
```

### Selective Discovery

If you only need specific resource types:

```typescript
// Discover only VMs and storage accounts in parallel
const [vms, storage] = await Promise.all([
  discoverVirtualMachines(azureConfig),
  discoverStorageAccounts(azureConfig),
]);
```

### Region-Specific Discovery

Filter by region to reduce API calls:

```typescript
const filters: InventoryFilters = {
  regions: ['eastus'], // Only discover resources in East US
};

const vms = await discoverVirtualMachines(azureConfig, filters);
```

## Error Handling

The module implements graceful error handling:

### Individual Resource Failures

If a single VM or resource fails to process, the discovery continues:

```typescript
// Discovery continues even if individual VMs fail
const vms = await discoverVirtualMachines(azureConfig);
// Console warnings are logged for failed resources
```

### Regional Failures

The `discoverAllResources` function catches errors for each resource type:

```typescript
const allResources = await discoverAllResources(azureConfig);
// If VM discovery fails, storage/SQL/AKS discovery still continues
// Failed resource types return empty arrays
```

### Custom Error Handling

```typescript
try {
  const vms = await discoverVirtualMachines(azureConfig);
} catch (error) {
  console.error('VM discovery failed:', error.message);
  // Error includes troubleshooting steps
}
```

## Common Issues and Troubleshooting

### "Failed to discover Virtual Machines"

1. Verify subscription ID is correct
2. Ensure authenticated identity has `Microsoft.Compute/virtualMachines/read` permission
3. Check that Compute resource provider is registered: `az provider register --namespace Microsoft.Compute`

### "Could not extract resource group from VM ID"

This indicates the VM resource ID format is unexpected. Ensure you're using a valid Azure subscription.

### "Failed to get instance view for VM"

The identity may lack permissions to read VM instance views. Grant `Microsoft.Compute/virtualMachines/instanceView/read` permission.

### Slow Discovery Performance

1. Use region filters to limit scope
2. Use `discoverAllResources()` for parallel discovery
3. Filter by tags to reduce result set size

## Multi-Subscription Support

To discover resources across multiple subscriptions:

```typescript
const subscriptionIds = ['sub-1', 'sub-2', 'sub-3'];

const allSubscriptionResources = await Promise.all(
  subscriptionIds.map(async (subscriptionId) => {
    const config = createAzureClientConfig({
      provider: CloudProvider.AZURE,
      credentials: {
        subscriptionId,
        tenantId: 'your-tenant-id',
        clientId: 'your-client-id',
        clientSecret: 'your-client-secret',
      },
    });

    return discoverAllResources(config);
  })
);

// Combine results from all subscriptions
const combined = {
  virtualMachines: allSubscriptionResources.flatMap((r) => r.virtualMachines),
  storageAccounts: allSubscriptionResources.flatMap((r) => r.storageAccounts),
  sqlDatabases: allSubscriptionResources.flatMap((r) => r.sqlDatabases),
  aksClusters: allSubscriptionResources.flatMap((r) => r.aksClusters),
};
```

## Examples

### Example 1: Production VM Inventory

```typescript
const filters: InventoryFilters = {
  tags: { environment: 'production' },
  includeDeleted: false,
};

const productionVMs = await discoverVirtualMachines(azureConfig, filters);

console.log('Production VMs by Region:');
productionVMs.forEach((vm) => {
  console.log(`- ${vm.name} (${vm.location}): ${vm.vmSize} - ${vm.powerState}`);
});
```

### Example 2: Storage Account Security Audit

```typescript
const storageAccounts = await discoverStorageAccounts(azureConfig);

const insecureAccounts = storageAccounts.filter(
  (account) => !account.encryption || !account.httpsOnly
);

console.log('Insecure Storage Accounts:');
insecureAccounts.forEach((account) => {
  console.log(`- ${account.name}:`);
  console.log(`  Encryption: ${account.encryption}`);
  console.log(`  HTTPS Only: ${account.httpsOnly}`);
});
```

### Example 3: Database Backup Compliance

```typescript
const databases = await discoverSQLDatabases(azureConfig);

const nonCompliant = databases.filter(
  (db) => !db.geoBackupEnabled || (db.backupRetentionPeriod || 0) < 7
);

console.log('Non-Compliant Databases:');
nonCompliant.forEach((db) => {
  console.log(`- ${db.name} (${db.serverName}):`);
  console.log(`  Geo-Backup: ${db.geoBackupEnabled}`);
  console.log(`  Retention: ${db.backupRetentionPeriod} days`);
});
```

### Example 4: AKS Cluster Node Analysis

```typescript
const aksClusters = await discoverAKSClusters(azureConfig);

aksClusters.forEach((cluster) => {
  console.log(`Cluster: ${cluster.name}`);
  console.log(`Kubernetes Version: ${cluster.kubernetesVersion}`);
  console.log(`Total Nodes: ${cluster.nodeCount}`);
  console.log('Node Pools:');
  cluster.agentPoolProfiles.forEach((pool) => {
    console.log(`  - ${pool.name}: ${pool.count}x ${pool.vmSize} (${pool.osType})`);
  });
});
```

## Testing

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Run tests (when available)
npm test
```

## Contributing

When contributing to the Azure inventory module:

1. Maintain consistency with the GCP inventory module structure
2. Add comprehensive error handling with troubleshooting steps
3. Use parallel discovery patterns with Promise.all()
4. Include TypeScript types for all resources
5. Add JSDoc comments for public functions
6. Test with multiple Azure subscriptions and regions

## License

MIT
