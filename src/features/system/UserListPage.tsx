import { useMemo, useState } from "react";
import { Link } from "react-router";
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
import { bulkDialogOnOpenChange, performBulkAction, useBulkMutation } from "@/hooks/useBulkApi";
import { usePermissions } from "@/hooks/usePermissions";
import { useRowSelection } from "@/hooks/useRowSelection";
import { useAdminUsers } from "@/hooks/useUsers";
import type { AdminRole } from "@/types/api";

const ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  STAFF: "Staff",
};

export function UserListPage() {
  const { canReadUsers, canManageUsers } = usePermissions();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<AdminRole | "">("");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [bulkOpen, setBulkOpen] = useState(false);
  const users = useAdminUsers({
    q,
    role: role || undefined,
    is_active: isActive,
    page,
    limit: 20,
  });
  const bulk = useBulkMutation([["users"]]);
  const pageIds = useMemo(() => users.data?.data.map((row) => row.id) ?? [], [users.data?.data]);
  const selection = useRowSelection(pageIds, `${page}-${q}-${role}-${String(isActive)}`);

  async function runBulkDeactivate() {
    const ok = await performBulkAction(
      bulk.mutateAsync,
      "/api/v1/users/bulk-deactivate",
      { ids: selection.selectedIds },
      { onSuccess: () => selection.clear() },
    );
    if (ok) setBulkOpen(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Admin users"
        description="Deactivate accounts instead of deleting them. The last active super admin cannot be turned off."
        action={
          canManageUsers ? (
            <Button asChild>
              <Link to="/system/users/new">Add user</Link>
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
          setRole(String(form.get("role") ?? "") as AdminRole | "");
          setIsActive(parseOptionalBool(form.get("is_active")));
          setPage(1);
        }}
      >
        <Input name="q" placeholder="Search name or email" className="max-w-xs" defaultValue={q} />
        <NativeSelect name="role" className="w-40" defaultValue={role}>
          <option value="">All roles</option>
          <option value="SUPER_ADMIN">Super admin</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="STAFF">Staff</option>
        </NativeSelect>
        <NativeSelect name="is_active" className="w-36" defaultValue={boolSelectValue(isActive)}>
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </NativeSelect>
        <Button type="submit" variant="outline" pending={users.isFetching}>
          {users.isFetching ? "Searching" : "Search"}
        </Button>
      </form>
      {users.isLoading ? (
        <TableSkeleton columns={["#", "Name", "Email", "Role", "Status"]} />
      ) : !canReadUsers || users.isError ? (
        <EmptyState
          variant="error"
          title="Could not load admin users"
          body="You need users.read to view this list."
        />
      ) : !users.data?.data.length ? (
        <EmptyState
          title="No admin users"
          body="Create a user account with the STAFF, MANAGER, ADMIN, or SUPER_ADMIN role."
          action={canManageUsers ? { to: "/system/users/new", label: "Add user" } : undefined}
        />
      ) : (
        <div className="space-y-2">
          {canManageUsers ? (
            <BulkActionBar count={selection.selectedCount} onClear={selection.clear}>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={selection.selectedCount < 1}
                onClick={() => setBulkOpen(true)}
              >
                Deactivate
              </Button>
            </BulkActionBar>
          ) : null}
          <div className="border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  {canManageUsers ? (
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
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.data.data.map((user, index) => (
                  <TableRow key={user.id}>
                    {canManageUsers ? (
                      <TableCell>
                        <ListRowCheckbox
                          checked={selection.isSelected(user.id)}
                          onToggle={() => selection.toggle(user.id)}
                          label={`Select ${user.name}`}
                        />
                      </TableCell>
                    ) : null}
                    <TableCell>{rowNumber(page, 20, index)}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{ROLE_LABEL[user.role]}</TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? "secondary" : "outline"}>
                        {user.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canReadUsers ? (
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/system/users/${user.id}`}>
                            {canManageUsers ? "Edit" : "Open"}
                          </Link>
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
      <PaginationBar page={page} limit={20} total={users.data?.total ?? 0} onPage={setPage} />
      <ConfirmDialog
        open={bulkOpen}
        title="Deactivate selected users?"
        body="You cannot deactivate yourself or the last active super admin. Those accounts will be skipped."
        pending={bulk.isPending}
        onOpenChange={bulkDialogOnOpenChange(bulk.isPending, setBulkOpen)}
        onConfirm={() => void runBulkDeactivate()}
      />
    </div>
  );
}
