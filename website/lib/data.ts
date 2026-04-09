export const features = [
  {
    id: "multi-cloud",
    icon: "Cloud",
    title: "Multi-Cloud Support",
    description:
      "Unified cost visibility across AWS, GCP, Azure, Alibaba Cloud, and Oracle Cloud from a single CLI command.",
    badge: null,
    color: "green",
  },
  {
    id: "forecasting",
    icon: "TrendingUp",
    title: "Cost Forecasting",
    description:
      "Predict spending 1–12 months ahead using linear, exponential, seasonal, or auto-selected statistical models with 80–95% confidence intervals.",
    badge: "New in v1.11",
    color: "cyan",
  },
  {
    id: "anomaly",
    icon: "Zap",
    title: "Anomaly Detection",
    description:
      "AI-powered identification of unusual cost spikes before they become budget disasters. Get alerted the moment something looks off.",
    badge: null,
    color: "green",
  },
  {
    id: "budgets",
    icon: "Bell",
    title: "Budget Monitoring",
    description:
      "Set thresholds, track against budgets in real time, and receive proactive Slack or Teams alerts when spending approaches limits.",
    badge: null,
    color: "cyan",
  },
  {
    id: "comparison",
    icon: "BarChart3",
    title: "Multi-Cloud Comparison",
    description:
      "Side-by-side cost analysis across providers at the service level. Discover where cross-cloud migration could save you money.",
    badge: "New in v1.11",
    color: "green",
  },
  {
    id: "rightsizing",
    icon: "Sliders",
    title: "Resource Rightsizing",
    description:
      "ML-powered recommendations to right-size over-provisioned EC2, RDS, and GCE instances. Stop paying for capacity you don't use.",
    badge: null,
    color: "cyan",
  },
  {
    id: "cicd",
    icon: "GitBranch",
    title: "CI/CD Integration",
    description:
      "Embed cost gates into GitHub Actions, GitLab CI, and Jenkins pipelines. Block expensive deployments before they reach production.",
    badge: null,
    color: "green",
  },
  {
    id: "dashboard",
    icon: "Monitor",
    title: "Interactive TUI Dashboard",
    description:
      "Rich terminal UI with real-time cost monitoring, keyboard navigation, and multi-cloud aggregated views — no browser required.",
    badge: null,
    color: "cyan",
  },
  {
    id: "terraform",
    icon: "FileCode",
    title: "Terraform Cost Preview",
    description:
      "Estimate infrastructure costs before `terraform apply`. Add cost annotations directly to your IaC files for team awareness.",
    badge: null,
    color: "green",
  },
];

export const providers = [
  {
    name: "Amazon Web Services",
    short: "AWS",
    status: "full",
    statusLabel: "Full Support",
    color: "#FF9900",
    services: ["EC2", "RDS", "S3", "Lambda", "CloudFront", "EKS", "Cost Explorer"],
  },
  {
    name: "Google Cloud",
    short: "GCP",
    status: "full",
    statusLabel: "Full Support",
    color: "#4285F4",
    services: ["Compute Engine", "BigQuery", "GKE", "Cloud SQL", "Cloud Storage"],
  },
  {
    name: "Microsoft Azure",
    short: "Azure",
    status: "coming",
    statusLabel: "Coming Soon",
    color: "#0078D4",
    services: ["Virtual Machines", "Azure SQL", "Blob Storage", "AKS"],
  },
  {
    name: "Alibaba Cloud",
    short: "Alibaba",
    status: "coming",
    statusLabel: "Coming Soon",
    color: "#FF6A00",
    services: ["ECS", "ApsaraDB", "OSS", "Container Service"],
  },
  {
    name: "Oracle Cloud",
    short: "Oracle",
    status: "coming",
    statusLabel: "Coming Soon",
    color: "#C74634",
    services: ["Compute", "Autonomous DB", "Object Storage", "OKE"],
  },
];

export const stats = [
  { value: "5", label: "Cloud Providers", suffix: "" },
  { value: "15", label: "Command Groups", suffix: "+" },
  { value: "380", label: "Tests Passing", suffix: "+" },
  { value: "100", label: "Open Source", suffix: "% MIT" },
];

