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

### 📊 **Comprehensive Analytics** (NEW in v1.11.0 ✨)
- **Cost Forecasting** - Statistical predictions with 4 models (linear, exponential, seasonal, auto)
  - 1-12 month forecasts with confidence intervals (80%, 90%, 95%)
  - Automatic trend detection and recommendations
- **Multi-Cloud Cost Comparison** - Side-by-side analysis across AWS, GCP, Azure, Oracle, Alibaba
  - Service-level cost breakdowns
  - Savings opportunities and vendor lock-in alerts
- **Cost Trends Analysis** - Flexible time periods (7d, 30d, 90d, 12m)
  - ASCII visualization with color-coded charts
  - Volatility detection and period-over-period changes
- **Budget Monitoring** - Track against budgets with smart alerts
- **Resource Rightsizing** - ML recommendations for optimal instance sizes
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

### ⚡ Quick Commands

#### `infra-cost now` - Instant Cost Check (NEW in v1.2.0)

See today's cloud spending in one second - perfect for morning cost checks!

```bash
# Quick daily cost check (zero config)
infra-cost now

# Output:
# 💰 Today's Cost: $45.23 (+$3.12 ↑ from yesterday)
# 📊 Top Services: EC2 $22.10 | RDS $15.30 | S3 $4.20
# 📈 Month-to-Date: $892.45 / $1,500 (59%)
#    [███████████████████░░░░░░░░░░] 59%
#
# Provider: AWS
# Run `infra-cost cost` for detailed breakdown
```

**Features:**
- 🚀 **Zero configuration** - auto-detects your default AWS profile
- 📊 **Smart summary** - today's cost + delta from yesterday
- 🎯 **Top 3 services** - see where your money is going at a glance
- 💹 **Budget progress** - visual progress bar if budgets configured
- 🎨 **Color-coded** - green = under budget, red = over budget
- ⚡ **Lightning fast** - get your answer in ~1 second

**Options:**
```bash
infra-cost now                      # Default profile
infra-cost now --profile prod       # Specific profile
infra-cost now --provider gcp       # Google Cloud
infra-cost now --json               # JSON output for scripting
```

**Perfect for:**
- Morning stand-ups: "How much did we spend yesterday?"
- Quick sanity checks before demos
- Solo developers and indie hackers
- Anyone who wants instant cost visibility

---

#### `infra-cost free-tier` - AWS Free Tier Tracker (NEW in v1.2.0)

Track your AWS Free Tier usage and prevent surprise bills - perfect for solo developers and indie hackers!

```bash
# Check free tier status
infra-cost free-tier

# Output:
# 🆓 AWS Free Tier Status (Account: 123456789012)
# ════════════════════════════════════════════════════════════
#
# EC2 (t2.micro/t3.micro instances)
# ├── Used: 620.0 hours / 750 hours (82.7%)
# ├── [████████████████████████░░░░░░] 83%
# └── ⚠️ Warning: 130.0 hours remaining
#
# S3 (Standard storage)
# ├── Used: 4.2 GB / 5 GB (84.0%)
# ├── [████████████████████████░░░░░░] 84%
# └── ⚠️ Warning: 0.8 GB remaining
#
# Lambda (1M requests, 400K GB-sec)
# ├── Used: 0.0 cost / 0 cost (0.0%)
# ├── [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 0%
# └── ✅ On track
#
# ────────────────────────────────────────────────────────────
# 💡 Tip: You have 8 days until month end
```

**Features:**
- 🆓 **Tracks popular free tier services**: EC2, S3, Lambda, RDS
- 📊 **Visual progress bars** - see usage at a glance
- ⚡ **Smart alerts** - warns when approaching limits (default: 80%)
- 💰 **Cost projection** - estimate month-end overages
- 🎯 **Perfect for beginners** - avoid surprise AWS bills
- 🚨 **Status indicators** - green=safe, yellow=warning, red=critical

**Options:**
```bash
infra-cost free-tier                       # Check current status
infra-cost free-tier --alert-threshold 90  # Custom threshold
infra-cost free-tier --show-projection     # Show projected overages
infra-cost free-tier --json                # JSON output
```

