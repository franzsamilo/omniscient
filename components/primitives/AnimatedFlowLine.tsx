"use client";

/**
 * AnimatedFlowLine — shared across /power (energy flow) and /water
 * (plumbing schematic). SVG path + traveling dashes + glowing particle.
 * Rate in "working units" (kW for power, L/min for water) drives speed;
 * we map a small range onto the 0.8s–4s animation window so the eye
 * reads busier flows as faster without becoming frenetic.
 *
 * When `active` is false the line dims to `--color-border` and the
 * particle is omitted — a dead circuit should look dead, not looped.
 */

import { useId, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

type Props = {
  /** SVG `d` attribute — the shape of the connection. Parent computes. */
  d: string;
  /** Current transfer rate in working units (kW or L/min). Drives speed. */
  rate: number;
  /** Rate that should register as "slow end of the scale". */
  minRate?: number;
  /** Rate that should register as "fast end". Anything above clamps here. */
  maxRate?: number;
  /** CSS color (token). */
  color?: string;
  /** Reverse direction (e.g. battery discharge). */
  reverse?: boolean;
  /** Hide the traveling particle. */
  noParticle?: boolean;
  /** Whether the flow is live. When false, line dims, no animation. */
  active?: boolean;
  /** Stroke width of the animated overlay. */
  strokeWidth?: number;
  /** Optional label at mid-path (e.g. "2.7 kW"). */
  label?: string;
  /** Where to place the label along the path (0..1). Defaults 0.5. */
  labelAt?: number;
  className?: string;
};

export function AnimatedFlowLine({
  d,
  rate,
  minRate = 0.4,
  maxRate = 6,
  color = "var(--color-signal)",
  reverse,
  noParticle,
  active = true,
  strokeWidth = 1.4,
  label,
  labelAt = 0.5,
  className,
}: Props) {
  const reduced = useReducedMotion();
  const pathId = useId();
  const mpathId = `path-${pathId.replace(/[:]/g, "")}`;

  // Map rate → duration. Gentle curve so a 2× change in kW is obvious but
  // doesn't turn a 5 kW load into a hummingbird.
  const duration = useMemo(() => {
    const clamped = Math.max(minRate, Math.min(maxRate, rate));
    const t = (clamped - minRate) / (maxRate - minRate); // 0..1
    return 4 - t * 3.2; // 4s → 0.8s
  }, [rate, minRate, maxRate]);

  // Dash pattern — "6 10" gives a 16-unit cycle. Animate offset by one
  // cycle so the pattern loops seamlessly.
  const DASH = "6 10";
  const CYCLE = 16;

  const dashTo = reverse ? CYCLE : -CYCLE;

  const dim = !active;

  return (
    <g className={className}>
      {/* Invisible named path — reused by <animateMotion> below. */}
      <path id={mpathId} d={d} fill="none" stroke="none" />

      {/* Base line — always present, dim when inactive. */}
      <path
        d={d}
        fill="none"
        stroke={dim ? "var(--color-border)" : color}
        strokeOpacity={dim ? 0.8 : 0.22}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* Animated dashes — only when active. */}
      {!dim && (
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={DASH}
          style={{
            filter: `drop-shadow(0 0 3px ${color})`,
          }}
          initial={{ strokeDashoffset: 0 }}
          animate={
            reduced
              ? { strokeDashoffset: 0, opacity: [0.6, 1, 0.6] }
              : { strokeDashoffset: dashTo }
          }
          transition={
            reduced
              ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
              : { duration, repeat: Infinity, ease: "linear" }
          }
        />
      )}

      {/* Glowing particle — rides the path. */}
      {!dim && !noParticle && !reduced && (
        <g style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
          <circle r={2.4} fill={color}>
            <animateMotion
              dur={`${duration}s`}
              repeatCount="indefinite"
              rotate="auto"
              keyPoints={reverse ? "1;0" : "0;1"}
              keyTimes="0;1"
            >
              <mpath href={`#${mpathId}`} />
            </animateMotion>
          </circle>
        </g>
      )}

      {/* Mid-path label — rendered separately via a small helper. */}
      {label && (
        <FlowLabel
          d={d}
          at={labelAt}
          text={label}
          color={color}
          dim={dim}
        />
      )}
    </g>
  );
}

/**
 * Inline `<text>` positioned at a fraction along the path.
 * Uses an offscreen hidden SVG path measurement — cheaper than
 * resolving a real length on every render.
 *
 * The caller should place the label's visual backdrop themselves
 * (we draw a tiny rect behind the text here to keep it legible).
 */
function FlowLabel({
  d,
  at,
  text,
  color,
  dim,
}: {
  d: string;
  at: number;
  text: string;
  color: string;
  dim: boolean;
}) {
  const id = useId();
  const pid = `label-path-${id.replace(/[:]/g, "")}`;
  return (
    <g>
      <path id={pid} d={d} fill="none" stroke="none" />
      <text
        fontSize={9}
        fontFamily="var(--font-mono)"
        fill={dim ? "var(--color-fg-subtle)" : color}
        letterSpacing="0.08em"
        textAnchor="middle"
        style={{
          paintOrder: "stroke",
          stroke: "var(--color-bg)",
          strokeWidth: 4,
          strokeLinejoin: "round",
        }}
      >
        <textPath href={`#${pid}`} startOffset={`${at * 100}%`}>
          {text}
        </textPath>
      </text>
    </g>
  );
}
