"use client";

/**
 * Radial gauge — solar vs grid mix at this moment (CLAUDE.md §6.5).
 * Custom SVG, animated needle, no Recharts.
 */

import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** 0..1 — share of total demand currently met by solar. */
  solarShare: number;
  size?: number;
  className?: string;
  /** Optional center label (number) and units. */
  centerValue?: string;
  centerUnit?: string;
};

const ARC_START = -210; // degrees (left)
const ARC_END = 30; // degrees (right) — sweep is 240°

function polarToCart(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg - 90) * (Math.PI / 180);
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const [x1, y1] = polarToCart(cx, cy, r, startDeg);
  const [x2, y2] = polarToCart(cx, cy, r, endDeg);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`;
}

export function RadialGauge({ solarShare, size = 240, className, centerValue, centerUnit }: Props) {
  const id = useId();
  const cx = size / 2;
  const cy = size / 2 + size * 0.05;
  const r = size * 0.4;
  const totalSweep = ARC_END - ARC_START;
  const split = ARC_START + totalSweep * Math.max(0, Math.min(1, solarShare));

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("text-[var(--color-fg-subtle)]", className)}
      role="img"
      aria-label={`Solar share ${(solarShare * 100).toFixed(0)} percent`}
    >
      <defs>
        <linearGradient id={`solar-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-solar)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--color-solar)" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={`grid-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-grid)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--color-grid)" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Track (background arc) */}
      <path
        d={arcPath(cx, cy, r, ARC_START, ARC_END)}
        fill="none"
        stroke="var(--color-surface-3)"
        strokeWidth={size * 0.045}
        strokeLinecap="butt"
      />

      {/* Solar segment */}
      <motion.path
        d={arcPath(cx, cy, r, ARC_START, split)}
        fill="none"
        stroke={`url(#solar-${id})`}
        strokeWidth={size * 0.045}
        strokeLinecap="butt"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Grid segment */}
      <motion.path
        d={arcPath(cx, cy, r, split, ARC_END)}
        fill="none"
        stroke={`url(#grid-${id})`}
        strokeWidth={size * 0.045}
        strokeLinecap="butt"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.72, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Tick marks every 10% */}
      {Array.from({ length: 11 }, (_, i) => {
        const t = i / 10;
        const deg = ARC_START + totalSweep * t;
        const inner = r - size * 0.025;
        const outer = r + size * 0.04;
        const [x1, y1] = polarToCart(cx, cy, inner, deg);
        const [x2, y2] = polarToCart(cx, cy, outer, deg);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="var(--color-border-strong)"
            strokeWidth={i % 5 === 0 ? 1.5 : 0.6}
          />
        );
      })}

      {/* Needle */}
      <motion.g
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        initial={{ rotate: ARC_START - 90 }}
        animate={{ rotate: split - 90 }}
        transition={{ duration: 0.92, ease: [0.22, 1, 0.36, 1] }}
      >
        <line
          x1={cx}
          y1={cy}
          x2={cx + r * 0.85}
          y2={cy}
          stroke="var(--color-signal)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={size * 0.025} fill="var(--color-signal)" />
        <circle cx={cx} cy={cy} r={size * 0.06} fill="none" stroke="var(--color-signal)" strokeWidth={0.8} opacity={0.5} />
      </motion.g>

      {/* Caps */}
      <text
        x={polarToCart(cx, cy, r + size * 0.075, ARC_START)[0]}
        y={polarToCart(cx, cy, r + size * 0.075, ARC_START)[1]}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: size * 0.038,
          letterSpacing: "0.18em",
          fill: "var(--color-solar)",
        }}
      >
        SOLAR
      </text>
      <text
        x={polarToCart(cx, cy, r + size * 0.075, ARC_END)[0]}
        y={polarToCart(cx, cy, r + size * 0.075, ARC_END)[1]}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: size * 0.038,
          letterSpacing: "0.18em",
          fill: "var(--color-grid)",
        }}
      >
        GRID
      </text>

      {/* Center value */}
      {(centerValue || centerUnit) && (
        <g>
          <text
            x={cx}
            y={cy + size * 0.16}
            textAnchor="middle"
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontSize: size * 0.22,
              fill: "var(--color-fg)",
            }}
            className="tabular-nums"
          >
            {centerValue}
          </text>
          {centerUnit && (
            <text
              x={cx}
              y={cy + size * 0.28}
              textAnchor="middle"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: size * 0.04,
                letterSpacing: "0.22em",
                fill: "var(--color-fg-subtle)",
              }}
            >
              {centerUnit}
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