**Tracked Services:**
- **EC2**: 750 hours/month (t2.micro/t3.micro)
- **S3**: 5 GB storage
- **Lambda**: Cost-based tracking (free tier = $0 cost)

**Perfect for:**
- Solo developers and indie hackers
- Students learning AWS
- New AWS users avoiding surprise bills
- Monthly free tier checkups

---

#### `infra-cost annotate` - Cost Annotations for IaC Files (NEW in v1.3.0)

Add cost estimates directly in your Infrastructure as Code files - see costs during code review!

```bash
# Annotate Terraform files
infra-cost annotate --path ./terraform/

# Before:
resource "aws_instance" "web" {
  instance_type = "t3.xlarge"
  ami           = "ami-12345678"
}

# After:
# 💰 infra-cost: $121.47/month | aws_instance @ us-east-1
# 💡 Consider t3.large for 50% savings if CPU < 40% (saves $60.74/month)
# 📊 Last updated: 2026-01-30
resource "aws_instance" "web" {
  instance_type = "t3.xlarge"
  ami           = "ami-12345678"
}
```

**Features:**
- 📝 **Terraform & CloudFormation support** - HCL and YAML annotations
- 💰 **Monthly cost estimates** - see the cost of each resource
- 💡 **Optimization suggestions** - inline recommendations for savings
- 📊 **Auto-update** - keep annotations fresh with --update flag
- 🧹 **Clean removal** - remove all annotations with --remove
- 🔍 **Dry run** - preview changes before applying

**Commands:**
```bash
# Annotate all Terraform files in a directory
infra-cost annotate --path ./terraform/

# CloudFormation templates
infra-cost annotate --path ./cloudformation/ --format cloudformation

# Preview without modifying files
infra-cost annotate --path ./terraform/ --dry-run

# Update existing annotations
infra-cost annotate --path ./terraform/ --update

# Remove all cost annotations
infra-cost annotate --path ./terraform/ --remove
```

**Perfect for:**
- Code reviews with cost visibility
- DevOps engineers writing IaC
- Cost-aware development culture
- Pre-commit cost checks
- Documentation of infrastructure costs

---

#### `infra-cost history` - Git Cost History (NEW in v1.3.0)

Correlate cost changes with git commits - see which code changes impact costs!

```bash
# Show cost history with git correlation
infra-cost history --git

# Output:
# 📊 Cost History with Git Correlation
# ═══════════════════════════════════════════════════════════
# Date          Cost        Change      Commit
# ─────────────────────────────────────────────────────────
# 2026-01-28    $142.30     +$12.40     abc1234 Add GPU instances
# 2026-01-27    $129.90     +$45.20     def5678 Deploy new RDS
# 2026-01-26    $84.70      -$8.30      ghi9012 Cleanup unused EBS
# 2026-01-25    $93.00      +$3.10      jkl3456 Update Lambda memory
# ═══════════════════════════════════════════════════════════
#
# 🔍 Significant cost changes:
# • +$45.20 on 2026-01-27: def5678 "Deploy new RDS for analytics"
# • +$12.40 on 2026-01-28: abc1234 "Add GPU instances for ML"

# Analyze specific commit
infra-cost history --commit abc1234

# Who caused the most cost changes this month?
infra-cost blame --period month
```

**Features:**
- 📊 **Cost-commit correlation** - see which commits changed costs
- 👤 **Author attribution** - track cost impact by developer
- 📈 **Trend analysis** - understand cost evolution over time
- 🔍 **Commit details** - deep dive into specific commits
- 📝 **Multiple formats** - text, JSON, markdown output
- ⚠️ **Significant change alerts** - highlight big cost impacts

**Commands:**
```bash
# Show cost history for the past week (default)
infra-cost history --git

# Show history for different periods
infra-cost history --period month
infra-cost history --period quarter

# Filter by author
infra-cost history --author john@example.com

# Analyze specific commit
infra-cost history --commit abc1234

# Blame analysis - who impacted costs most?
infra-cost blame --period month

# Export to JSON for analysis
infra-cost history --format json > cost-history.json
```

