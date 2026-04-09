"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Cloud,
  TrendingUp,
  Zap,
  Bell,
  BarChart3,
  Sliders,
  GitBranch,
  Monitor,
  FileCode,
} from "lucide-react";
import { features } from "@/lib/data";

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Cloud,
  TrendingUp,
  Zap,
  Bell,
  BarChart3,
  Sliders,
  GitBranch,
  Monitor,
  FileCode,
};

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof features)[0];
  index: number;
}) {
  const Icon = iconMap[feature.icon];
  const isGreen = feature.color === "green";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-xl border border-border-default bg-bg-card p-5 hover:border-neon-green/20 hover:bg-bg-elevated transition-all duration-300 cursor-default"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: isGreen
            ? "radial-gradient(ellipse at top left, rgba(0,255,135,0.04) 0%, transparent 70%)"
            : "radial-gradient(ellipse at top left, rgba(0,212,255,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{
            background: isGreen
              ? "rgba(0,255,135,0.08)"
              : "rgba(0,212,255,0.08)",
            border: isGreen
              ? "1px solid rgba(0,255,135,0.15)"
              : "1px solid rgba(0,212,255,0.15)",
          }}
        >
          {Icon && (
            <Icon
              className="w-4.5 h-4.5"
              style={{ color: isGreen ? "#00ff87" : "#00d4ff", width: 18, height: 18 }}
            />
          )}
        </div>
        {feature.badge && (
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              background: isGreen ? "rgba(0,255,135,0.1)" : "rgba(0,212,255,0.1)",
              color: isGreen ? "#00ff87" : "#00d4ff",
              border: isGreen ? "1px solid rgba(0,255,135,0.2)" : "1px solid rgba(0,212,255,0.2)",
            }}
          >
            {feature.badge}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-text-primary text-sm mb-2 leading-snug">
        {feature.title}
      </h3>
      <p className="text-text-muted text-sm leading-relaxed">{feature.description}</p>
    </motion.div>
  );
}

export default function Features() {
  const headingRef = useRef(null);
  const isInView = useInView(headingRef, { once: true, margin: "-100px" });

  return (
    <section id="features" className="relative py-24 lg:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-bg-secondary" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div ref={headingRef} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-xs font-medium font-mono px-3 py-1 rounded-full border border-neon-green/20 bg-neon-green/5 text-neon-green mb-4">
              CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              Everything you need for{" "}
              <span className="gradient-text">cloud cost mastery</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              From real-time monitoring to AI-powered forecasting — infra-cost gives
              your team complete visibility and control over every dollar spent in the cloud.
            </p>
          </motion.div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <FeatureCard key={feature.id} feature={feature} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-text-muted text-sm">
            And much more — organizations support, RBAC, SSO, plugins, API server, webhooks...{" "}
            <a
              href="/docs"
              className="text-neon-green hover:underline"
            >
              View full docs →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
