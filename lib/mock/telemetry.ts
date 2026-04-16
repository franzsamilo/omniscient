/**
 * Telemetry generators — deterministic 24h data for the campus, plus per-building
 * intensity snapshots used by the map's heatmap layer.
 *
 * All values come from the seeded PRNG so reloads stay identical
 * (CLAUDE.md §7).
 */

import seedrandom from "seedrandom";
import { SEED, MONTHLY_BILL_PHP } from "@/lib/constants";
import { BUILDINGS, type Building } from "@/lib/mock/buildings";

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

/* -------------------------------------------------------------------------
   Power flow — CLAUDE-UPDATES PATCH 1
   4-node snapshot: solar, grid import, battery (charge/discharge), campus load.
   Battery SOC is stable across a render because it's keyed to the current
   slot, not Math.random — reload and get the same picture.
   ------------------------------------------------------------------------- */

export type PowerFlow = {
  /** Current solar production (kW). */
  solarKw: number;
  /** Current grid draw (kW). Positive = importing. */
  gridImportKw: number;
  /** Current grid export (kW). Usually ~0 for this campus. */
  gridExportKw: number;
  /** Battery flow (kW). Positive = charging, negative = discharging. */
  batteryKw: number;
  /** Total campus consumption (kW). */
  campusLoadKw: number;
  /** Battery state of charge, 0..1. */
  batterySoc: number;
  /** Fixed battery storage capacity (kWh). */
  batteryCapacityKwh: number;
};

/**
 * Pack sized for a realistic campus installation — 2.4 MWh stores roughly
 * two hours of base load, which keeps the SOC curve inside a healthy
 * 30–90% band over a day instead of collapsing to 0% by evening.
 */
const BATTERY_CAPACITY_KWH = 2400;
const MAX_CHARGE_KW = 400;
const MAX_DISCHARGE_KW = 260;

/**
 * Integrate battery SOC forward over the day from a mid-morning start.
 * Seeded, so the curve is identical across renders.
 */
function batterySocCurve(): number[] {
  const curve = todayLoadCurve();
  let soc = 0.62; // start of day — post-overnight floor
  const out: number[] = [];
  for (const p of curve) {
    // Step width is 5 minutes = 1/12 hour.
    const excess = p.solar - p.total; // positive = solar beats load (rare on this campus)
    let batteryKw = 0;
    if (excess > 0) {
      const maxCharge = Math.min(MAX_CHARGE_KW, (1 - soc) * BATTERY_CAPACITY_KWH * 12);
      batteryKw = Math.min(excess, maxCharge);
    } else {
      const maxDischarge = Math.min(MAX_DISCHARGE_KW, Math.max(0, soc - 0.25) * BATTERY_CAPACITY_KWH * 12);
      // Battery only covers ~18% of a deficit — keeps SOC from crashing on
      // cloudy afternoons, and the grid picks up the rest.
      batteryKw = -Math.min(-excess * 0.18, maxDischarge);
    }
    const deltaKwh = batteryKw / 12;
    soc = Math.max(0, Math.min(1, soc + deltaKwh / BATTERY_CAPACITY_KWH));
    out.push(soc);
  }
  return out;
}

let _socCurve: number[] | null = null;
function socCurve(): number[] {
  if (!_socCurve) _socCurve = batterySocCurve();
  return _socCurve;
}

