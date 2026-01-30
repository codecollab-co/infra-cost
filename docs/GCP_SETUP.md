# Google Cloud Platform Setup Guide

Complete guide for setting up and using infra-cost with Google Cloud Platform.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Authentication Methods](#authentication-methods)
- [BigQuery Billing Export Setup](#bigquery-billing-export-setup)
- [Usage Examples](#usage-examples)
- [Multi-Project Support](#multi-project-support)
- [Advanced Features](#advanced-features)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required GCP Services
- **Cloud Resource Manager API** - For project information
- **BigQuery API** - For billing data queries
- **Cloud Billing API** - For billing account information

### Enable APIs
```bash
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable bigquery.googleapis.com
gcloud services enable cloudbilling.googleapis.com
```

### IAM Permissions
Your service account or user account needs these permissions:

**Minimum Required Permissions:**
```yaml
- resourcemanager.projects.get     # Read project information
- bigquery.jobs.create             # Execute BigQuery queries
- bigquery.tables.getData          # Read billing export tables
- billing.accounts.get             # Read billing account info (optional)
```

**Recommended IAM Roles:**
- `roles/bigquery.user` - For running queries
- `roles/resourcemanager.projectViewer` - For project access
- Custom role for minimal permissions (see below)

### Create Custom IAM Role
```bash
gcloud iam roles create InfraCostAnalysis \
  --project=YOUR_PROJECT_ID \
  --title="Infra-Cost Analysis" \
  --description="Minimal permissions for infra-cost" \
  --permissions=resourcemanager.projects.get,bigquery.jobs.create,bigquery.tables.getData \
  --stage=GA
```

## Authentication Methods

### 1. Service Account Key File (Recommended for CI/CD)

#### Create Service Account
```bash
# Create service account
gcloud iam service-accounts create infra-cost-analyzer \
  --display-name="Infra-Cost Analyzer" \
  --description="Service account for infra-cost tool"

# Grant necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:infra-cost-analyzer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.user"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:infra-cost-analyzer@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/resourcemanager.projectViewer"

# Create and download key
gcloud iam service-accounts keys create ~/infra-cost-key.json \
  --iam-account=infra-cost-analyzer@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### Use with infra-cost
```bash
export GOOGLE_APPLICATION_CREDENTIALS=~/infra-cost-key.json
export GOOGLE_PROJECT_ID=YOUR_PROJECT_ID

infra-cost cost analyze --provider gcp
```

### 2. Application Default Credentials (ADC)

Best for local development with your personal account.

```bash
# Authenticate with your Google account
gcloud auth application-default login

# Set default project
gcloud config set project YOUR_PROJECT_ID

# Run infra-cost
infra-cost cost analyze --provider gcp --project-id YOUR_PROJECT_ID
```

### 3. Command-Line Arguments

```bash
infra-cost cost analyze \
  --provider gcp \
  --project-id YOUR_PROJECT_ID \
  --key-file /path/to/service-account.json
```

### 4. Configuration File

```bash
# Initialize configuration
infra-cost config init

# Edit ~/.infra-cost/config.json
{
  "provider": "gcp",
  "credentials": {
    "projectId": "YOUR_PROJECT_ID",
    "keyFilePath": "~/infra-cost-key.json",
    "billingDatasetId": "billing_export",
    "billingTableId": "gcp_billing_export"
  }
}

# Run with config file
infra-cost cost analyze
```

## BigQuery Billing Export Setup

**CRITICAL:** infra-cost requires BigQuery billing export to be enabled. This is the only way to get detailed, granular cost data from GCP.

### Why BigQuery Export?

Unlike AWS Cost Explorer API, GCP does not provide a direct API for detailed cost queries. Instead, GCP exports billing data to BigQuery, which provides:
- **Granular cost data** by service, SKU, project, and resource
- **Real-time updates** (typically within 24 hours)
- **Historical data** retention
- **Flexible querying** with standard SQL
- **Cost-effective** (BigQuery queries are cheap)

### Enable Billing Export

#### Step 1: Navigate to Billing Console
1. Go to [GCP Console](https://console.cloud.google.com)
2. Navigate to **Billing** (hamburger menu → Billing)
3. Select your billing account
4. Click **Billing export** in the left sidebar

#### Step 2: Enable BigQuery Export
1. Click **Edit Settings** under "BigQuery Export"
2. Select or create a dataset:
   - **Project ID:** Select a project to host the dataset
   - **Dataset name:** Use `billing_export` (default) or custom name
   - **Location:** Choose a location (US, EU, etc.)
3. Click **Save**

#### Step 3: Wait for Data
- Initial export typically takes **24-48 hours**
- After that, data is updated daily (usually within 24 hours)
- Historical data is backfilled automatically

#### Step 4: Verify Export
```bash
# List datasets
bq ls --project_id=YOUR_PROJECT_ID

# Check for billing export table
bq ls --project_id=YOUR_PROJECT_ID billing_export

# Query sample data
bq query --project_id=YOUR_PROJECT_ID \
  'SELECT COUNT(*) FROM `YOUR_PROJECT_ID.billing_export.gcp_billing_export_*` LIMIT 1'
```

### Custom Dataset/Table Names

If you use custom names for your billing dataset or table:

```bash
infra-cost cost analyze \
  --provider gcp \
  --project-id YOUR_PROJECT_ID \
  --billing-dataset custom_billing \
  --billing-table custom_export_table
```

Or in config file:
```json
{
  "provider": "gcp",
  "credentials": {
    "projectId": "YOUR_PROJECT_ID",
    "billingDatasetId": "custom_billing",
    "billingTableId": "custom_export_table"
  }
}
```

## Usage Examples

### Basic Cost Analysis

```bash
# Analyze costs for current month
infra-cost cost analyze --provider gcp --project-id my-project

# Show cost breakdown by service
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --output fancy

# Export to JSON
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --output json > costs.json

# Get resource inventory
infra-cost export inventory json \
  --provider gcp \
  --project-id my-project

# Check budget status
infra-cost monitor budgets \
  --provider gcp \
  --project-id my-project \
  --billing-account-id 012345-ABCDEF-678901
```

### Cost Trends and Comparisons

```bash
# Show cost trends over last 30 days
infra-cost cost trends \
  --provider gcp \
  --project-id my-project \
  --period 30d

# Compare costs across time periods
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --show-delta

# Filter by specific currency
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --currency USD
```

### Date Range Queries

```bash
# Custom date range
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --start-date 2026-01-01 \
  --end-date 2026-01-31

# Last 7 days
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --period 7d
```

## Multi-Project Support

### List Accessible Projects

```bash
# List all projects you have access to
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --list-projects

# List only active projects
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --list-projects \
  --active-only
```

### Analyze Multiple Projects

**Using Configuration File:**
```json
{
  "provider": "gcp",
  "credentials": {
    "projectId": "my-main-project",
    "keyFilePath": "~/service-account.json",
    "allProjects": true
  }
}
```

**Using Specific Project IDs:**
```json
{
  "provider": "gcp",
  "credentials": {
    "projectId": "my-main-project",
    "keyFilePath": "~/service-account.json",
    "projectIds": ["project-1", "project-2", "project-3"]
  }
}
```

**Command Line:**
```bash
# Aggregate costs from all accessible projects
infra-cost cost analyze --provider gcp --all-projects

# Specific projects
infra-cost cost analyze \
  --provider gcp \
  --projects project-1,project-2,project-3

# Get detailed per-project breakdown
infra-cost cost analyze \
  --provider gcp \
  --all-projects \
  --detailed
```

### Organization-Level Cost Aggregation

**Configuration File:**
```json
{
  "provider": "gcp",
  "credentials": {
    "projectId": "my-main-project",
    "keyFilePath": "~/service-account.json",
    "organizationId": "123456789"
  }
}
```

**Command Line:**
```bash
# Organization-wide costs
infra-cost cost analyze \
  --provider gcp \
  --organization-id 123456789

# Show organization hierarchy with costs
infra-cost cost analyze \
  --provider gcp \
  --organization-id 123456789 \
  --show-hierarchy

# Export organization cost report
infra-cost export inventory json \
  --provider gcp \
  --organization-id 123456789 \
  --output org-costs.json
```

### Folder-Level Cost Aggregation

**Configuration File:**
```json
{
  "provider": "gcp",
  "credentials": {
    "projectId": "my-main-project",
    "keyFilePath": "~/service-account.json",
    "folderId": "987654321"
  }
}
```

**Command Line:**
```bash
# Folder-level costs
infra-cost cost analyze \
  --provider gcp \
  --folder-id 987654321

# Multiple folders
infra-cost cost analyze \
  --provider gcp \
  --folder-ids prod-folder,dev-folder,staging-folder
```

## Advanced Features

### Multi-Currency Support

infra-cost automatically detects and handles multiple currencies in your billing data:

```bash
# Costs are automatically grouped by currency
# Warning shown if multiple currencies detected
infra-cost cost analyze --provider gcp --project-id my-project

# Filter to specific currency
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --currency EUR
```

**Output example:**
```
Service                    | This Month | Last Month
---------------------------|------------|------------
Compute Engine (USD)       | $1,234.56  | $1,100.00
Compute Engine (EUR)       | €987.65    | €950.00
Cloud Storage (USD)        | $234.56    | $220.00
```

### Pagination for Large Datasets

For projects with large billing datasets:

```bash
# Limit results
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --max-results 1000

# Paginated queries (with page token)
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --max-results 1000 \
  --page-token TOKEN_FROM_PREVIOUS_QUERY
```

### Cost Optimization Recommendations

```bash
# Get GCP-specific optimization recommendations
infra-cost optimize recommendations \
  --provider gcp \
  --project-id my-project

# Current recommendations:
# - Enable BigQuery billing export for detailed analysis
# - Consider Committed Use Discounts for predictable workloads
# - Review Cloud Storage lifecycle policies
# - Use Preemptible VMs for fault-tolerant workloads (up to 80% savings)
```

## Troubleshooting

### Common Issues

#### 1. "BigQuery billing export not found"

**Error:**
```
Error: BigQuery billing export not found. Please enable billing export to BigQuery
```

**Solution:**
1. Enable BigQuery billing export (see [BigQuery Billing Export Setup](#bigquery-billing-export-setup))
2. Wait 24-48 hours for initial data
3. Verify dataset and table names match configuration

#### 2. "Access denied to project"

**Error:**
```
Error: Access denied to project my-project. Ensure your credentials have 'resourcemanager.projects.get' permission.
```

**Solution:**
1. Verify service account has necessary permissions
2. Check IAM roles: `roles/resourcemanager.projectViewer` or equivalent
3. Ensure project ID is correct

#### 3. "Failed to get billing account"

**Error:**
```
Warning: Failed to get billing account: Permission denied
```

**Solution:**
- This is a warning, not a critical error
- Add `billing.accounts.get` permission if you need billing account info
- infra-cost can still analyze costs without this permission

#### 4. "Project not active"

**Warning:**
```
⚠️  Warning: Project my-project is in state: DELETE_REQUESTED
```

**Solution:**
- The project is being deleted or is suspended
- Verify project status in GCP Console
- Choose a different active project

#### 5. "Multiple currencies detected"

**Warning:**
```
⚠️  Multiple currencies detected in billing data: USD, EUR, GBP
```

**Solution:**
- This is informational, not an error
- Costs are automatically grouped by currency
- Use `--currency` flag to filter to specific currency if needed

### Debugging Tips

#### Enable Verbose Logging
```bash
# Set log level to debug
export LOG_LEVEL=debug
infra-cost cost analyze --provider gcp --project-id my-project

# Or use verbose flag
infra-cost cost analyze --provider gcp --project-id my-project --verbose
```

#### Validate Credentials
```bash
# Test authentication
gcloud auth application-default print-access-token

# Verify project access
gcloud projects describe YOUR_PROJECT_ID

# Test BigQuery access
bq ls --project_id=YOUR_PROJECT_ID billing_export
```

#### Check API Quotas
```bash
# View BigQuery quota usage
gcloud alpha billing quotas list \
  --service=bigquery.googleapis.com \
  --project=YOUR_PROJECT_ID
```

## Performance Optimization

### Query Optimization

1. **Use Date Filters:** Always specify date ranges to avoid scanning entire dataset
   ```bash
   infra-cost cost analyze --provider gcp --start-date 2026-01-01 --end-date 2026-01-31
   ```

2. **Pagination:** Use pagination for large datasets
   ```bash
   infra-cost cost analyze --provider gcp --max-results 10000
   ```

3. **Currency Filter:** Filter to single currency if analyzing multi-currency data
   ```bash
   infra-cost cost analyze --provider gcp --currency USD
   ```

### BigQuery Cost Optimization

- **Partitioned Tables:** BigQuery billing export uses partitioned tables by default (optimized)
- **Query Cost:** Typical query costs < $0.01 per run
- **Cache:** Results are cached for 24 hours by default

## CI/CD Integration

### GitHub Actions

```yaml
name: GCP Cost Analysis
on:
  schedule:
    - cron: '0 9 * * 1'  # Weekly on Monday

jobs:
  cost-analysis:
    runs-on: ubuntu-latest
    steps:
      - name: Analyze GCP Costs
        run: |
          npx infra-cost cost analyze \
            --provider gcp \
            --project-id ${{ secrets.GCP_PROJECT_ID }} \
            --key-file <(echo "${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}")
```

### GitLab CI

```yaml
gcp-cost-analysis:
  script:
    - echo "$GCP_SERVICE_ACCOUNT_KEY" > key.json
    - npx infra-cost cost analyze \
        --provider gcp \
        --project-id $GCP_PROJECT_ID \
        --key-file key.json
  only:
    - schedules
```

## Complete Examples

### Example 1: Single Project Cost Analysis

```bash
# Set up environment
export GOOGLE_APPLICATION_CREDENTIALS=~/gcp-key.json
export GOOGLE_PROJECT_ID=my-production-project

# Analyze current month costs
infra-cost cost analyze --provider gcp

# Get detailed cost breakdown with trends
infra-cost cost trends --provider gcp --period 90d

# Export to JSON for further analysis
infra-cost cost analyze --provider gcp --output json > costs.json
```

### Example 2: Multi-Project Cost Aggregation

```bash
# Create config file
cat > ~/.infra-cost/config.json <<EOF
{
  "provider": "gcp",
  "credentials": {
    "projectId": "my-main-project",
    "keyFilePath": "~/gcp-key.json",
    "projectIds": [
      "prod-backend",
      "prod-frontend",
      "prod-data"
    ],
    "billingDatasetId": "billing_export",
    "billingTableId": "gcp_billing_export"
  }
}
EOF

# Analyze all specified projects
infra-cost cost analyze

# Get per-project breakdown
infra-cost cost analyze --detailed --output json > multi-project-costs.json
```

### Example 3: Organization-Wide Cost Report

```bash
# Organization-level configuration
cat > ~/.infra-cost/config.json <<EOF
{
  "provider": "gcp",
  "credentials": {
    "projectId": "org-admin-project",
    "keyFilePath": "~/org-admin-key.json",
    "organizationId": "123456789"
  }
}
EOF

# Get organization-wide costs
infra-cost cost analyze --show-hierarchy

# Export full report
infra-cost export inventory json --output org-report.json
```

### Example 4: Resource Inventory with Costs

```bash
# Get all resources across compute, storage, and databases
infra-cost export inventory json \
  --provider gcp \
  --project-id my-project \
  --include-costs \
  --output inventory.json

# Filter by region
infra-cost export inventory json \
  --provider gcp \
  --project-id my-project \
  --regions us-central1,us-east1 \
  --output us-inventory.json

# Filter by tags
infra-cost export inventory json \
  --provider gcp \
  --project-id my-project \
  --tags environment=production,team=backend \
  --output prod-backend-inventory.json
```

### Example 5: Budget Monitoring and Alerts

```bash
# Check all budgets
infra-cost monitor budgets \
  --provider gcp \
  --project-id my-project \
  --billing-account-id 012345-ABCDEF-678901

# Get budget alerts
infra-cost monitor alerts \
  --provider gcp \
  --project-id my-project \
  --billing-account-id 012345-ABCDEF-678901

# Export budget status
infra-cost monitor budgets \
  --provider gcp \
  --project-id my-project \
  --billing-account-id 012345-ABCDEF-678901 \
  --output json > budget-status.json
```

### Example 6: Scheduled Cost Reports

**Daily Cost Report Script:**
```bash
#!/bin/bash
# daily-cost-report.sh

DATE=$(date +%Y-%m-%d)
REPORT_DIR=~/cost-reports/gcp

# Create report directory
mkdir -p $REPORT_DIR

# Generate cost report
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --output json > $REPORT_DIR/costs-$DATE.json

# Generate resource inventory
infra-cost export inventory json \
  --provider gcp \
  --project-id my-project \
  --include-costs \
  --output $REPORT_DIR/inventory-$DATE.json

# Check for budget alerts
infra-cost monitor alerts \
  --provider gcp \
  --project-id my-project \
  --billing-account-id 012345-ABCDEF-678901 \
  --output json > $REPORT_DIR/alerts-$DATE.json

# Send to Slack if alerts exist
if [ -s $REPORT_DIR/alerts-$DATE.json ]; then
  # Post to Slack (requires slack webhook)
  curl -X POST $SLACK_WEBHOOK_URL \
    -H 'Content-Type: application/json' \
    -d "{\"text\":\"⚠️ GCP Budget Alerts - $DATE\", \"attachments\":[{\"text\":\"\$(cat $REPORT_DIR/alerts-$DATE.json)\"}]}"
fi

echo "✅ Cost report generated: $REPORT_DIR/costs-$DATE.json"
```

**Cron Schedule:**
```bash
# Add to crontab
crontab -e

# Run daily at 9 AM
0 9 * * * /path/to/daily-cost-report.sh
```

### Example 7: Multi-Project Cost Comparison

```bash
# Compare costs across environments
infra-cost cost compare \
  --provider gcp \
  --projects prod-project,staging-project,dev-project \
  --output fancy

# Compare by service
infra-cost cost compare \
  --provider gcp \
  --projects prod-project,staging-project \
  --group-by service \
  --output json > cost-comparison.json
```

### Example 8: Integration with CI/CD

**GitHub Actions - PR Cost Check:**
```yaml
name: GCP Cost Check on PR
on:
  pull_request:
    branches: [main]

jobs:
  cost-check:
    runs-on: ubuntu-latest
    steps:
      - name: Setup credentials
        run: |
          echo "${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}" > /tmp/gcp-key.json

      - name: Analyze costs
        id: cost-analysis
        run: |
          COSTS=$(npx infra-cost cost analyze \
            --provider gcp \
            --project-id ${{ secrets.GCP_PROJECT_ID }} \
            --key-file /tmp/gcp-key.json \
            --output json)

          THIS_MONTH=$(echo $COSTS | jq -r '.totals.thisMonth')
          LAST_MONTH=$(echo $COSTS | jq -r '.totals.lastMonth')

          echo "this_month=$THIS_MONTH" >> $GITHUB_OUTPUT
          echo "last_month=$LAST_MONTH" >> $GITHUB_OUTPUT

      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const thisMonth = '${{ steps.cost-analysis.outputs.this_month }}';
            const lastMonth = '${{ steps.cost-analysis.outputs.last_month }}';
            const change = ((thisMonth - lastMonth) / lastMonth * 100).toFixed(2);

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 💰 GCP Cost Analysis\n\n` +
                    `- **This Month:** $${thisMonth}\n` +
                    `- **Last Month:** $${lastMonth}\n` +
                    `- **Change:** ${change}%`
            });
```

## Best Practices

1. **Use Service Accounts for Automation:** Create dedicated service accounts with minimal permissions
2. **Enable Billing Export Early:** Set up BigQuery export before you need it (takes 24-48 hours)
3. **Organize by Projects:** Use GCP projects to logically separate environments and teams
4. **Label Resources:** Use labels for better cost attribution and filtering
5. **Monitor Costs Regularly:** Set up scheduled reports (daily/weekly)
6. **Review Recommendations:** Check optimization recommendations quarterly
7. **Multi-Project Analysis:** Aggregate costs across projects for organization-wide visibility
8. **Automate Budget Alerts:** Set up automated alerts for budget threshold breaches
9. **Track Trends:** Monitor cost trends over time to identify anomalies
10. **Regular Audits:** Review resource inventory monthly to identify unused resources

## Security Considerations

1. **Protect Service Account Keys:** Never commit keys to version control
2. **Use Secret Management:** Store keys in GitHub Secrets, GitLab CI/CD variables, etc.
3. **Rotate Keys Regularly:** Rotate service account keys every 90 days
4. **Principle of Least Privilege:** Only grant necessary permissions
5. **Audit Access:** Review IAM permissions regularly
6. **Use Workload Identity:** For GKE workloads, use Workload Identity instead of service account keys

## Support

For issues specific to GCP integration:
- 📋 [GitHub Issues](https://github.com/codecollab-co/infra-cost/issues)
- 📧 Email: support@codecollab.co
- 💬 [GitHub Discussions](https://github.com/codecollab-co/infra-cost/discussions)

## References

- [GCP Billing Export Documentation](https://cloud.google.com/billing/docs/how-to/export-data-bigquery)
- [BigQuery API Documentation](https://cloud.google.com/bigquery/docs)
- [GCP IAM Permissions](https://cloud.google.com/iam/docs/permissions-reference)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-service-accounts)
