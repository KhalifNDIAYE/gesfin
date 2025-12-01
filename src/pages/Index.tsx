import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { BudgetChart } from "@/components/dashboard/BudgetChart";
import { ProjectsOverview } from "@/components/dashboard/ProjectsOverview";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { DonorsChart } from "@/components/dashboard/DonorsChart";
import { 
  Wallet, 
  FolderKanban, 
  Building2, 
  TrendingUp,
  FileText,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <AppLayout 
      title="Tableau de bord" 
      subtitle="Vue d'ensemble de la gestion financière"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="animate-slide-up opacity-0 stagger-1">
            <StatCard
              title="Budget Total"
              value="10.7 Mrd"
              change={8.2}
              changeLabel="mois dernier"
              icon={<Wallet className="h-6 w-6" />}
              variant="primary"
            />
          </div>
          <div className="animate-slide-up opacity-0 stagger-2">
            <StatCard
              title="Projets Actifs"
              value="12"
              change={2}
              changeLabel="ce trimestre"
              icon={<FolderKanban className="h-6 w-6" />}
              variant="success"
            />
          </div>
          <div className="animate-slide-up opacity-0 stagger-3">
            <StatCard
              title="Bailleurs"
              value="5"
              icon={<Building2 className="h-6 w-6" />}
              variant="info"
            />
          </div>
          <div className="animate-slide-up opacity-0 stagger-4">
            <StatCard
              title="Taux Décaissement"
              value="68.5%"
              change={-2.3}
              changeLabel="objectif"
              icon={<TrendingUp className="h-6 w-6" />}
              variant="warning"
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <BudgetChart />
          <DonorsChart />
        </div>

        {/* Projects and Transactions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ProjectsOverview />
          <RecentTransactions />
        </div>

        {/* Alerts & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertes
              </CardTitle>
              <CardDescription>Actions requises et notifications importantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-warning/10 p-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Convention expirante</p>
                  <p className="text-xs text-muted-foreground">Convention AFD - expire dans 15 jours</p>
                </div>
                <Button variant="outline" size="sm">Voir</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-destructive/10 p-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Dépassement budgétaire</p>
                  <p className="text-xs text-muted-foreground">Projet Routes - ligne 61 dépassée</p>
                </div>
                <Button variant="outline" size="sm">Analyser</Button>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-info/10 p-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Rapport en attente</p>
                  <p className="text-xs text-muted-foreground">Rapport trimestriel Q4 2023</p>
                </div>
                <Button variant="outline" size="sm">Générer</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Actions rapides
              </CardTitle>
              <CardDescription>Raccourcis vers les opérations courantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <Wallet className="h-5 w-5" />
                  <span className="text-xs">Nouveau décaissement</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Saisie écriture</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <Building2 className="h-5 w-5" />
                  <span className="text-xs">Ajouter bailleur</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <FolderKanban className="h-5 w-5" />
                  <span className="text-xs">Créer projet</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
