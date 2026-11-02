export type MediaFolder = "catalog";

export type MediaAsset = {
  id: string;
  url: string;
  provider: string;
  provider_key: string | null;
  mime_type: string | null;
  alt_text: string | null;
};

export type Envelope<T> = {
  data: T;
  message: string;
  status: number;
  errors?: { loc?: string; message: string }[] | null;
};

export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  permissions: string[];
};

export type AdminAccount = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export type Discount = {
  id: string;
  name: string;
  discount_type: DiscountType;
  value: string;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  description: string | null;
  product_ids: string[];
  collection_ids: string[];
  created_at: string;
  updated_at: string;
};

export type DiscountWrite = {
  name: string;
  discount_type: DiscountType;
  value: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
  description?: string | null;
  product_ids: string[];
  collection_ids: string[];
};

export type AdminAccountWrite = {
  name: string;
  email: string;
  password?: string;
  role: AdminRole;
  is_active: boolean;
};

export type AuditLog = {
  id: string;
  admin_user_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  extra_metadata: Record<string, unknown> | null;
  created_at: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AdminUser;
};

export type DashboardStats = {
  total_orders: number;
  orders_today: number;
  orders_this_week: number;
  orders_this_month: number;
  revenue: string;
  pending_orders: number;
  confirmed_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_customers: number;
};

export type TimeSeriesPoint = { date: string; value: number | string };
export type OrderStatusCount = { status: string; count: number };
export type TopProductPoint = {
  product_id: string;
  name: string;
  sku: string;
  quantity_sold: number;
  revenue: string;
};
export type RecentOrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  total: string;
  status: string;
  payment_status: string;
  created_at: string;
};
export type LowStockRow = {
  id: string;
  name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
  status: string;
};

export type NamedRef = {
  id: string;
  name: string;
  slug: string;
};

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type Availability =
  "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "PRE_ORDER";
export type AdjustmentType =
  "RESTOCK" | "SALE" | "RETURN" | "DAMAGE" | "MANUAL_ADJUSTMENT";
export type OrderStatus =
  | "PENDING"
  | "WHATSAPP_CONFIRMATION"
  | "CONFIRMED"
  | "PROCESSING"
  | "READY_FOR_DELIVERY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED";
export type PaymentMethod = "CARD" | "JAZZCASH" | "EASYPAISA";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type Fulfillment = "delivery" | "pickup";

export type OrderListItem = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  fulfillment: Fulfillment | string;
  city: string | null;
  created_at: string;
};

export type OrderItemAdmin = {
  id: string;
  product_id: string | null;
  product_name_snapshot: string;
  sku_snapshot: string;
  price: string;
  quantity: number;
  total: string;
  size_snapshot: string | null;
};

export type OrderNote = {
  id: string;
  note: string;
  is_internal: boolean;
  admin_user_id: string | null;
  created_at: string;
};

export type OrderAdmin = {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  fulfillment: Fulfillment | string;
  subtotal: string;
  shipping_fee: string;
  discount: string;
  total: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  delivery_address: string | null;
  area: string | null;
  city: string | null;
  postal_code: string | null;
  notes: string | null;
  payment_reference: string | null;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItemAdmin[];
  internal_notes: OrderNote[];
};

export type CustomerAddress = {
  id: string;
  label: string | null;
  address: string;
  area: string | null;
  city: string;
  postal_code: string | null;
  is_default: boolean;
};

export type CustomerListItem = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  total_orders: number;
  total_spent: string;
  last_order_at: string | null;
  created_at: string;
};

export type CustomerAdmin = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  total_orders: number;
  total_spent: string;
  last_order_at: string | null;
  created_at: string;
  updated_at: string;
  addresses: CustomerAddress[];
  orders: OrderListItem[];
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  website_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parent_id: string | null;
  is_active: boolean;
  is_indexable: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  banner_image: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
};

export type ProductListItem = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: NamedRef;
  category: NamedRef;
  price: string;
  original_price: string | null;
  cost_price: string | null;
  stock_quantity: number;
  available_stock: number;
  status: ProductStatus;
  availability: Availability;
  fabric: string | null;
  thumbnail: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: NamedRef;
  category: NamedRef;
  description: string;
  short_description: string | null;
  price: string;
  original_price: string | null;
  cost_price: string | null;
  discount_percentage: number | null;
  stock_quantity: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  status: ProductStatus;
  is_indexable: boolean;
  fabric: string | null;
  care_instructions: string | null;
  authenticity_note: string | null;
  pieces: string | null;
  edit_note: string | null;
  video_url: string | null;
  availability: Availability;
  keep_pre_order: boolean;
  is_featured: boolean;
  is_new: boolean;
  is_sale: boolean;
  is_just_in: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  images: ProductImage[];
  sizes: string[];
  colors: string[];
  collections: NamedRef[];
  created_at: string;
  updated_at: string;
};

export type StockRow = {
  id: string;
  name: string;
  sku: string;
  brand: NamedRef;
  stock_quantity: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  availability: Availability;
  status: ProductStatus;
};

export type Adjustment = {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  adjustment_type: AdjustmentType;
  quantity: number;
  reason: string | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type BrandWrite = {
  name: string;
  slug?: string | null;
  description?: string | null;
  logo?: string | null;
  website_url?: string | null;
  is_active: boolean;
  sort_order: number;
};

export type CategoryWrite = {
  name: string;
  slug?: string | null;
  description?: string | null;
  image?: string | null;
  parent_id?: string | null;
  is_active: boolean;
  is_indexable: boolean;
  sort_order: number;
  seo_title?: string | null;
  seo_description?: string | null;
};

export type CollectionWrite = {
  name: string;
  slug?: string | null;
  description?: string | null;
  image?: string | null;
  banner_image?: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  seo_title?: string | null;
  seo_description?: string | null;
};

export type DashboardResponse = {
  stats: DashboardStats;
  orders_over_time: TimeSeriesPoint[];
  revenue_over_time: TimeSeriesPoint[];
  top_products: TopProductPoint[];
  orders_by_status: OrderStatusCount[];
  recent_orders: RecentOrderRow[];
  low_stock_products: LowStockRow[];
};
