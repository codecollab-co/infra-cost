# Alibaba Cloud Provider - Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies

```bash
npm install
```

All required Alibaba Cloud SDKs are already in package.json.

### 2. Set Environment Variables

```bash
export ALIBABA_ACCESS_KEY_ID="your-access-key-id"
export ALIBABA_ACCESS_KEY_SECRET="your-access-key-secret"
export ALIBABA_REGION_ID="cn-hangzhou"
```

### 3. Basic Usage

```typescript
import { AlibabaCloudProvider } from './providers/alicloud';
import { CloudProvider } from './types/providers';

// Create provider
const provider = new AlibabaCloudProvider({
  provider: CloudProvider.ALIBABA_CLOUD,
  credentials: {
    accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
    regionId: process.env.ALIBABA_REGION_ID,
  },
});

// Get costs
const costs = await provider.getCostBreakdown();
console.log('This Month:', costs.totals.thisMonth, 'CNY');

// Get resources
const inventory = await provider.getResourceInventory();
console.log('Total Resources:', inventory.totalResources);
```

## Common Use Cases

### Cost Analysis

```typescript
// Get detailed cost breakdown
const costs = await provider.getCostBreakdown();

console.log('Cost Summary:');
console.log('  This Month: ¥', costs.totals.thisMonth.toFixed(2));
console.log('  Last Month: ¥', costs.totals.lastMonth.toFixed(2));
console.log('  Last 7 Days: ¥', costs.totals.last7Days.toFixed(2));

// Top 5 services by cost
const serviceCosts = Object.entries(costs.totalsByService.thisMonth)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);

console.log('\nTop Services:');
serviceCosts.forEach(([service, cost]) => {
  console.log(`  ${service}: ¥${cost.toFixed(2)}`);
});
```

### Multi-Account Analysis

```typescript
// Aggregate costs across accounts
const provider = new AlibabaCloudProvider({
  provider: CloudProvider.ALIBABA_CLOUD,
  credentials: {
    accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
    accountIds: ['account-1', 'account-2', 'account-3'],
  },
});

const multiCosts = await provider.getDetailedMultiAccountCostBreakdown();

console.log(`Total Accounts: ${multiCosts.accountCount}`);
console.log(`Total Cost: ¥${multiCosts.totals.thisMonth.toFixed(2)}`);

// Per-account breakdown
multiCosts.accounts.forEach(account => {
  console.log(`\n${account.accountName}:`);
  console.log(`  This Month: ¥${account.costs.thisMonth.toFixed(2)}`);
  console.log(`  Change: ${((account.costs.thisMonth - account.costs.lastMonth) / account.costs.lastMonth * 100).toFixed(1)}%`);
});
```

### Resource Inventory

```typescript
// Discover all resources
const inventory = await provider.getResourceInventory({
  includeCosts: true,
});

console.log('Resource Summary:');
console.log(`  Total: ${inventory.totalResources}`);
console.log(`  ECS Instances: ${inventory.resourcesByType.compute}`);
console.log(`  OSS Buckets: ${inventory.resourcesByType.storage}`);
console.log(`  RDS Instances: ${inventory.resourcesByType.database}`);
console.log(`  ACK Clusters: ${inventory.resourcesByType.container}`);
console.log(`  Total Cost: ¥${inventory.totalCost.toFixed(2)}`);

// List ECS instances
console.log('\nECS Instances:');
inventory.resources.compute.forEach(instance => {
  console.log(`  ${instance.name} (${instance.state}) - ${instance.region}`);
  if (instance.costToDate) {
    console.log(`    Cost to Date: ¥${instance.costToDate.toFixed(2)}`);
  }
});
```

### Budget Monitoring

```typescript
// Check budget status
const budgets = await provider.getBudgets();
const alerts = await provider.getBudgetAlerts();

console.log('Budget Status:');
budgets.forEach(budget => {
  const utilization = (budget.actualSpend / budget.budgetLimit * 100).toFixed(1);
  const status = budget.status === 'OK' ? '✓' : '⚠';

  console.log(`${status} ${budget.budgetName}:`);
  console.log(`  Budget: ¥${budget.budgetLimit.toFixed(2)}`);
  console.log(`  Spent: ¥${budget.actualSpend.toFixed(2)} (${utilization}%)`);
  console.log(`  Status: ${budget.status}`);
});

// Active alerts
if (alerts.length > 0) {
  console.log('\nActive Alerts:');
  alerts.forEach(alert => {
    console.log(`[${alert.severity}] ${alert.budgetName}`);
    console.log(`  ${alert.message}`);
  });
}
```

### Filtered Resource Discovery

```typescript
// Production resources in Shanghai
const prodResources = await provider.getResourceInventory({
  regions: ['cn-shanghai'],
  tags: {
    environment: 'production',
  },
  includeCosts: true,
});

console.log('Production Resources (Shanghai):');
console.log(`  Total: ${prodResources.totalResources}`);
console.log(`  Cost: ¥${prodResources.totalCost.toFixed(2)}`);
```

### Cost Optimization

```typescript
// Get recommendations
const recommendations = await provider.getOptimizationRecommendations();

console.log('Cost Optimization Recommendations:');
recommendations.forEach((rec, i) => {
  console.log(`${i + 1}. ${rec}`);
});
```

## Configuration Options

### Single Account

```typescript
{
  provider: CloudProvider.ALIBABA_CLOUD,
  credentials: {
    accessKeyId: 'YOUR_KEY',
    accessKeySecret: 'YOUR_SECRET',
    regionId: 'cn-hangzhou',      // Optional, defaults to cn-hangzhou
    accountId: 'your-account-id',  // Optional
  },
}
```

