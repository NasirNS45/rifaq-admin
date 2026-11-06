import { lazy, Suspense } from "react";
import { ChartSkeleton } from "@/components/loading";
import type { DashboardResponse } from "@/types/api";

const DashboardChartsContent = lazy(async () => {
  const mod = await import("./DashboardChartsContent");
  return { default: mod.DashboardChartsContent };
});

export function DashboardChartsLazy({ data }: { data: DashboardResponse }) {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-64 rounded-md border border-border bg-card p-4">
              <ChartSkeleton />
            </div>
          ))}
        </div>
      }
    >
      <DashboardChartsContent data={data} />
    </Suspense>
  );
}
