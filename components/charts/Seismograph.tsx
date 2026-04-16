"use client";

/**
 * Live seismograph trace (CLAUDE.md §6.8). A continuously scrolling SVG line.
 * When `agitated` is true, amplitude jumps for the drill cinematic.
 */

import { useEffect, useRef, useState } from "react";

type Props = {
  height?: number;
  agitated?: boolean;
};

const POINTS = 240;

export function Seismograph({ height = 120, agitated }: Props) {
  const [data, setData] = useState<number[]>(() => Array.from({ length: POINTS }, () => 0));
  const tRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      tRef.current += 0.04;
      const t = tRef.current;
      const amp = agitated ? 0.85 : 0.18;
      const noise = (Math.random() - 0.5) * (agitated ? 0.4 : 0.06);
      // Sum of two sines + noise — feels organic.
      const v =
        Math.sin(t * 1.2) * amp * 0.45 +
        Math.sin(t * 3.4 + 0.7) * amp * 0.35 +
        Math.sin(t * 6.1) * amp * 0.18 +
        noise;
      setData((prev) => {
        const next = prev.slice(1);
        next.push(Math.max(-1, Math.min(1, v)));
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [agitated]);

  const W = 800;
  const H = height;
  const stepX = W / (POINTS - 1);
  const half = H / 2;
  const d =
    "M " +
    data
      .map((v, i) => `${(i * stepX).toFixed(1)} ${(half - v * half * 0.85).toFixed(1)}`)
      .join(" L ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width="100%"
      height={H}
      className="block"
      role="img"
      aria-label="Seismic trace"
    >
      {/* baseline */}
      <line
        x1={0}
        y1={half}
        x2={W}
        y2={half}
        stroke="var(--color-border)"
        strokeOpacity={0.6}
        strokeDasharray="4 4"
      />

      {/* "danger" envelope */}
      <line x1={0} y1={H * 0.18} x2={W} y2={H * 0.18} stroke="var(--color-danger)" strokeOpacity={0.4} strokeDasharray="2 4" />
      <line x1={0} y1={H * 0.82} x2={W} y2={H * 0.82} stroke="var(--color-danger)" strokeOpacity={0.4} strokeDasharray="2 4" />

      <path
        d={d}
        fill="none"
        stroke={agitated ? "var(--color-danger)" : "var(--color-signal)"}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: agitated ? "drop-shadow(0 0 6px var(--color-danger))" : undefined,
          transition: "stroke 200ms",
        }}
      />
    </svg>
  );
}
