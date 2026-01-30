# Alibaba Cloud Provider

Complete Alibaba Cloud (Alicloud) provider implementation with full parity to GCP and Azure providers.

## Features

- **BSS OpenAPI Integration**: Billing and cost data retrieval using Business Support System API
- **Resource Discovery**: Comprehensive inventory of ECS, OSS, RDS, and ACK resources
- **Multi-Account Support**: Aggregate costs and resources across multiple Alibaba Cloud accounts
- **Budget Management**: Track budgets and receive threshold-based alerts
- **Parallel Processing**: Efficient concurrent API calls for fast data retrieval
- **Graceful Error Handling**: Robust error handling with detailed logging

## Architecture

```
src/providers/alicloud/
├── config.ts          - Authentication and configuration
├── account.ts         - Account/project management
├── cost.ts            - BSS API cost data retrieval
├── inventory.ts       - ECS, OSS, RDS, ACK resource discovery
├── budget.ts          - Budget tracking and alerts
├── multi-account.ts   - Multi-account aggregation
├── provider.ts        - Main provider class
└── index.ts           - Module exports
```

## Installation

### Required Dependencies

```bash
npm install @alicloud/ecs20140526 @alicloud/oss20190517 @alicloud/rds20140815 @alicloud/cs20151215 @alicloud/bssopenapi20171214 @alicloud/tea-util
```

Or add to package.json:

```json
{
  "dependencies": {
    "@alicloud/bssopenapi20171214": "^2.0.1",
    "@alicloud/cs20151215": "^4.0.1",
    "@alicloud/ecs20140526": "^4.0.3",
    "@alicloud/oss20190517": "^2.0.2",
    "@alicloud/rds20140815": "^3.0.2",
    "@alicloud/tea-util": "^1.4.7"
  }
}
```

## Configuration

### Authentication

Alibaba Cloud uses AccessKey/SecretKey authentication:

```typescript
import { AlibabaCloudProvider } from './providers/alicloud';
import { CloudProvider } from './types/providers';

const provider = new AlibabaCloudProvider({
  provider: CloudProvider.ALIBABA_CLOUD,
  credentials: {
    accessKeyId: 'YOUR_ACCESS_KEY_ID',
    accessKeySecret: 'YOUR_ACCESS_KEY_SECRET',
    regionId: 'cn-hangzhou', // Optional, defaults to cn-hangzhou
  },
});
```

### Single Account Mode

```typescript
const provider = new AlibabaCloudProvider({
  provider: CloudProvider.ALIBABA_CLOUD,
  credentials: {
    accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
    regionId: 'cn-shanghai',
    accountId: 'your-account-id',
  },
});
```

### Multi-Account Mode

```typescript
// Specific accounts
const provider = new AlibabaCloudProvider({
  provider: CloudProvider.ALIBABA_CLOUD,
  credentials: {
    accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
    accountIds: ['account-1', 'account-2', 'account-3'],
  },
});

// All accessible accounts
const provider = new AlibabaCloudProvider({
  provider: CloudProvider.ALIBABA_CLOUD,
  credentials: {
    accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
    allAccounts: true,
  },
});
```

## Usage Examples

### Get Account Information

```typescript
const accountInfo = await provider.getAccountInfo();
console.log('Account ID:', accountInfo.id);
console.log('Account Name:', accountInfo.name);
console.log('Provider:', accountInfo.provider);
```

### Validate Credentials

```typescript
const isValid = await provider.validateCredentials();
if (isValid) {
  console.log('Credentials are valid');
} else {
  console.error('Invalid credentials');
}
```

### Get Cost Breakdown

```typescript
const costs = await provider.getCostBreakdown();
console.log('This Month:', costs.totals.thisMonth);
console.log('Last Month:', costs.totals.lastMonth);
console.log('Last 7 Days:', costs.totals.last7Days);
console.log('Yesterday:', costs.totals.yesterday);

// Service breakdown
console.log('\nCosts by Service:');
for (const [service, cost] of Object.entries(costs.totalsByService.thisMonth)) {
  console.log(`  ${service}: ${cost.toFixed(2)}`);
}
```

### Get Multi-Account Cost Breakdown

