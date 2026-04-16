"use client";

/**
 * useLogs — rolling sensor-log buffer (CLAUDE-UPDATES PATCH 8).
 * One store feeds /logs, the right-sidebar stats, and the bottom
 * console ticker simultaneously.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { seedLogs, type SensorLog } from "@/lib/mock/logs";

type LogsState = {
  logs: SensorLog[];
  push: (batch: SensorLog[]) => void;
  reset: () => void;
};

const MAX = 2000;

export const useLogs = create<LogsState>()(
  subscribeWithSelector((set) => ({
    logs: seedLogs(400),
    push: (batch) =>
      set((s) => ({
        logs: [...batch, ...s.logs].slice(0, MAX),
      })),
    reset: () => set({ logs: seedLogs(400) }),
  })),
);
