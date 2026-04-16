"use client";

import layout from "@/data/campus-layout.json";
import { toPathD } from "@/components/map/utils/polygon";

type Props = { width: number; height: number };

type Field = { points: number[][]; provisional_id: number };

export function FieldsLayer({ width, height }: Props) {
  const fields = ((layout.fields ?? []) as unknown as Field[])
    .map((f) => f.points.filter((p) => p.length >= 2).map((p) => [p[0], p[1]] as [number, number]))
    .filter((p) => p.length >= 3);

  return (
    <g className="omni-fields-layer" pointerEvents="none">
      {fields.map((poly, i) => (
        <path
          key={i}
          d={toPathD(poly, width, height)}
          fill="color-mix(in oklch, var(--color-ok) 14%, transparent)"
          stroke="color-mix(in oklch, var(--color-ok) 40%, transparent)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      ))}
    </g>
  );
}
