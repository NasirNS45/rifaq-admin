import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BulkActionBar({
  count,
  onClear,
  children,
  className,
}: {
  count: number;
  onClear: () => void;
  children: ReactNode;
  className?: string;
}) {
  if (count < 1) return null;
  return (
    <div
      className={cn(
        "sticky top-0 z-20 flex flex-wrap items-center gap-2 border border-border bg-card px-3 py-2 shadow-sm",
        className,
      )}
      role="region"
      aria-label="Bulk actions"
    >
      <span className="text-sm text-muted-foreground">
        {count} selected
      </span>
      <div className="flex flex-1 flex-wrap gap-2">{children}</div>
      <Button type="button" variant="ghost" size="sm" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
