/**
 * Telemetry generators — deterministic 24h data for the campus, plus per-building
 * intensity snapshots used by the map's heatmap layer.
 *
 * All values come from the seeded PRNG so reloads stay identical
 * (CLAUDE.md §7).
 */

import seedrandom from "seedrandom";
import { SEED, MONTHLY_BILL_PHP } from "@/lib/constants";
import { BUILDINGS } from "@/lib/mock/buildings";

export type LoadPoint = {
  /** Minutes from local 00:00. */
  minute: number;
  /** Display label like "06:00". */
  label: string;
  /** kW drawn from the grid at this 5-min slot. */
  grid: number;
  /** kW provided by solar at this 5-min slot. */
  solar: number;
  /** Total demand: grid + solar. */
  total: number;
};

const STEP_MIN = 5;
const STEPS_PER_DAY = (24 * 60) / STEP_MIN; // 288

/** Solar curve: 0 before 6h and after 18h, peak around 12:30. */
function solarFraction(minute: number): number {
  const sunriseMin = 6 * 60;
  const sunsetMin = 18 * 60;
  if (minute < sunriseMin || minute > sunsetMin) return 0;
  const t = (minute - sunriseMin) / (sunsetMin - sunriseMin); // 0..1
  // Skew so solar peak is slightly past noon (around 12:30 ≈ 0.54).
  return Math.max(0, Math.sin(Math.PI * t) * (1 - 0.18 * Math.abs(t - 0.54)));
}

/** Demand curve: low at night, double-peak (10–11h, 14–16h), evening dip. */
function demandFraction(minute: number): number {
  const h = minute / 60;
  // Base load (always-on stuff: utility, residential)
  let base = 0.42;
  // Morning ramp up to ~1.0 by 10h
  base += 0.55 * Math.exp(-Math.pow((h - 10.5) / 2.6, 2));
  // Afternoon class peak
  base += 0.5 * Math.exp(-Math.pow((h - 14.5) / 2.2, 2));
  // Evening study-hall bump
  base += 0.18 * Math.exp(-Math.pow((h - 19.5) / 1.8, 2));
  // Night dip
  if (h < 5 || h > 22) base *= 0.55;
  return base;
}

/** Sum of all building baseline kW (a stable scale for the day). */
function totalBaseline(): number {
  return BUILDINGS.reduce((s, b) => s + b.baselineKw, 0);
}

const TOTAL_BASELINE = totalBaseline();

/** Generate today's 288-point load curve. */
export function generateDayLoadCurve(seedSuffix = "today"): LoadPoint[] {
  const rng = seedrandom(`${SEED}:telemetry:${seedSuffix}`);
  const out: LoadPoint[] = [];

  for (let i = 0; i < STEPS_PER_DAY; i++) {
    const minute = i * STEP_MIN;
    const totalKw = TOTAL_BASELINE * demandFraction(minute) * (0.94 + rng() * 0.12);
    const solarCapacity = TOTAL_BASELINE * 0.42 * solarFraction(minute) * (0.92 + rng() * 0.16);
    const solar = Math.min(totalKw, solarCapacity);
    const grid = Math.max(0, totalKw - solar);
    const h = Math.floor(minute / 60);
    const m = minute % 60;
    out.push({
      minute,
      label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      grid: round1(grid),
      solar: round1(solar),
      total: round1(totalKw),
    });
  }
  return out;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Cached today's load curve so multiple panels share one source of truth. */
let _todayCurve: LoadPoint[] | null = null;
export function todayLoadCurve(): LoadPoint[] {
  if (!_todayCurve) _todayCurve = generateDayLoadCurve("today");
  return _todayCurve;
}

/** Index of the slot closest to "now" (PHT). */
export function currentSlotIndex(now = new Date()): number {
  const phtFmt = new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = phtFmt.formatToParts(now);
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return Math.min(STEPS_PER_DAY - 1, Math.floor((hh * 60 + mm) / STEP_MIN));
}

/** Snapshot KPIs for /overview. */
export type KpiSnapshot = {
  currentLoadKw: number;
  todayCostPhp: number;
  solarSharePct: number; // 0..1
  yesterdayLoadKw: number;
  yesterdayCostPhp: number;
  yesterdaySolarSharePct: number;
};

const PHP_PER_KWH = 12.8; // realistic Philippine commercial rate (₱/kWh)

export function kpiSnapshot(): KpiSnapshot {
  const today = todayLoadCurve();
  const yesterday = generateDayLoadCurve("yesterday");
  const idx = currentSlotIndex();
  const upToNow = today.slice(0, idx + 1);

  const sumK = (rows: LoadPoint[], k: "grid" | "solar" | "total") =>
    rows.reduce((s, r) => s + r[k], 0);

  // Cost: integrate kW × hours (5 min = 1/12 hr).
  const todayKwh = sumK(upToNow, "grid") / 12;
  const todayCost = todayKwh * PHP_PER_KWH;

  const yKwh = sumK(yesterday, "grid") / 12;
  const yCost = yKwh * PHP_PER_KWH;

  const totalToday = sumK(upToNow, "total");
  const solarToday = sumK(upToNow, "solar");
  const solarShare = totalToday > 0 ? solarToday / totalToday : 0;

  const yTotal = sumK(yesterday, "total");
  const ySolar = sumK(yesterday, "solar");
  const ySolarShare = yTotal > 0 ? ySolar / yTotal : 0;

  return {
    currentLoadKw: today[idx].total,
    todayCostPhp: todayCost,
    solarSharePct: solarShare,
    yesterdayLoadKw: yesterday[idx].total,
    yesterdayCostPhp: yCost,
    yesterdaySolarSharePct: ySolarShare,
  };
}

/** Per-building intensity 0..1 right now, used by the map heatmap. */
export function buildingIntensity(): Record<number, number> {
  const rng = seedrandom(`${SEED}:intensity`);
  const idx = currentSlotIndex();
  const dayShape = demandFraction(idx * STEP_MIN);
  const out: Record<number, number> = {};
  for (const b of BUILDINGS) {
    // Categories with high baselines run hotter at peak.
    const categoryFactor =
      b.category === "academic" || b.category === "utility"
        ? 1.0
        : b.category === "admin" || b.category === "residential"
          ? 0.85
          : b.category === "sports" || b.category === "dining"
            ? 0.7
            : 0.4;
    const noise = 0.85 + rng() * 0.3;
    out[b.id] = Math.max(0, Math.min(1, dayShape * categoryFactor * noise));
  }
  return out;
}

/** Buildings considered "flagged" right now (anomalous draw). */
export function flaggedBuildings(): Set<number> {
  const rng = seedrandom(`${SEED}:flags`);
  const flagged = new Set<number>();
  // ~6% of mapped buildings are flagged at any moment.
  for (const b of BUILDINGS) {
    if (rng() < 0.06) flagged.add(b.id);
  }
  return flagged;
}

/** Sparkline source: last 24 5-min ticks. */
export function recentSparkline(key: "grid" | "solar" | "total" | "cost", points = 24): number[] {
  const today = todayLoadCurve();
  const idx = currentSlotIndex();
  const start = Math.max(0, idx - points + 1);
  const slice = today.slice(start, idx + 1);
  if (key === "cost") return slice.map((r) => (r.grid / 12) * PHP_PER_KWH);
  return slice.map((r) => r[key]);
}

/** Demo-day claim: monthly bill from CLAUDE.md §1. */
export const HEADLINE_MONTHLY_BILL = MONTHLY_BILL_PHP;
