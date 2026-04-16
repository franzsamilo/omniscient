"use client";

/**
 * /controls — CLAUDE-UPDATES PATCH 2.
 *
 * Three-level drill: Building cards → Floor → Rooms / devices.
 * Selected building expands via shared `layoutId` so the card appears to
 * zoom into the detail header.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import {
  ArrowLeft,
  Lightbulb,
  Plug,
  Snowflake,
  Wind,
  Droplets,
  GaugeCircle,
  BatteryCharging,
  Search,
  Thermometer,
} from "lucide-react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Pill } from "@/components/primitives/Pill";
import { Card } from "@/components/primitives/Card";
import { Toggle } from "@/components/primitives/Toggle";
import { SegmentedControl } from "@/components/primitives/SegmentedControl";
import { DEVICES, devicesForBuilding, type DeviceKind } from "@/lib/mock/devices";
import { BUILDINGS, getBuilding } from "@/lib/mock/buildings";
import { useControls, type MasterMode } from "@/lib/stores/useControls";
import { environmentReadings } from "@/lib/mock/telemetry";
import { useNow } from "@/hooks/useNow";
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
  fans: "Fan",
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

/** Left-edge accent per building category — gives the cards visual rhythm. */
function categoryAccent(cat: string): string {
  switch (cat) {
    case "academic":    return "var(--color-signal)";
    case "admin":       return "var(--color-grid)";
    case "residential": return "var(--color-ok)";
    case "sports":      return "var(--color-solar)";
    case "dining":      return "var(--color-warn)";
    case "utility":     return "var(--color-danger)";
    case "worship":     return "var(--color-seismic)";
    default:            return "var(--color-fg-subtle)";
  }
}

type Filter = "all" | "flagged" | "manual" | "high";

