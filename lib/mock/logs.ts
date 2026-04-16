/**
 * Unified sensor log — CLAUDE-UPDATES PATCH 8.
 *
 * One event shape for every sensor source. The `/logs` page, the bottom
 * console ticker, and (indirectly) the /safety gas drill all read from
 * this stream. Seeded for stable first paint; the live tick pushes fresh
 * entries.
 */

import seedrandom from "seedrandom";
import { SEED } from "@/lib/constants";
import { BUILDINGS } from "@/lib/mock/buildings";
import { pad } from "@/lib/utils/format";

export type LogSource =
  | "temp"
  | "humidity"
  | "occupancy"
  | "power"
  | "water"
  | "rfid"
  | "gas"
  | "seismic";

export type LogSeverity = "info" | "warning" | "critical";

export type SensorLog = {
  id: string;
  timestamp: number;           // epoch ms
  source: LogSource;
  severity: LogSeverity;
  buildingId: number;
  roomId?: string;
  message: string;
  value?: number;
  previousValue?: number;
  unit?: string;
};

const ROOMS = ["GF", "1F", "2F", "3F", "4F", "B1"];
const RFID_NAMES = [
  "Martinez, J.",
  "Cruz, A.",
  "Reyes, M.",
  "Bautista, R.",
  "Navarro, T.",
  "Domingo, E.",
  "Unknown",
];

function room(rng: () => number): string {
  const f = ROOMS[Math.floor(rng() * ROOMS.length)];
  const n = 100 + Math.floor(rng() * 240);
  return `${f}-${n}`;
}

function rfidHex(rng: () => number): string {
  return Array.from({ length: 4 }, () =>
    Math.floor(rng() * 256)
      .toString(16)
      .padStart(2, "0")
      .toUpperCase(),
  ).join(":");
}

/** Template pool. Each template takes an RNG + building and returns a SensorLog. */
type Template = (rng: () => number, bldg: { id: number; name: string }) => Omit<SensorLog, "id" | "timestamp">;

const TEMPLATES: Template[] = [
  // TEMP — frequent, mostly info/warning
  (rng, b) => {
    const prev = 24 + rng() * 2;
    const next = prev + (rng() - 0.5) * 6;
    const deviation = next - 24;
    const sev: LogSeverity = Math.abs(deviation) >= 5 ? "warning" : "info";
    return {
      source: "temp",
      severity: sev,
      buildingId: b.id,
      roomId: room(rng),
      value: next,
      previousValue: prev,
      unit: "°C",
      message: `${next.toFixed(1)}°C ${deviation >= 0 ? "above" : "below"} setpoint · Δ ${deviation >= 0 ? "+" : ""}${deviation.toFixed(1)}°`,
    };
  },
  // HUMIDITY
  (rng, b) => {
    const v = Math.round((rng() * 55 + 40) * 10) / 10;
    const sev: LogSeverity = v > 84 ? "warning" : "info";
    return {
      source: "humidity",
      severity: sev,
      buildingId: b.id,
      roomId: room(rng),
      value: v,
      unit: "%",
      message: `Humidity ${v}% ${v > 84 ? "· mold risk" : "· nominal"}`,
    };
  },
  // OCCUPANCY
  (rng, b) => {
    const prev = Math.floor(rng() * 4);
    const next = Math.floor(rng() * 6);
    return {
      source: "occupancy",
      severity: "info",
      buildingId: b.id,
      roomId: room(rng),
      value: next,
      previousValue: prev,
      message:
        next === 0 && prev > 0
          ? `Occupancy ${prev} → 0 · room vacant`
          : next > prev
            ? `Occupancy ${prev} → ${next} · CV detection`
            : `Occupancy steady at ${next}`,
    };
  },
  // POWER — 3 variants
  (rng, b) => {
    const v = 18 + rng() * 52;
    const ratio = 1 + rng() * 1.1;
    const sev: LogSeverity = ratio >= 1.6 ? "warning" : "info";
    return {
      source: "power",
      severity: sev,
      buildingId: b.id,
      value: v,
      unit: "kW",
      message:
        ratio >= 1.6
          ? `Load ${v.toFixed(1)} kW · ${ratio.toFixed(1)}× baseline`
          : `Load ${v.toFixed(1)} kW`,
    };
  },
  // WATER
  (rng, b) => {
    const leak = rng() < 0.12;
    const v = leak ? 12 + rng() * 18 : 1 + rng() * 4;
    return {
      source: "water",
      severity: leak ? "critical" : "info",
      buildingId: b.id,
      roomId: leak ? `${ROOMS[3]}-restroom` : room(rng),
      value: v,
      unit: "L/min",
      message: leak
        ? `Flow anomaly +${Math.round((v / 2 - 1) * 100)}% · possible leak`
        : `Flow ${v.toFixed(1)} L/min`,
    };
  },
  // RFID
  (rng, b) => {
    const name = RFID_NAMES[Math.floor(rng() * RFID_NAMES.length)];
    const granted = name !== "Unknown";
    return {
      source: "rfid",
      severity: granted ? "info" : "warning",
      buildingId: b.id,
      roomId: "MAIN",
      message: `${rfidHex(rng)} · ${name} · ${granted ? "access granted" : "access denied"}`,
    };
  },
  // GAS — rare
  (rng, b) => {
    const ppm = Math.round((6 + rng() * 30) * 10) / 10;
    const sev: LogSeverity = ppm > 30 ? "critical" : ppm > 10 ? "warning" : "info";
    return {
      source: "gas",
      severity: sev,
      buildingId: b.id,
      roomId: "CHEM LAB",
      value: ppm,
      unit: "PPM",
      message: `CO level ${ppm} PPM ${sev === "info" ? "· nominal" : "· elevated"}`,
    };
  },
  // SEISMIC — very rare
  (rng, b) => {
    const mag = Math.round((0.2 + rng() * 2.3) * 10) / 10;
    return {
      source: "seismic",
      severity: mag > 2 ? "warning" : "info",
      buildingId: b.id,
      value: mag,
      message: `Vibration event ${mag} magnitude · ${mag > 2 ? "monitoring" : "ambient"}`,
    };
  },
];

