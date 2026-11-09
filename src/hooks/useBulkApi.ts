import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { BulkResult } from "@/types/api";

export async function postBulk(
  path: string,
  body: unknown,
): Promise<{ result: BulkResult; message: string }> {
  const envelope = await api.postEnvelope<BulkResult>(path, body);
  return { result: envelope.data, message: envelope.message };
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
