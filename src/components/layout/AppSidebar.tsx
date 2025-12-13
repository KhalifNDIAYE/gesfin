import { useState, useEffect, useCallback } from "react";
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
  ChevronDown,
  LogOut,
  User,
  HelpCircle,
  ChevronUp,
  Wallet,
  CreditCard,
  Receipt,
  FileCheck,
  BookOpen,
  Scale,
  Link2,
  Landmark,
  Coins,
  Clock,
  RefreshCw,
  Lock,
  Printer,
  PieChart,
  Activity,
  Layers,
  MapPin,
  SplitSquareHorizontal,
  Building,
  TrendingUp,
  Database,
  AlertTriangle,
  Cog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useSidebarCounts, useSidebarAlerts } from "@/hooks/useSidebarCounts";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ModuleName } from "@/types/database";

type AlertKey = "projetsEnRetard" | "projetsBudgetDepasse" | "conventionsExpirees" | "budgetsEnDepassement";

// Types for dropdown groups
type GroupKey = 
  | "comptabilite" 
  | "analytique" 
  | "budget" 
  | "immobilisations" 
  | "rapports" 
  | "decaissements" 
  | "administration";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?: keyof ReturnType<typeof useSidebarCounts>["data"];
  alertKeys?: { key: AlertKey; href: string; label: string }[];
  module?: ModuleName;
}

interface NavGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
  module?: ModuleName;
  alertKey?: AlertKey;
  alertHref?: string;
  groupKey: GroupKey;
}

const mainNavItems: NavItem[] = [
  { title: "Tableau de bord", href: "/", icon: LayoutDashboard, module: "dashboard" },
  {
    title: "Projets",
    href: "/projets",
    icon: FolderKanban,
    badgeKey: "projets",
    alertKeys: [
      { key: "projetsEnRetard", href: "/projets?filter=retard", label: "projet(s) en retard" },
      { key: "projetsBudgetDepasse", href: "/projets?filter=depassement", label: "dépassement(s) budget" },
    ],
    module: "projets",
  },
];

const comptabiliteGroup: NavGroup = {
  title: "Comptabilité Générale",
  icon: Calculator,
  module: "comptabilite",
  groupKey: "comptabilite",
  items: [
    { title: "Journal", href: "/comptabilite", icon: BookOpen, module: "comptabilite" },
    { title: "Dépenses", href: "/comptabilite/depenses", icon: Wallet, module: "comptabilite" },
    { title: "Financements", href: "/comptabilite/financements", icon: CreditCard, module: "comptabilite" },
    { title: "Décaissements", href: "/comptabilite/decaissements", icon: Receipt, module: "comptabilite" },
    { title: "Prises en charge", href: "/comptabilite/prises-en-charge", icon: FileCheck, module: "comptabilite" },
    { title: "Tiers", href: "/comptabilite/tiers", icon: Users, module: "comptabilite" },
    { title: "Grand Livre", href: "/comptabilite/grand-livre", icon: FileText, module: "comptabilite" },
    { title: "Balances", href: "/comptabilite/balances", icon: Scale, module: "comptabilite" },
    { title: "Lettrage", href: "/comptabilite/lettrage", icon: Link2, module: "comptabilite" },
    { title: "Rapprochement", href: "/comptabilite/rapprochement", icon: Landmark, module: "comptabilite" },
    { title: "Caisse", href: "/comptabilite/caisse", icon: Coins, module: "comptabilite" },
    { title: "Échéances", href: "/comptabilite/echeances", icon: Clock, module: "comptabilite" },
    { title: "À-nouveaux", href: "/comptabilite/a-nouveaux", icon: RefreshCw, module: "comptabilite" },
    { title: "Clôtures", href: "/comptabilite/clotures", icon: Lock, module: "comptabilite" },
    { title: "Éditions", href: "/comptabilite/editions", icon: Printer, module: "comptabilite" },
    { title: "Dépassements", href: "/comptabilite/depassements", icon: AlertTriangle, module: "comptabilite" },
  ],
};

