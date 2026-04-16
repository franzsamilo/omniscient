"use client";

/**
 * NumberFlow wrapper. Centralizes default formatting choices so every callsite
 * stays consistent with CLAUDE.md §11.1 (Geist Mono unit + tabular nums).
 */

import NumberFlowBase, { type Format } from "@number-flow/react";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: number;
  format?: Format;
  className?: string;
  trend?: "up" | "down" | "none";
  /** Suppress the entry animation (use for non-live data). */
  static?: boolean;
};

export function NumberFlow({ value, format, className, trend, static: isStatic }: Props) {
  return (
    <NumberFlowBase
      value={value}
      format={format ?? { maximumFractionDigits: 1 }}
      className={cn("tabular-nums", className)}
      trend={trend === "none" ? 0 : trend === "up" ? 1 : trend === "down" ? -1 : undefined}
      animated={!isStatic}
    />
  );
}
