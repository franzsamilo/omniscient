import { BUILDINGS } from "@/lib/mock/buildings";
import { streamRng, pick, range, rangeInt } from "@/lib/mock/seed";
import { pad } from "@/lib/utils/format";

/** Fixed pivot — the seed fires at module init (SSR + CSR); Date.now() drifts. */
const MAINTENANCE_SEED_EPOCH = new Date("2026-04-17T00:00:00Z").getTime();

export type TicketStatus = "Requested" | "Scheduled" | "In Progress" | "Done";
export type TicketKind = "electrical" | "hvac" | "plumbing" | "carpentry" | "data" | "lighting";
export type Priority = "low" | "medium" | "high";

export type MaintenanceTicket = {
  id: string;
  title: string;
  buildingId: number;
  kind: TicketKind;
  priority: Priority;
  status: TicketStatus;
  requestedBy: string;
  requestedAt: number;
  description?: string;
};

const REQUESTERS = [
  "Atty. M. Santos",
  "Eng. R. Villanueva",
  "Prof. L. Catubig",
  "J. Tarroza · Facilities",
  "K. Fernan · Security",
  "C. Lim · Registrar",
];

const TITLES_BY_KIND: Record<TicketKind, string[]> = {
  electrical: [
    "Flickering ceiling lights — third row",
    "Outlet sparking on bench 4",
    "Breaker tripped twice this week",
    "Uninterruptible supply alarm beep",
  ],
  hvac: [
    "AC not cooling below 27°C",
    "Loud rattling from supply duct",
    "Thermostat unresponsive after weekend",
    "Condensate dripping at unit 03",
  ],
  plumbing: [
    "Lavatory faucet stuck open",
    "Slow drain in chemistry sink",
    "Water hammer in supply line",
    "Toilet flush valve replacement",
  ],
  carpentry: [
    "Door hinge sagging — closing room",
    "Whiteboard mount loose",
    "Cabinet drawer slide broken",
  ],
  data: [
    "Wi-Fi dead spot near room 2F-204",
    "Switch in IDF 02 amber alarm",
    "Cable run for new printer",
  ],
  lighting: [
    "Hallway tube failed — east wing",
    "Stage spotlight gels need swap",
    "Exit sign battery EOL",
  ],
};

function generateTickets(): MaintenanceTicket[] {
  const rng = streamRng("maintenance");
  const out: MaintenanceTicket[] = [];
  const total = 22;
  const distrib: TicketStatus[] = [
    ...Array(7).fill("Requested"),
    ...Array(5).fill("Scheduled"),
    ...Array(6).fill("In Progress"),
    ...Array(4).fill("Done"),
  ];

  for (let i = 0; i < total; i++) {
    const kind = pick(rng, ["electrical", "hvac", "plumbing", "carpentry", "data", "lighting"] as TicketKind[]);
    const titles = TITLES_BY_KIND[kind];
    const title = pick(rng, titles);
    const b = pick(rng, BUILDINGS);
    const status = distrib[i];
    const priority: Priority = rng() < 0.18 ? "high" : rng() < 0.6 ? "medium" : "low";
    out.push({
      id: `M-${pad(i + 1, 3)}`,
      title,
      buildingId: b.id,
      kind,
      priority,
      status,
      requestedBy: pick(rng, REQUESTERS),
      requestedAt: MAINTENANCE_SEED_EPOCH - rangeInt(rng as never, 1, 240) * 60_000,
      description: undefined,
    });
  }
  return out;
}

export const INITIAL_TICKETS: MaintenanceTicket[] = generateTickets();
