/**
 * Console ticker events — the terminal-style stream at the bottom of every
 * page (CLAUDE.md §5: bottom "console", 32px tall).
 *
 * Format example:
 *   [21:04:11] ROOM 3F-204 OCCUPANCY=0 → AC OFF
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

const TEMPLATES: Array<(rng: () => number, b: { id: number; name: string }) => TickerEvent> = [
  (rng, b) => mk(`ROOM ${room(rng)} OCCUPANCY=0 → AC OFF`, "ok", b),
  (rng, b) => mk(`ROOM ${room(rng)} LIGHTS AUTO → ON`, "neutral", b),
  (rng, b) => mk(`BLDG ${pad(b.id)} LOAD ${(rng() * 80 + 10).toFixed(1)} kW`, "neutral", b),
  (rng, b) => mk(`BLDG ${pad(b.id)} SOLAR YIELD +${(rng() * 12).toFixed(1)} kWh`, "ok", b),
  (rng, b) => mk(`RFID 0x${hex(rng)} GRANTED · ${b.name.toUpperCase()}`, "signal", b),
  (rng, b) => mk(`BLDG ${pad(b.id)} WATER FLOW ${(rng() * 6 + 1).toFixed(2)} L/s`, "neutral", b),
  (rng, b) => mk(`AI ANALYSIS QUEUE +1 · ${b.name.toUpperCase().slice(0, 28)}`, "signal", b),
  (rng, b) => mk(`SCHEDULE ENGAGED · BLDG ${pad(b.id)} HVAC SETPOINT 24.0°C`, "neutral", b),
  (rng, b) => mk(`ROOM ${room(rng)} TEMP ${(rng() * 4 + 24).toFixed(1)}°C HUMID ${(rng() * 30 + 50).toFixed(0)}%`, "neutral", b),
  (rng, b) => mk(`ANOMALY · BLDG ${pad(b.id)} DRAW 1.${4 + Math.floor(rng() * 6)}× BASELINE`, "warn", b),
];

function mk(text: string, tone: TickerEvent["tone"], b: { id: number }): TickerEvent {
  return {
    id: `T-${Date.now().toString(36)}-${b.id}-${Math.floor(Math.random() * 1e6).toString(36)}`,
    ts: new Date(),
    text,
    tone,
  };
}

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

/** Seed an initial small backlog so the ticker isn't empty on first paint. */
export function seedTickerEvents(count = 6): TickerEvent[] {
  const rng = streamRng("ticker:seed");
  const out: TickerEvent[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const tpl = pick(rng, TEMPLATES);
    const b = pick(rng, BUILDINGS);
    const ev = tpl(rng, b);
    ev.ts = new Date(now - (count - i) * 1500);
    out.push(ev);
  }
  return out;
}

/** Produce one fresh event from the live RNG. */
export function generateTickerEvent(rng: () => number): TickerEvent {
  const tpl = TEMPLATES[Math.floor(rng() * TEMPLATES.length)];
  const b = BUILDINGS[Math.floor(rng() * BUILDINGS.length)];
  return tpl(rng, b);
}

/** Pretty timestamp prefix used in the UI. */
export function tickerTimestamp(d: Date): string {
  return `[${time(d)}]`;
}
