"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, ArrowRight, ChevronRight } from "lucide-react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Pill } from "@/components/primitives/Pill";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { OmniscientEye } from "@/components/icons/Omniscient";
import { RECOMMENDATIONS, TOTAL_PROJECTED_SAVINGS, type Recommendation, type Pivot } from "@/lib/mock/recommendations";
import { BUILDINGS } from "@/lib/mock/buildings";
import { peso, pesoShort, pad, time } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const PIVOT_TONE: Record<Pivot, "warn" | "danger" | "signal"> = {
  TIME: "signal",
  SAFETY: "danger",
  FACILITY: "warn",
};

const GENERATING_LINES = [
  "Indexing 24h × 101 buildings · 7,008,480 telemetry samples observed.",
  "Cross-referencing CV occupancy with HVAC setpoints…",
  "Detecting 4 candidates with payback under 6 months.",
  "Composing rationale · referencing similar campuses (n=7)…",
];

export default function AiPage() {
  const [items, setItems] = useState<Recommendation[]>(RECOMMENDATIONS);
  const [open, setOpen] = useState<Recommendation | null>(null);
  const [generating, setGenerating] = useState(false);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="07" label="What OMNISCIENT noticed" />
        <div className="flex items-center gap-3 text-[11px] text-[var(--color-fg-subtle)]">
          <Pill tone="signal" pulse>
            <Sparkles size={10} strokeWidth={1.6} />
            {items.length} insights
          </Pill>
          <span className="hidden md:inline">
            Total projected · {pesoShort(TOTAL_PROJECTED_SAVINGS)} / mo
          </span>
        </div>
      </div>

      {/* Generate banner — left has the engine status, right has the obvious primary action */}
      <Card
        surface={1}
        className="mt-5 omni-live p-5"
        style={{
          borderColor: "var(--color-border-strong)",
          borderWidth: 2,
          boxShadow: generating
            ? "0 0 0 1px var(--color-signal), 0 0 32px -8px var(--color-signal-glow)"
            : undefined,
        }}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="shrink-0 text-[var(--color-signal)]">
              <OmniscientEye size={40} scanning thinking={generating} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[var(--color-fg-subtle)]">Insight engine</p>
              <p className="mt-0.5 truncate font-serif italic text-[20px] leading-snug text-[var(--color-fg)]">
                {generating ? "Watching the campus think…" : "Ready when you are."}
              </p>
              <p className="mt-1 text-[11px] text-[var(--color-fg-muted)]">
                Asks OMNISCIENT to scan today's telemetry and surface new opportunities.
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={generating}
            onClick={() => generate(items, setItems, setGenerating)}
            className={cn(
              "group relative inline-flex shrink-0 items-center gap-3 self-start md:self-auto",
              "rounded-[var(--radius-sm)] px-7 py-3.5",
              "font-mono text-[12px] font-medium uppercase tracking-[0.22em]",
              "bg-[var(--color-signal)] text-[var(--color-bg)]",
              "shadow-[0_0_24px_-6px_var(--color-signal-glow)]",
              "ring-1 ring-[var(--color-signal)] ring-offset-2 ring-offset-[var(--color-surface-1)]",
              "transition-all duration-200 ease-[var(--ease-omni)]",
              "hover:brightness-110 hover:shadow-[0_0_36px_-4px_var(--color-signal-glow)]",
              "active:scale-[0.98]",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <Sparkles
              size={16}
              strokeWidth={1.8}
              className={cn(
                "transition-transform duration-200",
                "group-hover:scale-110",
                generating && "animate-spin",
              )}
            />
            <span>{generating ? "Analyzing…" : "Generate new insights"}</span>
          </button>
        </div>

        {generating && <GeneratingStream />}
      </Card>

      {/* Inbox */}
      <div className="mt-4 grid grid-cols-1 gap-3">
        {items.map((r, i) => (
          <RecRow key={r.id} rec={r} delay={i * 0.05} onOpen={() => setOpen(r)} />
        ))}
      </div>

      {/* Drawer */}
      <Dialog.Root open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/55 backdrop-blur-md"
                />
              </Dialog.Overlay>

              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, x: 64 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 64 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed right-0 top-0 z-50 h-full w-[min(92vw,560px)]"
                >
                  <RecDrawer rec={open} onClose={() => setOpen(null)} />
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  );
}

function generate(
  items: Recommendation[],
  setItems: (r: Recommendation[]) => void,
  setGenerating: (v: boolean) => void,
) {
  setGenerating(true);
  setTimeout(() => {
    // After 2.8s, prepend a freshly-minted recommendation
    const fresh: Recommendation = {
      ...RECOMMENDATIONS[Math.floor(Math.random() * RECOMMENDATIONS.length)],
      id: `R-${Date.now().toString(36)}`,
      title: "Idle classroom HVAC mid-afternoon — auto-suggested",
      rationale:
        "Three classrooms in the College of Education ran cooling between 13:30 and 15:00 with no detected occupancy. A single shared sensor + control rule would intercept this pattern campus-wide.",
      generatedAt: Date.now(),
      savingsPerMonth: Math.round(8000 + Math.random() * 24000),
    };
    setItems([fresh, ...items]);
    setGenerating(false);
  }, 2800);
}

function GeneratingStream() {
  const [text, setText] = useState("");
  const idxRef = useRef(0);
  const [lineIdx, setLineIdx] = useState(0);

  useEffect(() => {
    setText("");
    idxRef.current = 0;
    setLineIdx(0);
    const id = setInterval(() => {
      const fullText = GENERATING_LINES.slice(0, lineIdx + 1).join("\n");
      if (idxRef.current < fullText.length) {
        idxRef.current += Math.max(2, Math.floor((150 / 1000) * 16)); // ~150 chars/sec
        setText(fullText.slice(0, idxRef.current));
      } else if (lineIdx < GENERATING_LINES.length - 1) {
        setLineIdx((i) => i + 1);
      }
    }, 16);
    return () => clearInterval(id);
  }, [lineIdx]);

  return (
    <div className="mt-4 rounded-[var(--radius-sm)] border bg-[var(--color-bg)] p-4 font-mono text-[11px] leading-relaxed text-[var(--color-fg-muted)]" style={{ borderColor: "var(--color-border)" }}>
      <pre className="whitespace-pre-wrap break-words">
        {text}
        <span className="ml-1 inline-block h-[10px] w-[6px] -mb-[1px] animate-[pulse_0.8s_ease-in-out_infinite] bg-[var(--color-signal)]" />
      </pre>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]">
        <motion.div
          className="h-full bg-[var(--color-signal)]"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

function RecRow({ rec, delay, onOpen }: { rec: Recommendation; delay: number; onOpen: () => void }) {
  const targets = rec.buildingIds.map((id) => BUILDINGS.find((b) => b.id === id)?.name).filter(Boolean) as string[];
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
      className="group block w-full text-left"
    >
      <Card surface={1} className="omni-live transition-colors group-hover:border-[var(--color-border-strong)]">
        <div className="grid grid-cols-1 items-center gap-3 px-5 py-4 md:grid-cols-[2fr_auto_auto_auto]">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-medium text-[var(--color-fg)]">{rec.title}</p>
              {rec.pivots.map((p) => (
                <Pill key={p} tone={PIVOT_TONE[p]}>
                  {p}
                </Pill>
              ))}
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-fg-subtle)]">
              {targets.slice(0, 2).join(" · ")}{targets.length > 2 ? ` +${targets.length - 2}` : ""}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-[var(--color-fg-subtle)]">Savings / mo</p>
            <p className="mt-0.5 font-mono text-[16px] tabular-nums text-[var(--color-ok)]">
              {pesoShort(rec.savingsPerMonth)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-[var(--color-fg-subtle)]">Effort</p>
            <div className="mt-0.5"><Pill tone={rec.effort === "low" ? "ok" : rec.effort === "high" ? "danger" : "warn"}>{rec.effort}</Pill></div>
          </div>

          <ChevronRight
            size={18}
            strokeWidth={1.5}
            className="text-[var(--color-fg-subtle)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-signal)]"
          />
        </div>
      </Card>
    </motion.button>
  );
}

