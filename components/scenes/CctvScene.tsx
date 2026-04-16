"use client";

/**
 * CCTV-style scene tile (CLAUDE.md §6.7).
 * No video — CSS-generated dot "people" wandering inside the frame, with
 * jittering SVG bounding boxes drawn over them.
 *
 * Performance notes:
 *  - People positions live in a ref + RAF loop. We only push a React state
 *    update at ~12fps so 12 tiles together stay well below the main-thread
 *    budget (an earlier version updated state every frame and froze the
 *    /activity tab).
 *  - Bounding boxes are derived inline from the same ref each React tick —
 *    no separate state, no separate interval.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import seedrandom from "seedrandom";
import { SEED } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

type Person = {
  id: number;
  x: number; // 0..1
  y: number; // 0..1
  vx: number;
  vy: number;
  jitter: number;
};

type Box = { x: number; y: number; w: number; h: number };

type Props = {
  seed: string;
  detectedCount: number;
  status?: "OCCUPIED" | "EMPTY" | "ANOMALY";
  liveBadge?: boolean;
};

const STATE_TICK_MS = 80; // ~12 fps React updates

export function CctvScene({ seed, detectedCount, status = "OCCUPIED", liveBadge }: Props) {
  const rng = useMemo(() => seedrandom(`${SEED}:cctv:${seed}`), [seed]);

  // People state lives in a ref — mutated every RAF tick.
  const peopleRef = useRef<Person[]>(
    Array.from({ length: detectedCount }, (_, i) => ({
      id: i,
      x: rng(),
      y: 0.3 + rng() * 0.6,
      vx: (rng() - 0.5) * 0.005,
      vy: (rng() - 0.5) * 0.0035,
      jitter: rng(),
    })),
  );

  // Lightweight bump counter — re-renders ~12fps so React paints positions.
  const [, setTick] = useState(0);

  // Jitter offset for bounding boxes — updates every 1.5s for the "live feed" feel.
  const [jitterSeed, setJitterSeed] = useState(0);

  useEffect(() => {
    let raf = 0;
    let lastFlush = performance.now();
    const tick = () => {
      const now = performance.now();
      // Mutate in place — no React update yet.
      const arr = peopleRef.current;
      for (let i = 0; i < arr.length; i++) {
        const p = arr[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0.05 || p.x > 0.95) p.vx = -p.vx;
        if (p.y < 0.25 || p.y > 0.92) p.vy = -p.vy;
        p.x = Math.max(0.05, Math.min(0.95, p.x));
        p.y = Math.max(0.25, Math.min(0.92, p.y));
      }
      // Throttled state push so React only re-renders ~12fps.
      if (now - lastFlush > STATE_TICK_MS) {
        lastFlush = now;
        setTick((t) => (t + 1) % 1024);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const jitterId = window.setInterval(() => setJitterSeed((s) => s + 1), 1500);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(jitterId);
    };
  }, []);

  // Boxes derived from current people positions on every render.
  const boxes: Box[] = peopleRef.current.map((p) => {
    // Use jitterSeed mixed with the person's stable jitter to perturb size.
    const wj = 0.04 + ((p.jitter * 7919 + jitterSeed * 0.7) % 1) * 0.02;
    const hj = 0.07 + ((p.jitter * 6151 + jitterSeed * 1.3) % 1) * 0.03;
    return { x: p.x - wj / 2, y: p.y - hj * 0.8, w: wj, h: hj };
  });

  const statusTone =
    status === "ANOMALY"
      ? "var(--color-danger)"
      : status === "OCCUPIED"
        ? "var(--color-signal)"
        : "var(--color-fg-subtle)";

  return (
    <div
      className={cn(
        "relative aspect-video overflow-hidden rounded-[var(--radius-sm)] border",
        "bg-gradient-to-b from-[#0f1218] via-[#0a0d12] to-[#06080c]",
      )}
      style={{ borderColor: "var(--color-border)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 right-0 top-1/3 h-px"
        style={{ background: "color-mix(in oklch, var(--color-border) 60%, transparent)" }}
      />

      {/* Floor grid */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-hidden
      >
        {Array.from({ length: 10 }, (_, i) => {
          const t = i / 9;
          const yT = 0.34 + t * 0.62;
          const x0 = 0.5 - 0.7 * t;
          const x1 = 0.5 + 0.7 * t;
          return (
            <line
              key={`h-${i}`}
              x1={x0}
              y1={yT}
              x2={x1}
              y2={yT}
              stroke="var(--color-border)"
              strokeWidth={0.001 + t * 0.001}
              strokeOpacity={0.3 + t * 0.3}
            />
          );
        })}
        {Array.from({ length: 9 }, (_, i) => {
          const t = (i - 4) / 4;
          return (
            <line
              key={`v-${i}`}
              x1={0.5 + t * 0.4}
              y1={0.34}
              x2={0.5 + t * 1.2}
              y2={0.96}
              stroke="var(--color-border)"
              strokeWidth={0.001}
              strokeOpacity={0.3}
            />
          );
        })}
      </svg>

      {/* People */}
      {peopleRef.current.map((p) => (
        <span
          key={p.id}
          className="absolute size-1.5 rounded-full bg-[var(--color-fg)]"
          style={{
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            transform: "translate(-50%, -50%)",
            boxShadow: "0 6px 8px -3px rgba(0,0,0,0.7)",
          }}
        />
      ))}

      {/* Bounding boxes — derived inline */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden>
        {boxes.map((b, i) => (
          <g key={i}>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              fill="none"
              stroke={statusTone}
              strokeWidth={0.0035}
              opacity={0.85}
            />
            <line x1={b.x} y1={b.y} x2={b.x + 0.012} y2={b.y} stroke={statusTone} strokeWidth={0.006} />
            <line x1={b.x} y1={b.y} x2={b.x} y2={b.y + 0.012} stroke={statusTone} strokeWidth={0.006} />
          </g>
        ))}
      </svg>

      {liveBadge && (
        <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-danger)]">
          <span className="size-1.5 rounded-full bg-[var(--color-danger)] animate-[pulse_1.2s_ease-in-out_infinite]" />
          REC
        </div>
      )}

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(255,255,255,0.014) 2px, rgba(255,255,255,0.014) 3px)",
        }}
      />
    </div>
  );
}
