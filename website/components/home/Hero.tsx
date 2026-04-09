"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, Check, ArrowRight, Star, Github } from "lucide-react";

const TERMINAL_LINES = [
  { delay: 0, text: "$ infra-cost cost analyze --provider aws", type: "command" },
  { delay: 600, text: "", type: "blank" },
  { delay: 700, text: "  Authenticating with AWS...  ✓ Connected", type: "info" },
  { delay: 1100, text: "  Fetching Cost Explorer data...  ✓ Done", type: "info" },
  { delay: 1500, text: "", type: "blank" },
  { delay: 1600, text: "  AWS Cost Analysis — Last 30 Days", type: "header" },
  { delay: 1650, text: "  ─────────────────────────────────────────────", type: "divider" },
  { delay: 1700, text: "  Service              Cost         Change", type: "col-header" },
  { delay: 1750, text: "  ─────────────────────────────────────────────", type: "divider" },
  { delay: 1900, text: "  EC2                  $2,847.32    ▲ 12.9%", type: "row-warn" },
  { delay: 2100, text: "  RDS                  $1,203.45    ▲  1.4%", type: "row-ok" },
  { delay: 2300, text: "  S3                     $342.18    ▲ 14.7%", type: "row-warn" },
  { delay: 2500, text: "  Lambda                  $89.23    ▼  3.1%", type: "row-good" },
  { delay: 2700, text: "  CloudFront               $67.45    ▼  5.4%", type: "row-good" },
  { delay: 2900, text: "  ─────────────────────────────────────────────", type: "divider" },
  { delay: 3000, text: "  TOTAL                $4,549.63    ▲  9.1%", type: "total" },
  { delay: 3200, text: "", type: "blank" },
  { delay: 3300, text: "  💡 EC2 costs up 12.9% — run optimize quickwins", type: "tip" },
  { delay: 3600, text: "", type: "blank" },
];

