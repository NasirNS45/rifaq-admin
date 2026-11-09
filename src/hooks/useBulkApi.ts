import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { ApiError, api } from "@/lib/api";
import { toastBulkResult } from "@/lib/bulkToast";
import type { BulkResult } from "@/types/api";
import { toast } from "sonner";

export async function postBulk(
  path: string,
  body: unknown,
): Promise<{ result: BulkResult; message: string }> {
  const envelope = await api.postEnvelope<BulkResult>(path, body);
  return { result: envelope.data, message: envelope.message };
}

type BulkMutate = (vars: {
  path: string;
  body: unknown;
}) => Promise<{ result: BulkResult; message: string }>;

export async function performBulkAction(
  mutateAsync: BulkMutate,
  path: string,
  body: unknown,
  options?: { onSuccess?: () => void },
): Promise<boolean> {
  try {
    const { result, message } = await mutateAsync({ path, body });
    toastBulkResult(message, result);
    options?.onSuccess?.();
    return true;
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Bulk action failed.";
    toast.error(message);
    return false;
  }
}

export function bulkDialogOnOpenChange(
  pending: boolean,
  setOpen: (open: boolean) => void,
): (open: boolean) => void {
  return (open: boolean) => {
    if (!open && pending) return;
    setOpen(open);
  };
}

export function useBulkMutation(invalidateKeys: QueryKey[]) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ path, body }: { path: string; body: unknown }) => postBulk(path, body),
    onSuccess: () => {
      for (const key of invalidateKeys) {
        void client.invalidateQueries({ queryKey: key });
      }
    },
  });
}
