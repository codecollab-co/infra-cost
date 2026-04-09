"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { installMethods, quickStartSteps } from "@/lib/data";

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
      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-neon-green transition-colors px-2 py-1 rounded hover:bg-neon-green/10"
      aria-label="Copy code"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-neon-green" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          Copy
        </>
      )}
    </button>
  );
}

function CodeBlock({ code, language = "bash" }: { code: string; language?: string }) {
  return (
    <div className="rounded-lg border border-border-default overflow-hidden" style={{ background: "#080808" }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-default bg-bg-secondary">
        <span className="text-text-muted text-xs font-mono">{language}</span>
        <CopyButton text={code} />
      </div>
      <div className="p-4 overflow-auto">
        <pre className="font-mono text-sm leading-relaxed">
          {code.split("\n").map((line, i) => (
            <div key={i} className="flex gap-3">
              {code.split("\n").length > 1 && (
                <span className="text-text-muted select-none w-4 text-right flex-shrink-0 text-xs mt-0.5">
                  {i + 1}
                </span>
              )}
              <span>
                {line.startsWith("#") ? (
                  <span className="text-text-muted">{line}</span>
                ) : line.startsWith("$") || line.startsWith("infra-cost") || line.startsWith("export") || line.startsWith("brew") || line.startsWith("docker") || line.startsWith("npx") || line.startsWith("npm") ? (
                  <span>
                    {line.split(/(\s+--[\w-]+=?\S*|\s+--[\w-]+|\s+\w+(?=\s|$))/g).map((part, j) =>
                      part.trim().startsWith("--") ? (
                        <span key={j} className="text-neon-cyan">{part}</span>
                      ) : part.trim().startsWith("aws") || part.trim().startsWith("gcp") ? (
                        <span key={j} className="text-terminal-yellow">{part}</span>
                      ) : (
                        <span key={j} className="text-text-primary">{part}</span>
                      )
                    )}
                  </span>
                ) : line.startsWith("export") ? (
                  <span className="text-neon-green">{line}</span>
                ) : (
                  <span className="text-text-secondary">{line}</span>
                )}
              </span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

export default function QuickStart() {
  const [activeInstall, setActiveInstall] = useState(0);

  return (
    <section id="quickstart" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <div className="absolute inset-0 bg-bg-primary" />

      {/* Bottom glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at bottom, rgba(0,255,135,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-medium font-mono px-3 py-1 rounded-full border border-neon-green/20 bg-neon-green/5 text-neon-green mb-4">
            QUICK START
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Up and running in{" "}
            <span className="gradient-text">60 seconds</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            No account needed. No API keys to manage. Just install and point it at
            your existing cloud credentials.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {quickStartSteps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="flex flex-col gap-4"
            >
              {/* Step header */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-green/10 border border-neon-green/20 flex items-center justify-center">
                  <span className="text-neon-green font-mono text-xs font-bold">{step.step}</span>
                </div>
                <h3 className="font-semibold text-text-primary">{step.title}</h3>
              </div>

              {/* Description */}
              <p className="text-text-muted text-sm leading-relaxed">{step.description}</p>

              {/* Code block */}
              <CodeBlock code={step.code} language={step.language} />
            </motion.div>
          ))}
        </div>

        {/* Install methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-xl border border-border-default bg-bg-card overflow-hidden"
        >
          <div className="border-b border-border-default p-4">
            <p className="text-text-secondary text-sm text-center font-medium">
              Choose your installation method
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border-default">
            {installMethods.map((method, i) => (
              <button
                key={method.id}
                onClick={() => setActiveInstall(i)}
                className={`flex-1 py-3 text-sm font-medium transition-all ${
                  activeInstall === i
                    ? "text-neon-green border-b-2 border-neon-green -mb-px bg-neon-green/5"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-5">
            <p className="text-text-muted text-xs mb-3">
              {installMethods[activeInstall].description}
            </p>
            <div className="flex items-center gap-3 bg-bg-secondary rounded-lg px-4 py-3 border border-border-default font-mono text-sm group">
              <span className="text-neon-green">$</span>
              <span className="text-text-primary flex-1 select-all">
                {installMethods[activeInstall].command}
              </span>
              <CopyButton text={installMethods[activeInstall].command} />
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10"
        >
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm transition-colors group"
          >
            Read the full documentation
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
