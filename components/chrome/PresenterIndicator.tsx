"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUi } from "@/lib/stores/useUi";

export function PresenterIndicator() {
  const presenter = useUi((s) => s.presenter);

  // Auto-hide cursor after 2s of no movement when in presenter mode.
  useEffect(() => {
    if (!presenter) {
      document.body.style.cursor = "";
      return;
    }
    let timer: number | null = null;
    const showCursor = () => {
      document.body.style.cursor = "";
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        document.body.style.cursor = "none";
      }, 2000);
    };
    window.addEventListener("mousemove", showCursor);
    showCursor();
    return () => {
      window.removeEventListener("mousemove", showCursor);
      if (timer) window.clearTimeout(timer);
      document.body.style.cursor = "";
    };
  }, [presenter]);

  // Apply 0.85× animation speed via CSS variable.
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--omni-anim-speed",
      presenter ? "0.85" : "1",
    );
  }, [presenter]);

  return (
    <AnimatePresence>
      {presenter && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none fixed right-4 top-16 z-[70] inline-flex items-center gap-2 rounded-full border bg-[var(--color-surface-1)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-signal)]"
          style={{ borderColor: "var(--color-border-strong)" }}
        >
          <span className="size-1.5 rounded-full bg-[var(--color-signal)] animate-[pulse_1.4s_ease-in-out_infinite]" />
          PRESENTING
        </motion.div>
      )}
    </AnimatePresence>
  );
}
