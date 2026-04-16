"use client";

/**
 * Segmented control — comfortable size, clear active state.
 *
 * The active option fills with signal cyan, the rest are dim and clearly
 * clickable on hover. A spring-animated highlight slides between options.
 */

import type { ComponentType, SVGProps } from "react";
import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";

type IconType = ComponentType<SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;

type Option<V extends string> = {
  value: V;
  label: string;
  Icon?: IconType;
};

type Props<V extends string> = {
  value: V;
  onChange: (v: V) => void;
  options: Option<V>[];
  size?: "sm" | "md" | "lg";
  /** When false (default true), labels are sentence-case instead of mono caps. */
  caps?: boolean;
  className?: string;
};

const SIZE = {
  sm: { btn: "h-8 px-3.5 text-[11px]", caps: "tracking-[0.16em]", icon: 12 },
  md: { btn: "h-10 px-5 text-[12px]", caps: "tracking-[0.18em]", icon: 14 },
  lg: { btn: "h-12 px-7 text-[13px]", caps: "tracking-[0.22em]", icon: 16 },
} as const;

export function SegmentedControl<V extends string>({
  value,
  onChange,
  options,
  size = "md",
  caps = true,
  className,
}: Props<V>) {
  const id = useId();
  const s = SIZE[size];
  return (
    <div
      role="radiogroup"
      className={cn(
        "relative inline-flex items-stretch gap-0.5 rounded-[var(--radius-sm)] border-2 p-1",
        "bg-[var(--color-surface-2)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]",
        className,
      )}
      style={{ borderColor: "var(--color-border-strong)" }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-[1] inline-flex items-center justify-center gap-2 rounded-[4px]",
              "font-medium transition-colors duration-200 ease-[var(--ease-omni)]",
              caps && "font-mono uppercase",
              caps && s.caps,
              s.btn,
              active
                ? "text-[var(--color-bg)]"
                : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-fg)]",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 -z-[1] rounded-[4px] bg-[var(--color-signal)] shadow-[0_0_18px_-4px_var(--color-signal-glow)]"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            {opt.Icon && <opt.Icon size={s.icon} strokeWidth={1.6} />}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
