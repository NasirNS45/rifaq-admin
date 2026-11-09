import { useMemo, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { BulkActionBar } from "@/components/BulkActionBar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ListRowCheckbox, ListSelectAllCheckbox } from "@/components/ListSelectionCheckbox";
import { TableSkeleton } from "@/components/loading";
import { EmptyState, PageHeader, PaginationBar, boolSelectValue, parseOptionalBool, rowNumber } from "@/components/PageHeader";
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
import { useBulkMutation } from "@/hooks/useBulkApi";
import { useCategories, useDeleteCategory } from "@/hooks/useCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { useRowSelection } from "@/hooks/useRowSelection";
import { ApiError } from "@/lib/api";
import { toastBulkResult } from "@/lib/bulkToast";

export function CategoryListPage() {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [q, setQ] = useState("");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const categories = useCategories({ q, is_active: isActive, page, limit: 20 });
  const remove = useDeleteCategory();
  const bulk = useBulkMutation([["categories"]]);
  const pageIds = useMemo(() => categories.data?.data.map((row) => row.id) ?? [], [categories.data?.data]);
  const selection = useRowSelection(pageIds, `${page}-${q}-${String(isActive)}`);
  const canSelect = canDelete || canUpdate;

  async function runBulk(path: string, body: unknown) {
    try {
      const { result, message } = await bulk.mutateAsync({ path, body });
      toastBulkResult(message, result);
      selection.clear();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Bulk action failed.";
      toast.error(message);
    }
  }

  async function handleDelete() {
    if (!pendingId) return;
    try {
      await remove.mutateAsync(pendingId);
      toast.success("Category removed.");
      setPendingId(null);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not delete this category.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Unstitched, Pret, Festive, Accessories, and New In. Lawn is a fabric, not a category. New In is navigational."
        action={
          canCreate ? (
            <Button asChild>
              <Link to="/categories/new">Add category</Link>
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
          setIsActive(parseOptionalBool(form.get("is_active")));
          setPage(1);
        }}
      >
        <Input name="q" placeholder="Search categories" className="max-w-xs" defaultValue={q} />
        <NativeSelect name="is_active" className="w-36" defaultValue={boolSelectValue(isActive)}>
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Hidden</option>
        </NativeSelect>
        <Button type="submit" variant="outline" pending={categories.isFetching}>
          {categories.isFetching ? "Searching" : "Search"}
        </Button>
      </form>
      {categories.isLoading ? (
        <TableSkeleton columns={["#", "Name", "Slug", "Status"]} />
      ) : categories.isError ? (
        <EmptyState variant="error" title="Could not load categories" body="Try again in a moment." />
      ) : !categories.data?.data.length ? (
        <EmptyState
          title="No categories yet"
          body="Add Unstitched, Pret, Festive, Accessories, and New In so shoppers can browse products by category."
          action={canCreate ? { to: "/categories/new", label: "Add category" } : undefined}
        />
      ) : (
        <div className="space-y-2">
          <BulkActionBar count={selection.selectedCount} onClear={selection.clear}>
            {canUpdate ? (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  pending={bulk.isPending}
                  onClick={() =>
                    void runBulk("/api/v1/categories/bulk-update", {
                      ids: selection.selectedIds,
                      is_active: true,
                    })
                  }
                >
                  Show
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  pending={bulk.isPending}
                  onClick={() =>
                    void runBulk("/api/v1/categories/bulk-update", {
                      ids: selection.selectedIds,
                      is_active: false,
                    })
                  }
                >
                  Hide
                </Button>
              </>
            ) : null}
            {canDelete ? (
              <Button type="button" size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
                Delete
              </Button>
            ) : null}
          </BulkActionBar>
          <div className="border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  {canSelect ? (
                    <TableHead className="w-10">
                      <ListSelectAllCheckbox
                        allSelected={selection.allSelected}
                        someSelected={selection.someSelected}
                        onToggle={selection.toggleAll}
                      />
                    </TableHead>
                  ) : null}
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.data.data.map((category, index) => (
                  <TableRow key={category.id}>
                    {canSelect ? (
                      <TableCell>
                        <ListRowCheckbox
                          checked={selection.isSelected(category.id)}
                          onToggle={() => selection.toggle(category.id)}
                          label={`Select ${category.name}`}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell>{rowNumber(page, 20, index)}</TableCell>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.slug}</TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? "secondary" : "outline"}>
                        {category.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canUpdate ? (
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/categories/${category.id}`}>Edit</Link>
                        </Button>
                      ) : null}
                      {canDelete ? (
                        <Button variant="ghost" size="sm" onClick={() => setPendingId(category.id)}>
                          Delete
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
      <PaginationBar page={page} limit={20} total={categories.data?.total ?? 0} onPage={setPage} />
      <ConfirmDialog
        open={Boolean(pendingId)}
        title="Remove this category?"
        body="Categories with pieces cannot be deleted. Move those pieces first. Lawn should stay a fabric on the product, not a category here."
        pending={remove.isPending}
        onOpenChange={(open) => {
          if (!open) setPendingId(null);
        }}
        onConfirm={() => void handleDelete()}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete selected categories?"
        body="Categories with products will be skipped."
        pending={bulk.isPending}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={() => {
          setBulkDeleteOpen(false);
          void runBulk("/api/v1/categories/bulk-delete", { ids: selection.selectedIds });
        }}
      />
    </div>
  );
}
