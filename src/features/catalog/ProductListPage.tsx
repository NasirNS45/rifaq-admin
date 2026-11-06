import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DebouncedSearchInput, ListFiltersChrome } from "@/components/ListFilters";
import { StackedOnMobile } from "@/components/StackedOnMobile";
import { TableSkeleton } from "@/components/loading";
import { EmptyState, PageHeader, PaginationBar, rowNumber } from "@/components/PageHeader";
import { ProductImageFallback } from "@/components/ProductImageFallback";
import { AvailabilityBadge, ProductStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useListFilters } from "@/hooks/useListFilters";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError, api, mediaPreviewUrl } from "@/lib/api";
import { formatPkr } from "@/lib/utils";
import type { Availability, Brand, Category, Collection, ProductListItem, ProductStatus } from "@/types/api";

const LIMIT = 20;

function ProductThumbnail({ product }: { product: ProductListItem }) {
  const src = product.thumbnail?.trim();
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className="h-12 w-12 shrink-0 border border-border bg-surface-sunken">
        <ProductImageFallback className="!h-full !w-full" label={product.name} />
      </div>
    );
  }
  return (
    <img
      src={mediaPreviewUrl(src)}
      alt=""
      width={48}
      height={48}
      loading="lazy"
      decoding="async"
      className="h-12 w-12 shrink-0 border border-border object-cover"
      onError={() => setBroken(true)}
    />
  );
}