// Weighting so the stream reads like a real campus:
// temp + humidity heavy, seismic + gas light.
const WEIGHTS = [3, 3, 2, 3, 2, 2, 1, 0.4];

function pickWeighted(rng: () => number): Template {
  const total = WEIGHTS.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < TEMPLATES.length; i++) {
    r -= WEIGHTS[i];
    if (r <= 0) return TEMPLATES[i];
  }
  return TEMPLATES[0];
}

/** Fixed pivot — no Date.now() at module init so SSR/CSR seeds match. */
const SEED_EPOCH = new Date("2026-04-17T00:00:00Z").getTime();

/**
 * Seed a rolling buffer of past events so the feed isn't empty on first paint.
 * Uses a fixed epoch so the server and client render identical HTML — live
 * entries (pushed by `useLive` after mount) use the real clock.
 */
export function seedLogs(count = 400): SensorLog[] {
  const rng = seedrandom(`${SEED}:logs:seed`);
  const out: SensorLog[] = [];

  for (let i = 0; i < count; i++) {
    const tpl = pickWeighted(rng);
    const b = BUILDINGS[Math.floor(rng() * BUILDINGS.length)];
    const partial = tpl(rng, b);
    // Scatter across the 6 hours preceding the epoch.
    const minutesAgo = Math.floor(rng() * 360);
    out.push({
      id: `L-seed-${i}-${b.id}`,
      timestamp: SEED_EPOCH - minutesAgo * 60_000 - Math.floor(rng() * 60_000),
      ...partial,
    });
  }

  return out.sort((a, b) => b.timestamp - a.timestamp);
}

/** Generate N fresh events, used by useLive every tick. */
export function generateLogs(rng: () => number, count = 3, idPrefix = "L-live"): SensorLog[] {
  const out: SensorLog[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const tpl = pickWeighted(rng);
    const b = BUILDINGS[Math.floor(rng() * BUILDINGS.length)];
    const partial = tpl(rng, b);
    out.push({
      id: `${idPrefix}-${now}-${Math.floor(rng() * 1e6)}`,
      timestamp: now - Math.floor(rng() * 900),
      ...partial,
    });
  }
  return out;
}

export const SOURCE_LABEL: Record<LogSource, string> = {
  temp: "Temp",
  humidity: "Humid",
  occupancy: "Occupancy",
  power: "Power",
  water: "Water",
  rfid: "RFID",
  gas: "Gas",
  seismic: "Seismic",
};

export const SOURCE_COLOR: Record<LogSource, string> = {
  temp: "var(--color-warn)",
  humidity: "var(--color-grid)",
  occupancy: "var(--color-signal)",
  power: "var(--color-solar)",
  water: "var(--color-grid)",
  rfid: "var(--color-fg-muted)",
  gas: "var(--color-danger)",
  seismic: "var(--color-seismic)",
};

export const SEVERITY_COLOR: Record<LogSeverity, string> = {
  info: "var(--color-fg-subtle)",
  warning: "var(--color-warn)",
  critical: "var(--color-danger)",
};

/** Format a log as a ticker line (reused by the bottom console). */
export function logAsTickerText(log: SensorLog): string {
  const iconMap: Record<LogSource, string> = {
    temp: "🌡",
    humidity: "💧",
    occupancy: "👥",
    power: "⚡",
    water: "🚰",
    rfid: "🔑",
    gas: "⚠",
    seismic: "〰",
  };
  const loc = log.roomId ? `BLDG ${pad(log.buildingId)} · ${log.roomId}` : `BLDG ${pad(log.buildingId)}`;
  return `${iconMap[log.source]} ${loc} · ${log.message.toUpperCase()}`;
}
