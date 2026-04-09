"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, ChevronRight } from "lucide-react";

type LineType =
  | "command"
  | "blank"
  | "info"
  | "header"
  | "divider"
  | "col-header"
  | "row"
  | "row-warn"
  | "row-good"
  | "row-ok"
  | "total"
  | "tip"
  | "forecast-header"
  | "forecast-row"
  | "compare-header"
  | "compare-row";

interface TermLine {
  text: string;
  type: LineType;
  delay: number;
}

const demos: { id: string; label: string; description: string; lines: TermLine[] }[] = [
  {
    id: "analyze",
    label: "cost analyze",
    description: "Break down cloud costs by service with change tracking",
    lines: [
      { delay: 0, text: "$ infra-cost cost analyze --provider aws --period 30d", type: "command" },
      { delay: 500, text: "", type: "blank" },
      { delay: 600, text: "  ✓ Connected to AWS (us-east-1)", type: "info" },
      { delay: 900, text: "  ✓ Fetched 30-day cost data", type: "info" },
      { delay: 1200, text: "", type: "blank" },
      { delay: 1300, text: "  AWS Cost Analysis — Last 30 Days", type: "header" },
      { delay: 1350, text: "  ──────────────────────────────────────────────────", type: "divider" },
      { delay: 1400, text: "  Service              Cost         Change    Trend", type: "col-header" },
      { delay: 1450, text: "  ──────────────────────────────────────────────────", type: "divider" },
      { delay: 1700, text: "  EC2                  $2,847.32    ▲ 12.9%  ↑ rising", type: "row-warn" },
      { delay: 1900, text: "  RDS                  $1,203.45    ▲  1.4%  → stable", type: "row-ok" },
      { delay: 2100, text: "  S3                     $342.18    ▲ 14.7%  ↑ rising", type: "row-warn" },
      { delay: 2300, text: "  Lambda                  $89.23    ▼  3.1%  ↓ falling", type: "row-good" },
      { delay: 2500, text: "  CloudFront               $67.45    ▼  5.4%  ↓ falling", type: "row-good" },
      { delay: 2700, text: "  ──────────────────────────────────────────────────", type: "divider" },
      { delay: 2800, text: "  TOTAL                $4,549.63    ▲  9.1%", type: "total" },
      { delay: 3000, text: "", type: "blank" },
      { delay: 3100, text: "  💡 Run: infra-cost optimize quickwins", type: "tip" },
    ],
  },
  {
    id: "forecast",
    label: "cost forecast",
    description: "Predict future cloud spend with statistical models",
    lines: [
      { delay: 0, text: "$ infra-cost cost forecast --provider aws --months 3 --model auto", type: "command" },
      { delay: 500, text: "", type: "blank" },
      { delay: 600, text: "  ✓ Selected model: seasonal (best fit, R²=0.94)", type: "info" },
      { delay: 1000, text: "  ✓ Analyzing 12 months of historical data", type: "info" },
      { delay: 1300, text: "", type: "blank" },
      { delay: 1400, text: "  AWS Cost Forecast — Next 3 Months  [95% CI]", type: "forecast-header" },
      { delay: 1450, text: "  ──────────────────────────────────────────────────", type: "divider" },
      { delay: 1500, text: "  Month         Predicted      Low          High", type: "col-header" },
      { delay: 1550, text: "  ──────────────────────────────────────────────────", type: "divider" },
      { delay: 1800, text: "  Feb 2026      $4,823.40    $4,512.30   $5,134.50", type: "forecast-row" },
      { delay: 2000, text: "  Mar 2026      $5,104.80    $4,732.10   $5,477.50", type: "forecast-row" },
      { delay: 2200, text: "  Apr 2026      $5,312.20    $4,891.40   $5,732.90", type: "forecast-row" },
      { delay: 2400, text: "  ──────────────────────────────────────────────────", type: "divider" },
      { delay: 2500, text: "  Q1 Total      $15,240.40   ▲ 16.8% vs current", type: "total" },
      { delay: 2700, text: "", type: "blank" },
      { delay: 2800, text: "  📈 Trend: accelerating growth — budget review advised", type: "tip" },
    ],
  },
  {
    id: "compare",
    label: "cost compare",
    description: "Side-by-side analysis across cloud providers",
    lines: [
      { delay: 0, text: "$ infra-cost cost compare --providers aws,gcp --period 30d", type: "command" },
      { delay: 500, text: "", type: "blank" },
      { delay: 600, text: "  ✓ Fetching AWS costs...", type: "info" },
      { delay: 800, text: "  ✓ Fetching GCP costs...", type: "info" },
      { delay: 1100, text: "", type: "blank" },
      { delay: 1200, text: "  Multi-Cloud Cost Comparison — Last 30 Days", type: "compare-header" },
      { delay: 1250, text: "  ──────────────────────────────────────────────────", type: "divider" },
      { delay: 1300, text: "  Service              AWS            GCP         Diff", type: "col-header" },
      { delay: 1350, text: "  ──────────────────────────────────────────────────", type: "divider" },
      { delay: 1600, text: "  Compute           $2,847.32      $1,923.45   -$923.87", type: "compare-row" },
      { delay: 1800, text: "  Database          $1,203.45      $1,445.20   +$241.75", type: "compare-row" },
      { delay: 2000, text: "  Storage             $342.18        $198.32   -$143.86", type: "compare-row" },
      { delay: 2200, text: "  Functions            $89.23         $45.12    -$44.11", type: "compare-row" },
      { delay: 2400, text: "  ──────────────────────────────────────────────────", type: "divider" },
      { delay: 2500, text: "  TOTAL             $4,549.63      $3,612.09   -$937.54", type: "total" },
      { delay: 2700, text: "", type: "blank" },
      { delay: 2800, text: "  💰 GCP 20.6% cheaper for compute workloads", type: "tip" },
    ],
  },
];

