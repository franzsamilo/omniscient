import seedrandom from "seedrandom";
import { SEED } from "@/lib/constants";

let _rng: seedrandom.PRNG | null = null;

/** Global seeded PRNG. Reset via resetRng() during dev (Settings → Reset demo). */
export function getRng(): seedrandom.PRNG {
  if (!_rng) _rng = seedrandom(SEED);
  return _rng;
}

export function resetRng(seed: string = SEED): void {
  _rng = seedrandom(seed);
}

/** Independent named stream — useful when you want repeatable randomness per domain. */
export function streamRng(name: string): seedrandom.PRNG {
  return seedrandom(`${SEED}:${name}`);
}

/** Pick one element from a list. */
export function pick<T>(rng: seedrandom.PRNG, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/** Float in [min, max). */
export function range(rng: seedrandom.PRNG, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Integer in [min, max] (inclusive). */
export function rangeInt(rng: seedrandom.PRNG, min: number, max: number): number {
  return Math.floor(min + rng() * (max - min + 1));
}

/** Roll a probability — true with chance p (0..1). */
export function chance(rng: seedrandom.PRNG, p: number): boolean {
  return rng() < p;
}
