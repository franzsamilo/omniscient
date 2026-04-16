"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Droplets, AlertTriangle, Gauge, CircleDollarSign } from "lucide-react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Pill } from "@/components/primitives/Pill";
import { Card } from "@/components/primitives/Card";
import { CardTitle } from "@/components/primitives/CardTitle";
import { NumberFlow } from "@/components/primitives/NumberFlow";
import { Sparkline } from "@/components/primitives/Sparkline";
import { WaterFlowTree } from "@/components/water/WaterFlowTree";
import { LeakPanel } from "@/components/water/LeakPanel";
import { Water7dChart } from "@/components/water/Water7dChart";
import {
  activeLeaks,
  campusWaterZones,
  waterByBuilding,
  waterKpiSnapshot,
} from "@/lib/mock/telemetry";
import { int, pad, peso, pesoShort } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function WaterPage() {
  const kpi = useMemo(() => waterKpiSnapshot(), []);
  const zones = useMemo(() => campusWaterZones(), []);
  const leaks = useMemo(() => activeLeaks(), []);
  const table = useMemo(() => waterByBuilding(), []);

  const dailyDeltaPct =
    ((kpi.dailyConsumptionL - kpi.yesterdayConsumptionL) /
      Math.max(1, kpi.yesterdayConsumptionL)) *
    100;

  // Sparkline stand-in — last 24 synthetic points from baseline shape.
  const spark = useMemo(() => {
    const base = kpi.dailyConsumptionL / 24;
    return Array.from({ length: 24 }, (_, i) =>
      base * (0.6 + 0.6 * Math.sin((i / 24) * Math.PI * 2 + 1)),
    );
  }, [kpi.dailyConsumptionL]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="05" label="Water systems" />
        <div className="flex items-center gap-2">
          <Pill tone={kpi.activeLeaks > 0 ? "danger" : "ok"} pulse={kpi.activeLeaks > 0}>
            {kpi.activeLeaks > 0 ? `${kpi.activeLeaks} leaks` : "Nominal"}
          </Pill>
          <Pill tone="grid">All valves observed</Pill>
        </div>
      </div>

      {/* Row 1 — KPI strip */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Today's consumption"
          value={kpi.dailyConsumptionL}
          display={<NumberFlow value={kpi.dailyConsumptionL} format={{ maximumFractionDigits: 0 }} />}
          unit="L"
          delta={dailyDeltaPct}
          context={`vs ${int(kpi.yesterdayConsumptionL)} L yesterday`}
          Icon={Droplets}
          tone="grid"
          spark={spark}
        />
        <Kpi
          label="Current flow"
          value={kpi.currentFlowLpm}
          display={<NumberFlow value={kpi.currentFlowLpm} format={{ maximumFractionDigits: 1 }} />}
          unit="L / min"
          context="campus aggregate"
          Icon={Gauge}
          tone="signal"
          spark={spark.slice(12)}
        />
        <Kpi
          label="Active leaks"
          value={kpi.activeLeaks}
          display={<NumberFlow value={kpi.activeLeaks} format={{ maximumFractionDigits: 0 }} />}
          unit=""
          context={kpi.activeLeaks > 0 ? "action required" : "nothing flagged"}
          Icon={AlertTriangle}
          tone={kpi.activeLeaks > 0 ? "danger" : "ok"}
        />
        <Kpi
          label="Monthly cost"
          value={kpi.monthlyCostPhp}
          display={<span>{pesoShort(kpi.monthlyCostPhp)}</span>}
          unit=""
          context={`approx · ₱42.50 / m³`}
          Icon={CircleDollarSign}
          tone="solar"
        />
      </div>

      {/* Row 2 — Flow tree + Leak panel */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card surface={1} className="xl:col-span-8 px-4 py-4">
          <div className="flex items-center justify-between px-2 pb-3">
            <CardTitle>Zone flow schematic</CardTitle>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              Trunk · 5 zones · live
            </span>
          </div>
          <WaterFlowTree zones={zones} currentFlowLpm={kpi.currentFlowLpm} />
        </Card>

        <div className="xl:col-span-4">
          <LeakPanel initialLeaks={leaks} />
        </div>
      </div>

      {/* Row 3 — Building consumption table */}
      <Card surface={1} className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <CardTitle>Consumption · top buildings</CardTitle>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            {table.length} observed
          </span>
        </div>

        <div className="max-h-[460px] overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 z-10 bg-[var(--color-surface-1)] font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-5 py-3 text-left">Building</th>
                <th className="px-5 py-3 text-right">Today (L)</th>
                <th className="px-5 py-3 text-right">7-day avg</th>
                <th className="px-5 py-3 text-right">Δ</th>
                <th className="px-5 py-3 text-left">Peak hour</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {table.slice(0, 20).map((row, i) => (
                <motion.tr
                  key={row.buildingId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, delay: i * 0.02 }}
                  className={cn(
                    "border-b border-[var(--color-border)] last:border-b-0 transition-colors",
                    "hover:bg-[color-mix(in_oklch,var(--color-surface-2)_92%,var(--color-signal)_8%)]",
                    row.anomaly && "border-l-2 border-l-[var(--color-warn)]",
                  )}
                >
                  <td className="px-5 py-2.5">
                    <Link href={`/building/${row.buildingId}`} className="block">
                      <p className="font-medium text-[var(--color-fg)] hover:text-[var(--color-signal)]">
                        {row.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
                        BLDG {pad(row.buildingId)} · {row.category}
                      </p>
                    </Link>
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono tabular-nums text-[var(--color-fg)]">
                    {int(row.todayL)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono tabular-nums text-[var(--color-fg-muted)]">
                    {int(row.avg7L)}
                  </td>
                  <td
                    className="px-5 py-2.5 text-right font-mono tabular-nums"
                    style={{
                      color:
                        Math.abs(row.deltaPct) > 15
                          ? "var(--color-warn)"
                          : row.deltaPct > 0
                            ? "var(--color-fg-muted)"
                            : "var(--color-ok)",
                    }}
                  >
                    {row.deltaPct >= 0 ? "▲" : "▼"} {Math.abs(row.deltaPct).toFixed(1)}%
                  </td>
                  <td className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)] tabular-nums">
                    {row.peakHour}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <Pill tone={row.anomaly ? "warn" : "ok"}>
                      {row.anomaly ? "Anomaly" : "Normal"}
                    </Pill>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Row 4 — 7-day chart */}
      <Card surface={1} className="mt-4 px-5 py-5">
        <div className="flex items-center justify-between">
          <CardTitle>7-day consumption · by zone</CardTitle>
          <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            {[
              ["Academic", "var(--color-signal)"],
              ["Residential", "var(--color-grid)"],
              ["Sports", "var(--color-ok)"],
              ["Dining", "var(--color-solar)"],
              ["Utility", "var(--color-fg-muted)"],
            ].map(([label, color]) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <Water7dChart height={240} />
        </div>
      </Card>

      {/* Footer claim */}
      <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        OBSERVED · {int(kpi.dailyConsumptionL)} L today · approx {peso(kpi.monthlyCostPhp)} / month
      </p>
    </div>
  );
}

function Kpi({
  label,
  display,
  unit,
  delta,
  context,
  Icon,
  tone,
  spark,
}: {
  label: string;
  value: number;
  display: React.ReactNode;
  unit: string;
  delta?: number;
  context: string;
  Icon: typeof Droplets;
  tone: "grid" | "signal" | "ok" | "danger" | "warn" | "solar";
  spark?: number[];
}) {
  const color = `var(--color-${tone})`;
  return (
    <Card surface={1} hoverable>
      <div className="flex items-start justify-between px-4 pt-3">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          <Icon size={11} strokeWidth={1.6} style={{ color }} />
          {label}
        </span>
        {spark && (
          <div style={{ color }}>
            <Sparkline values={spark} stroke="currentColor" width={64} height={22} />
          </div>
        )}
      </div>

      <div className="px-4 pb-3">
        <div className="mt-1 flex items-baseline gap-2">
          <span
            className="font-serif italic leading-none tabular-nums text-[var(--color-fg)]"
            style={{ fontSize: "clamp(1.7rem, 2.4vw, 2rem)" }}
          >
            {display}
          </span>
          {unit && (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
              {unit}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-[var(--color-fg-muted)]">
          {typeof delta === "number" && (
            <span
              className="inline-flex items-center gap-0.5 tabular-nums"
              style={{
                color:
                  Math.abs(delta) > 15
                    ? "var(--color-warn)"
                    : delta >= 0
                      ? "var(--color-fg-muted)"
                      : "var(--color-ok)",
              }}
            >
              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
            </span>
          )}
          <span className="text-[var(--color-fg-subtle)]">{context}</span>
        </div>
      </div>
    </Card>
  );
}
