import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
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
import { useCollections, useDeleteCollection } from "@/hooks/useCatalog";
import { usePermissions } from "@/hooks/usePermissions";
import { ApiError } from "@/lib/api";

export function CollectionListPage() {
  const { canCreate, canUpdate, canDelete } = usePermissions();
  const [q, setQ] = useState("");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const collections = useCollections({ q, is_active: isActive, page, limit: 20 });
  const remove = useDeleteCollection();

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
        <div className="border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
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
      )}
      <PaginationBar page={page} limit={20} total={collections.data?.total ?? 0} onPage={setPage} />
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
