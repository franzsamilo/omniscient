"use client";

import { useEffect } from "react";
import { useLive } from "@/lib/stores/useLive";

/**
 * Mounts once at the root and starts the live tick. Stops on unmount so HMR
 * in dev doesn't leak intervals.
 */
export function LiveBoot() {
  const start = useLive((s) => s.start);
  const stop = useLive((s) => s.stop);

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  return null;
}
