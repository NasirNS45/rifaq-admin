import { useMemo, useState } from "react";
import { Link } from "react-router";
import { BulkActionBar } from "@/components/BulkActionBar";
import { DebouncedSearchInput } from "@/components/ListFilters";
import { ListRowCheckbox, ListSelectAllCheckbox } from "@/components/ListSelectionCheckbox";
import { StackedOnMobile } from "@/components/StackedOnMobile";
import { TableSkeleton } from "@/components/loading";
import { EmptyState, PageHeader, PaginationBar, rowNumber } from "@/components/PageHeader";
import { EnumBadge, OrderStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { performBulkAction, useBulkMutation } from "@/hooks/useBulkApi";
import { useListFilters } from "@/hooks/useListFilters";
import { useOrders } from "@/hooks/useOrders";
import { usePermissions } from "@/hooks/usePermissions";
import { useRowSelection } from "@/hooks/useRowSelection";
import { cn, formatPkr } from "@/lib/utils";
import type { OrderStatus } from "@/types/api";

const GROUPS = ["all", "pending", "confirmed", "processing", "delivered", "cancelled"] as const;

type OrderGroup = (typeof GROUPS)[number];

const COPY: Record<OrderGroup, { label: string; description: string; empty: string }> = {
  all: {
    label: "All",
    description:
      "Prepaid orders from the storefront. Payment is card, JazzCash, or EasyPaisa via Swich.",
    empty: "No orders yet. When a shopper pays on Swich, the order will appear here.",
  },
  pending: {
    label: "Pending",
    description: "Unpaid checkouts waiting on Swich. Stock is reserved until pay or cancel.",
    empty: "No unpaid orders. Abandoned Swich sessions will land here until they are cancelled.",
  },
  confirmed: {
    label: "Confirmed",
    description: "Paid orders ready to pack. Payment already confirmed them.",
    empty: "No paid orders yet. Successful Swich checkouts will list here.",
  },
  processing: {
    label: "Processing",
    description: "Packed, ready, and out for delivery.",
    empty: "Nothing is being packed or delivered right now.",
  },
  delivered: {
    label: "Delivered",
    description: "Completed deliveries and their PKR totals.",
    empty: "No delivered orders yet.",
  },
  cancelled: {
    label: "Cancelled",
    description: "Cancelled checkouts and returned pieces.",
    empty: "No cancelled or returned orders.",
  },
};

function parseGroup(value: string): OrderGroup {
  if (value && GROUPS.includes(value as OrderGroup)) return value as OrderGroup;
  return "all";
}

const LIMIT = 20;

const BULK_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "PROCESSING", label: "Processing" },
  { value: "READY_FOR_DELIVERY", label: "Ready" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancel" },
];

