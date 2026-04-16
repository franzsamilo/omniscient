"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

type Option<V extends string> = {
  value: V;
  label: string;
  Icon?: typeof motion.div;
};

type Props<V extends string> = {
  value: V;
  onChange: (v: V) => void;
  options: Option<V>[];
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE = {
  sm: "h-7 text-[10px] tracking-[0.18em] px-3",
  md: "h-9 text-[11px] tracking-[0.2em] px-4",
  lg: "h-12 text-[12px] tracking-[0.24em] px-6",
};

export function SegmentedControl<V extends string>({
  value,
  onChange,
  options,
  size = "md",
  className,
}: Props<V>) {
  const id = useId();
  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-[var(--radius-sm)] border p-0.5",
        "bg-[var(--color-surface-2)]",
        className,
      )}
      style={{ borderColor: "var(--color-border-strong)" }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-[1] inline-flex items-center justify-center gap-2 rounded-[4px]",
              "font-mono uppercase font-medium transition-colors duration-200",
              SIZE[size],
              active ? "text-[var(--color-bg)]" : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 -z-[1] rounded-[4px] bg-[var(--color-signal)]"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
