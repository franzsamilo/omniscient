"use client";

/**
 * EnergyFlowDiagram — CLAUDE-UPDATES PATCH 1 §1.1 Row 2.
 *
 * 2×2 node grid with a central lightning pivot. Previous iterations had
 * cards and connectors drifting apart because the HTML cards and the SVG
 * used independent percent-based positioning. This rewrite puts both the
 * cards and the flow lines in a single viewBox-coordinate system (both
 * rendered as SVG children): HTML cards live inside `<foreignObject>` so
 * their position tracks the SVG's coordinate space exactly.
 */

import { motion } from "motion/react";
import {
  Sun,
  Zap,
  Home,
  BatteryMedium,
  BatteryCharging,
  BatteryWarning,
} from "lucide-react";
import { AnimatedFlowLine } from "@/components/primitives/AnimatedFlowLine";
import { NumberFlow } from "@/components/primitives/NumberFlow";
import { cn } from "@/lib/utils/cn";
import type { PowerFlow } from "@/lib/mock/telemetry";

type Props = {
  flow: PowerFlow;
  className?: string;
};

// All coordinates below are viewBox units — the same system used by the
// SVG elements AND by the foreignObject-wrapped HTML cards, so they stay
// pixel-locked to each other regardless of container width.
const W = 1000;
const H = 460;
const PIVOT = { x: W / 2, y: H / 2 };
const PIVOT_R = 40;

const CARD_W = 240;
const CARD_H = 108;
// Gap between card edges and the pivot ring, measured along each diagonal.
const GAP = 120;

// Card anchors — derived so card corners sit exactly GAP units from the pivot.
const DX = PIVOT_R * 0.707 + GAP * 0.707 + CARD_W / 2;
const DY = PIVOT_R * 0.707 + GAP * 0.707 + CARD_H / 2;
const NODE_ANCHORS = {
  solar:   { x: PIVOT.x - DX, y: PIVOT.y - DY },
  grid:    { x: PIVOT.x + DX, y: PIVOT.y - DY },
  load:    { x: PIVOT.x - DX, y: PIVOT.y + DY },
  battery: { x: PIVOT.x + DX, y: PIVOT.y + DY },
};

type Corner = "tl" | "tr" | "bl" | "br";

