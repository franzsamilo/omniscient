"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { DEVICES, type Device } from "@/lib/mock/devices";
import { streamRng } from "@/lib/mock/seed";

export type MasterMode = "auto" | "semi-auto" | "manual";

type DeviceState = {
  on: boolean;
  /** Set when a user manually flipped this device against the AI policy. */
  manualOverrideUntil: number | null; // epoch ms; null = no override
};

type ControlsState = {
  master: MasterMode;
  devices: Record<string, DeviceState>;
  /** Trigger flag — true while a seismic drill is running. */
  drillActive: boolean;

  setMaster: (m: MasterMode) => void;
  toggle: (id: string, source?: "manual" | "auto") => void;
  set: (id: string, on: boolean, source?: "manual" | "auto") => void;
  triggerSeismicDrill: () => void;
  endSeismicDrill: () => void;
};

const OVERRIDE_MINUTES = 30;

function seedInitial(): Record<string, DeviceState> {
  // Deterministic — Math.random() at module init caused SSR/CSR hydration
  // drift because the server and client computed different initial device
  // on/off layouts. Seeded RNG produces identical output either side.
  const rng = streamRng("controls:seed");
  const map: Record<string, DeviceState> = {};
  for (const d of DEVICES) {
    map[d.id] = {
      on: d.critical ? true : rng() > 0.18,
      manualOverrideUntil: null,
    };
  }
  return map;
}

export const useControls = create<ControlsState>()(
  subscribeWithSelector((set) => ({
    master: "auto",
    devices: seedInitial(),
    drillActive: false,

    setMaster: (m) => set({ master: m }),

    toggle: (id, source = "manual") =>
      set((s) => {
        const cur = s.devices[id];
        if (!cur) return s;
        const next = !cur.on;
        return {
          devices: {
            ...s.devices,
            [id]: {
              on: next,
              manualOverrideUntil:
                source === "manual" ? Date.now() + OVERRIDE_MINUTES * 60_000 : cur.manualOverrideUntil,
            },
          },
        };
      }),

    set: (id, on, source = "manual") =>
      set((s) => {
        const cur = s.devices[id];
        if (!cur) return s;
        return {
          devices: {
            ...s.devices,
            [id]: {
              on,
              manualOverrideUntil:
                source === "manual" ? Date.now() + OVERRIDE_MINUTES * 60_000 : cur.manualOverrideUntil,
            },
          },
        };
      }),

    triggerSeismicDrill: () =>
      set((s) => {
        const next = { ...s.devices };
        for (const d of DEVICES) {
          if (!d.critical) {
            next[d.id] = { on: false, manualOverrideUntil: null };
          }
        }
        return { drillActive: true, devices: next };
      }),

    endSeismicDrill: () => set({ drillActive: false }),
  })),
);

/** Selector helper. */
export function deviceById(id: string): Device | undefined {
  return DEVICES.find((d) => d.id === id);
}
