import { cn } from "@/lib/utils/cn";

/**
 * Calm card title — for cards nested inside a region that already has a
 * SectionHeader. Sentence-case, no leading rule, no index. Use when the
 * `╌╌ NN — LABEL` pattern would be visual noise.
 */

type Props = {
  children: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
};

export function CardTitle({ children, trailing, className }: Props) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 text-[13px] font-medium text-[var(--color-fg)]",
        className,
      )}
    >
      <span>{children}</span>
      {trailing}
    </div>
  );
}
