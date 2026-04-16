"use client";

import { useMemo } from "react";
import { Battery, Sun } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { CardTitle } from "@/components/primitives/CardTitle";
import { Pill } from "@/components/primitives/Pill";
import { StoryStrip } from "@/components/primitives/StoryStrip";
import { EnergyFlowDiagram } from "@/components/power/EnergyFlowDiagram";
import { BatteryGauge } from "@/components/power/BatteryGauge";
import { SolarPanelStatus } from "@/components/power/SolarPanelStatus";
import { PowerLoadCurve } from "@/components/power/PowerLoadCurve";
import {
  currentPowerFlow,
  batterySocHourly,
  kpiSnapshot,
} from "@/lib/mock/telemetry";
import { kw } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function PowerPage() {
  const flow = useMemo(() => currentPowerFlow(), []);
  const socHourly = useMemo(() => batterySocHourly(), []);
  const snap = useMemo(() => kpiSnapshot(), []);

  // Derive current PHT hour for the SolarPanelStatus day/night rendering.
  const hourPht = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("en-PH", {
      timeZone: "Asia/Manila",
      hour: "2-digit",
      hour12: false,
    });
    return Number(fmt.format(new Date()));
  }, []);

  const tariffLabel =
    hourPht >= 10 && hourPht < 18
      ? "peak"
      : hourPht >= 6 && hourPht < 10
        ? "morning shoulder"
        : "off-peak";

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="03" label="Hybrid power flow" />
        <div className="flex items-center gap-2">
          <Pill tone={flow.solarKw > 0 ? "solar" : "neutral"} pulse={flow.solarKw > 0}>
            Solar {flow.solarKw > 0 ? "online" : "offline"}
          </Pill>
          <Pill tone="grid">Grid {flow.gridImportKw > 0.1 ? "draw" : "idle"}</Pill>
        </div>
      </div>

      {/* Plain-English intro */}
      <StoryStrip
        className="mt-5"
        eyebrow="Right now"
        headline={
          <>
            Solar is producing{" "}
            <span className="font-mono tabular-nums text-[var(--color-solar)]">
              {flow.solarKw.toFixed(1)} kW
            </span>{" "}
            — covering{" "}
            <span className="font-mono tabular-nums text-[var(--color-solar)]">
              {percentShare(flow.solarKw, flow.campusLoadKw)}%
            </span>{" "}
            of campus load. Battery at{" "}
            <span className="font-mono tabular-nums text-[var(--color-ok)]">
              {Math.round(flow.batterySoc * 100)}%
            </span>
            ; {tariffLabel} tariff active.
          </>
        }
        detail="Flow diagram below is live — each line's speed scales with the transfer. Zero flow renders dark."
        stats={[
          { label: "Grid", value: kw(flow.gridImportKw), tone: "grid" },
          { label: "Battery", value: `${flow.batteryKw >= 0 ? "+" : ""}${flow.batteryKw.toFixed(1)} kW`, tone: flow.batteryKw >= 0 ? "ok" : "warn" },
          { label: "Load", value: kw(flow.campusLoadKw), tone: "signal" },
        ]}
      />

      {/* Row 2 — Energy Flow Diagram (hero) */}
      <div className="mt-4">
        <EnergyFlowDiagram flow={flow} />
      </div>

      {/* Row 3 — Battery (5-col) + Solar (7-col) */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card surface={1} className="omni-live xl:col-span-5 px-6 py-6">
          <div className="flex items-center justify-between">
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Battery size={14} strokeWidth={1.5} className="text-[var(--color-ok)]" />
                Battery storage
              </span>
            </CardTitle>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              {formatCharge(flow.batterySoc, flow.batteryCapacityKwh)}
            </span>
          </div>

          <div className="mt-5">
            <BatteryGauge
              soc={flow.batterySoc}
              capacityKwh={flow.batteryCapacityKwh}
              kw={flow.batteryKw}
              hourly={socHourly}
            />
          </div>
        </Card>

        <Card surface={1} className="xl:col-span-7 px-6 py-6">
          <div className="flex items-center justify-between">
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Sun size={14} strokeWidth={1.5} className="text-[var(--color-solar)]" />
                Solar roof status
              </span>
            </CardTitle>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              1.42 MW peak rating
            </span>
          </div>

          <div className="mt-5">
            <SolarPanelStatus hourPht={hourPht} />
          </div>
        </Card>
      </div>

      {/* Row 4 — Load curve with battery band */}
      <Card surface={1} className="mt-4 omni-live px-6 py-5">
        <div className="flex items-center justify-between">
          <CardTitle>Today · load, solar & battery</CardTitle>
          <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            <LegendDot color="var(--color-grid)" label="Grid" />
            <LegendDot color="var(--color-solar)" label="Solar" />
            <LegendDot color="var(--color-ok)" label="Batt charge" />
            <LegendDot color="var(--color-warn)" label="Batt disch" />
          </div>
        </div>
        <div className="mt-3">
          <PowerLoadCurve height={280} />
        </div>
      </Card>

      {/* Tariff strip */}
      <Card surface={1} className="mt-4 px-6 py-5">
        <div className="flex items-center justify-between">
          <CardTitle>Tariff</CardTitle>
          <Pill tone={tariffLabel === "peak" ? "warn" : "ok"}>
            {tariffLabel === "peak" ? "Peak window" : "Off-peak"}
          </Pill>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
          <TariffStop t="00–06" rate={9.4} active={hourPht < 6} />
          <TariffStop t="06–10" rate={11.2} active={hourPht >= 6 && hourPht < 10} />
          <TariffStop t="10–18" rate={14.6} active={hourPht >= 10 && hourPht < 18} />
          <TariffStop t="18–24" rate={12.8} active={hourPht >= 18} />
        </div>
      </Card>

      <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        OBSERVED · {snap.currentLoadKw.toFixed(0)} kW campus load · reseeds every
        hour
      </p>
    </div>
  );
}

function percentShare(a: number, b: number): number {
  if (b <= 0) return 0;
  return Math.round((a / b) * 100);
}

function formatCharge(soc: number, cap: number): string {
  return `${(soc * cap).toFixed(0)} / ${cap.toFixed(0)} kWh`;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function TariffStop({
  t,
  rate,
  active,
}: {
  t: string;
  rate: number;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border px-4 py-3",
        active
          ? "border-[var(--color-warn)] bg-[color-mix(in_oklch,var(--color-warn)_8%,transparent)]"
          : "border-[var(--color-border)]",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] text-[var(--color-fg-subtle)] tabular-nums">
          {t}
        </span>
        {active && <Pill tone="warn">active</Pill>}
      </div>
      <p className="mt-2 font-mono text-[18px] tabular-nums text-[var(--color-fg)]">
        ₱{rate.toFixed(2)}
        <span className="ml-1 text-[10px] text-[var(--color-fg-subtle)]">/kWh</span>
      </p>
    </div>
  );
}
