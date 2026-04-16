"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Lightbulb,
  Plug,
  Snowflake,
  Wind,
  Droplets,
  GaugeCircle,
  BatteryCharging,
  ShieldCheck,
} from "lucide-react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Pill } from "@/components/primitives/Pill";
import { Card } from "@/components/primitives/Card";
import { Toggle } from "@/components/primitives/Toggle";
import { SegmentedControl } from "@/components/primitives/SegmentedControl";
import { DEVICES, devicesForBuilding, type DeviceKind } from "@/lib/mock/devices";
import { BUILDINGS } from "@/lib/mock/buildings";
import { useControls, type MasterMode } from "@/lib/stores/useControls";
import { pad } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const KIND_ICON: Record<DeviceKind, typeof Lightbulb> = {
  lights: Lightbulb,
  outlets: Plug,
  ac: Snowflake,
  fans: Wind,
  valve: Droplets,
  pump: GaugeCircle,
  ev: BatteryCharging,
};

const KIND_LABEL: Record<DeviceKind, string> = {
  lights: "Lights",
  outlets: "Outlets",
  ac: "AC",
  fans: "Vent",
  valve: "Valve",
  pump: "Pump",
  ev: "EV",
};

const MASTER_OPTS: Array<{ value: MasterMode; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "semi-auto", label: "Semi-auto" },
  { value: "manual", label: "Manual" },
];

const MASTER_TONE: Record<MasterMode, string> = {
  auto: "var(--color-signal)",
  "semi-auto": "var(--color-warn)",
  manual: "var(--color-danger)",
};

const TOP_BUILDINGS = 16; // group by first N buildings (others available via filter)