function ProductRowActions({
  productId,
  canUpdate,
  canDelete,
  onDelete,
}: {
  productId: string;
  canUpdate: boolean;
  canDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Actions for this product" className="min-w-[7rem]">
          Actions
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link to={`/products/${productId}`}>{canUpdate ? "Edit" : "View"}</Link>
        </DropdownMenuItem>
        {canDelete ? (
          <DropdownMenuItem className="text-destructive" onSelect={(event) => event.preventDefault()} onClick={onDelete}>
            Delete
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function priceCell(product: ProductListItem) {
  const current = Number(product.price);
  const original = product.original_price ? Number(product.original_price) : null;
  const onSale = original !== null && !Number.isNaN(original) && original > current;
  return (
    <div className="flex flex-col gap-0.5">
      <span>{formatPkr(product.price)}</span>
      {onSale ? (
        <span className="text-xs text-muted-foreground line-through">{formatPkr(product.original_price!)}</span>
      ) : null}
    </div>
  );
}

export function ProductListPage() {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const queryClient = useQueryClient();
  const defaults = useMemo(
    () => ({
      q: "",
      status: "",
      availability: "",
      brand_id: "",
      category_id: "",
    }),
    [],
  );
  const { values, set, clear, page, setPage } = useListFilters(defaults);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const brands = useBrands({ page: 1, limit: 100 });
  const categories = useCategories({ page: 1, limit: 100 });

  const products = useProducts({
    q: values.q || undefined,
    page,
    limit: LIMIT,
    status: (values.status as ProductStatus) || undefined,
    availability: (values.availability as Availability) || undefined,
    brand_id: values.brand_id || undefined,
    category_id: values.category_id || undefined,
  });
  const remove = useDeleteProduct();

  const hasFilters = Boolean(
    values.q || values.status || values.availability || values.brand_id || values.category_id,
  );

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

  const filterFields = (
    <>
      <NativeSelect
        aria-label="Status"
        className="w-full min-w-0 sm:w-44"
        value={values.status}
        onChange={(event) => set({ status: event.target.value })}
      >
        <option value="">All statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="ACTIVE">Active</option>
        <option value="ARCHIVED">Archived</option>
      </NativeSelect>
      <NativeSelect
        aria-label="Availability"
        className="w-full min-w-0 sm:w-44"
        value={values.availability}
        onChange={(event) => set({ availability: event.target.value })}
      >
        <option value="">All availability</option>
        <option value="IN_STOCK">In stock</option>
        <option value="LOW_STOCK">Low stock</option>
        <option value="OUT_OF_STOCK">Sold out</option>
        <option value="PRE_ORDER">Pre-order</option>
      </NativeSelect>
      <NativeSelect
        aria-label="Brand"
        className="w-full min-w-0 sm:w-44"
        value={values.brand_id}
        onChange={(event) => set({ brand_id: event.target.value })}
      >
        <option value="">All brands</option>
        {(brands.data?.data ?? []).map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        aria-label="Category"
        className="w-full min-w-0 sm:w-44"
        value={values.category_id}
        onChange={(event) => set({ category_id: event.target.value })}
      >
        <option value="">All categories</option>
        {(categories.data?.data ?? []).map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </NativeSelect>
    </>
  );

  const tableView =
    !products.isLoading && !products.isError && products.data?.data.length ? (
      <div className="border border-border bg-card">
        <Table>
          <caption className="sr-only">Products matching your filters</caption>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-[1] min-w-[3rem] bg-card">#</TableHead>
              <TableHead className="min-w-[3rem]"> </TableHead>
              <TableHead>Piece</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.data.data.map((product, index) => (
              <TableRow key={product.id}>
                <TableCell className="sticky left-0 z-[1] bg-card">{rowNumber(page, LIMIT, index)}</TableCell>
                <TableCell>
                  <ProductThumbnail product={product} />
                </TableCell>
                <TableCell>
                  <div>
                    <p>{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.fabric ?? "Fabric unset"}</p>
                  </div>
                </TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.brand.name}</TableCell>
                <TableCell>{priceCell(product)}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span>{product.available_stock}</span>
                    <AvailabilityBadge availability={product.availability} />
                  </div>
                </TableCell>
                <TableCell>
                  <ProductStatusBadge status={product.status} />
                </TableCell>
                <TableCell className="text-right">
                  <ProductRowActions
                    productId={product.id}
                    canUpdate={canUpdate}
                    canDelete={canDelete}
                    onDelete={() => setPendingId(product.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ) : null;

  const stackView =
    !products.isLoading && !products.isError && products.data?.data.length ? (
      <>
        {products.data.data.map((product, index) => (
          <div key={product.id} className="border border-border bg-card p-4">
            <div className="flex gap-3">
              <ProductThumbnail product={product} />
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">#{rowNumber(page, LIMIT, index)} · {product.sku}</p>
                <div className="text-sm">{priceCell(product)}</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <AvailabilityBadge availability={product.availability} />
                  <ProductStatusBadge status={product.status} />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <ProductRowActions
                productId={product.id}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onDelete={() => setPendingId(product.id)}
              />
            </div>
          </div>
        ))}
      </>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage product details here. Stock changes belong on the inventory ledger, not on this form after creation."
        action={
          canCreate ? (
            <Button asChild>
              <Link
                to="/products/new"
                onMouseEnter={() => {
                  const list = { page: 1, limit: 100, is_active: true };
                  void queryClient.prefetchQuery({
                    queryKey: ["brands", list],
                    queryFn: ({ signal }) =>
                      api.getPage<Brand>(`/api/v1/brands?page=1&limit=100&is_active=true`, { signal }),
                  });
                  void queryClient.prefetchQuery({
                    queryKey: ["categories", list],
                    queryFn: ({ signal }) =>
                      api.getPage<Category>(`/api/v1/categories?page=1&limit=100&is_active=true`, { signal }),
                  });
                  void queryClient.prefetchQuery({
                    queryKey: ["collections", { page: 1, limit: 100 }],
                    queryFn: ({ signal }) =>
                      api.getPage<Collection>(`/api/v1/collections?page=1&limit=100`, { signal }),
                  });
                }}
              >
                Add product
              </Link>
            </Button>
          ) : null
        }
      />

      <ListFiltersChrome
        pending={products.isFetching}
        clearDisabled={!hasFilters}
        onClear={() => clear()}
        primaryRow={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end">
            <DebouncedSearchInput
              value={values.q}
              onDebouncedChange={(next) => set({ q: next })}
              placeholder="Search name, SKU, fabric"
            />
          </div>
        }
      >
        {filterFields}
      </ListFiltersChrome>

      {products.isLoading ? (
        <TableSkeleton columns={["#", "", "Piece", "SKU", "Brand", "Price", "Stock", "Status", ""]} />
      ) : products.isError ? (
        <EmptyState variant="error" title="Could not load products" body="Products could not be fetched. Try again in a moment." />
      ) : !products.data?.data.length ? (
        <EmptyState
          title="No products yet"
          body="Add unstitched lawn, pret, and festive pieces. Brands are catalogue labels only."
          action={canCreate ? { to: "/products/new", label: "Add product" } : undefined}
        />
      ) : (
        <StackedOnMobile table={tableView} stack={stackView} />
      )}

      <PaginationBar page={page} limit={LIMIT} total={products.data?.total ?? 0} onPage={setPage} />

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