const analytiqueGroup: NavGroup = {
  title: "Comptabilité Analytique",
  icon: PieChart,
  module: "comptabilite",
  groupKey: "analytique",
  items: [
    { title: "Par Activité", href: "/comptabilite/analytique/activite", icon: Activity, module: "comptabilite" },
    { title: "Par Composante", href: "/comptabilite/analytique/composante", icon: Layers, module: "comptabilite" },
    { title: "Par Zone Géo.", href: "/comptabilite/analytique/geographique", icon: MapPin, module: "comptabilite" },
    {
      title: "Répartition",
      href: "/comptabilite/analytique/repartition",
      icon: SplitSquareHorizontal,
      module: "comptabilite",
    },
    { title: "Réimputation", href: "/comptabilite/analytique/reimputation", icon: ArrowDownUp, module: "comptabilite" },
    {
      title: "Centres de Coûts",
      href: "/comptabilite/analytique/centres-couts",
      icon: Building,
      module: "comptabilite",
    },
    {
      title: "Analyse Projet",
      href: "/comptabilite/analytique/analyse-projet",
      icon: FolderKanban,
      module: "comptabilite",
    },
    { title: "Synthèse", href: "/comptabilite/analytique/synthese", icon: PieChart, module: "comptabilite" },
  ],
};

const budgetGroup: NavGroup = {
  title: "Suivi Budgétaire",
  icon: Wallet,
  module: "comptabilite",
  alertKey: "budgetsEnDepassement",
  alertHref: "/budget/alertes",
  groupKey: "budget",
  items: [
    { title: "Budgets", href: "/budget", icon: FileText, module: "comptabilite" },
    { title: "Tableau de Bord", href: "/budget/dashboard", icon: BarChart3, module: "comptabilite" },
    { title: "Comparaison", href: "/budget/comparaison", icon: Scale, module: "comptabilite" },
    { title: "Alertes", href: "/budget/alertes", icon: Activity, module: "comptabilite" },
    { title: "Risques Budgétaires", href: "/budget/risques", icon: AlertTriangle, module: "comptabilite" },
  ],
};

const immobilisationsGroup: NavGroup = {
  title: "Immobilisations",
  icon: Package,
  module: "immobilisations",
  groupKey: "immobilisations",
  items: [
    { title: "Registre", href: "/immobilisations", icon: Package, module: "immobilisations" },
    { title: "Mouvements", href: "/immobilisations/mouvements", icon: ArrowDownUp, module: "immobilisations" },
    { title: "Amortissements", href: "/immobilisations/amortissements", icon: Calculator, module: "immobilisations" },
    { title: "Sorties", href: "/immobilisations/sorties", icon: FileText, module: "immobilisations" },
    { title: "Rapprochement", href: "/immobilisations/rapprochement", icon: Scale, module: "immobilisations" },
  ],
};

const rapportsGroup: NavGroup = {
  title: "Rapports",
  icon: BarChart3,
  module: "rapports",
  groupKey: "rapports",
  items: [
    { title: "Vue d'ensemble", href: "/rapports", icon: FileText, module: "rapports" },
    { title: "Risques & Alertes", href: "/rapports/risques-alertes", icon: AlertTriangle, module: "rapports" },
    { title: "Bilan", href: "/rapports/bilan", icon: FileText, module: "rapports" },
    { title: "Compte de Résultat", href: "/rapports/resultat", icon: TrendingUp, module: "rapports" },
    { title: "Financement", href: "/rapports/financement", icon: Wallet, module: "rapports" },
    { title: "Ratios", href: "/rapports/ratios", icon: Calculator, module: "rapports" },
    { title: "Dashboard", href: "/rapports/dashboard", icon: BarChart3, module: "rapports" },
    { title: "SYSCOHADA", href: "/rapports/syscohada", icon: BookOpen, module: "rapports" },
    { title: "IFR / RSF", href: "/rapports/ifr", icon: FileCheck, module: "rapports" },
  ],
};

const decaissementsGroup: NavGroup = {
  title: "Décaissements",
  icon: ArrowDownUp,
  module: "decaissements",
  groupKey: "decaissements",
  items: [
    { title: "Vue d'ensemble", href: "/decaissements", icon: ArrowDownUp, module: "decaissements" },
    { title: "Par Projet", href: "/decaissements/projet", icon: FolderKanban, module: "decaissements" },
    { title: "Par Bailleur", href: "/decaissements/bailleur", icon: Building2, module: "decaissements" },
    { title: "Par Budget", href: "/decaissements/budget", icon: Wallet, module: "decaissements" },
    { title: "Monitoring", href: "/decaissements/monitoring", icon: Activity, module: "decaissements" },
  ],
};

// Administration group with its sub-items
const administrationGroup: NavGroup = {
  title: "Administration",
  icon: Cog,
  groupKey: "administration",
  items: [
    { title: "Utilisateurs", href: "/utilisateurs", icon: Users, module: "utilisateurs" },
    { title: "Sécurité", href: "/securite", icon: Shield, module: "securite" },
    { title: "Utilitaires", href: "/utilitaires", icon: Database, module: "parametres" },
    { title: "Paramètres", href: "/parametres", icon: Settings, module: "parametres" },
  ],
};

