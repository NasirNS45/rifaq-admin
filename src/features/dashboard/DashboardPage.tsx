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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useAuth";
import { formatPkr } from "@/lib/utils";

const CHART_COLOR = "#111111";
const ACCENT = "#C5A059";

function Kpi({ label, value, loading }: { label: string; value: string | number; loading: boolean }) {
  return (
    <Card className="border-border bg-white shadow-none">
      <CardHeader className="pb-2">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-accent uppercase">{label}</p>
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
}

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();
  const stats = data?.stats;

  if (isError) {
    return (
      <div className="border border-border bg-white p-8">
        <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">Overview</p>
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">
            Today, Asia/Karachi
          </p>
          <h1 className="mt-1 font-display text-4xl tracking-wide text-foreground">Dashboard</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/products/new">Add Product</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/collections/new">Add Collection</Link>
          </Button>
          <Button asChild>
            <Link to="/orders">View Orders</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/categories/new">Add Category</Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total orders" value={stats?.total_orders ?? 0} loading={isLoading} />
        <Kpi label="Orders today" value={stats?.orders_today ?? 0} loading={isLoading} />
        <Kpi label="This week" value={stats?.orders_this_week ?? 0} loading={isLoading} />
        <Kpi label="This month" value={stats?.orders_this_month ?? 0} loading={isLoading} />
        <Kpi
          label="Revenue"
          value={stats ? formatPkr(stats.revenue) : "Rs. 0"}
          loading={isLoading}
        />
        <Kpi label="Pending" value={stats?.pending_orders ?? 0} loading={isLoading} />
        <Kpi label="Confirmed" value={stats?.confirmed_orders ?? 0} loading={isLoading} />
        <Kpi label="Delivered" value={stats?.delivered_orders ?? 0} loading={isLoading} />
        <Kpi label="Cancelled" value={stats?.cancelled_orders ?? 0} loading={isLoading} />
        <Kpi label="Products" value={stats?.total_products ?? 0} loading={isLoading} />
        <Kpi label="Low stock" value={stats?.low_stock_products ?? 0} loading={isLoading} />
        <Kpi label="Out of stock" value={stats?.out_of_stock_products ?? 0} loading={isLoading} />
        <Kpi label="Customers" value={stats?.total_customers ?? 0} loading={isLoading} />
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
                  <CartesianGrid stroke="#e5ded4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={CHART_COLOR} strokeWidth={2} dot={false} />
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
                  <CartesianGrid stroke="#e5ded4" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={ACCENT} strokeWidth={2} dot={false} />
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
                  <CartesianGrid stroke="#e5ded4" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="quantity_sold" fill={CHART_COLOR} />
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
                  <CartesianGrid stroke="#e5ded4" />
                  <XAxis dataKey="status" tick={{ fontSize: 9 }} interval={0} angle={-35} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count">
                    {data.orders_by_status.map((entry) => (
                      <Cell key={entry.status} fill={entry.status === "CANCELLED" ? "#8c3b32" : CHART_COLOR} />
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
                        <Badge variant="secondary">{order.status}</Badge>
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
