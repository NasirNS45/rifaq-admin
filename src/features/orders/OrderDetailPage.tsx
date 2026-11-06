import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormSkeleton } from "@/components/loading";
import { EmptyState, PageHeader } from "@/components/PageHeader";
import { EnumBadge, OrderStatusBadge, PaymentStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAddOrderNote, useOrder, useUpdateOrderStatus } from "@/hooks/useOrders";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api";
import { formatPkr } from "@/lib/utils";
import type { OrderAdmin, OrderStatus } from "@/types/api";

const ACTIONS: Partial<Record<OrderStatus, { status: OrderStatus; label: string; destructive?: boolean }[]>> = {
  PENDING: [{ status: "CANCELLED", label: "Cancel unpaid", destructive: true }],
  CONFIRMED: [
    { status: "PROCESSING", label: "Mark processing" },
    { status: "CANCELLED", label: "Cancel", destructive: true },
  ],
  PROCESSING: [
    { status: "READY_FOR_DELIVERY", label: "Ready for delivery" },
    { status: "OUT_FOR_DELIVERY", label: "Out for delivery" },
    { status: "DELIVERED", label: "Mark delivered" },
    { status: "CANCELLED", label: "Cancel", destructive: true },
  ],
  READY_FOR_DELIVERY: [
    { status: "OUT_FOR_DELIVERY", label: "Out for delivery" },
    { status: "DELIVERED", label: "Mark delivered" },
  ],
  OUT_FOR_DELIVERY: [{ status: "DELIVERED", label: "Mark delivered" }],
  DELIVERED: [{ status: "RETURNED", label: "Mark returned", destructive: true }],
};

