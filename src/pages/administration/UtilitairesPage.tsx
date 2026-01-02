import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/hooks/usePermissions";
import { UtilitairesMetierTab } from "@/components/administration/utilitaires/UtilitairesMetierTab";
import { UtilitairesSystemeTab } from "@/components/administration/utilitaires/UtilitairesSystemeTab";
import { Briefcase, Server, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UtilitairesPage() {
  const { canAccess, isAdmin } = usePermissions();
  
  // Permissions métier: Admin métier, DAF, Chef de projet (partiel)
  const canAccessMetier = isAdmin || canAccess('parametres', 'read') || canAccess('projets', 'update');
  const canEditMetier = isAdmin || canAccess('parametres', 'update');
  
  // Permissions système: Super Admin, Admin IT uniquement
  const canAccessSysteme = isAdmin;
  const canEditSysteme = isAdmin;

  const [activeMainTab, setActiveMainTab] = useState(canAccessMetier ? "metier" : canAccessSysteme ? "systeme" : "metier");

  // Si l'utilisateur n'a accès à rien
  if (!canAccessMetier && !canAccessSysteme) {
    return (
      <AppLayout title="Utilitaires" subtitle="Accès restreint">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
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
      <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          {canAccessMetier && (
            <TabsTrigger value="metier" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Utilitaires Métier
            </TabsTrigger>
          )}
          {canAccessSysteme && (
            <TabsTrigger value="systeme" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              Utilitaires Système
            </TabsTrigger>
          )}
        </TabsList>

        {canAccessMetier && (
          <TabsContent value="metier">
            <div className="mb-4 rounded-lg border bg-muted/30 p-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Utilitaires Métier
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Import/Export, recalculs, nettoyage des données, gestion documentaire et alertes métier.
                Destinés aux équipes fonctionnelles (Finance, Projets, Admin métier).
              </p>
            </div>
            <UtilitairesMetierTab canEdit={canEditMetier} />
          </TabsContent>
        )}

        {canAccessSysteme && (
          <TabsContent value="systeme">
            <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
              <h3 className="font-semibold flex items-center gap-2 text-orange-800">
                <Server className="h-4 w-4" />
                Utilitaires Système
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Sécurité, diagnostics, sauvegardes, maintenance et paramètres techniques.
                Réservés aux administrateurs système uniquement.
              </p>
            </div>
            <UtilitairesSystemeTab canEdit={canEditSysteme} />
          </TabsContent>
        )}
      </Tabs>
    </AppLayout>
  );
}
