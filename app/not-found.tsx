"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { time } from "@/lib/utils/format";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8">
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="font-serif italic text-[length:var(--text-h1)] text-[var(--color-fg)]"
      >
        This route is off the grid.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.42, delay: 0.18 }}
        className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]"
        suppressHydrationWarning
      >
        404 · {time(new Date())} PHT · path not found in this build
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.42, delay: 0.32 }}
      >
        <Link
          href="/overview"
          className="inline-flex items-center gap-2 border-b border-[var(--color-border-strong)] pb-1 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-signal)] hover:border-[var(--color-signal)]"
        >
          Return to command center →
        </Link>
      </motion.div>
    </div>
  );
}
