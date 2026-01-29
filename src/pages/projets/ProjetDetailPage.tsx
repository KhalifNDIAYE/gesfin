import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useProject } from "@/hooks/useProjects";
import { usePermissions } from "@/hooks/usePermissions";
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
  Loader2,
  FileSignature,
  BarChart3,
  Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProjectConventionsTab } from "@/components/projets/ProjectConventionsTab";
import { ProjectDocumentsTab } from "@/components/projets/ProjectDocumentsTab";
import { ProjectBudgetsTab } from "@/components/projets/ProjectBudgetsTab";
import { ProjectHistoryTab } from "@/components/projets/ProjectHistoryTab";
import { ProjectBailleursTab } from "@/components/projets/ProjectBailleursTab";
import { ProjectKPIsDashboard } from "@/components/projets/ProjectKPIsDashboard";
import { ProjectDialog } from "@/components/projets/ProjectDialog";

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
  const { canAccess, isAdmin } = usePermissions();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Check if user can edit the project (Admin or has update permission on projets module)
  const canEditProject = isAdmin || canAccess("projets", "update");

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
        {/* Header with back button, status and edit button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/projets")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-3">
            <Badge className={cn("text-sm px-3 py-1", status.className)}>
              {status.label}
            </Badge>
            {canEditProject && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setEditDialogOpen(true)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5">
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

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/50">
                  <FileSignature className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conventions</p>
                  <p className="text-lg font-semibold">
                    {project.project_conventions?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="general">Informations générales</TabsTrigger>
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
            <TabsTrigger value="bailleurs">Bailleurs</TabsTrigger>
            <TabsTrigger value="conventions">Conventions</TabsTrigger>
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

          <TabsContent value="kpis" className="space-y-4">
            <ProjectKPIsDashboard projectId={id!} />
          </TabsContent>

          <TabsContent value="bailleurs" className="space-y-4">
            <ProjectBailleursTab projectId={id!} />
          </TabsContent>

          <TabsContent value="conventions" className="space-y-4">
            <ProjectConventionsTab projectId={id!} />
          </TabsContent>

          <TabsContent value="budgets" className="space-y-4">
            <ProjectBudgetsTab projectId={id!} />
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <ProjectDocumentsTab projectId={id!} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <ProjectHistoryTab projectId={id!} />
          </TabsContent>
        </Tabs>

        {/* Edit Project Dialog */}
        <ProjectDialog 
          open={editDialogOpen} 
          onOpenChange={setEditDialogOpen} 
          project={project} 
        />
      </div>
    </AppLayout>
  );
}
