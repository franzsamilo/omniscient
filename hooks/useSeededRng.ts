"use client";

import { useMemo } from "react";
import seedrandom from "seedrandom";
import { SEED } from "@/lib/constants";

/**
 * Seeded PRNG hook. Defaults to the global seed so reloads stay deterministic.
 * Pass a per-component sub-seed for independent streams.
 */
export function useSeededRng(subSeed?: string): seedrandom.PRNG {
  return useMemo(() => seedrandom(subSeed ? `${SEED}:${subSeed}` : SEED), [subSeed]);
}
