export type DocBlock =
  | { type: "text"; content: string }
  | { type: "heading"; level: 2 | 3; content: string }
  | { type: "code"; language: string; code: string; filename?: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "note"; content: string }
  | { type: "warning"; content: string }
  | { type: "tip"; content: string }
  | { type: "divider" };

export type DocPage = {
  title: string;
  description: string;
  badge?: string;
  blocks: DocBlock[];
};

export const docsContent: Record<string, DocPage> = {
  // ─── GETTING STARTED ────────────────────────────────────────────────────────

  installation: {
    title: "Installation",
    description: "Get infra-cost installed and ready in under a minute.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Requirements",
      },
      {
        type: "list",
        items: [
          "Node.js 20.0.0 or higher",
          "npm, pnpm, or yarn",
          "Active cloud credentials (AWS, GCP, or Azure)",
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Install via npm (recommended)",
      },
      {
        type: "text",
        content:
          "Install infra-cost globally so it's available as a system command from any directory.",
      },
      {
        type: "code",
        language: "bash",
        code: "npm install -g infra-cost",
      },
      {
        type: "text",
        content: "Verify the installation:",
      },
      {
        type: "code",
        language: "bash",
        code: "infra-cost --version\n# infra-cost/1.11.0 linux-x64 node-v20.0.0",
      },
      {
        type: "heading",
        level: 2,
        content: "Run without installing (npx)",
      },
      {
        type: "text",
        content:
          "Use npx to run infra-cost without a global install — great for CI/CD or one-off use.",
      },
      {
        type: "code",
        language: "bash",
        code: "npx infra-cost cost analyze --provider aws",
      },
      {
        type: "heading",
        level: 2,
        content: "Install via Homebrew",
      },
      {
        type: "text",
        content: "On macOS and Linux, you can install via Homebrew:",
      },
      {
        type: "code",
        language: "bash",
        code: "brew tap codecollab-co/tap\nbrew install infra-cost",
      },
      {
        type: "heading",
        level: 2,
        content: "Run with Docker",
      },
      {
        type: "text",
        content:
          "Run infra-cost in a container with your credentials passed as environment variables.",
      },
      {
        type: "code",
        language: "bash",
        code: `docker run --rm \\
  -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \\
  -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \\
  codecollab-co/infra-cost cost analyze --provider aws`,
      },
      {
        type: "heading",
        level: 2,
        content: "GitHub Action",
      },
      {
        type: "text",
        content:
          "Use infra-cost directly in your GitHub Actions workflows to add cost visibility to pull requests.",
      },
      {
        type: "code",
        language: "yaml",
        filename: ".github/workflows/cost-check.yml",
        code: `- uses: codecollab-co/infra-cost@v1.11.0
  with:
    provider: aws
    command: cost analyze`,
      },
      {
        type: "note",
        content:
          "See the GitHub Actions integration guide for full workflow examples with PR comments and cost gates.",
      },
    ],
  },

  "quick-start": {
    title: "Quick Start",
    description:
      "Go from installation to your first cost analysis in under 5 minutes.",
    blocks: [
      {
        type: "text",
        content:
          "This guide walks you through installing infra-cost, connecting it to your AWS or GCP account, and running your first cost analysis.",
      },
      {
        type: "heading",
        level: 2,
        content: "Step 1 — Install",
      },
      {
        type: "code",
        language: "bash",
        code: "npm install -g infra-cost",
      },
      {
        type: "heading",
        level: 2,
        content: "Step 2 — Connect your cloud",
      },
      {
        type: "text",
        content:
          "infra-cost uses your existing cloud credentials. If you already have the AWS CLI or gcloud configured, it will pick them up automatically.",
      },
      {
        type: "code",
        language: "bash",
        code: `# AWS — uses ~/.aws/credentials automatically
infra-cost config init --provider aws

# GCP — uses Application Default Credentials
infra-cost config init --provider gcp --project-id my-project`,
      },
      {
        type: "heading",
        level: 2,
        content: "Step 3 — Run your first analysis",
      },
      {
        type: "code",
        language: "bash",
        code: "infra-cost cost analyze --provider aws --period 30d",
      },
      {
        type: "text",
        content: "You'll see a breakdown like this in your terminal:",
      },
      {
        type: "code",
        language: "text",
        code: `  AWS Cost Analysis — Last 30 Days
  ──────────────────────────────────────────────────
  Service              Cost         Change
  ──────────────────────────────────────────────────
  EC2                  $2,847.32    ▲ 12.9%
  RDS                  $1,203.45    ▲  1.4%
  S3                     $342.18    ▲ 14.7%
  Lambda                  $89.23    ▼  3.1%
  ──────────────────────────────────────────────────
  TOTAL                $4,549.63    ▲  9.1%`,
      },
      {
        type: "heading",
        level: 2,
        content: "What's next?",
      },
      {
        type: "list",
        items: [
          "Run `infra-cost optimize quickwins` to see immediate savings opportunities",
          "Run `infra-cost cost forecast --months 3` to predict next quarter's spend",
          "Run `infra-cost monitor alerts` to set up budget alerts",
          "Run `infra-cost dashboard interactive` to launch the live TUI dashboard",
        ],
      },
      {
        type: "tip",
        content:
          "Run `infra-cost --help` at any time to see all available commands and global flags.",
      },
    ],
  },

  authentication: {
    title: "Authentication",
    description:
      "How infra-cost connects to your cloud provider accounts securely.",
    blocks: [
      {
        type: "text",
        content:
          "infra-cost is read-only — it never modifies your infrastructure. It only requires Cost Explorer, Billing, and read-only resource permissions.",
      },
      {
        type: "heading",
        level: 2,
        content: "AWS Authentication",
      },
      {
        type: "text",
        content:
          "infra-cost supports all standard AWS authentication methods. It uses the AWS SDK credential chain in this order:",
      },
      {
        type: "list",
        items: [
          "CLI flags: `--access-key`, `--secret-key`, `--session-token`",
          "Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`",
          "AWS profile: `--profile myprofile` or `AWS_PROFILE` env var",
          "IAM role (EC2 instance profile, ECS task role, Lambda)",
          "AWS SSO (configured via `aws sso configure`)",
        ],
      },
      {
        type: "heading",
        level: 3,
        content: "Using environment variables",
      },
      {
        type: "code",
        language: "bash",
        code: `export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
export AWS_DEFAULT_REGION=us-east-1

infra-cost cost analyze --provider aws`,
      },
      {
        type: "heading",
        level: 3,
        content: "Using a named profile",
      },
      {
        type: "code",
        language: "bash",
        code: "infra-cost cost analyze --provider aws --profile production",
      },
      {
        type: "heading",
        level: 3,
        content: "Minimum IAM permissions",
      },
      {
        type: "code",
        language: "json",
        filename: "infra-cost-policy.json",
        code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetReservationUtilization",
        "budgets:ViewBudget",
        "ec2:DescribeInstances",
        "rds:DescribeDBInstances",
        "s3:ListAllMyBuckets"
      ],
      "Resource": "*"
    }
  ]
}`,
      },
      {
        type: "heading",
        level: 2,
        content: "GCP Authentication",
      },
      {
        type: "text",
        content:
          "infra-cost supports Application Default Credentials (ADC) and explicit service account key files.",
      },
      {
        type: "heading",
        level: 3,
        content: "Application Default Credentials (recommended)",
      },
      {
        type: "code",
        language: "bash",
        code: `# Authenticate with gcloud
