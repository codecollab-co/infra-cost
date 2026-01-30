# infra-cost v1.1.0 - Multi-Cloud ML Revolution

**Release Date**: January 30, 2026

We're excited to announce the release of infra-cost v1.1.0, featuring comprehensive Google Cloud Platform (GCP) support and marking our journey toward becoming the premier multi-cloud FinOps solution.

## 🚀 What's New

### Complete Google Cloud Platform Integration

This release adds first-class support for GCP alongside our existing AWS capabilities:

#### GCP Provider Features
- ✅ **BigQuery Billing Export Integration** - Historical and real-time cost analysis
- ✅ **Multiple Authentication Methods** - Service account keys and Application Default Credentials (ADC)
- ✅ **Multi-Currency Support** - Automatic detection and aggregation with two-pass algorithm
- ✅ **Resource Inventory Discovery** - GCE, Cloud Storage, Cloud SQL, GKE
- ✅ **Budget Management** - Cloud Billing Budgets API integration with threshold alerts
- ✅ **Multi-Project Support** - Aggregate costs across all accessible projects
- ✅ **Organization-Level Analysis** - Full GCP organizational hierarchy support
- ✅ **Folder-Level Costs** - Aggregate by organizational folders

#### Resource Discovery
Discover and analyze resources across your GCP environment:
- **GCE Instances** - VM discovery with network and disk details
- **Cloud Storage Buckets** - Bucket metadata with encryption info
- **Cloud SQL** - Database discovery with backup configuration
- **GKE Clusters** - Kubernetes cluster and node pool details

#### Advanced Cost Analysis
- **Parallel processing** - Efficient multi-project cost fetching
- **Date range filtering** - Configurable time periods for cost queries
- **Pagination support** - Handle large billing datasets efficiently
- **Graceful error handling** - Continue on individual project failures

## 📊 Statistics

- **3,500+ lines of code** - Implementation + tests + documentation
- **65 comprehensive tests** - 100% passing for all GCP modules
- **887 lines of documentation** - Complete setup guide with 8 real-world examples
- **7 new modules** - Provider, config, project, cost, inventory, budget, multi-project
- **8 new dependencies** - Google Cloud SDK libraries

## 🎯 Use Cases

### Single Project Cost Analysis
```bash
infra-cost cost analyze \
  --provider gcp \
  --project-id my-project-123 \
  --output fancy
```

### Multi-Project Aggregation
```bash
infra-cost cost analyze \
  --provider gcp \
  --all-projects \
  --output json > costs.json
```

### Organization-Wide Reporting
```bash
infra-cost cost analyze \
  --provider gcp \
  --organization-id 123456789 \
  --output fancy
```

### Resource Inventory Discovery
```bash
infra-cost inventory list \
  --provider gcp \
  --project-id my-project \
  --region us-central1
```

### Budget Monitoring with Alerts
```bash
infra-cost budget alerts \
  --provider gcp \
  --billing-account 012345-ABCDEF-678901
```

## 📦 Installation

### NPM
```bash
npm install -g infra-cost@1.1.0
```

### Homebrew
```bash
brew tap codecollab-co/tap
brew install infra-cost
```

### GitHub Action
```yaml
- uses: codecollab-co/infra-cost@v1.1.0
  with:
    provider: gcp
    project-id: ${{ secrets.GCP_PROJECT_ID }}
```

## 📚 Documentation

- **[GCP Setup Guide](docs/GCP_SETUP.md)** - Complete setup instructions with examples
- **[README](README.md)** - Updated with GCP features and usage
- **[CHANGELOG](CHANGELOG.md)** - Detailed change log

## 🔧 Technical Details

### New Modules
- `src/providers/gcp/provider.ts` - Main GCP provider implementation
- `src/providers/gcp/config.ts` - Authentication and configuration
- `src/providers/gcp/project.ts` - Project management
- `src/providers/gcp/cost.ts` - Cost data retrieval
- `src/providers/gcp/inventory.ts` - Resource discovery
- `src/providers/gcp/budget.ts` - Budget tracking
- `src/providers/gcp/multi-project.ts` - Multi-project aggregation

### Dependencies Added
- @google-cloud/bigquery - Cost data queries
- @google-cloud/billing - Billing API integration
- @google-cloud/compute - GCE instance discovery
- @google-cloud/storage - Cloud Storage bucket discovery
- @google-cloud/sql - Cloud SQL instance discovery
- @google-cloud/container - GKE cluster discovery
- @google-cloud/resource-manager - Project management
- googleapis - Resource Manager v3 API

### Performance Optimizations
- Parallel resource discovery across zones
- Parallel multi-project cost fetching
- Efficient BigQuery query construction
- Two-pass algorithm for multi-currency handling
- Zone-level error isolation

## ✅ Testing

- **150 tests passing** - All core functionality verified
- **9 skipped tests** - Future features (forecasting, anomaly detection)
- **65 GCP-specific tests** - Provider, cost, inventory, budget, multi-project
- **Performance benchmarks** - All operations within thresholds
- **Mock-based testing** - No external dependencies required

## 🔄 Migration from v0.3.x

No breaking changes! The upgrade is seamless:

```bash
npm install -g infra-cost@1.1.0
```

Existing AWS configurations work unchanged. GCP is a new feature addition.

## ⚠️ Known Limitations

- BigQuery billing export required (setup takes 24-48 hours)
- Organization-level access requires Resource Manager permissions
- Some features require specific IAM permissions (documented in setup guide)

## 🎉 What's Next

We're committed to making infra-cost the best multi-cloud FinOps tool:

- **Q2 2026**: Azure support
- **Q2 2026**: Machine learning forecasting
- **Q2 2026**: Cost anomaly detection
- **Q3 2026**: Advanced analytics and attribution
- **Q3 2026**: Real-time cost monitoring

## 🙏 Thank You

Thank you to everyone who contributed feedback and suggestions. Your input helps make infra-cost better for the entire community.

## 📝 Links

- [GitHub Repository](https://github.com/codecollab-co/infra-cost)
- [NPM Package](https://www.npmjs.com/package/infra-cost)
- [Documentation](https://github.com/codecollab-co/infra-cost/tree/main/docs)
- [Issue Tracker](https://github.com/codecollab-co/infra-cost/issues)

---

**Full Changelog**: https://github.com/codecollab-co/infra-cost/blob/main/CHANGELOG.md#110---2026-01-30
