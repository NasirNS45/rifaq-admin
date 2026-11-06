import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type FormSectionProps = {
  id: string;
  title: string;
  optional?: boolean;
  /** Uncontrolled default when `open` is not passed. */
  defaultOpen?: boolean;
  /** When set, the section is controlled by the parent. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hasError?: boolean;
  children: ReactNode;
};

export function FormSection({
  id,
  title,
  optional = false,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  hasError = false,
  children,
}: FormSectionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  // Parent controls open state when it passes onOpenChange (open may still be undefined before first click).
  const isControlled = onOpenChange !== undefined;
  const open = isControlled ? Boolean(openProp) : uncontrolledOpen;

  return (
    <details
      id={id}
      className="scroll-mt-28 border border-border bg-card"
      open={open}
      onToggle={(event) => {
        const next = event.currentTarget.open;
        if (isControlled) {
          onOpenChange(next);
        } else {
          setUncontrolledOpen(next);
        }
      }}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-display text-xl tracking-wide",
          "marker:hidden [&::-webkit-details-marker]:hidden",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{title}</span>
          {optional ? (
            <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
              Optional
            </span>
          ) : null}
        </span>
        {hasError ? (
          <span
            className="size-2 shrink-0 rounded-full bg-destructive"
            aria-hidden
          />
        ) : null}
      </summary>
      <div className="space-y-4 border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}
