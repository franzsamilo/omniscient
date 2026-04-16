"use client";

import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { NumberFlow } from "./NumberFlow";
import { Sparkline } from "./Sparkline";
import { Card } from "./Card";
import { cn } from "@/lib/utils/cn";

type Props = {
  label: string;
  index: string;
  value: number;
  unit: string;
  decimals?: number;
  display?: React.ReactNode;
  delta: number;
  invertDelta?: boolean;
  spark: number[];
  sparkColor?: string;
  sparkFill?: string;
  comparison?: string;
};

export function KpiCard({
  label,
  index,
  value,
  unit,
  decimals = 1,
  display,
  delta,
  invertDelta,
  spark,
  sparkColor,
  sparkFill,
  comparison = "vs 24h",
}: Props) {
  const positive = delta > 0;
  const isBad = invertDelta ? positive : !positive;
  const Arrow = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <Card surface={1} hoverable className="overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          {label}
        </span>
        <div className="text-[var(--color-fg-muted)]" style={{ color: sparkColor }}>
          <Sparkline values={spark} stroke="currentColor" fill={sparkFill} />
        </div>
      </div>

      <div className="px-5 pb-5">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 flex items-baseline gap-2"
        >
          <span
            className="font-serif italic leading-none tabular-nums text-[var(--color-fg)]"
            style={{ fontSize: "clamp(2.4rem, 4.2vw, 3.6rem)" }}
          >
            {display ?? (
              <NumberFlow
                value={value}
                format={{
                  maximumFractionDigits: decimals,
                  minimumFractionDigits: decimals,
                }}
              />
            )}
          </span>
          <span className="font-mono text-[11px] text-[var(--color-fg-subtle)] tabular-nums">
            {unit}
          </span>
        </motion.div>

        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--color-fg-muted)]">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 tabular-nums",
              isBad ? "text-[var(--color-danger)]" : "text-[var(--color-ok)]",
            )}
          >
            <Arrow size={11} strokeWidth={1.6} />
            {Math.abs(delta).toFixed(1)}%
          </span>
          <span className="text-[var(--color-fg-subtle)]">{comparison}</span>
        </div>
      </div>
    </Card>
  );
}