export const useCases = [
  {
    role: "DevOps & SRE Teams",
    icon: "Server",
    description:
      "Integrate cost monitoring into your existing infrastructure workflows. Get real-time alerts and build cost gates into CI/CD pipelines.",
    commands: [
      "infra-cost cost analyze --provider aws",
      "infra-cost monitor alerts",
      "infra-cost optimize quickwins",
    ],
    color: "green",
  },
  {
    role: "FinOps Practitioners",
    icon: "DollarSign",
    description:
      "Generate executive-ready reports, forecast future spending, and identify savings opportunities across every cloud account.",
    commands: [
      "infra-cost cost forecast --months 6 --model auto",
      "infra-cost cost compare --providers aws,gcp",
      "infra-cost chargeback report --format pdf",
    ],
    color: "cyan",
  },
  {
    role: "Engineering Leaders",
    icon: "Users",
    description:
      "Track team-level cloud spend with chargeback reporting, budget tracking, and FinOps scorecards for accountability.",
    commands: [
      "infra-cost scorecard",
      "infra-cost organizations summary",
      "infra-cost export inventory --format xlsx",
    ],
    color: "green",
  },
];

export const installMethods = [
  {
    id: "npm",
    label: "npm",
    command: "npm install -g infra-cost",
    description: "Install globally via npm",
  },
  {
    id: "npx",
    label: "npx",
    command: "npx infra-cost cost analyze",
    description: "Run without installing",
  },
  {
    id: "homebrew",
    label: "Homebrew",
    command: "brew tap codecollab-co/tap && brew install infra-cost",
    description: "Install via Homebrew (macOS/Linux)",
  },
  {
    id: "docker",
    label: "Docker",
    command: "docker run --rm codecollab-co/infra-cost cost analyze",
    description: "Run in a container",
  },
];

export const quickStartSteps = [
  {
    step: "01",
    title: "Install infra-cost",
    description: "Install globally via npm, Homebrew, or run with npx — no configuration required to start.",
    code: "npm install -g infra-cost",
    language: "bash",
  },
  {
    step: "02",
    title: "Configure your cloud",
    description: "Use existing cloud credentials or initialize a new profile. Supports IAM roles, SSO, service accounts.",
    code: `# AWS (uses existing ~/.aws/credentials)
infra-cost config init --provider aws

# Or use environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret`,
    language: "bash",
  },
  {
    step: "03",
    title: "Analyze your costs",
    description: "Run your first cost analysis. Get a full breakdown by service with change indicators and optimization tips.",
    code: "infra-cost cost analyze --provider aws --period 30d",
    language: "bash",
  },
];

export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Providers", href: "#providers" },
  { label: "Quick Start", href: "#quickstart" },
  { label: "Docs", href: "/docs" },
  { label: "Changelog", href: "/changelog" },
];

export const docsNavigation = [
  {
    section: "Getting Started",
    items: [
      { label: "Introduction", href: "/docs" },
      { label: "Installation", href: "/docs/installation" },
      { label: "Quick Start", href: "/docs/quick-start" },
      { label: "Authentication", href: "/docs/authentication" },
      { label: "Configuration", href: "/docs/configuration" },
    ],
  },
  {
    section: "Commands",
    items: [
      { label: "cost analyze", href: "/docs/commands/cost-analyze" },
      { label: "cost forecast", href: "/docs/commands/cost-forecast" },
      { label: "cost compare", href: "/docs/commands/cost-compare" },
      { label: "cost trends", href: "/docs/commands/cost-trends" },
      { label: "optimize", href: "/docs/commands/optimize" },
      { label: "monitor", href: "/docs/commands/monitor" },
      { label: "export", href: "/docs/commands/export" },
      { label: "dashboard", href: "/docs/commands/dashboard" },
    ],
  },
  {
    section: "Cloud Providers",
    items: [
      { label: "AWS Setup", href: "/docs/providers/aws" },
      { label: "Google Cloud Setup", href: "/docs/providers/gcp" },
      { label: "Azure Setup", href: "/docs/providers/azure" },
    ],
  },
  {
    section: "Integrations",
    items: [
      { label: "GitHub Actions", href: "/docs/integrations/github-actions" },
      { label: "Slack", href: "/docs/integrations/slack" },
      { label: "Microsoft Teams", href: "/docs/integrations/teams" },
      { label: "Terraform", href: "/docs/integrations/terraform" },
    ],
  },
  {
    section: "Advanced",
    items: [
      { label: "API Server", href: "/docs/advanced/api-server" },
      { label: "RBAC", href: "/docs/advanced/rbac" },
      { label: "Webhooks", href: "/docs/advanced/webhooks" },
      { label: "Organizations", href: "/docs/advanced/organizations" },
    ],
  },
];

