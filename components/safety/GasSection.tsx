"use client";

/**
 * GasSection — CLAUDE-UPDATES PATCH 9.
 *
 * Hosts the zone grid, alert-protocol reference, and RUN GAS LEAK DRILL
 * button + cinematic. The drill itself is a shorter counterpart to the
 * seismic drill (4s total): ventilation override, gas supply shutoff,
 * evacuation alert, then a recovery checklist.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Wind, ShieldCheck, Check } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { Button } from "@/components/primitives/Button";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { GasZoneCard } from "./GasZoneCard";
import {
  gasReadings,
  setGasZoneState,
  GAS_THRESHOLDS,
  type GasReading,
} from "@/lib/mock/telemetry";
import { useTicker } from "@/lib/stores/useTicker";
import { useLogs } from "@/lib/stores/useLogs";
import { pad } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type DrillPhase = "idle" | "flash" | "countdown" | "executing" | "recovery";

type Props = { className?: string };

export function GasSection({ className }: Props) {
  const [readings, setReadings] = useState<GasReading[]>(() => gasReadings());
  const [drillPhase, setDrillPhase] = useState<DrillPhase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [targetZoneId, setTargetZoneId] = useState<string | null>(null);
  const pushTicker = useTicker((s) => s.push);
  const pushLogs = useLogs((s) => s.push);

  // Pick a deterministic target (Chem Lab · 042) when starting the drill.
  const targetZone = useMemo(
    () => readings.find((r) => r.id === (targetZoneId ?? "G-42-co")),
    [readings, targetZoneId],
  );

  const beginDrill = () => {
    if (drillPhase !== "idle") return;
    // 1. Pick target zone
    const target = readings.find((r) => r.id === "G-42-co") ?? readings[0];
    setTargetZoneId(target.id);
    // 2. Flash to danger for ~400ms
    setGasZoneState(target.id, {
      ppm: GAS_THRESHOLDS[target.gasType].danger * 1.3,
      status: "danger",
    });
    setReadings([...gasReadings()]);
    setDrillPhase("flash");

    setTimeout(() => {
      setDrillPhase("countdown");
      setCountdown(3);
    }, 400);
  };

  const reset = () => {
    if (!targetZone) return;
    // Restore nominal reading
    setGasZoneState(targetZone.id, {
      ppm: GAS_THRESHOLDS[targetZone.gasType].elevated * 0.3,
      status: "normal",
      ventilationState: "normal",
      gasSupplyValve: "open",
    });
    setReadings([...gasReadings()]);
    setDrillPhase("idle");
    setCountdown(3);
    setTargetZoneId(null);
  };

  // Countdown + execution timeline
  useEffect(() => {
    if (drillPhase !== "countdown") return;
    if (countdown === 0) {
      if (!targetZone) return;
      const bldg = pad(targetZone.buildingId);
      // 1. Ventilation override → high
      setTimeout(() => {
        setGasZoneState(targetZone.id, { ventilationState: "override" });
        setReadings([...gasReadings()]);
        const log = `BLDG ${bldg} VENTILATION → OVERRIDE`;
        pushTicker({
          id: `T-gd-vent-${Date.now()}`,
          ts: new Date(),
          text: log,
          tone: "danger",
        });
        pushLogs([
          {
            id: `L-gd-${Date.now()}`,
            timestamp: Date.now(),
            source: "gas",
            severity: "critical",
            buildingId: targetZone.buildingId,
            roomId: targetZone.zoneLabel,
            message: "Ventilation override engaged",
          },
        ]);
      }, 200);

      // 2. Gas supply valve closed
      setTimeout(() => {
        setGasZoneState(targetZone.id, { gasSupplyValve: "closed" });
        setReadings([...gasReadings()]);
        pushTicker({
          id: `T-gd-valve-${Date.now()}`,
          ts: new Date(),
          text: `BLDG ${bldg} GAS SUPPLY SHUTOFF`,
          tone: "danger",
        });
        pushLogs([
          {
            id: `L-gd2-${Date.now()}`,
            timestamp: Date.now(),
            source: "gas",
            severity: "critical",
            buildingId: targetZone.buildingId,
            roomId: targetZone.zoneLabel,
            message: "Gas supply valve closed",
          },
        ]);
      }, 800);

      // 3. Evacuation alert
      setTimeout(() => {
        pushTicker({
          id: `T-gd-evac-${Date.now()}`,
          ts: new Date(),
          text: `BLDG ${bldg} EVACUATION ALERT DISPATCHED`,
          tone: "danger",
        });
        pushLogs([
          {
            id: `L-gd3-${Date.now()}`,
            timestamp: Date.now(),
            source: "gas",
            severity: "critical",
            buildingId: targetZone.buildingId,
            roomId: targetZone.zoneLabel,
            message: "Evacuation alert dispatched",
          },
        ]);
      }, 1400);

      // Phase advances are async so the effect body stays synchronization-only
      // (React 19 compiler rule — no direct setState in effect body).
      const execId = setTimeout(() => setDrillPhase("executing"), 0);
      const recoveryId = setTimeout(() => setDrillPhase("recovery"), 4000);
      return () => {
        clearTimeout(execId);
        clearTimeout(recoveryId);
      };
    }
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [drillPhase, countdown, targetZone, pushTicker, pushLogs]);

  const drillActive = drillPhase !== "idle";

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="02" label="Gas & air hazard detection" />
        <div className="flex items-center gap-2">
          {drillActive && drillPhase !== "recovery" && (
            <Pill tone="danger" pulse>
              Drill · {drillPhase}
            </Pill>
          )}
          {!drillActive && (
            <Button variant="danger" size="md" onClick={beginDrill} className="px-5">
              <AlertTriangle size={12} strokeWidth={1.8} />
              Run gas leak drill
            </Button>
          )}
          {drillPhase === "recovery" && (
            <Button size="sm" variant="outline" onClick={reset}>
              Reset
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Gas monitoring panel */}
        <Card surface={1} className="xl:col-span-8 px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
              Zones · {readings.length} monitored
            </p>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              Scanned every 5s
            </span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {readings.map((r) => (
              <GasZoneCard key={r.id} reading={r} />
            ))}
          </div>
        </Card>

        {/* Alert protocol */}
        <Card surface={1} className="xl:col-span-4 px-5 py-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
            Response protocol
          </p>

          <div className="mt-3 flex flex-col gap-2">
            <ProtocolRow
              level="Normal"
              color="var(--color-ok)"
              body="Routine monitoring. No action."
              active={!drillActive && worstStatus(readings) === "normal"}
            />
            <ProtocolRow
              level="Elevated"
              color="var(--color-warn)"
              body={
                <>
                  Alert to maintenance.
                  <br />
                  Ventilation → HIGH.
                  <br />
                  Entry advisory posted.
                </>
              }
              active={worstStatus(readings) === "elevated" && !drillActive}
            />
            <ProtocolRow
              level="Danger"
              color="var(--color-danger)"
              body={
                <>
                  Ventilation override.
                  <br />
                  Room evacuation alert.
                  <br />
                  Gas supply shutoff.
                  <br />
                  Fire safety notified.
                </>
              }
              active={worstStatus(readings) === "danger" || drillActive}
            />
          </div>
        </Card>
      </div>

      {/* Drill takeover banner */}
      <AnimatePresence>
        {drillPhase === "countdown" && targetZone && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24 }}
            className="fixed left-1/2 top-16 z-[50] flex -translate-x-1/2 items-center gap-3 rounded-full border-2 bg-[var(--color-bg)]/95 backdrop-blur-md px-5 py-2.5 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.7)]"
            style={{ borderColor: "var(--color-danger)" }}
          >
            <AlertTriangle size={14} strokeWidth={1.8} className="text-[var(--color-danger)]" />
            <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--color-danger)]">
              Gas hazard · {targetZone.zoneLabel} · BLDG {pad(targetZone.buildingId)}
            </span>
            <span className="text-[var(--color-border-strong)]">·</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
              Ventilation override in
            </span>
            <motion.span
              key={countdown}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.24 }}
              className="font-serif italic tabular-nums text-[var(--color-danger)]"
              style={{ fontSize: 22 }}
            >
              {String(countdown).padStart(2, "0")}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recovery checklist */}
      <AnimatePresence>
        {drillPhase === "recovery" && targetZone && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32 }}
          >
            <Card surface={1} className="mt-4 px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
                  Post-event recovery · {targetZone.zoneLabel}
                </p>
                <Pill tone="ok" pulse>
                  Stable
                </Pill>
              </div>

              <ul className="mt-3 flex flex-col divide-y divide-[var(--color-border)]">
                {[
                  { label: "Ventilation override activated", done: true },
                  { label: "Gas supply valve closed", done: true },
                  { label: "Evacuation alert dispatched", done: true },
                  { label: "Manual all-clear (admin)", done: false },
                ].map((i, idx) => (
                  <motion.li
                    key={i.label}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.24, delay: idx * 0.08 }}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="flex items-center gap-2 text-[13px] text-[var(--color-fg)]">
                      {i.done ? (
                        <Check size={14} strokeWidth={1.8} className="text-[var(--color-ok)]" />
                      ) : (
                        <ShieldCheck size={14} strokeWidth={1.8} className="text-[var(--color-warn)]" />
                      )}
                      {i.label}
                    </span>
                    <Pill tone={i.done ? "ok" : "warn"}>
                      {i.done ? "Done" : "Pending admin"}
                    </Pill>
                  </motion.li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function worstStatus(readings: GasReading[]): GasReading["status"] {
  if (readings.some((r) => r.status === "danger")) return "danger";
  if (readings.some((r) => r.status === "elevated")) return "elevated";
  return "normal";
}

function ProtocolRow({
  level,
  color,
  body,
  active,
}: {
  level: string;
  color: string;
  body: React.ReactNode;
  active: boolean;
}) {
  return (
    <motion.div
      animate={active ? { backgroundColor: `color-mix(in oklch, ${color} 8%, var(--color-surface-2))` } : {}}
      transition={{ duration: 0.24 }}
      className={cn(
        "rounded-[var(--radius-sm)] border-l-[3px] px-3 py-2.5",
        "text-[11px] leading-tight",
      )}
      style={{
        borderLeftColor: color,
        backgroundColor: active ? undefined : "transparent",
      }}
    >
      <div className="flex items-center gap-2">
        {level === "Elevated" ? (
          <Wind size={11} strokeWidth={1.6} style={{ color }} />
        ) : level === "Danger" ? (
          <AlertTriangle size={11} strokeWidth={1.8} style={{ color }} />
        ) : (
          <ShieldCheck size={11} strokeWidth={1.6} style={{ color }} />
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color }}>
          {level}
        </span>
        {active && (
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg)]">
            Active
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[var(--color-fg-muted)]">{body}</p>
    </motion.div>
  );
}
