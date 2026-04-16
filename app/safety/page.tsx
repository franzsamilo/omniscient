"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, Zap, Check, AlertTriangle } from "lucide-react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Pill } from "@/components/primitives/Pill";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Seismograph } from "@/components/charts/Seismograph";
import { GasSection } from "@/components/safety/GasSection";
import { useControls } from "@/lib/stores/useControls";
import { useTicker } from "@/lib/stores/useTicker";
import { nonCriticalDevices } from "@/lib/mock/devices";
import { time } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type Phase = "idle" | "wash" | "countdown" | "executing" | "recovery";

export default function SafetyPage() {
  const triggerSeismicDrill = useControls((s) => s.triggerSeismicDrill);
  const endSeismicDrill = useControls((s) => s.endSeismicDrill);
  const drillActive = useControls((s) => s.drillActive);
  const pushTicker = useTicker((s) => s.push);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(5);
  const [recoveryItems, setRecoveryItems] = useState<Array<{ id: string; label: string; ok: boolean }>>([]);

  const beginDrill = () => {
    if (phase !== "idle") return;
    setPhase("wash");
    setTimeout(() => {
      setPhase("countdown");
      setCountdown(5);
    }, 200);
  };

  // Countdown timer
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown === 0) {
      // Execute: flip non-critical devices off, push ticker events.
      triggerSeismicDrill();
      const cuts = nonCriticalDevices().slice(0, 12);
      cuts.forEach((d, i) => {
        setTimeout(() => {
          pushTicker({
            id: `T-drill-${d.id}-${i}`,
            ts: new Date(),
            text: `BLDG ${String(d.buildingId).padStart(3, "0")} ${d.label.toUpperCase()} OFF`,
            tone: "danger",
          });
        }, i * 220);
      });
      setPhase("executing");
      // After 6s, recovery
      setTimeout(() => {
        setRecoveryItems([
          { id: "1", label: "Seismic anchors checked", ok: true },
          { id: "2", label: "Critical loads remained energized", ok: true },
          { id: "3", label: "Non-critical loads cut · 12/12", ok: true },
          { id: "4", label: "Generator standby online", ok: true },
          { id: "5", label: "Communications operational", ok: true },
          { id: "6", label: "Personnel accounted for", ok: false },
        ]);
        setPhase("recovery");
      }, 6000);
      return;
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, countdown, triggerSeismicDrill, pushTicker]);

  const reset = () => {
    setPhase("idle");
    setCountdown(5);
    setRecoveryItems([]);
    endSeismicDrill();
  };

  const agitated = phase !== "idle" && phase !== "recovery";

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      {/* Red flash wash */}
      <AnimatePresence>
        {phase === "wash" && (
          <motion.div
            key="wash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none fixed inset-0 z-[40] bg-[var(--color-danger)] mix-blend-screen"
          />
        )}
      </AnimatePresence>

      {/* Countdown takeover */}
      <AnimatePresence>
        {phase === "countdown" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24 }}
            className="fixed inset-0 z-[60] grid place-items-center bg-black/85 backdrop-blur-md"
          >
            <div className="flex flex-col items-center gap-6 text-center">
              <p className="font-mono text-[12px] uppercase tracking-[0.32em] text-[var(--color-danger)]">
                <ShieldAlert size={14} className="mr-2 inline" strokeWidth={1.6} />
                SEISMIC EVENT DETECTED
              </p>
              <p className="max-w-[40ch] font-serif italic text-[24px] leading-snug text-[var(--color-fg-muted)]">
                Non-critical systems will be cut in
              </p>
              <motion.div
                key={countdown}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif italic leading-none text-[var(--color-danger)] tabular-nums"
                style={{ fontSize: "clamp(8rem, 18vw, 15rem)" }}
              >
                {String(countdown).padStart(2, "0")}
              </motion.div>
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-fg-subtle)]">
                STAY CLEAR OF GLASS · MOVE TO MUSTER POINTS
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page content */}
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="01" label="Seismic" />
        <div className="flex items-center gap-2">
          {drillActive && (
            <Pill tone="danger" pulse>
              Drill in progress
            </Pill>
          )}
          <Pill tone={agitated ? "danger" : "ok"} pulse={agitated}>
            {agitated ? "Agitated" : "Quiet"}
          </Pill>
        </div>
      </div>

      {/* Hero — seismograph + RUN DRILL button (no overflow-hidden: glow ring
          around the drill button extends past the card edge by design). */}
      <Card surface={1} className="mt-5 omni-live p-5">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="text-[11px] text-[var(--color-fg-subtle)]">
              Live seismic trace · UPHSL-IL · Station 02
            </p>
            <p className="mt-1 text-[24px] font-medium leading-none text-[var(--color-fg)]">
              {agitated ? "Threshold exceeded" : "Ground steady"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Pill tone={agitated ? "danger" : "ok"}>{agitated ? "EVENT" : "OK"}</Pill>
            <span
              className="font-mono text-[10px] text-[var(--color-fg-subtle)] tabular-nums"
              suppressHydrationWarning
            >
              {time(new Date())} PHT
            </span>
          </div>
        </div>

        <div className="mt-4 rounded-[var(--radius-sm)] border bg-black/40 p-2" style={{ borderColor: "var(--color-border)" }}>
          <Seismograph height={160} agitated={agitated} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-[var(--color-fg-subtle)]">Drill rehearsal</p>
            <p className="font-serif italic text-[18px] text-[var(--color-fg-muted)]">
              Six seconds. From tremor to cutoff.
            </p>
          </div>

          {phase === "idle" || phase === "recovery" ? (
            <Button
              variant="danger"
              size="lg"
              onClick={beginDrill}
              disabled={phase !== "idle"}
              className="px-8"
            >
              <Zap size={14} strokeWidth={1.8} />
              Run seismic drill
            </Button>
          ) : (
            <Pill tone="danger" pulse>
              Drill running · {phase}
            </Pill>
          )}
        </div>
      </Card>

      {/* Lower row: breaker tree + recovery checklist */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card surface={1} className="xl:col-span-7 p-5">
          <SectionHeader index="01A" label="Breaker tree" />
          <BreakerTree drillActive={drillActive} />
        </Card>

        <Card surface={1} className="xl:col-span-5 p-5">
          <div className="flex items-center justify-between">
            <SectionHeader index="01B" label="Post-event checklist" />
            {phase === "recovery" && (
              <Button size="sm" variant="outline" onClick={reset}>
                Reset
              </Button>
            )}
          </div>

          {recoveryItems.length === 0 ? (
            <div className="mt-6 grid place-items-center px-4 py-6">
              <p className="font-serif italic text-[16px] text-[var(--color-fg-muted)]">
                Nothing to verify.
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
                Run a drill to see the recovery flow.
              </p>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col">
              {recoveryItems.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.32 }}
                  className="flex items-center justify-between border-b border-[var(--color-border)] py-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    {item.ok ? (
                      <Check size={16} strokeWidth={1.6} className="text-[var(--color-ok)]" />
                    ) : (
                      <AlertTriangle size={16} strokeWidth={1.6} className="text-[var(--color-warn)]" />
                    )}
                    <span className="text-[13px] text-[var(--color-fg)]">{item.label}</span>
                  </div>
                  <Pill tone={item.ok ? "ok" : "warn"}>{item.ok ? "OK" : "PENDING"}</Pill>
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Gas & air hazard detection — CLAUDE-UPDATES PATCH 9 */}
      <div className="mt-6">
        <GasSection />
      </div>
    </div>
  );
}

function StatLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] text-[var(--color-fg-subtle)]">{children}</span>;
}

function BreakerTree({ drillActive }: { drillActive: boolean }) {
  const TREE = [
    { id: "M", name: "MAIN BUS", load: 1180, critical: true },
    { id: "F1", name: "FEEDER 01 — Academic North", load: 320, critical: false },
    { id: "F2", name: "FEEDER 02 — Academic South", load: 285, critical: false },
    { id: "F3", name: "FEEDER 03 — Residential", load: 220, critical: false },
    { id: "F4", name: "FEEDER 04 — Utility", load: 198, critical: true },
    { id: "F5", name: "FEEDER 05 — Sports/Dining", load: 90, critical: false },
    { id: "F6", name: "FEEDER 06 — Lighting only", load: 67, critical: false },
  ];
  return (
    <div className="mt-4 grid grid-cols-1 gap-2">
      {TREE.map((b, i) => {
        const open = drillActive && !b.critical;
        return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "relative flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border px-4 py-3",
              "transition-colors",
              i === 0 ? "bg-[var(--color-surface-2)]" : undefined,
              open ? "border-[var(--color-danger)] bg-[color-mix(in_oklch,var(--color-danger)_10%,transparent)]" : "border-[var(--color-border)]",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-5 place-items-center rounded-[3px] font-mono text-[9px] uppercase tracking-[0.18em]",
                  open
                    ? "bg-[var(--color-danger)] text-[var(--color-bg)]"
                    : "bg-[var(--color-surface-3)] text-[var(--color-fg-subtle)]",
                )}
              >
                {b.id}
              </span>
              <p className="text-[13px] font-medium text-[var(--color-fg)]">{b.name}</p>
              {b.critical && <Pill tone="warn">Critical</Pill>}
            </div>

            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.22em]">
              <span className={cn("tabular-nums", open ? "text-[var(--color-danger)]" : "text-[var(--color-fg-muted)]")}>
                {open ? "0.0 kW" : `${b.load} kW`}
              </span>
              <Pill tone={open ? "danger" : "ok"}>
                {open ? "OPEN" : "CLOSED"}
              </Pill>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
