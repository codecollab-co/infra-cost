import Link from "next/link";
import { ArrowRight, Terminal, Cloud, GitBranch, Zap, BookOpen, Package } from "lucide-react";

const quickLinks = [
  {
    icon: Terminal,
    title: "Installation",
    description: "Get infra-cost installed in under a minute via npm, Homebrew, or Docker.",
    href: "/docs/installation",
    color: "green",
  },
  {
    icon: Cloud,
    title: "AWS Setup",
    description: "Configure authentication and start analyzing your AWS costs.",
    href: "/docs/providers/aws",
    color: "cyan",
  },
  {
    icon: Cloud,
    title: "GCP Setup",
    description: "Set up BigQuery billing export and analyze Google Cloud costs.",
    href: "/docs/providers/gcp",
    color: "green",
  },
  {
    icon: Zap,
    title: "cost analyze",
    description: "Break down cloud costs by service, region, and resource.",
    href: "/docs/commands/cost-analyze",
    color: "cyan",
  },
  {
    icon: GitBranch,
    title: "GitHub Actions",
    description: "Add cost visibility to your CI/CD pipeline automatically.",
    href: "/docs/integrations/github-actions",
    color: "green",
  },
  {
    icon: BookOpen,
    title: "Forecasting",
    description: "Predict future cloud spend with statistical forecasting models.",
    href: "/docs/commands/cost-forecast",
    color: "cyan",
  },
];

const commandGroups = [
  {
    group: "Cost Analysis",
    commands: [
      { cmd: "cost analyze", desc: "Analyze costs by service and period", href: "/docs/commands/cost-analyze" },
      { cmd: "cost forecast", desc: "Predict future spend", href: "/docs/commands/cost-forecast" },
      { cmd: "cost compare", desc: "Compare costs across providers", href: "/docs/commands/cost-compare" },
      { cmd: "cost trends", desc: "Historical trend analysis", href: "/docs/commands/cost-trends" },
    ],
  },
  {
    group: "Optimization",
    commands: [
      { cmd: "optimize recommendations", desc: "AI-powered cost recommendations", href: "/docs/commands/optimize" },
      { cmd: "optimize quickwins", desc: "Immediate savings opportunities", href: "/docs/commands/optimize" },
      { cmd: "optimize rightsizing", desc: "Right-size over-provisioned resources", href: "/docs/commands/optimize" },
    ],
  },
  {
    group: "Monitoring",
    commands: [
      { cmd: "monitor alerts", desc: "Check and configure cost alerts", href: "/docs/commands/monitor" },
      { cmd: "monitor budgets", desc: "Track against budget thresholds", href: "/docs/commands/monitor" },
      { cmd: "monitor watch", desc: "Real-time cost monitoring", href: "/docs/commands/monitor" },
    ],
  },
  {
    group: "Export & Reports",
    commands: [
      { cmd: "export inventory", desc: "Export full resource inventory", href: "/docs/commands/export" },
      { cmd: "chargeback report", desc: "Generate chargeback reports", href: "/docs/commands/export" },
      { cmd: "dashboard interactive", desc: "Launch TUI dashboard", href: "/docs/commands/dashboard" },
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="prose-dark">
      {/* Header */}
      <div className="mb-10 pb-8 border-b border-border-default">
        <div className="flex items-center gap-2 text-xs text-text-muted font-mono mb-4">
          <span>docs</span>
          <span>/</span>
          <span className="text-neon-green">introduction</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4 tracking-tight">
          infra-cost Documentation
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed">
          infra-cost is an open-source multi-cloud FinOps CLI tool for comprehensive
          cost analysis, forecasting, and optimization across AWS, GCP, Azure, and more.
        </p>

        {/* Quick install */}
        <div className="mt-6 flex items-center gap-3 bg-bg-secondary rounded-lg px-4 py-3 border border-border-default font-mono text-sm max-w-sm">
          <span className="text-neon-green">$</span>
          <span className="text-text-secondary">npm install -g infra-cost</span>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Link
            href="/docs/installation"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neon-green text-black font-semibold text-sm hover:bg-neon-green-dim transition-colors shadow-neon-green-sm"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="https://github.com/codecollab-co/infra-cost"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border-default text-text-secondary text-sm hover:text-text-primary hover:border-border-bright transition-colors"
          >
            <Package className="w-4 h-4" />
            GitHub
          </a>
        </div>
      </div>

      {/* Quick links */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-5">Quick Start</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            const isGreen = link.color === "green";
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-lg border border-border-default bg-bg-card p-4 hover:border-neon-green/20 hover:bg-bg-elevated transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: isGreen ? "rgba(0,255,135,0.08)" : "rgba(0,212,255,0.08)",
                      border: isGreen ? "1px solid rgba(0,255,135,0.15)" : "1px solid rgba(0,212,255,0.15)",
                    }}
                  >
                    <Icon
                      className="w-3.5 h-3.5"
                      style={{ color: isGreen ? "#00ff87" : "#00d4ff" }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 font-medium text-text-primary text-sm mb-1">
                      {link.title}
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="text-text-muted text-xs leading-relaxed">{link.description}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Command reference */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-5">Command Reference</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {commandGroups.map((group) => (
            <div key={group.group} className="rounded-lg border border-border-default bg-bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border-default bg-bg-secondary">
                <span className="text-text-secondary font-medium text-sm">{group.group}</span>
              </div>
              <div className="p-3 space-y-1">
                {group.commands.map((cmd) => (
                  <Link
                    key={cmd.cmd}
                    href={cmd.href}
                    className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-bg-elevated group transition-colors"
                  >
                    <div>
                      <span className="font-mono text-xs text-neon-green">{cmd.cmd}</span>
                      <div className="text-text-muted text-xs mt-0.5">{cmd.desc}</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What's new */}
      <div className="rounded-xl border border-neon-green/20 bg-neon-green/5 p-5">
        <div className="flex items-start gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-neon-green mt-2 flex-shrink-0 animate-pulse" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-text-primary font-semibold text-sm">New in v1.11.0</span>
              <Link
                href="/changelog"
                className="text-xs text-neon-green hover:underline"
              >
                See changelog →
              </Link>
            </div>
            <ul className="space-y-1 text-sm text-text-secondary">
              <li>• Cost forecasting with 4 statistical models (linear, exponential, seasonal, auto)</li>
              <li>• Multi-cloud comparison — side-by-side analysis across providers</li>
              <li>• Cost trends analysis with ASCII visualization</li>
              <li>• 85% performance improvement with improved caching</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