export function EnergyFlowDiagram({ flow, className }: Props) {
  const { solarKw, gridImportKw, batteryKw, campusLoadKw, batterySoc } = flow;

  const solarActive = solarKw > 0.1;
  const gridActive = gridImportKw > 0.1;
  const loadActive = campusLoadKw > 0.1;
  const batteryCharging = batteryKw > 0.1;
  const batteryDischarging = batteryKw < -0.1;
  const batteryActive = batteryCharging || batteryDischarging;

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[1180px] overflow-hidden rounded-[var(--radius-md)] border",
        "bg-[var(--color-surface-1)]",
        className,
      )}
      style={{ borderColor: "var(--color-border)" }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Faint technical grid */}
        <defs>
          <pattern id="flow-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="var(--color-border)"
              strokeOpacity={0.25}
              strokeWidth={0.5}
            />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#flow-grid)" />

        {/* Flow lines — one per edge. */}
        <AnimatedFlowLine
          d={pathToPivot(NODE_ANCHORS.solar, "tl")}
          rate={solarKw}
          minRate={0.5}
          maxRate={8}
          color="var(--color-solar)"
          active={solarActive}
          strokeWidth={1.8}
        />
        <AnimatedFlowLine
          d={pathToPivot(NODE_ANCHORS.grid, "tr")}
          rate={gridImportKw}
          minRate={0.5}
          maxRate={8}
          color="var(--color-grid)"
          active={gridActive}
          strokeWidth={1.8}
        />
        <AnimatedFlowLine
          d={pathToPivot(NODE_ANCHORS.load, "bl")}
          rate={campusLoadKw}
          minRate={0.5}
          maxRate={8}
          color="var(--color-signal)"
          active={loadActive}
          reverse
          strokeWidth={1.8}
        />
        <AnimatedFlowLine
          d={pathToPivot(NODE_ANCHORS.battery, "br")}
          rate={Math.abs(batteryKw)}
          minRate={0.3}
          maxRate={4}
          color={batteryCharging ? "var(--color-signal)" : "var(--color-warn)"}
          active={batteryActive}
          reverse={batteryCharging}
          strokeWidth={1.8}
        />

        {/* Pivot */}
        <g>
          <motion.circle
            cx={PIVOT.x}
            cy={PIVOT.y}
            r={PIVOT_R + 6}
            fill="none"
            stroke="var(--color-signal)"
            strokeOpacity={0.18}
            strokeWidth={1}
            animate={{ r: [PIVOT_R + 6, PIVOT_R + 12, PIVOT_R + 6] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <circle
            cx={PIVOT.x}
            cy={PIVOT.y}
            r={PIVOT_R}
            fill="var(--color-surface-2)"
            stroke="var(--color-signal)"
            strokeWidth={1.6}
          />
          <circle
            cx={PIVOT.x}
            cy={PIVOT.y}
            r={PIVOT_R - 6}
            fill="none"
            stroke="var(--color-border)"
            strokeDasharray="2 3"
            strokeWidth={0.8}
          />
          <path
            d={`M ${PIVOT.x - 7} ${PIVOT.y - 13} L ${PIVOT.x + 5} ${PIVOT.y - 3} L ${PIVOT.x - 2} ${PIVOT.y - 1} L ${PIVOT.x + 7} ${PIVOT.y + 13} L ${PIVOT.x - 5} ${PIVOT.y + 3} L ${PIVOT.x + 2} ${PIVOT.y + 1} Z`}
            fill="var(--color-signal)"
            stroke="var(--color-signal)"
            strokeWidth={1}
            strokeLinejoin="round"
          />
        </g>

        {/* Bus label below the pivot */}
        <g transform={`translate(${PIVOT.x}, ${PIVOT.y + PIVOT_R + 14})`}>
          <rect
            x={-18}
            y={-7}
            width={36}
            height={14}
            rx={7}
            fill="var(--color-bg)"
            stroke="var(--color-signal)"
            strokeWidth={1}
          />
          <text
            x={0}
            y={3}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={8}
            letterSpacing={1.6}
            fill="var(--color-signal)"
          >
            BUS
          </text>
        </g>

        {/* Node cards rendered inside the same SVG coordinate space. */}
        <NodeCard
          anchor={NODE_ANCHORS.solar}
          eyebrow="Solar roof"
          icon={<Sun size={13} strokeWidth={1.6} className="text-[var(--color-solar)]" />}
          value={solarKw}
          unit="kW"
          tone="solar"
          detail={solarActive ? "Producing" : "Offline"}
        />
        <NodeCard
          anchor={NODE_ANCHORS.grid}
          eyebrow="Grid (import)"
          icon={<Zap size={13} strokeWidth={1.6} className="text-[var(--color-grid)]" />}
          value={gridImportKw}
          unit="kW"
          tone="grid"
          detail={gridActive ? "Drawing" : "Off-peak idle"}
        />
        <NodeCard
          anchor={NODE_ANCHORS.load}
          eyebrow="Campus load"
          icon={<Home size={13} strokeWidth={1.6} className="text-[var(--color-signal)]" />}
          value={campusLoadKw}
          unit="kW"
          tone="signal"
          detail="Aggregate draw"
        />
        <NodeCard
          anchor={NODE_ANCHORS.battery}
          eyebrow="Battery"
          icon={
            batteryCharging ? (
              <BatteryCharging size={13} strokeWidth={1.6} className="text-[var(--color-ok)]" />
            ) : batterySoc < 0.15 ? (
              <BatteryWarning size={13} strokeWidth={1.6} className="text-[var(--color-danger)]" />
            ) : (
              <BatteryMedium size={13} strokeWidth={1.6} className="text-[var(--color-fg-muted)]" />
            )
          }
          value={batterySoc * 100}
          unit="%"
          decimals={0}
          tone="fg"
          detail={
            batteryCharging
              ? `Charging · ${batteryKw.toFixed(1)} kW`
              : batteryDischarging
                ? `Discharging · ${Math.abs(batteryKw).toFixed(1)} kW`
                : "Idle"
          }
          extra={<BatteryBar soc={batterySoc} />}
        />
      </svg>
    </div>
  );
}

