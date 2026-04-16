"use client";

/**
 * Landing / intro (CLAUDE.md §6.1).
 *
 * Phase 1: minimal cold-open with the wordmark + tagline + CTA. The full
 * GSAP cinematic (campus assembly, monogram draw, etc.) lands in §6.E.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { OmniscientEye } from "@/components/icons/Omniscient";
import { APP_NAME, APP_TAGLINE, APP_SUBTITLE } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

const SEEN_KEY = "omniscient:seen-intro";

export default function Landing() {
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SEEN_KEY)) {
      router.replace("/overview");
      return;
    }
    sessionStorage.setItem(SEEN_KEY, "1");

    const t = setTimeout(() => setShouldRedirect(true), 4000);
    const onKey = () => setShouldRedirect(true);
    window.addEventListener("keydown", onKey, { once: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [router]);

  useEffect(() => {
    if (shouldRedirect) router.push("/overview");
  }, [shouldRedirect, router]);

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="absolute top-12 font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-fg-subtle)]"
      >
        INITIALIZING OMNISCIENT // SMART CAMPUS ENERGY MANAGEMENT
        <motion.span
          aria-hidden
          className="ml-2 inline-block w-2 align-middle"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          _
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.72, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="text-[var(--color-signal)]"
      >
        <OmniscientEye size={88} scanning />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.72, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "mt-10 font-serif uppercase tracking-[0.04em]",
          "text-[length:var(--text-display)] leading-none",
        )}
      >
        {APP_NAME}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.42, delay: 1.4 }}
        className="mt-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-fg-subtle)]"
      >
        {APP_SUBTITLE}
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.42, delay: 2.0 }}
        className="mt-10 font-serif italic text-[24px] text-[var(--color-fg-muted)]"
      >
        {APP_TAGLINE}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.42, delay: 2.6 }}
        className="mt-12"
      >
        <Link
          href="/overview"
          className={cn(
            "inline-flex items-center gap-3 rounded-[var(--radius-sm)] border px-6 py-3",
            "font-mono text-[11px] uppercase tracking-[0.24em]",
            "border-[var(--color-signal)] text-[var(--color-signal)]",
            "transition-colors hover:bg-[color-mix(in_oklch,var(--color-signal)_14%,transparent)]",
            "animate-[pulse_2s_ease-in-out_infinite]",
          )}
        >
          Enter command center →
        </Link>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.42, delay: 3.4 }}
        className="absolute bottom-12 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-fg-subtle)]"
      >
        Press any key to skip · auto-advance in 4s
      </motion.p>
    </div>
  );
}