gcloud auth application-default login

infra-cost cost analyze --provider gcp --project-id my-project`,
      },
      {
        type: "heading",
        level: 3,
        content: "Service account key file",
      },
      {
        type: "code",
        language: "bash",
        code: `infra-cost cost analyze \\
  --provider gcp \\
  --project-id my-project \\
  --key-file /path/to/service-account.json`,
      },
      {
        type: "heading",
        level: 3,
        content: "Via environment variable",
      },
      {
        type: "code",
        language: "bash",
        code: `export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
infra-cost cost analyze --provider gcp --project-id my-project`,
      },
      {
        type: "warning",
        content:
          "Never commit service account key files to source control. Use environment variables or a secrets manager in CI/CD environments.",
      },
      {
        type: "heading",
        level: 2,
        content: "Global authentication flags",
      },
      {
        type: "table",
        headers: ["Flag", "Description"],
        rows: [
          ["--provider", "Cloud provider: aws, gcp, azure, alibaba, oracle"],
          ["--profile, -p", "AWS profile name from ~/.aws/credentials"],
          ["--access-key, -k", "AWS access key ID"],
          ["--secret-key, -s", "AWS secret access key"],
          ["--session-token, -T", "AWS session token (for temporary credentials)"],
          ["--project-id", "GCP project ID"],
          ["--key-file", "Path to GCP service account JSON key file"],
          ["--subscription-id", "Azure subscription ID"],
          ["--tenant-id", "Azure tenant ID"],
        ],
      },
    ],
  },

  configuration: {
    title: "Configuration",
    description:
      "Manage infra-cost configuration profiles for multiple accounts and environments.",
    blocks: [
      {
        type: "text",
        content:
          "infra-cost supports named configuration profiles so you can switch between multiple cloud accounts, regions, and output preferences without re-entering credentials every time.",
      },
      {
        type: "heading",
        level: 2,
        content: "Initialize a configuration",
      },
      {
        type: "code",
        language: "bash",
        code: `# Initialize with interactive prompts
infra-cost config init

# Initialize for a specific provider
infra-cost config init --provider aws

# Initialize a named profile
infra-cost config init --provider gcp --config-profile staging`,
      },
      {
        type: "heading",
        level: 2,
        content: "View current configuration",
      },
      {
        type: "code",
        language: "bash",
        code: `infra-cost config show

# Show a specific profile
infra-cost config show --config-profile production`,
      },
      {
        type: "heading",
        level: 2,
        content: "Validate configuration",
      },
      {
        type: "code",
        language: "bash",
        code: `infra-cost config validate