export const changelog = [
  {
    version: "1.11.0",
    date: "2026-01-31",
    tag: "Latest",
    tagColor: "green",
    highlights: [
      "Advanced cost forecasting with 4 statistical models (linear, exponential, seasonal, auto)",
      "Multi-cloud comparison — side-by-side analysis across providers",
      "Cost trends analysis with ASCII visualization and volatility detection",
      "85% performance improvement via intelligent caching",
      "Confidence intervals (80%, 90%, 95%) for all forecasts",
    ],
    changes: [
      { type: "feat", text: "Cost forecasting with 1–12 month predictions" },
      { type: "feat", text: "Multi-cloud comparison command" },
      { type: "feat", text: "Cost trends with period-over-period analysis" },
      { type: "perf", text: "85% faster queries with improved caching layer" },
      { type: "fix", text: "AWS pagination bug for large accounts fixed" },
    ],
  },
  {
    version: "1.10.0",
    date: "2026-01-15",
    tag: "Security",
    tagColor: "red",
    highlights: [
      "Critical CORS security fix — localhost-only by default",
      "API key authentication required for server mode",
      "Memory leak fixes for webhooks and cache subsystems",
      "75.8% reduction in unsafe TypeScript 'as any' assertions",
    ],
    changes: [
      { type: "security", text: "CORS restricted to localhost by default" },
      { type: "security", text: "API key auth required in server mode" },
      { type: "fix", text: "Memory leaks in webhook and cache systems" },
      { type: "improvement", text: "75.8% reduction in unsafe type assertions" },
      { type: "fix", text: "AWS pagination for accounts with many resources" },
    ],
  },
  {
    version: "1.1.0",
    date: "2025-12-20",
    tag: "Feature",
    tagColor: "cyan",
    highlights: [
      "Complete Google Cloud Platform provider implementation",
      "BigQuery billing export support",
      "Multi-project and organization aggregation for GCP",
      "65 comprehensive GCP-specific tests",
      "600+ line GCP setup guide",
    ],
    changes: [
      { type: "feat", text: "Full GCP provider with BigQuery billing support" },
      { type: "feat", text: "GCP multi-project and organization aggregation" },
      { type: "feat", text: "GKE, Cloud SQL, Cloud Storage cost analysis" },
      { type: "docs", text: "600+ line GCP setup and authentication guide" },
      { type: "test", text: "65 new tests for GCP provider coverage" },
    ],
  },
  {
    version: "1.0.0",
    date: "2025-12-01",
    tag: "Major",
    tagColor: "purple",
    highlights: [
      "Complete architecture redesign with subcommand-based CLI",
      "Provider pattern abstraction for multi-cloud extensibility",
      "Configuration management system with profiles",
      "Type-safe TypeScript codebase with comprehensive test suite",
    ],
    changes: [
      { type: "feat", text: "Subcommand-based CLI architecture" },
      { type: "feat", text: "Provider abstraction pattern" },
      { type: "feat", text: "Configuration profiles system" },
      { type: "improvement", text: "Full TypeScript rewrite with strict types" },
      { type: "feat", text: "Comprehensive test suite (300+ tests)" },
    ],
  },
];