export function OrderListPage() {
  const { canUpdateOrders } = usePermissions();
  const defaults = useMemo(() => ({ q: "", status: "" }), []);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("PROCESSING");
  const { values, set, page, setPage } = useListFilters(defaults);
  const group = parseGroup(values.status);
  const copy = COPY[group];

  const orders = useOrders({
    q: values.q || undefined,
    page,
    limit: LIMIT,
    status: group === "all" ? undefined : group,
  });
  const bulk = useBulkMutation([["orders"], ["dashboard"]]);
  const pageIds = useMemo(() => orders.data?.data.map((row) => row.id) ?? [], [orders.data?.data]);
  const selection = useRowSelection(pageIds, `${page}-${values.q}-${group}`);

  async function applyBulkStatus(status: OrderStatus) {
    await performBulkAction(
      bulk.mutateAsync,
      "/api/v1/orders/bulk-update",
      { ids: selection.selectedIds, status },
      { onSuccess: () => selection.clear() },
    );
  }

  function setGroup(next: OrderGroup) {
    set({ status: next === "all" ? "" : next });
  }

  const tableView =
    !orders.isLoading && !orders.isError && orders.data?.data.length ? (
      <div className="border border-border bg-card">
        <Table>
          <caption className="sr-only">Orders for {copy.label}</caption>
          <TableHeader>
            <TableRow>
              {canUpdateOrders ? (
                <TableHead className="w-10 bg-card">
                  <ListSelectAllCheckbox
                    allSelected={selection.allSelected}
                    someSelected={selection.someSelected}
                    onToggle={selection.toggleAll}
                  />
                </TableHead>
              ) : null}
              <TableHead className="sticky left-0 z-[1] min-w-[3rem] bg-card">#</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.data.data.map((order, index) => (
              <TableRow key={order.id}>
                {canUpdateOrders ? (
                  <TableCell>
                    <ListRowCheckbox
                      checked={selection.isSelected(order.id)}
                      onToggle={() => selection.toggle(order.id)}
                      label={`Select order ${order.order_number}`}
                    />
                  </TableCell>
                ) : null}
                <TableCell className="sticky left-0 z-[1] bg-card">{rowNumber(page, LIMIT, index)}</TableCell>
                <TableCell>
                  <p>{order.order_number}</p>
                  <EnumBadge value={order.fulfillment} className="mt-1" />
                </TableCell>
                <TableCell>
                  <p>{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                </TableCell>
                <TableCell>{formatPkr(order.total)}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <PaymentStatusBadge status={order.payment_status} />
                    <EnumBadge value={order.payment_method} />
                  </div>
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm" className="touch-target sm:min-h-0 sm:min-w-0">
                    <Link to={`/orders/${order.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ) : null;

  const stackView =
    !orders.isLoading && !orders.isError && orders.data?.data.length ? (
      <>
        {orders.data.data.map((order, index) => (
          <div key={order.id} className="space-y-3 border border-border bg-card p-4">
            {canUpdateOrders ? (
              <ListRowCheckbox
                checked={selection.isSelected(order.id)}
                onToggle={() => selection.toggle(order.id)}
                label={`Select order ${order.order_number}`}
              />
            ) : null}
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{order.order_number}</p>
                <p className="text-xs text-muted-foreground">#{rowNumber(page, LIMIT, index)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <p>{order.customer_name}</p>
            <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
            <p className="font-medium">{formatPkr(order.total)}</p>
            <div className="flex flex-wrap gap-2">
              <PaymentStatusBadge status={order.payment_status} />
              <EnumBadge value={order.payment_method} />
              <EnumBadge value={order.fulfillment} />
            </div>
            <Button asChild className="w-full touch-target sm:min-h-0">
              <Link to={`/orders/${order.id}`}>Open</Link>
            </Button>
          </div>
        ))}
      </>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Orders" title="Orders" description={copy.description} />

      <div
        role="tablist"
        aria-label="Order status"
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {GROUPS.map((item) => {
          const selected = group === item;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              id={`order-tab-${item}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setGroup(item)}
              className={cn(
                "-mb-px touch-target min-h-11 border-b-2 px-3 py-2 text-sm sm:min-h-0",
                selected
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {COPY[item].label}
            </button>
          );
        })}
      </div>

      <div className="max-w-md">
        <DebouncedSearchInput
          value={values.q}
          onDebouncedChange={(next) => set({ q: next })}
          placeholder="Search order, name, or phone"
        />
      </div>

      {orders.isLoading ? (
        <TableSkeleton columns={["#", "Order", "Customer", "Total", "Payment", "Status", ""]} />
      ) : orders.isError ? (
        <EmptyState variant="error" title="Could not load orders" body="The order list could not be fetched." />
      ) : !orders.data?.data.length ? (
        <EmptyState title="No orders" body={copy.empty} />
      ) : (
        <>
          {canUpdateOrders ? (
            <BulkActionBar count={selection.selectedCount} onClear={selection.clear}>
              <select
                className="h-9 rounded-md border border-input bg-card px-2 text-sm"
                value={bulkStatus}
                onChange={(event) => setBulkStatus(event.target.value as OrderStatus)}
                aria-label="Bulk status"
              >
                {BULK_STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                variant="default"
                pending={bulk.isPending}
                onClick={() => void applyBulkStatus(bulkStatus)}
              >
                Apply status
              </Button>
            </BulkActionBar>
          ) : null}
          <StackedOnMobile table={tableView} stack={stackView} />
        </>
      )}

      <PaginationBar page={page} limit={LIMIT} total={orders.data?.total ?? 0} onPage={setPage} />
    </div>
  );
}
