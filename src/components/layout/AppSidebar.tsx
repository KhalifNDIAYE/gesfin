import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Calculator,
  Users,
  Building2,
  FileText,
  Package,
  ArrowDownUp,
  BarChart3,
  Shield,
  Settings,
  Settings2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { title: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { title: "Projets", href: "/projets", icon: FolderKanban, badge: 12 },
  { title: "Comptabilité", href: "/comptabilite", icon: Calculator },
  { title: "Bailleurs", href: "/bailleurs", icon: Building2, badge: 5 },
  { title: "Conventions", href: "/conventions", icon: FileText },
  { title: "Immobilisations", href: "/immobilisations", icon: Package },
  { title: "Marchés", href: "/marches", icon: ArrowDownUp },
  { title: "Décaissements", href: "/decaissements", icon: ArrowDownUp },
  { title: "Rapports", href: "/rapports", icon: BarChart3 },
];

const adminNavItems: NavItem[] = [
  { title: "Utilisateurs", href: "/utilisateurs", icon: Users },
  { title: "Sécurité", href: "/securite", icon: Shield },
  { title: "Paramétrage", href: "/parametrage", icon: Settings2 },
  { title: "Paramètres", href: "/parametres", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        to={item.href}
        className={cn(
          "sidebar-nav-item group",
          isActive && "active"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary/20 px-1.5 text-xs font-semibold text-sidebar-primary">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
                <Calculator className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-sidebar-foreground">FinanceFlow</span>
                <span className="text-xs text-sidebar-foreground/50">Gestion Multi-Projets</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary">
              <Calculator className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <div className="mb-2">
            {!collapsed && (
              <span className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                Modules
              </span>
            )}
          </div>
          {mainNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}

          <div className="mb-2 mt-6">
            {!collapsed && (
              <span className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                Administration
              </span>
            )}
          </div>
          {adminNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}
        </nav>

        <Separator className="bg-sidebar-border" />

        {/* User Section */}
        <div className="p-3">
          <div className={cn(
            "flex items-center gap-3 rounded-lg bg-sidebar-accent p-3",
            collapsed && "justify-center"
          )}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary/20">
              <span className="text-sm font-semibold text-sidebar-primary">AD</span>
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">Admin User</p>
                <p className="truncate text-xs text-sidebar-foreground/60">admin@org.com</p>
              </div>
            )}
            {!collapsed && (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Réduire</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