export default function ControlsPage() {
  const master = useControls((s) => s.master);
  const setMaster = useControls((s) => s.setMaster);
  const drillActive = useControls((s) => s.drillActive);
  const devicesByBldg = useControls((s) => s.devices);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<"default" | "kw" | "name" | "active">("default");

  // Precompute per-building stats once; cheap for 101 buildings.
  const bldgStats = useMemo(() => {
    const out: Record<number, { total: number; active: number; overrides: number; kw: number }> = {};
    for (const b of BUILDINGS) {
      out[b.id] = { total: 0, active: 0, overrides: 0, kw: 0 };
    }
    for (const d of DEVICES) {
      const s = devicesByBldg[d.id];
      const bucket = out[d.buildingId];
      if (!bucket) continue;
      bucket.total++;
      if (s?.on) bucket.active++;
      if (s?.manualOverrideUntil) bucket.overrides++;
    }
    for (const b of BUILDINGS) {
      const stats = out[b.id];
      // Synthetic kW estimate — active share × baseline.
      const share = stats.total > 0 ? stats.active / stats.total : 0;
      stats.kw = Math.round(b.baselineKw * (0.4 + share * 0.8) * 10) / 10;
    }
    return out;
  }, [devicesByBldg]);

  const buildingsWithDevices = useMemo(
    () => BUILDINGS.filter((b) => bldgStats[b.id].total > 0),
    [bldgStats],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = buildingsWithDevices.filter((b) => {
      if (q && !b.name.toLowerCase().includes(q) && !String(b.id).includes(q)) return false;
      const s = bldgStats[b.id];
      const activeShare = s.total > 0 ? s.active / s.total : 0;
      if (filter === "flagged" && !drillActive) return false;
      if (filter === "manual" && s.overrides === 0) return false;
      if (filter === "high" && activeShare < 0.8) return false;
      return true;
    });
    if (sort === "default") return rows; // keep natural building-id order
    return [...rows].sort((a, b) => {
      const sa = bldgStats[a.id];
      const sb = bldgStats[b.id];
      switch (sort) {
        case "name":
          return a.name.localeCompare(b.name);
        case "active": {
          const ra = sa.total > 0 ? sa.active / sa.total : 0;
          const rb = sb.total > 0 ? sb.active / sb.total : 0;
          return rb - ra;
        }
        case "kw":
          return sb.kw - sa.kw;
        default:
          return 0;
      }
    });
  }, [buildingsWithDevices, bldgStats, search, filter, drillActive, sort]);

  // Counts for the filter chips — computed against the same base set so the
  // badge next to "Flagged" shows 3 even while the user is on the "All" view.
  const filterCounts = useMemo(() => {
    let manual = 0;
    let high = 0;
    for (const b of buildingsWithDevices) {
      const s = bldgStats[b.id];
      const share = s.total > 0 ? s.active / s.total : 0;
      if (s.overrides > 0) manual++;
      if (share >= 0.8) high++;
    }
    return {
      all: buildingsWithDevices.length,
      flagged: drillActive ? buildingsWithDevices.length : 0,
      manual,
      high,
    };
  }, [buildingsWithDevices, bldgStats, drillActive]);

  const totals = useMemo(() => {
    let on = 0;
    let overrides = 0;
    for (const d of DEVICES) {
      const s = devicesByBldg[d.id];
      if (s?.on) on++;
      if (s?.manualOverrideUntil) overrides++;
    }
    return { total: DEVICES.length, on, overrides };
  }, [devicesByBldg]);

  const selectedBldg = selectedId ? getBuilding(selectedId) : null;

  return (
    <div className="relative flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      {/* color wash on mode change — keyed on master so it replays per change */}
      <AnimatePresence>
        <motion.div
          key={master}
          className="pointer-events-none fixed inset-0 z-[5]"
          style={{ background: MASTER_TONE[master] }}
          initial={{ opacity: 0.18 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        />
      </AnimatePresence>

      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="07" label="Equipment console" />
        <div className="flex items-center gap-3">
          {drillActive && <Pill tone="danger" pulse>Drill in progress</Pill>}
          <Pill tone="signal">{totals.on} / {totals.total} ON</Pill>
          {totals.overrides > 0 && (
            <Pill tone="warn">{totals.overrides} overrides</Pill>
          )}
        </div>
      </div>

      {/* Master mode */}
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
        </div>
      </Card>

      <LayoutGroup>
        <AnimatePresence mode="wait">
          {!selectedBldg ? (
            <motion.div
              key="L1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
            >
              {/* Filters + search + sort */}
              <Card surface={2} className="mt-4 px-3 py-2.5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search
                      size={12}
                      strokeWidth={1.5}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-fg-subtle)]"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search building…"
                      className="w-[240px] rounded-[var(--radius-sm)] border bg-[var(--color-bg)] py-1.5 pl-7 pr-8 text-[12px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:border-[var(--color-signal)]"
                      style={{ borderColor: "var(--color-border-strong)" }}
                    />
                    {search && (
                      <button
                        onClick={() => setSearch("")}
                        aria-label="Clear search"
                        className="absolute right-2 top-1/2 grid size-4 -translate-y-1/2 place-items-center rounded-full bg-[var(--color-surface-3)] text-[var(--color-fg-muted)] hover:bg-[var(--color-border-strong)] hover:text-[var(--color-fg)]"
                      >
                        <span className="text-[10px] leading-none">×</span>
                      </button>
                    )}
                  </div>

                  <span className="h-5 w-px bg-[var(--color-border)]" aria-hidden />

                  {(
                    [
                      { key: "all",     label: "All",             count: filterCounts.all },
                      { key: "flagged", label: "Flagged",         count: filterCounts.flagged, tone: "danger" as const },
                      { key: "manual",  label: "Manual override", count: filterCounts.manual,  tone: "warn" as const },
                      { key: "high",    label: "High load",       count: filterCounts.high,    tone: "warn" as const },
                    ] as Array<{ key: Filter; label: string; count: number; tone?: "danger" | "warn" }>
                  ).map(({ key, label, count, tone }) => {
                    const active = filter === key;
                    const accent = tone === "danger"
                      ? "var(--color-danger)"
                      : tone === "warn"
                        ? "var(--color-warn)"
                        : "var(--color-signal)";
                    return (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
                          "font-mono text-[10px] uppercase tracking-[0.18em] transition-colors",
                        )}
                        style={{
                          color: active ? accent : "var(--color-fg-muted)",
                          borderColor: active ? accent : "var(--color-border)",
                          backgroundColor: active
                            ? `color-mix(in oklch, ${accent} 14%, transparent)`
                            : "transparent",
                        }}
                      >
                        {label}
                        <span
                          className={cn(
                            "tabular-nums min-w-[1ch] text-center",
                            active ? "opacity-100" : "opacity-60",
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}

                  <div className="ml-auto flex items-center gap-2">
                    <label className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                      Sort
                    </label>
                    <div className="relative">
                      <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as typeof sort)}
                        className={cn(
                          "appearance-none rounded-[var(--radius-sm)] border bg-[var(--color-bg)]",
                          "py-1.5 pl-3 pr-8 font-mono text-[11px] uppercase tracking-[0.18em]",
                          "text-[var(--color-fg)] focus:border-[var(--color-signal)] focus:outline-none",
                          "cursor-pointer",
                        )}
                        style={{ borderColor: "var(--color-border-strong)" }}
                      >
                        <option value="default">Default</option>
                        <option value="kw">Highest kW</option>
                        <option value="active">Most active</option>
                        <option value="name">A–Z</option>
                      </select>
                      <span
                        aria-hidden
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-fg-subtle)]"
                      >
                        ▾
                      </span>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)] tabular-nums">
                      {filtered.length} / {buildingsWithDevices.length}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Building card grid */}
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((b, i) => {
                  const s = bldgStats[b.id];
                  const share = s.total > 0 ? s.active / s.total : 0;
                  return (
                    <motion.button
                      key={b.id}
                      layoutId={`ctrl-bldg-${b.id}`}
                      type="button"
                      onClick={() => setSelectedId(b.id)}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.32,
                        delay: Math.min(0.5, i * 0.02),
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      whileHover={{ y: -2 }}
                      className={cn(
                        "group flex flex-col gap-3 rounded-[var(--radius-md)] border-2 pl-6 pr-5 py-4 text-left",
                        "bg-[var(--color-surface-2)]",
                        "hover:bg-[color-mix(in_oklch,var(--color-surface-2)_88%,var(--color-signal))]",
                        "transition-[border-color,background-color]",
                      )}
                      style={{
                        borderColor: "var(--color-border-strong)",
                        borderLeftColor: categoryAccent(b.category),
                        borderLeftWidth: 3,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                            BLDG {pad(b.id)}
                          </p>
                          <p className="mt-0.5 text-[14px] font-medium text-[var(--color-fg)]">
                            {b.name}
                          </p>
                        </div>
                        {s.overrides > 0 && <Pill tone="warn">Manual</Pill>}
                        {drillActive && <Pill tone="danger" pulse>Cut</Pill>}
                      </div>

                      <div className="flex items-baseline gap-3">
                        <span className="font-serif italic text-[22px] leading-none tabular-nums text-[var(--color-fg)]">
                          {s.kw.toFixed(1)}
                        </span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                          kW
                        </span>
                        <span className="ml-auto font-mono text-[10px] text-[var(--color-fg-muted)] tabular-nums">
                          {s.active} / {s.total} active
                        </span>
                      </div>

                      <ActiveBar share={share} />

                      <div className="mt-1 flex items-center justify-between border-t border-[var(--color-border)] pt-2.5 text-[10px]">
                        <span className="font-mono uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                          {b.category}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
                            "font-mono uppercase tracking-[0.18em]",
                            "border-[var(--color-border-strong)] text-[var(--color-fg-muted)]",
                            "group-hover:border-[var(--color-signal)] group-hover:text-[var(--color-signal)]",
                            "transition-colors",
                          )}
                        >
                          Open floors
                          <span className="transition-transform group-hover:translate-x-0.5">→</span>
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="L2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24 }}
              className="mt-4"
            >
              <BuildingDetail
                buildingId={selectedBldg.id}
                buildingName={selectedBldg.name}
                stats={bldgStats[selectedBldg.id]}
                onBack={() => setSelectedId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
}

function ActiveBar({ share }: { share: number }) {
  const tone =
    share > 0.8
      ? "var(--color-warn)"
      : share < 0.3
        ? "var(--color-ok)"
        : "var(--color-signal)";
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]">
      <motion.div
        className="h-full"
        style={{ background: tone }}
        initial={{ width: 0 }}
        animate={{ width: `${share * 100}%` }}
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function BuildingDetail({
  buildingId,
  buildingName,
  stats,
  onBack,
}: {
  buildingId: number;
  buildingName: string;
  stats: { total: number; active: number; overrides: number; kw: number };
  onBack: () => void;
}) {
  const devices = useMemo(() => devicesForBuilding(buildingId), [buildingId]);
  const deviceState = useControls((s) => s.devices); // subscribe so toggles refresh the floor list
  const env = useMemo(
    () => environmentReadings().find((r) => r.buildingId === buildingId),
    [buildingId],
  );

  // Group devices by floor (parse from "3F-204" room code).
  const byFloor = useMemo(() => {
    const map = new Map<string, Array<(typeof devices)[number]>>();
    for (const d of devices) {
      const floor = d.room.split("-")[0];
      if (!map.has(floor)) map.set(floor, []);
      map.get(floor)!.push(d);
    }
    // Sort floors: B1, GF, 1F, 2F ...
    const floorOrder = (f: string) => {
      if (f === "B1") return -1;
      if (f === "GF") return 0;
      return Number(f.replace("F", "")) || 99;
    };
    return Array.from(map.entries()).sort((a, b) => floorOrder(a[0]) - floorOrder(b[0]));
  }, [devices]);

  const [selectedFloor, setSelectedFloor] = useState<string>(byFloor[0]?.[0] ?? "");

  // Group floor devices by room — keyed on byFloor+selectedFloor so the
  // logical `floorDevices` lookup lives inside the memo (react-hooks/exhaustive-deps).
  const byRoom = useMemo(() => {
    const floorDevices = byFloor.find(([f]) => f === selectedFloor)?.[1] ?? [];
    const map = new Map<string, typeof floorDevices>();
    for (const d of floorDevices) {
      if (!map.has(d.room)) map.set(d.room, []);
      map.get(d.room)!.push(d);
    }
    return Array.from(map.entries());
  }, [byFloor, selectedFloor]);

  return (
    <div>
      {/* Breadcrumb + header card (shared layoutId) */}
      <motion.div
        layoutId={`ctrl-bldg-${buildingId}`}
        className="flex items-center gap-4 rounded-[var(--radius-md)] border bg-[var(--color-surface-1)] px-5 py-4"
        style={{ borderColor: "var(--color-border-strong)" }}
      >
        <button
          onClick={onBack}
          className="grid size-8 shrink-0 place-items-center rounded-[var(--radius-sm)] border text-[var(--color-fg-muted)] hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]"
          style={{ borderColor: "var(--color-border)" }}
          aria-label="Back to building list"
        >
          <ArrowLeft size={14} strokeWidth={1.6} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            Controls → <Link href={`/building/${buildingId}`} className="hover:text-[var(--color-signal)]">BLDG {pad(buildingId)}</Link>
          </p>
          <p className="mt-0.5 text-[16px] font-medium text-[var(--color-fg)]">
            {buildingName}
          </p>
        </div>
        <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          <Stat label="Active" value={`${stats.active}/${stats.total}`} tone="signal" />
          <Stat label="Load" value={`${stats.kw.toFixed(1)} kW`} />
          {env && (
            <Stat
              label="Avg temp"
              value={`${env.avgTempC.toFixed(1)}°C`}
              tone={Math.abs(env.deviationC) >= 3 ? "warn" : undefined}
            />
          )}
        </div>
      </motion.div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Floor list */}
        <Card surface={1} className="xl:col-span-3 overflow-hidden">
          <div className="border-b border-[var(--color-border)] px-4 py-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-fg-muted)]">
              Floors · {byFloor.length}
            </p>
          </div>
          <ul>
            {byFloor.map(([floor, list], i) => {
              const active = list.filter((d) => deviceState[d.id]?.on).length;
              const isSelected = floor === selectedFloor;
              const share = list.length > 0 ? active / list.length : 0;
              return (
                <motion.li
                  key={floor}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.32, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    onClick={() => setSelectedFloor(floor)}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left transition-colors last:border-b-0",
                      isSelected
                        ? "bg-[color-mix(in_oklch,var(--color-signal)_10%,transparent)] text-[var(--color-signal)]"
                        : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-2)]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-10 place-items-center rounded-[var(--radius-sm)] font-mono text-[12px] tabular-nums",
                        isSelected
                          ? "bg-[var(--color-signal)] text-[var(--color-bg)]"
                          : "bg-[var(--color-surface-3)] text-[var(--color-fg)]",
                      )}
                    >
                      {floor}
                    </span>
                    <div className="flex-1">
                      <p className="font-mono text-[11px] uppercase tracking-[0.18em]">
                        {active} / {list.length} active
                      </p>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]">
                        <div
                          className="h-full"
                          style={{
                            width: `${share * 100}%`,
                            backgroundColor: isSelected ? "var(--color-signal)" : "var(--color-fg-muted)",
                          }}
                        />
                      </div>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </Card>

        {/* Room + device grid */}
        <div className="xl:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedFloor}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3"
            >
              {byRoom.map(([room, roomDevices], i) => (
                <RoomCard
                  key={room}
                  room={room}
                  devices={roomDevices}
                  delay={i * 0.04}
                  tempC={env?.avgTempC ?? null}
                  humidity={env?.avgHumidity ?? null}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "signal" | "warn" }) {
  const color =
    tone === "signal" ? "var(--color-signal)" : tone === "warn" ? "var(--color-warn)" : "var(--color-fg)";
  return (
    <div className="flex flex-col items-end">
      <span className="text-[var(--color-fg-subtle)]">{label}</span>
      <span className="mt-0.5 font-mono text-[13px] tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function RoomCard({
  room,
  devices,
  delay,
  tempC,
  humidity,
}: {
  room: string;
  devices: ReturnType<typeof devicesForBuilding>;
  delay: number;
  tempC: number | null;
  humidity: number | null;
}) {
  const state = useControls((s) => s.devices);
  // Deterministic pseudo-occupancy from the room code — matches SSR.
  const anyOccupied = useMemo(() => hashString(room) % 100 > 45, [room]);
  const devicesActive = devices.filter((d) => state[d.id]?.on).length;
  const isEmptyWithActive = !anyOccupied && devicesActive > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-sm)] border bg-[var(--color-surface-1)] px-4 py-3",
        isEmptyWithActive && "border-l-[3px] border-l-[var(--color-warn)]",
      )}
      style={{ borderColor: "var(--color-border)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-fg)]">
            {room}
          </p>
          <span
            className={cn(
              "size-1.5 rounded-full",
              anyOccupied ? "bg-[var(--color-ok)]" : "bg-[var(--color-border-strong)]",
            )}
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            {anyOccupied ? "Occupied" : "Empty"}
          </span>
        </div>
        {tempC != null && humidity != null && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tabular-nums text-[var(--color-fg-muted)]">
            <Thermometer size={10} strokeWidth={1.6} className="text-[var(--color-warn)]" />
            {tempC.toFixed(1)}° · {Math.round(humidity * 100)}%
          </span>
        )}
      </div>

      {isEmptyWithActive && (
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-warn)]">
          Empty · devices active
        </p>
      )}

      <ul className="flex flex-col divide-y divide-[var(--color-border)]">
        {devices.map((d) => (
          <DeviceToggleRow key={d.id} id={d.id} kind={d.kind} />
        ))}
      </ul>
    </motion.div>
  );
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function DeviceToggleRow({ id, kind }: { id: string; kind: DeviceKind }) {
  const state = useControls((s) => s.devices[id]);
  const toggle = useControls((s) => s.toggle);
  const Icon = KIND_ICON[kind];
  const now = useNow(1000);
  const overrideMs =
    state?.manualOverrideUntil && now > 0
      ? Math.max(0, state.manualOverrideUntil - now)
      : 0;

  return (
    <li className="flex items-center gap-3 py-2">
      <span
        className="grid size-7 shrink-0 place-items-center rounded-[var(--radius-sm)] border text-[var(--color-fg-muted)]"
        style={{ borderColor: "var(--color-border)" }}
      >
        <Icon size={12} strokeWidth={1.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-[var(--color-fg)]">{KIND_LABEL[kind]}</p>
        {overrideMs > 0 && (
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-warn)]">
            Override · {Math.ceil(overrideMs / 60_000)}m
          </p>
        )}
      </div>
      <Toggle
        on={!!state?.on}
        onToggle={() => toggle(id)}
        size="sm"
        tone="signal"
        label={`${KIND_LABEL[kind]}`}
      />
    </li>
  );
}
