"use client";

import { MAPPED_BUILDINGS } from "@/lib/mock/buildings";
import { centroid, bbox } from "@/components/map/utils/polygon";
import { pad } from "@/lib/utils/format";

type Props = {
  width: number;
  height: number;
  /** Only show labels above this zoom level — keeps the map legible at far view. */
  zoom: number;
  /** Don't draw labels on tiny polygons. */
  minAreaPx?: number;
};

export function LabelsLayer({ width, height, zoom, minAreaPx = 240 }: Props) {
  if (zoom < 1.4) return null;
  return (
    <g className="omni-labels-layer" pointerEvents="none">
      {MAPPED_BUILDINGS.map((b) => {
        const bb = bbox(b.polygon);
        const px = bb.w * width;
        const py = bb.h * height;
        if (px * py < minAreaPx) return null;
        const [cx, cy] = centroid(b.polygon);
        return (
          <text
            key={b.id}
            x={cx * width}
            y={cy * height}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontFamily: "var(--font-mono), ui-monospace",
              fontSize: 8,
              letterSpacing: "0.08em",
              fill: "var(--color-fg-subtle)",
            }}
          >
            {pad(b.id)}
          </text>
        );
      })}
    </g>
  );
}