function renderLine(line: TermLine, index: number) {
  const baseClass = "font-mono text-xs sm:text-sm leading-[1.7] whitespace-pre";

  const colorMap: Record<LineType, string> = {
    command: `${baseClass} text-neon-green font-medium`,
    blank: `${baseClass}`,
    info: `${baseClass} text-terminal-gray`,
    header: `${baseClass} text-neon-cyan font-semibold`,
    "forecast-header": `${baseClass} text-neon-cyan font-semibold`,
    "compare-header": `${baseClass} text-neon-cyan font-semibold`,
    divider: `${baseClass} text-[#333]`,
    "col-header": `${baseClass} text-[#555]`,
    "row-warn": `${baseClass} text-text-primary`,
    "row-good": `${baseClass} text-text-primary`,
    "row-ok": `${baseClass} text-text-primary`,
    "forecast-row": `${baseClass} text-text-primary`,
    "compare-row": `${baseClass} text-text-primary`,
    row: `${baseClass} text-text-primary`,
    total: `${baseClass} text-text-primary font-semibold`,
    tip: `${baseClass} text-terminal-yellow`,
  };

  // Colorize specific parts of certain lines
  const colorize = (text: string, type: LineType): React.ReactNode => {
    if (type === "row-warn") {
      return text.split(/(▲\s*[\d.]+%)/).map((part, i) =>
        /▲/.test(part) ? (
          <span key={i} className="text-terminal-yellow">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    }
    if (type === "row-good") {
      return text.split(/(▼\s*[\d.]+%)/).map((part, i) =>
        /▼/.test(part) ? (
          <span key={i} className="text-neon-green">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    }
    if (type === "total") {
      return text.split(/(▲\s*[\d.]+%|▼\s*[\d.]+%)/).map((part, i) =>
        /▲/.test(part) ? (
          <span key={i} className="text-terminal-yellow">{part}</span>
        ) : /▼/.test(part) ? (
          <span key={i} className="text-neon-green">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    }
    if (type === "compare-row") {
      return text.split(/(-\$[\d,]+\.\d+|\+\$[\d,]+\.\d+)/).map((part, i) =>
        part.startsWith("-$") ? (
          <span key={i} className="text-neon-green">{part}</span>
        ) : part.startsWith("+$") ? (
          <span key={i} className="text-terminal-yellow">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      );
    }
    return text;
  };

  return (
    <div key={index} className={colorMap[line.type]}>
      {line.text ? colorize(line.text, line.type) : "\u00A0"}
    </div>
  );
}

export default function TerminalDemo() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [visibleLines, setVisibleLines] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCursor, setShowCursor] = useState(true);

  const currentDemo = demos[activeDemo];
  const allLinesShown = visibleLines >= currentDemo.lines.length;

  const startAnimation = useCallback(() => {
    setVisibleLines(0);
    setIsPlaying(true);
    const timers = currentDemo.lines.map((line, i) =>
      setTimeout(() => {
        setVisibleLines(i + 1);
        if (i === currentDemo.lines.length - 1) setIsPlaying(false);
      }, line.delay + 300)
    );
    return () => timers.forEach(clearTimeout);
  }, [currentDemo]);

  useEffect(() => {
    const cleanup = startAnimation();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDemo]);

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((v) => !v), 500);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (i: number) => {
    setActiveDemo(i);
  };

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-bg-secondary" />

      {/* Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(0,212,255,0.05) 0%, transparent 70%)",
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
          className="text-center mb-12"
        >
          <span className="inline-block text-xs font-medium font-mono px-3 py-1 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan mb-4">
            LIVE DEMO
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            See it in <span className="gradient-text">action</span>
          </h2>
          <p className="text-text-secondary max-w-xl mx-auto">
            Real CLI output. Real analysis. No configuration needed to get started.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          {/* Demo tabs */}
          <div className="flex gap-1 mb-4 p-1 rounded-lg bg-bg-tertiary border border-border-default">
            {demos.map((demo, i) => (
              <button
                key={demo.id}
                onClick={() => handleTabChange(i)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  activeDemo === i
                    ? "bg-bg-elevated text-text-primary border border-border-default shadow-sm"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <span className="font-mono text-neon-green/60">$</span>
                {demo.label}
              </button>
            ))}
          </div>

          {/* Description */}
          <AnimatePresence mode="wait">
            <motion.p
              key={activeDemo}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="text-text-muted text-sm mb-3 flex items-center gap-1.5"
            >
              <ChevronRight className="w-3 h-3 text-neon-green" />
              {currentDemo.description}
            </motion.p>
          </AnimatePresence>

          {/* Terminal window */}
          <div
            className="rounded-xl overflow-hidden border border-border-default shadow-2xl"
            style={{ background: "#060606" }}
          >
            {/* Window chrome */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-default bg-bg-secondary">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="text-text-muted text-xs font-mono">
                bash — 80×24
              </span>
              <button
                onClick={() => {
                  const cleanup = startAnimation();
                  return cleanup;
                }}
                className="flex items-center gap-1 text-xs text-text-muted hover:text-neon-green transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                replay
              </button>
            </div>

            {/* Terminal content */}
            <div className="p-5 min-h-[320px] overflow-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDemo}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentDemo.lines.slice(0, visibleLines).map((line, i) =>
                    renderLine(line, i)
                  )}
                  {!allLinesShown && (
                    <span
                      className="font-mono text-sm text-neon-green"
                      style={{ opacity: showCursor ? 1 : 0 }}
                    >
                      █
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Try it yourself */}
          <div className="mt-4 text-center">
            <p className="text-text-muted text-sm">
              Try it yourself →{" "}
              <code className="text-neon-green font-mono text-xs bg-neon-green/5 px-2 py-0.5 rounded border border-neon-green/[0.15]">
                npx infra-cost cost analyze
              </code>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