```typescript
const multiAccountCosts = await provider.getDetailedMultiAccountCostBreakdown();

console.log('Total Accounts:', multiAccountCosts.accountCount);
console.log('Total This Month:', multiAccountCosts.totals.thisMonth);

// Per-account costs
for (const account of multiAccountCosts.accounts) {
  console.log(`\n${account.accountName} (${account.accountId})`);
  console.log('  This Month:', account.costs.thisMonth);
  console.log('  Last Month:', account.costs.lastMonth);
}
```

### Get Resource Inventory

```typescript
const inventory = await provider.getResourceInventory({
  includeCosts: true,
});

console.log('Total Resources:', inventory.totalResources);
console.log('Total Cost:', inventory.totalCost);
console.log('\nResources by Type:');
console.log('  Compute (ECS):', inventory.resourcesByType.compute);
console.log('  Storage (OSS):', inventory.resourcesByType.storage);
console.log('  Database (RDS):', inventory.resourcesByType.database);
console.log('  Container (ACK):', inventory.resourcesByType.container);

// List ECS instances
console.log('\nECS Instances:');
for (const instance of inventory.resources.compute) {
  console.log(`  ${instance.name} - ${instance.state} (${instance.region})`);
}
```

### Filter Resources

```typescript
// Filter by region
const beijingResources = await provider.getResourceInventory({
  regions: ['cn-beijing'],
});

// Filter by tags
const prodResources = await provider.getResourceInventory({
  tags: {
    environment: 'production',
  },
});

// Combine filters
const filteredResources = await provider.getResourceInventory({
  regions: ['cn-shanghai', 'cn-hangzhou'],
  tags: {
    team: 'backend',
    environment: 'production',
  },
  includeCosts: true,
});
```

### Get Budgets

```typescript
const budgets = await provider.getBudgets();
for (const budget of budgets) {
  console.log(`\n${budget.budgetName}`);
  console.log('  Limit:', budget.budgetLimit);
  console.log('  Spent:', budget.actualSpend);
  console.log('  Status:', budget.status);
  console.log('  Utilization:', ((budget.actualSpend / budget.budgetLimit) * 100).toFixed(1) + '%');
}
```

### Get Budget Alerts

```typescript
const alerts = await provider.getBudgetAlerts();
for (const alert of alerts) {
  console.log(`\n[${alert.severity.toUpperCase()}] ${alert.budgetName}`);
  console.log('  Message:', alert.message);
  console.log('  Current:', alert.currentSpend);
  console.log('  Budget:', alert.budgetLimit);
  console.log('  Threshold:', alert.threshold + '%');
  console.log('  Usage:', alert.percentageUsed.toFixed(1) + '%');
}
```

### Get Optimization Recommendations

```typescript
const recommendations = await provider.getOptimizationRecommendations();
console.log('Cost Optimization Recommendations:');
for (const recommendation of recommendations) {
  console.log('  -', recommendation);
}
```

## API Coverage

### BSS (Business Support System) APIs

- ✅ QueryBill - Get billing data
- ✅ QueryAccountBill - Get account billing details
- ✅ QueryInstanceBill - Get instance-level billing
- ✅ QueryBudget - Get budget information
- ✅ CreateBudget - Create new budget
- ✅ UpdateBudget - Update existing budget
- ✅ DeleteBudget - Delete budget

### ECS (Elastic Compute Service) APIs

- ✅ DescribeInstances - List ECS instances
- ✅ DescribeInstanceAttribute - Get instance details
- ✅ DescribeRegions - List available regions

### OSS (Object Storage Service) APIs

- ✅ ListBuckets - List OSS buckets
- ✅ GetBucketInfo - Get bucket details
- ✅ GetBucketStat - Get bucket statistics

### RDS (Relational Database Service) APIs

- ✅ DescribeDBInstances - List RDS instances
- ✅ DescribeDBInstanceAttribute - Get instance details

### ACK (Alibaba Cloud Container Service for Kubernetes) APIs

- ✅ DescribeClusters - List ACK clusters
- ✅ DescribeClusterDetail - Get cluster details

## Regional Support

Alibaba Cloud operates in multiple regions globally:

### China Mainland
- `cn-hangzhou` - China East 1 (Hangzhou)
- `cn-shanghai` - China East 2 (Shanghai)
- `cn-beijing` - China North 2 (Beijing)
- `cn-shenzhen` - China South 1 (Shenzhen)
- `cn-qingdao` - China North 1 (Qingdao)

