"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Star, ExternalLink } from "lucide-react";
import { navLinks } from "@/lib/data";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-bg-primary/90 backdrop-blur-xl border-b border-border-default"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-md bg-neon-green flex items-center justify-center text-black font-bold text-sm font-mono group-hover:shadow-neon-green-sm transition-shadow duration-300">
                $
              </div>
              <span className="font-semibold text-text-primary tracking-tight">
                infra<span className="text-neon-green">-cost</span>
              </span>
              <span className="hidden sm:inline-block text-xs font-mono px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20">
                v1.11
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors duration-200 rounded-md hover:bg-white/5"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right side */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href="https://github.com/codecollab-co/infra-cost"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5 rounded-md border border-border-default hover:border-border-bright bg-bg-secondary/50 hover:bg-bg-secondary"
              >
                <Star className="w-3.5 h-3.5 text-neon-green" />
                <span>Star on GitHub</span>
              </a>
              <Link
                href="/docs"
                className="text-sm px-4 py-1.5 rounded-md bg-neon-green text-black font-semibold hover:bg-neon-green-dim transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-bg-primary/95 backdrop-blur-xl"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative z-10 flex flex-col gap-2 pt-20 px-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-lg text-text-secondary hover:text-text-primary border-b border-border-subtle transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-3 pt-4">
                <a
                  href="https://github.com/codecollab-co/infra-cost"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border-default text-text-secondary"
                >
                  <Star className="w-4 h-4 text-neon-green" />
                  Star on GitHub
                  <ExternalLink className="w-3 h-3" />
                </a>
                <Link
                  href="/docs"
                  onClick={() => setMobileOpen(false)}
                  className="py-2.5 rounded-lg bg-neon-green text-black font-semibold text-center"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
