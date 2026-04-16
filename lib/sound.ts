/**
 * Sound infra (CLAUDE.md §6.A).
 *
 * Muted by default. The audio asset files don't ship in this repo (would be
 * `public/sounds/*.webm`); instead, when unmuted we synthesize short click
 * tones via the Web Audio API so the wiring is real and ready to swap in
 * Howler-driven assets later.
 */

import { useUi } from "@/lib/stores/useUi";

type Cue =
  | "tick-on"
  | "tick-off"
  | "whoosh"
  | "chime-alert"
  | "chime-complete"
  | "swell"
  | "klaxon"
  | "chime-safe"
  | "thud-low";

let ctx: AudioContext | null = null;
let lastPlay = 0;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

const CUE_PARAMS: Record<Cue, { freq: number; ramp: number; duration: number; type: OscillatorType }> = {
  "tick-on":        { freq: 800,  ramp: 1200, duration: 0.07, type: "sine" },
  "tick-off":       { freq: 1200, ramp: 800,  duration: 0.07, type: "sine" },
  "whoosh":         { freq: 220,  ramp: 110,  duration: 0.18, type: "triangle" },
  "chime-alert":    { freq: 660,  ramp: 880,  duration: 0.4,  type: "sine" },
  "chime-complete": { freq: 660,  ramp: 990,  duration: 0.5,  type: "sine" },
  "swell":          { freq: 220,  ramp: 440,  duration: 1.4,  type: "sawtooth" },
  "klaxon":         { freq: 440,  ramp: 220,  duration: 0.3,  type: "square" },
  "chime-safe":     { freq: 880,  ramp: 660,  duration: 0.5,  type: "sine" },
  "thud-low":       { freq: 110,  ramp: 80,   duration: 0.12, type: "sine" },
};

export function play(cue: Cue): void {
  if (typeof window === "undefined") return;
  const muted = useUi.getState().muted;
  if (muted) return;
  // Debounce — never layer >2 within 200ms.
  const now = performance.now();
  if (now - lastPlay < 90) return;
  lastPlay = now;

  const c = getCtx();
  if (!c) return;
  const { freq, ramp, duration, type } = CUE_PARAMS[cue];
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  osc.frequency.linearRampToValueAtTime(ramp, c.currentTime + duration);
  gain.gain.setValueAtTime(0.0001, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, c.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration + 0.05);
}