export function currentPowerFlow(): PowerFlow {
  const idx = currentSlotIndex();
  const slot = todayLoadCurve()[idx];
  const soc = socCurve()[idx];

  const solarKw = slot.solar;
  const campusLoadKw = slot.total;
  const excess = solarKw - campusLoadKw;

  let batteryKw: number;
  let gridImportKw: number;

  if (excess > 0) {
    // Solar over-produces — push to battery.
    const headroom = (1 - soc) * BATTERY_CAPACITY_KWH * 12;
    batteryKw = Math.min(excess, MAX_CHARGE_KW, headroom);
    gridImportKw = 0;
  } else {
    // Solar under-produces — battery chips in (18%), grid fills the rest.
    // Reserve 25% floor so SOC never gets pushed to empty.
    const usableKwh = Math.max(0, soc - 0.25) * BATTERY_CAPACITY_KWH;
    const contrib = Math.min(-excess * 0.18, MAX_DISCHARGE_KW, usableKwh * 12);
    batteryKw = -Math.max(0, contrib);
    gridImportKw = Math.max(0, campusLoadKw - solarKw - (-batteryKw));
  }

  return {
    solarKw: round1(solarKw),
    gridImportKw: round1(gridImportKw),
    gridExportKw: 0,
    batteryKw: round1(batteryKw),
    campusLoadKw: round1(campusLoadKw),
    batterySoc: Math.round(soc * 100) / 100,
    batteryCapacityKwh: BATTERY_CAPACITY_KWH,
  };
}

/** SOC samples on 1-hour centers for the mini bar chart below the battery gauge. */
export function batterySocHourly(): number[] {
  const curve = socCurve();
  const step = Math.floor(STEPS_PER_DAY / 24);
  const out: number[] = [];
  for (let h = 0; h < 24; h++) {
    out.push(curve[h * step] ?? 0);
  }
  return out;
}

/** Battery kW over the day — used for the load-curve stacked band. */
export function batteryKwCurve(): number[] {
  const curve = todayLoadCurve();
  const socs = socCurve();
  const out: number[] = [];
  let prevSoc = 0.4;
  for (let i = 0; i < curve.length; i++) {
    const soc = socs[i];
    const deltaKwh = (soc - prevSoc) * BATTERY_CAPACITY_KWH;
    prevSoc = soc;
    // Positive = charging, negative = discharging. Convert back to kW at 5-min step.
    out.push(round1(deltaKwh * 12));
  }
  return out;
}

/* -------------------------------------------------------------------------
   Water telemetry — CLAUDE-UPDATES PATCH 4
   One reading per building per zone. Flow rates are deterministic (seeded)
   so rerenders don't surprise the reader, but a small subset carries a
   persistent "leak" flag so the leak panel has something to report.
   ------------------------------------------------------------------------- */

export type WaterZone =
  | "main"
  | "restroom"
  | "kitchen"
  | "irrigation"
  | "pool";

export type WaterReading = {
  buildingId: number;
  zone: WaterZone;
  flowRateLpm: number;
  dailyConsumptionL: number;
  baselineDailyL: number;
  leakDetected: boolean;
  leakSeverity?: "minor" | "major" | "critical";
  valveState: "open" | "closed" | "throttled";
};

const ZONE_BY_CATEGORY: Record<string, WaterZone[]> = {
  academic: ["restroom"],
  admin: ["restroom"],
  residential: ["restroom", "kitchen"],
  sports: ["restroom", "pool"],
  dining: ["kitchen", "restroom"],
  utility: ["main"],
  worship: ["restroom"],
  garden: ["irrigation"],
  parking: [],
  other: [],
};

const ZONE_FLOW_BASE: Record<WaterZone, number> = {
  main: 18, // central supply meter
  restroom: 1.6,
  kitchen: 2.4,
  pool: 3.2,
  irrigation: 2.0,
};

export type CampusWaterZoneKind =
  | "academic"
  | "residential"
  | "sports"
  | "dining"
  | "utility";

export type CampusWaterZone = {
  kind: CampusWaterZoneKind;
  label: string;
  flowRateLpm: number;
  dailyConsumptionL: number;
  leakDetected: boolean;
};

