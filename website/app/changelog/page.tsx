import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { changelog } from "@/lib/data";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Release history and version notes for infra-cost.",
};

const changeTypeStyles: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  feat: {
    label: "feat",
    bg: "rgba(0,255,135,0.08)",
    text: "#00ff87",
    border: "rgba(0,255,135,0.2)",
  },
  fix: {
    label: "fix",
    bg: "rgba(255,107,107,0.08)",
    text: "#ff6b6b",
    border: "rgba(255,107,107,0.2)",
  },
  security: {
    label: "security",
    bg: "rgba(255,107,107,0.12)",
    text: "#ff6b6b",
    border: "rgba(255,107,107,0.25)",
  },
  perf: {
    label: "perf",
    bg: "rgba(0,212,255,0.08)",
    text: "#00d4ff",
    border: "rgba(0,212,255,0.2)",
  },
  improvement: {
    label: "improvement",
    bg: "rgba(0,212,255,0.08)",
    text: "#00d4ff",
    border: "rgba(0,212,255,0.2)",
  },
  docs: {
    label: "docs",
    bg: "rgba(160,160,160,0.08)",
    text: "#a0a0a0",
    border: "rgba(160,160,160,0.15)",
  },
  test: {
    label: "test",
    bg: "rgba(160,160,160,0.08)",
    text: "#a0a0a0",
    border: "rgba(160,160,160,0.15)",
  },
};

const tagStyles: Record<string, { bg: string; text: string; border: string }> = {
  green: {
    bg: "rgba(0,255,135,0.1)",
    text: "#00ff87",
    border: "rgba(0,255,135,0.25)",
  },
  red: {
    bg: "rgba(255,107,107,0.1)",
    text: "#ff6b6b",
    border: "rgba(255,107,107,0.25)",
  },
  cyan: {
    bg: "rgba(0,212,255,0.1)",
    text: "#00d4ff",
    border: "rgba(0,212,255,0.25)",
  },
  purple: {
    bg: "rgba(167,139,250,0.1)",
    text: "#a78bfa",
    border: "rgba(167,139,250,0.25)",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main className="pt-24 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-2 text-xs text-text-muted font-mono mb-4">
              <Link href="/" className="hover:text-neon-green transition-colors">
                home
              </Link>
              <span>/</span>
              <span className="text-neon-green">changelog</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4 tracking-tight">
              Changelog
            </h1>
            <p className="text-text-secondary text-lg">
              All notable changes to infra-cost are documented here. Follows{" "}
              <a
                href="https://keepachangelog.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neon-green hover:underline"
              >
                Keep a Changelog
              </a>{" "}
              format.
            </p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border-default" />

            <div className="space-y-12">
              {changelog.map((release, index) => {
                const tag = tagStyles[release.tagColor] || tagStyles.green;
                return (
                  <div key={release.version} className="relative pl-12">
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-2 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        index === 0
                          ? "border-neon-green bg-neon-green/20"
                          : "border-border-bright bg-bg-card"
                      }`}
                      style={{
                        transform: "translateX(-50%)",
                        left: "16px",
                      }}
                    >
                      {index === 0 && (
                        <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                      )}
                    </div>

                    {/* Release card */}
                    <div className="rounded-xl border border-border-default bg-bg-card overflow-hidden hover:border-border-bright transition-colors">
                      {/* Card header */}
                      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-border-default bg-bg-secondary">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-text-primary text-lg">
                            v{release.version}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              background: tag.bg,
                              color: tag.text,
                              border: `1px solid ${tag.border}`,
                            }}
                          >
                            {release.tag}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 ml-auto">
                          <span className="text-text-muted text-sm">
                            {formatDate(release.date)}
                          </span>
                          <a
                            href={`https://github.com/codecollab-co/infra-cost/releases/tag/v${release.version}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-text-muted hover:text-neon-green transition-colors"
                          >
                            GitHub
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="p-5">
                        {/* Highlights */}
                        <div className="mb-5">
                          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">
                            Highlights
                          </p>
                          <ul className="space-y-1.5">
                            {release.highlights.map((h, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-sm text-text-secondary"
                              >
                                <span className="text-neon-green mt-1 flex-shrink-0">•</span>
                                {h}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Changes */}
                        <div>
                          <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-3">
                            All Changes
                          </p>
                          <div className="space-y-1.5">
                            {release.changes.map((change, i) => {
                              const style =
                                changeTypeStyles[change.type] || changeTypeStyles.feat;
                              return (
                                <div
                                  key={i}
                                  className="flex items-start gap-2.5 text-sm"
                                >
                                  <span
                                    className="text-xs px-1.5 py-0.5 rounded font-mono font-medium flex-shrink-0 mt-0.5"
                                    style={{
                                      background: style.bg,
                                      color: style.text,
                                      border: `1px solid ${style.border}`,
                                    }}
                                  >
                                    {style.label}
                                  </span>
                                  <span className="text-text-secondary">{change.text}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* See full history */}
              <div className="relative pl-12">
                <div
                  className="absolute left-2 top-1 w-5 h-5 rounded-full border border-border-default bg-bg-card flex items-center justify-center"
                  style={{ transform: "translateX(-50%)", left: "16px" }}
                >
                  <span className="text-text-muted text-xs">•</span>
                </div>
                <div className="py-4">
                  <a
                    href="https://github.com/codecollab-co/infra-cost/blob/main/CHANGELOG.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-text-muted hover:text-neon-green transition-colors text-sm"
                  >
                    View full changelog on GitHub
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
