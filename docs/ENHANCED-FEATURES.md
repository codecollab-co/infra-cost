# Enhanced infra-cost Features

This document describes the advanced features added to `infra-cost` inspired by the AWS FinOps Dashboard, providing enterprise-grade cost analysis capabilities.

## 🆕 New Features Overview

### 1. Enhanced Terminal UI Engine
- **Rich table formatting** with color-coded cost indicators
- **ASCII trend charts** with visual cost trends
- **Progress indicators** for long-running operations
- **Performance optimizations** for large datasets
- **Professional styling** with branded headers

### 2. Comprehensive PDF Reports
- **Executive summaries** for stakeholders
- **Detailed audit reports** with recommendations
- **Professional layouts** with charts and insights
- **Automated generation** with timestamped reports
- **Multiple themes** (light/dark/corporate)

### 3. Preset Command Modes
- **Quick analysis** with `--trend`, `--audit`, `--executive-summary`
- **Simplified workflows** for common use cases
- **AWS FinOps Dashboard compatibility** in CLI patterns
- **PDF export integration** with all preset modes

### 4. Interactive Analysis Mode
- **Guided cost exploration** with step-by-step prompts
- **Deep-dive investigations** for specific cost areas
- **Real-time recommendations** based on analysis
- **User-friendly interface** for non-technical users

### 5. Smart Profile Discovery
- **Auto-detection** of cloud provider configurations
- **Multi-provider support** (AWS, GCP, Azure, Alibaba, Oracle)
- **Profile recommendations** based on usage patterns
- **Configuration validation** and status checking

### 6. Intelligent Cost Alerting
- **Smart threshold detection** based on spending patterns
- **Visual indicators** with progress bars and trend arrows
- **Severity-based alerts** (Critical, High, Medium, Low)
- **Actionable recommendations** for each alert type

## 🚀 Quick Start Guide

### Installation
```bash
# Install the enhanced version
npm install -g infra-cost
```

### Basic Usage with New Features
```bash
# Enhanced default output with rich formatting
infra-cost

# Generate 6-month trend analysis
infra-cost --trend

# Comprehensive audit with PDF report
infra-cost --audit --pdf-report audit-2024.pdf

# Executive summary for stakeholders
infra-cost --executive-summary --pdf-report executive-summary.pdf

# Interactive guided analysis
infra-cost --interactive

# Auto-discover cloud profiles
infra-cost --discover-profiles
```

## 📊 Enhanced Terminal UI

### Rich Cost Tables
The new terminal UI provides AWS FinOps Dashboard-style formatting:

```bash
infra-cost --provider aws --profile production
```

**Output Features:**
- **Color-coded costs** (green for normal, yellow for increases, red for alerts)
- **Trend indicators** (↗↘→) showing cost direction
- **Percentage breakdowns** with service-level insights
- **Professional headers** with account information
- **Performance optimization** for accounts with 100+ services

### ASCII Trend Charts
Visual cost trends directly in the terminal:

```bash
infra-cost --trend
```

**Chart Features:**
- **6-month historical** cost visualization
- **Color-coded bars** (green=low, yellow=medium, red=high)
- **Monthly comparisons** with percentage changes
- **Seasonal pattern detection** and insights

## 📄 PDF Report Generation

### Executive Summary Reports
Perfect for leadership and stakeholder communications:

```bash
infra-cost --executive-summary --pdf-report executive-q4-2024.pdf
```

**Report Includes:**
- **High-level cost metrics** and KPIs
- **Month-over-month trends** with explanations
- **Top cost drivers** and optimization opportunities
- **Executive recommendations** with potential savings
- **Professional formatting** suitable for presentations

### Comprehensive Audit Reports
Detailed analysis for technical teams:

```bash
infra-cost --audit --pdf-report detailed-audit.pdf
```

**Report Features:**
- **Complete cost breakdown** by service and time period
- **Resource inventory** with utilization metrics
- **Optimization recommendations** with implementation steps
- **Cost anomaly analysis** with root cause investigation
- **Compliance and governance** insights

### Custom Report Generation
```bash
# Trend-focused report
infra-cost --trend --pdf-report trend-analysis.pdf

# Service-specific analysis
infra-cost --provider aws --services "EC2,RDS,S3" --pdf-report services.pdf
```

## 🔍 Interactive Analysis Mode

### Starting Interactive Mode
```bash
infra-cost --interactive
```

### Interactive Features

**1. Guided Cost Overview**
- Current spending across all services
- Service-by-service breakdown
- Cost trend analysis
- Budget utilization tracking

**2. Deep Dive Analysis**
- Investigate specific cost spikes
- Resource utilization analysis
- Regional cost distribution
- Service dependency mapping

**3. Optimization Recommendations**
- Personalized cost-saving suggestions
- Implementation step-by-step guides
- ROI calculations for each recommendation
- Priority-based action plans

**4. Anomaly Detection**
- Unusual spending pattern identification
- Root cause analysis assistance
- Historical comparison insights
- Alert threshold recommendations

## 🔧 Profile Auto-Discovery

### Discovering Available Profiles
```bash
infra-cost --discover-profiles
```

**Discovery Features:**
- **AWS profiles** from `~/.aws/credentials` and `~/.aws/config`
- **GCP configurations** from `gcloud` CLI
- **Azure subscriptions** from Azure CLI
- **Alibaba Cloud** and **Oracle Cloud** profiles
- **Status validation** for each discovered profile
- **Usage recommendations** for optimal configuration

