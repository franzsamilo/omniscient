import {
  LayoutDashboard,
  Map,
  Zap,
  Thermometer,
  Droplets,
  ToggleLeft,
  Activity,
  ShieldAlert,
  Sparkles,
  Wrench,
  Users,
  ScrollText,
  Settings,
} from "lucide-react";

/**
 * Sidebar group (CLAUDE-UPDATES PATCH 10).
 * OBSERVE → MONITOR → CONTROL → OPTIMIZE → SYSTEM is the system's
 * cognitive hierarchy. Labels render 9px mono caps with `+0.22em` tracking.
 */
export type RouteGroup = "observe" | "monitor" | "control" | "optimize" | "system";

export type RouteEntry = {
  path: string;
  label: string;
  index: string;
  group: RouteGroup;
  Icon: typeof LayoutDashboard;
  /** Geist Mono shortcut (display only — actual hotkeys live in lib/shortcuts.ts). */
  shortcut?: string;
};

export const ROUTES: RouteEntry[] = [
  // OBSERVE — the full picture
  { path: "/overview",    label: "Overview",     index: "01", group: "observe",  Icon: LayoutDashboard, shortcut: "G O" },
  { path: "/map",         label: "Campus Map",   index: "02", group: "observe",  Icon: Map,             shortcut: "G M" },

  // MONITOR — the incoming signal
  { path: "/power",       label: "Power",        index: "03", group: "monitor",  Icon: Zap,             shortcut: "G P" },
  { path: "/environment", label: "Environment",  index: "04", group: "monitor",  Icon: Thermometer,     shortcut: "G E" },
  { path: "/water",       label: "Water",        index: "05", group: "monitor",  Icon: Droplets,        shortcut: "G W" },
  { path: "/activity",    label: "Activity",     index: "06", group: "monitor",  Icon: Activity,        shortcut: "G A" },

  // CONTROL — act on what is seen
  { path: "/controls",    label: "Controls",     index: "07", group: "control",  Icon: ToggleLeft,      shortcut: "G C" },
  { path: "/safety",      label: "Safety",       index: "08", group: "control",  Icon: ShieldAlert,     shortcut: "G S" },

  // OPTIMIZE — closes the loop
  { path: "/ai",          label: "AI Insights",  index: "09", group: "optimize", Icon: Sparkles,        shortcut: "G I" },
  { path: "/maintenance", label: "Maintenance",  index: "10", group: "optimize", Icon: Wrench,          shortcut: "G T" },

  // SYSTEM — the administrator's surface
  { path: "/logs",        label: "Logs",         index: "11", group: "system",   Icon: ScrollText,      shortcut: "G L" },
  { path: "/security",    label: "Security",     index: "12", group: "system",   Icon: Users,           shortcut: "G U" },
  { path: "/settings",    label: "Settings",     index: "13", group: "system",   Icon: Settings,        shortcut: "G ," },
];

export const GROUP_ORDER: RouteGroup[] = [
  "observe",
  "monitor",
  "control",
  "optimize",
  "system",
];

export const GROUP_LABEL: Record<RouteGroup, string> = {
  observe: "Observe",
  monitor: "Monitor",
  control: "Control",
  optimize: "Optimize",
  system: "System",
};

export function findRoute(pathname: string): RouteEntry | undefined {
  // Exact match wins; otherwise pick the longest prefix (for /building/[id] etc.)
  return (
    ROUTES.find((r) => r.path === pathname) ??
    ROUTES.filter((r) => pathname.startsWith(r.path)).sort(
      (a, b) => b.path.length - a.path.length,
    )[0]
  );
}

export function routesByGroup(): Array<{ group: RouteGroup; routes: RouteEntry[] }> {
  return GROUP_ORDER.map((group) => ({
    group,
    routes: ROUTES.filter((r) => r.group === group),
  }));
}
