"use client";

/**
 * WaterFlowTree — CLAUDE-UPDATES PATCH 4 §4.2 Row 2.
 *
 * A simplified campus plumbing schematic: a trunk enters from the left and
 * fans into five zone destinations. Each branch uses the shared
 * AnimatedFlowLine (grid/blue palette). Zones with active leaks pulse red
 * and gain a ⚠ LEAK label.
 */

import { motion } from "motion/react";
import { Droplet, AlertTriangle } from "lucide-react";
import { AnimatedFlowLine } from "@/components/primitives/AnimatedFlowLine";
import type { CampusWaterZone } from "@/lib/mock/telemetry";
import { cn } from "@/lib/utils/cn";

type Props = {
  zones: CampusWaterZone[];
  currentFlowLpm: number;
  className?: string;
};

const W = 1000;
const H = 440;

// Source + junction — trunk runs horizontally from SOURCE through JUNCTION.
const SOURCE = { x: 100, y: 220 };
const JUNCTION = { x: 300, y: 220 };

// Zone endpoints fan out right. Stacked vertically for easy reading.
const ZONE_POS: Record<string, { x: number; y: number }> = {
  academic: { x: 900, y: 60 },
  residential: { x: 900, y: 155 },
  dining: { x: 900, y: 245 },
  sports: { x: 900, y: 335 },
  utility: { x: 900, y: 395 },
};

export function WaterFlowTree({ zones, currentFlowLpm, className }: Props) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[var(--radius-md)] border",
        "bg-[var(--color-surface-1)]",
        className,
      )}
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="relative" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          {/* Faint grid */}
          <defs>
            <pattern id="wf-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="var(--color-border)"
                strokeOpacity={0.2}
                strokeWidth={0.5}
              />
            </pattern>
          </defs>
          <rect width={W} height={H} fill="url(#wf-grid)" />

          {/* Trunk line — SOURCE → JUNCTION. */}
          <AnimatedFlowLine
            d={`M ${SOURCE.x} ${SOURCE.y} L ${JUNCTION.x} ${JUNCTION.y}`}
            rate={currentFlowLpm / 6}
            minRate={0.5}
            maxRate={8}
            color="var(--color-grid)"
            strokeWidth={2.6}
            active={currentFlowLpm > 0}
            noParticle
          />

          {/* Junction disc */}
          <circle
            cx={JUNCTION.x}
            cy={JUNCTION.y}
            r={10}
            fill="var(--color-surface-2)"
            stroke="var(--color-grid)"
            strokeWidth={1.4}
          />
          <circle cx={JUNCTION.x} cy={JUNCTION.y} r={3} fill="var(--color-grid)" />

          {/* Zone branches */}
          {zones.map((z) => {
            const end = ZONE_POS[z.kind];
            if (!end) return null;
            const leak = z.leakDetected;
            const color = leak ? "var(--color-danger)" : "var(--color-grid)";
            // Cubic bezier: junction → zone end. Gently curve out.
            const dx = end.x - JUNCTION.x;
            const cx1 = JUNCTION.x + dx * 0.55;
            const cy1 = JUNCTION.y;
            const cx2 = JUNCTION.x + dx * 0.35;
            const cy2 = end.y;
            const d = `M ${JUNCTION.x} ${JUNCTION.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${end.x - 22} ${end.y}`;

            return (
              <g key={z.kind}>
                <AnimatedFlowLine
                  d={d}
                  rate={z.flowRateLpm / 4}
                  minRate={0.3}
                  maxRate={5}
                  color={color}
                  active={z.flowRateLpm > 0.1}
                  strokeWidth={1.8}
                  label={`${z.flowRateLpm.toFixed(1)} L/min`}
                  labelAt={0.55}
                />
                {/* Zone endpoint disc */}
                <circle
                  cx={end.x}
                  cy={end.y}
                  r={9}
                  fill="var(--color-surface-2)"
                  stroke={color}
                  strokeWidth={1.4}
                />
                {leak && (
                  <motion.circle
                    cx={end.x}
                    cy={end.y}
                    r={14}
                    fill="none"
                    stroke="var(--color-danger)"
                    strokeWidth={1}
                    animate={{
                      r: [14, 22, 14],
                      opacity: [0.8, 0, 0.8],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Source label */}
        <Label
          x={SOURCE.x}
          y={SOURCE.y}
          offsetX={-12}
          offsetY={0}
          anchor="right"
          title="Main supply"
          detail={`${currentFlowLpm.toFixed(1)} L/min`}
          Icon={Droplet}
          tone="grid"
        />

        {/* Zone labels */}
        {zones.map((z) => {
          const p = ZONE_POS[z.kind];
          if (!p) return null;
          return (
            <Label
              key={z.kind}
              x={p.x}
              y={p.y}
              offsetX={14}
              offsetY={0}
              anchor="left"
              title={z.label}
              detail={
                z.leakDetected ? (
                  <span className="flex items-center gap-1 text-[var(--color-danger)]">
                    <AlertTriangle size={9} strokeWidth={1.6} />
                    <span>Leak · {z.flowRateLpm.toFixed(1)} L/min</span>
                  </span>
                ) : (
                  `${z.flowRateLpm.toFixed(1)} L/min`
                )
              }
              tone={z.leakDetected ? "danger" : "grid"}
            />
          );
        })}
      </div>
    </div>
  );
}

function Label({
  x,
  y,
  offsetX,
  offsetY,
  anchor,
  title,
  detail,
  tone,
  Icon,
}: {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  anchor: "left" | "right";
  title: string;
  detail: React.ReactNode;
  tone: "grid" | "danger";
  Icon?: typeof Droplet;
}) {
  const color = tone === "danger" ? "var(--color-danger)" : "var(--color-grid)";
  return (
    <div
      className="pointer-events-none absolute flex flex-col"
      style={{
        left: `${((x + offsetX) / W) * 100}%`,
        top: `${((y + offsetY) / H) * 100}%`,
        transform: `translate(${anchor === "left" ? "0" : "-100%"}, -50%)`,
      }}
    >
      <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        {Icon && <Icon size={10} strokeWidth={1.5} style={{ color }} />}
        {title}
      </span>
      <span className="font-mono text-[11px] tabular-nums" style={{ color }}>
        {detail}
      </span>
    </div>
  );
}
