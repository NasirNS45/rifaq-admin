import { useState } from "react";
import { Link } from "react-router";
import { TableSkeleton } from "@/components/loading";
import { EmptyState, PageHeader, PaginationBar, rowNumber } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useStock } from "@/hooks/useCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import type { Availability } from "@/types/api";

const AVAILABILITY_LABEL: Record<Availability, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Sold out",
  PRE_ORDER: "Pre-order",
};

export function StockPage() {
  const { canCreate, canUpdate } = usePermissions();
  const [q, setQ] = useState("");
  const [availability, setAvailability] = useState<Availability | "">("");
  const [page, setPage] = useState(1);
  const stock = useStock({
    q,
    availability: availability || undefined,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Stock"
        description="Available stock is current quantity minus reserved. Adjustments are the only way to change stock after a piece is created."
        action={
          canUpdate ? (
            <Button asChild variant="outline">
              <Link to="/inventory/adjustments">Open ledger</Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link to="/inventory/adjustments">View ledger</Link>
            </Button>
          )
        }
      />
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setQ(String(form.get("q") ?? ""));
          setAvailability(String(form.get("availability") ?? "") as Availability | "");
          setPage(1);
        }}
      >
        <Input name="q" placeholder="Search piece or SKU" className="max-w-xs" defaultValue={q} />
        <NativeSelect name="availability" className="w-40" defaultValue={availability}>
          <option value="">All availability</option>
          <option value="IN_STOCK">In stock</option>
          <option value="LOW_STOCK">Low stock</option>
          <option value="OUT_OF_STOCK">Sold out</option>
          <option value="PRE_ORDER">Pre-order</option>
        </NativeSelect>
        <Button type="submit" variant="outline" pending={stock.isFetching}>
          {stock.isFetching ? "Searching" : "Search"}
        </Button>
      </form>
      {stock.isLoading ? (
        <TableSkeleton columns={["#", "Piece", "SKU", "Current", "Reserved", "Available", "Availability"]} />
      ) : stock.isError ? (
        <EmptyState title="Could not load stock" body="Inventory figures could not be fetched." />
      ) : !stock.data?.data.length ? (
        <EmptyState
          title="No stock to show"
          body="When products are added to the catalog, current, reserved, and available quantities will list here."
          action={canCreate ? { to: "/products/new", label: "Add product" } : undefined}
        />
      ) : (
        <div className="border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Piece</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Current</TableHead>
                <TableHead>Reserved</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stock.data.data.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{rowNumber(page, 20, index)}</TableCell>
                  <TableCell>
                    <Link className="underline-offset-2 hover:underline" to={`/products/${row.id}`}>
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>{row.sku}</TableCell>
                  <TableCell>{row.stock_quantity}</TableCell>
                  <TableCell>{row.reserved_stock}</TableCell>
                  <TableCell>{row.available_stock}</TableCell>
                  <TableCell>
                    <Badge variant={row.availability === "LOW_STOCK" ? "destructive" : "secondary"}>
                      {AVAILABILITY_LABEL[row.availability]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canUpdate ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/inventory/adjustments?product_id=${row.id}`}>Adjust</Link>
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <PaginationBar page={page} limit={20} total={stock.data?.total ?? 0} onPage={setPage} />
    </div>
  );
}
