"use client";

/**
 * useNow — returns the current epoch ms, ticking every `intervalMs` (default 1s).
 *
 * Centralizes the "now" reference so consumers don't call `Date.now()` during
 * render (React 19's compiler rules flag that as impure). The first render
 * returns `0` on the server and `Date.now()` on the client after mount,
 * mirroring the clock-hydration pattern used in Topbar.
 */

import { useEffect, useState } from "react";

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    // Intentional: the only way to reach `Date.now()` without failing
    // hydration is to defer it to mount, which is what this does.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    if (intervalMs <= 0) return;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}
