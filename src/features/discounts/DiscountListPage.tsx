import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DebouncedSearchInput, ListFiltersChrome } from "@/components/ListFilters";
import { StackedOnMobile } from "@/components/StackedOnMobile";
import { TableSkeleton } from "@/components/loading";
import { EmptyState, PageHeader, PaginationBar, rowNumber } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
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
import { useDeleteDiscount, useDiscounts } from "@/hooks/useDiscounts";
import { useListFilters } from "@/hooks/useListFilters";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api";
import { formatPkr } from "@/lib/utils";
import type { Discount } from "@/types/api";

function valueLabel(discount: Discount) {
  if (discount.discount_type === "PERCENTAGE") {
    return `${Number(discount.value)}%`;
  }
  return formatPkr(discount.value);
}

function windowLabel(discount: Discount) {
  if (!discount.starts_at && !discount.ends_at) return "Open";
  const start = discount.starts_at ? new Date(discount.starts_at).toLocaleDateString("en-PK") : "Open";
  const end = discount.ends_at ? new Date(discount.ends_at).toLocaleDateString("en-PK") : "Open";
  return `${start} to ${end}`;
}

function scopeLabel(discount: Discount) {
  if (discount.product_ids.length === 0 && discount.collection_ids.length === 0) {
    return "Store-wide";
  }
  const parts: string[] = [];
  if (discount.product_ids.length) parts.push(`${discount.product_ids.length} pieces`);
  if (discount.collection_ids.length) parts.push(`${discount.collection_ids.length} collections`);
  return parts.join(", ");
}

function parseOptionalActive(value: string): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

const LIMIT = 20;

export function DiscountListPage() {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const defaults = useMemo(() => ({ q: "", is_active: "" }), []);
  const { values, set, clear, page, setPage } = useListFilters(defaults);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const discounts = useDiscounts({
    q: values.q || undefined,
    is_active: parseOptionalActive(values.is_active),
    page,
    limit: LIMIT,
  });
  const remove = useDeleteDiscount();

  const hasFilters = Boolean(values.q || values.is_active);

  async function handleDelete() {
    if (!pendingId) return;
    try {
      await remove.mutateAsync(pendingId);
      toast.success("Campaign removed.");
      setPendingId(null);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not delete this campaign.";
      toast.error(message);
    }
  }

  const filterFields = (
    <NativeSelect
      aria-label="Campaign status"
      className="w-full min-w-0 sm:w-36"
      value={values.is_active}
      onChange={(event) => set({ is_active: event.target.value })}
    >
      <option value="">All statuses</option>
      <option value="true">Active</option>
      <option value="false">Off</option>
    </NativeSelect>
  );

  const tableView =
    !discounts.isLoading && !discounts.isError && discounts.data?.data.length ? (
      <div className="border border-border bg-card">
        <Table>
          <caption className="sr-only">Discount campaigns</caption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Window</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.data.data.map((discount, index) => (
              <TableRow key={discount.id}>
                <TableCell>{rowNumber(page, LIMIT, index)}</TableCell>
                <TableCell>{discount.name}</TableCell>
                <TableCell>{discount.discount_type === "PERCENTAGE" ? "Percentage" : "Fixed amount"}</TableCell>
                <TableCell>{valueLabel(discount)}</TableCell>
                <TableCell>{windowLabel(discount)}</TableCell>
                <TableCell>{scopeLabel(discount)}</TableCell>
                <TableCell>
                  <Badge variant={discount.is_active ? "success" : "outline"}>
                    {discount.is_active ? "Active" : "Off"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" aria-label={`Actions for ${discount.name}`}>
                        Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canUpdate ? (
                        <DropdownMenuItem asChild>
                          <Link to={`/discounts/${discount.id}`}>Edit</Link>
                        </DropdownMenuItem>
                      ) : null}
                      {canDelete ? (
                        <DropdownMenuItem
                          className="text-destructive"
                          onSelect={(event) => event.preventDefault()}
                          onClick={() => setPendingId(discount.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ) : null;

  const stackView =
    !discounts.isLoading && !discounts.isError && discounts.data?.data.length ? (
      <>
        {discounts.data.data.map((discount, index) => (
          <div key={discount.id} className="space-y-2 border border-border bg-card p-4">
            <div className="flex justify-between gap-2">
              <p className="font-medium">{discount.name}</p>
              <Badge variant={discount.is_active ? "success" : "outline"}>
                {discount.is_active ? "Active" : "Off"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">#{rowNumber(page, LIMIT, index)}</p>
            <p className="text-sm">
              {discount.discount_type === "PERCENTAGE" ? "Percentage" : "Fixed"} · {valueLabel(discount)}
            </p>
            <p className="text-sm text-muted-foreground">{windowLabel(discount)}</p>
            <p className="text-sm text-muted-foreground">{scopeLabel(discount)}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full touch-target sm:min-h-0" aria-label={`Actions for ${discount.name}`}>
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canUpdate ? (
                  <DropdownMenuItem asChild>
                    <Link to={`/discounts/${discount.id}`}>Edit</Link>
                  </DropdownMenuItem>
                ) : null}
                {canDelete ? (
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={(event) => event.preventDefault()}
                    onClick={() => setPendingId(discount.id)}
                  >
                    Delete
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketing"
        title="Discounts"
        description="Automatic sale campaigns. The storefront shows the lowest matching selling price. Campaigns do not stack, and stored catalogue prices stay unchanged."
        action={
          canCreate ? (
            <Button asChild>
              <Link to="/discounts/new">Add campaign</Link>
            </Button>
          ) : null
        }
      />

      <ListFiltersChrome
        pending={discounts.isFetching}
        clearDisabled={!hasFilters}
        onClear={() => clear()}
        primaryRow={
          <DebouncedSearchInput
            value={values.q}
            onDebouncedChange={(next) => set({ q: next })}
            placeholder="Search campaigns"
          />
        }
      >
        {filterFields}
      </ListFiltersChrome>

      {discounts.isLoading ? (
        <TableSkeleton columns={["#", "Name", "Type", "Value", "Window", "Scope", "Status", ""]} />
      ) : discounts.isError ? (
        <EmptyState
          variant="error"
          title="Could not load discounts"
          body="Sale campaigns could not be fetched. Try again in a moment."
        />
      ) : !discounts.data?.data.length ? (
        <EmptyState
          title="No sale campaigns yet"
          body="Add a percentage or fixed PKR campaign. Leave products and collections empty for a store-wide sale."
          action={canCreate ? { to: "/discounts/new", label: "Add campaign" } : undefined}
        />
      ) : (
        <StackedOnMobile table={tableView} stack={stackView} />
      )}

      <PaginationBar page={page} limit={LIMIT} total={discounts.data?.total ?? 0} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(pendingId)}
        title="Remove this campaign?"
        body="The stored catalogue prices stay the same. Live sale prices stop applying as soon as the campaign is gone."
        pending={remove.isPending}
        onOpenChange={(open) => {
          if (!open) setPendingId(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
