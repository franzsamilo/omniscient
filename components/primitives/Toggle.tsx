"use client";

/**
 * Toggle — Radix Switch under the hood with our token styling.
 *
 * Three deliberate choices:
 *  - Thumb slides via CSS transform (translateX), not margin. Smooth, GPU.
 *  - The thumb "bump" animation triggers only on actual state change (via the
 *    `data-[state=...]` attribute), not on every parent render. Earlier
 *    iteration ran a `motion` keyframe on every render which pulsed every
 *    visible toggle in sync with the live ticker — extremely distracting.
 *  - OFF state shows a hairline-circle thumb on a dark track; ON state shows
 *    a solid thumb on a coloured track. The contrast is shape + color, not
 *    just color, so the state is readable at a glance.
 *
 * Optional `showLabel` renders a tiny "ON" / "OFF" inside the track.
 */

import * as Switch from "@radix-ui/react-switch";
import { cn } from "@/lib/utils/cn";

type Tone = "signal" | "ok" | "solar" | "danger" | "warn";
type Size = "sm" | "md";

type Props = {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  tone?: Tone;
  size?: Size;
  /** Show small "ON" / "OFF" inside the track. */
  showLabel?: boolean;
  /** Accessible label (required for screen readers). */
  label?: string;
};

const TONE_BG: Record<Tone, string> = {
  signal: "var(--color-signal)",
  ok: "var(--color-ok)",
  solar: "var(--color-solar)",
  danger: "var(--color-danger)",
  warn: "var(--color-warn)",
};

const SIZE = {
  sm: { w: 36, h: 20, thumb: 14, pad: 3, font: 8 },
  md: { w: 46, h: 24, thumb: 18, pad: 3, font: 9 },
} as const;

export function Toggle({
  on,
  onToggle,
  disabled,
  tone = "signal",
  size = "md",
  showLabel,
  label,
}: Props) {
  const s = SIZE[size];
  const travel = s.w - s.thumb - s.pad * 2;
  const tone_bg = TONE_BG[tone];

  return (
    <Switch.Root
      checked={on}
      onCheckedChange={onToggle}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full border",
        "transition-[background-color,border-color,box-shadow] duration-200 ease-[var(--ease-omni)]",
        "focus-visible:ring-2 focus-visible:ring-[var(--color-signal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]",
        disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
        "data-[state=checked]:border-transparent",
        "data-[state=unchecked]:border-[var(--color-border-strong)]",
        "data-[state=unchecked]:bg-[var(--color-surface-3)]",
      )}
      style={{
        width: s.w,
        height: s.h,
        backgroundColor: on ? tone_bg : undefined,
        boxShadow: on ? `0 0 16px -4px ${tone_bg}` : undefined,
      }}
    >
      {showLabel && (
        <span
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center font-mono uppercase tracking-[0.16em] tabular-nums",
            on ? "justify-start pl-1.5 text-[var(--color-bg)]" : "justify-end pr-1.5 text-[var(--color-fg-subtle)]",
          )}
          style={{ fontSize: s.font }}
        >
          {on ? "ON" : "OFF"}
        </span>
      )}

      <Switch.Thumb
        className={cn(
          "block rounded-full",
          "transition-transform duration-200 ease-[var(--ease-omni)]",
          "data-[state=checked]:bg-[var(--color-bg)]",
          "data-[state=unchecked]:bg-[var(--color-fg-muted)]",
          "data-[state=unchecked]:ring-1 data-[state=unchecked]:ring-inset data-[state=unchecked]:ring-[var(--color-border-strong)]",
        )}
        style={{
          width: s.thumb,
          height: s.thumb,
          transform: `translateX(${on ? travel + s.pad : s.pad}px)`,
        }}
      />
    </Switch.Root>
  );
}