function generateWaterReadings(): WaterReading[] {
  const rng = seedrandom(`${SEED}:water`);
  const out: WaterReading[] = [];

  // Hardcoded leaks so the demo always has something dramatic to show.
  // These building ids align with named buildings in the mock set.
  const PRESET_LEAKS = new Set<number>([77, 9, 64]); // Library, Dining, Gym

  for (const b of BUILDINGS) {
    const zones = ZONE_BY_CATEGORY[b.category] ?? [];
    for (const zone of zones) {
      const baseline = ZONE_FLOW_BASE[zone];
      const jitter = 0.75 + rng() * 0.5;
      const flow = round1(baseline * jitter);
      const dailyBaseL = baseline * 60 * 18; // 18 operating hours
      const isLeak = PRESET_LEAKS.has(b.id) && zone === (ZONE_BY_CATEGORY[b.category]?.[0] ?? "restroom");
      const leakMultiplier = isLeak ? 3.2 + rng() * 2 : 1;
      out.push({
        buildingId: b.id,
        zone,
        flowRateLpm: round1(flow * leakMultiplier),
        dailyConsumptionL: Math.round(dailyBaseL * (0.85 + rng() * 0.3) * leakMultiplier),
        baselineDailyL: Math.round(dailyBaseL),
        leakDetected: isLeak,
        leakSeverity: isLeak ? (leakMultiplier > 4 ? "major" : "minor") : undefined,
        valveState: "open",
      });
    }
  }
  return out;
}

let _waterReadings: WaterReading[] | null = null;
export function waterReadings(): WaterReading[] {
  if (!_waterReadings) _waterReadings = generateWaterReadings();
  return _waterReadings;
}

/** Close a valve (used by the "Shut valve" action in the leak panel). */
export function setValveState(buildingId: number, zone: WaterZone, state: WaterReading["valveState"]): void {
  if (!_waterReadings) _waterReadings = generateWaterReadings();
  for (const r of _waterReadings) {
    if (r.buildingId === buildingId && r.zone === zone) {
      r.valveState = state;
      if (state === "closed") {
        r.flowRateLpm = 0;
        r.leakDetected = false;
      }
    }
  }
}

/** Roll-up by campus zone kind — used by the /water flow schematic. */
export function campusWaterZones(): CampusWaterZone[] {
  const readings = waterReadings();
  const buckets: Record<CampusWaterZoneKind, CampusWaterZone> = {
    academic: { kind: "academic", label: "Academic", flowRateLpm: 0, dailyConsumptionL: 0, leakDetected: false },
    residential: { kind: "residential", label: "Residential", flowRateLpm: 0, dailyConsumptionL: 0, leakDetected: false },
    sports: { kind: "sports", label: "Sports", flowRateLpm: 0, dailyConsumptionL: 0, leakDetected: false },
    dining: { kind: "dining", label: "Dining", flowRateLpm: 0, dailyConsumptionL: 0, leakDetected: false },
    utility: { kind: "utility", label: "Utility", flowRateLpm: 0, dailyConsumptionL: 0, leakDetected: false },
  };

  for (const r of readings) {
    const b = BUILDINGS.find((x) => x.id === r.buildingId);
    if (!b) continue;
    let kind: CampusWaterZoneKind;
    switch (b.category) {
      case "academic":
      case "admin":
      case "worship":
        kind = "academic"; break;
      case "residential":
        kind = "residential"; break;
      case "sports":
        kind = "sports"; break;
      case "dining":
        kind = "dining"; break;
      default:
        kind = "utility";
    }
    buckets[kind].flowRateLpm += r.flowRateLpm;
    buckets[kind].dailyConsumptionL += r.dailyConsumptionL;
    if (r.leakDetected) buckets[kind].leakDetected = true;
  }

  for (const k in buckets) {
    const b = buckets[k as CampusWaterZoneKind];
    b.flowRateLpm = round1(b.flowRateLpm);
  }

  return Object.values(buckets);
}

/** Leaks currently active across the campus. Sorted by severity/age. */
export type ActiveLeak = {
  id: string;
  buildingId: number;
  zone: WaterZone;
  flowRateLpm: number;
  baselineLpm: number;
  anomalyPct: number;       // (flow - baseline) / baseline * 100
  detectedAtMinuteAgo: number;
  severity: "minor" | "major" | "critical";
  valveState: WaterReading["valveState"];
};

