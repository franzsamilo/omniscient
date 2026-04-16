/**
 * Console ticker events — the terminal-style stream at the bottom of every
 * page (CLAUDE.md §5: bottom "console", 32px tall).
 *
 * Format example:
 *   [21:04:11] ROOM 3F-204 OCCUPANCY=0 → AC OFF
 *
 * Initial seed uses a fixed epoch + seeded RNG so the same HTML renders on
 * the server and the client — `Date.now()` and `Math.random()` at module
 * init produced SSR/CSR drift and broke hydration for the bottom console.
 */

import { BUILDINGS } from "@/lib/mock/buildings";
import { time } from "@/lib/utils/format";
import { pad } from "@/lib/utils/format";
import { streamRng, pick } from "@/lib/mock/seed";

export type TickerEvent = {
  id: string;
  ts: Date;
  text: string;
  /** Tone for color hint (default neutral). */
  tone?: "neutral" | "ok" | "warn" | "danger" | "signal";
};

const ROOM_PREFIXES = ["GF", "1F", "2F", "3F", "4F", "B1"];

/** Stable pivot time for seeded events — no wall-clock calls at import time. */
const SEED_EPOCH = new Date("2026-04-17T00:00:00Z").getTime();

type TemplatePart = Pick<TickerEvent, "text" | "tone">;
type TemplateFn = (rng: () => number, b: { id: number; name: string }) => TemplatePart;

const TEMPLATES: TemplateFn[] = [
  (rng) => ({ text: `ROOM ${room(rng)} OCCUPANCY=0 → AC OFF`, tone: "ok" }),
  (rng) => ({ text: `ROOM ${room(rng)} LIGHTS AUTO → ON`, tone: "neutral" }),
  (rng, b) => ({ text: `BLDG ${pad(b.id)} LOAD ${(rng() * 80 + 10).toFixed(1)} kW`, tone: "neutral" }),
  (rng, b) => ({ text: `BLDG ${pad(b.id)} SOLAR YIELD +${(rng() * 12).toFixed(1)} kWh`, tone: "ok" }),
  (rng, b) => ({ text: `RFID 0x${hex(rng)} GRANTED · ${b.name.toUpperCase()}`, tone: "signal" }),
  (rng, b) => ({ text: `BLDG ${pad(b.id)} WATER FLOW ${(rng() * 6 + 1).toFixed(2)} L/s`, tone: "neutral" }),
  (rng, b) => ({ text: `AI ANALYSIS QUEUE +1 · ${b.name.toUpperCase().slice(0, 28)}`, tone: "signal" }),
  (rng, b) => ({ text: `SCHEDULE ENGAGED · BLDG ${pad(b.id)} HVAC SETPOINT 24.0°C`, tone: "neutral" }),
  (rng) => ({ text: `ROOM ${room(rng)} TEMP ${(rng() * 4 + 24).toFixed(1)}°C HUMID ${(rng() * 30 + 50).toFixed(0)}%`, tone: "neutral" }),
  (rng, b) => ({ text: `ANOMALY · BLDG ${pad(b.id)} DRAW 1.${4 + Math.floor(rng() * 6)}× BASELINE`, tone: "warn" }),
];

function room(rng: () => number): string {
  const floor = ROOM_PREFIXES[Math.floor(rng() * ROOM_PREFIXES.length)];
  const num = String(Math.floor(rng() * 30) + 100).padStart(3, "0");
  return `${floor}-${num}`;
}

function hex(rng: () => number): string {
  return Array.from({ length: 8 }, () =>
    Math.floor(rng() * 16).toString(16).toUpperCase(),
  ).join("");
}

/** Seed an initial backlog — deterministic. Later ticks replace these live. */
export function seedTickerEvents(count = 6): TickerEvent[] {
  const rng = streamRng("ticker:seed");
  const out: TickerEvent[] = [];
  for (let i = 0; i < count; i++) {
    const tpl = pick(rng, TEMPLATES);
    const b = pick(rng, BUILDINGS);
    const part = tpl(rng, b);
    out.push({
      id: `T-seed-${i}-${b.id}`,
      ts: new Date(SEED_EPOCH - (count - i) * 1500),
      text: part.text,
      tone: part.tone,
    });
  }
  return out;
}

/** Produce one fresh event at live-tick time (client-only). */
export function generateTickerEvent(rng: () => number): TickerEvent {
  const tpl = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
  const b = BUILDINGS[Math.floor(rng() * BUILDINGS.length)];
  const part = tpl(rng, b);
  return {
    id: `T-${Date.now().toString(36)}-${b.id}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    ts: new Date(),
    text: part.text,
    tone: part.tone,
  };
}

/** Pretty timestamp prefix used in the UI. */
export function tickerTimestamp(d: Date): string {
  return `[${time(d)}]`;
}