# ✓ AWS credentials valid
# ✓ Region reachable
# ✓ Cost Explorer API accessible`,
      },
      {
        type: "heading",
        level: 2,
        content: "Configuration file format",
      },
      {
        type: "text",
        content:
          "The config file lives at `~/.infra-cost/config.json`. You can also use `--config-file` to point to a custom path.",
      },
      {
        type: "code",
        language: "json",
        filename: "~/.infra-cost/config.json",
        code: `{
  "profiles": {
    "default": {
      "provider": "aws",
      "region": "us-east-1",
      "output": "fancy",
      "cache": { "enabled": true, "ttl": "4h" }
    },
    "production": {
      "provider": "aws",
      "profile": "prod-account",
      "region": "us-west-2",
      "output": "json"
    },
    "gcp-main": {
      "provider": "gcp",
      "projectId": "my-gcp-project",
      "keyFile": "/secrets/sa-key.json",
      "output": "fancy"
    }
  }
}`,
      },
      {
        type: "heading",
        level: 2,
        content: "Using profiles",
      },
      {
        type: "code",
        language: "bash",
        code: `# Use the default profile
infra-cost cost analyze

# Use a named profile
infra-cost cost analyze --config-profile production

# Override profile settings inline
infra-cost cost analyze --config-profile production --region eu-west-1`,
      },
      {
        type: "heading",
        level: 2,
        content: "Migrate from v0.x",
      },
      {
        type: "text",
        content:
          "If you have an existing v0.x configuration, run the migration command to upgrade it to the v1.x format:",
      },
      {
        type: "code",
        language: "bash",
        code: "infra-cost config migrate",
      },
      {
        type: "heading",
        level: 2,
        content: "Global output flags",
      },
      {
        type: "table",
        headers: ["Flag", "Values", "Description"],
        rows: [
          ["--output", "fancy, json, csv, text", "Output format"],
          ["--no-color", "—", "Disable terminal colors"],
          ["--quiet", "—", "Minimal output, errors only"],
          ["--verbose", "—", "Debug-level output"],
          ["--no-cache", "—", "Skip cache, fetch live data"],
          ["--cache-ttl", "4h, 30m, 1d, etc.", "Override cache time-to-live"],
        ],
      },
    ],
  },

  // ─── COMMANDS ───────────────────────────────────────────────────────────────

  "cost-analyze": {
    title: "cost analyze",
    description:
      "Analyze cloud costs by service and time period with change tracking.",
    badge: "Core command",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Overview",
      },
      {
        type: "text",
        content:
          "`cost analyze` fetches your cloud cost data for a given period and presents a breakdown by service with period-over-period change indicators. It's the primary day-to-day command for cost monitoring.",
      },
      {
        type: "heading",
        level: 2,
        content: "Usage",
      },
      {
        type: "code",
        language: "bash",
        code: "infra-cost cost analyze [options]",
      },
      {
        type: "heading",
        level: 2,
        content: "Options",
      },
      {
        type: "table",
        headers: ["Flag", "Default", "Description"],
        rows: [
          ["--provider", "aws", "Cloud provider (aws, gcp)"],
          ["--period", "30d", "Time period: 7d, 30d, 90d, 6m, 12m"],
          ["--region", "(all)", "Filter to a specific region"],
          ["--output", "fancy", "Output format: fancy, json, csv, text"],
          ["--profile", "(default)", "AWS credential profile to use"],
          ["--no-cache", "false", "Skip cache and fetch live data"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Examples",
      },
      {
        type: "code",
        language: "bash",
        code: `# Last 30 days, default AWS profile
infra-cost cost analyze --provider aws

# Last 7 days, specific region
infra-cost cost analyze --provider aws --period 7d --region us-west-2

# GCP project
infra-cost cost analyze --provider gcp --project-id my-project

# Output as JSON (useful for piping)
infra-cost cost analyze --provider aws --output json | jq '.services[0]'

# Use a named config profile
infra-cost cost analyze --config-profile production`,
      },
      {
        type: "heading",
        level: 2,
        content: "Sample output",
      },
      {
        type: "code",
        language: "text",
        code: `  AWS Cost Analysis — Last 30 Days
  ──────────────────────────────────────────────────
  Service              Cost         Change
  ──────────────────────────────────────────────────
  EC2                  $2,847.32    ▲ 12.9%
  RDS                  $1,203.45    ▲  1.4%
  S3                     $342.18    ▲ 14.7%
  Lambda                  $89.23    ▼  3.1%
  CloudFront              $67.45    ▼  5.4%
  ──────────────────────────────────────────────────
  TOTAL                $4,549.63    ▲  9.1%

  💡 EC2 costs up 12.9% — run optimize quickwins`,
      },
      {
        type: "tip",
        content:
          "Pipe to `--output json` and use with `jq` or export to CSV for spreadsheet analysis.",
      },
    ],
  },

  "cost-forecast": {
    title: "cost forecast",
    description:
      "Predict future cloud spend using statistical forecasting models.",
    badge: "New in v1.11",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Overview",
      },
      {
        type: "text",
        content:
          "`cost forecast` analyzes your historical spending to predict future costs. It supports four forecasting models and outputs predictions with configurable confidence intervals.",
      },
      {
        type: "heading",
        level: 2,
        content: "Forecasting models",
      },
      {
        type: "table",
        headers: ["Model", "Best for", "Description"],
        rows: [
          ["linear", "Steady growth", "Linear regression on historical spend"],
          ["exponential", "Accelerating growth", "Exponential curve fitting"],
          ["seasonal", "Cyclical patterns", "Seasonal decomposition (monthly/weekly cycles)"],
          ["auto", "Unknown patterns", "Automatically selects best-fit model using R² score"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Usage",
      },
      {
        type: "code",
        language: "bash",
        code: "infra-cost cost forecast [options]",
      },
      {
        type: "heading",
        level: 2,
        content: "Options",
      },
      {
        type: "table",
        headers: ["Flag", "Default", "Description"],
        rows: [
          ["--months", "3", "Number of months to forecast (1–12)"],
          ["--model", "auto", "Model: linear, exponential, seasonal, auto"],
          ["--confidence", "90", "Confidence interval: 80, 90, or 95"],
          ["--provider", "aws", "Cloud provider (aws, gcp)"],
          ["--output", "fancy", "Output format: fancy, json, csv"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Examples",
      },
      {
        type: "code",
        language: "bash",
        code: `# Auto-select best model, 3-month forecast
infra-cost cost forecast --provider aws --months 3 --model auto

# 6-month seasonal forecast with 95% confidence
infra-cost cost forecast --provider aws --months 6 --model seasonal --confidence 95

# 12-month forecast exported as JSON
infra-cost cost forecast --months 12 --output json > forecast.json`,
      },
      {
        type: "heading",
        level: 2,
        content: "Sample output",
      },
      {
        type: "code",
        language: "text",
        code: `  AWS Cost Forecast — Next 3 Months  [95% CI]
  ──────────────────────────────────────────────────
  Month         Predicted      Low          High
  ──────────────────────────────────────────────────
  Feb 2026      $4,823.40    $4,512.30   $5,134.50
  Mar 2026      $5,104.80    $4,732.10   $5,477.50
  Apr 2026      $5,312.20    $4,891.40   $5,732.90
  ──────────────────────────────────────────────────
  Q1 Total      $15,240.40   ▲ 16.8% vs current

  Model: seasonal (R²=0.94, best fit from 12 months)
  📈 Trend: accelerating growth — budget review advised`,
      },
      {
        type: "note",
        content:
          "At least 3 months of historical data is required. The seasonal model requires 12+ months for reliable results.",
      },
    ],
  },

  "cost-compare": {
    title: "cost compare",
    description: "Side-by-side cost comparison across multiple cloud providers.",
    badge: "New in v1.11",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Overview",
      },
      {
        type: "text",
        content:
          "`cost compare` queries multiple cloud providers simultaneously and presents their costs side by side at the service level, highlighting where one cloud is cheaper than another.",
      },
      {
        type: "heading",
        level: 2,
        content: "Usage",
      },
      {
        type: "code",
        language: "bash",
        code: "infra-cost cost compare --providers <list> [options]",
      },
      {
        type: "heading",
        level: 2,
        content: "Options",
      },
      {
        type: "table",
        headers: ["Flag", "Default", "Description"],
        rows: [
          ["--providers", "(required)", "Comma-separated list: aws,gcp or aws,gcp,azure"],
          ["--period", "30d", "Time period to compare"],
          ["--services", "(all)", "Filter to specific service categories"],
          ["--output", "fancy", "Output format"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Examples",
      },
      {
        type: "code",
        language: "bash",
        code: `# Compare AWS and GCP last 30 days
infra-cost cost compare --providers aws,gcp

# Compare last 90 days, compute services only
infra-cost cost compare --providers aws,gcp --period 90d --services compute,database

# Export comparison as CSV
infra-cost cost compare --providers aws,gcp --output csv > comparison.csv`,
      },
      {
        type: "heading",
        level: 2,
        content: "Sample output",
      },
      {
        type: "code",
        language: "text",
        code: `  Multi-Cloud Cost Comparison — Last 30 Days
  ──────────────────────────────────────────────────
  Service              AWS            GCP         Diff
  ──────────────────────────────────────────────────
  Compute           $2,847.32      $1,923.45   -$923.87
  Database          $1,203.45      $1,445.20   +$241.75
  Storage             $342.18        $198.32   -$143.86
  Functions            $89.23         $45.12    -$44.11
  ──────────────────────────────────────────────────
  TOTAL             $4,549.63      $3,612.09   -$937.54

  💰 GCP 20.6% cheaper for compute workloads`,
      },
      {
        type: "note",
        content:
          "Each provider must be authenticated before running a comparison. See the provider setup guides for AWS and GCP.",
      },
    ],
  },

  "cost-trends": {
    title: "cost trends",
    description:
      "Analyze cost trends over time with ASCII charts and volatility detection.",
    badge: "New in v1.11",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Overview",
      },
      {
        type: "text",
        content:
          "`cost trends` shows how your cloud spending has changed over time. It includes ASCII visualizations, volatility scores, and period-over-period change breakdowns.",
      },
      {
        type: "heading",
        level: 2,
        content: "Usage",
      },
      {
        type: "code",
        language: "bash",
        code: "infra-cost cost trends [options]",
      },
      {
        type: "heading",
        level: 2,
        content: "Options",
      },
      {
        type: "table",
        headers: ["Flag", "Default", "Description"],
        rows: [
          ["--period", "90d", "Analysis period: 7d, 30d, 90d, 6m, 12m"],
          ["--granularity", "weekly", "Breakdown: daily, weekly, monthly"],
          ["--provider", "aws", "Cloud provider"],
          ["--service", "(all)", "Focus on a specific service (e.g. EC2, RDS)"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Examples",
      },
      {
        type: "code",
        language: "bash",
        code: `# 90-day trend with weekly granularity
infra-cost cost trends --provider aws --period 90d

# 12-month monthly breakdown
infra-cost cost trends --provider aws --period 12m --granularity monthly

# EC2 cost trend only
infra-cost cost trends --provider aws --service EC2 --period 6m`,
      },
      {
        type: "tip",
        content:
          "Use `--granularity daily` to spot specific dates where costs spiked, then cross-reference with your deployment history using `infra-cost git history`.",
      },
    ],
  },

  optimize: {
    title: "optimize",
    description:
      "AI-powered cost optimization recommendations and rightsizing analysis.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Subcommands",
      },
      {
        type: "table",
        headers: ["Subcommand", "Description"],
        rows: [
          ["optimize recommendations", "Full list of cost optimization suggestions"],
          ["optimize quickwins", "Immediate savings with low implementation effort"],
          ["optimize rightsizing", "ML recommendations for over-provisioned resources"],
          ["optimize cross-cloud", "Identify workloads that could be cheaper on another provider"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "optimize recommendations",
      },
      {
        type: "code",
        language: "bash",
        code: `infra-cost optimize recommendations --provider aws

# Example output:
# 1. Rightsize 3 idle EC2 instances          → save ~$340/mo
# 2. Delete 8 unattached EBS volumes         → save ~$96/mo
# 3. Move S3 objects to Glacier (>90 days)   → save ~$78/mo
# 4. Enable RDS auto-pause (dev instances)   → save ~$210/mo`,
      },
      {
        type: "heading",
        level: 2,
        content: "optimize quickwins",
      },
      {
        type: "text",
        content:
          "Quick wins are optimizations that can be applied immediately with minimal risk — typically idle resources, oversized instances, and unused storage.",
      },
      {
        type: "code",
        language: "bash",
        code: "infra-cost optimize quickwins --provider aws",
      },
      {
        type: "heading",
        level: 2,
        content: "optimize rightsizing",
      },
      {
        type: "text",
        content:
          "Analyzes CPU, memory, and network utilization metrics to recommend optimal instance types for your actual workload.",
      },
      {
        type: "code",
        language: "bash",
        code: `# Get rightsizing recommendations for EC2
infra-cost optimize rightsizing --provider aws

# Focus on specific instance family
infra-cost optimize rightsizing --provider aws --family m5`,
      },
      {
        type: "heading",
        level: 2,
        content: "optimize cross-cloud",
      },
      {
        type: "code",
        language: "bash",
        code: "infra-cost optimize cross-cloud --providers aws,gcp",
      },
      {
        type: "note",
        content:
          "Rightsizing recommendations require CloudWatch metrics access in addition to Cost Explorer permissions.",
      },
    ],
  },

  monitor: {
    title: "monitor",
    description:
      "Real-time cost monitoring, budget tracking, and anomaly detection.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Subcommands",
      },
      {
        type: "table",
        headers: ["Subcommand", "Description"],
        rows: [
          ["monitor alerts", "Check current cost alerts and their status"],
          ["monitor budgets", "View budget utilization and threshold status"],
          ["monitor watch", "Live real-time monitoring dashboard in the terminal"],
          ["monitor anomaly", "Detect and report unusual cost spikes"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "monitor alerts",
      },
      {
        type: "code",
        language: "bash",
        code: `# Check all configured alerts
infra-cost monitor alerts --provider aws

# Create a new alert
infra-cost monitor alerts --create --threshold 5000 --email team@company.com`,
      },
      {
        type: "heading",
        level: 2,
        content: "monitor budgets",
      },
      {
        type: "code",
        language: "bash",
        code: `# View all budgets and their current utilization
infra-cost monitor budgets --provider aws

# Example output:
# Q1 2026 Budget   $15,000   ████████░░  76% ($11,400 used)
# Dev Environment  $2,000    ████░░░░░░  40% ($800 used)`,
      },
      {
        type: "heading",
        level: 2,
        content: "monitor watch",
      },
      {
        type: "text",
        content:
          "Starts a live monitoring session that refreshes automatically. Press `q` to quit, `r` to refresh manually.",
      },
      {
        type: "code",
        language: "bash",
        code: `# Start live monitoring (refreshes every 5 minutes)
infra-cost monitor watch --provider aws

# Custom refresh interval
infra-cost monitor watch --provider aws --interval 10m`,
      },
      {
        type: "heading",
        level: 2,
        content: "monitor anomaly",
      },
      {
        type: "code",
        language: "bash",
        code: `# Detect anomalies in the last 30 days
infra-cost monitor anomaly --provider aws

# Set sensitivity (1=low, 5=high)
infra-cost monitor anomaly --provider aws --sensitivity 3`,
      },
    ],
  },

  export: {
    title: "export",
    description: "Export cost data and generate reports in multiple formats.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "export inventory",
      },
      {
        type: "text",
        content:
          "Exports a full inventory of cloud resources with their associated costs. Useful for audits, finance reporting, and FinOps reviews.",
      },
      {
        type: "code",
        language: "bash",
        code: `# Export to JSON
infra-cost export inventory --provider aws --format json > inventory.json

# Export to Excel
infra-cost export inventory --provider aws --format xlsx

# Export to CSV
infra-cost export inventory --provider aws --format csv > costs.csv

# Export to PDF (generates a formatted report)
infra-cost export inventory --provider aws --format pdf`,
      },
      {
        type: "heading",
        level: 2,
        content: "chargeback report",
      },
      {
        type: "text",
        content:
          "Generates chargeback reports for distributing cloud costs across teams or cost centers. Supports tagging-based allocation.",
      },
      {
        type: "code",
        language: "bash",
        code: `# Generate a chargeback report
infra-cost chargeback report --provider aws

# Send report to Slack channel
infra-cost chargeback slack --channel #finops

# Send to Microsoft Teams
infra-cost chargeback teams --webhook $TEAMS_WEBHOOK_URL`,
      },
      {
        type: "heading",
        level: 2,
        content: "Supported output formats",
      },
      {
        type: "table",
        headers: ["Format", "Flag", "Use case"],
        rows: [
          ["JSON", "--format json", "Programmatic use, piping to other tools"],
          ["CSV", "--format csv", "Excel, Google Sheets, data analysis"],
          ["XLSX", "--format xlsx", "Formatted Excel with charts"],
          ["PDF", "--format pdf", "Executive summaries, audit reports"],
          ["Text", "--format text", "CI/CD logs, plain terminal output"],
        ],
      },
    ],
  },

  dashboard: {
    title: "dashboard",
    description:
      "Interactive terminal UI (TUI) for real-time multi-cloud cost monitoring.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Interactive TUI Dashboard",
      },
      {
        type: "text",
        content:
          "The interactive dashboard launches a full-screen terminal UI with live cost data, keyboard navigation, and multiple views — no browser required.",
      },
      {
        type: "code",
        language: "bash",
        code: `# Launch interactive dashboard
infra-cost dashboard interactive --provider aws

# Multi-cloud dashboard (requires auth for each provider)
infra-cost dashboard multicloud --providers aws,gcp`,
      },
      {
        type: "heading",
        level: 2,
        content: "Keyboard shortcuts",
      },
      {
        type: "table",
        headers: ["Key", "Action"],
        rows: [
          ["↑ / ↓", "Navigate between services"],
          ["← / →", "Switch time period"],
          ["Tab", "Switch between views (cost / trend / forecast)"],
          ["r", "Refresh data"],
          ["e", "Export current view"],
          ["?", "Show help overlay"],
          ["q / Ctrl+C", "Quit dashboard"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Dashboard views",
      },
      {
        type: "list",
        items: [
          "Cost Overview — Service breakdown with change indicators",
          "Trend Chart — ASCII line chart of spending over time",
          "Forecast — Predicted costs for the next 3 months",
          "Anomalies — Detected cost spikes highlighted in red",
          "Budgets — Budget utilization progress bars",
        ],
      },
      {
        type: "tip",
        content:
          "The dashboard refreshes every 5 minutes by default. Use `--interval 1m` for near-real-time monitoring.",
      },
    ],
  },

  // ─── PROVIDERS ──────────────────────────────────────────────────────────────

  aws: {
    title: "AWS Setup",
    description:
      "Configure infra-cost for Amazon Web Services cost analysis.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Prerequisites",
      },
      {
        type: "list",
        items: [
          "An AWS account with billing data",
          "AWS Cost Explorer enabled (free, takes 24h to activate on new accounts)",
          "IAM credentials with Cost Explorer read access",
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Enable AWS Cost Explorer",
      },
      {
        type: "text",
        content:
          "If Cost Explorer isn't enabled yet, go to the AWS Billing Console → Cost Explorer → Enable Cost Explorer. It takes up to 24 hours for initial data to appear.",
      },
      {
        type: "heading",
        level: 2,
        content: "Required IAM permissions",
      },
      {
        type: "code",
        language: "json",
        filename: "infra-cost-aws-policy.json",
        code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "InfraCostReadOnly",
      "Effect": "Allow",
      "Action": [
        "ce:GetCostAndUsage",
        "ce:GetCostForecast",
        "ce:GetDimensionValues",
        "ce:GetReservationUtilization",
        "ce:GetSavingsPlanUtilization",
        "budgets:ViewBudget",
        "budgets:DescribeBudgets",
        "ec2:DescribeInstances",
        "ec2:DescribeRegions",
        "rds:DescribeDBInstances",
        "s3:ListAllMyBuckets",
        "lambda:ListFunctions",
        "organizations:ListAccounts",
        "organizations:DescribeOrganization",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}`,
      },
      {
        type: "heading",
        level: 2,
        content: "Authentication methods",
      },
      {
        type: "code",
        language: "bash",
        code: `# Method 1: Use existing ~/.aws/credentials profile
infra-cost cost analyze --provider aws --profile default

# Method 2: Environment variables
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG
export AWS_DEFAULT_REGION=us-east-1
infra-cost cost analyze --provider aws

# Method 3: IAM role (no credentials needed when running on EC2/ECS/Lambda)
infra-cost cost analyze --provider aws

# Method 4: AWS SSO
aws sso login --profile my-sso-profile
infra-cost cost analyze --provider aws --profile my-sso-profile`,
      },
      {
        type: "heading",
        level: 2,
        content: "Supported AWS services",
      },
      {
        type: "list",
        items: [
          "EC2 (Compute) — instances, reserved instances, spot",
          "RDS (Database) — instances, clusters, Aurora",
          "S3 — storage, requests, data transfer",
          "Lambda — invocations, duration, data transfer",
          "CloudFront — data transfer, requests",
          "EKS — cluster costs",
          "ElastiCache, DynamoDB, SNS, SQS, and more",
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "AWS Organizations support",
      },
      {
        type: "text",
        content:
          "If you manage multiple AWS accounts through AWS Organizations, use the organizations commands for consolidated billing:",
      },
      {
        type: "code",
        language: "bash",
        code: `# List all accounts in your organization
infra-cost organizations list

# Get organization-wide cost summary
infra-cost organizations summary

# Daily costs for all accounts
infra-cost organizations daily`,
      },
    ],
  },

  gcp: {
    title: "Google Cloud Setup",
    description:
      "Configure infra-cost for Google Cloud Platform cost analysis.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Prerequisites",
      },
      {
        type: "list",
        items: [
          "A GCP project with billing enabled",
          "BigQuery billing export enabled (recommended for detailed analysis)",
          "A service account with billing viewer permissions",
          "gcloud CLI installed (for ADC authentication)",
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Enable BigQuery Billing Export",
      },
      {
        type: "text",
        content:
          "BigQuery billing export gives infra-cost detailed cost data. Enable it in the GCP Console:",
      },
      {
        type: "list",
        items: [
          "Go to Billing → Billing Export → BigQuery Export",
          "Enable Standard usage cost export",
          "Create or select a BigQuery dataset (e.g. `billing_export`)",
          "Note the dataset name — you'll need it for configuration",
        ],
      },
      {
        type: "warning",
        content:
          "BigQuery export takes up to 48 hours to populate after enabling. Standard API billing data is available immediately as a fallback.",
      },
      {
        type: "heading",
        level: 2,
        content: "Required IAM roles",
      },
      {
        type: "table",
        headers: ["Role", "Purpose"],
        rows: [
          ["roles/billing.viewer", "View billing account costs"],
          ["roles/bigquery.dataViewer", "Read BigQuery billing export data"],
          ["roles/compute.viewer", "List Compute Engine resources"],
          ["roles/container.viewer", "List GKE clusters"],
          ["roles/cloudsql.viewer", "List Cloud SQL instances"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Create a service account",
      },
      {
        type: "code",
        language: "bash",
        code: `# Create service account
gcloud iam service-accounts create infra-cost-reader \\
  --display-name "infra-cost reader"

# Assign roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \\
  --member="serviceAccount:infra-cost-reader@YOUR_PROJECT_ID.iam.gserviceaccount.com" \\
  --role="roles/billing.viewer"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \\
  --member="serviceAccount:infra-cost-reader@YOUR_PROJECT_ID.iam.gserviceaccount.com" \\
  --role="roles/bigquery.dataViewer"

# Download key file
gcloud iam service-accounts keys create infra-cost-key.json \\
  --iam-account=infra-cost-reader@YOUR_PROJECT_ID.iam.gserviceaccount.com`,
      },
      {
        type: "heading",
        level: 2,
        content: "Authentication",
      },
      {
        type: "code",
        language: "bash",
        code: `# Method 1: Application Default Credentials (gcloud)
gcloud auth application-default login
infra-cost cost analyze --provider gcp --project-id my-project

# Method 2: Service account key file
infra-cost cost analyze \\
  --provider gcp \\
  --project-id my-project \\
  --key-file ./infra-cost-key.json

# Method 3: Environment variable
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/infra-cost-key.json
infra-cost cost analyze --provider gcp --project-id my-project`,
      },
      {
        type: "heading",
        level: 2,
        content: "Multi-project analysis",
      },
      {
        type: "code",
        language: "bash",
        code: `# Analyze a single project
infra-cost cost analyze --provider gcp --project-id project-a

# Analyze all projects in a folder
infra-cost cost analyze --provider gcp --folder-id 12345678

# Analyze all projects in an organization
infra-cost cost analyze --provider gcp --org-id 987654321`,
      },
    ],
  },

  azure: {
    title: "Azure Setup",
    description: "Microsoft Azure support — currently in active development.",
    blocks: [
      {
        type: "warning",
        content:
          "Azure integration is in active development and will be fully available in an upcoming release. The architecture is in place; API integration is being finalized.",
      },
      {
        type: "heading",
        level: 2,
        content: "Planned capabilities",
      },
      {
        type: "list",
        items: [
          "Azure Cost Management API integration",
          "Virtual Machines, Azure SQL, Blob Storage, AKS cost analysis",
          "Service principal and managed identity authentication",
          "Azure subscription and management group aggregation",
          "Multi-subscription cost comparison",
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Expected authentication methods",
      },
      {
        type: "code",
        language: "bash",
        code: `# Service principal (planned)
infra-cost cost analyze \\
  --provider azure \\
  --subscription-id YOUR_SUBSCRIPTION_ID \\
  --tenant-id YOUR_TENANT_ID \\
  --client-id YOUR_CLIENT_ID \\
  --client-secret YOUR_CLIENT_SECRET

# Managed identity (planned — when running in Azure)
infra-cost cost analyze \\
  --provider azure \\
  --subscription-id YOUR_SUBSCRIPTION_ID`,
      },
      {
        type: "note",
        content:
          "Track Azure support progress on GitHub. You can also open an issue to request prioritization.",
      },
    ],
  },

  // ─── INTEGRATIONS ───────────────────────────────────────────────────────────

  "github-actions": {
    title: "GitHub Actions",
    description:
      "Add cloud cost visibility and cost gates to your CI/CD pipelines.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Overview",
      },
      {
        type: "text",
        content:
          "infra-cost integrates with GitHub Actions to automatically analyze costs on every pull request, post cost summaries as PR comments, and block merges that exceed a cost threshold.",
      },
      {
        type: "heading",
        level: 2,
        content: "Basic usage",
      },
      {
        type: "code",
        language: "yaml",
        filename: ".github/workflows/infra-cost.yml",
        code: `name: Cloud Cost Analysis

on:
  pull_request:
  push:
    branches: [main]

jobs:
  cost-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: codecollab-co/infra-cost@v1.11.0
        with:
          provider: aws
          command: cost analyze
          period: 30d
        env:
          AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}`,
      },
      {
        type: "heading",
        level: 2,
        content: "Cost gate — block expensive deployments",
      },
      {
        type: "text",
        content:
          "Fail the workflow if the Terraform plan introduces costs above a threshold:",
      },
      {
        type: "code",
        language: "yaml",
        filename: ".github/workflows/cost-gate.yml",
        code: `name: Cost Gate

on: [pull_request]

jobs:
  cost-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3

      - name: Terraform Plan
        run: terraform plan -out=tfplan

      - name: Check Cost Threshold
        uses: codecollab-co/infra-cost@v1.11.0
        with:
          provider: aws
          command: terraform --plan tfplan --threshold 500
        env:
          AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}`,
      },
      {
        type: "heading",
        level: 2,
        content: "Action inputs",
      },
      {
        type: "table",
        headers: ["Input", "Required", "Description"],
        rows: [
          ["provider", "Yes", "Cloud provider: aws, gcp"],
          ["command", "Yes", "infra-cost command to run"],
          ["period", "No", "Time period (default: 30d)"],
          ["output", "No", "Output format (default: json)"],
          ["threshold", "No", "Cost threshold in USD — fails if exceeded"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Storing credentials securely",
      },
      {
        type: "list",
        items: [
          "Go to Settings → Secrets and variables → Actions in your GitHub repository",
          "Add `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` as repository secrets",
          "For GCP, add `GOOGLE_CREDENTIALS` as the service account JSON key content",
          "Never hardcode credentials in workflow files",
        ],
      },
    ],
  },

  slack: {
    title: "Slack Integration",
    description: "Send cost reports and alerts directly to Slack channels.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Setup",
      },
      {
        type: "list",
        items: [
          "Create a Slack app at api.slack.com/apps",
          "Enable Incoming Webhooks and create a webhook for your channel",
          "Copy the webhook URL",
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Configure the webhook",
      },
      {
        type: "code",
        language: "bash",
        code: `# Set via environment variable
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00/B00/xxx