### Asia Pacific
- `ap-southeast-1` - Singapore
- `ap-southeast-2` - Australia (Sydney)
- `ap-southeast-3` - Malaysia (Kuala Lumpur)
- `ap-northeast-1` - Japan (Tokyo)
- `ap-south-1` - India (Mumbai)

### Europe & Americas
- `eu-central-1` - Germany (Frankfurt)
- `eu-west-1` - UK (London)
- `us-west-1` - US West (Silicon Valley)
- `us-east-1` - US East (Virginia)

## Best Practices

### 1. Credential Management

Store credentials securely:

```typescript
// Use environment variables
const provider = new AlibabaCloudProvider({
  provider: CloudProvider.ALIBABA_CLOUD,
  credentials: {
    accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
  },
});
```

### 2. Rate Limiting

BSS OpenAPI has rate limits. Implement retry logic:

```typescript
async function getCostsWithRetry(provider, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await provider.getCostBreakdown();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

### 3. Multi-Account Batching

For large multi-account deployments, batch account queries:

```typescript
// Process accounts in batches of 10
const accountBatches = [];
for (let i = 0; i < accountIds.length; i += 10) {
  accountBatches.push(accountIds.slice(i, i + 10));
}

const allCosts = [];
for (const batch of accountBatches) {
  const costs = await provider.getDetailedMultiAccountCostBreakdown({
    accountIds: batch,
  });
  allCosts.push(...costs.accounts);
}
```

### 4. Caching

Cache expensive API calls:

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour

async function getCachedCosts(provider) {
  const cacheKey = 'costs';
  let costs = cache.get(cacheKey);

  if (!costs) {
    costs = await provider.getCostBreakdown();
    cache.set(cacheKey, costs);
  }

  return costs;
}
```

## Error Handling

The provider includes comprehensive error handling:

```typescript
try {
  const costs = await provider.getCostBreakdown();
} catch (error) {
  if (error.code === 'InvalidAccessKeyId.NotFound') {
    console.error('Invalid Access Key ID');
  } else if (error.code === 'SignatureDoesNotMatch') {
    console.error('Invalid Access Key Secret');
  } else if (error.code === 'Throttling') {
    console.error('Rate limit exceeded, retry after delay');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Testing

Mock the provider for testing:

```typescript
import { AlibabaCloudProvider } from './providers/alicloud';

jest.mock('./providers/alicloud/cost', () => ({
  getAccountCostBreakdown: jest.fn().mockResolvedValue({
    accountId: 'test-account',
    thisMonth: 1234.56,
    lastMonth: 1100.00,
    last7Days: 280.00,
    yesterday: 40.00,
    currency: 'CNY',
  }),
}));

test('getCostBreakdown returns costs', async () => {
  const provider = new AlibabaCloudProvider(config);
  const costs = await provider.getCostBreakdown();
  expect(costs.totals.thisMonth).toBe(1234.56);
});
```

## Troubleshooting

### Common Issues

1. **Invalid Credentials**
   - Verify AccessKey ID and Secret are correct
   - Check that the RAM user has appropriate permissions

2. **Region Not Available**
   - Ensure the region ID is correct (e.g., 'cn-hangzhou')
   - Some services may not be available in all regions

3. **BSS API Access**
   - BSS OpenAPI requires special permissions
   - Contact Alibaba Cloud support to enable billing API access

4. **Rate Limiting**
   - Implement exponential backoff
   - Consider caching frequently accessed data

### Required RAM Permissions

Grant these permissions to your RAM user:

```json
{
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bss:QueryBill",
        "bss:QueryAccountBill",
        "bss:QueryInstanceBill",
        "bss:QueryBudget",
        "ecs:Describe*",
        "oss:List*",
        "oss:GetBucket*",
        "rds:Describe*",
        "cs:Describe*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Contributing

When contributing to the Alibaba Cloud provider:

1. Follow the existing code structure
2. Add comprehensive error handling
3. Include JSDoc comments
4. Write unit tests for new features
5. Update this README with new features

## License

MIT

## Support

For issues specific to the Alibaba Cloud provider:
- Open an issue on GitHub
- Tag with `provider:alicloud`
- Include provider version and error logs
