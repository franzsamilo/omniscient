"use client";

/**
 * Route transition shutter (CLAUDE.md §4.6 #7) — used by app/template.tsx so
 * each route change plays a 400ms horizontal wipe.
 */

import { motion } from "motion/react";

export function RouteShutter({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24, filter: "blur(4px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
