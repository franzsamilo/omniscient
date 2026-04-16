"use client";

/**
 * Water7dChart — CLAUDE-UPDATES PATCH 4 §4.2 Row 4.
 * Stacked bar chart, one bar per day, colored by zone kind.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { motion } from "motion/react";
import { water7dSeries } from "@/lib/mock/telemetry";
import { int } from "@/lib/utils/format";

type Props = {
  height?: number;
};

const ZONES = [
  { key: "academic", label: "Academic", color: "var(--color-signal)" },
  { key: "residential", label: "Residential", color: "var(--color-grid)" },
  { key: "sports", label: "Sports", color: "var(--color-ok)" },
  { key: "dining", label: "Dining", color: "var(--color-solar)" },
  { key: "utility", label: "Utility", color: "var(--color-fg-muted)" },
] as const;

export function Water7dChart({ height = 240 }: Props) {
  const data = water7dSeries();

  return (
    <motion.div
      className="relative w-full"
      style={{ height }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.42 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, bottom: 20, left: 0 }}>
          <CartesianGrid
            stroke="var(--color-border)"
            strokeOpacity={0.5}
            vertical={false}
          />
          <XAxis
            dataKey="day"
            stroke="var(--color-fg-subtle)"
            tick={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.18em",
              fill: "var(--color-fg-subtle)",
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="var(--color-fg-subtle)"
            tick={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.18em",
              fill: "var(--color-fg-subtle)",
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={40}
          />
          <Tooltip
            cursor={{ fill: "color-mix(in oklch, var(--color-signal) 10%, transparent)" }}
            content={(p: unknown) => <ChartTooltip {...(p as TooltipShape)} />}
          />
          {ZONES.map((z, i) => (
            <Bar
              key={z.key}
              dataKey={z.key}
              stackId="w"
              fill={z.color}
              isAnimationActive
              animationDuration={620}
              animationBegin={i * 80}
              radius={i === ZONES.length - 1 ? [2, 2, 0, 0] : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

type TooltipShape = {
  active?: boolean;
  label?: string;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
};

function ChartTooltip({ active, payload, label }: TooltipShape) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div
      className="rounded-[var(--radius-sm)] border bg-[var(--color-surface-1)] px-3 py-2"
      style={{ borderColor: "var(--color-border-strong)" }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        {label}
      </p>
      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-[11px] tabular-nums">
        {payload.map((p) => (
          <span key={p.dataKey} style={{ color: p.color }} className="contents">
            <span>{p.dataKey.toUpperCase()}</span>
            <span className="text-right">{int(p.value)} L</span>
          </span>
        ))}
        <span className="col-span-2 mt-1 border-t border-[var(--color-border)] pt-1" />
        <span className="text-[var(--color-fg-muted)]">TOTAL</span>
        <span className="text-right text-[var(--color-fg)]">{int(total)} L</span>
      </div>
    </div>
  );
}
