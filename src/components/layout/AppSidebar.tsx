import { useState, useEffect } from "react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const mainNavItems: NavItem[] = [
  { title: "Tableau de bord", href: "/", icon: LayoutDashboard },
  { title: "Projets", href: "/projets", icon: FolderKanban, badge: 12 },
];

const comptabiliteGroup: NavGroup = {
  title: "Comptabilité Générale",
  icon: Calculator,
  items: [
    { title: "Journal", href: "/comptabilite", icon: BookOpen },
    { title: "Dépenses", href: "/comptabilite/depenses", icon: Wallet },
    { title: "Financements", href: "/comptabilite/financements", icon: CreditCard },
    { title: "Décaissements", href: "/comptabilite/decaissements", icon: Receipt },
    { title: "Prises en charge", href: "/comptabilite/prises-en-charge", icon: FileCheck },
    { title: "Tiers", href: "/comptabilite/tiers", icon: Users },
    { title: "Grand Livre", href: "/comptabilite/grand-livre", icon: FileText },
    { title: "Balances", href: "/comptabilite/balances", icon: Scale },
    { title: "Lettrage", href: "/comptabilite/lettrage", icon: Link2 },
    { title: "Rapprochement", href: "/comptabilite/rapprochement", icon: Landmark },
    { title: "Caisse", href: "/comptabilite/caisse", icon: Coins },
    { title: "Échéances", href: "/comptabilite/echeances", icon: Clock },
    { title: "À-nouveaux", href: "/comptabilite/a-nouveaux", icon: RefreshCw },
    { title: "Clôtures", href: "/comptabilite/clotures", icon: Lock },
    { title: "Éditions", href: "/comptabilite/editions", icon: Printer },
  ],
};

const analytiqueGroup: NavGroup = {
  title: "Comptabilité Analytique",
  icon: PieChart,
  items: [
    { title: "Par Activité", href: "/comptabilite/analytique/activite", icon: Activity },
    { title: "Par Composante", href: "/comptabilite/analytique/composante", icon: Layers },
    { title: "Par Zone Géo.", href: "/comptabilite/analytique/geographique", icon: MapPin },
    { title: "Répartition", href: "/comptabilite/analytique/repartition", icon: SplitSquareHorizontal },
    { title: "Réimputation", href: "/comptabilite/analytique/reimputation", icon: ArrowDownUp },
    { title: "Centres de Coûts", href: "/comptabilite/analytique/centres-couts", icon: Building },
    { title: "Analyse Projet", href: "/comptabilite/analytique/analyse-projet", icon: FolderKanban },
    { title: "Synthèse", href: "/comptabilite/analytique/synthese", icon: PieChart },
  ],
};

const budgetGroup: NavGroup = {
  title: "Suivi Budgétaire",
  icon: Wallet,
  items: [
    { title: "Budgets", href: "/budget", icon: FileText },
    { title: "Tableau de Bord", href: "/budget/dashboard", icon: BarChart3 },
    { title: "Comparaison", href: "/budget/comparaison", icon: Scale },
    { title: "Alertes", href: "/budget/alertes", icon: Activity },
  ],
};

const immobilisationsGroup: NavGroup = {
  title: "Immobilisations",
  icon: Package,
  items: [
    { title: "Registre", href: "/immobilisations", icon: Package },
    { title: "Mouvements", href: "/immobilisations/mouvements", icon: ArrowDownUp },
    { title: "Amortissements", href: "/immobilisations/amortissements", icon: Calculator },
    { title: "Sorties", href: "/immobilisations/sorties", icon: FileText },
    { title: "Rapprochement", href: "/immobilisations/rapprochement", icon: Scale },
  ],
};

const rapportsGroup: NavGroup = {
  title: "Rapports",
  icon: BarChart3,
  items: [
    { title: "Vue d'ensemble", href: "/rapports", icon: FileText },
    { title: "Bilan", href: "/rapports/bilan", icon: FileText },
    { title: "Compte de Résultat", href: "/rapports/resultat", icon: TrendingUp },
    { title: "Financement", href: "/rapports/financement", icon: Wallet },
    { title: "Ratios", href: "/rapports/ratios", icon: Calculator },
    { title: "Dashboard", href: "/rapports/dashboard", icon: BarChart3 },
    { title: "SYSCOHADA", href: "/rapports/syscohada", icon: BookOpen },
    { title: "IFR / RSF", href: "/rapports/ifr", icon: FileCheck },
  ],
};

const otherNavItems: NavItem[] = [
  { title: "Bailleurs", href: "/bailleurs", icon: Building2, badge: 5 },
  { title: "Conventions", href: "/conventions", icon: FileText },
  { title: "Marchés", href: "/marches", icon: ArrowDownUp },
  { title: "Décaissements", href: "/decaissements", icon: ArrowDownUp },
];

const adminNavItems: NavItem[] = [
  { title: "Utilisateurs", href: "/utilisateurs", icon: Users },
  { title: "Sécurité", href: "/securite", icon: Shield },
  { title: "Paramètres", href: "/parametres", icon: Settings },
];