function TerminalLine({ line }: { line: (typeof TERMINAL_LINES)[0] }) {
  const colorMap: Record<string, string> = {
    command: "text-neon-green",
    blank: "",
    info: "text-terminal-gray",
    header: "text-terminal-cyan font-semibold",
    divider: "text-terminal-gray opacity-40",
    "col-header": "text-terminal-gray",
    "row-warn": "text-terminal-white",
    "row-ok": "text-terminal-white",
    "row-good": "text-terminal-white",
    total: "text-terminal-white font-semibold",
    tip: "text-terminal-yellow",
  };

  const changeColorMap: Record<string, string> = {
    "row-warn": "text-terminal-yellow",
    "row-good": "text-neon-green",
    "row-ok": "text-terminal-white",
    total: "text-terminal-yellow",
  };

  const changeRegex = /(▲|▼)\s*[\d.]+%/;
  const hasChange = changeRegex.test(line.text);

  if (hasChange && (line.type === "row-warn" || line.type === "row-good" || line.type === "row-ok" || line.type === "total")) {
    const parts = line.text.split(/((?:▲|▼)\s*[\d.]+%)/);
    return (
      <div className={`font-mono text-xs sm:text-sm leading-6 ${colorMap[line.type] || "text-terminal-white"}`}>
        {parts.map((part, i) =>
          changeRegex.test(part) ? (
            <span key={i} className={changeColorMap[line.type]}>
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>
    );
  }

  return (
    <div className={`font-mono text-xs sm:text-sm leading-6 ${colorMap[line.type] || "text-terminal-white"}`}>
      {line.text || "\u00A0"}
    </div>
  );
}

function AnimatedTerminal() {
  const [visibleLines, setVisibleLines] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timers = TERMINAL_LINES.map((line, i) =>
      setTimeout(() => setVisibleLines(i + 1), line.delay + 400)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((v) => !v), 530);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-xl">
      {/* Glow backdrop */}
      <div className="absolute -inset-4 bg-neon-green/5 rounded-2xl blur-2xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="relative rounded-xl overflow-hidden border border-border-default shadow-2xl"
        style={{ background: "#080808" }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-default bg-bg-secondary">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-text-muted text-xs font-mono">terminal — infra-cost</span>
          </div>
        </div>

        {/* Terminal content */}
        <div className="p-4 sm:p-5 min-h-[340px]">
          {TERMINAL_LINES.slice(0, visibleLines).map((line, i) => (
            <TerminalLine key={i} line={line} />
          ))}
          {visibleLines < TERMINAL_LINES.length && (
            <div className="flex items-center gap-1">
              <span
                className="font-mono text-xs sm:text-sm text-neon-green"
                style={{ opacity: showCursor ? 1 : 0 }}
              >
                █
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function CopyCommand() {
  const [copied, setCopied] = useState(false);
  const cmd = "npm install -g infra-cost";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 bg-bg-secondary rounded-lg pl-4 pr-2 py-2.5 border border-border-default group hover:border-neon-green/30 transition-colors max-w-xs">
      <span className="text-neon-green font-mono text-sm">$</span>
      <span className="font-mono text-sm text-text-secondary flex-1 select-all">{cmd}</span>
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-md hover:bg-neon-green/10 transition-colors text-text-muted hover:text-neon-green"
        aria-label="Copy command"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-neon-green" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

// Floating particles
function Particles() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 10 + 8,
    delay: Math.random() * 5,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-neon-green"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: 0.15,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.05, 0.3, 0.05],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 grid-bg opacity-100" />
      <div className="absolute inset-0 bg-hero-gradient" />
      <Particles />

      {/* Radial gradient orb */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,255,135,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            {/* Badge */}
            <motion.div variants={itemVariants}>
              <a
                href="https://github.com/codecollab-co/infra-cost/releases/tag/v1.11.0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neon-green/30 bg-neon-green/5 hover:bg-neon-green/10 transition-colors group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                <span className="text-neon-green text-xs font-medium font-mono">
                  v1.11.0 — Advanced Cost Analysis
                </span>
                <ArrowRight className="w-3 h-3 text-neon-green group-hover:translate-x-0.5 transition-transform" />
              </a>
            </motion.div>

            {/* Headline */}
            <motion.div variants={itemVariants}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                Take Control of{" "}
                <span className="gradient-text">Your Cloud Costs</span>
              </h1>
            </motion.div>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-text-secondary text-lg leading-relaxed max-w-lg"
            >
              Open-source multi-cloud FinOps CLI. Analyze, forecast, and optimize
              spending across AWS, GCP, Azure and more — from a single terminal command.
            </motion.p>

            {/* Install command */}
            <motion.div variants={itemVariants} className="flex flex-col gap-2">
              <CopyCommand />
              <p className="text-text-muted text-xs pl-1">
                Also available via{" "}
                <span className="text-text-secondary">npx</span>,{" "}
                <span className="text-text-secondary">Homebrew</span>, or{" "}
                <span className="text-text-secondary">Docker</span>
              </p>
            </motion.div>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
              <Link
                href="/docs"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neon-green text-black font-semibold text-sm hover:bg-neon-green-dim transition-colors shadow-neon-green-sm hover:shadow-neon-green"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://github.com/codecollab-co/infra-cost"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border-default text-text-secondary hover:text-text-primary hover:border-border-bright bg-bg-secondary/50 transition-colors text-sm font-medium"
              >
                <Github className="w-4 h-4" />
                View on GitHub
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Star className="w-3 h-3 text-neon-green" />
                </span>
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div variants={itemVariants} className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                MIT Licensed
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                5 Cloud Providers
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                380+ Tests
              </div>
            </motion.div>
          </motion.div>

          {/* Right — terminal */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className="flex justify-center lg:justify-end"
          >
            <AnimatedTerminal />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-text-muted text-xs">scroll to explore</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-gradient-to-b from-neon-green/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}
