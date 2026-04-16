"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Thermometer,
  Droplet,
  Users as UsersIcon,
  Zap,
  Wrench,
  KeyRound,
  AlertTriangle,
  Waves,
  Info,
  AlertCircle,
  ShieldAlert,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Pill } from "@/components/primitives/Pill";
import { Card } from "@/components/primitives/Card";
import { CardTitle } from "@/components/primitives/CardTitle";
import { Sparkline } from "@/components/primitives/Sparkline";
import { useLogs } from "@/lib/stores/useLogs";
import { useNow } from "@/hooks/useNow";
import {
  type LogSource,
  type LogSeverity,
  type SensorLog,
  SOURCE_LABEL,
  SOURCE_COLOR,
  SEVERITY_COLOR,
} from "@/lib/mock/logs";
import { BUILDINGS } from "@/lib/mock/buildings";
import { pad } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const ALL_SOURCES: LogSource[] = [
  "temp",
  "humidity",
  "occupancy",
  "power",
  "water",
  "rfid",
  "gas",
  "seismic",
];

const TIME_RANGES = [
  { key: "live", label: "Live", mins: null as null | number },
  { key: "1h", label: "1h", mins: 60 },
  { key: "6h", label: "6h", mins: 360 },
  { key: "24h", label: "24h", mins: 1440 },
  { key: "7d", label: "7d", mins: 10080 },
];

