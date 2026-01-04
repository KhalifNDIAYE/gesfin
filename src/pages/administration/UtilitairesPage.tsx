import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/usePermissions";
import { UtilitairesMetierTab } from "@/components/administration/utilitaires/UtilitairesMetierTab";
import { UtilitairesSystemeTab } from "@/components/administration/utilitaires/UtilitairesSystemeTab";
import { Briefcase, Server, Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function UtilitairesPage() {
  const { canAccess, isAdmin } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Permissions métier: Admin métier, DAF, Chef de projet (partiel)
  const canAccessMetier = isAdmin || canAccess('parametres', 'read') || canAccess('projets', 'update');
  const canEditMetier = isAdmin || canAccess('parametres', 'update');
  
  // Permissions système: Super Admin, Admin IT uniquement
  const canAccessSysteme = isAdmin;
  const canEditSysteme = isAdmin;

  // Get tab from URL or default based on permissions
  const getDefaultTab = () => {
    const urlTab = searchParams.get('section');
    if (urlTab === 'systeme' && canAccessSysteme) return 'systeme';
    if (urlTab === 'metier' && canAccessMetier) return 'metier';
    return canAccessMetier ? 'metier' : canAccessSysteme ? 'systeme' : 'metier';
  };

  const [activeMainTab, setActiveMainTab] = useState(getDefaultTab);

  // Sync URL with tab state
  useEffect(() => {
    const currentSection = searchParams.get('section');
    if (currentSection !== activeMainTab) {
      setSearchParams({ section: activeMainTab });
    }
  }, [activeMainTab, searchParams, setSearchParams]);

  // Si l'utilisateur n'a accès à rien
  if (!canAccessMetier && !canAccessSysteme) {
    return (
      <AppLayout title="Utilitaires" subtitle="Accès restreint">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Lock className="h-5 w-5" />
              Accès non autorisé
            </CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder aux utilitaires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Contactez votre administrateur si vous pensez que c'est une erreur.
            </p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Utilitaires" 
      subtitle="Outils métier et système pour l'administration de la plateforme"
    >
      {/* Security & Compliance Notice */}
      <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span className="text-muted-foreground">
          Toutes les actions sont journalisées conformément aux normes ISO 27001, SOC 2 et RGPD.
        </span>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-2 h-auto p-1">
          {canAccessMetier && (
            <TabsTrigger 
              value="metier" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Briefcase className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Utilitaires Métier</span>
                <span className="text-xs opacity-70">Équipes fonctionnelles</span>
              </div>
            </TabsTrigger>
          )}
          {canAccessSysteme ? (
            <TabsTrigger 
              value="systeme" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              <Server className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Utilitaires Système</span>
                <span className="text-xs opacity-70">Administrateurs IT</span>
              </div>
            </TabsTrigger>
          ) : (
            <TabsTrigger 
              value="systeme" 
              disabled
              className="flex items-center gap-2 py-3 opacity-50 cursor-not-allowed"
            >
              <Lock className="h-4 w-4" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Utilitaires Système</span>
                <span className="text-xs opacity-70">Accès restreint</span>
              </div>
            </TabsTrigger>
          )}
        </TabsList>

        {canAccessMetier && (
          <TabsContent value="metier" className="space-y-4">
            <div className="rounded-lg border bg-gradient-to-r from-primary/5 to-primary/10 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Utilitaires Métier
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Import/Export, recalculs, nettoyage des données, gestion documentaire et alertes métier.
                  </p>
                </div>
                <Badge variant="outline" className="bg-background">
                  {canEditMetier ? "Accès complet" : "Lecture seule"}
                </Badge>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Rôles autorisés:</span>
                <Badge variant="secondary" className="text-xs">Admin métier</Badge>
                <Badge variant="secondary" className="text-xs">DAF</Badge>
                <Badge variant="secondary" className="text-xs">Chef de projet (partiel)</Badge>
              </div>
            </div>
            <UtilitairesMetierTab canEdit={canEditMetier} />
          </TabsContent>
        )}

        {canAccessSysteme && (
          <TabsContent value="systeme" className="space-y-4">
            <div className="rounded-lg border border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100 p-4 dark:border-orange-800/50 dark:from-orange-950/20 dark:to-orange-900/20">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2 text-orange-800 dark:text-orange-300">
                    <Server className="h-4 w-4" />
                    Utilitaires Système
                    <Badge variant="destructive" className="ml-2">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Zone critique
                    </Badge>
                  </h3>
                  <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                    Sécurité, diagnostics, sauvegardes, maintenance et paramètres techniques.
                  </p>
                </div>
                <Badge variant="outline" className="bg-background border-orange-300">
                  Super Admin
                </Badge>
              </div>
              <Separator className="my-3 bg-orange-200 dark:bg-orange-800/50" />
              <div className="flex items-center gap-4 text-xs text-orange-700 dark:text-orange-400">
                <span>Rôles autorisés:</span>
                <Badge className="text-xs bg-orange-600 hover:bg-orange-700">Super Admin</Badge>
                <Badge className="text-xs bg-orange-600 hover:bg-orange-700">Admin IT</Badge>
              </div>
            </div>
            <UtilitairesSystemeTab canEdit={canEditSysteme} />
          </TabsContent>
        )}
      </Tabs>
    </AppLayout>
  );
}
