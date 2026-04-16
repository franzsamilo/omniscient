"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Moon, Sun, RotateCcw, Hash } from "lucide-react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { Pill } from "@/components/primitives/Pill";
import { Toggle } from "@/components/primitives/Toggle";
import { SegmentedControl } from "@/components/primitives/SegmentedControl";
import { SEED } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export default function SettingsPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [seed, setSeed] = useState(SEED);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="10" label="Settings" />
        <Pill tone="neutral">v0.1 · demo build</Pill>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Theme */}
        <Card surface={1} className="p-5">
          <SectionHeader index="10A" label="Theme" />
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-serif italic text-[20px] text-[var(--color-fg)]">
                {theme === "dark" ? "Dark mode — active" : "Light mode (preview)"}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
                Light theme is a stub — design in progress.
              </p>
            </div>
            <SegmentedControl
              value={theme}
              onChange={(v) => setTheme(v)}
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
              ]}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Sample label="Dark" Icon={Moon} active={theme === "dark"} />
            <Sample label="Light" Icon={Sun} active={theme === "light"} ghost />
          </div>
        </Card>

        {/* Motion */}
        <Card surface={1} className="p-5">
          <SectionHeader index="10B" label="Motion" />
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-serif italic text-[20px] text-[var(--color-fg)]">
                Reduce motion
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
                Switches all animations to opacity-only @ 120ms.
              </p>
            </div>
            <Toggle on={reduceMotion} onToggle={() => setReduceMotion((v) => !v)} />
          </div>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
            (System `prefers-reduced-motion` is respected automatically — this is a manual override.)
          </p>
        </Card>

        {/* Seed */}
        <Card surface={1} className="p-5">
          <SectionHeader index="10C" label="Demo data seed" />
          <div className="mt-4">
            <label className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
              Seed
            </label>
            <div className="mt-2 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] text-[var(--color-fg-subtle)]">
                <Hash size={14} strokeWidth={1.6} />
              </span>
              <input
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className={cn(
                  "flex-1 rounded-[var(--radius-sm)] border bg-[var(--color-bg)] px-3 py-2",
                  "font-mono text-[12px] tabular-nums text-[var(--color-fg)]",
                  "border-[var(--color-border-strong)] focus:border-[var(--color-signal)] focus:outline-none",
                )}
              />
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
              Identifier for the deterministic mock-data generator.
            </p>
          </div>
        </Card>

        {/* Reset */}
        <Card surface={1} className="p-5">
          <SectionHeader index="10D" label="Reset" />
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="font-serif italic text-[20px] text-[var(--color-fg)]">
                Reset demo data
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
                Reseeds telemetry, alerts, controls. Reloads the page.
              </p>
            </div>

            {confirming ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    sessionStorage.removeItem("omniscient:seen-intro");
                    location.reload();
                  }}
                >
                  Yes, reset
                </Button>
                <Button variant="ghost" size="md" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="md" onClick={() => setConfirming(true)}>
                <RotateCcw size={14} strokeWidth={1.6} />
                Reset
              </Button>
            )}
          </div>
        </Card>
      </div>

      <Card surface={1} className="mt-4 p-5">
        <SectionHeader index="10E" label="About" />
        <div className="mt-4 grid grid-cols-2 gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)] md:grid-cols-4">
          <Meta k="Build" v="0.1.0 · demo" />
          <Meta k="Stack" v="Next 16 · React 19" />
          <Meta k="Render" v="Tailwind v4 · Motion 12 · R3F" />
          <Meta k="Region" v="Asia/Manila · PHT" />
        </div>
        <p className="mt-6 font-serif italic text-[20px] text-[var(--color-fg-muted)]">
          Nothing goes unmeasured.
        </p>
      </Card>
    </div>
  );
}

function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p>{k}</p>
      <p className="mt-1 text-[var(--color-fg)] tabular-nums">{v}</p>
    </div>
  );
}

function Sample({
  label,
  Icon,
  active,
  ghost,
}: {
  label: string;
  Icon: typeof Moon;
  active: boolean;
  ghost?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-sm)] border p-4 transition-colors",
        ghost ? "opacity-40" : undefined,
        active ? "border-[var(--color-signal)] bg-[color-mix(in_oklch,var(--color-signal)_8%,transparent)]" : "border-[var(--color-border)]",
      )}
    >
      <Icon size={16} strokeWidth={1.5} className={active ? "text-[var(--color-signal)]" : "text-[var(--color-fg-subtle)]"} />
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg)]">{label}</p>
      <div className="mt-3 grid grid-cols-4 gap-1">
        {["bg", "surface-2", "fg-muted", "signal"].map((tok) => (
          <span
            key={tok}
            className="h-3 rounded-sm"
            style={{ background: `var(--color-${tok})` }}
          />
        ))}
      </div>
    </div>
  );
}