export function activeLeaks(): ActiveLeak[] {
  const readings = waterReadings();
  const rng = seedrandom(`${SEED}:water:leak-time`);
  return readings
    .filter((r) => r.leakDetected)
    .map((r, i) => {
      const base = ZONE_FLOW_BASE[r.zone] * 0.9;
      const anomaly = Math.round(((r.flowRateLpm - base) / base) * 100);
      const minutesAgo = Math.floor(3 + rng() * 52);
      const severity = (r.leakSeverity ?? "minor") as ActiveLeak["severity"];
      return {
        id: `LK-${r.buildingId}-${r.zone}-${i}`,
        buildingId: r.buildingId,
        zone: r.zone,
        flowRateLpm: r.flowRateLpm,
        baselineLpm: round1(base),
        anomalyPct: anomaly,
        detectedAtMinuteAgo: minutesAgo,
        severity,
        valveState: r.valveState,
      };
    })
    .sort((a, b) => {
      const rank: Record<ActiveLeak["severity"], number> = { critical: 0, major: 1, minor: 2 };
      if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
      return a.detectedAtMinuteAgo - b.detectedAtMinuteAgo;
    });
}

/** Today's campus-wide consumption roll-up (for the KPI strip). */
export function waterKpiSnapshot(): {
  dailyConsumptionL: number;
  currentFlowLpm: number;
  activeLeaks: number;
  monthlyCostPhp: number;
  yesterdayConsumptionL: number;
} {
  const readings = waterReadings();
  const dailyConsumptionL = readings.reduce((s, r) => s + r.dailyConsumptionL, 0);
  const currentFlowLpm = round1(readings.reduce((s, r) => s + r.flowRateLpm, 0));
  const activeLeakCount = readings.filter((r) => r.leakDetected).length;
  // ₱/m³ rate — roughly Philippine commercial water rate.
  const costPerM3 = 42.5;
  const monthlyCostPhp = Math.round((dailyConsumptionL / 1000) * 30 * costPerM3);
  const yesterdayConsumptionL = Math.round(dailyConsumptionL * 0.94);
  return {
    dailyConsumptionL,
    currentFlowLpm,
    activeLeaks: activeLeakCount,
    monthlyCostPhp,
    yesterdayConsumptionL,
  };
}

/** Per-building consumption table rows. */
export function waterByBuilding(): Array<{
  buildingId: number;
  name: string;
  category: Building["category"];
  todayL: number;
  avg7L: number;
  deltaPct: number;
  peakHour: string;
  anomaly: boolean;
}> {
  const rng = seedrandom(`${SEED}:water:table`);
  const readings = waterReadings();
  const byBldg = new Map<number, { today: number; baseline: number; anomaly: boolean }>();
  for (const r of readings) {
    const cur = byBldg.get(r.buildingId) ?? { today: 0, baseline: 0, anomaly: false };
    cur.today += r.dailyConsumptionL;
    cur.baseline += r.baselineDailyL;
    if (r.leakDetected) cur.anomaly = true;
    byBldg.set(r.buildingId, cur);
  }

  const peakWindows = [
    "07:00–08:00",
    "11:00–12:00",
    "17:00–18:00",
    "CONTINUOUS",
    "02:00–03:00",
  ];

  const rows: Array<ReturnType<typeof waterByBuilding>[number]> = [];
  for (const [id, v] of byBldg) {
    const b = BUILDINGS.find((x) => x.id === id);
    if (!b) continue;
    const avg7 = Math.round(v.baseline * (0.9 + rng() * 0.2));
    const delta = v.today - avg7;
    const deltaPct = Math.round((delta / Math.max(1, avg7)) * 1000) / 10;
    rows.push({
      buildingId: id,
      name: b.name,
      category: b.category,
      todayL: v.today,
      avg7L: avg7,
      deltaPct,
      peakHour: peakWindows[Math.floor(rng() * peakWindows.length)],
      anomaly: v.anomaly,
    });
  }

  return rows.sort((a, b) => b.todayL - a.todayL);
}

