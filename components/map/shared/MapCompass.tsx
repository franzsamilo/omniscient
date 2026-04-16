"use client";

import { cn } from "@/lib/utils/cn";

/**
 * Always-on compass — does not rotate with the map (CLAUDE.md §6.3).
 * Two concentric rings + N/E/S/W mono ticks + a single accent N arrow.
 */
type Props = {
  size?: number;
  className?: string;
};

export function MapCompass({ size = 56, className }: Props) {
  const s = size;
  const r1 = s * 0.42;
  const r2 = s * 0.34;
  const cx = s / 2;
  const cy = s / 2;

  return (
    <div className={cn("relative grid place-items-center", className)}>
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        className="text-[var(--color-fg-subtle)]"
        role="img"
        aria-label="Compass — north is up"
      >
        <circle cx={cx} cy={cy} r={r1} fill="none" stroke="currentColor" strokeWidth={0.8} opacity={0.5} />
        <circle cx={cx} cy={cy} r={r2} fill="none" stroke="currentColor" strokeWidth={0.6} opacity={0.35} />

        {/* tick marks */}
        {[0, 90, 180, 270].map((deg) => {
          const rad = (deg - 90) * (Math.PI / 180);
          const x1 = cx + Math.cos(rad) * (r1 - 4);
          const y1 = cy + Math.sin(rad) * (r1 - 4);
          const x2 = cx + Math.cos(rad) * (r1 + 2);
          const y2 = cy + Math.sin(rad) * (r1 + 2);
          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth={1}
              opacity={0.7}
            />
          );
        })}

        {/* N accent triangle */}
        <path
          d={`M ${cx} ${cy - r1 + 1} L ${cx - 4} ${cy - 6} L ${cx + 4} ${cy - 6} Z`}
          fill="var(--color-signal)"
        />

        {/* Cardinal letters */}
        {[
          { l: "N", x: cx, y: cy - r1 - 6, c: "var(--color-signal)" },
          { l: "E", x: cx + r1 + 6, y: cy + 1, c: "currentColor" },
          { l: "S", x: cx, y: cy + r1 + 10, c: "currentColor" },
          { l: "W", x: cx - r1 - 6, y: cy + 1, c: "currentColor" },
        ].map((t) => (
          <text
            key={t.l}
            x={t.x}
            y={t.y}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: "var(--font-mono), ui-monospace",
              fontSize: 8,
              letterSpacing: "0.18em",
              fill: t.c,
              fontWeight: 500,
            }}
          >
            {t.l}
          </text>
        ))}
      </svg>
    </div>
  );
}
