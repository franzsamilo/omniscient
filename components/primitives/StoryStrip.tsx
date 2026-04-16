"use client";

/**
 * StoryStrip — a low-key narrative panel that sits above dense data.
 *
 * Frames what the user is looking at in plain English, with optional helper
 * stats on the right. Used at the top of /overview, /power, /map etc. so a
 * first-time reader has context before scanning the metrics.
 */

import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";

type Stat = {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn" | "danger" | "signal" | "solar" | "grid";
};

type Props = {
  /** Short label shown in mono caps before the headline (e.g., "Right now"). */
  eyebrow: string;
  /** The plain-English summary, ideally one sentence. */
  headline: React.ReactNode;
  /** Optional secondary line for context. */
  detail?: React.ReactNode;
  /** 0–4 helper stats shown on the right at desktop. */
  stats?: Stat[];
  className?: string;
};

const TONE_COLOR: Record<NonNullable<Stat["tone"]>, string> = {
  default: "var(--color-fg)",
  ok: "var(--color-ok)",
  warn: "var(--color-warn)",
  danger: "var(--color-danger)",
  signal: "var(--color-signal)",
  solar: "var(--color-solar)",
  grid: "var(--color-grid)",
};

export function StoryStrip({ eyebrow, headline, detail, stats, className }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex flex-col gap-4 rounded-[var(--radius-md)] border px-5 py-4",
        "bg-[var(--color-surface-1)] md:flex-row md:items-center md:justify-between",
        className,
      )}
      style={{ borderColor: "var(--color-border)" }}
    >
      {/* Accent rule on the left */}
      <span
        aria-hidden
        className="absolute left-0 top-1/2 h-10 w-[2px] -translate-y-1/2 rounded-r"
        style={{ background: "var(--color-signal)" }}
      />

      <div className="min-w-0 flex-1 pl-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          {eyebrow}
        </p>
        <p className="mt-1 text-[15px] font-medium leading-snug text-[var(--color-fg)]">
          {headline}
        </p>
        {detail && (
          <p className="mt-1 text-[12px] text-[var(--color-fg-muted)]">{detail}</p>
        )}
      </div>

      {stats && stats.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 md:flex-nowrap md:justify-end">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col items-start md:items-end">
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
                {s.label}
              </span>
              <span
                className="mt-0.5 font-mono text-[14px] tabular-nums"
                style={{ color: TONE_COLOR[s.tone ?? "default"] }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
