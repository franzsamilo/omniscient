"use client";

/**
 * Tiny sparkline. Inline SVG, no Recharts overhead.
 * Draws a smooth area fill + line in a token color.
 */

import { useId, useMemo } from "react";
import { motion } from "motion/react";

type Props = {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  /** Animate the line drawing in on mount. */
  animateIn?: boolean;
};

export function Sparkline({
  values,
  width = 88,
  height = 28,
  stroke = "var(--color-signal)",
  fill = "color-mix(in oklch, var(--color-signal) 18%, transparent)",
  animateIn = true,
}: Props) {
  const id = useId();
  const { d, area } = useMemo(() => {
    if (values.length === 0) return { d: "", area: "" };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(1e-9, max - min);
    const stepX = width / Math.max(1, values.length - 1);
    const ys = values.map((v) => height - ((v - min) / span) * height);

    const pts = values.map((_, i) => [i * stepX, ys[i]] as [number, number]);
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const [x, y] = pts[i];
      const [px, py] = pts[i - 1];
      const cx = (px + x) / 2;
      d += ` Q ${px.toFixed(1)} ${py.toFixed(1)} ${cx.toFixed(1)} ${((py + y) / 2).toFixed(1)}`;
    }
    d += ` T ${pts[pts.length - 1][0].toFixed(1)} ${pts[pts.length - 1][1].toFixed(1)}`;
    const area = `${d} L ${width} ${height} L 0 ${height} Z`;
    return { d, area };
  }, [values, width, height]);

  if (!d) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block" }}
      aria-hidden
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={fill} />
      <motion.path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={animateIn ? { pathLength: 0, opacity: 0 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