function receiptLink(order: OrderAdmin) {
  const number = import.meta.env.VITE_WHATSAPP_NUMBER || "923000000000";
  const lines = [
    `Receipt for ${order.order_number}`,
    `Customer: ${order.customer_name}`,
    `Phone: ${order.customer_phone}`,
    `Fulfillment: ${order.fulfillment === "pickup" ? "Pickup" : "Delivery"}`,
    order.fulfillment === "delivery"
      ? [order.delivery_address, order.area, order.city, order.postal_code].filter(Boolean).join(", ")
      : order.city
        ? `City: ${order.city}`
        : null,
    "",
    ...order.items.map((item) => {
      const size = item.size_snapshot ? `, ${item.size_snapshot}` : "";
      return `- ${item.product_name_snapshot}${size} x${item.quantity}`;
    }),
    "",
    `Total: ${formatPkr(order.total)}`,
    `Payment: ${order.payment_method} (${order.payment_status})`,
  ].filter((line) => line !== null);
  return `https://wa.me/${number}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export function OrderDetailPage() {
  const { id } = useParams();
  const { canUpdateOrders } = usePermissions();
  const orderQuery = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const addNote = useAddOrderNote();
  const [note, setNote] = useState("");
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const order = orderQuery.data;

  async function handleStatus(status: OrderStatus) {
    if (!order) return;
    try {
      await updateStatus.mutateAsync({ id: order.id, status });
      toast.success("Order updated.");
      setPendingStatus(null);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not update this order.";
      toast.error(message);
    }
  }

  async function handleNote() {
    if (!order || !note.trim()) return;
    try {
      await addNote.mutateAsync({ id: order.id, note: note.trim() });
      toast.success("Note added.");
      setNote("");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not add the note.";
      toast.error(message);
    }
  }

  if (orderQuery.isError) {
    return <EmptyState variant="error" title="Order not found" body="This order could not be loaded." />;
  }
  if (orderQuery.isLoading || !order) {
    return <FormSkeleton fields={7} />;
  }

  const actions = ACTIONS[order.status] ?? [];

  const statusSection =
    canUpdateOrders && actions.length ? (
      <div className="flex flex-wrap gap-2 pb-[env(safe-area-inset-bottom)]">
        {actions.map((action) => (
          <Button
            key={action.status}
            variant={action.destructive ? "destructive" : "outline"}
            className="touch-target sm:min-h-0"
            onClick={() => {
              if (action.destructive) setPendingStatus(action.status);
              else void handleStatus(action.status);
            }}
            pending={updateStatus.isPending}
          >
            {updateStatus.isPending ? "Updating" : action.label}
          </Button>
        ))}
      </div>
    ) : null;

  return (
    <div className="space-y-6 pb-28 md:pb-0">
      <PageHeader
        eyebrow="Orders"
        title={order.order_number}
        description={`${order.customer_name} · ${order.customer_phone}`}
        action={
          <Button asChild variant="outline">
            <a href={receiptLink(order)} target="_blank" rel="noreferrer">
              WhatsApp receipt
            </a>
          </Button>
        }
      />
      <div className="flex flex-wrap gap-2">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.payment_status} />
        <EnumBadge value={order.payment_method} />
        <EnumBadge value={order.fulfillment} />
      </div>

      <div className="hidden md:block">{statusSection}</div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="border border-border bg-card p-5 text-sm">
          <h2 className="font-display text-2xl">Customer</h2>
          <p className="mt-3">{order.customer_name}</p>
          <p className="text-muted-foreground">{order.customer_phone}</p>
          {order.customer_email ? <p className="text-muted-foreground">{order.customer_email}</p> : null}
          {order.customer_id ? (
            <Button asChild variant="ghost" size="sm" className="mt-3 px-0">
              <Link to={`/customers/${order.customer_id}`}>Open customer</Link>
            </Button>
          ) : null}
        </div>
        <div className="border border-border bg-card p-5 text-sm">
          <h2 className="font-display text-2xl">Fulfillment</h2>
          <p className="mt-3 capitalize">{order.fulfillment}</p>
          <p className="mt-2 text-muted-foreground">
            {[order.delivery_address, order.area, order.city, order.postal_code].filter(Boolean).join(", ") ||
              "No street address."}
          </p>
          <p className="mt-4 text-muted-foreground">
            Payment reference: {order.payment_reference ?? "Not assigned"}
          </p>
        </div>
      </section>
      <div className="border border-border bg-card">
        <Table>
          <caption className="sr-only">Line items</caption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Piece</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {item.product_name_snapshot}
                  {item.size_snapshot ? ` · ${item.size_snapshot}` : ""}
                </TableCell>
                <TableCell>{item.sku_snapshot}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{formatPkr(item.total)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="space-y-1 border-t border-border p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatPkr(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span>{Number(order.shipping_fee) === 0 ? "Free" : formatPkr(order.shipping_fee)}</span>
          </div>
          <div className="flex justify-between pt-2">
            <span>Total</span>
            <span>{formatPkr(order.total)}</span>
          </div>
        </div>
      </div>
      <section className="border border-border bg-card p-5">
        <h2 className="font-display text-2xl">Internal notes</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {order.internal_notes.length ? (
            order.internal_notes.map((entry) => (
              <li key={entry.id} className="border-b border-border pb-3 last:border-0">
                <p>{entry.note}</p>
                <p className="mt-1 text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</p>
              </li>
            ))
          ) : (
            <li className="text-muted-foreground">No internal notes yet.</li>
          )}
        </ul>
        {canUpdateOrders ? (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void handleNote();
            }}
          >
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add an internal note" />
            <Button type="submit" pending={addNote.isPending} disabled={!note.trim()}>
              {addNote.isPending ? "Adding" : "Add note"}
            </Button>
          </form>
        ) : null}
      </section>

      {canUpdateOrders && actions.length ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-4 backdrop-blur-sm md:hidden">
          {statusSection}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title="Change this order?"
        body="This will update fulfillment status and may restock the piece if the order is cancelled or returned."
        confirmLabel="Confirm"
        pending={updateStatus.isPending}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null);
        }}
        onConfirm={() => {
          if (pendingStatus) void handleStatus(pendingStatus);
        }}
      />
    </div>
  );
}
