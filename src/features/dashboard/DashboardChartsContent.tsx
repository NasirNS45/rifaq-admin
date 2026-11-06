import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardResponse } from "@/types/api";

const CHART_GRID = "var(--color-chart-grid)";
const CHART_PRIMARY = "var(--color-chart-1)";
const CHART_ACCENT = "var(--color-chart-accent)";
const CHART_NEGATIVE = "var(--color-chart-negative)";

const tooltipContentStyle = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 0,
  fontSize: 12,
};

export function DashboardChartsContent({ data }: { data: DashboardResponse }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Orders over time</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {data.orders_over_time.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.orders_over_time}>
                <CartesianGrid stroke={CHART_GRID} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipContentStyle} />
                <Line type="monotone" dataKey="value" stroke={CHART_PRIMARY} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">
              No orders yet. Prepaid checkouts will appear here after Swich payment.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Revenue over time</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {data.revenue_over_time.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenue_over_time}>
                <CartesianGrid stroke={CHART_GRID} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipContentStyle} />
                <Line type="monotone" dataKey="value" stroke={CHART_ACCENT} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">
              Revenue is counted from confirmed and delivered orders in PKR. Nothing has been confirmed yet.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top products</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {data.top_products.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.top_products}>
                <CartesianGrid stroke={CHART_GRID} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={0} height={48} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipContentStyle} />
                <Bar dataKey="quantity_sold" fill={CHART_PRIMARY} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">
              Top pieces will appear once paid orders start moving through fulfillment.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Orders by status</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {data.orders_by_status.some((row) => row.count > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.orders_by_status}>
                <CartesianGrid stroke={CHART_GRID} />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={0} height={56} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipContentStyle} />
                <Bar dataKey="count">
                  {data.orders_by_status.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={
                        entry.status === "CANCELLED" || entry.status === "RETURNED"
                          ? CHART_NEGATIVE
                          : CHART_PRIMARY
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No order statuses to chart yet.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
