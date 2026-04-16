"use client";

/**
 * ⌘K command palette (CLAUDE.md §6.D).
 *
 * Built on cmdk. Groups: Navigate · Buildings · Actions.
 * Triggered by ⌘K / Ctrl+K (wired in chrome/ShortcutBoot.tsx).
 */

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Map as MapIcon,
  Zap,
  ToggleLeft,
  Activity,
  ShieldAlert,
  Sparkles,
  Wrench,
  Users,
  Settings,
  Layers,
  Box,
  Building2,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
} from "lucide-react";
import { useUi } from "@/lib/stores/useUi";
import { useControls } from "@/lib/stores/useControls";
import { ROUTES } from "@/lib/routes";
import { BUILDINGS } from "@/lib/mock/buildings";
import { pad } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function CommandPalette() {
  const open = useUi((s) => s.paletteOpen);
  const setOpen = useUi((s) => s.setPalette);
  const muted = useUi((s) => s.muted);
  const toggleMute = useUi((s) => s.toggleMute);
  const togglePresenter = useUi((s) => s.togglePresenter);
  const triggerSeismicDrill = useControls((s) => s.triggerSeismicDrill);
  const router = useRouter();

  const close = useCallback(() => setOpen(false), [setOpen]);

  const go = useCallback(
    (path: string) => {
      router.push(path);
      close();
    },
    [router, close],
  );

  const buildingItems = useMemo(
    () =>
      BUILDINGS.map((b) => ({
        id: b.id,
        label: `${pad(b.id)} · ${b.name}`,
        category: b.category,
      })),
    [],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[80] grid place-items-start bg-black/55 backdrop-blur-xl pt-[12vh]"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="w-[min(92vw,640px)] overflow-hidden rounded-[var(--radius-md)] border bg-[var(--color-surface-1)] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.7)]"
            style={{ borderColor: "var(--color-border-strong)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Command label="Command palette" loop>
              <div className="border-b border-[var(--color-border)] px-5 pb-2 pt-4">
                <Command.Input
                  placeholder="Search command, building, action…"
                  className="block w-full bg-transparent text-[18px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none"
                />
              </div>

              <Command.List className="max-h-[60vh] overflow-y-auto px-2 pb-3 pt-2">
                <Command.Empty className="px-4 py-8 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                  No matches
                </Command.Empty>

                <Group label="Navigate">
                  {ROUTES.map((r) => (
                    <Item
                      key={r.path}
                      onSelect={() => go(r.path)}
                      Icon={r.Icon}
                      label={r.label}
                      shortcut={r.shortcut}
                    />
                  ))}
                </Group>

                <Group label="Actions">
                  <Item
                    onSelect={() => {
                      triggerSeismicDrill();
                      go("/safety");
                    }}
                    Icon={ShieldAlert}
                    label="Run seismic drill"
                    shortcut="A · D"
                  />
                  <Item
                    onSelect={() => go("/map?mode=spatial")}
                    Icon={Box}
                    label="Switch map to SPATIAL"
                    shortcut="M"
                  />
                  <Item
                    onSelect={() => go("/map?mode=plan")}
                    Icon={Layers}
                    label="Switch map to PLAN"
                    shortcut="M"
                  />
                  <Item
                    onSelect={() => {
                      togglePresenter();
                      close();
                    }}
                    Icon={Eye}
                    label="Toggle presenter mode"
                    shortcut="P"
                  />
                  <Item
                    onSelect={() => {
                      toggleMute();
                      close();
                    }}
                    Icon={muted ? VolumeX : Volume2}
                    label={muted ? "Unmute audio cues" : "Mute audio cues"}
                    shortcut="."
                  />
                  <Item
                    onSelect={() => {
                      sessionStorage.removeItem("omniscient:seen-intro");
                      location.assign("/");
                    }}
                    Icon={RotateCcw}
                    label="Reseed demo + show intro"
                  />
                </Group>

                <Group label="Buildings">
                  {buildingItems.slice(0, 30).map((b) => (
                    <Item
                      key={b.id}
                      onSelect={() => go(`/building/${b.id}`)}
                      Icon={Building2}
                      label={b.label}
                      meta={b.category}
                    />
                  ))}
                </Group>
              </Command.List>

              <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                <span>↑ ↓ navigate · ↵ select · esc close</span>
                <span className="tabular-nums">⌘K</span>
              </div>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={label}
      className={cn("[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5",
        "[&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[9px]",
        "[&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.22em]",
        "[&_[cmdk-group-heading]]:text-[var(--color-fg-subtle)]",
      )}
    >
      {children}
    </Command.Group>
  );
}

function Item({
  onSelect,
  Icon,
  label,
  shortcut,
  meta,
}: {
  onSelect: () => void;
  Icon: typeof LayoutDashboard;
  label: string;
  shortcut?: string;
  meta?: string;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2",
        "text-[13px] text-[var(--color-fg-muted)]",
        "data-[selected=true]:bg-[color-mix(in_oklch,var(--color-signal)_14%,transparent)]",
        "data-[selected=true]:text-[var(--color-signal)]",
        "cursor-pointer",
      )}
    >
      <Icon size={14} strokeWidth={1.5} />
      <span className="flex-1 truncate">{label}</span>
      {meta && (
        <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          {meta}
        </span>
      )}
      {shortcut && (
        <span className="rounded border border-[var(--color-border)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
          {shortcut}
        </span>
      )}
    </Command.Item>
  );
}
