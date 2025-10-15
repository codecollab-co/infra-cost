# Multi-Cloud Inventory & Dashboard

This document describes the enhanced multi-cloud inventory and dashboard capabilities added to `infra-cost`.

## 🌐 Multi-Cloud Dashboard Overview

The Multi-Cloud Dashboard provides comprehensive visibility across all configured cloud providers, showing inventory, costs, and insights in a unified view.

### Supported Cloud Providers

- ☁️ **Amazon Web Services (AWS)**
- 🌐 **Google Cloud Platform (GCP)**
- 🔷 **Microsoft Azure**
- 🟠 **Alibaba Cloud**
- 🔴 **Oracle Cloud Infrastructure (OCI)**

## 🚀 Quick Start

### Basic Multi-Cloud Dashboard
```bash
# Display comprehensive multi-cloud infrastructure dashboard
infra-cost --multi-cloud-dashboard

# Show inventory across all configured cloud providers
infra-cost --all-clouds-inventory

# Multi-cloud dashboard for specific providers
infra-cost --multi-cloud-dashboard --compare-clouds aws,gcp,azure
```

### Enhanced Inventory Display
```bash
# Enhanced single-provider inventory with provider branding
infra-cost --inventory --provider aws

# All profiles inventory with provider details
infra-cost --inventory --all-profiles

# Combine profiles from same account
infra-cost --inventory --combine-profiles
```

## 📊 Dashboard Features

### Executive Summary
- **Active Providers**: Count and list of configured cloud providers
- **Total Resources**: Aggregated resource count across all providers
- **Total Monthly Cost**: Combined cost across all cloud providers
- **Resource Type Breakdown**: Top resource categories across providers

### Provider-by-Provider Breakdown
Each provider shows:
- ✅ **Active**: Resources discovered, costs calculated
- ⚪ **Unavailable**: No credentials or profiles configured
- ❌ **Error**: Failed to connect or authenticate

For active providers:
- Total resource count and cost
- Regions covered
- Last update timestamp
- Top resource types

### Consolidated Resource Analysis
- **Resource Type Distribution**: Compute, Storage, Database, Network, etc.
- **Top Provider per Resource Type**: Which provider has most resources
- **Cost Concentration**: Provider cost distribution

### Multi-Cloud Insights
Automated analysis including:
- **Provider Diversity**: Single vs multi-cloud deployment assessment
- **Cost Concentration**: Whether one provider dominates spending
- **Resource Distribution**: Which resource types dominate infrastructure

### Recommendations
Actionable recommendations for:
- **Cost Optimization**: Cross-cloud arbitrage opportunities
- **Profile Management**: Missing credential configuration
- **Monitoring Setup**: Real-time cost tracking
- **Security & Governance**: Tagging and dependency mapping

## 🔧 Enhanced Single-Provider Inventory

### Provider Branding
Each provider now displays with:
- **Provider Icons**: Visual identification (☁️ AWS, 🌐 GCP, 🔷 Azure, etc.)
- **Full Provider Names**: "Amazon Web Services (AWS)" vs just "AWS"
- **Branded Headers**: Provider-specific styling

### Improved Display
- **Enhanced Headers**: More professional appearance
- **Better Resource Categorization**: Clear resource type breakdown
- **Cost Integration**: Per-resource cost information
- **Regional Information**: Multi-region support display

## 📋 Resource Types Supported

All providers support these resource categories:

- 💻 **Compute**: Virtual machines, containers, serverless functions
- 💾 **Storage**: Object storage, block storage, file systems
- 🗄️ **Database**: Relational, NoSQL, data warehouses
- 🌐 **Network**: VPCs, load balancers, CDNs
- 🔒 **Security**: IAM, firewalls, certificates
- ⚡ **Serverless**: Functions, APIs, event processing
- 🐳 **Container**: Kubernetes, container registries
- 📊 **Analytics**: Big data, machine learning, analytics

## 🔍 Profile Discovery Integration

The multi-cloud dashboard integrates with profile discovery to:

1. **Auto-detect** available cloud provider configurations
2. **Validate** credential status for each provider
3. **Recommend** optimal profile usage
4. **Warn** about missing or invalid configurations

## 💡 Usage Examples

### Development & Testing
```bash
# Quick multi-cloud overview
infra-cost --multi-cloud-dashboard

# Test dashboard with demo data
node dist/demo/test-multi-cloud-dashboard.js
```

### Production Monitoring
```bash
# Comprehensive multi-cloud monitoring
infra-cost --all-clouds-inventory --resource-costs

# Export multi-cloud inventory
infra-cost --inventory --all-profiles --inventory-export xlsx

# Cross-cloud cost comparison
infra-cost --compare-clouds aws,gcp,azure
```

### Enterprise Operations
```bash
# Multi-tenant multi-cloud dashboard
infra-cost --enterprise --all-clouds-inventory

# Automated reporting
infra-cost --multi-cloud-dashboard --pdf-report multi-cloud-report.pdf
```

## 🔧 Configuration

### Profile Setup
Ensure profiles are configured for each provider:

```bash
# AWS
aws configure --profile production

# GCP
gcloud config configurations create production

# Azure
az login
```

### Discovery
```bash
# Discover available profiles
infra-cost --discover-profiles

# Auto-select best profile
infra-cost --auto-profile
```

## 📈 Integration with Existing Features

The multi-cloud dashboard integrates seamlessly with:

- **Cost Alerting**: Multi-cloud budget thresholds
- **PDF Reports**: Executive summaries across providers
- **Interactive Mode**: Guided multi-cloud exploration
- **Optimization Engine**: Cross-cloud cost optimization
- **Monitoring**: Real-time multi-cloud cost tracking

## 🚨 Troubleshooting

### Common Issues

**No providers found:**
```bash
# Check profile configuration
infra-cost --discover-profiles

# Verify credentials
aws sts get-caller-identity
gcloud auth list
az account show
```

**Partial data displayed:**
- Some providers may have credential issues
- Check the provider breakdown section for error details
- Use `--discover-profiles` to debug configuration

**Performance with many providers:**
- Use `--compact` mode for faster display
- Filter to specific providers with `--compare-clouds`

## 🔮 Future Enhancements

Planned improvements:
- **Real-time Updates**: Live dashboard with auto-refresh
- **Custom Dashboards**: User-defined multi-cloud views
- **Advanced Analytics**: ML-powered insights across providers
- **Cost Forecasting**: Multi-cloud budget predictions
- **Resource Relationships**: Cross-cloud dependency mapping

---

*This multi-cloud capability transforms infra-cost from a single-provider tool into a comprehensive multi-cloud cost management platform.*