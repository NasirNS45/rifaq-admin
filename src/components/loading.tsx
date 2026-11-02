import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/BrandMark";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function MarkImg({
  className,
  mode,
}: {
  className?: string;
  mode: "trace" | "breathe";
}) {
  return (
    <BrandMark
      className={cn("h-16 w-16", mode === "breathe" && "frame-breathe", className)}
    />
  );
}

export function FrameSpinner({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      className={cn("size-3 shrink-0 frame-breathe", className)}
      aria-hidden
    >
      <rect x="1" y="1" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <rect x="3.25" y="3.25" width="9.5" height="9.5" fill="none" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}

export function SessionLoader() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <MarkImg mode="breathe" className="h-24 w-24" />
      <p className="mt-5 text-xs font-semibold tracking-[0.22em] text-accent uppercase">
        RIFAQ admin
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-wide text-foreground">Loading dashboard</h1>
    </div>
  );
}

export function TableSkeleton({
  columns,
  rows = 8,
}: {
  columns: string[];
  rows?: number;
}) {
  return (
    <div
      className="border border-border bg-card"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading table"
    >
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column || "actions"}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }, (_, row) => (
            <TableRow key={row}>
              {columns.map((column, col) => (
                <TableCell key={`${column || "actions"}-${col}`}>
                  <span
                    className="fabric-shimmer block h-3"
                    style={{ width: `${48 + ((row + col) % 4) * 12}%` }}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div
      className="max-w-3xl space-y-5 border border-border bg-card p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading form"
    >
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <span className="fabric-shimmer block h-3 w-24" />
          <span className="fabric-shimmer block h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function PanelSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="space-y-6 border border-border bg-card p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <span className="fabric-shimmer block h-5 w-40" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="space-y-2">
          <span className="fabric-shimmer block h-3 w-28" />
          <span className="fabric-shimmer block h-9 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="relative h-full w-full" role="status" aria-label="Loading chart">
      <div className="absolute inset-y-2 left-6 w-px bg-border" />
      <div className="absolute inset-x-6 bottom-2 h-px bg-border" />
      <div className="absolute inset-6 fabric-shimmer" />
    </div>
  );
}

export function DashboardTableSkeleton({
  columns,
  rows = 5,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-busy="true" aria-label="Loading rows">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex gap-3">
          {Array.from({ length: columns }, (_, col) => (
            <span
              key={col}
              className="fabric-shimmer block h-3 flex-1"
              style={{ maxWidth: col === 0 ? "40%" : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function UploadProgress() {
  return (
    <div
      className="relative h-20 w-20 border border-border"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Uploading"
    >
      <span className="absolute inset-0 fabric-shimmer" aria-hidden />
      <span className="absolute inset-x-0 bottom-0 h-px stitch-run" aria-hidden />
    </div>
  );
}
