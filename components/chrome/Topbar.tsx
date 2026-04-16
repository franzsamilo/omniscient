"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { OmniscientEye } from "@/components/icons/Omniscient";
import { Pill } from "@/components/primitives/Pill";
import { useAlerts } from "@/lib/stores/useAlerts";
import { useUser } from "@/lib/stores/useUser";
import { useLive } from "@/lib/stores/useLive";
import { findRoute } from "@/lib/routes";
import { cn } from "@/lib/utils/cn";

function useClock(): string {
  const [s, setS] = useState<string>(() => fmtPHT(new Date()));
  useEffect(() => {
    const id = setInterval(() => setS(fmtPHT(new Date())), 1000);
    return () => clearInterval(id);
  }, []);
  return s;
}

function fmtPHT(d: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(d);
}

export function Topbar() {
  const clock = useClock();
  const pathname = usePathname();
  const route = findRoute(pathname);
  const alerts = useAlerts((s) => s.alerts);
  const unack = alerts.filter((a) => !a.acknowledged).length;
  const liveStarted = useLive((s) => s.startedAt !== null);
  const user = useUser();

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center justify-between gap-4 border-b px-5",
        "bg-[var(--color-surface-1)]",
      )}
      style={{ borderColor: "var(--color-border)" }}
    >
      {/* Left — wordmark + monogram */}
      <div className="flex items-center gap-3">
        <span className="text-[var(--color-signal)]">
          <OmniscientEye size={22} scanning />
        </span>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-[13px] font-medium uppercase tracking-[0.18em] text-[var(--color-fg)]">
            OMNISCIENT
          </span>
          {route && (
            <>
              <span className="text-[var(--color-border-strong)]">·</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]">
                {route.index} {route.label}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right — clock, status, alerts, user */}
      <div className="flex items-center gap-4">
        <span
          className="font-mono text-[12px] tracking-[0.14em] text-[var(--color-fg-muted)] tabular-nums"
          aria-label="Current time, Manila"
        >
          {clock} <span className="text-[var(--color-fg-subtle)]">PHT</span>
        </span>

        <Pill tone={liveStarted ? "ok" : "neutral"} pulse={liveStarted}>
          {liveStarted ? "All systems observed" : "Idle"}
        </Pill>

        <AlertsBadge count={unack} />

        <div className="flex items-center gap-2 border-l border-[var(--color-border)] pl-4">
          <span
            className={cn(
              "grid size-7 place-items-center rounded-full",
              "bg-[var(--color-surface-3)] text-[10px] font-medium uppercase tracking-wider",
              "ring-1 ring-[var(--color-border-strong)]",
            )}
          >
            {user.initials}
          </span>
          <div className="hidden flex-col items-start lg:flex">
            <span className="text-[12px] font-medium leading-none text-[var(--color-fg)]">
              {user.name}
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-fg-subtle)]">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function AlertsBadge({ count }: { count: number }) {
  return (
    <div className="relative">
      <Pill tone={count > 0 ? "danger" : "neutral"} pulse={count > 0}>
        Alerts
        <span className="ml-1 text-[var(--color-fg)] tabular-nums">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={count}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block"
            >
              {String(count).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
        </span>
      </Pill>
    </div>
  );
}