### Auto-Selected Profiles
```bash
# Use recommended profile automatically
infra-cost --auto-profile

# Use all available profiles
infra-cost --all-profiles

# Combine profiles from same account
infra-cost --combine-profiles
```

## 🚨 Smart Cost Alerting

### Built-in Alert Types

**1. Daily Spending Spikes**
- Detects when daily costs exceed 200% of normal
- Provides investigation recommendations
- Shows historical context

**2. Monthly Budget Warnings**
- Alerts at 80% and 95% of budget utilization
- Projects month-end spending
- Suggests optimization actions

**3. Service Concentration Risks**
- Identifies when single service dominates costs (>70%)
- Recommends diversification strategies
- Highlights dependency risks

**4. Unusual Cost Patterns**
- Detects significant decreases (potential issues)
- Identifies irregular spending cycles
- Provides pattern analysis insights

### Custom Alert Configuration
```bash
# Set custom monthly budget alert
infra-cost --alert-threshold 5000 --alert-type ABSOLUTE

# Set percentage-based growth alert
infra-cost --alert-threshold 25% --alert-type PERCENTAGE

# Enable anomaly detection alerts
infra-cost --alert-type ANOMALY --anomaly-sensitivity high
```

## 🔄 Migration from AWS FinOps Dashboard

### Command Equivalents
If you're familiar with the AWS FinOps Dashboard, here are the equivalent commands:

| AWS FinOps Dashboard | infra-cost Enhanced |
|---------------------|-------------------|
| `aws-finops --trend` | `infra-cost --trend` |
| `aws-finops --audit` | `infra-cost --audit` |
| `aws-finops --all --combine` | `infra-cost --all-profiles --combine-profiles` |
| `aws-finops --report-type pdf` | `infra-cost --pdf-report filename.pdf` |

### Enhanced Capabilities
`infra-cost` provides everything AWS FinOps Dashboard offers, plus:

✅ **Multi-cloud support** (not just AWS)
✅ **Interactive analysis mode** for guided exploration
✅ **Advanced PDF reports** with more customization
✅ **Smart alerting system** with ML-based thresholds
✅ **Enterprise integrations** (Slack, webhooks, APIs)
✅ **Performance optimizations** for large-scale deployments

## 🎯 Best Practices

### Daily Usage
```bash
# Quick morning cost check
infra-cost --summary

# Weekly trend review
infra-cost --trend

# Monthly comprehensive audit
infra-cost --audit --pdf-report monthly-audit-$(date +%Y-%m).pdf
```

### Enterprise Workflows
```bash
# Executive dashboard generation
infra-cost --executive-summary --pdf-report exec-dashboard.pdf

# Automated alerting setup
infra-cost --monitor-start monthly-review --alert-threshold 10000

# Multi-account analysis
infra-cost --all-profiles --combine-profiles --audit
```

### Performance Tips

**For Large Accounts (1000+ resources):**
```bash
# Use summary mode for quick checks
infra-cost --summary

# Limit service display for performance
infra-cost --highlight-top 10

# Use specific time ranges
infra-cost --time-range 7days
```

**For Multi-Cloud Environments:**
```bash
# Analyze each provider separately for speed
infra-cost --provider aws --profile prod
infra-cost --provider gcp --project-id my-project

# Or use discovery for automation
infra-cost --discover-profiles --auto-profile
```

## 🚀 Advanced Features

### API Integration
```bash
# Start REST API server for integrations
infra-cost --api-server --api-port 3001

# Generate API keys for external tools
infra-cost --api-key-create dashboard:read,write
```

### Automated Monitoring
```bash
# Set up continuous cost monitoring
infra-cost --monitor-start production-costs \
  --alert-threshold 5000 \
  --alert-channel slack \
  --slack-webhook https://hooks.slack.com/...
```

### Custom Integrations
```bash
# Export data for external analysis
infra-cost --export json > costs.json

# Webhook notifications for cost events
infra-cost --webhook-create https://my-app.com/webhooks/costs
```

## 🆘 Troubleshooting

### Common Issues

**1. No profiles discovered**
```bash
# Check your cloud CLI configurations
aws configure list-profiles
gcloud config configurations list
az account list
```

**2. PDF generation fails**
```bash
# Install required dependencies
npm install -g puppeteer

# Or use text-based reports
infra-cost --audit --export csv
```

**3. Performance issues with large accounts**
```bash
# Use filtering to improve performance
infra-cost --services "EC2,RDS,S3" --regions "us-east-1,us-west-2"

# Enable compact mode
infra-cost --compact
```

## 📚 Additional Resources

- **Demo Mode**: Use `node dist/demo/test-enhanced-ui.js` to test features
- **Configuration**: See `CLAUDE.md` for detailed configuration options
- **API Documentation**: Available at `/docs` when API server is running
- **Integration Examples**: Check `/examples` directory for common use cases

## 🤝 Contributing

The enhanced features are designed to be extensible. Key areas for contribution:

- **New cloud providers** in the provider factory pattern
- **Additional PDF report templates** in the PDF exporter
- **Custom alert types** in the alerting engine
- **Interactive analysis modules** for specialized use cases
- **Visualization enhancements** in the terminal UI engine

---

*This documentation covers the enhanced features. For basic usage, see the main README.md file.*