# Or pass directly
infra-cost chargeback slack \\
  --webhook https://hooks.slack.com/services/T00/B00/xxx \\
  --channel "#finops"`,
      },
      {
        type: "heading",
        level: 2,
        content: "Sending reports",
      },
      {
        type: "code",
        language: "bash",
        code: `# Send a cost summary to Slack
infra-cost chargeback slack --provider aws --channel "#finops"

# Send a full cost analysis
infra-cost cost analyze --provider aws --output slack

# Schedule a weekly report (using system cron)
# Add to crontab: 0 9 * * MON infra-cost chargeback slack --channel "#finops"`,
      },
      {
        type: "heading",
        level: 2,
        content: "Automated alerts",
      },
      {
        type: "code",
        language: "bash",
        code: `# Configure Slack as the alert channel
infra-cost monitor alerts --create \\
  --threshold 5000 \\
  --channel slack \\
  --slack-channel "#alerts"`,
      },
      {
        type: "tip",
        content:
          "Use `infra-cost scheduler setup` to automatically send cost reports to Slack on a schedule without relying on cron jobs.",
      },
    ],
  },

  teams: {
    title: "Microsoft Teams",
    description: "Send cost reports and alerts to Microsoft Teams channels.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Setup",
      },
      {
        type: "list",
        items: [
          "In Microsoft Teams, go to the channel where you want to receive notifications",
          "Click ⋯ → Connectors → Incoming Webhook → Configure",
          "Give it a name (e.g. infra-cost) and copy the webhook URL",
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Configure the webhook",
      },
      {
        type: "code",
        language: "bash",
        code: `export TEAMS_WEBHOOK_URL=https://company.webhook.office.com/webhookb2/xxx

infra-cost chargeback teams --webhook $TEAMS_WEBHOOK_URL`,
      },
      {
        type: "heading",
        level: 2,
        content: "Sending reports",
      },
      {
        type: "code",
        language: "bash",
        code: `# Send monthly cost summary to Teams
infra-cost chargeback teams --provider aws

# Send cost analysis output
infra-cost cost analyze --provider aws --output teams`,
      },
      {
        type: "note",
        content:
          "Teams messages use Adaptive Cards for rich formatting. The report includes a cost table, change indicators, and a link to export the full report.",
      },
    ],
  },

  terraform: {
    title: "Terraform Integration",
    description:
      "Estimate infrastructure costs before deploying with Terraform.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Cost preview before apply",
      },
      {
        type: "text",
        content:
          "Run `terraform plan` to generate a plan file, then pass it to infra-cost for a cost estimate before you apply changes.",
      },
      {
        type: "code",
        language: "bash",
        code: `# Generate Terraform plan
terraform plan -out=tfplan

# Estimate costs from the plan
infra-cost terraform --plan tfplan

# Fail if estimated cost exceeds $500/month
infra-cost terraform --plan tfplan --threshold 500`,
      },
      {
        type: "heading",
        level: 2,
        content: "Annotate IaC files with costs",
      },
      {
        type: "text",
        content:
          "The `annotate` command adds cost comments to your Terraform or CloudFormation files, making costs visible directly in code review.",
      },
      {
        type: "code",
        language: "bash",
        code: `# Annotate all .tf files in the current directory
infra-cost annotate

# Annotate a specific file
infra-cost annotate --file main.tf`,
      },
      {
        type: "text",
        content: "After running, your Terraform file will have cost annotations like:",
      },
      {
        type: "code",
        language: "hcl",
        code: `resource "aws_instance" "web" {
  # infra-cost: ~$72/month (t3.medium, us-east-1)
  instance_type = "t3.medium"
  ami           = "ami-0c55b159cbfafe1f0"
}

resource "aws_db_instance" "db" {
  # infra-cost: ~$180/month (db.t3.medium, Multi-AZ)
  instance_class = "db.t3.medium"
  engine         = "postgres"
}`,
      },
      {
        type: "heading",
        level: 2,
        content: "Git cost history",
      },
      {
        type: "text",
        content:
          "Correlate cost changes with specific commits to understand which deployments caused cost increases.",
      },
      {
        type: "code",
        language: "bash",
        code: `# Show cost changes correlated with git commits
infra-cost git history

# Focus on a specific time range
infra-cost git history --since 2026-01-01`,
      },
    ],
  },

  // ─── ADVANCED ───────────────────────────────────────────────────────────────

  "api-server": {
    title: "API Server",
    description:
      "Run infra-cost as a REST API server for custom integrations and dashboards.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Start the server",
      },
      {
        type: "code",
        language: "bash",
        code: `# Start with default settings (localhost:3000)
infra-cost server start

# Custom port and API key
infra-cost server start --port 8080 --api-key your-secret-key

# Allow external access with CORS origins
infra-cost server start \\
  --port 8080 \\
  --api-key your-secret-key \\
  --cors-origins "https://dashboard.company.com"`,
      },
      {
        type: "warning",
        content:
          "The API server defaults to localhost-only for security. Exposing it externally requires explicitly setting --cors-origins and a strong --api-key.",
      },
      {
        type: "heading",
        level: 2,
        content: "Authentication",
      },
      {
        type: "text",
        content:
          "All API endpoints require an `X-API-Key` header matching the key set at startup.",
      },
      {
        type: "code",
        language: "bash",
        code: `curl http://localhost:3000/api/costs \\
  -H "X-API-Key: your-secret-key"`,
      },
      {
        type: "heading",
        level: 2,
        content: "API endpoints",
      },
      {
        type: "table",
        headers: ["Method", "Endpoint", "Description"],
        rows: [
          ["GET", "/api/costs", "Current cost analysis"],
          ["GET", "/api/costs/forecast", "Cost forecast"],
          ["GET", "/api/costs/trends", "Cost trend data"],
          ["GET", "/api/budgets", "Budget utilization"],
          ["GET", "/api/alerts", "Active cost alerts"],
          ["GET", "/api/optimize", "Optimization recommendations"],
          ["GET", "/health", "Server health check"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Example requests",
      },
      {
        type: "code",
        language: "bash",
        code: `# Get current costs as JSON
curl http://localhost:3000/api/costs?period=30d \\
  -H "X-API-Key: your-secret-key" | jq .

# Get 3-month forecast
curl "http://localhost:3000/api/costs/forecast?months=3&model=auto" \\
  -H "X-API-Key: your-secret-key"

# Health check (no auth required)
curl http://localhost:3000/health
# { "status": "ok", "version": "1.11.0" }`,
      },
      {
        type: "note",
        content:
          "The API server uses Express with Helmet security headers and rate limiting (100 requests/minute by default).",
      },
    ],
  },

  rbac: {
    title: "Role-Based Access Control",
    description:
      "Control which team members can access which cost data and commands.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Initialize RBAC",
      },
      {
        type: "code",
        language: "bash",
        code: "infra-cost rbac init",
      },
      {
        type: "heading",
        level: 2,
        content: "Built-in roles",
      },
      {
        type: "table",
        headers: ["Role", "Permissions"],
        rows: [
          ["admin", "Full access — all commands, all providers, all accounts"],
          ["analyst", "Read-only — cost analysis, forecasting, reporting"],
          ["developer", "Cost analysis for specific services/tags only"],
          ["viewer", "View-only — dashboard and summary reports"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Assign roles",
      },
      {
        type: "code",
        language: "bash",
        code: `# List current role assignments
infra-cost rbac list

# Assign a role to a user
infra-cost rbac assign --user alice@company.com --role analyst

# Restrict a user to specific AWS accounts
infra-cost rbac assign \\
  --user bob@company.com \\
  --role developer \\
  --accounts 123456789012,987654321098

# Revoke a role
infra-cost rbac revoke --user alice@company.com`,
      },
      {
        type: "heading",
        level: 2,
        content: "Audit logging",
      },
      {
        type: "code",
        language: "bash",
        code: `# Enable audit logging
infra-cost rbac audit --enable --output /var/log/infra-cost-audit.log

# View recent audit log
infra-cost rbac audit --tail 50`,
      },
      {
        type: "note",
        content:
          "RBAC is enforced when using the API server mode. CLI usage by individual users is governed by their local cloud credentials.",
      },
    ],
  },

  webhooks: {
    title: "Webhooks",
    description:
      "Receive real-time HTTP notifications for cost events and threshold breaches.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Register a webhook",
      },
      {
        type: "code",
        language: "bash",
        code: `# Register a webhook for all cost events
infra-cost server start --webhook https://your-server.com/cost-events

# Register via config
infra-cost config init
# Then add webhooks to ~/.infra-cost/config.json`,
      },
      {
        type: "heading",
        level: 2,
        content: "Event types",
      },
      {
        type: "table",
        headers: ["Event", "Trigger"],
        rows: [
          ["cost.threshold_exceeded", "Total cost exceeds a configured budget threshold"],
          ["cost.anomaly_detected", "Unusual cost spike detected by anomaly detection"],
          ["cost.daily_summary", "Daily cost summary (fires at midnight UTC)"],
          ["cost.forecast_updated", "Monthly forecast model refreshed"],
          ["budget.warning", "Budget utilization reaches 80%"],
          ["budget.exceeded", "Budget utilization reaches 100%"],
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "Webhook payload example",
      },
      {
        type: "code",
        language: "json",
        code: `{
  "event": "cost.threshold_exceeded",
  "timestamp": "2026-02-01T10:32:00Z",
  "provider": "aws",
  "data": {
    "current_cost": 5234.50,
    "threshold": 5000.00,
    "period": "2026-01",
    "top_services": [
      { "name": "EC2", "cost": 2847.32, "change": 0.129 },
      { "name": "RDS", "cost": 1203.45, "change": 0.014 }
    ]
  }
}`,
      },
      {
        type: "heading",
        level: 2,
        content: "Verify webhook signatures",
      },
      {
        type: "text",
        content:
          "All webhook POST requests include an `X-InfraCost-Signature` header (HMAC-SHA256). Verify it to ensure the request came from infra-cost.",
      },
      {
        type: "code",
        language: "javascript",
        code: `import crypto from "crypto";

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`,
      },
    ],
  },

  organizations: {
    title: "AWS Organizations",
    description:
      "Manage and analyze costs across multiple AWS accounts in an Organization.",
    blocks: [
      {
        type: "heading",
        level: 2,
        content: "Prerequisites",
      },
      {
        type: "list",
        items: [
          "AWS Organizations set up with Consolidated Billing enabled",
          "Credentials for the management (payer) account",
          "Cost Explorer enabled at the organization level",
        ],
      },
      {
        type: "heading",
        level: 2,
        content: "List accounts",
      },
      {
        type: "code",
        language: "bash",
        code: `infra-cost organizations list

# Output:
# Account ID      Name              Status   Monthly Cost
# 111111111111    Production        ACTIVE   $3,842.10
# 222222222222    Staging           ACTIVE     $412.50
# 333333333333    Development       ACTIVE     $295.00`,
      },
      {
        type: "heading",
        level: 2,
        content: "Organization-wide cost summary",
      },
      {
        type: "code",
        language: "bash",
        code: `# Total costs across all accounts
infra-cost organizations summary

# Filter to specific accounts
infra-cost organizations summary --accounts 111111111111,222222222222`,
      },
      {
        type: "heading",
        level: 2,
        content: "Daily costs for all accounts",
      },
      {
        type: "code",
        language: "bash",
        code: `# Daily breakdown for the last 7 days
infra-cost organizations daily --period 7d

# Export as CSV for finance reporting
infra-cost organizations daily --period 30d --output csv > org-costs.csv`,
      },
      {
        type: "heading",
        level: 2,
        content: "Account-level analysis",
      },
      {
        type: "code",
        language: "bash",
        code: `# Analyze a specific account (using cross-account role)
infra-cost cost analyze \\
  --provider aws \\
  --role-arn arn:aws:iam::111111111111:role/InfraCostReadOnly`,
      },
      {
        type: "tip",
        content:
          "Create a cross-account IAM role called `InfraCostReadOnly` in each member account so the management account can query them all from a single CLI invocation.",
      },
    ],
  },
};
