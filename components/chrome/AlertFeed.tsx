"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { useAlerts } from "@/lib/stores/useAlerts";
import { time } from "@/lib/utils/format";
import { pad } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { getBuilding } from "@/lib/mock/buildings";
import { Card } from "@/components/primitives/Card";
import { CardTitle } from "@/components/primitives/CardTitle";

const SEV_COLOR: Record<"info" | "warn" | "danger", string> = {
  info: "var(--color-grid)",
  warn: "var(--color-warn)",
  danger: "var(--color-danger)",
};

export function AlertFeed({ limit = 8 }: { limit?: number }) {
  const alerts = useAlerts((s) => s.alerts);
  const ack = useAlerts((s) => s.acknowledge);
  const visible = useMemo(() => alerts.slice(0, limit), [alerts, limit]);

  return (
    <Card className="omni-live flex flex-col">
      <div className="px-5 pt-4 pb-3">
        <CardTitle>Active alerts</CardTitle>
      </div>

      <div className="relative max-h-[420px] flex-1 overflow-y-auto">
        <ul className="flex flex-col">
          <AnimatePresence initial={false}>
            {visible.map((a) => {
              const b = getBuilding(a.buildingId);
              return (
                <motion.li
                  key={a.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  className={cn(
                    "group relative flex items-stretch gap-3 border-b px-5 py-3",
                    "transition-colors",
                    a.acknowledged
                      ? "opacity-50"
                      : "hover:bg-[color-mix(in_oklch,var(--color-surface-2)_92%,var(--color-signal)_8%)]",
                  )}
                  style={{ borderColor: "var(--color-border)" }}
                >
                  <span
                    className="w-[2px] shrink-0 rounded-full"
                    style={{ background: SEV_COLOR[a.severity] }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px] font-medium leading-snug truncate text-[var(--color-fg)]">
                        {a.title}
                      </p>
                      <span className="font-mono text-[10px] text-[var(--color-fg-subtle)] tabular-nums shrink-0">
                        {time(new Date(a.ts))}
                      </span>
                    </div>
                    <Link
                      href={`/building/${a.buildingId}`}
                      className="mt-0.5 block text-[11px] text-[var(--color-fg-muted)] hover:text-[var(--color-signal)]"
                    >
                      <span className="font-mono text-[var(--color-fg-subtle)] tabular-nums">{pad(a.buildingId)}</span>
                      <span className="mx-1.5 text-[var(--color-border-strong)]">·</span>
                      {b?.name ?? "Unknown"}
                    </Link>
                  </div>

                  {!a.acknowledged && (
                    <button
                      onClick={() => ack(a.id)}
                      title="Acknowledge"
                      aria-label="Acknowledge"
                      className={cn(
                        "self-center rounded-[4px] border px-2 py-1",
                        "border-[var(--color-border)] text-[var(--color-fg-subtle)]",
                        "opacity-0 transition-opacity group-hover:opacity-100",
                        "hover:border-[var(--color-signal)] hover:text-[var(--color-signal)]",
                      )}
                    >
                      <Check size={12} strokeWidth={1.6} />
                    </button>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        {visible.length === 0 && (
          <div className="grid place-items-center px-6 py-10">
            <p className="font-serif italic text-[18px] text-[var(--color-fg-muted)]">
              All clear.
            </p>
            <p
              className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]"
              suppressHydrationWarning
            >
              No active incidents · last checked {time(new Date())}
            </p>
          </div>
        )}
      </div>

      <Link
        href="/safety"
        className={cn(
          "flex items-center justify-between border-t px-5 py-2.5",
          "text-[11px] text-[var(--color-fg-muted)]",
          "hover:text-[var(--color-signal)] hover:border-[var(--color-signal)]",
        )}
        style={{ borderColor: "var(--color-border)" }}
      >
        <span>Open safety operations</span>
        <ArrowRight size={12} strokeWidth={1.6} />
      </Link>
    </Card>
  );
}