/** 7-day consumption series per zone kind for the bar chart. */
export function water7dSeries(): Array<{ day: string; academic: number; residential: number; sports: number; dining: number; utility: number }> {
  const rng = seedrandom(`${SEED}:water:7d`);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const zones = campusWaterZones();
  const base: Record<string, number> = {};
  for (const z of zones) base[z.kind] = z.dailyConsumptionL;
  return days.map((day) => ({
    day,
    academic: Math.round(base.academic * (0.82 + rng() * 0.36)),
    residential: Math.round(base.residential * (0.82 + rng() * 0.36)),
    sports: Math.round(base.sports * (0.82 + rng() * 0.36)),
    dining: Math.round(base.dining * (0.82 + rng() * 0.36)),
    utility: Math.round(base.utility * (0.82 + rng() * 0.36)),
  }));
}

/* -------------------------------------------------------------------------
   Environment telemetry — CLAUDE-UPDATES PATCH 3
   Per-building aggregate temperature, humidity and a derived comfort index.
   ------------------------------------------------------------------------- */

export type EnvironmentReading = {
  buildingId: number;
  name: string;
  category: Building["category"];
  avgTempC: number;
  avgHumidity: number;    // 0..1
  acSetpointC: number;
  comfortIndex: number;   // 0..100 — higher = more comfortable
  activeAcUnits: number;
  acTotal: number;
  hvacLoadKw: number;
  deviationC: number;     // avgTempC - setpoint
};

const ENV_CATEGORY_SETPOINT: Record<Building["category"], number> = {
  academic: 24,
  admin: 24,
  residential: 25,
  sports: 26,
  utility: 27,
  worship: 25,
  dining: 23,
  garden: 29,
  parking: 30,
  other: 26,
};

const ENV_CATEGORY_TEMP_RANGE: Record<Building["category"], [number, number]> = {
  academic: [23, 29],
  admin: [22, 27],
  residential: [24, 28],
  sports: [26, 32],
  utility: [25, 31],
  worship: [25, 28],
  dining: [22, 27],
  garden: [27, 34],
  parking: [28, 34],
  other: [24, 30],
};

const ENV_CATEGORY_HUMIDITY_RANGE: Record<Building["category"], [number, number]> = {
  academic: [0.5, 0.72],
  admin: [0.48, 0.65],
  residential: [0.55, 0.78],
  sports: [0.6, 0.85],
  utility: [0.45, 0.65],
  worship: [0.52, 0.72],
  dining: [0.65, 0.88],
  garden: [0.7, 0.9],
  parking: [0.55, 0.78],
  other: [0.5, 0.72],
};

function comfortIndex(temp: number, humidity: number, setpoint: number): number {
  // Simplified PMV-ish: deviate from 24°C & 50% humidity → penalty.
  const tempPenalty = Math.abs(temp - setpoint) * 6;
  const humidityPenalty = Math.abs(humidity - 0.5) * 60;
  return Math.max(0, Math.min(100, 94 - tempPenalty - humidityPenalty));
}

