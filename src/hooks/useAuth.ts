import { useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getAccessToken, setAccessToken, subscribeAccessToken } from "@/lib/api";
import type { AdminUser, DashboardResponse, TokenResponse } from "@/types/api";

export function useAccessToken() {
  return useSyncExternalStore(subscribeAccessToken, getAccessToken, getAccessToken);
}

export function useCurrentUser() {
  const token = useAccessToken();
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: ({ signal }) => api.get<AdminUser>("/api/v1/auth/me", { signal }),
    enabled: Boolean(token),
    staleTime: 60_000,
  });
}

export function useLogin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.post<TokenResponse>("/api/v1/auth/login", body),
    onSuccess: (data) => {
      setAccessToken(data.access_token);
      client.setQueryData(["auth", "me"], data.user);
    },
  });
}

export function useLogout() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<{ logged_out: boolean }>("/api/v1/auth/logout"),
    onSettled: () => {
      setAccessToken(null);
      client.clear();
    },
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: ({ signal }) => api.get<DashboardResponse>("/api/v1/dashboard", { signal }),
    staleTime: 60_000,
  });
}
