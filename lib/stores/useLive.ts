"use client";

/**
 * Live tick — the single setInterval that drives the demo's "realtime" feel
 * (CLAUDE.md §7). Each tick:
 *   - emits a ticker event (always)
 *   - rolls a 12% chance to push an alert
 *   - bumps an internal counter so consumers can subscribe to "tick"
 *
 * Pages reading from this store re-render on each tick implicitly because
 * the stores it pushes into (useTicker, useAlerts) emit selectors.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import seedrandom from "seedrandom";
import { SEED } from "@/lib/constants";
import { useAlerts } from "@/lib/stores/useAlerts";
import { useTicker } from "@/lib/stores/useTicker";
import { generateAlert } from "@/lib/mock/alerts";
import { generateTickerEvent } from "@/lib/mock/ticker";

type LiveState = {
  tick: number;
  startedAt: number | null;
  start: () => void;
  stop: () => void;
};

let intervalId: ReturnType<typeof setInterval> | null = null;
const liveRng = seedrandom(`${SEED}:live`);
let alertCounter = 0;

export const useLive = create<LiveState>()(
  subscribeWithSelector((set, get) => ({
    tick: 0,
    startedAt: null,
    start: () => {
      if (intervalId !== null) return;
      set({ startedAt: Date.now() });
      intervalId = setInterval(() => {
        // Always: push a ticker event.
        useTicker.getState().push(generateTickerEvent(liveRng));

        // 12% chance: push an alert.
        if (liveRng() < 0.12) {
          alertCounter += 1;
          useAlerts.getState().push(generateAlert(liveRng, alertCounter));
        }

        set({ tick: get().tick + 1 });
      }, 1500);
    },
    stop: () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      set({ startedAt: null });
    },
  })),
);
