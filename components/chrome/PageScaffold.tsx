"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { cn } from "@/lib/utils/cn";

/**
 * Phase 1 placeholder scaffold for routes that aren't built yet.
 * Once a route ships its real content, replace this with the actual page.
 */
type Props = {
  index: string | number;
  label: string;
  blurb: string;
  /** Optional list of "coming next" deliverables shown beneath the headline. */
  next?: string[];
};

export function PageScaffold({ index, label, blurb, next }: Props) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-8 py-6">
      <SectionHeader index={index} label={label} />

      <div className="mx-auto mt-16 flex w-full max-w-[64ch] flex-col gap-6">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "font-serif italic text-[length:var(--text-h1)] leading-[1.05] text-[var(--color-fg)]",
          )}
        >
          {blurb}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.42, delay: 0.12 }}
          className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]"
        >
          ╌╌ Phase 1 placeholder · scaffold ready · awaiting deliverables
        </motion.p>

        {next && next.length > 0 && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.42, delay: 0.24 }}
            className="mt-4 flex flex-col gap-2 border-l border-[var(--color-border)] pl-4"
          >
            {next.map((item, i) => (
              <li
                key={i}
                className="font-mono text-[12px] text-[var(--color-fg-muted)]"
              >
                <span className="mr-2 text-[var(--color-fg-subtle)] tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item}
              </li>
            ))}
          </motion.ul>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.42, delay: 0.36 }}
        >
          <Link
            href="/overview"
            className={cn(
              "inline-flex items-center gap-2 border-b border-[var(--color-border)] pb-1",
              "font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-fg-muted)]",
              "transition-colors hover:text-[var(--color-signal)] hover:border-[var(--color-signal)]",
            )}
          >
            Return to overview
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
