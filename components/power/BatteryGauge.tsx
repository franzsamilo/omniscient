"use client";

/**
 * BatteryGauge — CLAUDE-UPDATES PATCH 1 §1.1 Row 3 Card 1.
 *
 * A vertical battery with an animated liquid fill. The fill height
 * animates in from 0 → SOC on mount (720ms, expo-out). The surface
 * of the fill is a sine-wave path whose phase shifts over ~3s —
 * subtle, so the gauge reads as *liquid*, not *animated chart*.
 *
 * Color bands: ok (>30%), warn (15–30%), danger (<15%).
 */

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils/cn";

type BatteryStatus = "charging" | "discharging" | "idle" | "full" | "low";

type Props = {
  /** State of charge 0..1. */
  soc: number;
  /** Total pack capacity in kWh for the caption. */
  capacityKwh: number;
  /** kW flowing into (+) or out of (-) the battery right now. */
  kw: number;
  /** 24h SOC samples (0..1) for the mini bar chart. 24 values expected. */
  hourly?: number[];
  className?: string;
};

const WIDTH = 132;
const HEIGHT = 210;
const BODY_X = 14;
const BODY_Y = 22;
const BODY_W = WIDTH - BODY_X * 2;
const BODY_H = HEIGHT - BODY_Y - 14;
const CAP_W = 52;
const CAP_H = 10;

export function BatteryGauge({ soc, capacityKwh, kw, hourly, className }: Props) {
  const reduced = useReducedMotion();
  const status: BatteryStatus = useMemo(() => {
    if (soc >= 0.99) return "full";
    if (soc < 0.15) return "low";
    if (kw > 0.2) return "charging";
    if (kw < -0.2) return "discharging";
    return "idle";
  }, [soc, kw]);

  // Color for the fill — graded by SOC band.
  const fillTone = soc < 0.15 ? "danger" : soc < 0.3 ? "warn" : "ok";
  const fillColor =
    fillTone === "danger"
      ? "var(--color-danger)"
      : fillTone === "warn"
        ? "var(--color-warn)"
        : "var(--color-ok)";

  // Drive the wave phase with a tiny internal timer — cheap, doesn't re-render
  // every frame because motion animates the transform.
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        <svg
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          aria-label={`Battery ${Math.round(soc * 100)} percent`}
        >
          {/* Cap */}
          <rect
            x={(WIDTH - CAP_W) / 2}
            y={6}
            width={CAP_W}
            height={CAP_H}
            rx={2.5}
            fill="var(--color-surface-3)"
            stroke="var(--color-border-strong)"
            strokeWidth={1.4}
          />

          {/* Body outline */}
          <rect
            x={BODY_X}
            y={BODY_Y}
            width={BODY_W}
            height={BODY_H}
            rx={14}
            fill="var(--color-surface-2)"
            stroke="var(--color-border-strong)"
            strokeWidth={1.6}
          />

          {/* Clipped fill */}
          <defs>
            <clipPath id="battery-body-clip">
              <rect
                x={BODY_X + 2}
                y={BODY_Y + 2}
                width={BODY_W - 4}
                height={BODY_H - 4}
                rx={12}
              />
            </clipPath>
            <linearGradient id="battery-fill-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.92" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0.55" />
            </linearGradient>
          </defs>

          <g clipPath="url(#battery-body-clip)">
            <LiquidFill soc={soc} reduced={!!reduced} />
          </g>

          {/* Tick marks (20 / 40 / 60 / 80 %) */}
          {[0.2, 0.4, 0.6, 0.8].map((t) => (
            <line
              key={t}
              x1={BODY_X + 6}
              x2={BODY_X + 14}
              y1={BODY_Y + (1 - t) * BODY_H}
              y2={BODY_Y + (1 - t) * BODY_H}
              stroke="var(--color-border)"
              strokeWidth={1}
            />
          ))}
        </svg>

        {/* Centered percent */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center">
            <span
              className="font-serif italic leading-none text-[var(--color-fg)]"
              style={{ fontSize: "48px" }}
            >
              {Math.round(soc * 100)}
            </span>
            <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--color-fg-muted)]">
              %
            </span>
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="flex flex-col items-center gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-fg-subtle)] tabular-nums">
          {capacityKwh.toFixed(0)} kWh · capacity
        </p>
        <StatusPill status={status} kw={kw} />
      </div>

      {/* 24h mini bars */}
      {hourly && hourly.length > 0 && (
        <div className="mt-1 flex h-10 w-full items-end gap-[2px]">
          {hourly.map((v, i) => (
            <motion.span
              key={i}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: Math.max(0.04, v) }}
              transition={{
                duration: 0.42,
                delay: i * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex-1 origin-bottom rounded-[1px]"
              style={{
                backgroundColor:
                  v < 0.15
                    ? "var(--color-danger)"
                    : v < 0.3
                      ? "var(--color-warn)"
                      : "var(--color-ok)",
                opacity: 0.6,
                minHeight: 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Animated liquid — the top edge is a sine wave whose phase shifts over ~3s.
 * We redraw the path at 20 fps using a transform/rAF-driven state update.
 */
function LiquidFill({ soc, reduced }: { soc: number; reduced: boolean }) {
  const AMPLITUDE = 2;
  const STEPS = 24;

  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    // Keep this cheap — update ~20x/sec. The wave is subtle by design.
    const tick = (now: number) => {
      if (now - last > 50) {
        last = now;
        setPhase((p) => (p + 0.06) % 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const fillH = Math.max(0, Math.min(1, soc)) * (BODY_H - 4);
  const topY = BODY_Y + 2 + (BODY_H - 4) - fillH;

  // Build a wavy top-edge path.
  const d = useMemo(() => {
    const x0 = BODY_X + 2;
    const x1 = BODY_X + BODY_W - 2;
    const width = x1 - x0;
    const points: string[] = [];
    for (let i = 0; i <= STEPS; i++) {
      const t = i / STEPS;
      const x = x0 + t * width;
      const y = topY + Math.sin((t + phase) * Math.PI * 2) * AMPLITUDE;
      points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    const bottomY = BODY_Y + BODY_H - 2;
    points.push(`L ${x1.toFixed(2)} ${bottomY.toFixed(2)}`);
    points.push(`L ${x0.toFixed(2)} ${bottomY.toFixed(2)}`);
    points.push("Z");
    return points.join(" ");
  }, [topY, phase]);

  return (
    <motion.path
      d={d}
      fill="url(#battery-fill-gradient)"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

function StatusPill({ status, kw }: { status: BatteryStatus; kw: number }) {
  const TONE: Record<BatteryStatus, { bg: string; fg: string; label: string }> = {
    charging: { bg: "var(--color-ok)", fg: "var(--color-bg)", label: "charging" },
    discharging: { bg: "var(--color-warn)", fg: "var(--color-bg)", label: "discharging" },
    idle: { bg: "var(--color-surface-3)", fg: "var(--color-fg-muted)", label: "idle" },
    full: { bg: "var(--color-ok)", fg: "var(--color-bg)", label: "full" },
    low: { bg: "var(--color-danger)", fg: "var(--color-bg)", label: "low" },
  };
  const t = TONE[status];
  return (
    <div className="flex items-center gap-2">
      <span
        className="rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em]"
        style={{
          backgroundColor: t.bg,
          color: t.fg,
          borderColor: "transparent",
        }}
      >
        {t.label}
      </span>
      <span className="font-mono text-[11px] tabular-nums text-[var(--color-fg-muted)]">
        {kw > 0 ? "+" : ""}
        {kw.toFixed(1)} kW
      </span>
    </div>
  );
}