### Multi-Account (Specific)

```typescript
{
  provider: CloudProvider.ALIBABA_CLOUD,
  credentials: {
    accessKeyId: 'YOUR_KEY',
    accessKeySecret: 'YOUR_SECRET',
    accountIds: ['account-1', 'account-2', 'account-3'],
  },
}
```

### Multi-Account (All)

```typescript
{
  provider: CloudProvider.ALIBABA_CLOUD,
  credentials: {
    accessKeyId: 'YOUR_KEY',
    accessKeySecret: 'YOUR_SECRET',
    allAccounts: true,
  },
}
```

### Custom Endpoint

```typescript
{
  provider: CloudProvider.ALIBABA_CLOUD,
  credentials: {
    accessKeyId: 'YOUR_KEY',
    accessKeySecret: 'YOUR_SECRET',
    endpoint: 'custom.endpoint.com',
  },
}
```

## Available Regions

### China Mainland
- `cn-hangzhou` - Hangzhou (Default)
- `cn-shanghai` - Shanghai
- `cn-beijing` - Beijing
- `cn-shenzhen` - Shenzhen
- `cn-qingdao` - Qingdao

### Asia Pacific
- `ap-southeast-1` - Singapore
- `ap-southeast-2` - Sydney
- `ap-southeast-3` - Kuala Lumpur
- `ap-northeast-1` - Tokyo
- `ap-south-1` - Mumbai

### Europe & Americas
- `eu-central-1` - Frankfurt
- `eu-west-1` - London
- `us-west-1` - Silicon Valley
- `us-east-1` - Virginia

## Error Handling

```typescript
try {
  const costs = await provider.getCostBreakdown();
} catch (error) {
  if (error.code === 'InvalidAccessKeyId.NotFound') {
    console.error('❌ Invalid Access Key ID');
  } else if (error.code === 'SignatureDoesNotMatch') {
    console.error('❌ Invalid Access Key Secret');
  } else {
    console.error('❌ Error:', error.message);
  }
}
```

## Resource Filters

### By Region

```typescript
const resources = await provider.getResourceInventory({
  regions: ['cn-shanghai', 'cn-beijing'],
});
```

### By Tags

```typescript
const resources = await provider.getResourceInventory({
  tags: {
    environment: 'production',
    team: 'backend',
  },
});
```

### With Costs

```typescript
const resources = await provider.getResourceInventory({
  includeCosts: true,
});
```

### Combined

```typescript
const resources = await provider.getResourceInventory({
  regions: ['cn-shanghai'],
  tags: { environment: 'production' },
  includeCosts: true,
});
```

## Best Practices

### 1. Use Environment Variables

```typescript
const provider = new AlibabaCloudProvider({
  provider: CloudProvider.ALIBABA_CLOUD,
  credentials: {
    accessKeyId: process.env.ALIBABA_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_ACCESS_KEY_SECRET,
  },
});
```

### 2. Validate Credentials First

```typescript
const isValid = await provider.validateCredentials();
if (!isValid) {
  throw new Error('Invalid credentials');
}
```

### 3. Cache Results

```typescript
const cache = {};
const cacheKey = 'costs';
const ttl = 3600000; // 1 hour

async function getCachedCosts() {
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < ttl) {
    return cache[cacheKey].data;
  }

  const costs = await provider.getCostBreakdown();
  cache[cacheKey] = { data: costs, timestamp: Date.now() };
  return costs;
}
```

### 4. Handle Rate Limits

```typescript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1 || error.code !== 'Throttling') throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

const costs = await withRetry(() => provider.getCostBreakdown());
```

## Troubleshooting

### Issue: "Invalid Access Key"

**Solution**: Verify your AccessKey ID and Secret are correct.

```bash
echo $ALIBABA_ACCESS_KEY_ID
echo $ALIBABA_ACCESS_KEY_SECRET
```

### Issue: "Permission Denied"

**Solution**: Ensure your RAM user has required permissions:
- `bss:QueryBill`
- `bss:QueryAccountBill`
- `ecs:Describe*`
- `oss:List*`
- `rds:Describe*`
- `cs:Describe*`

### Issue: "Region Not Available"

**Solution**: Check region ID format (e.g., 'cn-hangzhou' not 'hangzhou').

### Issue: "Rate Limit Exceeded"

**Solution**: Implement retry logic with exponential backoff.

## Next Steps

1. Read the full [README.md](./README.md) for detailed documentation
2. Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture details
3. Explore the source code for advanced usage patterns
4. Set up monitoring and alerting based on budget alerts

## Support

For issues or questions:
- GitHub Issues: Tag with `provider:alicloud`
- Include error messages and provider configuration (without credentials)
- Check logs for detailed error information

## API Reference

All methods available in `AlibabaCloudProvider`:

- `validateCredentials()` - Validate AccessKey credentials
- `getAccountInfo()` - Get account information
- `getCostBreakdown()` - Get cost breakdown
- `getRawCostData()` - Get raw cost data by service
- `getResourceInventory(filters?)` - Discover resources
- `getBudgets()` - Get all budgets
- `getBudgetAlerts()` - Get budget alerts
- `getOptimizationRecommendations()` - Get cost optimization tips
- `getDetailedMultiAccountCostBreakdown()` - Multi-account analysis

See [README.md](./README.md) for detailed API documentation.