const otherNavItems: NavItem[] = [
  { title: "Bailleurs", href: "/bailleurs", icon: Building2, badgeKey: "bailleurs", module: "bailleurs" },
  {
    title: "Conventions",
    href: "/conventions",
    icon: FileText,
    badgeKey: "conventions",
    alertKeys: [{ key: "conventionsExpirees", href: "/conventions?filter=expired", label: "convention(s) expirée(s)" }],
    module: "conventions",
  },
  { title: "Marchés", href: "/marches", icon: ArrowDownUp, badgeKey: "marches", module: "marches" },
];

export function AppSidebar() {
  const getStoredState = (key: string, defaultValue: string | null) => {
    const stored = localStorage.getItem(`sidebar_${key}`);
    return stored !== null ? stored : defaultValue;
  };

  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem("sidebar_collapsed");
    return stored !== null ? JSON.parse(stored) : false;
  });
  
  // Single state for exclusive dropdown opening
  const [openGroup, setOpenGroup] = useState<GroupKey | null>(() => {
    const stored = getStoredState("openGroup", null);
    return stored as GroupKey | null;
  });

  const location = useLocation();
  const navigate = useNavigate();
  const { profile, roles, signOut } = useAuth();
  const { canAccess, isAdmin } = usePermissions();
  const { data: sidebarCounts } = useSidebarCounts();
  const { data: sidebarAlerts } = useSidebarAlerts();

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem("sidebar_collapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  // Persist open group state
  useEffect(() => {
    if (openGroup) {
      localStorage.setItem("sidebar_openGroup", openGroup);
    } else {
      localStorage.removeItem("sidebar_openGroup");
    }
  }, [openGroup]);

  // Determine which group should be open based on current route
  const getActiveGroup = useCallback((): GroupKey | null => {
    const path = location.pathname;
    
    if (path.includes("/comptabilite/analytique")) return "analytique";
    if (path.startsWith("/comptabilite")) return "comptabilite";
    if (path.startsWith("/budget")) return "budget";
    if (path.startsWith("/immobilisations")) return "immobilisations";
    if (path.startsWith("/rapports")) return "rapports";
    if (path.startsWith("/decaissements")) return "decaissements";
    if (
      path.startsWith("/utilisateurs") || 
      path.startsWith("/securite") || 
      path.startsWith("/utilitaires") || 
      path.startsWith("/parametres")
    ) return "administration";
    
    return null;
  }, [location.pathname]);

  // Auto-open the group containing the current route
  useEffect(() => {
    const activeGroup = getActiveGroup();
    if (activeGroup && openGroup !== activeGroup) {
      setOpenGroup(activeGroup);
    }
  }, [location.pathname, getActiveGroup]);

  // Toggle group with exclusive behavior
  const handleGroupToggle = (groupKey: GroupKey) => {
    setOpenGroup(current => current === groupKey ? null : groupKey);
  };

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

  // Check if a group is active based on current route
  const isGroupActive = (groupKey: GroupKey): boolean => {
    return getActiveGroup() === groupKey;
  };

  // Filter navigation items based on permissions
  const filterNavItems = (items: NavItem[]) => {
    return items.filter((item) => !item.module || canAccess(item.module, "read"));
  };

  const canShowGroup = (group: NavGroup) => {
    if (!group.module) {
      // For administration group, check if user has access to at least one sub-item
      if (group.groupKey === "administration") {
        return group.items.some(item => item.module && canAccess(item.module, "read"));
      }
      return true;
    }
    return canAccess(group.module, "read");
  };

  // Get filtered administration items based on user permissions
  const getFilteredAdminItems = () => {
    return administrationGroup.items.filter(item => 
      item.module && canAccess(item.module, "read")
    );
  };

  const filteredMainNavItems = filterNavItems(mainNavItems);
  const filteredOtherNavItems = filterNavItems(otherNavItems);
  const filteredAdminItems = getFilteredAdminItems();
  const showAdministration = filteredAdminItems.length > 0;

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;
    const badgeValue = item.badgeKey && sidebarCounts ? sidebarCounts[item.badgeKey] : undefined;

    // Calculate total alerts from alertKeys array
    const alertsData =
      item.alertKeys
        ?.map((alertConfig) => ({
          ...alertConfig,
          value: sidebarAlerts ? sidebarAlerts[alertConfig.key] : 0,
        }))
        .filter((a) => a.value > 0) || [];

    const totalAlerts = alertsData.reduce((sum, a) => sum + a.value, 0);

    const handleAlertClick = (e: React.MouseEvent, href: string) => {
      e.preventDefault();
      e.stopPropagation();
      navigate(href);
    };

    return (
      <Link to={item.href} className={cn("sidebar-nav-item group relative", isActive && "active")}>
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.title}</span>
            <div className="flex items-center gap-1">
              {/* Alert badges - prioritaires, rouges */}
              {alertsData.map((alert, index) => (
                <button
                  key={index}
                  onClick={(e) => handleAlertClick(e, alert.href)}
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/80 transition-colors"
                  title={`${alert.value} ${alert.label}`}
                >
                  {alert.value}
                </button>
              ))}
              {/* Count badge - normal, bleu */}
              {badgeValue !== undefined && badgeValue > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sidebar-primary/20 px-1.5 text-xs font-semibold text-sidebar-primary">
                  {badgeValue}
                </span>
              )}
            </div>
          </>
        )}
        {/* Collapsed state - show alert indicator as dot */}
        {collapsed && totalAlerts > 0 && (
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
        )}
      </Link>
    );
  };

  const SubNavItem = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          isActive && "bg-sidebar-accent text-sidebar-primary font-medium",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.title}</span>
      </Link>
    );
  };

  // Render a collapsible navigation group
  const renderNavGroup = (group: NavGroup, displayTitle: string) => {
    const isOpen = openGroup === group.groupKey;
    const isActive = isGroupActive(group.groupKey);
    const Icon = group.icon;
    const items = group.groupKey === "administration" ? filteredAdminItems : group.items;

    if (collapsed) {
      // In collapsed mode, show only icon linking to first item
      const firstHref = items[0]?.href || "#";
      return (
        <Link 
          key={group.groupKey}
          to={firstHref} 
          className={cn("sidebar-nav-item group relative", isActive && "active")}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {group.alertKey && sidebarAlerts?.[group.alertKey] !== undefined && sidebarAlerts[group.alertKey] > 0 && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive" />
          )}
        </Link>
      );
    }

    return (
      <Collapsible 
        key={group.groupKey}
        open={isOpen} 
        onOpenChange={() => handleGroupToggle(group.groupKey)}
      >
        <CollapsibleTrigger asChild>
          <button className={cn("sidebar-nav-item group w-full justify-between", isActive && "active")}>
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 text-left">{displayTitle}</span>
            </div>
            <div className="flex items-center gap-1">
              {group.alertKey && sidebarAlerts?.[group.alertKey] !== undefined && sidebarAlerts[group.alertKey] > 0 && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (group.alertHref) navigate(group.alertHref);
                  }}
                  className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/80 transition-colors"
                  title={`${sidebarAlerts[group.alertKey]} alerte(s)`}
                >
                  {sidebarAlerts[group.alertKey]}
                </button>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 pt-1 space-y-0.5 animate-accordion-down data-[state=closed]:animate-accordion-up">
          {items.map((item) => (
            <SubNavItem key={item.href} item={item} />
          ))}
        </CollapsibleContent>
      </Collapsible>
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

          {filteredMainNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}

          {/* Comptabilité Générale Group */}
          {canShowGroup(comptabiliteGroup) && renderNavGroup(comptabiliteGroup, "Comptabilité")}

          {/* Comptabilité Analytique Group */}
          {canShowGroup(analytiqueGroup) && renderNavGroup(analytiqueGroup, "Analytique")}

          {/* Suivi Budgétaire Group */}
          {canShowGroup(budgetGroup) && renderNavGroup(budgetGroup, "Budgétaire")}

          {/* Immobilisations Group */}
          {canShowGroup(immobilisationsGroup) && renderNavGroup(immobilisationsGroup, "Immobilisations")}

          {filteredOtherNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}

          {/* Décaissements Group */}
          {canShowGroup(decaissementsGroup) && renderNavGroup(decaissementsGroup, "Décaissements")}

          {/* Rapports Group */}
          {canShowGroup(rapportsGroup) && renderNavGroup(rapportsGroup, "Rapports")}

          {/* Administration Dropdown - shown only if user has at least one admin permission */}
          {showAdministration && (
            <>
              <div className="mb-2 mt-6">
                {!collapsed && (
                  <span className="px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                    Administration
                  </span>
                )}
              </div>
              {renderNavGroup(administrationGroup, "Administration")}
            </>
          )}
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
                      <p className="truncate text-xs text-sidebar-primary/80">{primaryRole?.toUpperCase()}</p>
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
