export type Role = "admin" | "engineer" | "facilities" | "viewer";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  initials: string;
  rfidUid: string;
  lastSeen: number; // ms ago from now
  active: boolean;
};

export const USERS: User[] = [
  {
    id: "U-001",
    name: "Atty. Maria Santos",
    email: "msantos@uphsl.edu.ph",
    role: "admin",
    initials: "MS",
    rfidUid: "0xA5F2C711",
    lastSeen: 4 * 60_000,
    active: true,
  },
  {
    id: "U-002",
    name: "Eng. Roberto Villanueva",
    email: "rvillanueva@uphsl.edu.ph",
    role: "engineer",
    initials: "RV",
    rfidUid: "0xB81E3490",
    lastSeen: 1 * 60_000,
    active: true,
  },
  {
    id: "U-003",
    name: "Janine Tarroza",
    email: "jtarroza@uphsl.edu.ph",
    role: "facilities",
    initials: "JT",
    rfidUid: "0xC9E0F12A",
    lastSeen: 18 * 60_000,
    active: true,
  },
  {
    id: "U-004",
    name: "Prof. Lorraine Catubig",
    email: "lcatubig@uphsl.edu.ph",
    role: "viewer",
    initials: "LC",
    rfidUid: "0x71B2A845",
    lastSeen: 46 * 60_000,
    active: true,
  },
  {
    id: "U-005",
    name: "Karl Fernan",
    email: "kfernan@uphsl.edu.ph",
    role: "facilities",
    initials: "KF",
    rfidUid: "0xD4F0019C",
    lastSeen: 2 * 60_000,
    active: true,
  },
  {
    id: "U-006",
    name: "Carmen Lim",
    email: "clim@uphsl.edu.ph",
    role: "viewer",
    initials: "CL",
    rfidUid: "0x6FAA3D02",
    lastSeen: 60 * 60_000,
    active: false,
  },
  {
    id: "U-007",
    name: "Eng. Patricia Borja",
    email: "pborja@uphsl.edu.ph",
    role: "engineer",
    initials: "PB",
    rfidUid: "0xA10B9F44",
    lastSeen: 12 * 60_000,
    active: true,
  },
  {
    id: "U-008",
    name: "Mark Salazar",
    email: "msalazar@uphsl.edu.ph",
    role: "facilities",
    initials: "MS",
    rfidUid: "0xE2C7B091",
    lastSeen: 3 * 60_000,
    active: true,
  },
  {
    id: "U-009",
    name: "Dr. Helene Pinpin",
    email: "hpinpin@uphsl.edu.ph",
    role: "admin",
    initials: "HP",
    rfidUid: "0x4A88F123",
    lastSeen: 5 * 60_000,
    active: true,
  },
  {
    id: "U-010",
    name: "Vince Demonteverde",
    email: "vdemonteverde@uphsl.edu.ph",
    role: "viewer",
    initials: "VD",
    rfidUid: "0x9CC0E7B4",
    lastSeen: 240 * 60_000,
    active: false,
  },
];

export const ROLE_CAPABILITIES = [
  { capability: "View overview", admin: true, engineer: true, facilities: true, viewer: true },
  { capability: "View map (PLAN/SPATIAL)", admin: true, engineer: true, facilities: true, viewer: true },
  { capability: "Acknowledge alerts", admin: true, engineer: true, facilities: true, viewer: false },
  { capability: "Toggle equipment manually", admin: true, engineer: true, facilities: false, viewer: false },
  { capability: "Run seismic drill", admin: true, engineer: false, facilities: false, viewer: false },
  { capability: "Modify automation policies", admin: true, engineer: true, facilities: false, viewer: false },
  { capability: "Generate AI insights", admin: true, engineer: true, facilities: false, viewer: false },
  { capability: "Create work orders", admin: true, engineer: true, facilities: true, viewer: false },
  { capability: "Manage users / RBAC", admin: true, engineer: false, facilities: false, viewer: false },
  { capability: "Export telemetry data", admin: true, engineer: true, facilities: false, viewer: false },
] as const;
