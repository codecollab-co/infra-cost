"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Copy, Check } from "lucide-react";
import { docsNavigation } from "@/lib/data";
import { docsContent, DocBlock } from "@/lib/docs-content";

function getPrevNext(currentHref: string) {
  const allItems = docsNavigation.flatMap((s) => s.items);
  const index = allItems.findIndex((item) => item.href === currentHref);
  return {
    prev: index > 0 ? allItems[index - 1] : null,
    next: index >= 0 && index < allItems.length - 1 ? allItems[index + 1] : null,
  };
}

function getSectionLabel(slug: string[]): string {
  const map: Record<string, string> = {
    commands: "Commands",
    providers: "Cloud Providers",
    integrations: "Integrations",
    advanced: "Advanced",
    installation: "Getting Started",
    "quick-start": "Getting Started",
    authentication: "Getting Started",
    configuration: "Getting Started",
  };
  return map[slug[0]] || "Documentation";
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-text-muted hover:text-neon-green transition-colors px-2 py-1 rounded hover:bg-neon-green/10"
    >
      {copied ? (
        <><Check className="w-3.5 h-3.5 text-neon-green" /> Copied</>
      ) : (
        <><Copy className="w-3.5 h-3.5" /> Copy</>
      )}
    </button>
  );
}

function CodeBlock({
  code,
  language,
  filename,
}: {
  code: string;
  language: string;
  filename?: string;
}) {
  return (
    <div className="rounded-lg border border-border-default overflow-hidden my-4" style={{ background: "#080808" }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-default bg-bg-secondary">
        <span className="text-text-muted text-xs font-mono">
          {filename ? (
            <span className="text-neon-green/70">{filename}</span>
          ) : (
            language
          )}
        </span>
        <CopyButton text={code} />
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm leading-6 whitespace-pre">
          {code.split("\n").map((line, i) => (
            <div key={i} className="flex gap-3 min-w-0 leading-6">
              {code.split("\n").length > 2 && (
                <span className="text-border-bright select-none w-6 text-right flex-shrink-0 text-xs leading-6">
                  {i + 1}
                </span>
              )}
              <span className="flex-1 min-w-0">
                {renderCodeLine(line, language)}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function renderCodeLine(line: string, lang: string) {
  if (lang === "text") {
    if (line.includes("▲")) {
      return (
        <>
          {line.split(/(▲\s*[\d.]+%)/).map((part, i) =>
            /▲/.test(part) ? (
              <span key={i} className="text-yellow-400">{part}</span>
            ) : (
              <span key={i} className="text-text-secondary">{part}</span>
            )
          )}
        </>
      );
    }
    if (line.includes("▼")) {
      return (
        <>
          {line.split(/(▼\s*[\d.]+%)/).map((part, i) =>
            /▼/.test(part) ? (
              <span key={i} className="text-neon-green">{part}</span>
            ) : (
              <span key={i} className="text-text-secondary">{part}</span>
            )
          )}
        </>
      );
    }
    if (line.startsWith("  ──") || line.startsWith("──")) {
      return <span className="text-border-bright">{line}</span>;
    }
    if (line.includes("TOTAL")) {
      return <span className="text-text-primary font-semibold">{line}</span>;
    }
    if (line.startsWith("  💡") || line.startsWith("  📈") || line.startsWith("  💰")) {
      return <span className="text-yellow-400">{line}</span>;
    }
    if (line.startsWith("  Model:") || line.startsWith("  #")) {
      return <span className="text-text-muted">{line}</span>;
    }
    return <span className="text-text-secondary">{line}</span>;
  }

  if (lang === "bash") {
    if (line.startsWith("#")) return <span className="text-text-muted">{line}</span>;
    if (line.startsWith("export ")) {
      const [key, ...rest] = line.replace("export ", "").split("=");
      return (
        <span>
          <span className="text-neon-cyan">export </span>
          <span className="text-neon-green">{key}</span>
          <span className="text-text-muted">=</span>
          <span className="text-yellow-300">{rest.join("=")}</span>
        </span>
      );
    }
    if (line.startsWith("infra-cost ") || line.startsWith("$ infra-cost")) {
      const parts = line.replace(/^\$ /, "").split(" ");
      return (
        <span>
          <span className="text-neon-green">{parts[0]}</span>
          {" "}
          {parts.slice(1).map((p, i) =>
            p.startsWith("--") ? (
              <span key={i} className="text-neon-cyan">{p} </span>
            ) : p.startsWith("#") ? (
              <span key={i} className="text-text-muted">{parts.slice(i).join(" ")}</span>
            ) : (
              <span key={i} className="text-text-primary">{p} </span>
            )
          )}
        </span>
      );
    }
    if (line.startsWith("# ")) return <span className="text-text-muted">{line}</span>;
    if (line.trim() === "" || line === "\\") return <span className="text-text-secondary">{line}</span>;
    return <span className="text-text-secondary">{line}</span>;
  }

  if (lang === "json") {
    if (line.includes(":")) {
      return (
        <>
          {line.split(/("[\w\s]+")\s*:/).map((part, i) =>
            i % 2 === 1 ? (
              <span key={i} className="text-neon-cyan">
                {part}
              </span>
            ) : /^"/.test(part.trim()) ? (
              <span key={i} className="text-yellow-300">{part}</span>
            ) : (
              <span key={i} className="text-text-secondary">{part}</span>
            )
          )}
        </>
      );
    }
  }

  // Default
  return <span className="text-text-secondary">{line || "\u00A0"}</span>;
}

function renderBlock(block: DocBlock, i: number) {
  switch (block.type) {
    case "heading":
      return block.level === 2 ? (
        <h2
          key={i}
          className="text-xl font-semibold text-text-primary mt-8 mb-3 pb-2 border-b border-border-subtle"
        >
          {block.content}
        </h2>
      ) : (
        <h3 key={i} className="text-base font-semibold text-text-primary mt-5 mb-2">
          {block.content}
        </h3>
      );

    case "text":
      return (
        <p key={i} className="text-text-secondary leading-relaxed mb-4">
          {block.content.split(/`([^`]+)`/).map((part, j) =>
            j % 2 === 1 ? (
              <code
                key={j}
                className="text-neon-green bg-neon-green/[0.08] px-1.5 py-0.5 rounded text-sm font-mono border border-neon-green/[0.15]"
              >
                {part}
              </code>
            ) : (
              part
            )
          )}
        </p>
      );

    case "code":
      return (
        <CodeBlock
          key={i}
          code={block.code}
          language={block.language}
          filename={block.filename}
        />
      );

    case "list":
      return (
        <ul key={i} className="space-y-2.5 mb-5">
          {block.items.map((item, j) => (
            <li key={j} className="relative pl-4 text-text-secondary text-sm leading-relaxed">
              <span className="absolute left-0 top-[0.4em] w-1.5 h-1.5 rounded-full bg-neon-green flex-shrink-0" />
              {item.split(/`([^`]+)`/).map((part, k) =>
                k % 2 === 1 ? (
                  <code
                    key={k}
                    className="text-neon-green bg-neon-green/[0.08] px-1 py-0.5 rounded text-xs font-mono border border-neon-green/[0.15]"
                  >
                    {part}
                  </code>
                ) : (
                  part
                )
              )}
            </li>
          ))}
        </ul>
      );

    case "table":
      return (
        <div key={i} className="overflow-x-auto mb-5 rounded-lg border border-border-default">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default bg-bg-secondary">
                {block.headers.map((h, j) => (
                  <th
                    key={j}
                    className="text-left text-text-muted font-medium px-4 py-2.5 text-xs uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, j) => (
                <tr
                  key={j}
                  className={`border-b border-border-subtle last:border-0 ${
                    j % 2 === 0 ? "bg-bg-card" : "bg-bg-secondary/30"
                  }`}
                >
                  {row.map((cell, k) => (
                    <td key={k} className="px-4 py-3 align-middle text-text-secondary leading-snug">
                      {k === 0 ? (
                        <code className="text-neon-green font-mono text-xs bg-neon-green/[0.06] px-1.5 py-0.5 rounded border border-neon-green/[0.12]">
                          {cell}
                        </code>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "note":
      return (
        <div
          key={i}
          className="flex items-start gap-3 p-4 rounded-lg border border-neon-cyan/20 bg-neon-cyan/5 mb-5"
        >
          <div className="w-5 h-5 rounded-full border border-neon-cyan/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-neon-cyan font-bold text-xs leading-none">i</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{block.content}</p>
        </div>
      );

    case "warning":
      return (
        <div
          key={i}
          className="flex items-start gap-3 p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5 mb-5"
        >
          <div className="w-5 h-5 rounded border border-yellow-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-yellow-400 font-bold text-xs leading-none">!</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{block.content}</p>
        </div>
      );

    case "tip":
      return (
        <div
          key={i}
          className="flex items-start gap-3 p-4 rounded-lg border border-neon-green/20 bg-neon-green/5 mb-5"
        >
          <div className="w-5 h-5 rounded border border-neon-green/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-neon-green font-bold text-xs leading-none">✦</span>
          </div>
          <p className="text-text-secondary text-sm leading-relaxed">{block.content}</p>
        </div>
      );

    case "divider":
      return <hr key={i} className="border-border-default my-6" />;

    default:
      return null;
  }
}

export default function DocsSlugPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const { slug } = params;
  const pageKey = slug[slug.length - 1];
  const page = docsContent[pageKey];
  const currentHref = `/docs/${slug.join("/")}`;
  const { prev, next } = getPrevNext(currentHref);
  const sectionLabel = getSectionLabel(slug);

  // No content defined yet
  if (!page) {
    return (
      <div>
        <div className="flex items-center gap-2 text-xs text-text-muted font-mono mb-6">
          <Link href="/docs" className="hover:text-neon-green transition-colors">docs</Link>
          {slug.map((segment, i) => (
            <span key={i} className="flex items-center gap-2">
              <span>/</span>
              <span className={i === slug.length - 1 ? "text-neon-green" : ""}>{segment}</span>
            </span>
          ))}
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-4 tracking-tight">
          {pageKey.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
        </h1>
        <div className="rounded-xl border border-neon-green/20 bg-neon-green/5 p-8 text-center">
          <p className="text-text-secondary mb-4">This page is coming soon.</p>
          <a
            href="https://github.com/codecollab-co/infra-cost"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex px-4 py-2 rounded-lg bg-neon-green text-black font-semibold text-sm hover:bg-neon-green-dim transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-text-muted font-mono mb-6">
        <Link href="/docs" className="hover:text-neon-green transition-colors">docs</Link>
        {slug.map((segment, i) => (
          <span key={i} className="flex items-center gap-2">
            <span>/</span>
            <span className={i === slug.length - 1 ? "text-neon-green" : "hover:text-text-secondary transition-colors"}>
              {segment}
            </span>
          </span>
        ))}
      </div>

      {/* Header */}
      <div className="mb-8 pb-6 border-b border-border-default">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium font-mono px-2.5 py-1 rounded-full border border-neon-green/20 bg-neon-green/5 text-neon-green">
            {sectionLabel}
          </span>
          {page.badge && (
            <span className="text-xs font-medium font-mono px-2.5 py-1 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan">
              {page.badge}
            </span>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3 tracking-tight">
          {page.title}
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed">{page.description}</p>
      </div>

      {/* Content */}
      <div>{page.blocks.map((block, i) => renderBlock(block, i))}</div>

      {/* Prev / Next */}
      {(prev || next) && (
        <div className="flex items-center justify-between pt-8 mt-8 border-t border-border-default">
          {prev ? (
            <Link
              href={prev.href}
              className="group flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <div className="text-left">
                <div className="text-xs text-text-muted mb-0.5">Previous</div>
                <div className="text-text-secondary group-hover:text-text-primary">{prev.label}</div>
              </div>
            </Link>
          ) : <div />}
          {next ? (
            <Link
              href={next.href}
              className="group flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
            >
              <div className="text-right">
                <div className="text-xs text-text-muted mb-0.5">Next</div>
                <div className="text-text-secondary group-hover:text-text-primary">{next.label}</div>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : <div />}
        </div>
      )}
    </div>
  );
}
