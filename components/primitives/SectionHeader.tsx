/**
 * Section header — the ╌╌ NN — LABEL pattern (CLAUDE.md §4.3, §11.2).
 * 11px Geist Mono caps, tracking +0.18em, leading rule + index.
 */

import { cn } from "@/lib/utils/cn";

type Props = {
  index: string | number;
  label: string;
  /** Optional trailing slot (button, status pill). */
  trailing?: React.ReactNode;
  className?: string;
};

export function SectionHeader({ index, label, trailing, className }: Props) {
  const idx = typeof index === "number" ? String(index).padStart(2, "0") : index;
  return (
    <div
      className={cn(
        "flex items-center gap-3 font-mono uppercase",
        "text-[11px] tracking-[0.18em] text-[var(--color-fg-subtle)]",
        className,
      )}
    >
      <span aria-hidden className="text-[var(--color-border-strong)]">╌╌</span>
      <span>
        {idx} <span className="text-[var(--color-fg-muted)]">— {label}</span>
      </span>
      <span aria-hidden className="h-px flex-1 bg-[var(--color-border)]" />
      {trailing}
    </div>
  );
}
