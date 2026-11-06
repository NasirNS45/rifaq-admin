import { NavLink, useLocation, useNavigate } from "react-router";
import {
  Bell,
  Box,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  Shirt,
  ShoppingBag,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BrandMark, BrandWordmark } from "@/components/BrandMark";
import { FrameSpinner } from "@/components/loading";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { preloadDashboardCharts } from "@/features/dashboard/preloadDashboardCharts";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

const NAV: (NavItem | NavGroup)[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Catalog",
    items: [
      { to: "/products", label: "Products", icon: Shirt },
      { to: "/categories", label: "Categories", icon: Tag },
      { to: "/brands", label: "Brands", icon: Box },
      { to: "/collections", label: "Collections", icon: Package },
    ],
  },
  {
    label: "Inventory",
    items: [
      { to: "/inventory", label: "Stock", icon: Package },
      { to: "/inventory/adjustments", label: "Adjustments", icon: Truck },
    ],
  },
  { to: "/orders", label: "Orders", icon: ShoppingBag },
  { to: "/customers", label: "Customers", icon: Users },
  {
    label: "Marketing",
    items: [{ to: "/discounts", label: "Discounts", icon: Tag }],
  },
  {
    label: "System",
    items: [
      { to: "/system/users", label: "Admin Users", icon: Users },
      { to: "/system/audit", label: "Activity / Audit", icon: LayoutDashboard },
    ],
  },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

const NAV_ITEM_ABBR: Record<string, string> = {
  "/products": "Pr",
  "/categories": "Ca",
  "/brands": "Br",
  "/collections": "Co",
  "/inventory": "St",
  "/inventory/adjustments": "Ad",
};

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <nav aria-label="Primary" className="space-y-5 pb-4">
      {NAV.map((entry) => {
        if (!isGroup(entry)) {
          const Icon = entry.icon;
          return (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.to === "/"}
              onMouseEnter={entry.to === "/" ? preloadDashboardCharts : undefined}
              onFocus={entry.to === "/" ? preloadDashboardCharts : undefined}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 text-[13px] transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {!collapsed ? entry.label : null}
              {collapsed ? (
                <span className="sr-only">{entry.label}</span>
              ) : null}
            </NavLink>
          );
        }
        return (
          <div key={entry.label}>
            {!collapsed ? (
              <p className="label-xs px-3 pb-2 font-semibold text-accent-text">{entry.label}</p>
            ) : null}
            <div className="space-y-0.5">
              {entry.items.map((item) => {
                const exact = location.pathname === item.to;
                const nested = location.pathname.startsWith(`${item.to}/`);
                const siblingActive = entry.items.some(
                  (other) =>
                    other.to !== item.to &&
                    (location.pathname === other.to || location.pathname.startsWith(`${other.to}/`)),
                );
                const active = exact || (nested && !siblingActive);
                const Icon = item.icon;
                const abbr = NAV_ITEM_ABBR[item.to] ?? item.label.slice(0, 2);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-start gap-2 px-3 py-1.5 text-[13px] transition-colors hover:bg-muted",
                      active && "bg-muted font-medium text-foreground",
                      collapsed && "justify-center px-2",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {!collapsed ? item.label : <span className="text-2xs font-medium">{abbr}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const initials = (user?.name ?? "H")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const userMenuLabel = useMemo(() => `${user?.name ?? "Account"} menu`, [user?.name]);

  return (
    <>
      <div className="flex h-dvh overflow-hidden bg-muted">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:text-primary-foreground"
        >
          Skip to content
        </a>
        <aside
          className={cn(
            "hidden h-full min-h-0 border-r border-border bg-card lg:flex lg:flex-col",
            collapsed ? "w-[72px]" : "w-60",
          )}
        >
          <div
            className={cn(
              "flex shrink-0 items-center border-b border-border",
              collapsed ? "flex-col gap-1 px-2 py-2" : "h-14 gap-2 px-3",
            )}
          >
            {collapsed ? (
              <BrandMark className="h-9 w-9 shrink-0" />
            ) : (
              <BrandWordmark className="h-9 w-auto" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(!collapsed && "ml-auto")}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((value) => !value)}
            >
              <ChevronLeft className={cn("h-4 w-4", collapsed && "rotate-180")} />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1 pt-4">
            <SidebarNav collapsed={collapsed} />
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col overflow-hidden">
                <SheetHeader className="text-left">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <SheetDescription className="sr-only">Browse admin sections</SheetDescription>
                </SheetHeader>
                <div className="mb-6 flex shrink-0 items-center gap-2">
                  <BrandWordmark className="h-9 w-auto" />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
                  <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <div className="relative max-w-sm flex-1" title="Search is not available yet">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                placeholder="Search (coming soon)"
                className="h-9 border-border bg-muted pl-9"
                disabled
                aria-hidden
                tabIndex={-1}
              />
            </div>
            <Button variant="ghost" size="icon" className="ml-auto" disabled aria-label="Notifications unavailable" title="Coming soon">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={userMenuLabel}
                  className="flex cursor-pointer items-center gap-2 rounded-none transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary text-2xs text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                  <span className="hidden text-left text-sm sm:block">
                    <span className="block leading-tight text-foreground">{user?.name}</span>
                    <span className="label-xs mt-0.5 block text-muted-foreground">{user?.role}</span>
                  </span>
                  <span className="sr-only sm:hidden">{user?.name}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={logout.isPending}
                  onClick={() => {
                    logout.mutate(undefined, {
                      onSuccess: () => toast.success("Signed out."),
                      onError: (error) => {
                        const message = error instanceof ApiError ? error.message : "Could not sign out.";
                        toast.error(message);
                      },
                      onSettled: () => navigate("/login", { replace: true }),
                    });
                  }}
                >
                  {logout.isPending ? <FrameSpinner /> : <LogOut className="h-4 w-4" />}
                  {logout.isPending ? "Signing out" : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main id="main" tabIndex={-1} className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
