import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DebouncedSearchInput, ListFiltersChrome } from "@/components/ListFilters";
import { StackedOnMobile } from "@/components/StackedOnMobile";
import { TableSkeleton } from "@/components/loading";
import { EmptyState, PageHeader, PaginationBar, rowNumber } from "@/components/PageHeader";
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
import { usePermissions } from "@/hooks/usePermissions";
import { useListFilters } from "@/hooks/useListFilters";
import { useAdminUsers, useAuditLogs } from "@/hooks/useUsers";
import { api } from "@/lib/api";
import { downloadCsv, fetchAllPages } from "@/lib/csvExport";
import type { AuditLog } from "@/types/api";

const LIMIT = 20;

export function AuditPage() {
  const { canReadUsers } = usePermissions();
  const [exporting, setExporting] = useState(false);
  const defaults = useMemo(
    () => ({
      q: "",
      action: "",
      entity_type: "",
      admin_user_id: "",
    }),
    [],
  );
  const { values, set, clear, page, setPage } = useListFilters(defaults);
  const users = useAdminUsers({ page: 1, limit: 100 });
  const logs = useAuditLogs({
    q: values.q || undefined,
    action: values.action || undefined,
    entity_type: values.entity_type || undefined,
    admin_user_id: values.admin_user_id || undefined,
    page,
    limit: LIMIT,
  });

  const hasFilters = Boolean(
    values.q || values.action || values.entity_type || values.admin_user_id,
  );

  async function exportCsv() {
    setExporting(true);
    try {
      const params = {
        q: values.q || undefined,
        action: values.action || undefined,
        entity_type: values.entity_type || undefined,
        admin_user_id: values.admin_user_id || undefined,
      };
      const rows = await fetchAllPages<AuditLog>(async (page) => {
        const query = new URLSearchParams({ page: String(page), limit: "100" });
        if (params.q) query.set("q", params.q);
        if (params.action) query.set("action", params.action);
        if (params.entity_type) query.set("entity_type", params.entity_type);
        if (params.admin_user_id) query.set("admin_user_id", params.admin_user_id);
        return api.getPage<AuditLog>(`/api/v1/audit-logs?${query.toString()}`);
      });
      downloadCsv(
        "audit-log.csv",
        ["When", "Who", "Action", "Entity type", "Entity id"],
        rows.map((row) => [
          new Date(row.created_at).toISOString(),
          row.actor_email ?? row.actor_name ?? "",
          row.action,
          row.entity_type,
          row.entity_id ?? "",
        ]),
      );
      toast.success(`Exported ${rows.length} rows.`);
    } catch {
      toast.error("Export failed.");
    } finally {
      setExporting(false);
    }
  }

  const filterFields = (
    <>
      <Input
        aria-label="Action"
        placeholder="Action"
        className="w-full min-w-0 sm:max-w-xs"
        value={values.action}
        onChange={(event) => set({ action: event.target.value })}
      />
      <Input
        aria-label="Entity type"
        placeholder="Entity type"
        className="w-full min-w-0 sm:max-w-xs"
        value={values.entity_type}
        onChange={(event) => set({ entity_type: event.target.value })}
      />
      <NativeSelect
        aria-label="Admin user"
        className="w-full min-w-0"
        value={values.admin_user_id}
        onChange={(event) => set({ admin_user_id: event.target.value })}
      >
        <option value="">All users</option>
        {(users.data?.data ?? []).map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </NativeSelect>
    </>
  );

  const tableView =
    canReadUsers && !logs.isLoading && !logs.isError && logs.data?.data.length ? (
      <div className="border border-border bg-card">
        <Table>
          <caption className="sr-only">Activity log</caption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>When</TableHead>
              <TableHead>Who</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.data.data.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell>{rowNumber(page, LIMIT, index)}</TableCell>
                <TableCell>{new Date(row.created_at).toLocaleString("en-PK")}</TableCell>
                <TableCell>{row.actor_name ?? row.actor_email ?? "System"}</TableCell>
                <TableCell>{row.action}</TableCell>
                <TableCell>
                  {row.entity_type}
                  {row.entity_id ? ` ${row.entity_id}` : ""}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    ) : null;

  const stackView =
    canReadUsers && !logs.isLoading && !logs.isError && logs.data?.data.length ? (
      <>
        {logs.data.data.map((row, index) => (
          <div key={row.id} className="space-y-1 border border-border bg-card p-4 text-sm">
            <p className="font-medium">{row.action}</p>
            <p className="text-muted-foreground">{new Date(row.created_at).toLocaleString("en-PK")}</p>
            <p>{row.actor_name ?? row.actor_email ?? "System"}</p>
            <p>
              {row.entity_type}
              {row.entity_id ? ` ${row.entity_id}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">#{rowNumber(page, LIMIT, index)}</p>
          </div>
        ))}
      </>
    ) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Activity"
        description="Writes to products, inventory, orders, discounts, and admin users. Passwords are never stored here."
        action={
          canReadUsers ? (
            <Button type="button" variant="outline" pending={exporting} onClick={() => void exportCsv()}>
              Export CSV
            </Button>
          ) : null
        }
      />
      <ListFiltersChrome
        pending={logs.isFetching}
        clearDisabled={!hasFilters}
        onClear={() => clear()}
        primaryRow={
          <DebouncedSearchInput
            value={values.q}
            onDebouncedChange={(next) => set({ q: next })}
            placeholder="Search action or entity"
          />
        }
      >
        {filterFields}
      </ListFiltersChrome>
      {logs.isLoading ? (
        <TableSkeleton columns={["#", "When", "Who", "Action", "Entity"]} />
      ) : !canReadUsers || logs.isError ? (
        <EmptyState
          variant="error"
          title="Could not load activity"
          body="You need users.read to view the audit log."
        />
      ) : !logs.data?.data.length ? (
        <EmptyState title="No activity yet" body="Admin writes will appear here. Empty metadata is normal for simple changes." />
      ) : (
        <StackedOnMobile table={tableView} stack={stackView} />
      )}
      <PaginationBar page={page} limit={LIMIT} total={logs.data?.total ?? 0} onPage={setPage} />
    </div>
  );
}
