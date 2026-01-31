# 📊 Cost Analysis Commands

Advanced cost analysis features for forecasting, comparison, and trend analysis.

**NEW in v1.11.0** ✨

## Table of Contents

- [Cost Forecasting](#cost-forecasting) - Predict future spending
- [Multi-Cloud Comparison](#multi-cloud-comparison) - Compare across providers
- [Cost Trends](#cost-trends) - Analyze historical patterns

---

## Cost Forecasting

Forecast future cloud spending with statistical accuracy - plan budgets with confidence!

### Usage

```bash
infra-cost cost forecast [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--months <number>` | Number of months to forecast (1-12) | `3` |
| `--model <type>` | Forecasting model: linear, exponential, seasonal, auto | `auto` |
| `--confidence <level>` | Confidence level: 80, 90, 95 | `90` |
| `--provider <name>` | Cloud provider (aws, gcp, azure) | Auto-detected |
| `--format <type>` | Output format: table, json | `table` |

### Examples

#### Basic 3-month forecast
```bash
infra-cost cost forecast --months 3
```

**Output:**
```
📈 Cost Forecast Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Forecast Period        3 months
Forecasting Model      AUTO (selected: SEASONAL)
Confidence Level       90%
Average Confidence     87.3%

Total Predicted Cost   $4,523.40
Average Daily Cost     $50.26
Average Monthly Cost   $1,507.80
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Monthly Forecast Breakdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Month      Predicted Cost  Range              Avg Confidence
─────────────────────────────────────────────────────────────
Feb 2026   $1,450.20      $1,320 - $1,580    89%
Mar 2026   $1,523.80      $1,390 - $1,658    87%
Apr 2026   $1,549.40      $1,412 - $1,687    86%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Trend Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Increasing Trend

Historical Average:  $45.30/day
Forecast Average:    $50.26/day
Change:              +11.0%

💡 Recommendations:
  ⚠️  Costs are projected to increase significantly
     • Review resource utilization
     • Consider implementing cost optimization strategies
     • Set up budget alerts
```

#### 6-month forecast with specific model
```bash
infra-cost cost forecast --months 6 --model seasonal
```

#### High confidence forecast (95%)
```bash
infra-cost cost forecast --months 3 --confidence 95
```

#### JSON output for automation
```bash
infra-cost cost forecast --months 3 --format json > forecast.json
```

### Forecasting Models

#### 1. **Linear** - Constant growth/decline
Best for: Stable, predictable workloads
```bash
infra-cost cost forecast --model linear
```

#### 2. **Exponential** - Accelerating growth
Best for: Rapidly scaling applications
```bash
infra-cost cost forecast --model exponential
```

#### 3. **Seasonal** - Weekly/monthly patterns
Best for: Workloads with recurring patterns
```bash
infra-cost cost forecast --model seasonal
```

#### 4. **Auto** - Automatically selects best model
Best for: General use (recommended)
```bash
infra-cost cost forecast --model auto
```

### Features

- 📊 **4 Statistical Models**: Linear, exponential, seasonal, auto-select
- 🎯 **Confidence Intervals**: 80%, 90%, 95% accuracy levels
- 📅 **Flexible Periods**: 1-12 month predictions
- 📈 **Trend Detection**: Automatic identification of cost patterns
- 💡 **Smart Recommendations**: Context-aware optimization suggestions
- 🔢 **Statistical Accuracy**: Linear regression with standard error calculations

---

## Multi-Cloud Comparison

Compare costs across multiple cloud providers - find the best value for your workloads!

### Usage

```bash
infra-cost cost compare [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--providers <list>` | Comma-separated provider list | `aws,gcp,azure` |
| `--services <list>` | Filter specific services | All services |
| `--format <type>` | Output format: table, json | `table` |

### Examples

#### Compare AWS, GCP, and Azure
```bash
infra-cost cost compare --providers aws,gcp,azure
```

**Output:**
```
🌐 Comparing costs across cloud providers...

💰 Total Cost Comparison
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Provider  Total Cost (MTD)  % of Total  Rank
─────────────────────────────────────────────────────────────
AWS       $2,340.50        62.1%       #1
GCP       $892.30          23.7%       #2
AZURE     $535.80          14.2%       #3
─────────────────────────────────────────────────────────────
TOTAL     $3,768.60        100.0%

🔧 Service-Level Comparison
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service    AWS        GCP        AZURE      Total
─────────────────────────────────────────────────────────────
Compute    $1,240.20  $450.30    $280.40    $1,970.90
Storage    $520.80    $230.50    $150.20    $901.50
Database   $380.40    $150.20    $80.30     $610.90
Network    $199.10    $61.30     $24.90     $285.30

🏆 Top 5 Services per Provider
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AWS:
Service             Cost        % of Provider
───────────────────────────────────────────────
🥇 EC2              $1,240.20   53.0%
🥈 RDS              $520.80     22.2%
🥉 S3               $380.40     16.2%

💡 Cost Optimization Recommendations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚠️  AWS represents 62.1% of total costs
     • Consider multi-cloud strategy to reduce vendor lock-in
     • Evaluate workload migration opportunities

  🔄 3 services running across multiple providers
     • Review for potential consolidation opportunities
     • Consider reserved instances/committed use discounts

  💰 Potential savings: $704.70/month (30.1%)
     • Migrate workloads from AWS to AZURE
     • Review pricing models and reserved capacity options
```

#### Compare specific providers
```bash
infra-cost cost compare --providers aws,gcp
```

#### Filter specific services
```bash
infra-cost cost compare --services compute,storage
```

#### JSON output for dashboards
```bash
infra-cost cost compare --providers aws,gcp,azure --format json
```

### Supported Providers

- ✅ **AWS** - Amazon Web Services
- ✅ **GCP** - Google Cloud Platform
- ✅ **Azure** - Microsoft Azure
- ✅ **Oracle** - Oracle Cloud Infrastructure
- ✅ **Alibaba** - Alibaba Cloud

### Features

- 🌐 **5 Cloud Providers**: Compare across major cloud platforms
- 📊 **Service-Level Breakdown**: Compare individual services across clouds
- 🏆 **Provider Rankings**: Automatic ranking by total cost
- 💡 **Savings Opportunities**: Calculate migration savings potential
- ⚠️ **Vendor Lock-in Alerts**: Warn when single provider > 60%
- 🔝 **Top Services**: Identify most expensive services per provider

---

## Cost Trends

Analyze cost patterns over time - understand your spending evolution!

### Usage

```bash
infra-cost cost trends [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--period <time>` | Time period: 7d, 30d, 90d, 12m | `30d` |
| `--granularity <level>` | Aggregation: daily, weekly, monthly | `daily` |
| `--services <list>` | Filter specific services | All services |
| `--provider <name>` | Cloud provider | Auto-detected |
| `--format <type>` | Output format: table, json | `table` |

### Examples

#### 30-day trend analysis
```bash
infra-cost cost trends --period 30d
```

**Output:**
```
📊 Analyzing cost trends...

📈 Trend Overview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Period         30d
Data Points    30

Total Cost     $1,523.40
Average Cost   $50.78
Min Cost       $42.30
Max Cost       $62.50

Overall Trend  📈 Increasing
Trend Change   +8.3%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 Service Trends
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service    Previous Avg  Current Avg  Change    Trend
─────────────────────────────────────────────────────────────
EC2        $22.30       $26.80       +20.2%    ↑ up
RDS        $15.20       $16.40       +7.9%     ↑ up
S3         $8.40        $8.20        -2.4%     → stable
Lambda     $4.20        $3.80        -9.5%     ↓ down

📊 Cost Trend Visualization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 $62   │                                 ██
 $58   │                               ████
 $54   │                             ██████
 $50   │                   ████████████████
 $46   │         ████████████████████████
 $42   │   ████████████████████████████
       └─────────────────────────────────────────────────────
         Legend: █ Low █ Medium █ High

💡 Insights & Recommendations
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ⚠️  Services with increasing costs:
     • EC2: +20.2%
     • RDS: +7.9%

  ✅ Cost patterns are stable
     • Low variance in daily costs
     • Predictable spending patterns
```

#### 90-day trend with weekly aggregation
```bash
infra-cost cost trends --period 90d --granularity weekly
```

#### Analyze specific services
```bash
infra-cost cost trends --period 30d --services ec2,rds,s3
```

#### JSON output
```bash
infra-cost cost trends --period 30d --format json > trends.json
```

### Time Periods

- `7d` - Last 7 days (daily granularity recommended)
- `30d` - Last 30 days (daily or weekly)
- `90d` - Last 90 days (weekly recommended)
- `12m` - Last 12 months (monthly recommended)

### Granularity Levels

- **Daily** - Best for 7d-30d periods
- **Weekly** - Best for 30d-90d periods
- **Monthly** - Best for 90d-12m periods

### Features

- ⏰ **Flexible Periods**: 7d, 30d, 90d, 12m analysis windows
- 📊 **Multiple Granularities**: Daily, weekly, monthly aggregation
- 🎨 **ASCII Visualization**: Color-coded terminal charts
- 📈 **Volatility Detection**: Statistical analysis of cost variance
- 💡 **Actionable Insights**: Services with biggest changes highlighted
- 🔍 **Service Filtering**: Analyze specific services or all together

---

## See Also

- [Quick Commands](./QUICK_COMMANDS.md) - now, free-tier commands
- [Monitoring](./MONITORING.md) - alerts, budgets, anomaly detection
- [Optimization](./OPTIMIZATION.md) - recommendations and rightsizing
- [Getting Started Guide](../guides/GETTING_STARTED.md) - Comprehensive setup guide

---

**Back to:** [Documentation Home](../README.md) | [Main README](../../README.md)
