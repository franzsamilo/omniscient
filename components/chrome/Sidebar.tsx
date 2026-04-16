"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils/cn";

const COLLAPSED_W = 72;
const EXPANDED_W = 240;

export function Sidebar() {
  const pathname = usePathname();
  // Default expanded so route labels are visible — easier for new users.
  // Collapse button still works for users who want more horizontal space.
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.aside
      animate={{ width: expanded ? EXPANDED_W : COLLAPSED_W }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex h-full flex-col border-r",
        "bg-[var(--color-surface-1)]",
      )}
      style={{ borderColor: "var(--color-border)" }}
    >
      {/* Index strip */}
      <div className="flex h-14 items-center justify-center border-b border-[var(--color-border)]">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          {expanded ? "NAVIGATION" : "NAV"}
        </span>
      </div>

      {/* Routes */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="flex flex-col gap-0.5 px-2">
          {ROUTES.map((r) => {
            const active =
              r.path === pathname ||
              (r.path !== "/" && pathname.startsWith(r.path));
            return (
              <li key={r.path}>
                <Link
                  href={r.path}
                  title={r.label}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-[var(--radius-sm)]",
                    "h-10 px-3",
                    "transition-colors duration-200 ease-[var(--ease-omni)]",
                    active
                      ? "bg-[color-mix(in_oklch,var(--color-signal)_14%,transparent)] text-[var(--color-signal)]"
                      : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-[var(--color-signal)]"
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <r.Icon size={20} strokeWidth={1.5} className="shrink-0" />
                  {expanded && (
                    <span className="flex flex-1 items-center justify-between truncate text-[13px]">
                      <span>{r.label}</span>
                      {r.shortcut && (
                        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
                          {r.shortcut}
                        </span>
                      )}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-[var(--color-border)] p-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2",
            "text-[var(--color-fg-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
            "transition-colors",
          )}
          aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
        >
          {expanded ? (
            <ChevronsLeft size={18} strokeWidth={1.5} />
          ) : (
            <ChevronsRight size={18} strokeWidth={1.5} />
          )}
          {expanded && (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
              Collapse
            </span>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