function generateEnvironment(): EnvironmentReading[] {
  const rng = seedrandom(`${SEED}:env`);
  const out: EnvironmentReading[] = [];
  for (const b of BUILDINGS) {
    const [tLo, tHi] = ENV_CATEGORY_TEMP_RANGE[b.category];
    const [hLo, hHi] = ENV_CATEGORY_HUMIDITY_RANGE[b.category];
    const temp = Math.round((tLo + rng() * (tHi - tLo)) * 10) / 10;
    const humidity = Math.round((hLo + rng() * (hHi - hLo)) * 100) / 100;
    const setpoint = ENV_CATEGORY_SETPOINT[b.category];
    const acTotal = b.category === "academic" || b.category === "admin" ? 6 : b.category === "sports" ? 4 : b.category === "dining" ? 3 : 2;
    const activeAc = Math.min(acTotal, Math.round(acTotal * (0.4 + rng() * 0.6)));
    out.push({
      buildingId: b.id,
      name: b.name,
      category: b.category,
      avgTempC: temp,
      avgHumidity: humidity,
      acSetpointC: setpoint,
      comfortIndex: Math.round(comfortIndex(temp, humidity, setpoint)),
      activeAcUnits: activeAc,
      acTotal,
      hvacLoadKw: round1(activeAc * (1.2 + rng() * 1.6)),
      deviationC: Math.round((temp - setpoint) * 10) / 10,
    });
  }
  return out;
}

let _environmentReadings: EnvironmentReading[] | null = null;
export function environmentReadings(): EnvironmentReading[] {
  if (!_environmentReadings) _environmentReadings = generateEnvironment();
  return _environmentReadings;
}

/** Campus-wide aggregates for the /environment KPI strip. */
export function environmentKpi(): {
  avgTempC: number;
  avgHumidity: number;
  comfortIndex: number;
  hvacEfficiency: number;
  hottestDeviationC: number;
  hottestName: string;
  coldestDeviationC: number;
  coldestName: string;
  anomalyCount: number;
} {
  const readings = environmentReadings();
  const avgTempC = round1(readings.reduce((s, r) => s + r.avgTempC, 0) / readings.length);
  const avgHumidity = Math.round((readings.reduce((s, r) => s + r.avgHumidity, 0) / readings.length) * 100) / 100;
  const comfort = Math.round(readings.reduce((s, r) => s + r.comfortIndex, 0) / readings.length);

  const hottest = [...readings].sort((a, b) => b.deviationC - a.deviationC)[0];
  const coldest = [...readings].sort((a, b) => a.deviationC - b.deviationC)[0];

  const totalAcLoad = readings.reduce((s, r) => s + r.hvacLoadKw, 0);
  // Efficiency = (cooling delivered) / (energy in) — synthetic, stable.
  const cooling = readings.reduce((s, r) => s + Math.max(0, r.deviationC * -1 + 2), 0);
  const hvacEfficiency = Math.min(0.98, cooling / Math.max(1, totalAcLoad / 4));

  const anomalies = readings.filter(
    (r) => Math.abs(r.deviationC) >= 3 || r.avgHumidity > 0.82 || r.comfortIndex < 60,
  ).length;

  return {
    avgTempC,
    avgHumidity,
    comfortIndex: comfort,
    hvacEfficiency: Math.round(hvacEfficiency * 100) / 100,
    hottestDeviationC: hottest.deviationC,
    hottestName: hottest.name,
    coldestDeviationC: coldest.deviationC,
    coldestName: coldest.name,
    anomalyCount: anomalies,
  };
}

/** Anomaly feed — entries are already humanized strings. */
export type EnvironmentAnomaly = {
  id: string;
  buildingId: number;
  message: string;
  severity: "info" | "warning" | "critical";
  icon: "temp" | "humid" | "cold";
};

