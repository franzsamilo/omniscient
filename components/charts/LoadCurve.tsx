"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { motion } from "motion/react";
import { todayLoadCurve, currentSlotIndex } from "@/lib/mock/telemetry";
import { kw, peso } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Props = {
  height?: number;
  /** Show legend + axis labels (off for the small embed). */
  dense?: boolean;
};

export function LoadCurve({ height = 260, dense }: Props) {
  const data = useMemo(() => todayLoadCurve(), []);
  const nowIdx = useMemo(() => currentSlotIndex(), []);
  const [hover, setHover] = useState<{ idx: number } | null>(null);

  // Pre-tick the labels we want to render on the X axis.
  const xTickIdxs = useMemo(() => {
    const ticks: number[] = [];
    for (let h = 0; h <= 24; h += 4) ticks.push(h * 12);
    return ticks;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.42 }}
      className={cn("relative w-full")}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={120}>
        <AreaChart
          data={data}
          margin={{ top: 8, right: 12, bottom: dense ? 0 : 18, left: dense ? 0 : 8 }}
          onMouseMove={(s) => {
            if (s && typeof s.activeTooltipIndex === "number") {
              setHover({ idx: s.activeTooltipIndex });
            }
          }}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="grid-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-grid)" stopOpacity={0.65} />
              <stop offset="100%" stopColor="var(--color-grid)" stopOpacity={0.06} />
            </linearGradient>
            <linearGradient id="solar-fill" x1="0" y1="0" x2="0" y2="1">
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
            ticks={xTickIdxs.map((i) => i * 5)}
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
            hide={dense}
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
            tickFormatter={(v) => `${Math.round(v)}`}
            width={dense ? 0 : 36}
            hide={dense}
          />

          <Tooltip
            cursor={{ stroke: "var(--color-signal)", strokeWidth: 1, strokeDasharray: "2 3" }}
            content={(p: unknown) => <CurveTooltip {...(p as TooltipShape)} />}
          />

          <ReferenceLine
            x={nowIdx * 5}
            stroke="var(--color-signal)"
            strokeWidth={1}
            strokeDasharray="3 3"
            label={
              dense
                ? undefined
                : {
                    value: "NOW",
                    position: "top",
                    fill: "var(--color-signal)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 9,
                    letterSpacing: "0.22em",
                    dy: -2,
                  }
            }
          />

          <Area
            type="monotone"
            dataKey="grid"
            stackId="1"
            stroke="var(--color-grid)"
            strokeWidth={1.4}
            fill="url(#grid-fill)"
            isAnimationActive
            animationDuration={720}
          />
          <Area
            type="monotone"
            dataKey="solar"
            stackId="1"
            stroke="var(--color-solar)"
            strokeWidth={1.4}
            fill="url(#solar-fill)"
            isAnimationActive
            animationDuration={720}
            animationBegin={120}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* sr-only data table for accessibility */}
      <table className="sr-only">
        <caption>Today's grid + solar load curve, 5-minute intervals</caption>
        <thead>
          <tr>
            <th>Time</th><th>Grid kW</th><th>Solar kW</th><th>Total kW</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.minute}>
              <td>{d.label}</td>
              <td>{d.grid}</td>
              <td>{d.solar}</td>
              <td>{d.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}

type TooltipShape = {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload: { label: string; grid: number; solar: number; total: number } }>;
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
        <span className="text-[var(--color-fg-muted)]">TOTAL</span>
        <span className="text-right">{kw(p.total)}</span>
        <span className="text-[var(--color-fg-muted)]">COST</span>
        <span className="text-right">{peso(cost)}</span>
      </div>
    </div>
  );
}
