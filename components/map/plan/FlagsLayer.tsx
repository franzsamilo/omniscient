"use client";

import { motion } from "motion/react";
import { MAPPED_BUILDINGS } from "@/lib/mock/buildings";
import { centroid } from "@/components/map/utils/polygon";

type Props = {
  width: number;
  height: number;
  flagged: Set<number>;
};

export function FlagsLayer({ width, height, flagged }: Props) {
  return (
    <g className="omni-flags-layer" pointerEvents="none">
      {MAPPED_BUILDINGS.filter((b) => flagged.has(b.id)).map((b) => {
        const [cx, cy] = centroid(b.polygon);
        const x = cx * width;
        const y = cy * height;
        return (
          <g key={b.id} transform={`translate(${x},${y})`}>
            {/* outer halo (pulses scale + opacity) */}
            <motion.circle
              r={10}
              fill="var(--color-danger)"
              fillOpacity={0.18}
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* core dot */}
            <motion.circle
              r={4}
              fill="var(--color-danger)"
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* outline ring */}
            <circle r={4} fill="none" stroke="var(--color-danger)" strokeWidth={1.2} />
          </g>
        );
      })}
    </g>
  );
}
