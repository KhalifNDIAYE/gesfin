import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProject } from "@/hooks/useProjects";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  MapPin, 
  Wallet,
  Building2,
  FileText,
  History,
  TrendingUp,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  active: { label: "En cours", className: "bg-success/10 text-success" },
  completed: { label: "Terminé", className: "bg-info/10 text-info" },
  pending: { label: "En attente", className: "bg-warning/10 text-warning" },
  suspended: { label: "Suspendu", className: "bg-destructive/10 text-destructive" },
  closed: { label: "Clôturé", className: "bg-muted text-muted-foreground" },
};

export default function ProjetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);

  if (isLoading) {
    return (
      <AppLayout title="Chargement..." subtitle="">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout title="Projet non trouvé" subtitle="">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Ce projet n'existe pas.</p>
          <Button onClick={() => navigate("/projets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux projets
          </Button>
        </div>
      </AppLayout>
    );
  }

  const percentage = project.total_budget > 0 
    ? (project.consumed_budget / project.total_budget) * 100 
    : 0;
  const status = statusConfig[project.status] || statusConfig.draft;

  return (
    <AppLayout
      title={project.name}
      subtitle={`Code: ${project.code}`}
    >
      <div className="space-y-6">
        {/* Header with back button and status */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/projets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <Badge className={cn("text-sm px-3 py-1", status.className)}>
            {status.label}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget total</p>
                  <p className="text-lg font-semibold">
                    {(project.total_budget / 1000000).toLocaleString('fr-FR')} M
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consommé</p>
                  <p className="text-lg font-semibold">
                    {(project.consumed_budget / 1000000).toLocaleString('fr-FR')} M
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <Calendar className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Période</p>
                  <p className="text-lg font-semibold">
                    {project.start_date ? new Date(project.start_date).getFullYear() : "—"} - {project.end_date ? new Date(project.end_date).getFullYear() : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Building2 className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bailleurs</p>
                  <p className="text-lg font-semibold">
                    {project.project_bailleurs?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">Informations générales</TabsTrigger>
            <TabsTrigger value="bailleurs">Bailleurs</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations du projet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Code</p>
                      <p className="font-medium">{project.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Statut</p>
                      <Badge className={status.className}>{status.label}</Badge>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Nom</p>
                    <p className="font-medium">{project.name}</p>
                  </div>

                  {project.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm">{project.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Début</p>
                        <p className="font-medium">
                          {project.start_date ? new Date(project.start_date).toLocaleDateString('fr-FR') : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Fin</p>
                        <p className="font-medium">
                          {project.end_date ? new Date(project.end_date).toLocaleDateString('fr-FR') : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Responsable</p>
                      <p className="font-medium">{project.responsible?.full_name || "—"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Site</p>
                      <p className="font-medium">{project.site?.name || "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Suivi budgétaire</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Taux d'exécution</span>
                      <span className="font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Budget total</p>
                      <p className="text-xl font-semibold">
                        {(project.total_budget / 1000000).toLocaleString('fr-FR')} M
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.currency?.code || "FCFA"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Consommé</p>
                      <p className="text-xl font-semibold text-success">
                        {(project.consumed_budget / 1000000).toLocaleString('fr-FR')} M
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {project.currency?.code || "FCFA"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Solde disponible</p>
                    <p className="text-2xl font-bold text-primary">
                      {((project.total_budget - project.consumed_budget) / 1000000).toLocaleString('fr-FR')} M
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bailleurs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bailleurs du projet</CardTitle>
              </CardHeader>
              <CardContent>
                {project.project_bailleurs && project.project_bailleurs.length > 0 ? (
                  <div className="space-y-4">
                    {project.project_bailleurs.map((pb) => (
                      <div key={pb.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-primary" />
                            <span className="font-medium">
                              {pb.bailleur?.name || "Bailleur"}
                            </span>
                          </div>
                          <Badge variant="outline">
                            {pb.execution_rate.toFixed(1)}% exécuté
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Engagé</p>
                            <p className="font-medium">
                              {(pb.committed_amount / 1000000).toLocaleString('fr-FR')} M
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Décaissé</p>
                            <p className="font-medium text-success">
                              {(pb.disbursed_amount / 1000000).toLocaleString('fr-FR')} M
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Restant</p>
                            <p className="font-medium text-warning">
                              {(pb.remaining_amount / 1000000).toLocaleString('fr-FR')} M
                            </p>
                          </div>
                        </div>
                        <Progress value={pb.execution_rate} className="h-2 mt-3" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Aucun bailleur associé à ce projet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suivi budgétaire détaillé</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Les lignes budgétaires seront affichées ici
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents du projet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Aucun document attaché
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historique & Audit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  L'historique des modifications sera affiché ici
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
