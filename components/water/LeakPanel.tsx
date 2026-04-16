"use client";

/**
 * LeakPanel — CLAUDE-UPDATES PATCH 4 §4.2 Row 2 right card.
 *
 * Active leaks listed as cards; tapping SHUT VALVE mutates the shared
 * water readings and disappears the card (valve → closed → flow = 0).
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Check } from "lucide-react";
import { Pill } from "@/components/primitives/Pill";
import { Card } from "@/components/primitives/Card";
import { BUILDINGS } from "@/lib/mock/buildings";
import { setValveState, type ActiveLeak } from "@/lib/mock/telemetry";
import { pad } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Props = {
  initialLeaks: ActiveLeak[];
  onShut?: () => void;
  className?: string;
};

const SEVERITY_TONE: Record<ActiveLeak["severity"], "warn" | "danger"> = {
  minor: "warn",
  major: "danger",
  critical: "danger",
};

export function LeakPanel({ initialLeaks, onShut, className }: Props) {
  const [leaks, setLeaks] = useState<ActiveLeak[]>(initialLeaks);
  const [shuttingId, setShuttingId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<string[]>([]);

  const handleShut = (leak: ActiveLeak) => {
    setShuttingId(leak.id);
    setTimeout(() => {
      setValveState(leak.buildingId, leak.zone, "closed");
      setLeaks((prev) => prev.filter((l) => l.id !== leak.id));
      setResolved((prev) => [leak.id, ...prev].slice(0, 3));
      setShuttingId(null);
      onShut?.();
    }, 1100);
  };

  return (
    <Card surface={1} className={cn("overflow-hidden", className)}>
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={13}
            strokeWidth={1.6}
            className="text-[var(--color-danger)]"
          />
          <span className="text-[13px] font-medium text-[var(--color-fg)]">
            Leak detection
          </span>
        </div>
        <Pill tone={leaks.length > 0 ? "danger" : "ok"} pulse={leaks.length > 0}>
          {leaks.length > 0 ? `${leaks.length} active` : "All clear"}
        </Pill>
      </div>

      {leaks.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <p className="font-serif italic text-[18px] text-[var(--color-fg)]">
            No leaks detected.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            All valves nominal · last scan 04:12 PHT
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border)]">
          <AnimatePresence initial={false}>
            {leaks.map((leak) => {
              const b = BUILDINGS.find((x) => x.id === leak.buildingId);
              const shutting = shuttingId === leak.id;
              return (
                <motion.li
                  key={leak.id}
                  layout
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col gap-3 px-5 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
                          BLDG {pad(leak.buildingId)} · {leak.zone.toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] font-medium text-[var(--color-fg)]">
                        {b?.name ?? "Unknown building"}
                      </p>
                    </div>
                    <Pill tone={SEVERITY_TONE[leak.severity]} pulse>
                      {leak.severity}
                    </Pill>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-[11px]">
                    <Stat
                      label="Flow"
                      value={`${leak.flowRateLpm.toFixed(1)} L/min`}
                      tone="danger"
                    />
                    <Stat
                      label="Anomaly"
                      value={`+${leak.anomalyPct}%`}
                      tone="warn"
                    />
                    <Stat
                      label="Duration"
                      value={`${leak.detectedAtMinuteAgo}m`}
                      tone="muted"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShut(leak)}
                    disabled={shutting}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-[var(--radius-sm)] border px-3 py-2",
                      "font-mono text-[11px] uppercase tracking-[0.2em]",
                      shutting
                        ? "border-[var(--color-ok)] bg-[color-mix(in_oklch,var(--color-ok)_14%,transparent)] text-[var(--color-ok)]"
                        : "border-[var(--color-danger)] bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)] text-[var(--color-danger)]",
                      "transition-colors",
                    )}
                  >
                    <span>{shutting ? "Closing valve…" : "Shut valve"}</span>
                    {shutting ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
                        className="inline-block"
                      >
                        <AlertTriangle size={11} strokeWidth={1.6} />
                      </motion.span>
                    ) : (
                      <span>→</span>
                    )}
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {resolved.length > 0 && (
        <div className="border-t border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-ok)_4%,transparent)] px-5 py-2.5">
          <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-ok)]">
            <Check size={10} strokeWidth={1.8} />
            {resolved.length} {resolved.length === 1 ? "leak" : "leaks"} resolved this session · maintenance notified
          </p>
        </div>
      )}
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "danger" | "warn" | "muted";
}) {
  const color =
    tone === "danger"
      ? "var(--color-danger)"
      : tone === "warn"
        ? "var(--color-warn)"
        : "var(--color-fg-muted)";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        {label}
      </span>
      <span className="font-mono tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}
