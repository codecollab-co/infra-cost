# 💰 infra-cost

<div align="center">

**Multi-cloud FinOps CLI tool for comprehensive cost analysis and infrastructure optimization**

[![npm version](https://badge.fury.io/js/infra-cost.svg)](https://badge.fury.io/js/infra-cost.svg)
[![Downloads](https://img.shields.io/npm/dm/infra-cost.svg)](https://npmjs.org/package/infra-cost)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/codecollab-co/infra-cost)](https://github.com/codecollab-co/infra-cost/issues)
[![GitHub stars](https://img.shields.io/github/stars/codecollab-co/infra-cost)](https://github.com/codecollab-co/infra-cost/stargazers)

*Take control of your cloud costs across AWS, Google Cloud, Azure, Alibaba Cloud, and Oracle Cloud* 🚀

[Installation](#-installation) • [Quick Start](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Development](#-development) • [Contributing](#-contributing)

</div>

---

> **📢 Migrating from v0.x?**
> infra-cost v1.0 introduces a new subcommand-based CLI architecture for better organization and discoverability.
>
> - **Quick migration:** Run `infra-cost config migrate` to automatically update your configuration
> - **Command changes:** Old flags are now organized subcommands (e.g., `--inventory` → `export inventory json`)
> - **Full guide:** See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for complete migration instructions
>
> All new features and improvements are built on this solid foundation!

---

## 🎯 Why infra-cost?

**Save money. Optimize resources. Make informed decisions.**

- 💸 **Reduce cloud spend** by up to 30% with actionable insights
- 🔍 **Multi-cloud visibility** - see costs across all your providers in one place
- ⚡ **Real-time analysis** - get instant cost breakdowns and trends
- 🤖 **AI-powered recommendations** for optimization opportunities
- 📊 **Executive reports** - beautiful PDF reports for stakeholders
- 🔔 **Smart alerting** - proactive cost anomaly detection
- 💬 **Team collaboration** - Slack integration for cost awareness

## 🚀 Features

### 🌐 **Multi-Cloud Support**
- **AWS** ✅ (Full support with Cost Explorer integration)
- **Google Cloud** ✅ (BigQuery billing export, multi-project support)
- **Microsoft Azure** 🚧 (Architecture ready, coming soon)
- **Alibaba Cloud** 🚧 (Architecture ready, coming soon)
- **Oracle Cloud** 🚧 (Architecture ready, coming soon)

### 📊 **Comprehensive Analytics**
- **Cost Forecasting** - AI-powered predictions for future spending
- **Budget Monitoring** - Track against budgets with smart alerts
- **Resource Rightsizing** - ML recommendations for optimal instance sizes
- **Sustainability Analysis** - Carbon footprint tracking and green recommendations
- **Security Cost Analysis** - Security posture vs. cost optimization
- **Anomaly Detection** - AI-powered cost spike identification

### 🎛️ **Advanced Features**
- **Interactive Dashboards** - Rich terminal UI with real-time data
- **PDF Report Generation** - Executive summaries and technical deep-dives
- **Cross-Cloud Optimization** - Find the best provider for each workload
- **Automated Optimization** - Execute cost-saving actions automatically
- **Audit Logging** - Comprehensive compliance tracking
- **Enterprise Multi-tenancy** - Team and organization management

### 🔧 **Developer Experience**
- **Multiple output formats**: Fancy tables, plain text, JSON, CSV, Excel
- **Flexible authentication**: Environment variables, IAM roles, profiles
- **CI/CD Integration**: GitHub Actions, Jenkins, GitLab CI
- **API Server**: REST endpoints for custom integrations
- **Webhook Support**: Real-time notifications and integrations

## 📖 CLI Commands Overview

infra-cost v1.0 uses a modern subcommand-based architecture for better organization and discoverability.

### Command Migration Table

| Command Usage | Old Command (v0.x) | New Command (v1.0) |
|--------------|-------------------|-------------------|
| **Cost Analysis** |
| Default cost analysis | `infra-cost` | `infra-cost cost analyze` |
| Show cost deltas | `infra-cost --delta` | `infra-cost cost analyze --show-delta` |
| Cost trends | `infra-cost --trends 30` | `infra-cost cost trends --period 30d` |
| Compare clouds | `infra-cost --compare-clouds aws,gcp` | `infra-cost cost compare --providers aws,gcp` |
| Forecast costs | `infra-cost --forecast 30` | `infra-cost cost forecast --days 30` |
| **Optimization** |
| Optimization recommendations | `infra-cost --finops` | `infra-cost optimize recommendations` |
| Quick wins | `infra-cost --quick-wins` | `infra-cost optimize quickwins` |
| Rightsizing | `infra-cost --rightsize` | `infra-cost optimize rightsizing` |
| Cross-cloud optimization | `infra-cost --optimization-report` | `infra-cost optimize cross-cloud` |
| **Monitoring & Alerts** |
| Cost alerts | `infra-cost --alerts` | `infra-cost monitor alerts` |
| Budget monitoring | `infra-cost --budgets` | `infra-cost monitor budgets` |
| Real-time monitoring | `infra-cost --monitor` | `infra-cost monitor watch` |
| Anomaly detection | `infra-cost --anomaly-detect` | `infra-cost monitor anomaly` |
| **Export & Reports** |
| Export inventory (JSON) | `infra-cost --inventory` | `infra-cost export inventory json` |
| Export inventory (CSV) | `infra-cost --inventory-export csv` | `infra-cost export inventory csv` |
| Export inventory (Excel) | `infra-cost --inventory-export xlsx` | `infra-cost export inventory xlsx` |
| Export inventory (PDF) | `infra-cost --inventory-export pdf` | `infra-cost export inventory pdf` |
| **AWS Organizations** |
| List accounts | `infra-cost --organizations` | `infra-cost organizations list` |
| Organization summary | `infra-cost --organizations-summary` | `infra-cost organizations summary` |
| Daily costs | `infra-cost --organizations-daily` | `infra-cost organizations daily` |
| **Chargeback** |
| Chargeback report | `infra-cost --chargeback` | `infra-cost chargeback report` |
| Send to Slack | `infra-cost --chargeback-slack` | `infra-cost chargeback slack` |
| **Dashboards** |
| Interactive dashboard | `infra-cost --dashboard` | `infra-cost dashboard interactive` |
| Multi-cloud dashboard | `infra-cost --dashboard-multicloud` | `infra-cost dashboard multicloud` |
| **Configuration** |
| Show configuration | `infra-cost --config-status` | `infra-cost config show` |
| Generate configuration | `infra-cost --config-generate` | `infra-cost config init` |
| Validate configuration | `infra-cost --config-validate` | `infra-cost config validate` |
| Migrate configuration | N/A (new in v1.0) | `infra-cost config migrate` |

### Available Command Groups

- **`cost`** - Cost analysis, trends, comparisons, and forecasting
- **`optimize`** - Optimization recommendations and analysis
- **`monitor`** - Alerts, budgets, and anomaly detection
- **`export`** - Export data in multiple formats
- **`organizations`** - AWS Organizations multi-account support
- **`chargeback`** - Cost allocation and reporting
- **`config`** - Configuration management
- **`dashboard`** - Interactive dashboards

**Get help for any command:**
```bash
infra-cost --help
infra-cost cost --help
infra-cost cost analyze --help
```

## 📦 Installation

### npm (Recommended)
```bash
npm install -g infra-cost
```

### Homebrew (macOS/Linux)
```bash
brew tap codecollab-co/tap
brew install infra-cost
```

### npx (No installation required)
```bash
npx infra-cost
```

### Docker
```bash
docker run --rm codecollab-co/infra-cost --help
```

### GitHub Action
```yaml
- uses: codecollab-co/infra-cost@v0.3.0
  with:
    provider: aws
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 🎯 Quick Start

### 1. Basic AWS Cost Analysis
```bash
# Analyze costs with default AWS credentials
infra-cost cost analyze

# Show cost trends over time
infra-cost cost trends --period 30d

# Compare costs across multiple providers
infra-cost cost compare --providers aws,gcp
```

### 2. Google Cloud Platform Cost Analysis
```bash
# Analyze GCP costs with service account
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --key-file /path/to/service-account.json

# List all accessible GCP projects
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --list-projects

# Analyze costs with custom billing dataset
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --billing-dataset custom_billing \
  --billing-table custom_table

# Compare costs across multiple GCP projects
infra-cost cost compare \
  --provider gcp \
  --projects project-1,project-2,project-3
```

### 3. Optimization & Recommendations
```bash
# Get AI-powered optimization recommendations
infra-cost optimize recommendations

# Find quick wins for immediate savings
infra-cost optimize quickwins

# Get rightsizing recommendations
infra-cost optimize rightsizing
```

### 4. Monitoring & Alerts
```bash
# Check cost alerts and budget status
infra-cost monitor alerts

# Monitor budgets
infra-cost monitor budgets

# Detect cost anomalies
infra-cost monitor anomaly
```

### 5. Team Collaboration
```bash
# Send cost report to Slack
infra-cost chargeback slack

# Generate chargeback report
infra-cost chargeback report

# Interactive dashboard
infra-cost dashboard interactive
```

## 🔐 Authentication

### AWS Authentication (Multiple Methods)

#### 1. Environment Variables (Recommended)
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
infra-cost cost analyze
```

#### 2. AWS Profiles
```bash
# Use default profile
infra-cost cost analyze

# Use specific profile
infra-cost cost analyze --profile production

# Discover available profiles
infra-cost config show --discover-profiles
```

#### 3. IAM Roles (EC2/Lambda/ECS)
```bash
# Automatically uses attached IAM role
infra-cost cost analyze
```

#### 4. AWS SSO
```bash
aws sso login --profile my-sso-profile
infra-cost cost analyze --profile my-sso-profile
```

#### 5. Configuration File
```bash
# Initialize configuration
infra-cost config init

# Validate configuration
infra-cost config validate

# Show current configuration
infra-cost config show
```

### Google Cloud Platform Authentication

#### 1. Service Account Key File (Recommended)
```bash
# Download service account key from GCP Console
# IAM & Admin > Service Accounts > Create Key (JSON)

export GOOGLE_PROJECT_ID=your-project-id
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
infra-cost cost analyze --provider gcp
```

#### 2. Application Default Credentials (ADC)
```bash
# Authenticate with gcloud CLI
gcloud auth application-default login

# Set default project
gcloud config set project your-project-id

# Run infra-cost
infra-cost cost analyze --provider gcp --project-id your-project-id
```

#### 3. Command-Line Arguments
```bash
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --key-file /path/to/service-account.json
```

#### 4. Configuration File
```bash
# Initialize configuration with GCP
infra-cost config init

# Edit ~/.infra-cost/config.json
{
  "provider": "gcp",
  "credentials": {
    "projectId": "my-project",
    "keyFilePath": "/path/to/service-account.json",
    "billingDatasetId": "billing_export",
    "billingTableId": "gcp_billing_export"
  }
}
```

#### GCP Permissions Required
Your service account needs the following IAM permissions:
- `resourcemanager.projects.get` - Read project information
- `bigquery.jobs.create` - Query billing data
- `bigquery.tables.getData` - Read billing tables

**Recommended IAM Role:** `roles/bigquery.user` + custom role for project access

#### Enable BigQuery Billing Export
infra-cost requires BigQuery billing export to be enabled:

1. Go to [GCP Billing Console](https://console.cloud.google.com/billing)
2. Select your billing account
3. Navigate to "Billing export"
4. Enable "BigQuery export"
5. Configure dataset (default: `billing_export`)
6. Wait 24 hours for initial data

### Multi-Cloud Setup

```bash
# Google Cloud Platform
infra-cost cost analyze --provider gcp --project-id my-project --key-file service-account.json

# Microsoft Azure (Coming Soon)
infra-cost cost analyze --provider azure --subscription-id sub-id --tenant-id tenant-id

# Oracle Cloud (Coming Soon)
infra-cost cost analyze --provider oracle --user-id user-ocid --tenancy-id tenancy-ocid

# Cross-cloud comparison
infra-cost cost compare --providers aws,gcp

# Cross-cloud optimization report (Coming Soon)
infra-cost optimize cross-cloud
```

## 📊 Output Examples

### Default Rich Terminal UI
```bash
infra-cost cost analyze --output fancy
```
![Cost Analysis](./.github/images/aws-cost.png)

### Export Options
```bash
# Export inventory to JSON
infra-cost export inventory json

# Export to CSV
infra-cost export inventory csv

# Export to Excel
infra-cost export inventory xlsx

# Export to PDF
infra-cost export inventory pdf
```

### JSON for Automation
```bash
infra-cost cost analyze --output json
```

### Interactive Dashboard
```bash
# Launch interactive terminal dashboard
infra-cost dashboard interactive

# Multi-cloud dashboard
infra-cost dashboard multicloud
```

## 💬 Slack Integration

### Enhanced Team Collaboration
- **Rich cost breakdowns** with visual charts
- **Proactive alerts** for budget overruns and anomalies
- **Automated workflows** for approval processes
- **Team cost awareness** with regular updates

### Setup & Usage
```bash
# Configure Slack credentials (one-time setup)
export SLACK_TOKEN=xoxb-your-token
export SLACK_CHANNEL="#finops"

# Send chargeback report to Slack
infra-cost chargeback slack

# Or provide inline
infra-cost chargeback slack --slack-token xoxb-your-token --slack-channel "#finops"
```

### Automated Daily Reports
```yaml
name: Daily FinOps Report
on:
  schedule:
    - cron: '0 9 * * 1-5'  # Weekdays 9 AM UTC
jobs:
  cost-report:
    runs-on: ubuntu-latest
    steps:
      - run: |
          npx infra-cost chargeback slack \
            --slack-token ${{ secrets.SLACK_TOKEN }} \
            --slack-channel ${{ secrets.SLACK_CHANNEL }}
```

## 🤖 GitHub Actions Integration

**infra-cost** is available as a GitHub Action on the [GitHub Marketplace](https://github.com/marketplace/actions/infra-cost-multi-cloud-finops-analysis), making it easy to integrate cost analysis into your CI/CD workflows.

### Basic Usage
```yaml
name: Cost Analysis
on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: codecollab-co/infra-cost@v0.3.0
        with:
          provider: aws
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          analysis-type: summary
```

### PR Cost Check with Comments
```yaml
name: PR Cost Check
on:
  pull_request:
    branches: [main]

jobs:
  cost-check:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: codecollab-co/infra-cost@v0.3.0
        with:
          provider: aws
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          analysis-type: delta
          delta-threshold: '10'
          comment-on-pr: 'true'
```

### Daily Cost Report to Slack
```yaml
name: Daily Cost Report
on:
  schedule:
    - cron: '0 9 * * *'

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: codecollab-co/infra-cost@v0.3.0
        with:
          provider: aws
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          analysis-type: finops
          slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
```

### Action Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `provider` | Cloud provider (aws, gcp, azure, alicloud, oracle) | `aws` |
| `profile` | Cloud provider profile | `default` |
| `region` | Cloud provider region | `us-east-1` |
| `aws-access-key-id` | AWS Access Key ID | - |
| `aws-secret-access-key` | AWS Secret Access Key | - |
| `analysis-type` | Type of analysis (summary, detailed, delta, forecast, anomaly, finops, audit) | `summary` |
| `forecast-days` | Days for forecast | `30` |
| `delta-threshold` | Alert threshold for cost changes (%) | `10` |
| `output-format` | Output format (text, json) | `text` |
| `slack-webhook` | Slack webhook URL | - |
| `comment-on-pr` | Post analysis as PR comment | `false` |
| `fail-on-threshold` | Fail if costs exceed threshold | `false` |

### Action Outputs

| Output | Description |
|--------|-------------|
| `total-cost` | Total cost for the analysis period |
| `cost-change` | Cost change percentage |
| `forecast-cost` | Forecasted cost |
| `anomalies-detected` | Number of anomalies detected |
| `report-json` | Full report in JSON format |

See [example workflows](.github/workflows/examples/) for more use cases.

## 🔧 Advanced Usage

### AWS Organizations Support
```bash
# List all accounts in organization
infra-cost organizations list

# Get organization-wide cost summary
infra-cost organizations summary

# Get daily costs for all accounts
infra-cost organizations daily
```

### Cost Analysis & Forecasting
```bash
# Analyze costs with delta comparison
infra-cost cost analyze --show-delta --delta-threshold 10

# Get cost trends
infra-cost cost trends --period 90d

# Compare costs across providers
infra-cost cost compare --providers aws,gcp,azure

# Forecast future costs
infra-cost cost forecast --days 30
```

### Optimization Commands
```bash
# Get all optimization recommendations
infra-cost optimize recommendations

# Find quick wins for immediate savings
infra-cost optimize quickwins

# Get rightsizing recommendations
infra-cost optimize rightsizing

# Cross-cloud optimization analysis
infra-cost optimize cross-cloud
```

### Monitoring & Alerts
```bash
# Check cost alerts
infra-cost monitor alerts

# Monitor budgets
infra-cost monitor budgets

# Watch for cost changes in real-time
infra-cost monitor watch

# Detect anomalies
infra-cost monitor anomaly
```

### Configuration Management
```bash
# Initialize new configuration
infra-cost config init

# Show current configuration
infra-cost config show

# Validate configuration
infra-cost config validate

# Migrate from old version
infra-cost config migrate
```

## 🏗️ Architecture & Extensibility

### Clean Architecture Structure (v1.0)
```
src/
├── cli/                        # CLI layer
│   ├── commands/              # Subcommand structure
│   │   ├── cost/             # Cost analysis commands
│   │   ├── optimize/         # Optimization commands
│   │   ├── monitor/          # Monitoring commands
│   │   ├── export/           # Export commands
│   │   ├── organizations/    # AWS Organizations commands
│   │   ├── chargeback/       # Chargeback commands
│   │   ├── config/           # Configuration commands
│   │   └── dashboard/        # Dashboard commands
│   ├── middleware/           # Auth, validation, error handling
│   └── index.ts              # CLI entry point
├── core/                      # Core business logic
│   ├── config/               # Configuration system
│   │   ├── schema.ts         # Zod validation schemas
│   │   ├── loader.ts         # Config file loading
│   │   ├── discovery.ts      # Profile discovery
│   │   └── profiles.ts       # Profile management
│   ├── logging/              # Structured logging
│   ├── analytics/            # Cost analytics engines
│   ├── optimization/         # Optimization engines
│   └── monitoring/           # Monitoring systems
├── providers/                 # Cloud provider implementations
│   ├── factory.ts            # Provider factory
│   └── aws/                  # AWS implementation ✅
│       ├── provider.ts       # Main provider class
│       ├── cost.ts           # Cost Explorer integration
│       ├── account.ts        # Account/Organizations
│       └── config.ts         # AWS-specific config
├── exporters/                # Output formatters
│   └── formats/
│       ├── fancy.ts          # Rich terminal output
│       ├── json.ts           # JSON output
│       ├── text.ts           # Plain text
│       └── slack.ts          # Slack formatting
└── enterprise/               # Enterprise features
    ├── multi-tenant/         # Multi-tenancy support
    └── audit/                # Audit logging
```

### Key Design Principles
- **Subcommand Architecture** - Domain-organized, discoverable commands
- **Clean Separation** - CLI, core logic, and providers are decoupled
- **Type Safety** - Comprehensive TypeScript with Zod validation
- **Testability** - Dependency injection and mocking support
- **Extensibility** - Plugin architecture for new providers
- **Configuration First** - Unified config system with profiles

## 🚀 Roadmap

### ✅ Completed (2024-2025)

**Core Platform & Architecture:**
- ✅ Enhanced terminal UI and visualization
- ✅ AI-powered anomaly detection
- ✅ Comprehensive PDF reporting
- ✅ Advanced Slack integration
- ✅ GitHub Actions integration
- ✅ npm and Homebrew distribution
- ✅ **Phase 1: Clean Architecture Restructuring (v1.0)**
  - Subcommand-based CLI architecture
  - Unified configuration system with profiles
  - Automatic cloud profile discovery
  - Structured logging with audit trails
  - AWS Organizations support (Issue #10 ✅)
  - Cost allocation and chargeback reporting (Issue #30 ✅)
  - Configuration file support (Issue #29 ✅)
  - Caching layer for performance (Issue #28 ✅)
  - IAM Roles and environment variables auth (Issues #12, #13 ✅)
  - AWS SSO login support (Issue #9 ✅)

**Multi-Cloud Foundation:**
- ✅ Multi-cloud provider architecture (Issue #20 - foundation)
  - AWS provider fully implemented
  - GCP, Azure, Alibaba Cloud, Oracle Cloud - architecture ready

### Q1 2026 (Current - In Progress)

**Priority: Multi-Cloud Expansion**
- ✅ **Google Cloud Platform support - Week 1 Complete** (Issue #66)
  - ✅ Provider implementation with BigQuery billing export
  - ✅ GCP authentication (service account, ADC)
  - ✅ Multi-project support with parallel retrieval
  - ✅ Multi-currency cost aggregation
  - ✅ Cost breakdown by service and time period
  - ✅ Comprehensive unit tests (32 tests passing)
  - 🚧 CLI integration and documentation (Week 1)
  - 🔜 Resource inventory discovery (Week 2)
  - 🔜 Budget tracking and alerts (Week 2)
- 📋 **Advanced forecasting models** (No GitHub issue)
  - ML-based cost predictions
  - Seasonal trend analysis
  - Budget recommendations
- 📋 **Enhanced analytics** (No GitHub issue)
  - Advanced cost attribution
  - Custom tagging strategies
  - Cost optimization scoring

### Q2 2026 (Planned)

**Priority: Complete Multi-Cloud & Automation**
- 🔮 **Microsoft Azure integration** (Issue #20 - partial)
  - Azure Cost Management API
  - Subscription and resource group support
  - Azure-specific recommendations
- 🔮 **Alibaba Cloud support** (Issue #20 - partial)
  - Alibaba Cloud Cost API integration
  - Multi-region support
- 🔮 **Oracle Cloud support** (Issue #20 - partial)
  - OCI Cost Management integration
  - Compartment-based analysis
- 📋 **Advanced automation engine** (No GitHub issue)
  - Automated cost optimization actions
  - Policy-based automation
  - Approval workflows
  - Related: Issue #42 (Scheduled Reports), Issue #49 (API Server)

### Q3 2026 (Planned)

**Priority: Enterprise Features**
- ✅/🚧 **Enterprise SSO integration**
  - AWS SSO: ✅ Completed (Issue #9)
  - SAML/OAuth support: 🔲 Planned (Issue #52)
  - Azure AD, Okta, Auth0 integration: 🔲 Planned
  - Role-based access control (RBAC): 🔲 Planned (Issue #50)
- 📋 **Custom plugin system** (No GitHub issue)
  - Plugin SDK
  - Custom provider support
  - Third-party integrations
- 📋 **Mobile app companion** (No GitHub issue)
  - iOS and Android apps
  - Real-time cost alerts
  - Executive dashboards on mobile

### Future Vision

**FinOps & Intelligence:**
- 📋 **Sustainability tracking expansion** (No GitHub issue)
  - Carbon footprint tracking
  - Green cloud recommendations
  - Renewable energy usage analytics
- 🔲 **FinOps best practices automation** (Issue #59 - partial)
  - FinOps Scorecards implementation
  - Automated best practices enforcement
  - Team performance metrics
- 🔲 **AI-powered cost conversations** (Issue #44 - partial)
  - Natural language cost queries
  - ChatOps integration
  - AI cost assistant

**Platform & Scale:**
- 📋 **Multi-tenant SaaS platform** (No GitHub issue)
  - Organization management
  - Team collaboration features
  - Centralized cost governance
- 🔲 **Additional integrations** (Various open issues)
  - Microsoft Teams (Issue #45)
  - PagerDuty/OpsGenie (Issue #48)
  - Terraform cost preview (Issue #47)
  - API Server mode (Issue #49)
  - Multi-cloud dashboard (Issue #62)
  - Web-based dashboards (Issue #60)

**Legend:**
- ✅ Completed
- 🚧 In Progress
- 🔮 Planned (this quarter)
- 🔲 Open GitHub Issue
- 📋 Not yet tracked in GitHub issues

## 📋 Requirements & Permissions

### AWS Permissions Required
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "InfraCostMinimalPermissions",
      "Effect": "Allow",
      "Action": [
        "iam:ListAccountAliases",
        "ce:GetCostAndUsage",
        "ce:GetRightsizingRecommendation",
        "ce:GetSavingsUtilization",
        "budgets:ViewBudget",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

### System Requirements
- Node.js 20+ (required)
- Memory: 512MB+ available
- Network: Internet access for cloud provider APIs
- Optional: Docker for containerized deployments

## 🧪 Development

> 📚 **Developer Resources**: See the [`docs/`](./docs) folder for comprehensive technical documentation including architecture guides, testing reports, and release procedures.

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/codecollab-co/infra-cost.git
cd infra-cost

# Install dependencies
npm install

# Build project
npm run build

# Run tests
npm test

# Start development server
npm run dev
```

### Testing & Quality Assurance
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Security audit
npm audit

# Test coverage
npm run test:coverage
```

### Release Management
```bash
# Check current version status
npm run version:check

# Bump version
npm run version:bump:patch   # Bug fixes
npm run version:bump:minor   # New features
npm run version:bump:major   # Breaking changes

# Prepare release
npm run prepare-release
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🌟 Ways to Contribute
- **⭐ Star this repository** to show your support
- **🐛 Report bugs** and suggest improvements via [issues](https://github.com/codecollab-co/infra-cost/issues)
- **📝 Improve documentation** - help others understand and use the tool
- **🔧 Add cloud provider support** - help us expand to more providers
- **🧪 Write tests** - improve code quality and reliability
- **💡 Suggest features** - share your ideas for new capabilities

### 🚀 Getting Started with Contributing
1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/infra-cost.git`
3. **Create a branch**: `git checkout -b feature/amazing-feature`
4. **Make changes** and write tests
5. **Run quality checks**: `npm run typecheck && npm run lint && npm test`
6. **Commit**: `git commit -m "Add amazing feature"`
7. **Push**: `git push origin feature/amazing-feature`
8. **Create a Pull Request**

### 📋 Contribution Guidelines
- Follow the existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Keep PRs focused on a single feature/fix
- Be respectful and constructive in discussions

### 🏷️ Good First Issues
Look for issues labeled `good first issue` or `help wanted` to get started!

## 📞 Support & Community

### 💬 Get Help
- **📚 Documentation**: [docs.codecollab.co/infra-cost](https://docs.codecollab.co/infra-cost) *(coming soon)*
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/codecollab-co/infra-cost/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/codecollab-co/infra-cost/discussions)
- **📧 Email Support**: support@codecollab.co

### 🌟 Show Your Support
If infra-cost helps you save money and optimize costs, please:
- ⭐ **Star this repository**
- 🐦 **Share on Twitter** with #InfraCost #FinOps
- 📝 **Write a review** or blog post about your experience
- 🤝 **Contribute** code, documentation, or feedback

### 🏢 Enterprise Support
For enterprise deployments, custom integrations, and professional support:
- 📧 Contact: enterprise@codecollab.co
- 🔒 SLA-backed support available
- 🎨 Custom branding and whitelabeling
- 🏗️ Professional services and consulting

## 📚 Documentation

### 📖 User Documentation
- **[README.md](./README.md)** - Main project documentation (you are here)
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines

### 🔧 Developer Documentation
Comprehensive technical documentation is available in the [`docs/`](./docs) folder:

- **[docs/RELEASE_SUMMARY.md](./docs/RELEASE_SUMMARY.md)** - Complete release guide for GitHub, npm, and Homebrew
- **[docs/PRODUCTION_READINESS.md](./docs/PRODUCTION_READINESS.md)** - Production readiness assessment and checklist
- **[docs/TEST_RESULTS.md](./docs/TEST_RESULTS.md)** - Comprehensive test results and analysis
- **[docs/NPM_PUBLISHING.md](./docs/NPM_PUBLISHING.md)** - npm publishing workflow and best practices
- **[docs/HOMEBREW_SETUP.md](./docs/HOMEBREW_SETUP.md)** - Homebrew formula creation guide
- **[docs/code_flow.md](./docs/code_flow.md)** - Codebase architecture and flow
- **[docs/infra_cost_cli.md](./docs/infra_cost_cli.md)** - CLI implementation details
- **[docs/MULTI-CLOUD-INVENTORY.md](./docs/MULTI-CLOUD-INVENTORY.md)** - Multi-cloud features
- **[docs/ENHANCED-FEATURES.md](./docs/ENHANCED-FEATURES.md)** - Advanced capabilities

See [docs/README.md](./docs/README.md) for the complete documentation index.

## 📄 License

MIT © [Code Collab](https://github.com/codecollab-co)

---

## 🔄 Changelog

### v1.0.0 - Major Release (Phase 1: Clean Architecture) 🎉
- ✅ **Subcommand-Based CLI** - New organized command structure
  - `cost` - Cost analysis and trends
  - `optimize` - Optimization recommendations
  - `monitor` - Alerts and monitoring
  - `export` - Data export in multiple formats
  - `organizations` - AWS Organizations support
  - `chargeback` - Cost allocation and reporting
  - `config` - Configuration management
  - `dashboard` - Interactive dashboards
- ✅ **Unified Configuration System** - Single config file with profiles
- ✅ **Profile Discovery** - Auto-detect cloud provider profiles
- ✅ **Clean Architecture** - Separation of CLI, core, and providers
- ✅ **Enhanced Logging** - Structured logging with multiple outputs
- ✅ **Migration Tool** - Automated migration from v0.x (`infra-cost config migrate`)
- ✅ **Improved Error Handling** - Better error messages and validation
- ✅ **TypeScript Improvements** - Full type safety with Zod schemas

**Breaking Changes:** See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for upgrading from v0.x

### v0.3.0
- ✅ **GitHub Marketplace Action** - Integrate cost analysis into CI/CD workflows
- ✅ **Node.js 20+ support** - Updated runtime requirements
- ✅ **Sprint 6 UX improvements** - Enhanced user experience
- ✅ **Configuration improvements** - Better config resolution and file permissions
- ✅ **Date normalization** - Consistent UTC date handling

### v0.2.4
- ✅ **Fixed CommonJS compatibility** - Homebrew installation now works perfectly
- ✅ **Enhanced error handling** and user experience improvements
- ✅ **Optimized build process** for better performance

### v0.2.0 - Enhanced Features
- ✅ **AI-powered anomaly detection** with real-time monitoring
- ✅ **Advanced visualization engine** with interactive dashboards
- ✅ **PDF report generation** for executives and technical teams
- ✅ **Comprehensive Slack integration** with rich formatting
- ✅ **Multi-cloud architecture** ready for expansion
- ✅ **Enterprise features** including multi-tenancy and API server

### Migration from v0.x
See the comprehensive [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for step-by-step instructions on migrating from v0.x to v1.0.

---

<div align="center">

**Made with ❤️ by [Code Collab](https://github.com/codecollab-co)**

*Empowering teams to optimize cloud costs and build sustainable infrastructure*

[⭐ Star us on GitHub](https://github.com/codecollab-co/infra-cost) • [🐦 Follow on Twitter](https://twitter.com/codecollabco) • [💼 LinkedIn](https://linkedin.com/company/codecollab-co)

</div>
