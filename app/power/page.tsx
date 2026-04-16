"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Battery, Wind } from "lucide-react";
import { Card } from "@/components/primitives/Card";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { CardTitle } from "@/components/primitives/CardTitle";
import { Pill } from "@/components/primitives/Pill";
import { NumberFlow } from "@/components/primitives/NumberFlow";
import { Sparkline } from "@/components/primitives/Sparkline";
import { RadialGauge } from "@/components/primitives/RadialGauge";
import { StoryStrip } from "@/components/primitives/StoryStrip";
import { kpiSnapshot, todayLoadCurve, currentSlotIndex } from "@/lib/mock/telemetry";
import { kw } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const SolarSun = dynamic(() => import("@/components/three/SolarSun").then((m) => m.SolarSun), {
  ssr: false,
  loading: () => null,
});

export default function PowerPage() {
  const snap = useMemo(() => kpiSnapshot(), []);
  const curve = useMemo(() => todayLoadCurve(), []);
  const idx = useMemo(() => currentSlotIndex(), []);

  const todaySolarKwh = curve.slice(0, idx + 1).reduce((s, p) => s + p.solar, 0) / 12;
  const consumedKwh = curve.slice(0, idx + 1).reduce((s, p) => s + p.total, 0) / 12;
  const storedKwh = Math.max(0, todaySolarKwh * 0.18);
  const sparkSolar = curve.slice(Math.max(0, idx - 23), idx + 1).map((p) => p.solar);
  const sparkConsumed = curve.slice(Math.max(0, idx - 23), idx + 1).map((p) => p.total);

  // Plain-English summary numbers used in the StoryStrip
  const peakSlot = curve.reduce((best, p, i) => (p.solar > curve[best].solar ? i : best), 0);
  const peakLabel = curve[peakSlot].label;
  const tariffLabel = idx >= 60 && idx < 216 ? "peak" : idx >= 36 && idx < 60 ? "morning shoulder" : "off-peak";

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="03" label="Hybrid power" />
        <Pill tone="solar">Solar online</Pill>
      </div>

      {/* Story strip */}
      <StoryStrip
        className="mt-5"
        eyebrow="Today's story"
        headline={
          <>
            Solar produced{" "}
            <span className="font-mono tabular-nums text-[var(--color-solar)]">
              {Math.round(todaySolarKwh)} kWh
            </span>{" "}
            so far — covered{" "}
            <span className="font-mono tabular-nums text-[var(--color-solar)]">
              {(snap.solarSharePct * 100).toFixed(0)}%
            </span>{" "}
            of campus demand. Peak yield at {peakLabel}; {tariffLabel} tariff active.
          </>
        }
        detail="The two cards below are live: stored power feeds the vault, consumed power leaves the meter. Mix gauge shows the right-now ratio."
        stats={[
          { label: "Stored", value: `${storedKwh.toFixed(1)} kWh`, tone: "solar" },
          { label: "Consumed", value: `${Math.round(consumedKwh)} kWh`, tone: "grid" },
          { label: "Now", value: kw(snap.currentLoadKw), tone: "signal" },
        ]}
      />

      {/* Hero — twin oversized cards + R3F sun */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <HeroCard
          className="xl:col-span-5"
          title="Power stored"
          icon={<Battery size={14} strokeWidth={1.5} className="text-[var(--color-solar)]" />}
          value={storedKwh}
          unit="kWh"
          spark={sparkSolar}
          sparkColor="var(--color-solar)"
          progress={storedKwh / 480}
          progressTone="solar"
          footLeft="Vault capacity · 480 kWh"
          footRight={`${((storedKwh / 480) * 100).toFixed(1)}% full`}
        />

        <HeroCard
          className="xl:col-span-5"
          title="Power consumed today"
          icon={<Wind size={14} strokeWidth={1.5} className="text-[var(--color-grid)]" />}
          value={consumedKwh}
          decimals={0}
          unit="kWh"
          spark={sparkConsumed}
          sparkColor="var(--color-grid)"
          progress={Math.min(1, snap.currentLoadKw / 1500)}
          progressTone="grid"
          footLeft={`Current draw · ${kw(snap.currentLoadKw)}`}
          footRight={`Δ vs ystd ${(((snap.currentLoadKw - snap.yesterdayLoadKw) / snap.yesterdayLoadKw) * 100).toFixed(1)}%`}
        />

        <Card surface={1} className="xl:col-span-2 grid place-items-center px-3 py-6">
          <SolarSun size={220} />
          <div className="mt-2 text-center">
            <p className="text-[12px] font-medium text-[var(--color-fg)]">Solar roof</p>
            <p className="mt-1 font-mono text-[10px] text-[var(--color-fg-subtle)] tabular-nums">
              ONLINE · 1.42 MW
            </p>
          </div>
        </Card>
      </div>

      {/* Mix gauge + sub-panels */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card surface={1} className="xl:col-span-5 flex flex-col items-center px-6 py-6">
          <CardTitle className="self-start">Right-now mix</CardTitle>
          <RadialGauge
            solarShare={snap.solarSharePct}
            size={300}
            centerValue={`${(snap.solarSharePct * 100).toFixed(0)}%`}
            centerUnit="SOLAR SHARE"
          />
          <div className="mt-2 grid w-full grid-cols-2 gap-4">
            <MixStat label="Solar" value={kw(snap.currentLoadKw * snap.solarSharePct)} tone="solar" />
            <MixStat label="Grid" value={kw(snap.currentLoadKw * (1 - snap.solarSharePct))} tone="grid" />
          </div>
        </Card>

        <Card surface={1} className="xl:col-span-7 px-6 py-6">
          <CardTitle>Solar roof status</CardTitle>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <RoofMetric label="Cleaning cycle" value={68} suffix="%" detail="Next pass · 18:30" ringTone="signal" />
            <RoofMetric label="Panel tilt" value={28} suffix="°" detail="Tracker · auto" ringTone="solar" />
            <RoofMetric label="Yield today" value={Math.round(todaySolarKwh)} suffix="kWh" detail="Forecast +6.4%" ringTone="ok" />
          </div>

          <div className="mt-6 border-t border-[var(--color-border)] pt-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 text-[12px] text-[var(--color-fg-muted)]">
              <DetailRow label="Last cleaned" value="14 Apr · 04:12" />
              <DetailRow label="Inverter health" value="OK · 99.4%" />
              <DetailRow label="DC string check" value="OK · 24/24" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tariff strip */}
      <Card surface={1} className="mt-4 px-6 py-5">
        <div className="flex items-center justify-between">
          <CardTitle>Tariff</CardTitle>
          <Pill tone="ok">Peak window over</Pill>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-4">
          <TariffStop t="00–06" rate={9.4} />
          <TariffStop t="06–10" rate={11.2} />
          <TariffStop t="10–18" rate={14.6} active />
          <TariffStop t="18–24" rate={12.8} />
        </div>
      </Card>
    </div>
  );
}

