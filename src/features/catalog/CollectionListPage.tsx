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
import { useCollections, useDeleteCollection } from "@/hooks/useCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { useRowSelection } from "@/hooks/useRowSelection";
import { ApiError } from "@/lib/api";
import { toastBulkResult } from "@/lib/bulkToast";

export function CollectionListPage() {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [q, setQ] = useState("");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const collections = useCollections({ q, is_active: isActive, page, limit: 20 });
  const remove = useDeleteCollection();
  const bulk = useBulkMutation([["collections"]]);
  const pageIds = useMemo(() => collections.data?.data.map((row) => row.id) ?? [], [collections.data?.data]);
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
      toast.success("Collection removed.");
      setPendingId(null);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Could not delete this collection.";
      toast.error(message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Collections"
        description="Examples: New Arrivals, RIFAQ Picks, Summer, Festive, and Sale."
        action={
          canCreate ? (
            <Button asChild>
              <Link to="/collections/new">Add collection</Link>
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
        <Input name="q" placeholder="Search collections" className="max-w-xs" defaultValue={q} />
        <NativeSelect name="is_active" className="w-36" defaultValue={boolSelectValue(isActive)}>
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Hidden</option>
        </NativeSelect>
        <Button type="submit" variant="outline" pending={collections.isFetching}>
          {collections.isFetching ? "Searching" : "Search"}
        </Button>
      </form>
      {collections.isLoading ? (
        <TableSkeleton columns={["#", "Name", "Slug", "Status"]} />
      ) : collections.isError ? (
        <EmptyState variant="error" title="Could not load collections" body="Try again in a moment." />
      ) : !collections.data?.data.length ? (
        <EmptyState
          title="No collections yet"
          body="Group products into collections such as New Arrivals, RIFAQ Picks, Summer, Festive, or Sale."
          action={canCreate ? { to: "/collections/new", label: "Add collection" } : undefined}
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
                    void runBulk("/api/v1/collections/bulk-update", {
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
                    void runBulk("/api/v1/collections/bulk-update", {
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
              {collections.data.data.map((collection, index) => (
                <TableRow key={collection.id}>
                  {canSelect ? (
                    <TableCell>
                      <ListRowCheckbox
                        checked={selection.isSelected(collection.id)}
                        onToggle={() => selection.toggle(collection.id)}
                        label={`Select ${collection.name}`}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell>{rowNumber(page, 20, index)}</TableCell>
                  <TableCell>{collection.name}</TableCell>
                  <TableCell>{collection.slug}</TableCell>
                  <TableCell>
                    <Badge variant={collection.is_active ? "secondary" : "outline"}>
                      {collection.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canUpdate ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/collections/${collection.id}`}>Edit</Link>
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Button variant="ghost" size="sm" onClick={() => setPendingId(collection.id)}>
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
      <PaginationBar page={page} limit={20} total={collections.data?.total ?? 0} onPage={setPage} />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title="Delete selected collections?"
        body="Collections still linked to pieces may be skipped."
        pending={bulk.isPending}
        onOpenChange={setBulkDeleteOpen}
        onConfirm={() => {
          setBulkDeleteOpen(false);
          void runBulk("/api/v1/collections/bulk-delete", { ids: selection.selectedIds });
        }}
      />
      <ConfirmDialog
        open={Boolean(pendingId)}
        title="Remove this collection?"
        body="Pieces stay in the catalogue. They are only removed from this grouping."
        pending={remove.isPending}
        onOpenChange={(open) => {
          if (!open) setPendingId(null);
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
