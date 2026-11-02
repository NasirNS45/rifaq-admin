import type { Envelope } from "@/types/api";

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "http://localhost:8000" : "");
if (!API_URL) {
  throw new Error("VITE_API_URL must be set when building the admin for production.");
}
const TOKEN_KEY = "rifaq_access_token";

let accessToken: string | null = sessionStorage.getItem(TOKEN_KEY);
let refreshPromise: Promise<boolean> | null = null;
let sessionExpiredEmitted = false;

const tokenListeners = new Set<() => void>();
const sessionExpiredListeners = new Set<() => void>();

export function getAccessToken() {
  return accessToken;
}

export function subscribeAccessToken(listener: () => void): () => void {
  tokenListeners.add(listener);
  return () => {
    tokenListeners.delete(listener);
  };
}

export function subscribeSessionExpired(listener: () => void): () => void {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionExpiredEmitted = false;
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
  tokenListeners.forEach((listener) => listener());
}

function emitSessionExpired(): void {
  if (sessionExpiredEmitted) return;
  sessionExpiredEmitted = true;
  setAccessToken(null);
  sessionExpiredListeners.forEach((listener) => listener());
}

export class ApiError extends Error {
  status: number;
  body: Envelope<null> | null;

  constructor(message: string, status: number, body: Envelope<null> | null = null) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  message: string;
  status: number;
};

async function refreshAccess(): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!response.ok) {
    return false;
  }
  const payload = (await response.json()) as Envelope<{ access_token: string }>;
  setAccessToken(payload.data.access_token);
  return true;
}

async function requestPayload<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<Envelope<T>> {
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!headers.has("Content-Type") && init.body && !isFormData) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry && path !== "/api/v1/auth/login") {
    refreshPromise ??= refreshAccess().finally(() => {
      refreshPromise = null;
    });
    const ok = await refreshPromise;
    if (ok) return requestPayload<T>(path, init, false);
    emitSessionExpired();
  }

  if (response.status === 204) {
    return { data: undefined as T, message: "OK", status: 204 };
  }

  const payload = (await response.json()) as Envelope<T>;
  if (!response.ok) {
    throw new ApiError(payload.message || "Request failed.", response.status, payload as Envelope<null>);
  }
  return payload;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const payload = await requestPayload<T>(path, init);
  return payload.data;
}

function jsonInit(method: string, body?: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  getPage: async <T>(path: string): Promise<Paginated<T>> => {
    const payload = await requestPayload<T[]>(path);
    const page = payload as Envelope<T[]> & Partial<Paginated<T>>;
    return {
      data: page.data,
      total: page.total ?? page.data.length,
      page: page.page ?? 1,
      limit: page.limit ?? page.data.length,
      message: page.message,
      status: page.status,
    };
  },
  post: <T>(path: string, body?: unknown) => request<T>(path, jsonInit("POST", body)),
  put: <T>(path: string, body?: unknown) => request<T>(path, jsonInit("PUT", body)),
  patch: <T>(path: string, body?: unknown) => request<T>(path, jsonInit("PATCH", body)),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: <T>(path: string, body: FormData) => request<T>(path, { method: "POST", body }),
};

export function mediaPreviewUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = API_URL.replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
