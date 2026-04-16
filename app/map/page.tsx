"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Box, MousePointerClick, Layers, X, KeyRound } from "lucide-react";
import { CampusMap } from "@/components/map/CampusMap";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Pill } from "@/components/primitives/Pill";
import { cn } from "@/lib/utils/cn";

const HELPER_DISMISS_KEY = "omniscient:map-helper-dismissed";

export default function MapPage() {
  const [helperOpen, setHelperOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem(HELPER_DISMISS_KEY) !== "1";
  });

  const dismissHelper = () => {
    setHelperOpen(false);
    if (typeof window !== "undefined")
      sessionStorage.setItem(HELPER_DISMISS_KEY, "1");
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-6 pt-5 pb-4">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="02" label="Campus map" />
        <div className="flex items-center gap-3 text-[11px] text-[var(--color-fg-subtle)]">
          <Pill tone="signal" pulse>Live</Pill>
          <Hint k="M" label="toggle plan / spatial" />
          <Hint k="L" label="cycle layers" />
        </div>
      </div>

      <div className="relative mt-4 flex-1 min-h-0">
        <CampusMap
          size="full"
          allowModeToggle
          showScrubber
          enableZoomPan
        />

        {/* First-visit helper card — explains how to use the map */}
        <AnimatePresence>
          {helperOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "pointer-events-auto absolute left-3 top-3 z-10 max-w-[280px]",
                "rounded-[var(--radius-md)] border-2 bg-[var(--color-surface-1)] p-4",
                "shadow-[0_2px_12px_-4px_rgba(0,0,0,0.6)]",
              )}
              style={{ borderColor: "var(--color-border-strong)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-signal)]">
                  How to read this map
                </p>
                <button
                  onClick={dismissHelper}
                  className="rounded-full p-0.5 text-[var(--color-fg-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
                  aria-label="Dismiss helper"
                >
                  <X size={12} strokeWidth={1.6} />
                </button>
              </div>

              <ul className="mt-3 flex flex-col gap-2 text-[12px] text-[var(--color-fg-muted)]">
                <HelperRow Icon={MousePointerClick}>
                  <strong className="text-[var(--color-fg)]">Hover</strong> any building
                  for live kW + status. <strong className="text-[var(--color-fg)]">Click</strong> to drill in.
                </HelperRow>
                <HelperRow Icon={Layers}>
                  Top-right panel: switch between <strong className="text-[var(--color-fg)]">heatmap</strong>,{" "}
                  <strong className="text-[var(--color-fg)]">occupancy</strong>, water, or flag-only views.
                </HelperRow>
                <HelperRow Icon={Box}>
                  Tap <strong className="text-[var(--color-fg)]">SPATIAL</strong> (or press{" "}
                  <kbd className="mx-0.5 rounded border border-[var(--color-border-strong)] px-1 py-px font-mono text-[9px] uppercase tracking-wider text-[var(--color-fg)]">
                    M
                  </kbd>
                  ) to extrude buildings. Drag to orbit.
                </HelperRow>
                <HelperRow Icon={KeyRound}>
                  Drag the time scrubber at the bottom to replay the last 24 hours.
                </HelperRow>
              </ul>

              <button
                onClick={dismissHelper}
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-signal)]"
              >
                Got it →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!helperOpen && (
          <button
            onClick={() => setHelperOpen(true)}
            className={cn(
              "pointer-events-auto absolute left-3 top-3 z-10",
              "rounded-full border-2 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] font-mono",
              "bg-[var(--color-surface-1)] text-[var(--color-fg-muted)]",
              "hover:text-[var(--color-signal)] hover:border-[var(--color-signal)]",
              "transition-colors",
            )}
            style={{ borderColor: "var(--color-border-strong)" }}
          >
            ? Help
          </button>
        )}
      </div>
    </div>
  );
}

function Hint({ k, label }: { k: string; label: string }) {
  return (
    <span className="hidden items-center gap-1.5 md:inline-flex">
      <kbd className="rounded border border-[var(--color-border-strong)] px-1.5 py-px font-mono text-[10px] uppercase tracking-wider text-[var(--color-fg)]">
        {k}
      </kbd>
      <span>{label}</span>
    </span>
  );
}

function HelperRow({
  Icon,
  children,
}: {
  Icon: typeof Box;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-[3px] bg-[var(--color-surface-3)] text-[var(--color-fg-muted)]">
        <Icon size={11} strokeWidth={1.6} />
      </span>
      <span className="leading-snug">{children}</span>
    </li>
  );
}
