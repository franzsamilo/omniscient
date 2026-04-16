"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { type Alert, seedAlerts } from "@/lib/mock/alerts";

type AlertsState = {
  alerts: Alert[];
  push: (alert: Alert) => void;
  acknowledge: (id: string) => void;
  unacknowledgedCount: () => number;
};

export const useAlerts = create<AlertsState>()(
  subscribeWithSelector((set, get) => ({
    alerts: seedAlerts(8),
    push: (alert) =>
      set((s) => ({
        alerts: [alert, ...s.alerts].slice(0, 80),
      })),
    acknowledge: (id) =>
      set((s) => ({
        alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
      })),
    unacknowledgedCount: () => get().alerts.filter((a) => !a.acknowledged).length,
  })),
);
