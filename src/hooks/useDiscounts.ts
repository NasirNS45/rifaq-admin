import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Discount, DiscountWrite } from "@/types/api";

type ListParams = {
  q?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
};

function searchParams(params: Record<string, string | number | boolean | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    query.set(key, String(value));
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

export function useDiscounts(params: ListParams) {
  return useQuery({
    queryKey: ["discounts", params],
    queryFn: ({ signal }) =>
      api.getPage<Discount>(`/api/v1/discounts${searchParams(params)}`, { signal }),
    placeholderData: keepPreviousData,
  });
}

export function useDiscount(id: string | undefined) {
  return useQuery({
    queryKey: ["discounts", id],
    queryFn: ({ signal }) => api.get<Discount>(`/api/v1/discounts/${id}`, { signal }),
    enabled: Boolean(id),
  });
}

export function useSaveDiscount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; body: DiscountWrite }) =>
      input.id
        ? api.patch<Discount>(`/api/v1/discounts/${input.id}`, input.body)
        : api.post<Discount>("/api/v1/discounts", input.body),
    onSuccess: () => client.invalidateQueries({ queryKey: ["discounts"] }),
  });
}

export function useDeleteDiscount() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/discounts/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: ["discounts"] }),
  });
}
