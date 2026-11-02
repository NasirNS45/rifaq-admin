import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
import { useBrands, useCategories, useDeleteProduct, useProducts } from "@/hooks/useCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api";
import { formatPkr } from "@/lib/utils";
import type { Availability, ProductStatus } from "@/types/api";

const AVAILABILITY_LABEL: Record<Availability, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Sold out",
  PRE_ORDER: "Pre-order",
};

export function ProductListPage() {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [availability, setAvailability] = useState<Availability | "">("");
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const brands = useBrands({ page: 1, limit: 100 });
  const categories = useCategories({ page: 1, limit: 100 });
  const products = useProducts({
    q,
    page,
    limit: 20,
    status: status || undefined,
    availability: availability || undefined,
    brand_id: brandId || undefined,
    category_id: categoryId || undefined,
  });
  const remove = useDeleteProduct();

  async function handleDelete() {
    if (!pendingId) return;
    try {
      await remove.mutateAsync(pendingId);
      toast.success("Product removed.");
      setPendingId(null);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not delete this piece.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage product details here. Stock changes belong on the inventory ledger, not on this form after creation."
        action={
          canCreate ? (
            <Button asChild>
              <Link to="/products/new">Add product</Link>
            </Button>
          ) : null
        }
      />
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setQ(String(form.get("q") ?? ""));
          setStatus(String(form.get("status") ?? "") as ProductStatus | "");
          setAvailability(String(form.get("availability") ?? "") as Availability | "");
          setBrandId(String(form.get("brand_id") ?? ""));
          setCategoryId(String(form.get("category_id") ?? ""));
          setPage(1);
        }}
      >
        <Input name="q" placeholder="Search name, SKU, fabric" className="max-w-xs" defaultValue={q} />
        <NativeSelect name="status" className="w-40" defaultValue={status}>
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </NativeSelect>
        <NativeSelect name="availability" className="w-40" defaultValue={availability}>
          <option value="">All availability</option>
          <option value="IN_STOCK">In stock</option>
          <option value="LOW_STOCK">Low stock</option>
          <option value="OUT_OF_STOCK">Sold out</option>
          <option value="PRE_ORDER">Pre-order</option>
        </NativeSelect>
        <NativeSelect name="brand_id" className="w-44" defaultValue={brandId}>
          <option value="">All brands</option>
          {(brands.data?.data ?? []).map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="category_id" className="w-44" defaultValue={categoryId}>
          <option value="">All categories</option>
          {(categories.data?.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline" pending={products.isFetching}>
          {products.isFetching ? "Searching" : "Search"}
        </Button>
      </form>
      {products.isLoading ? (
        <TableSkeleton columns={["#", "Piece", "SKU", "Brand", "Price", "Stock", "Status"]} />
      ) : products.isError ? (
        <EmptyState title="Could not load products" body="Products could not be fetched. Try again in a moment." />
      ) : !products.data?.data.length ? (
        <EmptyState
          title="No products yet"
          body="Add unstitched lawn, pret, and festive pieces. Brands are catalogue labels only."
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
                <TableHead>Brand</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.data.data.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell>{rowNumber(page, 20, index)}</TableCell>
                  <TableCell>
                    <div>
                      <p>{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.fabric ?? "Fabric unset"}</p>
                    </div>
                  </TableCell>
                  <TableCell>{product.sku}</TableCell>
                  <TableCell>{product.brand.name}</TableCell>
                  <TableCell>{formatPkr(product.price)}</TableCell>
                  <TableCell>
                    {product.available_stock}{" "}
                    <span className="text-xs text-muted-foreground">
                      {AVAILABILITY_LABEL[product.availability]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.status === "ACTIVE" ? "secondary" : "outline"}>{product.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/products/${product.id}`}>{canUpdate ? "Edit" : "View"}</Link>
                    </Button>
                    {canDelete ? (
                      <Button variant="ghost" size="sm" onClick={() => setPendingId(product.id)}>
                        Delete
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <PaginationBar page={page} limit={20} total={products.data?.total ?? 0} onPage={setPage} />
      <ConfirmDialog
        open={Boolean(pendingId)}
        title="Remove this piece?"
        body="If it is already on an order, archive it instead. Hard delete is only for pieces that have never been sold."
        pending={remove.isPending}
        onOpenChange={(open) => {
          if (!open) setPendingId(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
