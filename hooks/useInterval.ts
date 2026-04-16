"use client";

import { useEffect, useRef } from "react";

/**
 * Reliable setInterval — keeps the latest callback in a ref so consumers
 * don't have to memoize, but the interval itself is recreated only when
 * `delay` changes (or stops when null).
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;
    const id = window.setInterval(() => saved.current(), delay);
    return () => window.clearInterval(id);
  }, [delay]);
}