**Perfect for:**
- Engineering teams tracking cost accountability
- Understanding which features drive costs
- Cost-aware code reviews
- FinOps culture and awareness
- Retrospectives on cost trends

---

### 📊 Advanced Cost Analysis (NEW in v1.11.0)

#### `infra-cost cost forecast` - Predictive Cost Forecasting

Forecast future cloud spending with statistical accuracy - plan budgets with confidence!

```bash
# 3-month forecast with 90% confidence
infra-cost cost forecast --months 3

# Output:
# 📈 Cost Forecast Summary
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Forecast Period        3 months
# Forecasting Model      AUTO (selected: SEASONAL)
# Confidence Level       90%
# Average Confidence     87.3%
#
# Total Predicted Cost   $4,523.40
# Average Daily Cost     $50.26
# Average Monthly Cost   $1,507.80
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# 📅 Monthly Forecast Breakdown
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Month      Predicted Cost  Range              Avg Confidence
# ─────────────────────────────────────────────────────────────
# Feb 2026   $1,450.20      $1,320 - $1,580    89%
# Mar 2026   $1,523.80      $1,390 - $1,658    87%
# Apr 2026   $1,549.40      $1,412 - $1,687    86%
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# 📊 Trend Analysis
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📈 Increasing Trend
#
# Historical Average:  $45.30/day
# Forecast Average:    $50.26/day
# Change:              +11.0%
#
# 💡 Recommendations:
#   ⚠️  Costs are projected to increase significantly
#      • Review resource utilization
#      • Consider implementing cost optimization strategies
#      • Set up budget alerts
```

**Features:**
- 📊 **4 Statistical Models**: Linear, exponential, seasonal, auto-select
- 🎯 **Confidence Intervals**: 80%, 90%, 95% accuracy levels
- 📅 **Flexible Periods**: 1-12 month predictions
- 📈 **Trend Detection**: Automatic identification of cost patterns
- 💡 **Smart Recommendations**: Context-aware optimization suggestions

**Options:**
```bash
# Different forecast periods
infra-cost cost forecast --months 6

# Choose specific model
infra-cost cost forecast --model seasonal

# Higher confidence level
infra-cost cost forecast --confidence 95

# JSON output for automation
infra-cost cost forecast --months 3 --format json
```

---

#### `infra-cost cost compare` - Multi-Cloud Cost Comparison

Compare costs across multiple cloud providers - find the best value for your workloads!

```bash
# Compare costs across AWS, GCP, and Azure
infra-cost cost compare --providers aws,gcp,azure

# Output:
# 🌐 Comparing costs across cloud providers...
#
# 💰 Total Cost Comparison
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Provider  Total Cost (MTD)  % of Total  Rank
# ─────────────────────────────────────────────────────────────
# AWS       $2,340.50        62.1%       #1
# GCP       $892.30          23.7%       #2
# AZURE     $535.80          14.2%       #3
# ─────────────────────────────────────────────────────────────
# TOTAL     $3,768.60        100.0%
#
# 🔧 Service-Level Comparison
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Service    AWS        GCP        AZURE      Total
# ─────────────────────────────────────────────────────────────
# Compute    $1,240.20  $450.30    $280.40    $1,970.90
# Storage    $520.80    $230.50    $150.20    $901.50
# Database   $380.40    $150.20    $80.30     $610.90
# Network    $199.10    $61.30     $24.90     $285.30
#
# 💡 Cost Optimization Recommendations
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   ⚠️  AWS represents 62.1% of total costs
#      • Consider multi-cloud strategy to reduce vendor lock-in
#      • Evaluate workload migration opportunities
#
#   🔄 3 services running across multiple providers
#      • Review for potential consolidation opportunities
#      • Consider reserved instances/committed use discounts
#
#   💰 Potential savings: $704.70/month (30.1%)
#      • Migrate workloads from AWS to AZURE
#      • Review pricing models and reserved capacity options
```

**Features:**
- 🌐 **5 Cloud Providers**: AWS, GCP, Azure, Oracle Cloud, Alibaba Cloud
- 📊 **Service-Level Breakdown**: Compare individual services across clouds
- 🏆 **Provider Rankings**: Automatic ranking by total cost
- 💡 **Savings Opportunities**: Calculate migration savings potential
- ⚠️ **Vendor Lock-in Alerts**: Warn when single provider > 60%

