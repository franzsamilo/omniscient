"use client";

/**
 * Global error boundary (CLAUDE.md §6.C, §6.I).
 * Glitched OMNISCIENT wordmark + mono error code + RELOAD button.
 */

import { useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/primitives/Button";
import { time } from "@/lib/utils/format";
import { APP_NAME } from "@/lib/constants";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[OMNI:error-boundary]", error);
  }, [error]);

  return (
    <div className="grid h-full place-items-center px-8">
      <div className="flex max-w-[64ch] flex-col items-center gap-6 text-center">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-serif uppercase tracking-[0.04em] leading-none"
          style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)" }}
        >
          {APP_NAME.split("").map((c, i) => (
            <motion.span
              key={i}
              animate={{
                x: [0, -1, 1, -1, 0],
                color: ["var(--color-fg)", "var(--color-danger)", "var(--color-signal)", "var(--color-fg)"],
              }}
              transition={{
                duration: 0.8 + (i % 4) * 0.1,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
                delay: i * 0.04,
              }}
              style={{ display: "inline-block" }}
            >
              {c}
            </motion.span>
          ))}
        </motion.h1>

        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-danger)]">
          UNHANDLED · {error.digest ?? error.name} · {time(new Date())}
        </p>

        <p className="max-w-[48ch] font-serif italic text-[20px] text-[var(--color-fg-muted)]">
          OMNISCIENT lost the signal. Reloading restores observation.
        </p>

        <Button variant="primary" size="lg" onClick={reset}>
          Reload
        </Button>
      </div>
    </div>
  );
}
