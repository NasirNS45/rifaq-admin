import { lazy, Suspense, useEffect, useRef } from "react";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate,
} from "react-router";
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
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    return subscribeSessionExpired(() => {
      queryClient.clear();
      if (pathnameRef.current !== "/login") {
        navigate("/login", { replace: true });
      }
    });
  }, [navigate]);

  return null;
}

function LoginGate() {
  const token = useAccessToken();
  const me = useCurrentUser();
  if (token && me.data) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function RootShell() {
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
        <Outlet />
      </Suspense>
    </>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootShell />,
    children: [
      { path: "login", element: <LoginGate /> },
      {
        element: <ProtectedRoute />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "products", element: <ProductListPage /> },
          { path: "products/new", element: <ProductFormPage /> },
          { path: "products/:id", element: <ProductFormPage /> },
          { path: "categories", element: <CategoryListPage /> },
          { path: "categories/new", element: <CategoryFormPage /> },
          { path: "categories/:id", element: <CategoryFormPage /> },
          { path: "brands", element: <BrandListPage /> },
          { path: "brands/new", element: <BrandFormPage /> },
          { path: "brands/:id", element: <BrandFormPage /> },
          { path: "collections", element: <CollectionListPage /> },
          { path: "collections/new", element: <CollectionFormPage /> },
          { path: "collections/:id", element: <CollectionFormPage /> },
          { path: "inventory", element: <StockPage /> },
          { path: "inventory/adjustments", element: <AdjustmentsPage /> },
          { path: "orders", element: <OrderListPage /> },
          {
            path: "orders/pending",
            element: <Navigate to="/orders?status=pending" replace />,
          },
          {
            path: "orders/confirmed",
            element: <Navigate to="/orders?status=confirmed" replace />,
          },
          {
            path: "orders/processing",
            element: <Navigate to="/orders?status=processing" replace />,
          },
          {
            path: "orders/delivered",
            element: <Navigate to="/orders?status=delivered" replace />,
          },
          {
            path: "orders/cancelled",
            element: <Navigate to="/orders?status=cancelled" replace />,
          },
          { path: "orders/:id", element: <OrderDetailPage /> },
          { path: "customers", element: <CustomerListPage /> },
          { path: "customers/:id", element: <CustomerDetailPage /> },
          { path: "discounts", element: <DiscountListPage /> },
          { path: "discounts/new", element: <DiscountFormPage /> },
          { path: "discounts/:id", element: <DiscountFormPage /> },
          { path: "system/users", element: <UserListPage /> },
          { path: "system/users/new", element: <UserFormPage /> },
          { path: "system/users/:id", element: <UserFormPage /> },
          { path: "system/audit", element: <AuditPage /> },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
