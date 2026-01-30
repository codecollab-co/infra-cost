# Oracle Cloud Infrastructure (OCI) Provider

Complete OCI provider implementation for the infra-cost tool with full feature parity to Azure and GCP providers.

## Features

- **Multi-Authentication Support**
  - API Key (user OCID, tenancy OCID, fingerprint, private key)
  - Instance Principal (for compute instances)
  - Resource Principal (for functions and OCI services)
  - Config File authentication

- **Cost Management**
  - Usage API integration for detailed cost data
  - Cost breakdown by service
  - Multi-compartment cost aggregation
  - Cost forecasting
  - Tag-based cost analysis

- **Resource Discovery**
  - Compute Instances with full metadata
  - Block Volumes with backup policies
  - Autonomous Databases
  - Oracle Kubernetes Engine (OKE) clusters
  - Parallel discovery for performance

- **Budget Management**
  - Budget tracking and alerts
  - Threshold-based notifications
  - Multi-compartment budget support

- **Multi-Compartment Support**
  - Compartment hierarchy navigation
  - Tenancy-wide cost aggregation
  - Parallel compartment processing

## Directory Structure

```
src/providers/oracle/
├── config.ts              - Authentication and configuration
├── compartment.ts         - Compartment/tenancy management
├── cost.ts                - Usage API cost data retrieval
├── inventory.ts           - Resource discovery
├── budget.ts              - Budget tracking and alerts
├── multi-compartment.ts   - Multi-compartment aggregation
├── provider.ts            - Main provider class
└── README.md              - This file
```

## Authentication Methods

### 1. API Key Authentication (Recommended)

```typescript
import { OracleCloudProvider } from './providers/oracle';
import { CloudProvider } from './types/providers';

const provider = new OracleCloudProvider({
  provider: CloudProvider.ORACLE_CLOUD,
  credentials: {
    tenancyId: 'ocid1.tenancy.oc1..aaaaaa...',
    userId: 'ocid1.user.oc1..aaaaaa...',
    fingerprint: '12:34:56:78:90:ab:cd:ef:12:34:56:78:90:ab:cd:ef',
    privateKeyPath: '/path/to/private/key.pem',
    // Or provide the key content directly:
    // privateKey: '-----BEGIN RSA PRIVATE KEY-----\n...',
    region: 'us-phoenix-1',
  },
});
```

### 2. Instance Principal (For OCI Compute Instances)

```typescript
const provider = new OracleCloudProvider({
  provider: CloudProvider.ORACLE_CLOUD,
  credentials: {
    tenancyId: 'ocid1.tenancy.oc1..aaaaaa...',
    useInstancePrincipal: true,
    region: 'us-phoenix-1',
  },
});
```

### 3. Resource Principal (For OCI Functions)

```typescript
const provider = new OracleCloudProvider({
  provider: CloudProvider.ORACLE_CLOUD,
  credentials: {
    tenancyId: 'ocid1.tenancy.oc1..aaaaaa...',
    useResourcePrincipal: true,
    region: 'us-phoenix-1',
  },
});
```

### 4. Config File Authentication

```typescript
const provider = new OracleCloudProvider({
  provider: CloudProvider.ORACLE_CLOUD,
  credentials: {
    tenancyId: 'ocid1.tenancy.oc1..aaaaaa...',
    configFilePath: '~/.oci/config',
    profile: 'DEFAULT',
  },
});
```

## Usage Examples

### Get Cost Breakdown

```typescript
// Single compartment
const costs = await provider.getCostBreakdown();
console.log('This Month:', costs.totals.thisMonth);
console.log('Last Month:', costs.totals.lastMonth);

// Multi-compartment
const multiCompartmentCosts = await provider.getMultiCompartmentCostBreakdown({
  activeOnly: true,
  compartmentIds: ['ocid1.compartment...', 'ocid1.compartment...'],
});
```

### Discover Resources

```typescript
// All resources
const inventory = await provider.getResourceInventory();
console.log('Total Resources:', inventory.totalResources);
console.log('Compute Instances:', inventory.resources.compute.length);
console.log('Databases:', inventory.resources.database.length);

// Filtered resources
const filteredInventory = await provider.getResourceInventory({
  regions: ['us-phoenix-1', 'us-ashburn-1'],
  tags: { environment: 'production' },
});
```

### Budget Management

```typescript
// Get all budgets
const budgets = await provider.getBudgets();

// Get budget alerts
const alerts = await provider.getBudgetAlerts();
alerts.forEach(alert => {
  console.log(`${alert.severity}: ${alert.message}`);
});
```

### Cost Trend Analysis

```typescript
const trends = await provider.getCostTrendAnalysis(6); // Last 6 months
console.log('Average Daily Cost:', trends.averageDailyCost);
console.log('Projected Monthly Cost:', trends.projectedMonthlyCost);
console.log('Top Services:', trends.topServices);
```

### FinOps Recommendations

```typescript
const recommendations = await provider.getFinOpsRecommendations();
recommendations.forEach(rec => {
  console.log(`${rec.type}: ${rec.title}`);
  console.log(`Potential Savings: $${rec.potentialSavings.amount}`);
  console.log(`Priority: ${rec.priority}`);
});
```

## Multi-Compartment Operations

### Get Tenancy-Wide Costs