**Options:**
```bash
# Compare specific providers
infra-cost cost compare --providers aws,gcp

# Filter specific services
infra-cost cost compare --services compute,storage

# JSON output
infra-cost cost compare --providers aws,gcp,azure --format json
```

---

#### `infra-cost cost trends` - Historical Cost Trend Analysis

Analyze cost patterns over time - understand your spending evolution!

```bash
# 30-day cost trend analysis
infra-cost cost trends --period 30d

# Output:
# 📊 Analyzing cost trends...
#
# 📈 Trend Overview
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Period         30d
# Data Points    30
#
# Total Cost     $1,523.40
# Average Cost   $50.78
# Min Cost       $42.30
# Max Cost       $62.50
#
# Overall Trend  📈 Increasing
# Trend Change   +8.3%
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# 🔧 Service Trends
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Service    Previous Avg  Current Avg  Change    Trend
# ─────────────────────────────────────────────────────────────
# EC2        $22.30       $26.80       +20.2%    ↑ up
# RDS        $15.20       $16.40       +7.9%     ↑ up
# S3         $8.40        $8.20        -2.4%     → stable
# Lambda     $4.20        $3.80        -9.5%     ↓ down
#
# 📊 Cost Trend Visualization
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#  $62   │                                 ██
#  $58   │                               ████
#  $54   │                             ██████
#  $50   │                   ████████████████
#  $46   │         ████████████████████████
#  $42   │   ████████████████████████████
#        └─────────────────────────────────────────────────────
#          Legend: █ Low █ Medium █ High
#
# 💡 Insights & Recommendations
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   ⚠️  Services with increasing costs:
#      • EC2: +20.2%
#      • RDS: +7.9%
#
#   ✅ Cost patterns are stable
#      • Low variance in daily costs
#      • Predictable spending patterns
```

**Features:**
- ⏰ **Flexible Periods**: 7d, 30d, 90d, 12m analysis windows
- 📊 **Multiple Granularities**: Daily, weekly, monthly aggregation
- 🎨 **ASCII Visualization**: Color-coded terminal charts
- 📈 **Volatility Detection**: Statistical analysis of cost variance
- 💡 **Actionable Insights**: Services with biggest changes highlighted

**Options:**
```bash
# Different time periods
infra-cost cost trends --period 90d

# Different granularity
infra-cost cost trends --period 30d --granularity weekly

# Filter specific services
infra-cost cost trends --services ec2,rds

# JSON output
infra-cost cost trends --period 30d --format json
```

---

#### `infra-cost terraform` - Terraform Cost Preview (NEW in v1.4.0)

**Estimate infrastructure costs BEFORE deploying - shift-left cost management!**

```bash
# Generate terraform plan and estimate costs
terraform plan -out=tfplan
infra-cost terraform --plan tfplan

# Output:
# ╭─────────────────────────────────────────────────────────────╮
# │             Terraform Cost Estimate                         │
# ├─────────────────────────────────────────────────────────────┤
# │ Resources to CREATE:                                        │
# │ ───────────────────────────────────────────────────────────│
# │ + aws_instance.web_server (t3.xlarge)                       │
# │   └── Monthly: $121.47 | Hourly: $0.1664                   │
# │ + aws_db_instance.primary (db.r5.large, 100GB gp2)          │
# │   └── Monthly: $182.80 | Hourly: $0.25                     │
# ├─────────────────────────────────────────────────────────────┤
# │ Resources to MODIFY:                                        │
# │ ───────────────────────────────────────────────────────────│
# │ ~ aws_instance.api_server                                   │
# │   └── t3.medium → t3.large: +$30.37/month                  │
# ├─────────────────────────────────────────────────────────────┤
# │ Resources to DESTROY:                                       │
# │ ───────────────────────────────────────────────────────────│
# │ - aws_instance.old_server                                   │
# │   └── Savings: -$60.74/month                               │
# ├─────────────────────────────────────────────────────────────┤
# │ SUMMARY                                                     │
# │ ───────────────────────────────────────────────────────────│
# │ Current Monthly Cost:     $1,240.50                         │
# │ Estimated New Cost:       $1,520.83                         │
# │ Difference:               +$280.33/month (+22.6%)          │
# │                                                             │
# │ ⚠️  Cost increase exceeds 20% threshold!                    │
# ╰─────────────────────────────────────────────────────────────╯
```

