import { toast } from "sonner";
import type { BulkResult } from "@/types/api";

export function toastBulkResult(message: string, result: BulkResult) {
  if (result.failed.length === 0) {
    toast.success(message);
    return;
  }
  const preview = result.failed
    .slice(0, 3)
    .map((row) => row.reason)
    .join(" ");
  const more =
    result.failed.length > 3 ? ` (+${result.failed.length - 3} more skipped)` : "";
  if (result.succeeded.length === 0) {
    toast.error("No items updated.", { description: `${preview}${more}` });
    return;
  }
  toast.message(message, { description: `${preview}${more}` });
}
