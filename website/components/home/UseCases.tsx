"use client";

import { motion } from "framer-motion";
import { Server, DollarSign, Users } from "lucide-react";
import { useCases } from "@/lib/data";

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Server,
  DollarSign,
  Users,
};

export default function UseCases() {
  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-bg-primary" />

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
            USE CASES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Built for every team that{" "}
            <span className="gradient-text">cares about costs</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Whether you&apos;re a DevOps engineer, FinOps practitioner, or engineering leader —
            infra-cost gives your team the visibility it needs.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {useCases.map((useCase, i) => {
            const Icon = iconMap[useCase.icon];
            const isGreen = useCase.color === "green";

            return (
              <motion.div
                key={useCase.role}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative rounded-xl border border-border-default bg-bg-card p-6 hover:border-neon-green/20 transition-all duration-300"
              >
                {/* Hover gradient */}
                <div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: isGreen
                      ? "radial-gradient(ellipse at top left, rgba(0,255,135,0.04) 0%, transparent 70%)"
                      : "radial-gradient(ellipse at top left, rgba(0,212,255,0.04) 0%, transparent 70%)",
                  }}
                />

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-5"
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
                      className="w-5 h-5"
                      style={{ color: isGreen ? "#00ff87" : "#00d4ff" }}
                    />
                  )}
                </div>

                <h3 className="font-semibold text-text-primary text-lg mb-3">
                  {useCase.role}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed mb-5">
                  {useCase.description}
                </p>

                {/* Example commands */}
                <div className="space-y-2">
                  <p className="text-text-muted text-xs font-medium uppercase tracking-wider mb-2">
                    Common commands
                  </p>
                  {useCase.commands.map((cmd) => (
                    <div
                      key={cmd}
                      className="flex items-center gap-2 bg-bg-secondary rounded-md px-3 py-2 border border-border-subtle"
                    >
                      <span className="text-neon-green font-mono text-xs flex-shrink-0">$</span>
                      <span className="font-mono text-xs text-text-secondary truncate">{cmd}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom testimonial/callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 rounded-xl border border-border-default bg-bg-card p-8 text-center relative overflow-hidden"
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(0,255,135,0.04) 0%, transparent 70%)",
            }}
          />
          <div className="relative">
            <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-4">
              &ldquo;infra-cost helped us cut our AWS bill by 23% in the first month.
              The rightsizing recommendations alone saved us thousands.&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full bg-neon-green/10 border border-neon-green/20 flex items-center justify-center text-xs text-neon-green font-mono font-bold">
                SL
              </div>
              <div className="text-left">
                <div className="text-text-primary text-sm font-medium">Sarah L.</div>
                <div className="text-text-muted text-xs">Senior DevOps Engineer</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
