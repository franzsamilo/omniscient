"use client";

/**
 * EnvDayChart — CLAUDE-UPDATES PATCH 3 §3.2 Row 4.
 * Dual-axis line chart with a shaded comfort band across 22–26°C.
 */

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";
import { motion } from "motion/react";
import { environmentDayOverlay } from "@/lib/mock/telemetry";

type Props = {
  height?: number;
};

export function EnvDayChart({ height = 260 }: Props) {
  const data = environmentDayOverlay();

  return (
    <motion.div
      className="relative w-full"
      style={{ height }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.42 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 48, bottom: 18, left: 0 }}
        >
          <defs>
            <linearGradient id="env-humidity-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-grid)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--color-grid)" stopOpacity={0.04} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="var(--color-border)"
            strokeOpacity={0.5}
            vertical={false}
          />

          <XAxis
            dataKey="hour"
            type="number"
            domain={[0, 23]}
            ticks={[0, 6, 12, 18, 23]}
            tickFormatter={(h) => `${String(h).padStart(2, "0")}:00`}
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

          {/* Temperature axis — left */}
          <YAxis
            yAxisId="temp"
            domain={[18, 36]}
            stroke="var(--color-fg-subtle)"
            tick={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fill: "var(--color-fg-subtle)",
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}°`}
            width={36}
          />

          {/* Humidity axis — right (percent) */}
          <YAxis
            yAxisId="humid"
            orientation="right"
            domain={[0.3, 1]}
            stroke="var(--color-fg-subtle)"
            tick={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              fill: "var(--color-fg-subtle)",
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v * 100)}%`}
            width={40}
          />

          {/* Comfort band 22–26°C */}
          <ReferenceArea
            yAxisId="temp"
            y1={22}
            y2={26}
            fill="var(--color-ok)"
            fillOpacity={0.08}
            stroke="var(--color-ok)"
            strokeOpacity={0.2}
            strokeDasharray="3 4"
          />

          <Tooltip
            cursor={{
              stroke: "var(--color-signal)",
              strokeWidth: 1,
              strokeDasharray: "2 3",
            }}
            content={(p: unknown) => <ChartTooltip {...(p as TooltipShape)} />}
          />

          {/* Humidity area behind lines */}
          <Area
            yAxisId="humid"
            type="monotone"
            dataKey="humidity"
            stroke="var(--color-grid)"
            strokeWidth={1}
            fill="url(#env-humidity-fill)"
            isAnimationActive
            animationDuration={620}
            animationBegin={240}
          />

          {/* Outdoor dashed */}
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="outdoorTemp"
            stroke="var(--color-fg-muted)"
            strokeWidth={1.2}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive
            animationDuration={720}
          />

          {/* Indoor warm line */}
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="indoorTemp"
            stroke="var(--color-warn)"
            strokeWidth={1.6}
            dot={false}
            isAnimationActive
            animationDuration={720}
            animationBegin={120}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

type TooltipShape = {
  active?: boolean;
  label?: string | number;
  payload?: Array<{ dataKey: string; value: number }>;
};

function ChartTooltip({ active, payload, label }: TooltipShape) {
  if (!active || !payload || payload.length === 0) return null;
  const find = (k: string) => payload.find((p) => p.dataKey === k)?.value;
  return (
    <div
      className="rounded-[var(--radius-sm)] border bg-[var(--color-surface-1)] px-3 py-2"
      style={{ borderColor: "var(--color-border-strong)" }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        {String(label).padStart(2, "0")}:00
      </p>
      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono text-[11px] tabular-nums">
        <span className="text-[var(--color-warn)]">INDOOR</span>
        <span className="text-right">{find("indoorTemp")?.toFixed(1)}°C</span>
        <span className="text-[var(--color-fg-muted)]">OUTDOOR</span>
        <span className="text-right">{find("outdoorTemp")?.toFixed(1)}°C</span>
        <span className="text-[var(--color-grid)]">HUMIDITY</span>
        <span className="text-right">
          {Math.round((find("humidity") ?? 0) * 100)}%
        </span>
      </div>
    </div>
  );
}
