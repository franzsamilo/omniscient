"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Lightbulb, Plug, Snowflake, Wind, Droplets, GaugeCircle, BatteryCharging } from "lucide-react";
import { notFound } from "next/navigation";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Card } from "@/components/primitives/Card";
import { Pill } from "@/components/primitives/Pill";
import { Toggle } from "@/components/primitives/Toggle";
import { Sparkline } from "@/components/primitives/Sparkline";
import { NumberFlow } from "@/components/primitives/NumberFlow";
import { getBuilding } from "@/lib/mock/buildings";
import { devicesForBuilding, type DeviceKind } from "@/lib/mock/devices";
import { useControls } from "@/lib/stores/useControls";
import { streamRng, range } from "@/lib/mock/seed";
import { kw, tempC, humidity, pad, time } from "@/lib/utils/format";
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

type Room = {
  id: string;
  code: string;
  kw: number;
  temp: number;
  humid: number;
  occupancy: number;
};

function makeRooms(buildingId: number): Room[] {
  const rng = streamRng(`rooms:${buildingId}`);
  const count = 8 + Math.floor(rng() * 14);
  const floors = ["GF", "1F", "2F", "3F", "4F"];
  const rooms: Room[] = [];
  for (let i = 0; i < count; i++) {
    const floor = floors[Math.min(floors.length - 1, Math.floor(i / 6))];
    rooms.push({
      id: `R-${buildingId}-${i}`,
      code: `${floor}-${100 + i}`,
      kw: round1(range(rng, 0.6, 9.5)),
      temp: round1(range(rng, 23, 29)),
      humid: round1(range(rng, 48, 78)),
      occupancy: rng() < 0.18 ? 0 : Math.floor(range(rng, 1, 28)),
    });
  }
  return rooms;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function miniSeries(seed: string, count = 24): number[] {
  const rng = streamRng(seed);
  return Array.from({ length: count }, (_, i) => 4 + Math.sin(i / 3) * 2 + rng() * 1.5);
}

export default function BuildingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const numId = Number(id);
  const building = Number.isFinite(numId) ? getBuilding(numId) : undefined;
  if (!building) notFound();

  const rooms = useMemo(() => makeRooms(building.id), [building.id]);
  const [selectedId, setSelectedId] = useState(rooms[0]?.id);
  const selected = rooms.find((r) => r.id === selectedId) ?? rooms[0];

  const devices = useMemo(() => devicesForBuilding(building.id), [building.id]);
  const buildingTotalKw = rooms.reduce((s, r) => s + r.kw, 0);
  const occupiedRooms = rooms.filter((r) => r.occupancy > 0).length;

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-6 pt-5 pb-4">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index={pad(building.id, 2)} label={`Building · ${building.name}`} />
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          <Pill tone="signal">{building.category}</Pill>
          <Pill tone="ok">{occupiedRooms}/{rooms.length} OCCUPIED</Pill>
          <Link href="/map" className="inline-flex items-center gap-1 hover:text-[var(--color-signal)]">
            <ArrowLeft size={11} strokeWidth={1.6} /> Back to map
          </Link>
        </div>
      </div>

      {/* Hero strip — building totals */}
      <Card surface={1} className="mt-5 px-6 py-5">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          <Headline label="Right-now load" value={kw(buildingTotalKw)} unit="kW" series={miniSeries(`b-${building.id}-load`)} tone="signal" />
          <Headline label="Baseline" value={kw(building.baselineKw)} unit="kW" series={miniSeries(`b-${building.id}-base`)} tone="grid" />
          <Headline label="Average temp" value={tempC(rooms.reduce((s, r) => s + r.temp, 0) / rooms.length)} unit="°C" series={miniSeries(`b-${building.id}-temp`)} tone="warn" />
          <Headline label="Devices" value={String(devices.length)} unit="DEV" series={miniSeries(`b-${building.id}-dev`, 12)} tone="ok" />
        </div>
      </Card>

      {/* Split layout */}
      <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Rooms list */}
        <Card surface={1} className="xl:col-span-4 flex flex-col overflow-hidden p-0">
          <div className="border-b border-[var(--color-border)] px-5 py-3">
            <SectionHeader index="R" label={`Rooms · ${rooms.length}`} />
          </div>
          <ul className="flex-1 overflow-y-auto">
            {rooms.map((r) => {
              const active = selectedId === r.id;
              const dot =
                r.occupancy === 0
                  ? "bg-[var(--color-fg-subtle)]"
                  : r.occupancy > 12
                    ? "bg-[var(--color-warn)]"
                    : "bg-[var(--color-ok)]";
              return (
                <li key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      "group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-2.5 text-left",
                      "transition-colors duration-150",
                      active
                        ? "bg-[color-mix(in_oklch,var(--color-signal)_14%,transparent)] text-[var(--color-signal)]"
                        : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", dot)} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium font-mono tabular-nums">{r.code}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
                        {r.occupancy === 0 ? "Empty" : `${r.occupancy} present`}
                      </p>
                    </div>
                    <div className="text-right font-mono text-[11px] tabular-nums text-[var(--color-fg-muted)]">
                      <p>{kw(r.kw)}</p>
                      <p className="text-[10px] text-[var(--color-fg-subtle)]">{tempC(r.temp)}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Room detail */}
        <Card surface={1} className="xl:col-span-8 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                ROOM · BLDG {pad(building.id)}
              </p>
              <p className="mt-0.5 font-serif italic text-[24px] text-[var(--color-fg)]">
                {selected.code}
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              <Pill tone={selected.occupancy > 12 ? "warn" : selected.occupancy > 0 ? "ok" : "neutral"}>
                {selected.occupancy === 0 ? "Empty" : `${selected.occupancy} present`}
              </Pill>
              <span>Updated {time(new Date())}</span>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto p-5 lg:grid-cols-4">
            <RoomMetric label="Power" value={kw(selected.kw)} accent="var(--color-signal)" series={miniSeries(`r-${selected.id}-p`)} />
            <RoomMetric label="Temp" value={tempC(selected.temp)} accent="var(--color-warn)" series={miniSeries(`r-${selected.id}-t`)} />
            <RoomMetric label="Humidity" value={humidity(selected.humid)} accent="var(--color-grid)" series={miniSeries(`r-${selected.id}-h`)} />
            <RoomMetric label="Water" value="0.42 L/s" accent="var(--color-ok)" series={miniSeries(`r-${selected.id}-w`)} />
          </div>

          <div className="border-t border-[var(--color-border)] px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              Devices · {devices.length}
            </p>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {devices.slice(0, 6).map((d) => (
                <DeviceTile key={d.id} id={d.id} kind={d.kind} room={d.room} />
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Headline({
  label,
  value,
  unit,
  series,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  series: number[];
  tone: "signal" | "grid" | "warn" | "ok";
}) {
  const colors = {
    signal: "var(--color-signal)",
    grid: "var(--color-grid)",
    warn: "var(--color-warn)",
    ok: "var(--color-ok)",
  } as const;
  return (
    <div>
      <p className="text-[11px] text-[var(--color-fg-subtle)]">{label}</p>
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        className="mt-1 font-mono text-[22px] tabular-nums text-[var(--color-fg)]"
      >
        {value}
      </motion.p>
      <div className="mt-2 -ml-1" style={{ color: colors[tone] }}>
        <Sparkline values={series} stroke="currentColor" width={120} height={24} />
      </div>
    </div>
  );
}

function RoomMetric({
  label,
  value,
  accent,
  series,
}: {
  label: string;
  value: string;
  accent: string;
  series: number[];
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border p-4" style={{ borderColor: "var(--color-border)" }}>
      <p className="text-[11px] text-[var(--color-fg-subtle)]">{label}</p>
      <p className="mt-1 font-mono text-[16px] tabular-nums text-[var(--color-fg)]">{value}</p>
      <div className="mt-2" style={{ color: accent }}>
        <Sparkline values={series} stroke="currentColor" />
      </div>
    </div>
  );
}

function DeviceTile({ id, kind, room }: { id: string; kind: DeviceKind; room: string }) {
  const state = useControls((s) => s.devices[id]);
  const toggle = useControls((s) => s.toggle);
  const Icon = KIND_ICON[kind];
  return (
    <div
      className="flex items-center gap-3 rounded-[var(--radius-sm)] border px-3 py-2"
      style={{ borderColor: "var(--color-border)" }}
    >
      <span className="grid size-7 place-items-center rounded-[4px] border border-[var(--color-border)] text-[var(--color-fg-muted)]">
        <Icon size={13} strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[var(--color-fg)]">{KIND_LABEL[kind]}</p>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">{room}</p>
      </div>
      <Toggle on={!!state?.on} onToggle={() => toggle(id)} size="sm" />
    </div>
  );
}