function RecDrawer({ rec, onClose }: { rec: Recommendation; onClose: () => void }) {
  const targets = rec.buildingIds.map((id) => BUILDINGS.find((b) => b.id === id)).filter((b): b is NonNullable<typeof b> => !!b);
  const max = Math.max(...rec.miniSeries.flatMap((p) => [p.baseline, p.proposed]));
  return (
    <Card surface={1} className="flex h-full flex-col overflow-hidden border-l border-[var(--color-border-strong)]">
      <div className="flex items-start justify-between gap-4 border-b px-6 py-5" style={{ borderColor: "var(--color-border)" }}>
        <div>
          <Dialog.Title className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            {rec.id} · GENERATED {time(new Date(rec.generatedAt))}
          </Dialog.Title>
          <p className="mt-2 font-serif italic text-[24px] leading-snug text-[var(--color-fg)]">
            {rec.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {rec.pivots.map((p) => (
              <Pill key={p} tone={PIVOT_TONE[p]}>
                {p}
              </Pill>
            ))}
            <Pill tone="signal">{Math.round(rec.confidence * 100)}% confidence</Pill>
          </div>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 text-[var(--color-fg-subtle)] hover:bg-[var(--color-surface-2)]">
          <X size={16} strokeWidth={1.6} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          Affected buildings
        </p>
        <ul className="mt-2 flex flex-col gap-1">
          {targets.map((b) => (
            <li key={b.id} className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--color-fg)]">{b.name}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                BLDG {pad(b.id)}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          Rationale
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-fg-muted)]">
          {rec.rationale}
        </p>

        <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          Baseline vs proposed (24h)
        </p>
        <div className="mt-3 rounded-[var(--radius-sm)] border bg-[var(--color-bg)] p-4" style={{ borderColor: "var(--color-border)" }}>
          <svg viewBox="0 0 240 80" width="100%" height={120} preserveAspectRatio="none">
            {rec.miniSeries.map((p, i) => {
              const x = (i / (rec.miniSeries.length - 1)) * 240;
              const baseY = 80 - (p.baseline / max) * 70;
              const propY = 80 - (p.proposed / max) * 70;
              return (
                <g key={i}>
                  <line x1={x} y1={baseY} x2={x} y2={propY} stroke="var(--color-signal)" strokeWidth={0.6} />
                </g>
              );
            })}
            <path
              d={`M ${rec.miniSeries
                .map((p, i) => `${(i / (rec.miniSeries.length - 1)) * 240} ${80 - (p.baseline / max) * 70}`)
                .join(" L ")}`}
              fill="none"
              stroke="var(--color-fg-subtle)"
              strokeDasharray="2 2"
              strokeWidth={1}
            />
            <path
              d={`M ${rec.miniSeries
                .map((p, i) => `${(i / (rec.miniSeries.length - 1)) * 240} ${80 - (p.proposed / max) * 70}`)
                .join(" L ")}`}
              fill="none"
              stroke="var(--color-ok)"
              strokeWidth={1.4}
            />
          </svg>
          <div className="mt-2 flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-px w-3 bg-[var(--color-fg-subtle)]" /> Baseline
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-px w-3 bg-[var(--color-ok)]" /> Proposed
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Savings / mo" value={peso(rec.savingsPerMonth)} tone="ok" />
          <Stat label="Effort" value={rec.effort.toUpperCase()} tone={rec.effort === "low" ? "ok" : rec.effort === "high" ? "danger" : "warn"} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t px-6 py-4" style={{ borderColor: "var(--color-border)" }}>
        <Button variant="ghost" size="md" onClick={onClose}>
          Dismiss
        </Button>
        <Button variant="primary" size="md">
          Create work order
          <ArrowRight size={12} strokeWidth={1.6} />
        </Button>
      </div>
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "ok" | "warn" | "danger" }) {
  const color = tone === "ok" ? "var(--color-ok)" : tone === "warn" ? "var(--color-warn)" : "var(--color-danger)";
  return (
    <div className="rounded-[var(--radius-sm)] border p-3" style={{ borderColor: "var(--color-border)" }}>
      <p className="text-[11px] text-[var(--color-fg-subtle)]">{label}</p>
      <p className="mt-1 font-mono text-[16px] tabular-nums" style={{ color }}>{value}</p>
    </div>
  );
}
