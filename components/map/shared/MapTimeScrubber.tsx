"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** 0..287 (5-min slot index over 24h). */
  value: number;
  onChange: (v: number) => void;
  className?: string;
};

const STEPS = 288;

function labelFor(slot: number): string {
  const min = slot * 5;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function MapTimeScrubber({ value, onChange, className }: Props) {
  const id = useId();
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-3 rounded-[var(--radius-sm)] border-2 bg-[var(--color-surface-1)] px-4 py-2.5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.6)]",
        className,
      )}
      style={{ borderColor: "var(--color-border-strong)" }}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        Time of day
      </span>
      <span className="font-mono text-[14px] text-[var(--color-signal)] tabular-nums w-14">
        {labelFor(value)}
      </span>
      <input
        id={id}
        type="range"
        min={0}
        max={STEPS - 1}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="omni-scrubber w-64 accent-[var(--color-signal)]"
        aria-label="Time of day"
      />
      <style>{`
        .omni-scrubber {
          height: 4px;
          background: var(--color-surface-3);
          border-radius: 999px;
          outline: none;
        }
        .omni-scrubber::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--color-signal);
          border: 2px solid var(--color-bg);
          box-shadow: 0 0 8px var(--color-signal-glow);
          cursor: grab;
        }
        .omni-scrubber:active::-webkit-slider-thumb { cursor: grabbing; }
      `}</style>
    </div>
  );
}
