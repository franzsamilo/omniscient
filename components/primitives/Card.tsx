import { cn } from "@/lib/utils/cn";

/**
 * Surface card. Uses 1px inset border via --ring-1 (no drop shadows).
 * Add `live` to enable the subtle scanline overlay (CLAUDE.md §4.7).
 */

type Props = React.HTMLAttributes<HTMLDivElement> & {
  live?: boolean;
  surface?: 1 | 2 | 3;
  hoverable?: boolean;
};

export function Card({
  live,
  surface = 1,
  hoverable,
  className,
  children,
  ...rest
}: Props) {
  const surfaceVar =
    surface === 3
      ? "var(--color-surface-3)"
      : surface === 2
        ? "var(--color-surface-2)"
        : "var(--color-surface-1)";
  return (
    <div
      {...rest}
      className={cn(
        "relative rounded-[var(--radius-md)] border",
        "transition-[border-color,background-color,box-shadow] duration-200 ease-[var(--ease-omni)]",
        live && "omni-live",
        hoverable &&
          "hover:border-[var(--color-border-strong)] hover:shadow-[inset_0_1px_0_0_color-mix(in_oklch,var(--color-signal)_60%,transparent)]",
        className,
      )}
      style={{
        backgroundColor: surfaceVar,
        borderColor: "var(--color-border)",
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 pt-4 pb-3", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 pb-5", className)} {...rest}>
      {children}
    </div>
  );
}