export default function LogsPage() {
  const logs = useLogs((s) => s.logs);
  const [sources, setSources] = useState<Set<LogSource>>(new Set(ALL_SOURCES));
  const [severity, setSeverity] = useState<LogSeverity | "all">("all");
  const [timeRange, setTimeRange] = useState<string>("live");
  const [buildingFilter, setBuildingFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");

  // Tick every 30s — fine grain for the live feed but cheap enough to ignore.
  const now = useNow(30_000);
  const mins = TIME_RANGES.find((r) => r.key === timeRange)?.mins;
  const windowStart = mins == null ? 0 : Math.max(0, now - mins * 60_000);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      if (!sources.has(l.source)) return false;
      if (severity !== "all" && l.severity !== severity) return false;
      if (buildingFilter !== "all" && l.buildingId !== buildingFilter) return false;
      if (l.timestamp < windowStart) return false;
      if (q && !l.message.toLowerCase().includes(q) && !String(l.buildingId).includes(q)) return false;
      return true;
    });
  }, [logs, sources, severity, buildingFilter, windowStart, search]);

  const stats = useMemo(() => computeStats(filtered, now), [filtered, now]);

  const toggleSource = (s: LogSource) =>
    setSources((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="11" label="Sensor logs" />
        <div className="flex items-center gap-2">
          <Pill tone="signal" pulse>
            Live
          </Pill>
          <Pill tone="neutral">
            {filtered.length.toLocaleString()} events
          </Pill>
        </div>
      </div>

      {/* Filter bar */}
      <Card surface={1} className="mt-5 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Sources */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              Source
            </span>
            <FilterChip
              active={sources.size === ALL_SOURCES.length}
              onClick={() => setSources(new Set(ALL_SOURCES))}
              label="All"
            />
            {ALL_SOURCES.map((s) => (
              <FilterChip
                key={s}
                active={sources.has(s) && sources.size !== ALL_SOURCES.length}
                onClick={() => toggleSource(s)}
                label={SOURCE_LABEL[s]}
                color={SOURCE_COLOR[s]}
                Icon={ICON_FOR_SOURCE[s]}
              />
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Severity */}
            <div className="flex items-center gap-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                Severity
              </span>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as LogSeverity | "all")}
                className="rounded-[var(--radius-sm)] border bg-[var(--color-bg)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg)]"
                style={{ borderColor: "var(--color-border-strong)" }}
              >
                <option value="all">All</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* Time range */}
            <div className="flex items-center gap-1 rounded-[var(--radius-sm)] border" style={{ borderColor: "var(--color-border-strong)" }}>
              {TIME_RANGES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setTimeRange(r.key)}
                  className={cn(
                    "px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] transition-colors",
                    timeRange === r.key
                      ? "bg-[var(--color-signal)] text-[var(--color-bg)]"
                      : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search
                size={12}
                strokeWidth={1.5}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-[var(--color-fg-subtle)]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-[180px] rounded-[var(--radius-sm)] border bg-[var(--color-bg)] py-1 pl-7 pr-3 font-mono text-[11px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none"
                style={{ borderColor: "var(--color-border-strong)" }}
              />
            </div>

            {/* Building filter */}
            <select
              value={buildingFilter === "all" ? "all" : String(buildingFilter)}
              onChange={(e) =>
                setBuildingFilter(e.target.value === "all" ? "all" : Number(e.target.value))
              }
              className="rounded-[var(--radius-sm)] border bg-[var(--color-bg)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg)]"
              style={{ borderColor: "var(--color-border-strong)" }}
            >
              <option value="all">All buildings</option>
              {BUILDINGS.slice(0, 60).map((b) => (
                <option key={b.id} value={b.id}>
                  {pad(b.id)} · {b.name.slice(0, 26)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Main content */}
      <div className="mt-4 flex min-h-0 flex-1 gap-4">
        {/* Feed */}
        <Card surface={1} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
            <div className="flex items-center gap-2">
              <Filter size={12} strokeWidth={1.6} className="text-[var(--color-fg-subtle)]" />
              <CardTitle>Log feed</CardTitle>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              {timeRange === "live" ? "Streaming · newest first" : `${TIME_RANGES.find(r => r.key === timeRange)?.label} window`}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <ul className="divide-y divide-[var(--color-border)]">
              <AnimatePresence initial={false}>
                {filtered.slice(0, 200).map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </AnimatePresence>
              {filtered.length === 0 && (
                <li className="px-5 py-12 text-center">
                  <p className="font-serif italic text-[18px] text-[var(--color-fg)]">
                    No events match this filter.
                  </p>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                    Try broadening source or time window
                  </p>
                </li>
              )}
            </ul>
          </div>
        </Card>

        {/* Stats sidebar */}
        <div className="flex w-[280px] shrink-0 flex-col gap-3">
          <StatsPanel stats={stats} />
        </div>
      </div>
    </div>
  );
}

function LogRow({ log }: { log: SensorLog }) {
  const Icon = ICON_FOR_SOURCE[log.source];
  const SeverityIcon =
    log.severity === "critical" ? ShieldAlert : log.severity === "warning" ? AlertCircle : Info;

  const buildingName = BUILDINGS.find((b) => b.id === log.buildingId)?.name;

  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "flex items-start gap-3 px-5 py-2.5",
        "border-l-[3px]",
        "transition-colors hover:bg-[color-mix(in_oklch,var(--color-surface-2)_92%,var(--color-signal)_8%)]",
      )}
      style={{ borderLeftColor: SEVERITY_COLOR[log.severity] }}
    >
      {/* Time */}
      <span className="shrink-0 pt-0.5 font-mono text-[10px] tabular-nums text-[var(--color-fg-muted)]">
        {formatTimestamp(log.timestamp)}
      </span>

      {/* Source pill */}
      <span
        className="shrink-0 rounded-[3px] border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.2em]"
        style={{
          color: SOURCE_COLOR[log.source],
          borderColor: SOURCE_COLOR[log.source],
        }}
      >
        <Icon size={9} strokeWidth={1.8} className="mr-1 inline align-[-1px]" />
        {SOURCE_LABEL[log.source]}
      </span>

      {/* Location */}
      <Link
        href={`/building/${log.buildingId}`}
        className="shrink-0 pt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)] hover:text-[var(--color-signal)]"
      >
        BLDG {pad(log.buildingId)}
        {log.roomId && ` · ${log.roomId}`}
      </Link>

      {/* Message */}
      <span className="min-w-0 flex-1 text-[12px] text-[var(--color-fg)]">
        {log.message}
        {buildingName && (
          <span className="ml-2 text-[10px] text-[var(--color-fg-subtle)]">
            · {buildingName}
          </span>
        )}
      </span>

      {/* Severity icon */}
      <SeverityIcon
        size={12}
        strokeWidth={1.7}
        className="shrink-0"
        style={{ color: SEVERITY_COLOR[log.severity] }}
      />
    </motion.li>
  );
}

function StatsPanel({ stats }: { stats: ReturnType<typeof computeStats> }) {
  return (
    <Card surface={1} className="flex min-h-0 flex-col overflow-y-auto">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <CardTitle>Statistics</CardTitle>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">
        {/* Event rate */}
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            Event rate · 60m
          </p>
          <div className="mt-2 text-[var(--color-signal)]">
            <Sparkline
              values={stats.rate}
              stroke="currentColor"
              fill="color-mix(in oklch, var(--color-signal) 12%, transparent)"
              width={240}
              height={44}
            />
          </div>
          <div className="mt-1 flex items-baseline justify-between font-mono text-[10px] tabular-nums">
            <span className="text-[var(--color-fg-muted)]">
              peak {stats.peakPerMin}/min
            </span>
            <span className="text-[var(--color-fg-subtle)] uppercase tracking-[0.18em]">
              60m
            </span>
          </div>
        </div>

        {/* Source breakdown */}
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            Source breakdown
          </p>
          <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full">
            {stats.sourceBreakdown.map((s) =>
              s.count > 0 ? (
                <span
                  key={s.source}
                  style={{
                    flex: s.count,
                    backgroundColor: SOURCE_COLOR[s.source],
                  }}
                />
              ) : null,
            )}
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[10px] tabular-nums">
            {stats.sourceBreakdown.map((s) => (
              <li key={s.source} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: SOURCE_COLOR[s.source] }}
                  />
                  <span className="text-[var(--color-fg-muted)]">
                    {SOURCE_LABEL[s.source]}
                  </span>
                </span>
                <span className="text-[var(--color-fg)]">{s.count}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Top buildings */}
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            Top active buildings
          </p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {stats.topBuildings.slice(0, 5).map((b) => (
              <li key={b.id}>
                <Link
                  href={`/building/${b.id}`}
                  className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.18em] hover:text-[var(--color-signal)]"
                >
                  <span className="truncate text-[var(--color-fg-muted)]">
                    BLDG {pad(b.id)} · {b.name.slice(0, 18)}
                  </span>
                  <span className="tabular-nums text-[var(--color-fg)]">{b.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Alert summary */}
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            Severity summary
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <SeverityCell label="Critical" value={stats.critical} tone="var(--color-danger)" />
            <SeverityCell label="Warning" value={stats.warning} tone="var(--color-warn)" />
            <SeverityCell label="Info" value={stats.info} tone="var(--color-fg-muted)" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function SeverityCell({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] border px-2.5 py-2 text-center"
      style={{ borderColor: "var(--color-border)" }}
    >
      <span className="font-serif italic text-[20px] tabular-nums" style={{ color: tone }}>
        {value}
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        {label}
      </span>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  color,
  Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  color?: string;
  Icon?: typeof Thermometer;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
        "font-mono text-[10px] uppercase tracking-[0.18em] transition-colors",
        active
          ? "text-[var(--color-fg)]"
          : "text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]",
      )}
      style={{
        borderColor: active ? (color ?? "var(--color-signal)") : "var(--color-border)",
        backgroundColor: active
          ? color
            ? `color-mix(in oklch, ${color} 12%, transparent)`
            : "color-mix(in oklch, var(--color-signal) 14%, transparent)"
          : "transparent",
      }}
    >
      {Icon && <Icon size={10} strokeWidth={1.7} style={{ color: active ? color : undefined }} />}
      {label}
    </button>
  );
}

const ICON_FOR_SOURCE: Record<LogSource, typeof Thermometer> = {
  temp: Thermometer,
  humidity: Droplet,
  occupancy: UsersIcon,
  power: Zap,
  water: Wrench,
  rfid: KeyRound,
  gas: AlertTriangle,
  seismic: Waves,
};

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}.${String(d.getMilliseconds()).padStart(3, "0")}`;
}

function computeStats(logs: SensorLog[], now: number) {
  // Rate histogram: last 60 minutes, 1-min buckets.
  // When `now` is 0 (pre-mount), we skip bucketing — feed catches up once useNow ticks.
  const rateBuckets: number[] = new Array(60).fill(0);
  if (now > 0) {
    for (const l of logs) {
      const ageMin = Math.floor((now - l.timestamp) / 60_000);
      if (ageMin >= 0 && ageMin < 60) rateBuckets[59 - ageMin]++;
    }
  }
  const peakPerMin = Math.max(...rateBuckets);

  // Source breakdown
  const srcCount: Record<LogSource, number> = {
    temp: 0, humidity: 0, occupancy: 0, power: 0, water: 0, rfid: 0, gas: 0, seismic: 0,
  };
  const bldgCount: Record<number, number> = {};
  let info = 0, warning = 0, critical = 0;

  for (const l of logs) {
    srcCount[l.source]++;
    bldgCount[l.buildingId] = (bldgCount[l.buildingId] ?? 0) + 1;
    if (l.severity === "info") info++;
    else if (l.severity === "warning") warning++;
    else critical++;
  }

  const topBuildings = Object.entries(bldgCount)
    .map(([id, count]) => ({
      id: Number(id),
      count,
      name: BUILDINGS.find((b) => b.id === Number(id))?.name ?? `Building ${id}`,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    rate: rateBuckets,
    peakPerMin,
    sourceBreakdown: (Object.keys(srcCount) as LogSource[]).map((s) => ({
      source: s,
      count: srcCount[s],
    })),
    topBuildings,
    info,
    warning,
    critical,
  };
}
