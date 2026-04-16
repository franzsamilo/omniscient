"use client";

/**
 * SolarPanelStatus — CLAUDE-UPDATES PATCH 1 §1.1 Row 3 Card 2.
 *
 * Left column: SVG illustration of a tilted solar panel with animated rays
 * (or a moon crescent at night). Right column: 4 status fields
 * (tilt · cleaning cycle · last cleaned · efficiency).
 */

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** Hour of day 0–23 (used to decide day/night). */
  hourPht: number;
  /** Current panel tilt in degrees. */
  tiltDeg?: number;
  /** Cleaning cycle progress 0..1 (1 = next clean due now). */
  cleaningProgress?: number;
  lastCleanedText?: string;
  /** Efficiency 0..1. */
  efficiency?: number;
  efficiencyDelta?: number;
  className?: string;
};

export function SolarPanelStatus({
  hourPht,
  tiltDeg = 28,
  cleaningProgress = 0.64,
  lastCleanedText = "14 Apr · 04:12",
  efficiency = 0.94,
  efficiencyDelta = 0.041,
  className,
}: Props) {
  const isDay = hourPht >= 6 && hourPht < 18;

  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-stretch", className)}>
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden",
          "rounded-[var(--radius-sm)] border px-4 py-4 md:w-[168px]",
          "bg-[color-mix(in_oklch,var(--color-surface-2)_60%,transparent)]",
        )}
        style={{ borderColor: "var(--color-border)" }}
      >
        <PanelSvg day={isDay} tiltDeg={tiltDeg} />
        <span
          className={cn(
            "absolute bottom-2 right-2 font-mono text-[9px] uppercase tracking-[0.22em]",
            "text-[var(--color-fg-subtle)]",
          )}
        >
          {isDay ? "Tracking" : "Idle"}
        </span>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-3">
        <Field
          label="Panel tilt"
          value={`${tiltDeg}°`}
          caption="Tracker · auto"
          accent="var(--color-solar)"
        />
        <RingField
          label="Cleaning cycle"
          progress={cleaningProgress}
          caption="Next pass · 18:30"
          accent="var(--color-signal)"
        />
        <Field
          label="Last cleaned"
          value={lastCleanedText}
          caption="By · roof bot 02"
          mono
          accent="var(--color-fg-muted)"
        />
        <Field
          label="Efficiency"
          value={`${(efficiency * 100).toFixed(1)}%`}
          caption={
            <span className="flex items-center gap-1">
              <span
                style={{
                  color:
                    efficiencyDelta >= 0
                      ? "var(--color-ok)"
                      : "var(--color-danger)",
                }}
              >
                {efficiencyDelta >= 0 ? "▲" : "▼"}{" "}
                {(Math.abs(efficiencyDelta) * 100).toFixed(1)}%
              </span>
              <span>vs yesterday</span>
            </span>
          }
          accent="var(--color-ok)"
        />
      </div>
    </div>
  );
}

