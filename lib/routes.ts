import {
  LayoutDashboard,
  Map,
  Zap,
  ToggleLeft,
  Activity,
  ShieldAlert,
  Sparkles,
  Wrench,
  Users,
  Settings,
} from "lucide-react";

export type RouteEntry = {
  path: string;
  label: string;
  index: string;
  Icon: typeof LayoutDashboard;
  /** Geist Mono shortcut (display only — actual hotkeys live in lib/shortcuts.ts). */
  shortcut?: string;
};

export const ROUTES: RouteEntry[] = [
  { path: "/overview",    label: "Overview",     index: "01", Icon: LayoutDashboard, shortcut: "G O" },
  { path: "/map",         label: "Campus Map",   index: "02", Icon: Map,             shortcut: "G M" },
  { path: "/power",       label: "Hybrid Power", index: "03", Icon: Zap,             shortcut: "G P" },
  { path: "/controls",    label: "Controls",     index: "04", Icon: ToggleLeft,      shortcut: "G C" },
  { path: "/activity",    label: "Activity",     index: "05", Icon: Activity,        shortcut: "G A" },
  { path: "/safety",      label: "Safety",       index: "06", Icon: ShieldAlert,     shortcut: "G S" },
  { path: "/ai",          label: "AI",           index: "07", Icon: Sparkles,        shortcut: "G I" },
  { path: "/maintenance", label: "Maintenance",  index: "08", Icon: Wrench,          shortcut: "G T" },
  { path: "/security",    label: "Security",     index: "09", Icon: Users,           shortcut: "G U" },
  { path: "/settings",    label: "Settings",     index: "10", Icon: Settings,        shortcut: "G ," },
];

export function findRoute(pathname: string): RouteEntry | undefined {
  // Exact match wins; otherwise pick the longest prefix (for /building/[id] etc.)
  return (
    ROUTES.find((r) => r.path === pathname) ??
    ROUTES.filter((r) => pathname.startsWith(r.path)).sort(
      (a, b) => b.path.length - a.path.length,
    )[0]
  );
}