export function environmentAnomalies(limit = 12): EnvironmentAnomaly[] {
  const readings = environmentReadings();
  const out: EnvironmentAnomaly[] = [];
  for (const r of readings) {
    if (r.deviationC >= 3) {
      out.push({
        id: `EA-${r.buildingId}-t`,
        buildingId: r.buildingId,
        severity: r.deviationC >= 5 ? "critical" : "warning",
        icon: "temp",
        message: `${r.name} · ${r.avgTempC.toFixed(1)}°C · setpoint ${r.acSetpointC}°C · +${r.deviationC.toFixed(1)}° dev`,
      });
    } else if (r.deviationC <= -3 && r.activeAcUnits > 0) {
      out.push({
        id: `EA-${r.buildingId}-c`,
        buildingId: r.buildingId,
        severity: "warning",
        icon: "cold",
        message: `${r.name} · ${r.avgTempC.toFixed(1)}°C · unoccupied · AC running`,
      });
    }
    if (r.avgHumidity > 0.84) {
      out.push({
        id: `EA-${r.buildingId}-h`,
        buildingId: r.buildingId,
        severity: r.avgHumidity > 0.9 ? "critical" : "warning",
        icon: "humid",
        message: `${r.name} · humidity ${Math.round(r.avgHumidity * 100)}% · mold risk`,
      });
    }
  }
  // Sort: critical first, then warning; stable by buildingId after.
  const rank: Record<EnvironmentAnomaly["severity"], number> = { critical: 0, warning: 1, info: 2 };
  return out
    .sort((a, b) => rank[a.severity] - rank[b.severity] || a.buildingId - b.buildingId)
    .slice(0, limit);
}

/**
 * Per-building environment intensity for the campus heatmap layer.
 * Returns 0..1 mapped so 0.5 = at setpoint, >0.5 = warm, <0.5 = cold.
 */
export function environmentIntensity(): Record<number, number> {
  const readings = environmentReadings();
  const out: Record<number, number> = {};
  for (const r of readings) {
    // Normalize deviation: -10 → 0, 0 → 0.5, +10 → 1.
    const v = Math.max(0, Math.min(1, 0.5 + r.deviationC / 20));
    out[r.buildingId] = v;
  }
  return out;
}

/* -------------------------------------------------------------------------
   Gas telemetry — CLAUDE-UPDATES PATCH 9
   Only ~8 zones across the campus monitor gas (labs, kitchens, power plant).
   ------------------------------------------------------------------------- */

export type GasType = "co" | "co2" | "lpg" | "combustible";
export type GasStatus = "normal" | "elevated" | "danger";

export type GasReading = {
  id: string;
  buildingId: number;
  zoneLabel: string;           // e.g. "Chem Lab"
  gasType: GasType;
  ppm: number;
  status: GasStatus;
  trend1h: number[];           // mini sparkline, 12 points
  ventilationState: "normal" | "high" | "override";
  gasSupplyValve: "open" | "closed";
};

// PATCH 11 §overlap resolution — only these 8 buildings have gas sensors.
const GAS_ZONES: Array<{ buildingId: number; zoneLabel: string; gasType: GasType }> = [
  { buildingId: 42, zoneLabel: "Chem Lab",                  gasType: "co" },
  { buildingId: 51, zoneLabel: "Engineering Lab",           gasType: "combustible" },
  { buildingId: 9,  zoneLabel: "Dining Hall Kitchen",       gasType: "lpg" },
  { buildingId: 65, zoneLabel: "Power Plant",               gasType: "combustible" },
  { buildingId: 18, zoneLabel: "MT Stall Canteen",          gasType: "lpg" },
  { buildingId: 34, zoneLabel: "Packaging Engineering Lab", gasType: "co2" },
  { buildingId: 44, zoneLabel: "Research Development",      gasType: "co" },
  { buildingId: 87, zoneLabel: "Elementary Canteen",        gasType: "lpg" },
];

export const GAS_THRESHOLDS: Record<GasType, { elevated: number; danger: number; scaleMax: number; label: string }> = {
  co:          { elevated: 10,   danger: 35,   scaleMax: 60,   label: "Carbon monoxide" },
  co2:         { elevated: 1000, danger: 2000, scaleMax: 3500, label: "Carbon dioxide" },
  lpg:         { elevated: 1000, danger: 4000, scaleMax: 6000, label: "LPG / methane" },
  combustible: { elevated: 800,  danger: 2500, scaleMax: 4000, label: "Combustible gas" },
};

function statusFromPpm(type: GasType, ppm: number): GasStatus {
  const t = GAS_THRESHOLDS[type];
  if (ppm >= t.danger) return "danger";
  if (ppm >= t.elevated) return "elevated";
  return "normal";
}

