"use client";

/**
 * Cursor-anchored HUD card (CLAUDE.md §8.6).
 * Always rendered in HTML overlay (not inside SVG/canvas) so typography stays crisp.
 */

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { Building } from "@/lib/mock/buildings";
import { Pill } from "@/components/primitives/Pill";
import { kw, peso, pad } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Props = {
  building: Building | null;
  /** Live intensity 0..1 for occupancy bar. */
  occupancy: number;
  /** Estimated current draw in kW. */
  currentKw: number;
  /** Today's running cost in PHP. */
  todayPhp: number;
  /** Building flagged? Affects status pill. */
  flagged: boolean;
  /** Bounding rect of the parent (for edge-flip placement). */
  containerRect: DOMRect | null;
};

export function MapHud({
  building,
  occupancy,
  currentKw,
  todayPhp,
  flagged,
  containerRect,
}: Props) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!building) return;
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler, { passive: true });
    return () => window.removeEventListener("mousemove", handler);
  }, [building]);

  if (!building || !pos || !containerRect) return null;

  const W = 280;
  const H = 168;
  const OFFSET = 14;
  let left = pos.x + OFFSET;
  let top = pos.y + OFFSET;

  // Edge-flip if it would overflow the container.
  if (left + W > containerRect.right) left = pos.x - W - OFFSET;
  if (top + H > containerRect.bottom) top = pos.y - H - OFFSET;

  const status = flagged ? "anomaly" : occupancy > 0.55 ? "active" : occupancy > 0.15 ? "low" : "idle";
  const statusTone =
    status === "anomaly" ? "danger" : status === "active" ? "ok" : status === "low" ? "warn" : "neutral";

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-40 w-[280px]",
        "rounded-[var(--radius-md)] border bg-[var(--color-surface-1)]",
        "shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]",
      )}
      style={{
        left,
        top,
        borderColor: "var(--color-border-strong)",
      }}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          BUILDING · {pad(building.id)}
        </span>
        <Pill tone={statusTone}>{status}</Pill>
      </div>

      <div className="px-4 pt-1 pb-3">
        <h3 className="text-[15px] font-medium text-[var(--color-fg)] leading-snug truncate">
          {building.name}
        </h3>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          {building.category}
        </p>
      </div>

      <div className="mx-4 h-px bg-[var(--color-border)]" />

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3">
        <Stat label="NOW" value={kw(currentKw)} />
        <Stat label="TODAY" value={peso(todayPhp)} />
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            OCCUPANCY
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-[11px] text-[var(--color-fg)] tabular-nums">
              {Math.round(occupancy * 100)}
            </span>
            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
              <div
                className="absolute inset-y-0 left-0 bg-[var(--color-signal)]"
                style={{ width: `${occupancy * 100}%` }}
              />
            </div>
          </div>
        </div>
        <Stat label="BASELINE" value={kw(building.baselineKw)} />
      </div>

      <div className="border-t border-[var(--color-border)] px-4 py-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
          OPEN <ArrowRight size={11} strokeWidth={1.5} />
        </span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        {label}
      </p>
      <p className="mt-0.5 font-mono text-[12px] text-[var(--color-fg)] tabular-nums">
        {value}
      </p>
    </div>
  );
}
