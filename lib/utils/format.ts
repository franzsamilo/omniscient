/* CLAUDE.md §10 — every number in the UI must pass through one of these. */

import { format as fmtDate } from "date-fns";

const PESO = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const PESO_DECIMAL = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

export function peso(value: number): string {
  return PESO.format(value);
}

export function pesoShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}₱${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}₱${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}₱${(abs / 1_000).toFixed(1)}K`;
  return PESO_DECIMAL.format(value);
}

export function kwh(value: number): string {
  return `${value.toFixed(2)} kWh`;
}

export function kw(value: number): string {
  return `${value.toFixed(1)} kW`;
}

export function tempC(value: number): string {
  return `${value.toFixed(1)}°C`;
}

export function humidity(value: number): string {
  return `${Math.round(value)}%`;
}

export function percent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function percentDecimal(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

export function time(d: Date): string {
  return fmtDate(d, "HH:mm:ss");
}

export function timeShort(d: Date): string {
  return fmtDate(d, "HH:mm");
}

export function date(d: Date): string {
  return fmtDate(d, "dd MMM yyyy");
}

export function dateTime(d: Date): string {
  return `${date(d)} · ${time(d)}`;
}

/** Pad an integer for fixed-width display (e.g., building IDs). */
export function pad(n: number, width = 3): string {
  return String(n).padStart(width, "0");
}

/** Compact integer with thousands separators. */
export function int(value: number): string {
  return new Intl.NumberFormat("en-PH").format(Math.round(value));
}
