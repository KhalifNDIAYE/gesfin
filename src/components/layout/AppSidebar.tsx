import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  HelpCircle,
  UserCog,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  { title: "Paramètres", href: "/parametres", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Déconnexion réussie");
      navigate("/auth");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const primaryRole = roles.length > 0 ? roles[0].name : "Utilisateur";

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Link to={item.href} className={cn("sidebar-nav-item group", isActive && "active")}>
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
        collapsed ? "w-[72px]" : "w-64",
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg bg-sidebar-accent p-3 transition-colors hover:bg-sidebar-accent/80 focus:outline-none",
                  collapsed && "justify-center",
                )}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                  <AvatarFallback className="bg-sidebar-primary/20 text-sm font-semibold text-sidebar-primary">
                    {profile ? getInitials(profile.full_name, profile.email) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <>
                    <div className="flex-1 overflow-hidden text-left">
                      <p className="truncate text-sm font-medium text-sidebar-foreground">
                        {profile?.full_name || "Utilisateur"}
                      </p>
                      <p className="truncate text-xs text-sidebar-foreground/60">{profile?.email || ""}</p>
                      <p className="truncate text-xs text-sidebar-primary/80 capitalize">{primaryRole}</p>
                    </div>
                    <ChevronUp className="h-4 w-4 text-sidebar-foreground/60" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-56 bg-popover border border-border shadow-lg z-50"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name || "Utilisateur"}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profil")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Mon profil
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open("https://docs.lovable.dev/", "_blank")}
                className="cursor-pointer"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Aide
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
