"use client";

import { Map as MapIcon, Box, Flame, Users, Droplets, Flag, Eye } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Mode = "plan" | "spatial";
type Layer = "heatmap" | "occupancy" | "water" | "flags-only" | "clean";

const LAYERS: Array<{ key: Layer; label: string; Icon: typeof Flame; tone: string }> = [
  { key: "heatmap",    label: "Heatmap",    Icon: Flame,    tone: "var(--color-warn)" },
  { key: "occupancy",  label: "Occupancy",  Icon: Users,    tone: "var(--color-signal)" },
  { key: "water",      label: "Water",      Icon: Droplets, tone: "var(--color-grid)" },
  { key: "flags-only", label: "Flags only", Icon: Flag,     tone: "var(--color-danger)" },
  { key: "clean",      label: "Clean",      Icon: Eye,      tone: "var(--color-fg-muted)" },
];

type Props = {
  mode: Mode;
  layer: Layer;
  onModeChange?: (m: Mode) => void;
  onLayerChange: (l: Layer) => void;
  allowModeToggle?: boolean;
};

export function MapLegend({
  mode,
  layer,
  onModeChange,
  onLayerChange,
  allowModeToggle = true,
}: Props) {
  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2.5">
      {allowModeToggle && (
        <div
          className={cn(
            "flex items-center gap-px rounded-[var(--radius-sm)] border-2 p-1",
            "bg-[var(--color-surface-1)] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.6)]",
          )}
          style={{ borderColor: "var(--color-border-strong)" }}
        >
          <SegBtn
            active={mode === "plan"}
            onClick={() => onModeChange?.("plan")}
            Icon={MapIcon}
            label="Plan"
          />
          <SegBtn
            active={mode === "spatial"}
            onClick={() => onModeChange?.("spatial")}
            Icon={Box}
            label="Spatial"
          />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-1 rounded-[var(--radius-sm)] border-2 p-2",
          "bg-[var(--color-surface-1)] shadow-[0_2px_12px_-4px_rgba(0,0,0,0.6)]",
          "min-w-[150px]",
        )}
        style={{ borderColor: "var(--color-border-strong)" }}
      >
        <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            Layer
          </p>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-signal)]">
            {LAYERS.find((l) => l.key === layer)?.label}
          </span>
        </div>
        {LAYERS.map((l) => {
          const active = l.key === layer;
          return (
            <button
              key={l.key}
              onClick={() => onLayerChange(l.key)}
              className={cn(
                "group flex items-center gap-2.5 rounded-[5px] px-2.5 py-2 text-left",
                "text-[11px] font-medium",
                "transition-all duration-150",
                active
                  ? "bg-[var(--color-fg)] text-[var(--color-bg)]"
                  : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
              )}
            >
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-[3px]",
                  active ? "bg-[var(--color-bg)]" : "bg-[var(--color-surface-2)]",
                )}
                style={active ? { color: l.tone } : { color: "var(--color-fg-subtle)" }}
              >
                <l.Icon size={11} strokeWidth={1.8} />
              </span>
              <span className="flex-1">{l.label}</span>
              {active && (
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: l.tone, boxShadow: `0 0 6px ${l.tone}` }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof MapIcon;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-[4px] px-4 py-2",
        "text-[11px] font-medium uppercase tracking-[0.18em]",
        "transition-all duration-200",
        active
          ? "bg-[var(--color-signal)] text-[var(--color-bg)] shadow-[0_0_16px_-2px_var(--color-signal-glow)]"
          : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
      )}
    >
      <Icon size={13} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  );
}
