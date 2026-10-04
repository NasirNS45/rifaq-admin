import { NavLink, useLocation, useNavigate } from "react-router";
import {
  Bell,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
} from "lucide-react";
import { useState, type ReactNode } from "react";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCurrentUser, useLogout } from "@/hooks/useAuth";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV: (NavItem | NavGroup)[] = [
  { to: "/", label: "Dashboard" },
  {
    label: "Catalog",
    items: [
      { to: "/products", label: "Products" },
      { to: "/categories", label: "Categories" },
      { to: "/brands", label: "Brands" },
      { to: "/collections", label: "Collections" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { to: "/inventory", label: "Stock" },
      { to: "/inventory/adjustments", label: "Adjustments" },
    ],
  },
  { to: "/orders", label: "Orders" },
  { to: "/customers", label: "Customers" },
  {
    label: "Marketing",
    items: [{ to: "/discounts", label: "Discounts" }],
  },
  {
    label: "System",
    items: [
      { to: "/system/users", label: "Admin Users" },
      { to: "/system/audit", label: "Activity / Audit" },
    ],
  },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <nav className="space-y-5 pb-4">
      {NAV.map((entry) => {
        if (!isGroup(entry)) {
          return (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.to === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 px-3 py-2 text-[13px] transition-colors hover:bg-muted hover:text-foreground",
                  isActive && "bg-[#111111] text-white hover:bg-[#111111] hover:text-white",
                )
              }
            >
              <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && entry.label}
            </NavLink>
          );
        }
        return (
          <div key={entry.label}>
            {!collapsed && (
              <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.2em] text-accent uppercase">
                {entry.label}
              </p>
            )}
            <div className="space-y-0.5">
              {entry.items.map((item) => {
                const exact = location.pathname === item.to;
                const nested = location.pathname.startsWith(`${item.to}/`);
                const siblingActive = entry.items.some(
                  (other) =>
                    other.to !== item.to &&
                    (location.pathname === other.to ||
                      location.pathname.startsWith(`${other.to}/`)),
                );
                const active = exact || (nested && !siblingActive);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "block px-3 py-1.5 text-[13px] transition-colors hover:bg-muted",
                      active && "bg-muted font-medium text-foreground",
                      collapsed && "text-center",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {collapsed ? item.label.slice(0, 1) : item.label}
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
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const logout = useLogout();
  const initials = (user?.name ?? "H")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F8F6]">
      <aside
        className={cn(
          "hidden h-full min-h-0 border-r border-border bg-white lg:flex lg:flex-col",
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
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-white px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col overflow-hidden bg-white">
              <div className="mb-6 flex shrink-0 items-center gap-2">
                <BrandWordmark className="h-9 w-auto" />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
                <SidebarNav collapsed={false} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search the edit, orders, customers"
              className="h-9 border-border bg-[#F8F8F6] pl-9"
              disabled
            />
          </div>
          <Button variant="ghost" size="icon" className="ml-auto" disabled>
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
              >
                <Avatar>
                  <AvatarFallback className="bg-[#111111] text-[11px] text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left text-sm sm:block">
                  <span className="block leading-tight text-foreground">{user?.name}</span>
                  <span className="block text-[11px] tracking-wide text-muted-foreground uppercase">
                    {user?.role}
                  </span>
                </span>
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
                      const message =
                        error instanceof ApiError ? error.message : "Could not sign out.";
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
        <main className="min-h-0 flex-1 overflow-y-auto p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