export function AppSidebar() {
  // Load menu states from localStorage
  const getStoredState = (key: string, defaultValue: boolean) => {
    const stored = localStorage.getItem(`sidebar_${key}`);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  };

  const [collapsed, setCollapsed] = useState(() => getStoredState('collapsed', false));
  const [comptaOpen, setComptaOpen] = useState(() => getStoredState('comptaOpen', false));
  const [analytiqueOpen, setAnalytiqueOpen] = useState(() => getStoredState('analytiqueOpen', false));
  const [budgetOpen, setBudgetOpen] = useState(() => getStoredState('budgetOpen', false));
  const [immoOpen, setImmoOpen] = useState(() => getStoredState('immoOpen', false));
  const [rapportsOpen, setRapportsOpen] = useState(() => getStoredState('rapportsOpen', false));
  const location = useLocation();

  // Persist menu states to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(collapsed));
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem('sidebar_comptaOpen', JSON.stringify(comptaOpen));
  }, [comptaOpen]);

  useEffect(() => {
    localStorage.setItem('sidebar_analytiqueOpen', JSON.stringify(analytiqueOpen));
  }, [analytiqueOpen]);

  useEffect(() => {
    localStorage.setItem('sidebar_budgetOpen', JSON.stringify(budgetOpen));
  }, [budgetOpen]);

  useEffect(() => {
    localStorage.setItem('sidebar_immoOpen', JSON.stringify(immoOpen));
  }, [immoOpen]);

  useEffect(() => {
    localStorage.setItem('sidebar_rapportsOpen', JSON.stringify(rapportsOpen));
  }, [rapportsOpen]);
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
  
  const isComptaActive = location.pathname.startsWith("/comptabilite") && !location.pathname.includes("/analytique");
  const isAnalytiqueActive = location.pathname.includes("/comptabilite/analytique");
  const isBudgetActive = location.pathname.startsWith("/budget");
  const isImmoActive = location.pathname.startsWith("/immobilisations");
  const isRapportsActive = location.pathname.startsWith("/rapports");

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

  const SubNavItem = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <Link
        to={item.href}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
          "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          isActive && "bg-sidebar-accent text-sidebar-primary font-medium"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{item.title}</span>
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

          {/* Comptabilité Générale Group */}
          {collapsed ? (
            <Link
              to="/comptabilite"
              className={cn("sidebar-nav-item group", isComptaActive && "active")}
            >
              <Calculator className="h-5 w-5 shrink-0" />
            </Link>
          ) : (
            <Collapsible open={comptaOpen} onOpenChange={setComptaOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "sidebar-nav-item group w-full justify-between",
                    isComptaActive && "active"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">Comptabilité</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      comptaOpen && "rotate-180"
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 pt-1 space-y-0.5">
                {comptabiliteGroup.items.map((item) => (
                  <SubNavItem key={item.href} item={item} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Comptabilité Analytique Group */}
          {collapsed ? (
            <Link
              to="/comptabilite/analytique/synthese"
              className={cn("sidebar-nav-item group", isAnalytiqueActive && "active")}
            >
              <PieChart className="h-5 w-5 shrink-0" />
            </Link>
          ) : (
            <Collapsible open={analytiqueOpen} onOpenChange={setAnalytiqueOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "sidebar-nav-item group w-full justify-between",
                    isAnalytiqueActive && "active"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <PieChart className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">Analytique</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      analytiqueOpen && "rotate-180"
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 pt-1 space-y-0.5">
                {analytiqueGroup.items.map((item) => (
                  <SubNavItem key={item.href} item={item} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Suivi Budgétaire Group */}
          {collapsed ? (
            <Link
              to="/budget"
              className={cn("sidebar-nav-item group", isBudgetActive && "active")}
            >
              <Wallet className="h-5 w-5 shrink-0" />
            </Link>
          ) : (
            <Collapsible open={budgetOpen} onOpenChange={setBudgetOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "sidebar-nav-item group w-full justify-between",
                    isBudgetActive && "active"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">Budgétaire</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      budgetOpen && "rotate-180"
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 pt-1 space-y-0.5">
                {budgetGroup.items.map((item) => (
                  <SubNavItem key={item.href} item={item} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Immobilisations Group */}
          {collapsed ? (
            <Link
              to="/immobilisations"
              className={cn("sidebar-nav-item group", isImmoActive && "active")}
            >
              <Package className="h-5 w-5 shrink-0" />
            </Link>
          ) : (
            <Collapsible open={immoOpen} onOpenChange={setImmoOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "sidebar-nav-item group w-full justify-between",
                    isImmoActive && "active"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">Immobilisations</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      immoOpen && "rotate-180"
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 pt-1 space-y-0.5">
                {immobilisationsGroup.items.map((item) => (
                  <SubNavItem key={item.href} item={item} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {otherNavItems.map((item) => (
            <NavItemComponent key={item.href} item={item} />
          ))}

          {/* Rapports Group */}
          {collapsed ? (
            <Link
              to="/rapports"
              className={cn("sidebar-nav-item group", isRapportsActive && "active")}
            >
              <BarChart3 className="h-5 w-5 shrink-0" />
            </Link>
          ) : (
            <Collapsible open={rapportsOpen} onOpenChange={setRapportsOpen}>
              <CollapsibleTrigger asChild>
                <button
                  className={cn(
                    "sidebar-nav-item group w-full justify-between",
                    isRapportsActive && "active"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">Rapports</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      rapportsOpen && "rotate-180"
                    )}
                  />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 pt-1 space-y-0.5">
                {rapportsGroup.items.map((item) => (
                  <SubNavItem key={item.href} item={item} />
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

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
