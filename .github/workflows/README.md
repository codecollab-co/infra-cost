# Infra Cost GitHub Action Usage Examples

This directory contains example workflows for using the `infra-cost` GitHub Action in your CI/CD pipelines.

## Quick Start

Add this to your `.github/workflows/cost-analysis.yml`:

```yaml
name: Cost Analysis
on: [pull_request, push]

jobs:
  cost-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Analyze Infrastructure Costs
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          region: us-east-1
          command: now
```

## Basic Examples

### 1. Quick Cost Check on PRs

```yaml
name: PR Cost Check
on: pull_request

jobs:
  cost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Quick Cost Check
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: now
          comment-on-pr: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Free Tier Usage Monitor

```yaml
name: Free Tier Monitor
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  free-tier:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Check Free Tier Usage
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: free-tier
          slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
```

### 3. Cost Gate with Threshold

```yaml
name: Cost Gate
on: pull_request

jobs:
  cost-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Enforce Cost Threshold
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: now
          cost-threshold: 1000
          fail-on-threshold: true
          comment-on-pr: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 4. Fail on Any Cost Increase

```yaml
name: Strict Cost Control
on: pull_request

jobs:
  no-cost-increase:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Block Cost Increases
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: now
          fail-on-increase: true
          comment-on-pr: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Advanced Examples

### 5. Multi-Cloud Cost Analysis

```yaml
name: Multi-Cloud Costs
on:
  schedule:
    - cron: '0 8 * * 1'  # Weekly on Monday

jobs:
  aws:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: AWS Costs
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: cost
          subcommand: breakdown

  gcp:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: GCP Costs
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: gcp
          command: cost
          subcommand: breakdown
          gcp-project-id: ${{ secrets.GCP_PROJECT_ID }}
        env:
          GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}

  azure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Azure Costs
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: azure
          command: cost
          subcommand: breakdown
          azure-subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
          azure-tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          azure-client-id: ${{ secrets.AZURE_CLIENT_ID }}
          azure-client-secret: ${{ secrets.AZURE_CLIENT_SECRET }}
```

### 6. Cost Optimization Recommendations

```yaml
name: Weekly Optimization Report
on:
  schedule:
    - cron: '0 9 * * 1'  # Monday 9 AM

jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Get Optimization Recommendations
        id: optimize
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: optimize
          subcommand: recommendations
          slack-webhook: ${{ secrets.SLACK_WEBHOOK }}

      - name: Check Savings Potential
        if: steps.optimize.outputs.optimization-savings > 100
        run: |
          echo "💡 Potential savings: \$${{ steps.optimize.outputs.optimization-savings }}/month"
```

### 7. Cost Monitoring with Alerts

```yaml
name: Cost Monitoring
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  monitor:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Monitor Costs
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: monitor
          subcommand: alerts
          delta-threshold: 15
          slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
```

### 8. Export Cost Reports

```yaml
name: Monthly Cost Report
on:
  schedule:
    - cron: '0 0 1 * *'  # First day of month

jobs:
  export:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate Cost Report
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: export
          export-format: xlsx

      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: cost-report-${{ github.run_number }}
          path: cost-report.xlsx
```

### 9. Git Cost History Analysis

```yaml
name: Cost History
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  history:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for git analysis

      - name: Analyze Cost History
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: history
          additional-args: '--git --period week'
          comment-on-pr: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 10. Complete PR Cost Analysis

```yaml
name: Comprehensive PR Cost Analysis
on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  cost-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Current Cost
        id: current
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: now
          output-format: json

      - name: Free Tier Check
        id: freetier
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: free-tier

      - name: Optimization Check
        id: optimize
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: optimize
          subcommand: recommendations

      - name: Post Combined Report
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: now
          comment-on-pr: true
          cost-threshold: 1000
          fail-on-increase: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Summary
        run: |
          echo "## 💰 Cost Analysis Summary" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "- Today's Cost: \$${{ steps.current.outputs.today-cost }}" >> $GITHUB_STEP_SUMMARY
          echo "- MTD Cost: \$${{ steps.current.outputs.mtd-cost }}" >> $GITHUB_STEP_SUMMARY
          echo "- Free Tier Usage: ${{ steps.freetier.outputs.free-tier-usage }}%" >> $GITHUB_STEP_SUMMARY
          echo "- Optimization Potential: \$${{ steps.optimize.outputs.optimization-savings }}/month" >> $GITHUB_STEP_SUMMARY
```

