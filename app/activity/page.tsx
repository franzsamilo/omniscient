"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { X, Camera } from "lucide-react";
import { SectionHeader } from "@/components/primitives/SectionHeader";
import { Pill } from "@/components/primitives/Pill";
import { Card } from "@/components/primitives/Card";
import { CctvScene } from "@/components/scenes/CctvScene";
import { BUILDINGS } from "@/lib/mock/buildings";
import { streamRng, rangeInt } from "@/lib/mock/seed";
import { time, pad } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

type TileData = {
  id: string;
  buildingId: number;
  buildingName: string;
  room: string;
  count: number;
  status: "OCCUPIED" | "EMPTY" | "ANOMALY";
};

function buildTiles(): TileData[] {
  const rng = streamRng("activity:tiles");
  const sample = BUILDINGS.slice(0, 12);
  return sample.map((b, i) => {
    const r = (rng as never) as () => number;
    const count = rangeInt(r as never, 0, 18);
    const status: TileData["status"] = count === 0 ? "EMPTY" : rng() < 0.12 ? "ANOMALY" : "OCCUPIED";
    return {
      id: `T-${b.id}-${i}`,
      buildingId: b.id,
      buildingName: b.name,
      room: `${["GF", "1F", "2F", "3F"][i % 4]}-${100 + i * 7}`,
      count,
      status,
    };
  });
}

export default function ActivityPage() {
  const tiles = useMemo(buildTiles, []);
  const [open, setOpen] = useState<TileData | null>(null);

  const totals = useMemo(() => {
    return tiles.reduce(
      (s, t) => {
        s.detected += t.count;
        if (t.status === "ANOMALY") s.anomalies++;
        if (t.status === "OCCUPIED") s.occupied++;
        return s;
      },
      { detected: 0, anomalies: 0, occupied: 0 },
    );
  }, [tiles]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-6 pt-5 pb-6">
      <div className="flex items-center justify-between gap-4">
        <SectionHeader index="05" label="Personnel detection" />
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
          <Pill tone={totals.anomalies > 0 ? "danger" : "ok"} pulse>
            {totals.anomalies > 0 ? `${totals.anomalies} anomaly` : "Nominal"}
          </Pill>
          <span>{totals.detected} detected · {totals.occupied}/12 active</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              onClick={() => setOpen(t)}
              className="group relative block w-full overflow-hidden rounded-[var(--radius-md)] border bg-[var(--color-surface-1)] text-left transition-colors hover:border-[var(--color-border-strong)]"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center justify-between px-3 pt-3">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                    CAM {pad(i + 1, 2)} · BLDG {pad(t.buildingId)}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] font-medium text-[var(--color-fg)]">
                    {t.buildingName}
                  </p>
                </div>
                <Pill tone={t.status === "ANOMALY" ? "danger" : t.status === "OCCUPIED" ? "ok" : "neutral"}>
                  {t.status}
                </Pill>
              </div>

              <div className="mt-3 px-3 pb-3">
                <CctvScene seed={t.id} detectedCount={t.count} status={t.status} liveBadge />
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                    {t.room}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif italic text-[28px] tabular-nums leading-none text-[var(--color-fg)]">
                      {t.count}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                      DETECTED
                    </span>
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        ))}
      </div>

      {/* Detail modal */}
      <Dialog.Root open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,1100px)] -translate-x-1/2 -translate-y-1/2"
                >
                  <Card surface={1} className="overflow-hidden">
                    <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: "var(--color-border)" }}>
                      <div>
                        <Dialog.Title className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                          BLDG {pad(open.buildingId)} · {open.room}
                        </Dialog.Title>
                        <p className="mt-0.5 font-serif italic text-[20px] text-[var(--color-fg)]">
                          {open.buildingName}
                        </p>
                      </div>
                      <Dialog.Close className="rounded-full p-1.5 text-[var(--color-fg-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]">
                        <X size={16} strokeWidth={1.6} />
                      </Dialog.Close>
                    </div>

                    <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
                      <div className="lg:col-span-2">
                        <CctvScene seed={`${open.id}-modal`} detectedCount={open.count} status={open.status} liveBadge />
                      </div>
                      <div className="flex flex-col gap-3">
                        <Stat label="Detected" value={String(open.count)} />
                        <Stat label="Status" value={open.status} tone={open.status === "ANOMALY" ? "danger" : open.status === "OCCUPIED" ? "ok" : "neutral"} />
                        <Stat label="Capacity" value={`${open.count}/40`} />
                        <DetectionTimeline buildingId={open.buildingId} />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "danger" | "neutral" }) {
  const color =
    tone === "ok"
      ? "var(--color-ok)"
      : tone === "danger"
        ? "var(--color-danger)"
        : "var(--color-fg)";
  return (
    <div className="rounded-[var(--radius-sm)] border p-3" style={{ borderColor: "var(--color-border)" }}>
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">{label}</p>
      <p className="mt-1 font-mono text-[16px] tabular-nums" style={{ color }}>{value}</p>
    </div>
  );
}

function DetectionTimeline({ buildingId }: { buildingId: number }) {
  const events = useMemo(() => {
    const rng = streamRng(`activity:timeline:${buildingId}`);
    const now = Date.now();
    return Array.from({ length: 6 }, (_, i) => ({
      ts: new Date(now - i * 4 * 60_000 - Math.floor(rng() * 30_000)),
      delta: Math.floor(rng() * 5) + (i % 2 === 0 ? 1 : -1),
    }));
  }, [buildingId]);

  return (
    <div className="rounded-[var(--radius-sm)] border p-3" style={{ borderColor: "var(--color-border)" }}>
      <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        Recent events
      </p>
      <ul className="mt-2 flex flex-col gap-1 font-mono text-[10px] text-[var(--color-fg-muted)]">
        {events.map((e, i) => (
          <li key={i} className="flex items-center justify-between">
            <span>{time(e.ts)}</span>
            <span className={cn(
              "tabular-nums",
              e.delta > 0 ? "text-[var(--color-ok)]" : "text-[var(--color-danger)]",
            )}>
              {e.delta > 0 ? "+" : ""}{e.delta}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
