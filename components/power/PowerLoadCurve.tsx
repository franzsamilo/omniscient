"use client";

/**
 * PowerLoadCurve — CLAUDE-UPDATES PATCH 1 §1.1 Row 4.
 *
 * Today's 24h chart with three series:
 *  - Grid (indigo, stacked area, positive)
 *  - Solar (amber, stacked area, positive)
 *  - Battery (bar, diverging: + charging, − discharging) on a secondary axis
 *
 * The battery axis is pinned symmetrically so the charge/discharge
 * magnitude reads clearly without fighting the main area stack.
 */

import { useMemo } from "react";
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion } from "motion/react";
import {
  todayLoadCurve,
  batteryKwCurve,
  currentSlotIndex,
} from "@/lib/mock/telemetry";
import { kw, peso } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Props = {
  height?: number;
  className?: string;
};

export function PowerLoadCurve({ height = 280, className }: Props) {
  const data = useMemo(() => {
    const load = todayLoadCurve();
    const batt = batteryKwCurve();
    return load.map((p, i) => ({
      minute: p.minute,
      label: p.label,
      grid: p.grid,
      solar: p.solar,
      total: p.total,
      battery: batt[i] ?? 0,
    }));
  }, []);

  const nowIdx = useMemo(() => currentSlotIndex(), []);

  const batteryMax = useMemo(
    () =>
      Math.max(
        1,
        ...data.map((d) => Math.abs(d.battery)),
      ),
    [data],
  );

  // Main Y-axis domain: [0, max total, padded a little].
  const totalMax = useMemo(
    () => Math.max(...data.map((d) => d.total)) * 1.08,
    [data],
  );

  return (
    <motion.div
      className={cn("relative w-full", className)}
      style={{ height }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.42 }}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={160}>
        <ComposedChart
          data={data}
          margin={{ top: 6, right: 52, bottom: 18, left: 8 }}
        >
          <defs>
            <linearGradient id="grid-fill-pc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-grid)" stopOpacity={0.65} />
              <stop offset="100%" stopColor="var(--color-grid)" stopOpacity={0.06} />
            </linearGradient>
            <linearGradient id="solar-fill-pc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-solar)" stopOpacity={0.7} />
              <stop offset="100%" stopColor="var(--color-solar)" stopOpacity={0.06} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="var(--color-border)"
            strokeOpacity={0.5}
            vertical={false}
          />

          <XAxis
            dataKey="minute"
            type="number"
            domain={[0, 1435]}
            ticks={[0, 4, 8, 12, 16, 20, 24].map((h) => h * 60)}
            tickFormatter={(m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:00`}
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

          {/* Main axis: load (kW) */}
          <YAxis
            yAxisId="load"
            domain={[0, Math.ceil(totalMax / 100) * 100]}
            stroke="var(--color-fg-subtle)"
            tick={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.18em",
              fill: "var(--color-fg-subtle)",
            }}
            axisLine={false}
            tickLine={false}
            width={40}
          />

          {/* Secondary axis: battery (kW, diverging) */}
          <YAxis
            yAxisId="battery"
            orientation="right"
            domain={[-batteryMax * 1.1, batteryMax * 1.1]}
            stroke="var(--color-fg-subtle)"
            tick={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.18em",
              fill: "var(--color-fg-subtle)",
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v === 0 ? "batt" : `${Math.round(v as number)}`)}
            width={40}
          />

          <Tooltip
            cursor={{
              stroke: "var(--color-signal)",
              strokeWidth: 1,
              strokeDasharray: "2 3",
            }}
            content={(p: unknown) => <CurveTooltip {...(p as TooltipShape)} />}
          />

          <ReferenceLine
            yAxisId="load"
            x={nowIdx * 5}
            stroke="var(--color-signal)"
            strokeWidth={1}
            strokeDasharray="3 3"
            label={{
              value: "NOW",
              position: "top",
              fill: "var(--color-signal)",
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.22em",
              dy: -2,
            }}
          />

          <ReferenceLine yAxisId="battery" y={0} stroke="var(--color-border-strong)" />

          <Area
            yAxisId="load"
            type="monotone"
            dataKey="grid"
            stackId="load"
            stroke="var(--color-grid)"
            strokeWidth={1.4}
            fill="url(#grid-fill-pc)"
            isAnimationActive
            animationDuration={720}
          />
          <Area
            yAxisId="load"
            type="monotone"
            dataKey="solar"
            stackId="load"
            stroke="var(--color-solar)"
            strokeWidth={1.4}
            fill="url(#solar-fill-pc)"
            isAnimationActive
            animationDuration={720}
            animationBegin={120}
          />
          <Bar
            yAxisId="battery"
            dataKey="battery"
            name="battery"
            isAnimationActive
            animationDuration={720}
            animationBegin={240}
            shape={(props: unknown) => <BatteryBarShape {...(props as BatteryBarProps)} />}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

type BatteryBarProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Recharts passes the row's battery value as a top-level prop (the dataKey). */
  battery?: number;
  payload?: { battery?: number };
};

function BatteryBarShape(props: BatteryBarProps) {
  const batteryVal =
    typeof props.battery === "number"
      ? props.battery
      : (props.payload?.battery ?? 0);
  const positive = batteryVal >= 0;
  const color = positive ? "var(--color-ok)" : "var(--color-warn)";
  const w = Math.max(1.4, props.width * 0.45);
  const x = props.x + (props.width - w) / 2;
  return (
    <rect
      x={x}
      y={props.y}
      width={w}
      height={Math.max(0.8, props.height)}
      fill={color}
      fillOpacity={0.7}
      rx={1}
    />
  );
}

type TooltipShape = {
  active?: boolean;
  payload?: Array<{
    payload: { label: string; grid: number; solar: number; total: number; battery: number };
  }>;
};

function CurveTooltip({ active, payload }: TooltipShape) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  const cost = (p.grid / 12) * 12.8;
  return (
    <div
      className="rounded-[var(--radius-sm)] border bg-[var(--color-surface-1)] px-3 py-2 text-[11px]"
      style={{ borderColor: "var(--color-border-strong)" }}
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        {p.label}
      </div>
      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono tabular-nums text-[var(--color-fg)]">
        <span className="text-[var(--color-grid)]">GRID</span>
        <span className="text-right">{kw(p.grid)}</span>
        <span className="text-[var(--color-solar)]">SOLAR</span>
        <span className="text-right">{kw(p.solar)}</span>
        <span
          style={{
            color: p.battery >= 0 ? "var(--color-ok)" : "var(--color-warn)",
          }}
        >
          BATT
        </span>
        <span className="text-right">
          {p.battery >= 0 ? "+" : ""}
          {kw(p.battery)}
        </span>
        <span className="text-[var(--color-fg-muted)]">TOTAL</span>
        <span className="text-right">{kw(p.total)}</span>
        <span className="text-[var(--color-fg-muted)]">COST</span>
        <span className="text-right">{peso(cost)}</span>
      </div>
    </div>
  );
}
