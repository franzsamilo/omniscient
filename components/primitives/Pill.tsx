import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "ok" | "warn" | "danger" | "signal" | "solar" | "grid" | "seismic";

const TONE: Record<Tone, string> = {
  neutral: "bg-[var(--color-surface-3)] text-[var(--color-fg-muted)] border-[var(--color-border)]",
  ok: "bg-[color-mix(in_oklch,var(--color-ok)_18%,transparent)] text-[var(--color-ok)] border-[color-mix(in_oklch,var(--color-ok)_40%,transparent)]",
  warn: "bg-[color-mix(in_oklch,var(--color-warn)_18%,transparent)] text-[var(--color-warn)] border-[color-mix(in_oklch,var(--color-warn)_40%,transparent)]",
  danger: "bg-[color-mix(in_oklch,var(--color-danger)_18%,transparent)] text-[var(--color-danger)] border-[color-mix(in_oklch,var(--color-danger)_45%,transparent)]",
  signal: "bg-[color-mix(in_oklch,var(--color-signal)_15%,transparent)] text-[var(--color-signal)] border-[color-mix(in_oklch,var(--color-signal)_45%,transparent)]",
  solar: "bg-[color-mix(in_oklch,var(--color-solar)_18%,transparent)] text-[var(--color-solar)] border-[color-mix(in_oklch,var(--color-solar)_40%,transparent)]",
  grid: "bg-[color-mix(in_oklch,var(--color-grid)_18%,transparent)] text-[var(--color-grid)] border-[color-mix(in_oklch,var(--color-grid)_40%,transparent)]",
  seismic: "bg-[color-mix(in_oklch,var(--color-seismic)_18%,transparent)] text-[var(--color-seismic)] border-[color-mix(in_oklch,var(--color-seismic)_40%,transparent)]",
};

type Props = {
  tone?: Tone;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function Pill({ tone = "neutral", pulse, children, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
        "font-mono text-[10px] uppercase tracking-[0.16em]",
        TONE[tone],
        className,
      )}
    >
      {pulse && (
        <span
          className={cn(
            "size-1.5 rounded-full bg-current",
            "animate-[pulse_1.6s_ease-in-out_infinite]",
          )}
        />
      )}
      {children}
    </span>
  );
}
