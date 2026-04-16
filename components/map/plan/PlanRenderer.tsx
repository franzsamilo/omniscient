"use client";

import { useEffect, useRef, useState } from "react";
import type { Building } from "@/lib/mock/buildings";
import { OmniscientEye } from "@/components/icons/Omniscient";
import { BuildingsLayer } from "./BuildingsLayer";
import { FieldsLayer } from "./FieldsLayer";
import { StreetsLayer } from "./StreetsLayer";
import { FlagsLayer } from "./FlagsLayer";
import { LabelsLayer } from "./LabelsLayer";

type LayerKind = "heatmap" | "occupancy" | "water" | "flags-only" | "clean";

type Props = {
  hoveredId: number | null;
  selectedId: number | null;
  flagged: Set<number>;
  intensity: Record<number, number>;
  layer: LayerKind;
  /** Current zoom — controlled externally (1.0 = fit). */
  zoom?: number;
  /** Aspect for the source extent (865×720 native). */
  aspect?: number;
  onHover: (b: Building | null, evt?: React.MouseEvent) => void;
  onSelect?: (b: Building) => void;
  /** Show the small Eye watermark in the bottom-right (CLAUDE.md §4.8). */
  watermark?: boolean;
};

export function PlanRenderer({
  hoveredId,
  selectedId,
  flagged,
  intensity,
  layer,
  zoom = 1,
  aspect = 865 / 720,
  onHover,
  onSelect,
  watermark,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // Resize observer to keep SVG mapped to its container.
  useEffect(() => {
    if (!wrapRef.current) return;
    const el = wrapRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cw = entry.contentRect.width;
        const ch = entry.contentRect.height;
        const cAspect = cw / ch;
        let w = cw;
        let h = ch;
        if (cAspect > aspect) {
          w = ch * aspect;
        } else {
          h = cw / aspect;
        }
        setSize({ w, h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  return (
    <div
      ref={wrapRef}
      className="relative grid h-full w-full place-items-center"
      onMouseLeave={() => onHover(null)}
    >
      {size.w > 0 && (
        <svg
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: "visible", display: "block" }}
        >
          {/* faint inner frame */}
          <rect
            x={0.5}
            y={0.5}
            width={size.w - 1}
            height={size.h - 1}
            fill="transparent"
            stroke="var(--color-border)"
            strokeWidth={1}
          />

          <FieldsLayer width={size.w} height={size.h} />
          <StreetsLayer width={size.w} height={size.h} />
          <BuildingsLayer
            width={size.w}
            height={size.h}
            hoveredId={hoveredId}
            selectedId={selectedId}
            flagged={flagged}
            intensity={intensity}
            layer={layer}
            onHover={(b) => onHover(b)}
            onSelect={onSelect}
          />
          <FlagsLayer width={size.w} height={size.h} flagged={flagged} />
          <LabelsLayer width={size.w} height={size.h} zoom={zoom} />
        </svg>
      )}

      {watermark && (
        <div
          className="pointer-events-none absolute bottom-3 right-3 text-[var(--color-signal)]"
          style={{ opacity: 0.06 }}
          aria-hidden
        >
          <OmniscientEye size={160} scanning={false} />
        </div>
      )}
    </div>
  );
}
