import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { FrameSpinner } from "@/components/loading";
import { formatCountLabel } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow text-accent-text">{eyebrow}</p>
        <h1 className="mt-1 font-display text-4xl tracking-wide text-foreground">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  variant = "empty",
}: {
  title: string;
  body: string;
  action?: { to: string; label: string };
  variant?: "empty" | "error";
}) {
  return (
    <div
      className="border border-border bg-white p-8"
      role={variant === "error" ? "alert" : undefined}
    >
      <h2 className="font-display text-2xl tracking-wide text-foreground">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{body}</p>
      {action ? (
        <Button asChild className="mt-5">
          <Link to={action.to}>{action.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}

export function LoadingState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div
      className="border border-border bg-white p-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <FrameSpinner className="size-4" />
      <h2 className="mt-4 font-display text-2xl tracking-wide text-foreground">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}

export function rowNumber(page: number, limit: number, index: number): number {
  return (page - 1) * limit + index + 1;
}

export function parseOptionalBool(value: FormDataEntryValue | null): boolean | undefined {
  const raw = String(value ?? "");
  if (raw === "true") return true;
  if (raw === "false") return false;
  return undefined;
}

export function boolSelectValue(value: boolean | undefined): string {
  if (value === undefined) return "";
  return value ? "true" : "false";
}

export function PaginationBar({
  page,
  limit,
  total,
  onPage,
}: {
  page: number;
  limit: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const summary =
    total === 0
      ? "No results."
      : `${formatCountLabel(total, "result")}. Page ${page} of ${pages}.`;
  return (
    <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <p>{summary}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="touch-target sm:min-h-0 sm:min-w-0"
          disabled={page <= 1}
          onClick={() => onPage(1)}
        >
          First
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="touch-target sm:min-h-0 sm:min-w-0"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="touch-target sm:min-h-0 sm:min-w-0"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="touch-target sm:min-h-0 sm:min-w-0"
          disabled={page >= pages}
          onClick={() => onPage(pages)}
        >
          Last
        </Button>
      </div>
    </div>
  );
}
