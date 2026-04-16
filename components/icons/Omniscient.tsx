/**
 * The Eye — OMNISCIENT monogram (CLAUDE.md §4.8).
 *
 * Encodes a *state*, never decoration:
 *   default    → "I am watching"
 *   .is-scanning → "I am online" (orbits rotate, 8s/rev)
 *   .omni-eye-fast → "I am thinking" (orbits rotate, 1.5s/rev)
 *
 * Composition (20×20 viewBox):
 *   - Outer ring (1.2px), full circle
 *   - Inner dot (r=2.4)
 *   - Four reticle ticks (N/E/S/W)
 *   - Two opposed orbit arcs (~40°, ~220°) on outer ring — the .omni-eye-orbit
 */

import { cn } from "@/lib/utils/cn";

type Props = {
  size?: number;
  scanning?: boolean;
  thinking?: boolean;
  className?: string;
  title?: string;
};

export function OmniscientEye({
  size = 20,
  scanning = false,
  thinking = false,
  className,
  title = "OMNISCIENT",
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={cn(
        "omni-eye text-current",
        scanning && "is-scanning",
        thinking && "omni-eye-fast is-scanning",
        className,
      )}
    >
      <title>{title}</title>

      {/* Outer ring (radius 7) */}
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.2" />

      {/* Reticle ticks — N, E, S, W (just outside the ring) */}
      <line x1="10" y1="0.6" x2="10" y2="2.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="10" y1="17.4" x2="10" y2="19.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="0.6" y1="10" x2="2.6" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="17.4" y1="10" x2="19.4" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />

      {/* Inner pupil */}
      <circle cx="10" cy="10" r="2.4" fill="currentColor" />

      {/* Orbit arcs — the .omni-eye-orbit class is what spins via globals.css */}
      <g className="omni-eye-orbit">
        {/* arc ~40° on outer orbit (radius 8.6) */}
        <path
          d="M 18.5 10 A 8.6 8.6 0 0 0 16.4 4.4"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        {/* opposed arc ~220° */}
        <path
          d="M 1.5 10 A 8.6 8.6 0 0 0 3.6 15.6"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
      </g>
    </svg>
  );
}
