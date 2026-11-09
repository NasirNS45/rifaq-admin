import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "react-router";
import { DebouncedSearchInput } from "@/components/ListFilters";
import { StackedOnMobile } from "@/components/StackedOnMobile";
import { TableSkeleton } from "@/components/loading";
import { EmptyState, PageHeader, PaginationBar, rowNumber } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCustomers } from "@/hooks/useOrders";
import { useListFilters } from "@/hooks/useListFilters";
import { usePermissions } from "@/hooks/usePermissions";
import { api } from "@/lib/api";
import { downloadCsv, fetchAllPages } from "@/lib/csvExport";
import { formatPkr } from "@/lib/utils";
import type { CustomerListItem } from "@/types/api";

const LIMIT = 20;

export function CustomerListPage() {
  const { canReadCustomers } = usePermissions();
  const [exporting, setExporting] = useState(false);
  const defaults = useMemo(() => ({ q: "" }), []);
  const { values, set, page, setPage } = useListFilters(defaults);
  const customers = useCustomers({ q: values.q || undefined, page, limit: LIMIT });

  async function exportCsv() {
    setExporting(true);
    try {
      const q = values.q || undefined;
      const rows = await fetchAllPages<CustomerListItem>(async (pageNum) => {
        const query = new URLSearchParams({ page: String(pageNum), limit: "100" });
        if (q) query.set("q", q);
        return api.getPage<CustomerListItem>(`/api/v1/customers?${query.toString()}`);
      });
      downloadCsv(
        "customers.csv",
        ["Name", "Phone", "Orders", "Total spent"],
        rows.map((row) => [row.name, row.phone, String(row.total_orders), row.total_spent]),
      );
      toast.success(`Exported ${rows.length} customers.`);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  }

  const tableView =
    !customers.isLoading && !customers.isError && customers.data?.data.length ? (
      <div className="border border-border bg-card">
        <Table>
          <caption className="sr-only">Customers</caption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Spent</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.data.data.map((customer, index) => (
              <TableRow key={customer.id}>
                <TableCell>{rowNumber(page, LIMIT, index)}</TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>{customer.total_orders}</TableCell>
                <TableCell>{formatPkr(customer.total_spent)}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/customers/${customer.id}`}>Open</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ) : null;

  const stackView =
    !customers.isLoading && !customers.isError && customers.data?.data.length ? (
      <>
        {customers.data.data.map((customer, index) => (
          <div key={customer.id} className="space-y-2 border border-border bg-card p-4">
            <p className="font-medium">{customer.name}</p>
            <p className="text-sm text-muted-foreground">{customer.phone}</p>
            <p className="text-sm">
              {customer.total_orders} orders · {formatPkr(customer.total_spent)}
            </p>
            <p className="text-xs text-muted-foreground">#{rowNumber(page, LIMIT, index)}</p>
            <Button asChild className="w-full touch-target sm:min-h-0">
              <Link to={`/customers/${customer.id}`}>Open</Link>
            </Button>
          </div>
        ))}
      </>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Customers"
        title="Customers"
        description="Phone-first records created at prepaid checkout. Phone is the identity and cannot be changed here."
        action={
          canReadCustomers ? (
            <Button type="button" variant="outline" pending={exporting} onClick={() => void exportCsv()}>
              Export CSV
            </Button>
          ) : null
        }
      />
      <div className="max-w-md">
        <DebouncedSearchInput
          value={values.q}
          onDebouncedChange={(next) => set({ q: next })}
          placeholder="Search name or phone"
        />
      </div>
      {customers.isLoading ? (
        <TableSkeleton columns={["#", "Name", "Phone", "Orders", "Spent", ""]} />
      ) : customers.isError ? (
        <EmptyState
          variant="error"
          title="Could not load customers"
          body="Customer records could not be fetched."
        />
      ) : !customers.data?.data.length ? (
        <EmptyState
          title="No customers yet"
          body="A customer record is created when someone pays for an order, or starts checkout."
        />
      ) : (
        <StackedOnMobile table={tableView} stack={stackView} />
      )}
      <PaginationBar page={page} limit={LIMIT} total={customers.data?.total ?? 0} onPage={setPage} />
    </div>
  );
}
