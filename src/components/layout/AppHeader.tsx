import { useState, useRef } from "react";
import { Search, HelpCircle, LogOut, User, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { GlobalSearchResults } from "@/components/search/GlobalSearchResults";


interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const { user, profile, roles, signOut } = useAuth();
  const { query, setQuery, results, isLoading, hasResults, clearSearch } = useGlobalSearch();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

  const primaryRole = roles && roles.length > 0 ? roles[0].name : "Utilisateur";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60" data-component="header" data-testid="app-header">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Global Search */}
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher projets, conventions..."
                className="w-72 pl-9 pr-8"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.length >= 2) {
                    setSearchOpen(true);
                  }
                }}
                onFocus={() => {
                  if (query.length >= 2) {
                    setSearchOpen(true);
                  }
                }}
              />
              {query.length > 0 && (
                <button
                  onClick={() => {
                    clearSearch();
                    setSearchOpen(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent 
            className="w-[400px] p-0" 
            align="start" 
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <GlobalSearchResults
              results={results}
              isLoading={isLoading}
              query={query}
              onSelect={() => {
                setSearchOpen(false);
                clearSearch();
              }}
            />
          </PopoverContent>
        </Popover>

        {/* Notifications Center */}
        <NotificationCenter />

        {/* Help */}
        <Button variant="ghost" size="icon" onClick={() => window.open("https://docs.lovable.dev/", "_blank")}>
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* User Section - Only visible when logged in */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {profile ? getInitials(profile.full_name, profile.email) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                {/* Desktop: show name and role */}
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium text-foreground">{profile?.full_name || "Utilisateur"}</span>
                  <span className="text-xs text-muted-foreground">{primaryRole}</span>
                </div>
                <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-popover border border-border shadow-lg z-50"
              sideOffset={8}
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name || "Utilisateur"}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  {roles && roles.length > 0 && (
                    <p className="text-xs text-primary font-medium mt-1">{roles.map((r) => r.name).join(", ")}</p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profil")} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profil
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
        )}
      </div>
    </header>
  );
}
