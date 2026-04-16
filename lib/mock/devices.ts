/**
 * Devices — fake fixtures and equipment grouped by building.
 *
 * Each building has a set of representative devices. The controls page lists
 * them grouped by building; the safety drill flips "non-critical" devices off.
 */

import { BUILDINGS, type Building } from "@/lib/mock/buildings";
import { streamRng, rangeInt } from "@/lib/mock/seed";
import { pad } from "@/lib/utils/format";

export type DeviceKind = "lights" | "outlets" | "ac" | "fans" | "valve" | "pump" | "ev";

export type Device = {
  id: string;
  buildingId: number;
  /** Pseudo room code (e.g., "3F-204"). */
  room: string;
  kind: DeviceKind;
  label: string;
  /** True when this device is critical and must NOT be cut by the seismic drill. */
  critical: boolean;
};

const ROOM_PREFIXES = ["GF", "1F", "2F", "3F", "4F", "B1"];

function roomCode(rng: () => number): string {
  const floor = ROOM_PREFIXES[Math.floor(rng() * ROOM_PREFIXES.length)];
  const num = String(rangeInt(rng as never, 100, 320));
  return `${floor}-${num.padStart(3, "0")}`;
}

function deviceLabel(kind: DeviceKind): string {
  const TABLE: Record<DeviceKind, string> = {
    lights: "Lights",
    outlets: "Outlets",
    ac: "AC unit",
    fans: "Ventilation",
    valve: "Water valve",
    pump: "Booster pump",
    ev: "EV charger",
  };
  return TABLE[kind];
}

function deviceMix(category: Building["category"]): Array<{ kind: DeviceKind; weight: number; critical?: boolean }> {
  switch (category) {
    case "academic":
      return [
        { kind: "lights", weight: 4 },
        { kind: "ac", weight: 3 },
        { kind: "outlets", weight: 3 },
        { kind: "fans", weight: 2 },
      ];
    case "admin":
      return [
        { kind: "lights", weight: 3 },
        { kind: "ac", weight: 2 },
        { kind: "outlets", weight: 2 },
      ];
    case "residential":
      return [
        { kind: "lights", weight: 3 },
        { kind: "ac", weight: 3 },
        { kind: "outlets", weight: 2 },
        { kind: "valve", weight: 1, critical: true }, // domestic water = critical
      ];
    case "sports":
      return [
        { kind: "lights", weight: 4 },
        { kind: "fans", weight: 2 },
        { kind: "ac", weight: 1 },
      ];
    case "utility":
      return [
        { kind: "pump", weight: 3, critical: true },
        { kind: "lights", weight: 2 },
        { kind: "valve", weight: 2, critical: true },
      ];
    case "worship":
      return [
        { kind: "lights", weight: 2 },
        { kind: "fans", weight: 1 },
      ];
    case "dining":
      return [
        { kind: "ac", weight: 2 },
        { kind: "lights", weight: 2 },
        { kind: "outlets", weight: 2 },
        { kind: "fans", weight: 1 },
      ];
    case "garden":
      return [
        { kind: "lights", weight: 1 },
        { kind: "valve", weight: 1, critical: true },
      ];
    case "parking":
      return [
        { kind: "lights", weight: 2 },
        { kind: "ev", weight: 1 },
      ];
    default:
      return [{ kind: "lights", weight: 2 }];
  }
}

function pickByWeight<T extends { weight: number }>(rng: () => number, items: T[]): T {
  const total = items.reduce((s, it) => s + it.weight, 0);
  let r = rng() * total;
  for (const it of items) {
    r -= it.weight;
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

function generateDevices(): Device[] {
  const rng = streamRng("devices");
  const out: Device[] = [];
  let counter = 0;

  for (const b of BUILDINGS) {
    const target = rangeInt(rng as never, 4, 9);
    const mix = deviceMix(b.category);

    for (let i = 0; i < target; i++) {
      const slot = pickByWeight(rng, mix);
      counter++;
      out.push({
        id: `D-${pad(b.id, 3)}-${counter}`,
        buildingId: b.id,
        room: roomCode(rng),
        kind: slot.kind,
        label: deviceLabel(slot.kind),
        critical: slot.critical ?? false,
      });
    }
  }
  return out;
}

export const DEVICES: Device[] = generateDevices();

export function devicesForBuilding(buildingId: number): Device[] {
  return DEVICES.filter((d) => d.buildingId === buildingId);
}

/** All non-critical devices — the ones the seismic drill cuts. */
export function nonCriticalDevices(): Device[] {
  return DEVICES.filter((d) => !d.critical);
}
