import { toast } from "sonner";
import type { BulkResult } from "@/types/api";

function failureSummary(result: BulkResult): string | undefined {
  if (result.failed.length === 0) return undefined;
  const preview = result.failed
    .slice(0, 5)
    .map((row) => row.reason)
    .join(" · ");
  const more = result.failed.length > 5 ? ` (+${result.failed.length - 5} more)` : "";
  return `${preview}${more}`;
}

export function toastBulkResult(message: string, result: BulkResult) {
  const description = failureSummary(result);
  if (result.failed.length === 0) {
    toast.success(message);
    return;
  }
  if (result.succeeded.length === 0) {
    toast.error(message, description ? { description } : undefined);
    return;
  }
  toast.success(message, description ? { description } : undefined);
}
