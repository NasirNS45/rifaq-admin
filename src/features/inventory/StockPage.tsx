import { useMemo, useState } from "react";
import { Link } from "react-router";
import { BulkActionBar } from "@/components/BulkActionBar";
import { ListRowCheckbox, ListSelectAllCheckbox } from "@/components/ListSelectionCheckbox";
import { TableSkeleton } from "@/components/loading";
import { EmptyState, PageHeader, PaginationBar, rowNumber } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bulkDialogOnOpenChange, performBulkAction, useBulkMutation } from "@/hooks/useBulkApi";
import { useStock } from "@/hooks/useCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { useRowSelection } from "@/hooks/useRowSelection";
import type { AdjustmentType, Availability } from "@/types/api";

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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>("RESTOCK");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const stock = useStock({
    q,
    availability: availability || undefined,
    page,
    limit: 20,
  });
  const bulk = useBulkMutation([["inventory"], ["products"], ["dashboard"]]);
  const pageIds = useMemo(() => stock.data?.data.map((row) => row.id) ?? [], [stock.data?.data]);
  const selection = useRowSelection(pageIds, `${page}-${q}-${availability}`);

  async function submitBulkAdjust() {
    if (selection.selectedCount < 1) return;
    const ok = await performBulkAction(
      bulk.mutateAsync,
      "/api/v1/inventory/adjustments/bulk",
      {
        product_ids: selection.selectedIds,
        adjustment_type: adjustmentType,
        quantity,
        reason: reason.trim() || null,
        note: note.trim() || null,
      },
      { onSuccess: () => selection.clear() },
    );
    if (ok) setBulkOpen(false);
  }

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
        <EmptyState variant="error" title="Could not load stock" body="Inventory figures could not be fetched." />
      ) : !stock.data?.data.length ? (
        <EmptyState
          title="No stock to show"
          body="When products are added to the catalog, current, reserved, and available quantities will list here."
          action={canCreate ? { to: "/products/new", label: "Add product" } : undefined}
        />
      ) : (
        <div className="space-y-2">
          {canUpdate ? (
            <BulkActionBar count={selection.selectedCount} onClear={selection.clear}>
              <Button type="button" size="sm" onClick={() => setBulkOpen(true)} disabled={selection.selectedCount < 1}>
                Adjust selected
              </Button>
            </BulkActionBar>
          ) : null}
          <div className="border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  {canUpdate ? (
                    <TableHead className="w-10">
                      <ListSelectAllCheckbox
                        allSelected={selection.allSelected}
                        someSelected={selection.someSelected}
                        onToggle={selection.toggleAll}
                      />
                    </TableHead>
                  ) : null}
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
                    {canUpdate ? (
                      <TableCell>
                        <ListRowCheckbox
                          checked={selection.isSelected(row.id)}
                          onToggle={() => selection.toggle(row.id)}
                          label={`Select ${row.name}`}
                        />
                      </TableCell>
                    ) : null}
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
        </div>
      )}
      <PaginationBar page={page} limit={20} total={stock.data?.total ?? 0} onPage={setPage} />

      <Dialog open={bulkOpen} onOpenChange={bulkDialogOnOpenChange(bulk.isPending, setBulkOpen)}>
        <DialogContent>
          <DialogTitle className="font-display text-2xl">Bulk stock adjustment</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Applies the same ledger entry to {selection.selectedCount} selected pieces. Failures are reported per piece.
          </DialogDescription>
          <form
            className="mt-4 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitBulkAdjust();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="bulk_type">Type</Label>
                <NativeSelect
                  id="bulk_type"
                  value={adjustmentType}
                  onChange={(event) => setAdjustmentType(event.target.value as AdjustmentType)}
                >
                  <option value="RESTOCK">Restock</option>
                  <option value="MANUAL_ADJUSTMENT">Manual</option>
                  <option value="DAMAGE">Damage</option>
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bulk_qty">Quantity</Label>
                <Input
                  id="bulk_qty"
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(Number(event.target.value))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk_reason">Reason</Label>
              <Input id="bulk_reason" value={reason} onChange={(event) => setReason(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk_note">Note</Label>
              <Textarea id="bulk_note" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={bulk.isPending} onClick={() => setBulkOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" pending={bulk.isPending}>
                Apply
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
