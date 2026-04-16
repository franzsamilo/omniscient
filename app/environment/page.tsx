"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  Thermometer,
  Droplet,
  Heart,
  Fan,
  AlertTriangle,
  Snowflake,
  Leaf,
} from "lucide-react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Pill } from "@/components/primitives/Pill";
import { Card } from "@/components/primitives/Card";
import { CardTitle } from "@/components/primitives/CardTitle";
import { NumberFlow } from "@/components/primitives/NumberFlow";
import { Sparkline } from "@/components/primitives/Sparkline";
import { CampusMap } from "@/components/map/CampusMap";
import { EnvDayChart } from "@/components/environment/EnvDayChart";
import {
  airQualitySummary,
  environmentAnomalies,
  environmentIntensity,
  environmentKpi,
  environmentReadings,
} from "@/lib/mock/telemetry";
import { pad, percent } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const COMFORT_DESC = (v: number) =>
  v >= 80 ? "Comfortable" : v >= 70 ? "Acceptable" : v >= 60 ? "Marginal" : "Uncomfortable";

export default function EnvironmentPage() {
  const kpi = useMemo(() => environmentKpi(), []);
  const anomalies = useMemo(() => environmentAnomalies(), []);
  const intensity = useMemo(() => environmentIntensity(), []);
  const readings = useMemo(() => environmentReadings(), []);
  const air = useMemo(() => airQualitySummary(), []);

  // Stable mini sparklines — derived from indoor temp curve.
  const tempSpark = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) =>
        24 + Math.sin((i / 24) * Math.PI * 2) * 1.4,
      ),
    [],
  );
  const humidSpark = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) =>
        0.65 + Math.sin((i / 24) * Math.PI * 2 + 1) * 0.12,
      ),
    [],
  );

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="04" label="Environmental monitoring" />
        <div className="flex items-center gap-2">
          <Pill tone={kpi.anomalyCount > 0 ? "warn" : "ok"} pulse={kpi.anomalyCount > 0}>
            {kpi.anomalyCount > 0 ? `${kpi.anomalyCount} anomalies` : "Comfort maintained"}
          </Pill>
          <Pill tone="signal">Sensors · {readings.length}</Pill>
        </div>
      </div>

      {/* Row 1 — KPI strip */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <EnvKpi
          label="Avg temperature"
          display={<NumberFlow value={kpi.avgTempC} format={{ maximumFractionDigits: 1, minimumFractionDigits: 1 }} />}
          unit="°C"
          context={`Hottest · ${kpi.hottestName} · +${kpi.hottestDeviationC.toFixed(1)}°`}
          Icon={Thermometer}
          tone="warn"
          spark={tempSpark}
        />
        <EnvKpi
          label="Avg humidity"
          display={<NumberFlow value={kpi.avgHumidity * 100} format={{ maximumFractionDigits: 0 }} />}
          unit="%"
          context="Target band · 40–70%"
          Icon={Droplet}
          tone="grid"
          spark={humidSpark}
        />
        <EnvKpi
          label="Comfort index"
          display={<NumberFlow value={kpi.comfortIndex} format={{ maximumFractionDigits: 0 }} />}
          unit="/100"
          context={COMFORT_DESC(kpi.comfortIndex)}
          Icon={Heart}
          tone={kpi.comfortIndex >= 70 ? "ok" : "warn"}
        />
        <EnvKpi
          label="HVAC efficiency"
          display={<NumberFlow value={kpi.hvacEfficiency * 100} format={{ maximumFractionDigits: 0 }} />}
          unit="%"
          context="Delivered · drawn"
          Icon={Fan}
          tone="signal"
        />
        <Link href={{ pathname: "/safety", hash: "gas" }} className="contents">
          <EnvKpi
            label="Air quality"
            display={<span>{air.label}</span>}
            unit=""
            context="Worst-zone gas reading"
            Icon={Leaf}
            tone={air.tone === "danger" ? "warn" : air.tone === "warn" ? "warn" : "ok"}
          />
        </Link>
      </div>

      {/* Row 2 — Campus map + Anomaly feed */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card surface={1} className="xl:col-span-8 overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <CardTitle>Campus · temperature deviation</CardTitle>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              Cooler · at setpoint · warmer
            </span>
          </div>
          <div className="relative h-[440px]">
            <CampusMap
              mode="plan"
              layer="environment"
              intensity={intensity}
              allowModeToggle={false}
              size="contain"
            />
          </div>
        </Card>

        <Card surface={1} className="omni-live xl:col-span-4 overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={13}
                strokeWidth={1.6}
                className="text-[var(--color-warn)]"
              />
              <CardTitle>Anomaly feed</CardTitle>
            </div>
            <Pill tone={anomalies.length > 0 ? "warn" : "ok"} pulse={anomalies.length > 0}>
              {anomalies.length > 0 ? `${anomalies.length}` : "Clear"}
            </Pill>
          </div>

          {anomalies.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="font-serif italic text-[18px] text-[var(--color-fg)]">
                Nothing to flag.
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                All zones within tolerance
              </p>
            </div>
          ) : (
            <ul className="max-h-[440px] divide-y divide-[var(--color-border)] overflow-y-auto">
              {anomalies.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.24, delay: i * 0.03 }}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 border-l-2",
                    a.severity === "critical"
                      ? "border-l-[var(--color-danger)]"
                      : "border-l-[var(--color-warn)]",
                  )}
                >
                  <AnomalyIcon kind={a.icon} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] text-[var(--color-fg)]">{a.message}</p>
                    <Link
                      href={`/building/${a.buildingId}`}
                      className="mt-1 inline-block font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)] hover:text-[var(--color-signal)]"
                    >
                      Open bldg {pad(a.buildingId)} →
                    </Link>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Row 3 — building table */}
      <Card surface={1} className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <CardTitle>Building environment</CardTitle>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            Sorted by deviation
          </span>
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 z-10 bg-[var(--color-surface-1)] font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              <tr className="border-b border-[var(--color-border)]">
                <th className="px-5 py-3 text-left">Building</th>
                <th className="px-5 py-3 text-right">Avg temp</th>
                <th className="px-5 py-3 text-right">Humidity</th>
                <th className="px-5 py-3 text-right">Comfort</th>
                <th className="px-5 py-3 text-right">AC active</th>
                <th className="px-5 py-3 text-right">HVAC load</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...readings]
                .sort((a, b) => Math.abs(b.deviationC) - Math.abs(a.deviationC))
                .slice(0, 24)
                .map((r, i) => {
                  const status = statusFor(r.deviationC, r.avgHumidity);
                  return (
                    <motion.tr
                      key={r.buildingId}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, delay: i * 0.02 }}
                      className={cn(
                        "border-b border-[var(--color-border)] last:border-b-0 transition-colors",
                        "hover:bg-[color-mix(in_oklch,var(--color-surface-2)_92%,var(--color-signal)_8%)]",
                      )}
                    >
                      <td className="px-5 py-2.5">
                        <Link href={`/building/${r.buildingId}`} className="block">
                          <p className="font-medium text-[var(--color-fg)] hover:text-[var(--color-signal)]">
                            {r.name}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
                            BLDG {pad(r.buildingId)} · {r.category}
                          </p>
                        </Link>
                      </td>
                      <td
                        className="px-5 py-2.5 text-right font-mono tabular-nums"
                        style={{
                          color:
                            Math.abs(r.deviationC) >= 3
                              ? r.deviationC > 0
                                ? "var(--color-warn)"
                                : "var(--color-grid)"
                              : "var(--color-fg)",
                        }}
                      >
                        {r.avgTempC.toFixed(1)}°C
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tabular-nums text-[var(--color-fg-muted)]">
                        {percent(r.avgHumidity)}
                      </td>
                      <td
                        className="px-5 py-2.5 text-right font-mono tabular-nums"
                        style={{
                          color:
                            r.comfortIndex >= 70
                              ? "var(--color-ok)"
                              : r.comfortIndex >= 60
                                ? "var(--color-warn)"
                                : "var(--color-danger)",
                        }}
                      >
                        {r.comfortIndex}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tabular-nums text-[var(--color-fg-muted)]">
                        {r.activeAcUnits}/{r.acTotal}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono tabular-nums text-[var(--color-fg)]">
                        {r.hvacLoadKw.toFixed(1)} kW
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <Pill tone={status.tone}>{status.label}</Pill>
                      </td>
                    </motion.tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Row 4 — 24h overlay chart */}
      <Card surface={1} className="mt-4 px-5 py-5">
        <div className="flex items-center justify-between">
          <CardTitle>24h · indoor / outdoor / humidity</CardTitle>
          <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-[1.4px] w-4 bg-[var(--color-warn)]" />
              Indoor
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-[1.4px] w-4 bg-[var(--color-fg-muted)] [border-top:1px_dashed]" />
              Outdoor
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-4 rounded-sm"
                style={{ backgroundColor: "color-mix(in oklch, var(--color-grid) 40%, transparent)" }}
              />
              Humidity
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-4 rounded-sm"
                style={{ backgroundColor: "color-mix(in oklch, var(--color-ok) 20%, transparent)" }}
              />
              Comfort band
            </span>
          </div>
        </div>
        <div className="mt-4">
          <EnvDayChart height={280} />
        </div>
      </Card>
    </div>
  );
}

function EnvKpi({
  label,
  display,
  unit,
  context,
  Icon,
  tone,
  spark,
}: {
  label: string;
  display: React.ReactNode;
  unit: string;
  context: string;
  Icon: typeof Thermometer;
  tone: "warn" | "grid" | "ok" | "signal";
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
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
            {unit}
          </span>
        </div>
        <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-muted)]">
          {context}
        </p>
      </div>
    </Card>
  );
}

function AnomalyIcon({ kind }: { kind: "temp" | "humid" | "cold" }) {
  if (kind === "humid") {
    return <Droplet size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[var(--color-grid)]" />;
  }
  if (kind === "cold") {
    return <Snowflake size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[var(--color-grid)]" />;
  }
  return <Thermometer size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[var(--color-warn)]" />;
}

function statusFor(
  deviationC: number,
  humidity: number,
): { label: string; tone: "ok" | "warn" | "danger" | "neutral" } {
  if (Math.abs(deviationC) >= 5) return { label: "Critical", tone: "danger" };
  if (Math.abs(deviationC) >= 3) return { label: "Warm", tone: "warn" };
  if (humidity > 0.85) return { label: "Humid", tone: "warn" };
  return { label: "Nominal", tone: "ok" };
}
