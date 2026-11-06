import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Adjustment,
  AdjustmentType,
  Availability,
  Brand,
  BrandWrite,
  Category,
  CategoryWrite,
  Collection,
  CollectionWrite,
  Product,
  ProductListItem,
  ProductStatus,
  StockRow,
} from "@/types/api";

type ListParams = {
  q?: string;
  page?: number;
  limit?: number;
  is_active?: boolean;
};

function searchParams(
  params: Record<string, string | number | boolean | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    query.set(key, String(value));
  }
  const encoded = query.toString();
  return encoded ? `?${encoded}` : "";
}

const STATIC_LIST_STALE_MS = 5 * 60_000;

export function useBrands(params: ListParams) {
  return useQuery({
    queryKey: ["brands", params],
    queryFn: () => api.getPage<Brand>(`/api/v1/brands${searchParams(params)}`),
    placeholderData: keepPreviousData,
    staleTime: STATIC_LIST_STALE_MS,
  });
}

export function useBrand(id: string | undefined) {
  return useQuery({
    queryKey: ["brands", id],
    queryFn: () => api.get<Brand>(`/api/v1/brands/${id}`),
    enabled: Boolean(id),
  });
}

export function useSaveBrand() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; body: BrandWrite }) =>
      input.id
        ? api.put<Brand>(`/api/v1/brands/${input.id}`, input.body)
        : api.post<Brand>("/api/v1/brands", input.body),
    onSuccess: () => client.invalidateQueries({ queryKey: ["brands"] }),
  });
}

export function useDeleteBrand() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/brands/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: ["brands"] }),
  });
}

export function useCategories(params: ListParams) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: () =>
      api.getPage<Category>(`/api/v1/categories${searchParams(params)}`),
    placeholderData: keepPreviousData,
    staleTime: STATIC_LIST_STALE_MS,
  });
}

export function useCategory(id: string | undefined) {
  return useQuery({
    queryKey: ["categories", id],
    queryFn: () => api.get<Category>(`/api/v1/categories/${id}`),
    enabled: Boolean(id),
  });
}

export function useSaveCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; body: CategoryWrite }) =>
      input.id
        ? api.put<Category>(`/api/v1/categories/${input.id}`, input.body)
        : api.post<Category>("/api/v1/categories", input.body),
    onSuccess: () => client.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/categories/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useCollections(params: ListParams) {
  return useQuery({
    queryKey: ["collections", params],
    queryFn: () =>
      api.getPage<Collection>(`/api/v1/collections${searchParams(params)}`),
    placeholderData: keepPreviousData,
    staleTime: STATIC_LIST_STALE_MS,
  });
}

export function useCollection(id: string | undefined) {
  return useQuery({
    queryKey: ["collections", id],
    queryFn: () => api.get<Collection>(`/api/v1/collections/${id}`),
    enabled: Boolean(id),
  });
}

export function useSaveCollection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; body: CollectionWrite }) =>
      input.id
        ? api.put<Collection>(`/api/v1/collections/${input.id}`, input.body)
        : api.post<Collection>("/api/v1/collections", input.body),
    onSuccess: () => client.invalidateQueries({ queryKey: ["collections"] }),
  });
}

export function useDeleteCollection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/collections/${id}`),
    onSuccess: () => client.invalidateQueries({ queryKey: ["collections"] }),
  });
}

export type ProductListParams = ListParams & {
  status?: ProductStatus;
  availability?: Availability;
  brand_id?: string;
  category_id?: string;
};

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () =>
      api.getPage<ProductListItem>(`/api/v1/products${searchParams(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => api.get<Product>(`/api/v1/products/${id}`),
    enabled: Boolean(id),
  });
}

export type ProductWrite = {
  name: string;
  slug?: string | null;
  sku: string;
  brand_id: string;
  category_id: string;
  description: string;
  short_description?: string | null;
  price: string;
  original_price?: string | null;
  cost_price?: string | null;
  stock_quantity?: number;
  low_stock_threshold: number;
  status: ProductStatus;
  is_indexable: boolean;
  fabric?: string | null;
  care_instructions?: string | null;
  authenticity_note?: string | null;
  pieces?: string | null;
  edit_note?: string | null;
  video_url?: string | null;
  keep_pre_order: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_sale: boolean;
  is_just_in: boolean;
  sort_order: number;
  seo_title?: string | null;
  seo_description?: string | null;
  images: { image_url: string; alt_text?: string | null }[];
  sizes: string[];
  colors: string[];
  collection_ids: string[];
};

export function useSaveProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; body: ProductWrite }) => {
      if (input.id) {
        const updateBody = { ...input.body };
        delete updateBody.stock_quantity;
        return api.put<Product>(`/api/v1/products/${input.id}`, updateBody);
      }
      return api.post<Product>("/api/v1/products", input.body);
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["products"] });
      void client.invalidateQueries({ queryKey: ["inventory"] });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/products/${id}`),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["products"] });
      void client.invalidateQueries({ queryKey: ["inventory"] });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useStock(params: ListParams & { availability?: Availability }) {
  return useQuery({
    queryKey: ["inventory", "stock", params],
    queryFn: () =>
      api.getPage<StockRow>(`/api/v1/inventory/stock${searchParams(params)}`),
    placeholderData: keepPreviousData,
  });
}

export function useAdjustments(
  params: ListParams & {
    product_id?: string;
    adjustment_type?: AdjustmentType;
  },
) {
  return useQuery({
    queryKey: ["inventory", "adjustments", params],
    queryFn: () =>
      api.getPage<Adjustment>(
        `/api/v1/inventory/adjustments${searchParams(params)}`,
      ),
    placeholderData: keepPreviousData,
  });
}

export function useCreateAdjustment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      product_id: string;
      adjustment_type: AdjustmentType;
      quantity: number;
      reason?: string | null;
      note?: string | null;
    }) => api.post<Adjustment>("/api/v1/inventory/adjustments", body),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["inventory"] });
      void client.invalidateQueries({ queryKey: ["products"] });
      void client.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
