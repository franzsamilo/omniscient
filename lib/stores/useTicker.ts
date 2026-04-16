"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { type TickerEvent, seedTickerEvents } from "@/lib/mock/ticker";

type TickerState = {
  events: TickerEvent[];
  push: (event: TickerEvent) => void;
};

const MAX_EVENTS = 60;

export const useTicker = create<TickerState>()(
  subscribeWithSelector((set) => ({
    events: seedTickerEvents(8),
    push: (event) =>
      set((s) => ({
        events: [event, ...s.events].slice(0, MAX_EVENTS),
      })),
  })),
);
