# 💰 infra-cost

<div align="center">

**Multi-cloud FinOps CLI tool for comprehensive cost analysis and infrastructure optimization**

[![npm version](https://badge.fury.io/js/infra-cost.svg)](https://d25lcipzij17d.cloudfront.net/badge.svg?c=eyJhbGciOiJub25lIn0.eyJiIjp7IngiOmZhbHNlLCJ0IjoidjZlIiwibCI6Im5wbSBwYWNrYWdlIiwiciI6IjAuMy4yIn19)
[![Downloads](https://img.shields.io/npm/dm/infra-cost.svg)](https://npmjs.org/package/infra-cost)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/codecollab-co/infra-cost)](https://github.com/codecollab-co/infra-cost/issues)
[![GitHub stars](https://img.shields.io/github/stars/codecollab-co/infra-cost)](https://github.com/codecollab-co/infra-cost/stargazers)

*Take control of your cloud costs across AWS, Google Cloud, Azure, Alibaba Cloud, and Oracle Cloud* 🚀

[Installation](#-installation) • [Quick Start](#-quick-start) • [Features](#-features) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

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
# Using default AWS credentials
infra-cost

# Get a 6-month cost trend with forecasting
infra-cost --trend --forecast 30

# Interactive multi-cloud dashboard
infra-cost --multi-cloud-dashboard
```

### 2. Advanced Analysis
```bash
# Generate executive PDF report
infra-cost --executive-summary --pdf-report quarterly-report.pdf

# AI-powered anomaly detection
infra-cost --anomaly-detect --anomaly-realtime

# Comprehensive sustainability analysis
infra-cost --sustainability --carbon-footprint --green-recommendations
```

### 3. Team Collaboration
```bash
# Send daily cost report to Slack
infra-cost --slack-token YOUR_TOKEN --slack-channel "#finops" --smart-alerts

# Start real-time cost monitoring
infra-cost --monitor --alert-threshold 1000 --alert-channel slack
```

## 🔐 Authentication

### AWS Authentication (Multiple Methods)

#### 1. Environment Variables (Recommended)
```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
infra-cost
```

#### 2. AWS Profiles
```bash
# Use default profile
infra-cost

# Use specific profile
infra-cost --profile production

# Auto-discover profiles
infra-cost --discover-profiles --auto-profile
```

#### 3. IAM Roles (EC2/Lambda/ECS)
```bash
# Automatically uses attached IAM role
infra-cost
```

#### 4. AWS SSO
```bash
aws sso login --profile my-sso-profile
infra-cost --profile my-sso-profile
```

### Multi-Cloud Setup (Coming Soon)
```bash
# Google Cloud Platform
infra-cost --provider gcp --project-id my-project --key-file service-account.json

# Microsoft Azure
infra-cost --provider azure --subscription-id sub-id --tenant-id tenant-id

# Cross-cloud comparison
infra-cost --compare-clouds aws,gcp,azure --optimization-report
```

## 📊 Output Examples

### Default Rich Terminal UI
```bash
infra-cost --smart-alerts --compact
```
![Cost Analysis](./.github/images/aws-cost.png)

### Executive Dashboard
```bash
infra-cost --executive-summary
```
![Executive Summary](./.github/images/executive-dashboard.png)

### JSON for Automation
```bash
infra-cost --json --forecast 30 --analytics-insights
```

### PDF Reports
```bash
infra-cost --pdf-report monthly-report.pdf --trend --optimization-tips
```

## 💬 Slack Integration

### Enhanced Team Collaboration
- **Rich cost breakdowns** with visual charts
- **Proactive alerts** for budget overruns and anomalies
- **Automated workflows** for approval processes
- **Team cost awareness** with regular updates

### Setup & Usage
```bash
# Create Slack app with chat:write permissions
# Get OAuth token and channel ID

# Send cost report
infra-cost --slack-token xoxb-your-token --slack-channel "#finops"

# Enable smart alerts
infra-cost --slack-token xoxb-your-token --slack-channel "#alerts" --smart-alerts
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
          npx infra-cost \
            --executive-summary \
            --slack-token ${{ secrets.SLACK_TOKEN }} \
            --slack-channel ${{ secrets.SLACK_CHANNEL }} \
            --smart-alerts --trends 7
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

### Cost Forecasting & Analytics
```bash
# AI-powered forecasting with multiple models
infra-cost --forecast 90 --forecast-model AUTO --forecast-confidence 95

# Business intelligence insights
infra-cost --analytics --analytics-insights --analytics-drivers

# Custom dashboards
infra-cost --dashboard-create "Monthly Review" --chart-create "line:Cost Trends"
```

### Optimization & Automation
```bash
# Generate optimization recommendations
infra-cost --finops --optimization-tips --rightsize --sustainability

# Automated optimization (dry-run first!)
infra-cost --optimize-dry-run --optimize-rules resize,schedule,unused

# Cross-cloud cost comparison
infra-cost --compare-clouds aws,gcp --optimization-report
```

### Enterprise Features
```bash
# Multi-tenant management
infra-cost --enterprise --tenants --platform-metrics

# API server for integrations
infra-cost --api-server --api-port 3000 --webhook-create

# Comprehensive audit logging
infra-cost --audit --compliance-check soc2 --audit-export json
```

## 🏗️ Architecture & Extensibility

### Multi-Cloud Provider Pattern
```
src/
├── providers/
│   ├── factory.ts      # Provider factory
│   ├── aws.ts          # AWS implementation ✅
│   ├── gcp.ts          # Google Cloud 🚧
│   ├── azure.ts        # Azure 🚧
│   ├── alicloud.ts     # Alibaba Cloud 🚧
│   └── oracle.ts       # Oracle Cloud 🚧
├── analytics/          # AI/ML cost analysis
├── optimization/       # Cost optimization engines
├── visualization/      # Dashboards & charts
├── integrations/       # Third-party integrations
└── enterprise/         # Multi-tenant features
```

### Key Design Principles
- **Abstract provider interface** for consistent multi-cloud API
- **Plugin architecture** for easy extensibility
- **Type-safe implementation** with comprehensive TypeScript coverage
- **Modular design** allowing feature composition
- **Performance optimized** with efficient data processing

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

## 📄 License

MIT © [Code Collab](https://github.com/codecollab-co)

---

## 🔄 Changelog

### v0.3.0 - Latest Release
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

### Migration from aws-cost-cli
This tool evolved from `aws-cost-cli` with full backward compatibility. Both `infra-cost` and `aws-cost` commands work seamlessly.

---

<div align="center">

**Made with ❤️ by [Code Collab](https://github.com/codecollab-co)**

*Empowering teams to optimize cloud costs and build sustainable infrastructure*

[⭐ Star us on GitHub](https://github.com/codecollab-co/infra-cost) • [🐦 Follow on Twitter](https://twitter.com/codecollabco) • [💼 LinkedIn](https://linkedin.com/company/codecollab-co)

</div>
