"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { CheckCircle, Clock } from "lucide-react";
import { providers } from "@/lib/data";

function ProviderCard({
  provider,
  index,
}: {
  provider: (typeof providers)[0];
  index: number;
}) {
  const isFull = provider.status === "full";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative group rounded-xl border p-5 transition-all duration-300 ${
        isFull
          ? "border-border-default bg-bg-card hover:border-neon-green/25 hover:bg-bg-elevated"
          : "border-border-subtle bg-bg-secondary/50 opacity-70 hover:opacity-90"
      }`}
    >
      {isFull && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at top, rgba(0,255,135,0.03) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Provider logo placeholder + name */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Provider icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold font-mono"
            style={{
              background: `${provider.color}15`,
              border: `1px solid ${provider.color}30`,
              color: provider.color,
            }}
          >
            {provider.short.slice(0, 3)}
          </div>
          <div>
            <div className="font-semibold text-text-primary text-sm">{provider.name}</div>
            <div className="text-text-muted text-xs font-mono">{provider.short}</div>
          </div>
        </div>

        {/* Status badge */}
        <div
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            isFull
              ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
              : "bg-white/5 text-text-muted border border-border-subtle"
          }`}
        >
          {isFull ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {provider.statusLabel}
        </div>
      </div>

      {/* Services list */}
      <div className="flex flex-wrap gap-1.5">
        {provider.services.map((service) => (
          <span
            key={service}
            className="text-xs px-2 py-0.5 rounded-md bg-bg-tertiary border border-border-subtle text-text-muted"
          >
            {service}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Providers() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="providers" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 bg-bg-primary" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div ref={ref} className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-xs font-medium font-mono px-3 py-1 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan mb-4">
              MULTI-CLOUD
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              One CLI.{" "}
              <span className="gradient-text">Every cloud.</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Full support for AWS and Google Cloud today, with Azure, Alibaba Cloud, and
              Oracle Cloud actively in development. Never switch tools as your infrastructure grows.
            </p>
          </motion.div>
        </div>

        {/* Providers grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((provider, i) => (
            <ProviderCard key={provider.short} provider={provider} index={i} />
          ))}
        </div>

        {/* Unified interface callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 rounded-xl border border-neon-green/20 bg-neon-green/5 p-6 text-center"
        >
          <p className="text-text-primary font-medium mb-2">
            Unified interface — same commands, every provider
          </p>
          <div className="flex flex-wrap gap-3 justify-center font-mono text-sm">
            {["--provider aws", "--provider gcp", "--provider azure"].map((flag) => (
              <span
                key={flag}
                className="px-3 py-1 rounded-lg bg-bg-secondary border border-border-default text-text-secondary"
              >
                <span className="text-neon-green">infra-cost</span>{" "}
                <span className="text-neon-cyan">cost analyze</span>{" "}
                <span className="text-text-muted">{flag}</span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
