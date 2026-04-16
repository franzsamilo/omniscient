"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { RouteShutter } from "@/components/chrome/RouteShutter";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <RouteShutter key={pathname}>{children}</RouteShutter>
    </AnimatePresence>
  );
}
