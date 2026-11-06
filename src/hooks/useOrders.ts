import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CustomerAdmin, CustomerListItem, OrderAdmin, OrderListItem, OrderNote } from "@/types/api";

function searchParams(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    query.set(key, String(value));
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

export function useOrders(params: { q?: string; status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => api.getPage<OrderListItem>(`/api/v1/orders${searchParams(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => api.get<OrderAdmin>(`/api/v1/orders/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateOrderStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; status: string }) =>
      api.patch<OrderAdmin>(`/api/v1/orders/${input.id}`, { status: input.status }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["orders"] });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useAddOrderNote() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; note: string }) =>
      api.post<OrderNote>(`/api/v1/orders/${input.id}/notes`, { note: input.note, is_internal: true }),
    onSuccess: (_data, input) => {
      void client.invalidateQueries({ queryKey: ["orders", input.id] });
    },
  });
}

export function useCustomers(params: { q?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["customers", params],
    queryFn: () => api.getPage<CustomerListItem>(`/api/v1/customers${searchParams(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery({
    queryKey: ["customers", id],
    queryFn: () => api.get<CustomerAdmin>(`/api/v1/customers/${id}`),
    enabled: Boolean(id),
  });
}

export function useUpdateCustomer() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; name: string; email: string }) =>
      api.patch<CustomerAdmin>(`/api/v1/customers/${input.id}`, {
        name: input.name,
        email: input.email || null,
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