## Available Inputs

### Required
- None (all inputs have defaults)

### Provider Configuration
- `provider`: Cloud provider (aws, gcp, azure, alicloud, oracle) - default: `aws`
- `profile`: Cloud provider profile - default: `default`
- `region`: Cloud provider region - default: `us-east-1`

### Commands
- `command`: Command to run - default: `now`
  - `now` - Quick cost snapshot
  - `free-tier` - Free tier usage
  - `cost` - Detailed cost analysis
  - `optimize` - Optimization recommendations
  - `monitor` - Cost monitoring
  - `export` - Export reports
  - `history` - Git cost history
  - `blame` - Cost attribution by author

- `subcommand`: Subcommand for nested commands

### Cost Gates
- `cost-threshold`: Maximum acceptable cost (fail if exceeded)
- `fail-on-increase`: Fail if costs increased - default: `false`
- `fail-on-threshold`: Fail if threshold exceeded - default: `false`

### Output & Notifications
- `output-format`: Output format (text, json) - default: `text`
- `comment-on-pr`: Post results as PR comment - default: `false`
- `slack-webhook`: Slack webhook URL for notifications

### Cloud Credentials
See [Authentication Guide](../../README.md#authentication) for details on setting up credentials.

## Available Outputs

All outputs are available for use in downstream steps:

```yaml
- name: Cost Analysis
  id: costs
  uses: codecollab-co/infra-cost@v1.4.0
  with:
    provider: aws
    command: now

- name: Use Outputs
  run: |
    echo "Today: ${{ steps.costs.outputs.today-cost }}"
    echo "MTD: ${{ steps.costs.outputs.mtd-cost }}"
    echo "Change: ${{ steps.costs.outputs.cost-change }}"
```

### Output Variables
- `today-cost` - Cost for today
- `mtd-cost` - Month-to-date cost
- `ytd-cost` - Year-to-date cost
- `total-cost` - Total cost for analysis period
- `cost-change` - Cost change amount
- `cost-change-percent` - Cost change percentage
- `forecast-cost` - Forecasted cost
- `free-tier-usage` - Free tier usage percentage
- `optimization-savings` - Potential savings
- `report-json` - Full report in JSON
- `exit-code` - Exit code (0 = success)
- `threshold-exceeded` - Whether threshold was exceeded (true/false)

## Best Practices

1. **Use Cost Gates on PRs**: Prevent cost increases before merging
2. **Schedule Regular Checks**: Monitor costs daily or weekly
3. **Set Realistic Thresholds**: Based on your budget and growth
4. **Enable PR Comments**: Make cost visible to all developers
5. **Use Slack Notifications**: Alert teams of significant changes
6. **Track Free Tier**: Avoid unexpected charges
7. **Export Monthly Reports**: Keep historical records
8. **Multi-Cloud Monitoring**: Track all providers separately

## Troubleshooting

### Action Fails with Authentication Error
- Ensure credentials are set in GitHub Secrets
- Verify IAM permissions for cost analysis
- Check credential environment variables are correctly mapped

### PR Comments Not Posting
- Ensure `GITHUB_TOKEN` is provided
- Verify repository permissions allow workflow to comment
- Check `comment-on-pr: true` is set

### Cost Data Seems Incorrect
- Verify correct provider and region
- Check credentials have access to billing data
- Ensure time zone alignment for cost reporting

## Examples Repository

For more examples and templates, visit:
- [Example Workflows](./examples/)
- [Full Documentation](../../README.md)

## Support

- Report issues: https://github.com/codecollab-co/infra-cost/issues
- Documentation: https://github.com/codecollab-co/infra-cost#readme