function PanelSvg({ day, tiltDeg }: { day: boolean; tiltDeg: number }) {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      if (now - last > 50) {
        last = now;
        setFrame((f) => (f + 0.008) % 1);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  return (
    <svg width={140} height={130} viewBox="0 0 140 130" aria-hidden>
      {/* Sun / moon up top */}
      <g transform={`translate(88, 26)`}>
        {day ? (
          <>
            {/* Sun core */}
            <circle r={10} fill="var(--color-solar)" opacity={0.9} />
            <circle r={14} fill="none" stroke="var(--color-solar)" strokeOpacity={0.35} strokeWidth={1} />
            {/* Rotating rays — coordinates rounded so SSR/CSR string
                representations match (raw `Math.sin * r` produced different
                last-digit precision on server vs client, breaking hydration). */}
            <g transform={`rotate(${(frame * 360).toFixed(2)})`}>
              {Array.from({ length: 6 }).map((_, i) => {
                const a = (i * 60 * Math.PI) / 180;
                const r = (v: number) => Number(v.toFixed(2));
                return (
                  <line
                    key={i}
                    x1={r(Math.cos(a) * 18)}
                    y1={r(Math.sin(a) * 18)}
                    x2={r(Math.cos(a) * 28)}
                    y2={r(Math.sin(a) * 28)}
                    stroke="var(--color-solar)"
                    strokeOpacity={0.8}
                    strokeWidth={1.4}
                    strokeLinecap="round"
                  />
                );
              })}
            </g>
          </>
        ) : (
          // Crescent moon
          <g opacity={0.32}>
            <circle r={10} fill="var(--color-fg-muted)" />
            <circle r={9} cx={4} cy={-2} fill="var(--color-bg)" />
          </g>
        )}
      </g>

      {/* Rooftop base */}
      <path
        d="M 10 108 L 130 108"
        stroke="var(--color-border-strong)"
        strokeWidth={1.5}
      />

      {/* Panel — rendered as a quadrilateral that looks tilted. */}
      <PanelQuad tiltDeg={tiltDeg} />
    </svg>
  );
}

function PanelQuad({ tiltDeg }: { tiltDeg: number }) {
  // Tilt changes top width slightly to suggest perspective.
  const t = Math.max(0, Math.min(60, tiltDeg)) / 60;
  const topInset = 6 + t * 10;
  const topLeftX = 24 + topInset;
  const topRightX = 112 - topInset;
  const topY = 58 - t * 8;
  const botLeftX = 18;
  const botRightX = 118;
  const botY = 104;

  // Panel grid — 6 cells (3 wide x 2 tall).
  const cells = useMemo(() => {
    const out: string[] = [];
    const rows = 2;
    const cols = 3;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const t0 = c / cols;
        const t1 = (c + 1) / cols;
        const u0 = r / rows;
        const u1 = (r + 1) / rows;
        const p1 = lerpQuad(topLeftX, topY, topRightX, topY, botRightX, botY, botLeftX, botY, t0, u0);
        const p2 = lerpQuad(topLeftX, topY, topRightX, topY, botRightX, botY, botLeftX, botY, t1, u0);
        const p3 = lerpQuad(topLeftX, topY, topRightX, topY, botRightX, botY, botLeftX, botY, t1, u1);
        const p4 = lerpQuad(topLeftX, topY, topRightX, topY, botRightX, botY, botLeftX, botY, t0, u1);
        out.push(`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]} L ${p4[0]} ${p4[1]} Z`);
      }
    }
    return out;
  }, [topLeftX, topRightX, topY]);

  return (
    <g>
      {/* Panel frame (fills the whole trapezoid) */}
      <path
        d={`M ${topLeftX} ${topY} L ${topRightX} ${topY} L ${botRightX} ${botY} L ${botLeftX} ${botY} Z`}
        fill="color-mix(in oklch, var(--color-grid) 40%, var(--color-surface-3))"
        stroke="var(--color-border-strong)"
        strokeWidth={1.2}
      />
      {/* Mullions (cell outlines) */}
      {cells.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="color-mix(in oklch, var(--color-grid) 35%, var(--color-surface-2))"
          stroke="var(--color-border)"
          strokeWidth={0.7}
        />
      ))}
      {/* Stand leg */}
      <path
        d={`M ${botLeftX + 10} ${botY} L ${botLeftX + 10} 112 M ${botRightX - 10} ${botY} L ${botRightX - 10} 112`}
        stroke="var(--color-border-strong)"
        strokeWidth={1.2}
      />
    </g>
  );
}

function lerpQuad(
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  x4: number, y4: number,
  u: number, v: number,
): [number, number] {
  const ax = x1 + (x2 - x1) * u;
  const ay = y1 + (y2 - y1) * u;
  const bx = x4 + (x3 - x4) * u;
  const by = y4 + (y3 - y4) * u;
  return [ax + (bx - ax) * v, ay + (by - ay) * v];
}

function Field({
  label,
  value,
  caption,
  accent,
  mono,
}: {
  label: string;
  value: string;
  caption: React.ReactNode;
  accent: string;
  mono?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-[var(--radius-sm)] border px-3 py-2.5"
      style={{ borderColor: "var(--color-border)" }}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        {label}
      </p>
      <p
        className={cn(
          "text-[var(--color-fg)] tabular-nums",
          mono ? "font-mono text-[12px]" : "font-medium text-[15px]",
        )}
        style={{ color: mono ? undefined : accent }}
      >
        {value}
      </p>
      <p className="text-[10px] text-[var(--color-fg-muted)]">{caption}</p>
    </div>
  );
}

function RingField({
  label,
  progress,
  caption,
  accent,
}: {
  label: string;
  progress: number;
  caption: string;
  accent: string;
}) {
  const SIZE = 44;
  const r = 17;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="flex items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2.5"
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="relative grid shrink-0 place-items-center">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={2.5} />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            fill="none"
            stroke={accent}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - progress) }}
            transition={{ duration: 0.92, ease: [0.22, 1, 0.36, 1] }}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <span className="absolute font-mono text-[9px] tabular-nums text-[var(--color-fg)]">
          {Math.round(progress * 100)}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          {label}
        </p>
        <p className="mt-0.5 text-[10px] text-[var(--color-fg-muted)]">{caption}</p>
      </div>
    </div>
  );
}
