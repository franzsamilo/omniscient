"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTicker } from "@/lib/stores/useTicker";
import { useLive } from "@/lib/stores/useLive";
import { tickerTimestamp } from "@/lib/mock/ticker";
import type { TickerEvent } from "@/lib/mock/ticker";
import { cn } from "@/lib/utils/cn";

const TONE_COLOR: Record<NonNullable<TickerEvent["tone"]>, string> = {
  neutral: "text-[var(--color-fg-muted)]",
  ok: "text-[var(--color-ok)]",
  warn: "text-[var(--color-warn)]",
  danger: "text-[var(--color-danger)]",
  signal: "text-[var(--color-signal)]",
};

export function ConsoleTicker() {
  const events = useTicker((s) => s.events);
  const tick = useLive((s) => s.tick);
  const railRef = useRef<HTMLDivElement>(null);

  // Auto-scroll back to start on each new event so the ticker reads left→right.
  useEffect(() => {
    if (railRef.current) railRef.current.scrollLeft = 0;
  }, [tick]);

  return (
    <div
      className={cn(
        "flex h-8 shrink-0 items-center gap-2 border-t px-4",
        "bg-[var(--color-surface-1)]",
      )}
      style={{ borderColor: "var(--color-border)" }}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
        STREAM
      </span>
      <span className="size-1 rounded-full bg-[var(--color-signal)] animate-[pulse_1.4s_ease-in-out_infinite]" />

      <div
        ref={railRef}
        className="omni-ticker-text flex flex-1 items-center gap-6 overflow-hidden whitespace-nowrap font-mono text-[11px]"
      >
        <AnimatePresence initial={false}>
          {events.slice(0, 14).map((e, i) => (
            <motion.span
              key={e.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1 - i * 0.06, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "shrink-0",
                TONE_COLOR[e.tone ?? "neutral"],
              )}
            >
              <span className="text-[var(--color-fg-subtle)]">
                {tickerTimestamp(e.ts)}
              </span>{" "}
              {e.text}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
