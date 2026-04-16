"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";

type Props = {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /** Color when on. */
  tone?: "signal" | "ok" | "solar" | "danger" | "warn";
  size?: "sm" | "md";
  label?: string;
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  signal: "var(--color-signal)",
  ok: "var(--color-ok)",
  solar: "var(--color-solar)",
  danger: "var(--color-danger)",
  warn: "var(--color-warn)",
};

export function Toggle({ on, onToggle, disabled, tone = "signal", size = "md", label }: Props) {
  const W = size === "sm" ? 36 : 46;
  const H = size === "sm" ? 20 : 24;
  const PAD = 2;
  const D = H - PAD * 2;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full",
        "border transition-colors duration-200 ease-[var(--ease-omni)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      )}
      style={{
        width: W,
        height: H,
        background: on ? TONE[tone] : "var(--color-surface-3)",
        borderColor: on ? TONE[tone] : "var(--color-border-strong)",
        boxShadow: on ? `0 0 18px -4px ${TONE[tone]}` : undefined,
      }}
    >
      <motion.span
        layout
        className="rounded-full bg-[var(--color-bg)]"
        style={{
          width: D,
          height: D,
          marginLeft: on ? W - D - PAD * 2 : 0,
        }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 0.16 }}
      />
    </button>
  );
}