```typescript
const tenancyCosts = await provider.getTenancyCostBreakdown();
console.log('Total Compartments:', tenancyCosts.compartmentCount);
console.log('Total Cost:', tenancyCosts.totals.thisMonth);
```

### Get Top Spending Compartments

```typescript
const topCompartments = await provider.getTopSpendingCompartments(10);
topCompartments.forEach(({ compartment, costs }) => {
  console.log(`${compartment.name}: $${costs.thisMonth}`);
});
```

### Detailed Multi-Compartment Breakdown

```typescript
const detailed = await provider.getDetailedMultiCompartmentCostBreakdown({
  activeOnly: true,
});

detailed.compartments.forEach(({ compartment, costs }) => {
  console.log(`Compartment: ${compartment.name}`);
  console.log(`Cost: $${costs.thisMonth}`);
  console.log(`Services:`, costs.breakdown);
});
```

## OCI Regions

Supported regions include:
- `us-phoenix-1` - US West (Phoenix)
- `us-ashburn-1` - US East (Ashburn)
- `us-sanjose-1` - US West (San Jose)
- `uk-london-1` - UK South (London)
- `uk-cardiff-1` - UK West (Cardiff)
- `ca-toronto-1` - Canada Southeast (Toronto)
- `ca-montreal-1` - Canada Southeast (Montreal)
- `eu-frankfurt-1` - Germany Central (Frankfurt)
- `eu-zurich-1` - Switzerland North (Zurich)
- `eu-amsterdam-1` - Netherlands Northwest (Amsterdam)
- `ap-tokyo-1` - Japan East (Tokyo)
- `ap-osaka-1` - Japan Central (Osaka)
- `ap-seoul-1` - South Korea Central (Seoul)
- `ap-mumbai-1` - India West (Mumbai)
- `ap-sydney-1` - Australia East (Sydney)
- `ap-melbourne-1` - Australia Southeast (Melbourne)
- `sa-saopaulo-1` - Brazil East (Sao Paulo)
- `sa-vinhedo-1` - Brazil Southeast (Vinhedo)
- `me-jeddah-1` - Saudi Arabia West (Jeddah)
- `me-dubai-1` - UAE East (Dubai)

## IAM Policies

Required IAM policies for full functionality:

```
Allow group FinOpsUsers to inspect tenancies in tenancy
Allow group FinOpsUsers to inspect compartments in tenancy
Allow group FinOpsUsers to inspect instances in tenancy
Allow group FinOpsUsers to inspect volumes in tenancy
Allow group FinOpsUsers to inspect autonomous-databases in tenancy
Allow group FinOpsUsers to inspect clusters in tenancy
Allow group FinOpsUsers to inspect budgets in tenancy
Allow group FinOpsUsers to read usage-reports in tenancy
Allow group FinOpsUsers to read usage-budgets in tenancy
```

## Error Handling

The provider implements graceful error handling with detailed error messages:

```typescript
try {
  const costs = await provider.getCostBreakdown();
} catch (error) {
  console.error('Failed to get costs:', error.message);
  // Error messages include troubleshooting steps
}
```

## Performance Optimization

- **Parallel Processing**: Resource discovery and multi-compartment operations use parallel processing
- **Efficient Filtering**: Client-side and server-side filtering to reduce API calls
- **Graceful Degradation**: Continues operation even if some API calls fail

## Dependencies

Required npm packages:
```json
{
  "oci-common": "^2.88.0",
  "oci-identity": "^2.88.0",
  "oci-core": "^2.88.0",
  "oci-database": "^2.88.0",
  "oci-containerengine": "^2.88.0",
  "oci-objectstorage": "^2.88.0",
  "oci-usageapi": "^2.88.0",
  "oci-budget": "^2.88.0"
}
```

## Best Practices

1. **Use Compartments**: Organize resources by project, environment, or department
2. **Tag Everything**: Use both freeform and defined tags for cost tracking
3. **Enable Budgets**: Set up budgets with multiple threshold alerts
4. **Monitor Regularly**: Schedule regular cost analysis
5. **Optimize Resources**: Act on FinOps recommendations promptly
6. **Use Reserved Capacity**: Purchase reserved instances for steady-state workloads
7. **Enable Auto-Scaling**: Use auto-scaling for Autonomous Databases

## Troubleshooting

### Authentication Issues

```
Error: Failed to validate OCI credentials
```
**Solution**: Verify your OCID values and ensure the private key matches the public key fingerprint.

### Permission Errors

```
Error: Failed to discover resources: NotAuthorizedOrNotFound
```
**Solution**: Check IAM policies and ensure your user/group has necessary permissions.

### Region Not Found

```
Error: Region 'unknown' not supported
```
**Solution**: Use a valid OCI region identifier from the supported regions list.

## Architecture

The OCI provider follows the same architecture as Azure and GCP providers:

1. **config.ts** - Handles authentication and configuration
2. **compartment.ts** - Manages compartment hierarchy
3. **cost.ts** - Interfaces with Usage API
4. **inventory.ts** - Discovers and catalogs resources
5. **budget.ts** - Manages budgets and alerts
6. **multi-compartment.ts** - Aggregates multi-compartment data
7. **provider.ts** - Main provider implementation

## Contributing

When adding new features:
1. Follow the existing code structure
2. Add comprehensive error handling
3. Include TypeScript type definitions
4. Update this README with usage examples
5. Add unit tests for new functionality

## License

MIT
