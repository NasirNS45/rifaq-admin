import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormSkeleton } from "@/components/loading";
import { EmptyState, FieldError, PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomer, useUpdateCustomer } from "@/hooks/useOrders";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api";
import { formatPkr } from "@/lib/utils";
import type { CustomerAdmin } from "@/types/api";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  email: z.string().refine(
    (value) => {
      const trimmed = value.trim();
      if (!trimmed) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    },
    { message: "Enter a valid email." },
  ),
});

type FormValues = z.infer<typeof schema>;

function CustomerEditForm({ customer }: { customer: CustomerAdmin }) {
  const { canUpdateCustomers } = usePermissions();
  const update = useUpdateCustomer();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: customer.name,
      email: customer.email ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await update.mutateAsync({ id: customer.id, name: values.name, email: values.email.trim() || "" });
      toast.success("Customer updated.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not update this customer.";
      toast.error(message);
    }
  }

  return (
    <form
      className="space-y-3 border border-border bg-card p-5"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <h2 className="font-display text-2xl">Details</h2>
      <label className="block text-sm">
        Name
        <Input className="mt-1" disabled={!canUpdateCustomers} {...form.register("name")} />
        <FieldError message={form.formState.errors.name?.message} />
      </label>
      <label className="block text-sm">
        Email
        <Input
          className="mt-1"
          type="text"
          autoComplete="email"
          disabled={!canUpdateCustomers}
          {...form.register("email")}
        />
        <FieldError message={form.formState.errors.email?.message} />
      </label>
      <p className="text-sm text-muted-foreground">Phone is identity and stays {customer.phone}.</p>
      {canUpdateCustomers ? (
        <Button type="submit" pending={update.isPending}>
          {update.isPending ? "Saving" : "Save"}
        </Button>
      ) : null}
    </form>
  );
}

export function CustomerDetailPage() {
  const { id } = useParams();
  const customerQuery = useCustomer(id);
  const customer = customerQuery.data;

  if (customerQuery.isError) {
    return (
      <EmptyState variant="error" title="Customer not found" body="This customer could not be loaded." />
    );
  }
  if (customerQuery.isLoading || !customer) {
    return <FormSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Customers" title={customer.name} description={customer.phone} />
      <section className="grid gap-4 lg:grid-cols-2">
        <CustomerEditForm key={customer.id} customer={customer} />
        <div className="border border-border bg-card p-5 text-sm">
          <h2 className="font-display text-2xl">Totals</h2>
          <p className="mt-3">Paid orders: {customer.total_orders}</p>
          <p>Spent: {formatPkr(customer.total_spent)}</p>
          <div className="mt-4 space-y-2">
            {customer.addresses.length ? (
              customer.addresses.map((address) => (
                <p key={address.id} className="text-muted-foreground">
                  {[address.address, address.area, address.city, address.postal_code].filter(Boolean).join(", ")}
                </p>
              ))
            ) : (
              <p className="text-muted-foreground">No saved address.</p>
            )}
          </div>
        </div>
      </section>
      <div className="border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {customer.orders.length ? (
              customer.orders.map((order, index) => (
                <TableRow key={order.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{order.order_number}</TableCell>
                  <TableCell>{formatPkr(order.total)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/orders/${order.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No orders for this customer yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
