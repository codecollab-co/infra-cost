# 💰 infra-cost

<div align="center">

**Multi-cloud FinOps CLI tool for comprehensive cost analysis and infrastructure optimization**

[![npm version](https://badge.fury.io/js/infra-cost.svg)](https://badge.fury.io/js/infra-cost.svg)
[![Downloads](https://img.shields.io/npm/dm/infra-cost.svg)](https://npmjs.org/package/infra-cost)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/codecollab-co/infra-cost)](https://github.com/codecollab-co/infra-cost/issues)
[![GitHub stars](https://img.shields.io/github/stars/codecollab-co/infra-cost)](https://github.com/codecollab-co/infra-cost/stargazers)

*Take control of your cloud costs across AWS, Google Cloud, Azure, Alibaba Cloud, and Oracle Cloud* 🚀

[Installation](#-installation) • [Quick Start](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

> **✨ What's New in v1.11.0**
>
> **Advanced Cost Analysis & Security Fixes**
>
> - 📊 **Cost Forecasting**: Predict 1-12 months ahead with 4 statistical models (linear, exponential, seasonal, auto)
> - 🌐 **Multi-Cloud Comparison**: Compare costs across AWS, GCP, Azure, Oracle, Alibaba with service-level breakdowns
> - 📈 **Cost Trends**: Analyze spending patterns with ASCII visualization and volatility detection
> - 🔒 **Security Hardening**: CORS restrictions, API key auth by default, memory leak fixes
> - ⚡ **Performance**: Async file operations, automatic cache cleanup, 85% faster responses
>
> See [CHANGELOG.md](./CHANGELOG.md) for complete release notes.

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

### 🌐 Multi-Cloud Support
- **AWS** ✅ Full support with Cost Explorer integration
- **Google Cloud** ✅ BigQuery billing export, multi-project support
- **Microsoft Azure** 🚧 Architecture ready, coming soon
- **Alibaba Cloud** 🚧 Architecture ready, coming soon
- **Oracle Cloud** 🚧 Architecture ready, coming soon

### 📊 Comprehensive Analytics
- **Cost Forecasting** - 1-12 month predictions with confidence intervals
- **Multi-Cloud Comparison** - Side-by-side cost analysis across providers
- **Cost Trends** - Historical analysis with visualization
- **Budget Monitoring** - Track against budgets with smart alerts
- **Resource Rightsizing** - ML recommendations for optimal instance sizes
- **Anomaly Detection** - AI-powered cost spike identification

### 🎛️ Advanced Features
- **Interactive Dashboards** - Rich terminal UI with real-time data
- **Terraform Cost Preview** - Estimate costs before deployment
- **Git Cost History** - Correlate cost changes with commits
- **IaC Annotations** - Add cost comments to Terraform/CloudFormation files
- **AWS Organizations** - Multi-account cost management
- **CI/CD Integration** - GitHub Actions, Jenkins, GitLab CI

### 🔧 Developer Experience
- **Multiple output formats**: Fancy tables, plain text, JSON, CSV, Excel
- **Flexible authentication**: Environment variables, IAM roles, profiles
- **Zero-config quick commands**: `infra-cost now` for instant cost checks
- **API Server**: REST endpoints for custom integrations
- **Webhook Support**: Real-time notifications and integrations

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
- uses: codecollab-co/infra-cost@v1.11.0
  with:
    provider: aws
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
```

## 🎯 Quick Start

### 1. Instant Cost Check
```bash
# Zero-config daily cost check
infra-cost now

# Output: Today's Cost: $45.23 (+$3.12 from yesterday)
#         Top Services: EC2 $22.10 | RDS $15.30 | S3 $4.20
```

### 2. AWS Cost Analysis
```bash
# Analyze costs with default AWS credentials
infra-cost cost analyze

# Show cost trends over time
infra-cost cost trends --period 30d

# Get cost forecast
infra-cost cost forecast --months 3
```

### 3. Google Cloud Platform
```bash
# Analyze GCP costs
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project \
  --key-file /path/to/service-account.json
```

### 4. Multi-Cloud Comparison
```bash
# Compare costs across providers
infra-cost cost compare --providers aws,gcp,azure
```

### 5. Optimization & Monitoring
```bash
# Get optimization recommendations
infra-cost optimize recommendations

# Check cost alerts and budgets
infra-cost monitor alerts
infra-cost monitor budgets
```

## 🔐 Authentication

### AWS Authentication

**Environment Variables (Recommended)**
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
infra-cost cost analyze
```

**AWS Profiles**
```bash
infra-cost cost analyze --profile production
```

**IAM Roles / AWS SSO**
```bash
# Automatically uses attached IAM role
infra-cost cost analyze

# Or use AWS SSO
aws sso login --profile my-sso-profile
infra-cost cost analyze --profile my-sso-profile
```

### Google Cloud Authentication

**Service Account (Recommended)**
```bash
export GOOGLE_PROJECT_ID=your-project-id
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
infra-cost cost analyze --provider gcp
```

**Application Default Credentials**
```bash
gcloud auth application-default login
infra-cost cost analyze --provider gcp --project-id your-project-id
```

**GCP Permissions Required:**
- `resourcemanager.projects.get`
- `bigquery.jobs.create`
- `bigquery.tables.getData`

**Setup BigQuery Billing Export:**
1. Go to [GCP Billing Console](https://console.cloud.google.com/billing)
2. Enable "BigQuery export"
3. Wait 24 hours for initial data

## 📖 Command Reference

infra-cost uses a modern subcommand-based architecture. Here's a quick overview:

### Quick Commands
- **`infra-cost now`** - Instant daily cost check (zero config)
- **`infra-cost free-tier`** - AWS Free Tier usage tracker
- **`infra-cost annotate`** - Add cost comments to IaC files
- **`infra-cost history`** - Git cost history and blame analysis

### Core Command Groups

**Cost Analysis** - [See detailed docs](./docs/commands/COST_ANALYSIS.md)
- `cost analyze` - Comprehensive cost analysis
- `cost forecast` - Predict future costs (1-12 months)
- `cost compare` - Multi-cloud cost comparison
- `cost trends` - Historical cost trend analysis

**Optimization** - [See detailed docs](./docs/commands/OPTIMIZATION.md)
- `optimize recommendations` - AI-powered optimization suggestions
- `optimize quickwins` - Find immediate savings opportunities
- `optimize rightsizing` - Instance rightsizing recommendations
- `optimize cross-cloud` - Cross-cloud optimization analysis

**Monitoring & Alerts** - [See detailed docs](./docs/commands/MONITORING.md)
- `monitor alerts` - Check cost alerts
- `monitor budgets` - Monitor budget status
- `monitor watch` - Real-time cost monitoring
- `monitor anomaly` - Detect cost anomalies

**Export & Reports** - [See detailed docs](./docs/commands/EXPORT.md)
- `export inventory json|csv|xlsx|pdf` - Export resource inventory
- `chargeback report` - Generate chargeback reports
- `chargeback slack` - Send reports to Slack

**AWS Organizations** - [See detailed docs](./docs/commands/ORGANIZATIONS.md)
- `organizations list` - List all accounts
- `organizations summary` - Organization-wide cost summary
- `organizations daily` - Daily costs for all accounts

**Configuration**
- `config init` - Initialize configuration
- `config show` - Show current configuration
- `config validate` - Validate configuration
- `config migrate` - Migrate from v0.x

**Interactive Dashboards**
- `dashboard interactive` - Launch interactive TUI dashboard
- `dashboard multicloud` - Multi-cloud dashboard

**Terraform Integration** - [See detailed docs](./docs/commands/TERRAFORM.md)
- `terraform --plan <file>` - Estimate costs before deployment

**Get help for any command:**
```bash
infra-cost --help
infra-cost cost --help
infra-cost cost analyze --help
```

## 🏗️ Architecture

infra-cost v1.0+ uses a clean architecture with:

- **Subcommand Architecture** - Domain-organized, discoverable commands
- **Provider Pattern** - Pluggable cloud provider implementations
- **Type Safety** - Comprehensive TypeScript with Zod validation
- **Configuration First** - Unified config system with profiles
- **Clean Separation** - CLI, core logic, and providers are decoupled

See [docs/code_flow.md](./docs/code_flow.md) for architecture details.

## 🤖 CI/CD Integration

### GitHub Actions
```yaml
name: Cost Analysis
on: [pull_request]

jobs:
  cost-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: codecollab-co/infra-cost@v1.11.0
        with:
          provider: aws
          command: now
          comment-on-pr: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Terraform Cost Gates
```yaml
- name: Terraform Cost Preview
  uses: codecollab-co/infra-cost@v1.11.0
  with:
    command: terraform
    additional-args: '--plan tfplan --threshold 20'
```

See [docs/commands/CI_CD.md](./docs/commands/CI_CD.md) for more examples.

## 📊 Example Output

### Cost Analysis
```bash
infra-cost cost analyze --output fancy
```
![Cost Analysis](./.github/images/aws-cost.png)

### Interactive Dashboard
```bash
infra-cost dashboard interactive
```
Real-time cost monitoring with keyboard navigation, multiple views (Services, Resources, Trends, Alerts), and auto-refresh.

## 📚 Documentation

### User Documentation
- **[Installation Guide](./docs/INSTALLATION.md)** - Detailed installation instructions
- **[Quick Start Guide](./docs/QUICK_START.md)** - Get started in 5 minutes
- **[Command Reference](./docs/commands/)** - Detailed command documentation
- **[Authentication Guide](./docs/AUTHENTICATION.md)** - AWS, GCP, Azure auth setup
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Migrate from v0.x to v1.0

### Developer Documentation
- **[Architecture Guide](./docs/code_flow.md)** - Codebase structure and design
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute
- **[Testing Guide](./docs/TEST_RESULTS.md)** - Test results and coverage
- **[Release Guide](./docs/RELEASE_SUMMARY.md)** - Release procedures

See [docs/README.md](./docs/README.md) for complete documentation index.

## 🛠️ Development

```bash
# Clone and setup
git clone https://github.com/codecollab-co/infra-cost.git
cd infra-cost
npm install

# Build and test
npm run build
npm test

# Type checking and linting
npm run typecheck
npm run lint

# Run locally
npm run dev
```

See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for detailed development guide.

## 🤝 Contributing

We welcome contributions! Here's how you can help:

- ⭐ **Star this repository** to show your support
- 🐛 **Report bugs** via [GitHub Issues](https://github.com/codecollab-co/infra-cost/issues)
- 💡 **Suggest features** via [GitHub Discussions](https://github.com/codecollab-co/infra-cost/discussions)
- 📝 **Improve documentation** - help others understand the tool
- 🔧 **Add cloud provider support** - help us expand to more providers
- 🧪 **Write tests** - improve code quality

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📞 Support & Community

### Get Help
- **📚 Documentation**: [docs.codecollab.co/infra-cost](https://docs.codecollab.co/infra-cost) *(coming soon)*
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/codecollab-co/infra-cost/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/codecollab-co/infra-cost/discussions)
- **📧 Email**: support@codecollab.co

### Enterprise Support
For enterprise deployments, custom integrations, and professional support:
- **📧 Contact**: enterprise@codecollab.co
- **🔒 SLA-backed support** available
- **🎨 Custom branding** and whitelabeling
- **🏗️ Professional services** and consulting

## 🚀 Roadmap

### ✅ Completed (2024-2025)
- ✅ AWS full support with Organizations
- ✅ Google Cloud Platform support
- ✅ Cost forecasting (4 statistical models)
- ✅ Multi-cloud cost comparison
- ✅ Interactive TUI dashboard
- ✅ Terraform cost preview
- ✅ GitHub Actions integration
- ✅ Git cost history & blame
- ✅ IaC file annotations

### Q1-Q2 2026 (In Progress)
- 🚧 Microsoft Azure integration
- 🚧 Alibaba Cloud support
- 🚧 Oracle Cloud support
- 📋 VS Code extension
- 📋 Enhanced forecasting models
- 📋 Advanced automation engine

### Future Vision
- Carbon footprint tracking
- Multi-tenant SaaS platform
- Mobile app companion
- Natural language queries
- FinOps best practices automation

See [full roadmap](./docs/ROADMAP.md) for detailed timeline.

## 📋 Requirements

### AWS Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "iam:ListAccountAliases",
      "ce:GetCostAndUsage",
      "ce:GetRightsizingRecommendation",
      "budgets:ViewBudget",
      "sts:GetCallerIdentity"
    ],
    "Resource": "*"
  }]
}
```

### System Requirements
- Node.js 20+ (required)
- Memory: 512MB+ available
- Network: Internet access for cloud provider APIs

## 📄 License

MIT © [Code Collab](https://github.com/codecollab-co)

---

<div align="center">

**Made with ❤️ by [Code Collab](https://github.com/codecollab-co)**

*Empowering teams to optimize cloud costs and build sustainable infrastructure*

[⭐ Star us on GitHub](https://github.com/codecollab-co/infra-cost) • [🐦 Follow on Twitter](https://twitter.com/codecollabco) • [💼 LinkedIn](https://linkedin.com/company/codecollab-co)

</div>
