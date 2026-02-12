import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Gauge,
  Factory,
  Cog,
  Package,
  ClipboardList,
  BarChart3,
  History,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: <BarChart3 className="h-5 w-5" />, adminOnly: true },
  { label: "Novo Ciclo", href: "/cycle/new", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "Histórico", href: "/history", icon: <History className="h-5 w-5" /> },
  { label: "Linhas (ZAP)", href: "/admin/lines", icon: <Factory className="h-5 w-5" />, adminOnly: true },
  { label: "Máquinas", href: "/admin/machines", icon: <Cog className="h-5 w-5" />, adminOnly: true },
  { label: "Produtos", href: "/admin/products", icon: <Package className="h-5 w-5" />, adminOnly: true },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, role, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-4">
          <Gauge className="h-6 w-6 text-sidebar-primary" />
          <span className="text-lg font-bold text-sidebar-primary-foreground">Medições</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                location.pathname === item.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 px-3 text-xs text-sidebar-foreground/50">
            {user?.email}
            <span className="ml-1 rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase">
              {role ?? "..."}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:text-sidebar-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">
            {filteredNav.find((n) => n.href === location.pathname)?.label ?? "Medições"}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