**Usage Examples:**

```bash
# Basic cost estimate
terraform plan -out=tfplan
infra-cost terraform --plan tfplan

# With cost threshold (fail if > 20% change)
infra-cost terraform --plan tfplan --threshold 20

# JSON format for automation
infra-cost terraform --plan tfplan --output json

# From JSON plan
terraform show -json tfplan > tfplan.json
infra-cost terraform --plan tfplan.json
```

**Supported Resources:**
- ✅ EC2 instances (all types)
- ✅ RDS instances with storage
- ✅ EBS volumes (gp2, gp3, io1, io2, st1, sc1)
- ✅ Load Balancers (ALB, NLB, CLB)
- ✅ NAT Gateways
- ✅ ElastiCache clusters
- ✅ S3 buckets (estimated)
- ✅ Lambda functions (estimated)

**Perfect for:**
- CI/CD cost gates
- Preventing expensive deployments
- Cost-aware infrastructure changes
- Shift-left FinOps culture
- Pre-deployment cost reviews

---

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
- uses: codecollab-co/infra-cost@v1.11.0
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

### Interactive TUI Dashboard

**Real-time cost monitoring with keyboard navigation**

```bash
# Launch interactive TUI dashboard (shortcut)
infra-cost dashboard

# Or explicitly
infra-cost dashboard interactive

# Custom refresh interval (default: 60 seconds)
infra-cost dashboard --refresh 30

# Multi-cloud dashboard
infra-cost dashboard multicloud
```

**Features:**
- 🎨 Beautiful terminal UI with real-time updates
- ⌨️ Full keyboard navigation (vim-style supported)
- 📊 Multiple views: Services, Resources, Trends, Alerts
- 📈 Live trend indicators (↗ up, ↘ down, → stable)
- 🔔 Real-time alert notifications
- 🔄 Auto-refresh with configurable intervals
- 🎯 Drill-down into services and resources

**Keyboard Shortcuts:**
```
q       - Quit
r       - Refresh data
↑↓/jk   - Navigate rows
←→/hl   - Switch tabs
1-4     - Quick tab switch
?       - Help
```

**Perfect for:**
- DevOps engineers monitoring costs in terminal
- SREs with terminal-based workflows
- Real-time cost exploration
- Server environments without GUI

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

## 🤖 GitHub Actions Integration (v1.4.0+)

**infra-cost** is available as a GitHub Action, making it easy to integrate cost analysis into your CI/CD workflows with cost gates and automated PR comments.

### Quick Cost Check
```yaml
name: Cost Analysis
on: [pull_request]

jobs:
  cost-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: now
          comment-on-pr: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Cost Gate - Fail on Increase
```yaml
name: Cost Gate
on: pull_request

jobs:
  cost-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: codecollab-co/infra-cost@v1.4.0
        with:
          provider: aws
          command: now
          fail-on-increase: true  # Fail if ANY cost increase
          cost-threshold: 1000     # Fail if monthly cost exceeds $1000
          comment-on-pr: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Terraform Cost Preview (Shift-Left)
```yaml
name: Terraform Cost Check
on: pull_request

jobs:
  terraform-cost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Terraform Plan
        run: terraform plan -out=tfplan

      - name: Cost Estimate
        uses: codecollab-co/infra-cost@v1.4.0
        with:
          command: terraform
          additional-args: '--plan tfplan --threshold 20'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
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

#### Multi-Account Management
```bash
# List all accounts in organization
infra-cost organizations list

# Get organization-wide cost summary
infra-cost organizations summary
```

#### Daily Cost Reports with Slack Integration
```bash
# Get daily costs for all accounts
infra-cost organizations daily

# Send daily report to Slack
infra-cost organizations daily --slack-webhook https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# View 30-day history
infra-cost organizations daily --days 30

