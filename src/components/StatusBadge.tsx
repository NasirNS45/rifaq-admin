import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Availability, OrderStatus, ProductStatus } from "@/types/api";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

const ORDER_STATUS: Partial<Record<OrderStatus, { label: string; variant: BadgeVariant }>> = {
  PENDING: { label: "Pending", variant: "warning" },
  WHATSAPP_CONFIRMATION: { label: "WhatsApp", variant: "info" },
  CONFIRMED: { label: "Confirmed", variant: "info" },
  PROCESSING: { label: "Processing", variant: "info" },
  READY_FOR_DELIVERY: { label: "Ready for delivery", variant: "info" },
  OUT_FOR_DELIVERY: { label: "Out for delivery", variant: "info" },
  DELIVERED: { label: "Delivered", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "destructive" },
  RETURNED: { label: "Returned", variant: "warning" },
};

const PAYMENT_STATUS: Record<string, { label: string; variant: BadgeVariant }> = {
  PENDING: { label: "Unpaid", variant: "warning" },
  PAID: { label: "Paid", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
  REFUNDED: { label: "Refunded", variant: "muted" },
};

const PRODUCT_STATUS: Record<ProductStatus, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "Draft", variant: "muted" },
  ACTIVE: { label: "Active", variant: "success" },
  ARCHIVED: { label: "Archived", variant: "outline" },
};

const AVAILABILITY: Record<Availability, { label: string; variant: BadgeVariant }> = {
  IN_STOCK: { label: "In stock", variant: "success" },
  LOW_STOCK: { label: "Low stock", variant: "warning" },
  OUT_OF_STOCK: { label: "Sold out", variant: "destructive" },
  PRE_ORDER: { label: "Pre-order", variant: "info" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const entry = ORDER_STATUS[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  const entry = PAYMENT_STATUS[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const entry = PRODUCT_STATUS[status];
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function AvailabilityBadge({ availability }: { availability: Availability }) {
  const entry = AVAILABILITY[availability];
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function EnumBadge({ value, className }: { value: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("normal-case tracking-normal", className)}>
      {value.replace(/_/g, " ")}
    </Badge>
  );
}
