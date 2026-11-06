import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";

type DebouncedSearchProps = {
  name?: string;
  value: string;
  onDebouncedChange: (value: string) => void;
  debounceMs?: number;
  placeholder?: string;
  className?: string;
};

export function DebouncedSearchInput({
  name = "q",
  value,
  onDebouncedChange,
  debounceMs = 300,
  placeholder,
  className,
}: DebouncedSearchProps) {
  const [local, setLocal] = useState(value);
  const debounced = useDebouncedValue(local, debounceMs);
  const onDebouncedChangeRef = useRef(onDebouncedChange);

  useEffect(() => {
    onDebouncedChangeRef.current = onDebouncedChange;
  }, [onDebouncedChange]);

  // Sync local text when URL/search params change (clear filters, browser back).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL is source of truth for search query
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (debounced === value) return;
    onDebouncedChangeRef.current(debounced);
  }, [debounced, value]);

  return (
    <Input
      name={name}
      value={local}
      onChange={(event) => setLocal(event.target.value)}
      placeholder={placeholder}
      className={cn("w-full min-w-0 sm:max-w-xs", className)}
      autoComplete="off"
    />
  );
}

type ListFiltersChromeProps = {
  title?: string;
  description?: string;
  /** Filters shown inline on md+ and inside mobile sheet */
  children: ReactNode;
  /** Optional row shown on all breakpoints before children (e.g. search + Apply) */
  primaryRow?: ReactNode;
  pending?: boolean;
  onClear?: () => void;
  clearDisabled?: boolean;
};

export function ListFiltersChrome({
  title = "Filters",
  description = "Narrow the list below.",
  children,
  primaryRow,
  pending,
  onClear,
  clearDisabled,
}: ListFiltersChromeProps) {
  const sheetTitleId = useId();
  const sheetDescId = useId();

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        {primaryRow}
        <div className="hidden w-full flex-wrap gap-2 md:flex md:w-auto md:items-end">{children}</div>
        <Sheet>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" className="w-full md:hidden">
              {title}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="gap-4" aria-labelledby={sheetTitleId} aria-describedby={sheetDescId}>
            <SheetHeader className="text-left">
              <SheetTitle id={sheetTitleId}>{title}</SheetTitle>
              <SheetDescription id={sheetDescId}>{description}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-3 pb-6">{children}</div>
          </SheetContent>
        </Sheet>
        {onClear ? (
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            disabled={clearDisabled || pending}
            onClick={onClear}
          >
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
