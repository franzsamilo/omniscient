"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-[var(--color-signal)] text-[var(--color-bg)] hover:bg-[color-mix(in_oklch,var(--color-signal)_92%,white)]",
  ghost:
    "bg-transparent text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]",
  danger:
    "bg-[var(--color-danger)] text-[var(--color-fg)] hover:bg-[color-mix(in_oklch,var(--color-danger)_88%,white)]",
  outline:
    "bg-transparent text-[var(--color-fg)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]",
};

const SIZE: Record<Size, string> = {
  sm: "h-7 px-3 text-[11px] tracking-[0.16em]",
  md: "h-9 px-4 text-[12px] tracking-[0.18em]",
  lg: "h-11 px-6 text-[13px] tracking-[0.22em]",
};

type Props = Omit<HTMLMotionProps<"button">, "size"> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "ghost", size = "md", className, children, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-sm)]",
        "font-mono uppercase font-medium",
        "transition-colors duration-200 ease-[var(--ease-omni)]",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
