import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { RouteAnnouncer, RouteFocusMain } from "@/components/RouteAnnouncer";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAccessToken, useCurrentUser } from "@/hooks/useAuth";
import { queryClient } from "@/lib/queryClient";
import { subscribeSessionExpired } from "@/lib/api";

const LoginPage = lazy(() =>
  import("@/features/auth/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const BrandFormPage = lazy(() =>
  import("@/features/catalog/BrandFormPage").then((module) => ({ default: module.BrandFormPage })),
);
const BrandListPage = lazy(() =>
  import("@/features/catalog/BrandListPage").then((module) => ({ default: module.BrandListPage })),
);
const CategoryFormPage = lazy(() =>
  import("@/features/catalog/CategoryFormPage").then((module) => ({
    default: module.CategoryFormPage,
  })),
);
const CategoryListPage = lazy(() =>
  import("@/features/catalog/CategoryListPage").then((module) => ({
    default: module.CategoryListPage,
  })),
);
const CollectionFormPage = lazy(() =>
  import("@/features/catalog/CollectionFormPage").then((module) => ({
    default: module.CollectionFormPage,
  })),
);
const CollectionListPage = lazy(() =>
  import("@/features/catalog/CollectionListPage").then((module) => ({
    default: module.CollectionListPage,
  })),
);
const ProductFormPage = lazy(() =>
  import("@/features/catalog/ProductFormPage").then((module) => ({
    default: module.ProductFormPage,
  })),
);
const ProductListPage = lazy(() =>
  import("@/features/catalog/ProductListPage").then((module) => ({
    default: module.ProductListPage,
  })),
);
const CustomerDetailPage = lazy(() =>
  import("@/features/customers/CustomerDetailPage").then((module) => ({
    default: module.CustomerDetailPage,
  })),
);
const CustomerListPage = lazy(() =>
  import("@/features/customers/CustomerListPage").then((module) => ({
    default: module.CustomerListPage,
  })),
);
const DashboardPage = lazy(() =>
  import("@/features/dashboard/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const DiscountFormPage = lazy(() =>
  import("@/features/discounts/DiscountFormPage").then((module) => ({
    default: module.DiscountFormPage,
  })),
);
const DiscountListPage = lazy(() =>
  import("@/features/discounts/DiscountListPage").then((module) => ({
    default: module.DiscountListPage,
  })),
);
const AdjustmentsPage = lazy(() =>
  import("@/features/inventory/AdjustmentsPage").then((module) => ({
    default: module.AdjustmentsPage,
  })),
);
const StockPage = lazy(() =>
  import("@/features/inventory/StockPage").then((module) => ({ default: module.StockPage })),
);
const OrderDetailPage = lazy(() =>
  import("@/features/orders/OrderDetailPage").then((module) => ({
    default: module.OrderDetailPage,
  })),
);
const OrderListPage = lazy(() =>
  import("@/features/orders/OrderListPage").then((module) => ({ default: module.OrderListPage })),
);
const AuditPage = lazy(() =>
  import("@/features/system/AuditPage").then((module) => ({ default: module.AuditPage })),
);
const UserFormPage = lazy(() =>
  import("@/features/system/UserFormPage").then((module) => ({ default: module.UserFormPage })),
);
const UserListPage = lazy(() =>
  import("@/features/system/UserListPage").then((module) => ({ default: module.UserListPage })),
);

function SessionExpiredBridge() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return subscribeSessionExpired(() => {
      queryClient.clear();
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    });
  }, [navigate, location.pathname]);

  return null;
}

function LoginGate() {
  const token = useAccessToken();
  const me = useCurrentUser();
  if (token && me.data) return <Navigate to="/" replace />;
  return <LoginPage />;
}

export function App() {
  return (
    <>
      <RouteAnnouncer />
      <RouteFocusMain />
      <SessionExpiredBridge />
      <Suspense
        fallback={
          <div className="flex min-h-dvh items-center justify-center" role="status">
            Loading page...
          </div>
        }
      >
        <Routes>
          <Route path="/login" element={<LoginGate />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/new" element={<ProductFormPage />} />
            <Route path="/products/:id" element={<ProductFormPage />} />
            <Route path="/categories" element={<CategoryListPage />} />
            <Route path="/categories/new" element={<CategoryFormPage />} />
            <Route path="/categories/:id" element={<CategoryFormPage />} />
            <Route path="/brands" element={<BrandListPage />} />
            <Route path="/brands/new" element={<BrandFormPage />} />
            <Route path="/brands/:id" element={<BrandFormPage />} />
            <Route path="/collections" element={<CollectionListPage />} />
            <Route path="/collections/new" element={<CollectionFormPage />} />
            <Route path="/collections/:id" element={<CollectionFormPage />} />
            <Route path="/inventory" element={<StockPage />} />
            <Route path="/inventory/adjustments" element={<AdjustmentsPage />} />
            <Route path="/orders" element={<OrderListPage />} />
            <Route path="/orders/pending" element={<Navigate to="/orders?status=pending" replace />} />
            <Route path="/orders/confirmed" element={<Navigate to="/orders?status=confirmed" replace />} />
            <Route path="/orders/processing" element={<Navigate to="/orders?status=processing" replace />} />
            <Route path="/orders/delivered" element={<Navigate to="/orders?status=delivered" replace />} />
            <Route path="/orders/cancelled" element={<Navigate to="/orders?status=cancelled" replace />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/customers" element={<CustomerListPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/discounts" element={<DiscountListPage />} />
            <Route path="/discounts/new" element={<DiscountFormPage />} />
            <Route path="/discounts/:id" element={<DiscountFormPage />} />
            <Route path="/system/users" element={<UserListPage />} />
            <Route path="/system/users/new" element={<UserFormPage />} />
            <Route path="/system/users/:id" element={<UserFormPage />} />
            <Route path="/system/audit" element={<AuditPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