export default function ControlsPage() {
  const master = useControls((s) => s.master);
  const setMaster = useControls((s) => s.setMaster);
  const drillActive = useControls((s) => s.drillActive);
  const [filterKind, setFilterKind] = useState<"all" | DeviceKind>("all");
  const [washTick, setWashTick] = useState(0);

  // Trigger color wash on master change
  useEffect(() => {
    setWashTick((t) => t + 1);
  }, [master]);

  const buildingsToShow = useMemo(() => {
    return BUILDINGS.slice(0, TOP_BUILDINGS).filter((b) => devicesForBuilding(b.id).length > 0);
  }, []);

  const totals = useMemo(() => {
    const all = DEVICES.length;
    const offline = useControls.getState().devices;
    let on = 0;
    let overrides = 0;
    for (const d of DEVICES) {
      const s = offline[d.id];
      if (s?.on) on++;
      if (s?.manualOverrideUntil) overrides++;
    }
    return { all, on, overrides };
  }, [drillActive]); // recompute on drill

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      {/* color wash on mode change */}
      <AnimatePresence>
        <motion.div
          key={washTick}
          className="pointer-events-none fixed inset-0 z-[5]"
          style={{ background: MASTER_TONE[master] }}
          initial={{ opacity: 0.18 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="04" label="Equipment console" />
        <div className="flex items-center gap-3">
          {drillActive && <Pill tone="danger" pulse>Drill in progress</Pill>}
          <Pill tone="signal">{totals.on} / {totals.all} ON</Pill>
        </div>
      </div>

      {/* Master mode + summary */}
      <Card surface={1} className="mt-5 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-[var(--color-fg-subtle)]">Master mode</p>
            <h2 className="mt-1 text-[20px] font-medium leading-none text-[var(--color-fg)]">
              {master === "auto" ? "Auto" : master === "semi-auto" ? "Semi-auto" : "Manual"}
            </h2>
            <p className="mt-1.5 text-[12px] text-[var(--color-fg-muted)]">
              {master === "auto" && "AI runs the campus. Overrides snap back in 30 min."}
              {master === "semi-auto" && "AI suggests, you confirm. Schedules still active."}
              {master === "manual" && "All automation paused. You control everything."}
            </p>
          </div>

          <SegmentedControl
            value={master}
            onChange={(v) => setMaster(v)}
            options={MASTER_OPTS}
            size="lg"
          />

          <div className="grid grid-cols-3 gap-5">
            <Stat label="Devices" value={totals.all} />
            <Stat label="Online" value={totals.on} tone="signal" />
            <Stat label="Overrides" value={totals.overrides} tone={totals.overrides ? "warn" : "neutral"} />
          </div>
        </div>
      </Card>

      {/* Filter chips */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="text-[var(--color-fg-subtle)]">Filter</span>
        <FilterChip active={filterKind === "all"} onClick={() => setFilterKind("all")} label="All" />
        {(Object.keys(KIND_LABEL) as DeviceKind[]).map((k) => (
          <FilterChip
            key={k}
            active={filterKind === k}
            onClick={() => setFilterKind(k)}
            label={KIND_LABEL[k]}
            Icon={KIND_ICON[k]}
          />
        ))}
      </div>

      {/* Building groups */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {buildingsToShow.map((b, gi) => (
          <BuildingGroup key={b.id} buildingId={b.id} name={b.name} index={gi} filterKind={filterKind} />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "signal" | "warn" | "neutral" }) {
  const color =
    tone === "signal"
      ? "var(--color-signal)"
      : tone === "warn"
        ? "var(--color-warn)"
        : "var(--color-fg)";
  return (
    <div className="text-right">
      <p className="text-[11px] text-[var(--color-fg-subtle)]">{label}</p>
      <p className="mt-1 font-mono text-[18px] tabular-nums" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  Icon?: typeof Lightbulb;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 transition-colors",
        active
          ? "border-[var(--color-signal)] bg-[color-mix(in_oklch,var(--color-signal)_14%,transparent)] text-[var(--color-signal)]"
          : "border-[var(--color-border)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:border-[var(--color-border-strong)]",
      )}
    >
      {Icon && <Icon size={11} strokeWidth={1.5} />}
      <span>{label}</span>
    </button>
  );
}

function BuildingGroup({
  buildingId,
  name,
  index,
  filterKind,
}: {
  buildingId: number;
  name: string;
  index: number;
  filterKind: "all" | DeviceKind;
}) {
  const devices = useMemo(() => devicesForBuilding(buildingId), [buildingId]);
  const visible = useMemo(
    () => (filterKind === "all" ? devices : devices.filter((d) => d.kind === filterKind)),
    [devices, filterKind],
  );

  return (
    <Card surface={1} className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
        <div>
          <p className="font-mono text-[10px] text-[var(--color-fg-subtle)] tabular-nums">
            BLDG {pad(buildingId)}
          </p>
          <Link
            href={`/building/${buildingId}`}
            className="mt-0.5 block text-[13px] font-medium text-[var(--color-fg)] hover:text-[var(--color-signal)]"
          >
            {name}
          </Link>
        </div>
        <Pill tone="signal">{visible.length} dev</Pill>
      </div>

      <ul className="divide-y divide-[var(--color-border)]">
        {visible.length === 0 && (
          <li className="px-5 py-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
            No {filterKind === "all" ? "devices" : KIND_LABEL[filterKind].toLowerCase()} in this building.
          </li>
        )}
        {visible.map((d, i) => (
          <DeviceRow key={d.id} id={d.id} kind={d.kind} room={d.room} critical={d.critical} delay={index * 0.04 + i * 0.02} />
        ))}
      </ul>
    </Card>
  );
}

function DeviceRow({
  id,
  kind,
  room,
  critical,
  delay,
}: {
  id: string;
  kind: DeviceKind;
  room: string;
  critical: boolean;
  delay: number;
}) {
  const state = useControls((s) => s.devices[id]);
  const toggle = useControls((s) => s.toggle);
  const Icon = KIND_ICON[kind];
  const overrideMs = state?.manualOverrideUntil ? Math.max(0, state.manualOverrideUntil - Date.now()) : 0;

  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[color-mix(in_oklch,var(--color-surface-2)_92%,var(--color-signal)_8%)]"
    >
      <span
        className={cn(
          "grid size-8 place-items-center rounded-[var(--radius-sm)] border",
          "border-[var(--color-border)] text-[var(--color-fg-muted)]",
        )}
      >
        <Icon size={14} strokeWidth={1.5} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[13px] font-medium text-[var(--color-fg)]">{KIND_LABEL[kind]}</p>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
            {room}
          </span>
          {critical && <Pill tone="warn">Critical</Pill>}
        </div>
        {overrideMs > 0 && (
          <p className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-warn)]">
            <ShieldCheck size={9} strokeWidth={1.6} />
            Manual override · auto-revert {Math.ceil(overrideMs / 60_000)}m
          </p>
        )}
      </div>

      <Toggle
        on={!!state?.on}
        onToggle={() => toggle(id)}
        tone={critical ? "warn" : "signal"}
        label={`${KIND_LABEL[kind]} ${room}`}
      />
    </motion.li>
  );
}
