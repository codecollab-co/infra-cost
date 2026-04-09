import Link from "next/link";
import { Github, Twitter, Linkedin, Package, ExternalLink } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "Features", href: "/#features" },
    { label: "Providers", href: "/#providers" },
    { label: "Quick Start", href: "/#quickstart" },
    { label: "Changelog", href: "/changelog" },
    { label: "Roadmap", href: "https://github.com/codecollab-co/infra-cost/issues", external: true },
  ],
  Docs: [
    { label: "Introduction", href: "/docs" },
    { label: "Installation", href: "/docs/installation" },
    { label: "Configuration", href: "/docs/configuration" },
    { label: "Commands", href: "/docs/commands/cost-analyze" },
    { label: "Integrations", href: "/docs/integrations/github-actions" },
  ],
  Resources: [
    { label: "GitHub", href: "https://github.com/codecollab-co/infra-cost", external: true },
    { label: "npm Registry", href: "https://npmjs.com/package/infra-cost", external: true },
    { label: "Docker Hub", href: "https://hub.docker.com/r/codecollab-co/infra-cost", external: true },
    { label: "GitHub Action", href: "https://github.com/marketplace/actions/infra-cost", external: true },
    { label: "Contributing", href: "https://github.com/codecollab-co/infra-cost/blob/main/CONTRIBUTING.md", external: true },
  ],
  Company: [
    { label: "CodeCollab", href: "https://codecollab.co", external: true },
    { label: "Blog", href: "https://codecollab.co/blog", external: true },
    { label: "Enterprise", href: "mailto:enterprise@codecollab.co", external: true },
    { label: "Security", href: "mailto:security@codecollab.co", external: true },
    { label: "Support", href: "mailto:support@codecollab.co", external: true },
  ],
};

export default function Footer() {
  return (
    <footer className="border-t border-border-default bg-bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-neon-green flex items-center justify-center text-black font-bold text-sm font-mono">
                $
              </div>
              <span className="font-semibold text-text-primary tracking-tight">
                infra<span className="text-neon-green">-cost</span>
              </span>
            </Link>
            <p className="text-text-muted text-sm leading-relaxed mb-6 max-w-xs">
              Open-source multi-cloud FinOps CLI. Analyze, forecast, and optimize
              cloud costs across every major provider.
            </p>
            {/* Quick install */}
            <div className="flex items-center gap-2 bg-bg-tertiary rounded-lg px-3 py-2 border border-border-default font-mono text-sm max-w-xs">
              <span className="text-neon-green">$</span>
              <span className="text-text-secondary">npm install -g infra-cost</span>
            </div>
            {/* Social links */}
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://github.com/codecollab-co/infra-cost"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md border border-border-default flex items-center justify-center text-text-muted hover:text-neon-green hover:border-neon-green/30 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com/codecollabco"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md border border-border-default flex items-center justify-center text-text-muted hover:text-neon-green hover:border-neon-green/30 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/company/codecollab-co"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md border border-border-default flex items-center justify-center text-text-muted hover:text-neon-green hover:border-neon-green/30 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="https://npmjs.com/package/infra-cost"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-md border border-border-default flex items-center justify-center text-text-muted hover:text-neon-green hover:border-neon-green/30 transition-colors"
                aria-label="npm"
              >
                <Package className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h4 className="text-text-primary font-medium text-sm mb-4">{section}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-text-muted hover:text-text-secondary transition-colors"
                      >
                        {link.label}
                        <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-text-muted hover:text-text-secondary transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-sm">
            © 2026{" "}
            <a
              href="https://codecollab.co"
              className="hover:text-text-secondary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              CodeCollab
            </a>
            . Released under the{" "}
            <a
              href="https://github.com/codecollab-co/infra-cost/blob/main/LICENSE"
              className="hover:text-text-secondary transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              MIT License
            </a>
            .
          </p>
          <div className="flex items-center gap-4 text-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              v1.11.0 stable
            </span>
            <a
              href="https://github.com/codecollab-co/infra-cost/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text-secondary transition-colors"
            >
              Report an issue
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
