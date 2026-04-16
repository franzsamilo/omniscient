"use client";

/**
 * GasZoneCard — CLAUDE-UPDATES PATCH 9 §9.1.
 * One card per monitored zone; colored threshold gauge + 1h sparkline.
 */

import { motion } from "motion/react";
import { Pill } from "@/components/primitives/Pill";
import { Sparkline } from "@/components/primitives/Sparkline";
import { NumberFlow } from "@/components/primitives/NumberFlow";
import { type GasReading, GAS_THRESHOLDS } from "@/lib/mock/telemetry";
import { BUILDINGS } from "@/lib/mock/buildings";
import { pad } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Props = {
  reading: GasReading;
};

const STATUS_TONE = {
  normal: { pillTone: "ok" as const, color: "var(--color-ok)", label: "Normal" },
  elevated: { pillTone: "warn" as const, color: "var(--color-warn)", label: "Elevated" },
  danger: { pillTone: "danger" as const, color: "var(--color-danger)", label: "Danger" },
};

export function GasZoneCard({ reading }: Props) {
  const tone = STATUS_TONE[reading.status];
  const thresholds = GAS_THRESHOLDS[reading.gasType];
  const b = BUILDINGS.find((x) => x.id === reading.buildingId);

  return (
    <motion.div
      animate={
        reading.status === "danger"
          ? { opacity: [1, 0.94, 1] }
          : { opacity: 1 }
      }
      transition={
        reading.status === "danger"
          ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
          : undefined
      }
      className={cn(
        "relative flex flex-col gap-3 rounded-[var(--radius-sm)] border px-4 py-3",
        reading.status === "elevated" && "border-l-[3px] border-l-[var(--color-warn)]",
        reading.status === "danger" && "border-l-[3px] border-l-[var(--color-danger)]",
      )}
      style={{
        borderColor: reading.status === "normal" ? "var(--color-border)" : tone.color,
        backgroundColor:
          reading.status === "danger"
            ? "color-mix(in oklch, var(--color-surface-2) 92%, var(--color-danger))"
            : "var(--color-surface-2)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            BLDG {pad(reading.buildingId)} · {reading.zoneLabel}
          </p>
          {b && (
            <p className="mt-0.5 text-[11px] text-[var(--color-fg-muted)]">
              {b.name}
            </p>
          )}
        </div>
        <Pill tone={tone.pillTone} pulse={reading.status !== "normal"}>
          {reading.gasType.toUpperCase()}
        </Pill>
      </div>

      <div className="flex items-baseline gap-2">
        <NumberFlow
          value={reading.ppm}
          format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }}
          className="font-serif italic leading-none tabular-nums"
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
          PPM
        </span>
        <span className="ml-auto" style={{ color: tone.color }}>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]">
            {tone.label}
          </span>
        </span>
      </div>

      {/* Threshold gauge */}
      <ThresholdGauge
        value={reading.ppm}
        elevated={thresholds.elevated}
        danger={thresholds.danger}
        max={thresholds.scaleMax}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="text-[var(--color-fg-muted)]" style={{ color: tone.color }}>
          <Sparkline
            values={reading.trend1h}
            stroke="currentColor"
            fill="color-mix(in oklch, currentColor 10%, transparent)"
            width={140}
            height={24}
          />
        </div>
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          Vent · {reading.ventilationState}
        </p>
      </div>
    </motion.div>
  );
}

function ThresholdGauge({
  value,
  elevated,
  danger,
  max,
}: {
  value: number;
  elevated: number;
  danger: number;
  max: number;
}) {
  const pct = Math.min(1, Math.max(0, value / max));
  const elevPct = (elevated / max) * 100;
  const dangerPct = (danger / max) * 100;

  return (
    <div className="relative">
      {/* Track */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]">
        {/* Zone segments */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-full"
          style={{
            width: `${elevPct}%`,
            backgroundColor: "color-mix(in oklch, var(--color-ok) 50%, var(--color-surface-3))",
          }}
        />
        <div
          className="absolute inset-y-0"
          style={{
            left: `${elevPct}%`,
            width: `${dangerPct - elevPct}%`,
            backgroundColor: "color-mix(in oklch, var(--color-warn) 50%, var(--color-surface-3))",
          }}
        />
        <div
          className="absolute inset-y-0 right-0 rounded-r-full"
          style={{
            left: `${dangerPct}%`,
            backgroundColor: "color-mix(in oklch, var(--color-danger) 45%, var(--color-surface-3))",
          }}
        />
        {/* Marker */}
        <motion.span
          initial={{ left: 0 }}
          animate={{ left: `${pct * 100}%` }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-1/2 h-3 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-fg)]"
          style={{ boxShadow: "0 0 6px var(--color-fg)" }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[8px] uppercase tracking-[0.2em] tabular-nums text-[var(--color-fg-subtle)]">
        <span>0</span>
        <span style={{ color: "var(--color-warn)" }}>{elevated}</span>
        <span style={{ color: "var(--color-danger)" }}>{danger}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
