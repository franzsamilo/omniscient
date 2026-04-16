"use client";

import { motion } from "motion/react";
import { MAPPED_BUILDINGS, type Building } from "@/lib/mock/buildings";
import { toPathD } from "@/components/map/utils/polygon";
import { cn } from "@/lib/utils/cn";

type Props = {
  width: number;
  height: number;
  hoveredId: number | null;
  selectedId: number | null;
  flagged: Set<number>;
  intensity: Record<number, number>;
  layer: "heatmap" | "occupancy" | "water" | "flags-only" | "clean";
  onHover: (b: Building | null) => void;
  onSelect?: (b: Building) => void;
};

/** Map intensity 0..1 → fill color along the heatmap ramp. */
function heatmapFill(intensity: number): string {
  // Cool → warm → hot. We blend in oklch for perceptual smoothness.
  if (intensity < 0.25) return "var(--color-surface-3)";
  const stops: Array<[number, string]> = [
    [0.25, "color-mix(in oklch, var(--color-surface-3) 70%, var(--color-grid))"],
    [0.5, "color-mix(in oklch, var(--color-surface-3) 45%, var(--color-warn))"],
    [0.75, "color-mix(in oklch, var(--color-surface-3) 25%, var(--color-warn))"],
    [1.0, "color-mix(in oklch, var(--color-surface-3) 10%, var(--color-danger))"],
  ];
  for (const [t, color] of stops) if (intensity <= t) return color;
  return "color-mix(in oklch, var(--color-surface-3) 5%, var(--color-danger))";
}

export function BuildingsLayer({
  width,
  height,
  hoveredId,
  selectedId,
  flagged,
  intensity,
  layer,
  onHover,
  onSelect,
}: Props) {
  return (
    <g className="omni-buildings-layer">
      {MAPPED_BUILDINGS.map((b, i) => {
        const d = toPathD(b.polygon, width, height);
        const isHover = hoveredId === b.id;
        const isSelected = selectedId === b.id;
        const isFlagged = flagged.has(b.id);
        const intens = intensity[b.id] ?? 0;

        let fill = "var(--color-surface-3)";
        let strokeOpacity = 0.7;

        if (layer === "heatmap") {
          fill = heatmapFill(intens);
          strokeOpacity = 0.55;
        } else if (layer === "occupancy") {
          fill = `color-mix(in oklch, var(--color-surface-3) ${100 - intens * 60}%, var(--color-signal))`;
          strokeOpacity = 0.45;
        } else if (layer === "water") {
          fill = `color-mix(in oklch, var(--color-surface-3) ${100 - intens * 50}%, var(--color-grid))`;
          strokeOpacity = 0.5;
        } else if (layer === "flags-only") {
          fill = isFlagged ? "color-mix(in oklch, var(--color-surface-3) 60%, var(--color-danger))" : "var(--color-surface-3)";
        }

        if (isHover) {
          fill = "color-mix(in oklch, var(--color-surface-3) 70%, var(--color-signal))";
          strokeOpacity = 1;
        }

        return (
          <motion.path
            key={b.id}
            d={d}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.42,
              delay: Math.min(0.6, i * 0.008),
              ease: [0.22, 1, 0.36, 1],
            }}
            fill={fill}
            stroke={isHover || isSelected ? "var(--color-signal)" : "var(--color-border-strong)"}
            strokeWidth={isSelected ? 1.6 : 1}
            strokeOpacity={strokeOpacity}
            style={{
              filter: isHover
                ? "drop-shadow(0 0 8px var(--color-signal-glow))"
                : undefined,
              cursor: onSelect ? "pointer" : "default",
              transition: "stroke 200ms var(--ease-omni), stroke-width 200ms var(--ease-omni), filter 200ms var(--ease-omni)",
            }}
            onMouseEnter={() => onHover(b)}
            onMouseLeave={() => onHover(null)}
            onClick={onSelect ? () => onSelect(b) : undefined}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            aria-label={`Building ${b.id}: ${b.name}`}
            className={cn("transition-[transform] duration-200")}
          />
        );
      })}
    </g>
  );
}