/**
 * Smooth cubic bezier from the card's inner corner to the matching
 * 45° octant of the pivot ring. `corner` is the node's position relative
 * to the pivot — solar=tl, grid=tr, load=bl, battery=br.
 */
function pathToPivot(card: { x: number; y: number }, corner: Corner): string {
  const halfW = CARD_W / 2;
  const halfH = CARD_H / 2;

  const exit: Record<Corner, { x: number; y: number }> = {
    tl: { x: card.x + halfW, y: card.y + halfH },
    tr: { x: card.x - halfW, y: card.y + halfH },
    bl: { x: card.x + halfW, y: card.y - halfH },
    br: { x: card.x - halfW, y: card.y - halfH },
  };

  const k = PIVOT_R * 0.707;
  const attach: Record<Corner, { x: number; y: number }> = {
    tl: { x: PIVOT.x - k, y: PIVOT.y - k },
    tr: { x: PIVOT.x + k, y: PIVOT.y - k },
    bl: { x: PIVOT.x - k, y: PIVOT.y + k },
    br: { x: PIVOT.x + k, y: PIVOT.y + k },
  };

  const a = exit[corner];
  const b = attach[corner];
  const midX = (a.x + b.x) / 2;

  // Gentle S using a single mid-x pivot for both control points.
  const c1 = { x: midX, y: a.y };
  const c2 = { x: midX, y: b.y };

  return [
    `M ${a.x.toFixed(1)} ${a.y.toFixed(1)}`,
    `C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)},`,
    `${c2.x.toFixed(1)} ${c2.y.toFixed(1)},`,
    `${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
  ].join(" ");
}

function NodeCard({
  anchor,
  eyebrow,
  icon,
  value,
  unit,
  decimals = 1,
  tone,
  detail,
  extra,
}: {
  anchor: { x: number; y: number };
  eyebrow: string;
  icon: React.ReactNode;
  value: number;
  unit: string;
  decimals?: number;
  tone: "solar" | "grid" | "signal" | "fg";
  detail: string;
  extra?: React.ReactNode;
}) {
  const toneColor =
    tone === "solar"
      ? "var(--color-solar)"
      : tone === "grid"
        ? "var(--color-grid)"
        : tone === "signal"
          ? "var(--color-signal)"
          : "var(--color-fg)";

  return (
    <foreignObject
      x={anchor.x - CARD_W / 2}
      y={anchor.y - CARD_H / 2}
      width={CARD_W}
      height={CARD_H}
    >
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        className={cn(
          "flex h-full w-full flex-col gap-1.5 rounded-[var(--radius-sm)] border px-3 py-2.5",
          "bg-[var(--color-surface-2)]",
        )}
        style={{ borderColor: "var(--color-border-strong)" }}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-[var(--color-fg-subtle)]">
            {eyebrow}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <NumberFlow
            value={value}
            format={{
              maximumFractionDigits: decimals,
              minimumFractionDigits: decimals,
            }}
            className="font-serif italic text-[22px] leading-none tabular-nums"
          />
          <span
            className="font-mono text-[10px] uppercase tracking-[0.2em]"
            style={{ color: toneColor }}
          >
            {unit}
          </span>
        </div>
        {extra}
        <p className="font-mono text-[10px] text-[var(--color-fg-muted)]">{detail}</p>
      </motion.div>
    </foreignObject>
  );
}

function BatteryBar({ soc }: { soc: number }) {
  const color = soc < 0.15 ? "var(--color-danger)" : soc < 0.3 ? "var(--color-warn)" : "var(--color-ok)";
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]">
      <motion.div
        className="h-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${soc * 100}%` }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
