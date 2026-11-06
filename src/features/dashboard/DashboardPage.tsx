import { Link } from "react-router";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ChartSkeleton, DashboardTableSkeleton } from "@/components/loading";
import { OrderStatusBadge } from "@/components/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useAuth";
import { formatPkr } from "@/lib/utils";
import type { OrderStatus } from "@/types/api";

const CHART_GRID = "var(--color-chart-grid)";
const CHART_PRIMARY = "var(--color-chart-1)";
const CHART_ACCENT = "var(--color-chart-accent)";
const CHART_NEGATIVE = "var(--color-chart-negative)";

function Kpi({
  label,
  value,
  loading,
  to,
}: {
  label: string;
  value: string | number;
  loading: boolean;
  to?: string;
}) {
  const inner = (
    <Card className="h-full border-border bg-card shadow-none transition-colors hover:bg-muted/40">
      <CardHeader className="pb-2">
        <p className="eyebrow text-accent-text">{label}</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="font-display text-3xl tracking-wide text-foreground">{value}</p>
        )}
      </CardContent>
    </Card>
  );
  if (!to) return inner;
  return (
    <Link to={to} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      {inner}
    </Link>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="font-display text-2xl tracking-wide text-foreground">{children}</h2>;
}

const tooltipContentStyle = {
  backgroundColor: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: 0,
  fontSize: 12,
};

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const stats = data?.stats;

  if (isError) {
    return (
      <div className="border border-border bg-card p-8" role="alert">
        <p className="eyebrow text-accent-text">Overview</p>
        <h1 className="mt-1 font-display text-3xl tracking-wide">Dashboard</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Could not load dashboard figures from the API.
        </p>
        <Button className="mt-4" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-accent-text">Today, Asia/Karachi</p>
          <h1 className="mt-1 font-display text-4xl tracking-wide text-foreground">Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/products/new">Add product</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/collections/new">Add collection</Link>
          </Button>
          <Button asChild>
            <Link to="/orders">View orders</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/categories/new">Add category</Link>
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <SectionTitle>Sales</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Revenue" value={stats ? formatPkr(stats.revenue) : "Rs. 0"} loading={isLoading} to="/orders" />
          <Kpi label="Total orders" value={stats?.total_orders ?? 0} loading={isLoading} to="/orders" />
          <Kpi label="Orders today" value={stats?.orders_today ?? 0} loading={isLoading} to="/orders" />
          <Kpi label="This week" value={stats?.orders_this_week ?? 0} loading={isLoading} to="/orders" />
          <Kpi label="This month" value={stats?.orders_this_month ?? 0} loading={isLoading} to="/orders" />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Fulfilment</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Pending" value={stats?.pending_orders ?? 0} loading={isLoading} to="/orders?status=pending" />
          <Kpi label="Confirmed" value={stats?.confirmed_orders ?? 0} loading={isLoading} to="/orders?status=confirmed" />
          <Kpi label="Delivered" value={stats?.delivered_orders ?? 0} loading={isLoading} to="/orders?status=delivered" />
          <Kpi label="Cancelled" value={stats?.cancelled_orders ?? 0} loading={isLoading} to="/orders?status=cancelled" />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Inventory & customers</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Products" value={stats?.total_products ?? 0} loading={isLoading} to="/products" />
          <Kpi label="Low stock" value={stats?.low_stock_products ?? 0} loading={isLoading} to="/inventory" />
          <Kpi label="Out of stock" value={stats?.out_of_stock_products ?? 0} loading={isLoading} to="/products" />
          <Kpi label="Customers" value={stats?.total_customers ?? 0} loading={isLoading} to="/customers" />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders over time</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            {isLoading ? (
              <ChartSkeleton />
            ) : data?.orders_over_time.length ? (
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
            {isLoading ? (
              <ChartSkeleton />
            ) : data?.revenue_over_time.length ? (
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
            {isLoading ? (
              <ChartSkeleton />
            ) : data?.top_products.length ? (
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
            {isLoading ? (
              <ChartSkeleton />
            ) : data?.orders_by_status.some((row) => row.count > 0) ? (
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

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <DashboardTableSkeleton columns={5} />
            ) : data?.recent_orders.length ? (
              <Table>
                <caption className="sr-only">Recent orders</caption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recent_orders.map((order, index) => (
                    <TableRow key={order.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Link className="underline-offset-2 hover:underline" to={`/orders/${order.id}`}>
                          {order.order_number}
                        </Link>
                      </TableCell>
                      <TableCell>{order.customer_name}</TableCell>
                      <TableCell>{formatPkr(order.total)}</TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status as OrderStatus} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No orders yet. Prepaid checkouts will appear here after Swich payment.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Low stock</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <DashboardTableSkeleton columns={4} />
            ) : data?.low_stock_products.length ? (
              <Table>
                <caption className="sr-only">Low stock products</caption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Piece</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.low_stock_products.map((product, index) => (
                    <TableRow key={product.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Link className="underline-offset-2 hover:underline" to={`/products/${product.id}`}>
                          {product.name}
                        </Link>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>
                        {product.stock_quantity} / {product.low_stock_threshold}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No low-stock pieces. Inventory alerts will show here once products are added to the catalog.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
