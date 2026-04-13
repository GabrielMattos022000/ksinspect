import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Factory,
  Package,
  ClipboardList,
  Monitor,
  History,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import logo from "@/assets/logo-sidebar.png";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: "Monitoramento", href: "/", icon: <Monitor className="h-5 w-5" /> },
  { label: "Acompanhamento", href: "/cycle/new", icon: <ClipboardList className="h-5 w-5" /> },
  { label: "Histórico", href: "/history", icon: <History className="h-5 w-5" /> },
  { label: "Linhas (ZAP)", href: "/admin/lines", icon: <Factory className="h-5 w-5" />, adminOnly: true },
  { label: "Produtos", href: "/admin/products", icon: <Package className="h-5 w-5" />, adminOnly: true },
  { label: "Usuários", href: "/admin/users", icon: <Users className="h-5 w-5" />, adminOnly: true },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, role, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navItems.filter((item) => !item.adminOnly || isAdmin);

  const SidebarLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center justify-center rounded-md p-2.5 transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {item.icon}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Link
        to={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        {item.icon}
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border",
        collapsed ? "justify-center px-2" : "gap-2 px-4"
      )}>
        <img src={logo} alt="KS Logo" className="h-8 w-auto shrink-0" />
        {!collapsed && (
          <span className="text-lg font-bold text-sidebar-primary-foreground">KS Inspection</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {filteredNav.map((item) => (
          <SidebarLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        {!collapsed && (
          <div className="mb-2 px-2 text-xs text-sidebar-foreground/50 truncate">
            {user?.email}
            <span className="ml-1 rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase">
              {role ?? "..."}
            </span>
          </div>
        )}
        <div className={cn("flex gap-1", collapsed ? "flex-col items-center" : "")}>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className={cn(
              "text-sidebar-foreground/70 hover:text-sidebar-foreground",
              collapsed ? "w-full justify-center" : "flex-1 justify-start gap-2"
            )}
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Sair"}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 relative shrink-0",
          collapsed ? "w-14" : "w-64"
        )}
      >
        {sidebarContent}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-[4.5rem] z-10 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground/70 hover:text-sidebar-foreground shadow-sm"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </aside>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="KS Logo" className="h-8 w-auto" />
            <span className="text-lg font-bold text-sidebar-primary-foreground">KS Inspection</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} className="text-sidebar-foreground/70">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
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
          <div className="mb-2 px-1 text-xs text-sidebar-foreground/50">
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

      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold truncate">
            {filteredNav.find((n) => n.href === location.pathname)?.label ?? "KS Inspection"}
          </h1>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