# Get scheduling instructions for automated daily reports
infra-cost organizations daily --schedule-daily --schedule-time 09:00

# Export to JSON for automation
infra-cost organizations daily --json
```

**Features:**
- 📊 Multi-account cost breakdown
- 📈 Day-over-day cost trends with visual indicators
- 🔥 Top 5 spender accounts
- 📊 Weekly averages and projections
- 💬 Slack webhook integration for team notifications
- ⏰ Scheduling instructions (cron, Lambda, GitHub Actions)

**Perfect for:**
- Large organizations with multiple AWS accounts
- FinOps teams managing cross-account costs
- Daily cost visibility and team accountability
- Automated cost reporting workflows

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
- ✅ **Google Cloud Platform support - COMPLETE** (Issue #66)
  - ✅ Provider implementation with BigQuery billing export
  - ✅ GCP authentication (service account, ADC)
  - ✅ Multi-project support with parallel retrieval
  - ✅ Multi-currency cost aggregation
  - ✅ Cost breakdown by service and time period
  - ✅ Resource inventory (GCE, Storage, SQL, GKE)
  - ✅ Budget tracking and alerts
  - ✅ Organization-level cost aggregation
  - ✅ Comprehensive documentation and examples
  - ✅ 65 unit tests passing (100% coverage)
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

### Q2 2026 (v1.3.0 - Phase 2 Complete)

**Priority: Developer Experience & IDE Integration**
- ✅ **Interactive TUI Dashboard** (Issue #43)
  - React Ink-based terminal UI
  - Real-time cost monitoring with keyboard navigation
  - Multiple views: Services, Resources, Trends, Alerts
- ✅ **Cost Annotations for IaC Files** (Issue #54)
  - Terraform and CloudFormation cost comments
  - Inline optimization suggestions
  - Update/remove annotations
- ✅ **Git Cost History** (Issue #56)
  - Cost-commit correlation
  - Blame analysis by author
  - Historical trend analysis
- 🔮 **VS Code Extension** (Issue #55 - Planned)
  - Inline cost display for Terraform/CloudFormation
  - Sidebar panel with cost summaries
  - CodeLens integration
  - Hover information with alternatives
  - **Note:** VS Code extension will be a separate repository
  - Integration points with CLI for cost data

### Q2 2026 (v1.4.0 - Phase 3: CI/CD & Shift-Left)

**Priority: CI/CD Integration & Shift-Left Cost Management**
- ✅ **GitHub Actions Integration** (Issue #46)
  - Native GitHub Action for cost analysis in PRs
  - Cost gates with fail-on-increase and threshold checks
  - Enhanced PR comments with cost breakdown
  - Multiple output variables for downstream jobs
  - Slack notification support
- ✅ **Terraform Cost Preview** (Issue #47)
  - Parse terraform plan files (binary and JSON)
  - Estimate costs before deployment
  - Show create/modify/destroy breakdown
  - Cost threshold gates for CI/CD
  - Support for EC2, RDS, EBS, Load Balancers, and more
  - Monthly and hourly cost estimates
  - Shift-left cost management

### Q2 2026 (v1.5.0 - Phase 4: Communication & Collaboration)

**Priority: Communication & Collaboration**
- ✅ **Scheduled Reports with Daemon Mode** (Issue #42)
  - Built-in scheduler daemon for automated reports
  - Cron-based scheduling with timezone support
  - Multiple schedules per instance
  - Systemd service file generation
  - Execution logs and status monitoring
- ✅ **Microsoft Teams Integration** (Issue #45)
  - Incoming webhook support with Adaptive Cards
  - Multiple card styles (compact, detailed, executive)
  - Cost summaries and alert integration
  - Chargeback reports for Teams
- ✅ **PagerDuty & OpsGenie Integration** (Issue #48)
  - PagerDuty Events API v2 support
  - OpsGenie Alert API integration
  - Severity/priority mapping
  - Auto-resolve functionality
  - Deduplication to prevent spam
- ✅ **Email Report Scheduling** (Issue #58)
  - SendGrid and Mailgun support
  - Beautiful HTML email templates
  - Multiple recipient support
  - Scheduler integration for automated emails
  - Plain text fallback

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