function HeroCard({
  className,
  title,
  icon,
  value,
  decimals = 1,
  unit,
  spark,
  sparkColor,
  progress,
  progressTone,
  footLeft,
  footRight,
}: {
  className?: string;
  title: string;
  icon: React.ReactNode;
  value: number;
  decimals?: number;
  unit: string;
  spark: number[];
  sparkColor: string;
  progress: number;
  progressTone: "solar" | "grid";
  footLeft: string;
  footRight: string;
}) {
  return (
    <Card surface={1} className={cn("omni-live px-7 py-6", className)}>
      <div className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {icon}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="mt-6 flex items-baseline gap-3"
      >
        <NumberFlow
          value={value}
          format={{ maximumFractionDigits: decimals, minimumFractionDigits: decimals }}
          className="font-serif italic leading-none text-[var(--color-fg)]"
        />
        <span className="font-mono text-[12px] text-[var(--color-fg-subtle)] tabular-nums">{unit}</span>
      </motion.div>

      <div className="mt-4 flex items-end justify-between gap-6">
        <div style={{ color: sparkColor }}>
          <Sparkline values={spark} stroke="currentColor" width={180} height={42} />
        </div>
        <div className="text-right text-[11px] text-[var(--color-fg-muted)]">
          <p className="text-[var(--color-fg-subtle)]">{footLeft}</p>
          <p className="mt-0.5 tabular-nums">{footRight}</p>
        </div>
      </div>

      <ProgressBar value={progress} tone={progressTone} className="mt-3" />
    </Card>
  );
}

function MixStat({ label, value, tone }: { label: string; value: string; tone: "solar" | "grid" }) {
  const color = tone === "solar" ? "var(--color-solar)" : "var(--color-grid)";
  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius-sm)] border p-3" style={{ borderColor: "var(--color-border)" }}>
      <span className="text-[11px] text-[var(--color-fg-subtle)]">{label}</span>
      <span className="font-mono text-[14px] tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

function ProgressBar({ value, tone, className }: { value: number; tone: "solar" | "grid"; className?: string }) {
  const color = tone === "solar" ? "var(--color-solar)" : "var(--color-grid)";
  return (
    <div className={cn("h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]", className)}>
      <motion.div
        className="h-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(1, Math.max(0, value)) * 100}%` }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function RoofMetric({
  label,
  value,
  suffix,
  detail,
  ringTone,
}: {
  label: string;
  value: number;
  suffix: string;
  detail: string;
  ringTone: "signal" | "solar" | "ok";
}) {
  const max = suffix === "%" ? 100 : suffix === "°" ? 60 : 600;
  const t = Math.min(1, value / max);
  const stroke =
    ringTone === "signal" ? "var(--color-signal)" : ringTone === "solar" ? "var(--color-solar)" : "var(--color-ok)";
  const SIZE = 96;
  const r = 38;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-sm)] border p-4" style={{ borderColor: "var(--color-border)" }}>
      <div className="relative grid place-items-center">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="var(--color-surface-3)" strokeWidth={3} />
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - t) }}
            transition={{ duration: 0.92, ease: [0.22, 1, 0.36, 1] }}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>
        <span className="absolute font-mono text-[16px] tabular-nums text-[var(--color-fg)]">{value}</span>
      </div>
      <div>
        <p className="text-[11px] text-[var(--color-fg-subtle)]">{label}</p>
        <p className="mt-1 font-mono text-[13px] text-[var(--color-fg)] tabular-nums">{value}{suffix}</p>
        <p className="mt-1 text-[10px] text-[var(--color-fg-subtle)]">{detail}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--color-fg-subtle)]">{label}</p>
      <p className="mt-0.5 font-mono text-[var(--color-fg)] tabular-nums">{value}</p>
    </div>
  );
}

function TariffStop({ t, rate, active }: { t: string; rate: number; active?: boolean }) {
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
        <span className="font-mono text-[11px] text-[var(--color-fg-subtle)] tabular-nums">{t}</span>
        {active && <Pill tone="warn">peak</Pill>}
      </div>
      <p className="mt-2 font-mono text-[18px] tabular-nums text-[var(--color-fg)]">
        ₱{rate.toFixed(2)}
        <span className="ml-1 text-[10px] text-[var(--color-fg-subtle)]">/kWh</span>
      </p>
    </div>
  );
}
