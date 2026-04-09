"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { stats } from "@/lib/data";

function AnimatedNumber({ target, suffix }: { target: string; suffix: string }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const numericTarget = parseInt(target);

  useEffect(() => {
    if (!isInView) return;
    const duration = 1200;
    const steps = 40;
    const increment = numericTarget / steps;
    let current = 0;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), numericTarget);
      setDisplay(current.toString());
      if (step >= steps) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [isInView, numericTarget]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

export default function Stats() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  return (
    <section className="relative py-16 border-y border-border-default overflow-hidden">
      <div className="absolute inset-0 bg-bg-secondary" />

      {/* Scan line animation */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(transparent 0%, rgba(0,255,135,0.02) 50%, transparent 100%)",
          backgroundSize: "100% 4px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          ref={containerRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl font-bold font-mono gradient-text mb-1">
                <AnimatedNumber target={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-text-muted text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
