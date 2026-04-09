"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, X } from "lucide-react";
import { docsNavigation } from "@/lib/data";

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="py-6 px-4">
      {/* Back to home */}
      <Link
        href="/"
        className="flex items-center gap-2 text-text-muted hover:text-neon-green text-sm mb-6 transition-colors"
        onClick={onClose}
      >
        <span className="text-neon-green font-mono">$</span>
        <span className="font-semibold">infra-cost</span>
      </Link>

      <nav className="space-y-6">
        {docsNavigation.map((section) => (
          <div key={section.section}>
            <p className="text-text-muted text-xs font-semibold uppercase tracking-wider mb-2 px-2">
              {section.section}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-neon-green/10 text-neon-green border border-neon-green/[0.15]"
                          : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                      }`}
                    >
                      {isActive && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                      <span className={isActive ? "" : "pl-5"}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}

export function DocsSidebarMobile() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-neon-green text-black flex items-center justify-center shadow-neon-green"
      >
        <Menu className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-bg-secondary border-l border-border-default overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 border-b border-border-default">
              <span className="text-text-primary font-medium">Documentation</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

export default function DocsSidebar() {
  return (
    <aside className="hidden lg:block w-64 flex-shrink-0 border-r border-border-default bg-bg-secondary sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <SidebarContent />
    </aside>
  );
}
