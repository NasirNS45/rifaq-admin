/** Preload the recharts chunk (e.g. sidebar hover before navigating to `/`). */
export function preloadDashboardCharts(): void {
  void import("./DashboardChartsContent");
}
