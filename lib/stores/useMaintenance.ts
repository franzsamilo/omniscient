"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { INITIAL_TICKETS, type MaintenanceTicket, type TicketStatus } from "@/lib/mock/maintenance";

type State = {
  tickets: MaintenanceTicket[];
  add: (t: MaintenanceTicket) => void;
  move: (id: string, status: TicketStatus) => void;
};

export const useMaintenance = create<State>()(
  subscribeWithSelector((set) => ({
    tickets: INITIAL_TICKETS,
    add: (t) => set((s) => ({ tickets: [t, ...s.tickets] })),
    move: (id, status) =>
      set((s) => ({
        tickets: s.tickets.map((t) => (t.id === id ? { ...t, status } : t)),
      })),
  })),
);
