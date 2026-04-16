import { BUILDINGS } from "@/lib/mock/buildings";
import { streamRng, pick, range, rangeInt } from "@/lib/mock/seed";

export type AlertSeverity = "info" | "warn" | "danger";

export type Alert = {
  id: string;
  ts: number; // epoch ms
  severity: AlertSeverity;
  buildingId: number;
  title: string;
  detail: string;
  acknowledged?: boolean;
};

const TITLES_BY_SEVERITY: Record<AlertSeverity, string[]> = {
  info: [
    "Schedule completed",
    "Maintenance window opened",
    "Solar yield above forecast",
    "Auto-revert engaged",
  ],
  warn: [
    "Load 1.5× baseline",
    "Cooling setpoint drift",
    "Occupancy ≠ device state",
    "Demand peak observed",
    "Humidity tolerance breached",
  ],
  danger: [
    "Load 1.8× baseline",
    "Breaker overcurrent",
    "Water flow anomaly",
    "Surge detected",
    "Cooling unit failure",
  ],
};

/** Seed an initial feed of N alerts. */
export function seedAlerts(count = 8): Alert[] {
  const rng = streamRng("alerts:seed");
  const now = Date.now();
  const alerts: Alert[] = [];

  for (let i = 0; i < count; i++) {
    const sev: AlertSeverity =
      rng() < 0.12 ? "danger" : rng() < 0.55 ? "warn" : "info";
    const b = pick(rng, BUILDINGS);
    const title = pick(rng, TITLES_BY_SEVERITY[sev]);
    const minutesAgo = rangeInt(rng, 1, 240);
    alerts.push({
      id: `A-${(now - i * 1000).toString(36)}-${i}`,
      ts: now - minutesAgo * 60_000,
      severity: sev,
      buildingId: b.id,
      title,
      detail: `${b.name} · ${title.toLowerCase()}`,
      acknowledged: rng() < 0.2,
    });
  }

  return alerts.sort((a, b) => b.ts - a.ts);
}

/** Generate one fresh alert from the live tick's RNG. */
export function generateAlert(rng: () => number, idCounter: number): Alert {
  const sev: AlertSeverity =
    rng() < 0.1 ? "danger" : rng() < 0.5 ? "warn" : "info";
  const b = BUILDINGS[Math.floor(rng() * BUILDINGS.length)];
  const titles = TITLES_BY_SEVERITY[sev];
  const title = titles[Math.floor(rng() * titles.length)];
  return {
    id: `A-${Date.now().toString(36)}-${idCounter}`,
    ts: Date.now(),
    severity: sev,
    buildingId: b.id,
    title,
    detail: `${b.name} · ${title.toLowerCase()}`,
  };
}