function generateGasReadings(): GasReading[] {
  const rng = seedrandom(`${SEED}:gas`);
  const out: GasReading[] = [];
  for (const z of GAS_ZONES) {
    const t = GAS_THRESHOLDS[z.gasType];
    // Most zones at normal; one perpetually elevated so the demo has drama.
    const elevated = z.buildingId === 65;
    const basePpm = elevated
      ? t.elevated * 1.2
      : t.elevated * (0.15 + rng() * 0.4);
    const ppm = Math.round(basePpm * 10) / 10;
    const trend = Array.from({ length: 12 }, (_, i) => {
      const drift = Math.sin((i / 12) * Math.PI) * basePpm * 0.18;
      const noise = (rng() - 0.5) * basePpm * 0.1;
      return Math.max(0, Math.round((basePpm + drift + noise) * 10) / 10);
    });
    out.push({
      id: `G-${z.buildingId}-${z.gasType}`,
      buildingId: z.buildingId,
      zoneLabel: z.zoneLabel,
      gasType: z.gasType,
      ppm,
      status: statusFromPpm(z.gasType, ppm),
      trend1h: trend,
      ventilationState: "normal",
      gasSupplyValve: "open",
    });
  }
  return out;
}

let _gasReadings: GasReading[] | null = null;
export function gasReadings(): GasReading[] {
  if (!_gasReadings) _gasReadings = generateGasReadings();
  return _gasReadings;
}

/** Mutate a gas zone's state — used by the drill cinematic. */
export function setGasZoneState(
  id: string,
  state: Partial<Pick<GasReading, "ppm" | "status" | "ventilationState" | "gasSupplyValve">>,
): void {
  if (!_gasReadings) _gasReadings = generateGasReadings();
  const z = _gasReadings.find((r) => r.id === id);
  if (!z) return;
  Object.assign(z, state);
}

/** Worst-case air quality pill — "good" / "moderate" / "hazard". */
export function airQualitySummary(): { label: "Good" | "Moderate" | "Hazard"; tone: "ok" | "warn" | "danger" } {
  const worst = gasReadings().reduce<GasStatus>((acc, r) => {
    if (r.status === "danger") return "danger";
    if (r.status === "elevated" && acc !== "danger") return "elevated";
    return acc;
  }, "normal");
  if (worst === "danger") return { label: "Hazard", tone: "danger" };
  if (worst === "elevated") return { label: "Moderate", tone: "warn" };
  return { label: "Good", tone: "ok" };
}

/** 24-hour synthetic overlay — temp & humidity curves with comfort band. */
export function environmentDayOverlay(): Array<{
  hour: number;
  label: string;
  indoorTemp: number;
  outdoorTemp: number;
  humidity: number;
}> {
  const rng = seedrandom(`${SEED}:env:24h`);
  const out = [];
  for (let h = 0; h < 24; h++) {
    // Outdoor hot at noon, cool at 04:00. Manila-ish range 25–33.
    const outdoor = 28 + 4 * Math.sin(((h - 14) / 24) * Math.PI * 2);
    // Indoor roughly tracked via HVAC — smooth around 24, small drift at peak.
    const indoor = 24 + 1.6 * Math.exp(-Math.pow((h - 14) / 3, 2)) - 0.6 * Math.exp(-Math.pow((h - 5) / 4, 2));
    const hum = 0.6 + 0.2 * Math.sin(((h - 20) / 24) * Math.PI * 2) + (rng() - 0.5) * 0.04;
    out.push({
      hour: h,
      label: `${String(h).padStart(2, "0")}:00`,
      indoorTemp: Math.round(indoor * 10) / 10,
      outdoorTemp: Math.round(outdoor * 10) / 10,
      humidity: Math.max(0.4, Math.min(0.95, Math.round(hum * 100) / 100)),
    });
  }
  return out;
}

