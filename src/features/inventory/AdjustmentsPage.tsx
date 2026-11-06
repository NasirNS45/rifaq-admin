import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/loading";
import { EmptyState, FieldError, PageHeader, PaginationBar, rowNumber } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAdjustments, useCreateAdjustment, useStock } from "@/hooks/useCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api";
import type { AdjustmentType } from "@/types/api";

const schema = z.object({
  product_id: z.string().min(1, "Choose a piece."),
  adjustment_type: z.enum(["RESTOCK", "SALE", "RETURN", "DAMAGE", "MANUAL_ADJUSTMENT"]),
  quantity: z.number({ error: "Enter a number." }).int("Enter a whole number."),
  reason: z.string(),
  note: z.string(),
});

type FormValues = z.infer<typeof schema>;

export function AdjustmentsPage() {
  const { canUpdate } = usePermissions();
  const [params] = useSearchParams();
  const productFilter = params.get("product_id") ?? "";
  const [q, setQ] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType | "">("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(Boolean(productFilter) && canUpdate);
  const ledger = useAdjustments({
    q,
    page,
    limit: 20,
    product_id: productFilter || undefined,
    adjustment_type: adjustmentType || undefined,
  });
  const stock = useStock({ page: 1, limit: 100 });
  const create = useCreateAdjustment();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_id: productFilter,
      adjustment_type: "RESTOCK",
      quantity: 1,
      reason: "",
      note: "",
    },
  });

  const products = useMemo(() => stock.data?.data ?? [], [stock.data]);

  async function onSubmit(values: FormValues) {
    try {
      await create.mutateAsync({
        product_id: values.product_id,
        adjustment_type: values.adjustment_type as AdjustmentType,
        quantity: values.quantity,
        reason: values.reason.trim() || null,
        note: values.note.trim() || null,
      });
      toast.success("Stock adjusted.");
      setOpen(false);
      form.reset({
        product_id: values.product_id,
        adjustment_type: "RESTOCK",
        quantity: 1,
        reason: "",
        note: "",
      });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not apply this adjustment.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventory"
        title="Adjustments"
        description="RESTOCK and RETURN add. SALE and DAMAGE subtract. Manual uses a signed quantity. Available stock cannot go below zero."
        action={
          canUpdate ? (
            <Button onClick={() => setOpen(true)}>Adjust stock</Button>
          ) : null
        }
      />
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setQ(String(form.get("q") ?? ""));
          setAdjustmentType(String(form.get("adjustment_type") ?? "") as AdjustmentType | "");
          setPage(1);
        }}
      >
        <Input name="q" placeholder="Search piece or SKU" className="max-w-xs" defaultValue={q} />
        <NativeSelect name="adjustment_type" className="w-44" defaultValue={adjustmentType}>
          <option value="">All types</option>
          <option value="RESTOCK">Restock</option>
          <option value="SALE">Sale</option>
          <option value="RETURN">Return</option>
          <option value="DAMAGE">Damage</option>
          <option value="MANUAL_ADJUSTMENT">Manual</option>
        </NativeSelect>
        <Button type="submit" variant="outline" pending={ledger.isFetching}>
          {ledger.isFetching ? "Searching" : "Search"}
        </Button>
      </form>
      {ledger.isLoading ? (
        <TableSkeleton columns={["#", "When", "Piece", "Type", "Qty", "Reason"]} />
      ) : ledger.isError ? (
        <EmptyState variant="error" title="Could not load the ledger" body="Inventory adjustments could not be fetched." />
      ) : !ledger.data?.data.length ? (
        <EmptyState
          title="No adjustments yet"
          body="When a piece is created with stock, a RESTOCK row is written. Later changes belong in this ledger, never as a silent overwrite."
        />
      ) : (
        <div className="border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Piece</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.data.data.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>{rowNumber(page, 20, index)}</TableCell>
                  <TableCell>{new Date(row.created_at).toLocaleString("en-PK")}</TableCell>
                  <TableCell>
                    {row.product_name}
                    <span className="block text-xs text-muted-foreground">{row.sku}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.adjustment_type}</Badge>
                  </TableCell>
                  <TableCell>{row.quantity}</TableCell>
                  <TableCell>{row.reason ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <PaginationBar page={page} limit={20} total={ledger.data?.total ?? 0} onPage={setPage} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle className="font-display text-2xl">Adjust stock</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            This writes a ledger row and updates availability. Product forms cannot change stock after create.
          </DialogDescription>
          <form className="mt-4 space-y-4" noValidate onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="product_id">Piece</Label>
              <NativeSelect id="product_id" {...form.register("product_id")}>
                <option value="">Choose a piece</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </NativeSelect>
              <FieldError message={form.formState.errors.product_id?.message} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adjustment_type">Type</Label>
                <NativeSelect id="adjustment_type" {...form.register("adjustment_type")}>
                  <option value="RESTOCK">Restock</option>
                  <option value="SALE">Sale</option>
                  <option value="RETURN">Return</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="MANUAL_ADJUSTMENT">Manual</option>
                </NativeSelect>
                <FieldError message={form.formState.errors.adjustment_type?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" type="number" {...form.register("quantity", { valueAsNumber: true })} />
                <FieldError message={form.formState.errors.quantity?.message} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input id="reason" {...form.register("reason")} />
              <FieldError message={form.formState.errors.reason?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea id="note" {...form.register("note")} />
              <FieldError message={form.formState.errors.note?.message} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={create.isPending} onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" pending={create.isPending}>
                {create.isPending ? "Saving" : "Apply"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
