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
- **Google Cloud** 🚧 (Architecture ready, coming soon)
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

infra-cost uses a modern subcommand-based architecture for better organization and discoverability:

### Cost Commands (`infra-cost cost`)
- `analyze` - Analyze cloud costs with delta comparison
- `trends` - View cost trends over time
- `compare` - Compare costs across cloud providers
- `forecast` - Forecast future costs with AI

### Optimization Commands (`infra-cost optimize`)
- `recommendations` - Get AI-powered optimization recommendations
- `quickwins` - Find quick wins for immediate savings
- `rightsizing` - Get instance rightsizing recommendations
- `cross-cloud` - Cross-cloud optimization analysis

### Monitoring Commands (`infra-cost monitor`)
- `alerts` - Check cost alerts and thresholds
- `budgets` - Monitor budget status
- `watch` - Real-time cost monitoring
- `anomaly` - Detect cost anomalies

### Export Commands (`infra-cost export`)
- `inventory` - Export infrastructure inventory (JSON, CSV, XLSX, PDF)
- `costs` - Export cost data
- `reports` - Export comprehensive reports

### Organizations Commands (`infra-cost organizations`)
- `list` - List all accounts in AWS Organizations
- `summary` - Organization-wide cost summary
- `daily` - Daily costs for all accounts

### Chargeback Commands (`infra-cost chargeback`)
- `report` - Generate chargeback reports
- `allocate` - Allocate costs to teams/projects
- `slack` - Send chargeback reports to Slack

### Configuration Commands (`infra-cost config`)
- `init` - Initialize configuration file
- `show` - Show current configuration
- `validate` - Validate configuration
- `migrate` - Migrate from v0.x to v1.0

### Dashboard Commands (`infra-cost dashboard`)
- `interactive` - Launch interactive terminal dashboard
- `multicloud` - Multi-cloud dashboard view

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

### 2. Optimization & Recommendations
```bash
# Get AI-powered optimization recommendations
infra-cost optimize recommendations

# Find quick wins for immediate savings
infra-cost optimize quickwins

# Get rightsizing recommendations
infra-cost optimize rightsizing
```

### 3. Monitoring & Alerts
```bash
# Check cost alerts and budget status
infra-cost monitor alerts

# Monitor budgets
infra-cost monitor budgets

# Detect cost anomalies
infra-cost monitor anomaly
```

### 4. Team Collaboration
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

### Multi-Cloud Setup (Coming Soon)
```bash
# Google Cloud Platform
infra-cost cost analyze --provider gcp --project-id my-project --key-file service-account.json

# Microsoft Azure
infra-cost cost analyze --provider azure --subscription-id sub-id --tenant-id tenant-id

# Oracle Cloud
infra-cost cost analyze --provider oracle --user-id user-ocid --tenancy-id tenancy-ocid

# Cross-cloud comparison
infra-cost cost compare --providers aws,gcp,azure

# Cross-cloud optimization report
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

### Q4 2024
- ✅ Enhanced terminal UI and visualization
- ✅ AI-powered anomaly detection
- ✅ Comprehensive PDF reporting
- ✅ Advanced Slack integration
- 🚧 Google Cloud Platform support

### Q1 2025
- 🔮 Microsoft Azure integration
- 🔮 Advanced forecasting models
- 🔮 Mobile app companion
- 🔮 Sustainability tracking expansion

### Q2 2025
- 🔮 Alibaba Cloud & Oracle Cloud support
- 🔮 Advanced automation engine
- 🔮 Enterprise SSO integration
- 🔮 Custom plugin system

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
