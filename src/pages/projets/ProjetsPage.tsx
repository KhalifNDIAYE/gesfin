import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PermissionButton } from "@/components/auth/PermissionButton";
import { useModulePermissions } from "@/components/auth/PermissionButton";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { useProjects, Project } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projets/ProjectCard";
import { ProjectDialog } from "@/components/projets/ProjectDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TableExportButtons, ExportColumn } from "@/components/export/TableExportButtons";
import { formatCurrency } from "@/lib/utils";

export default function ProjetsPage() {
  const { projects, isLoading, deleteProject } = useProjects();
  const { canCreate, canUpdate, canDelete } = useModulePermissions("projets");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedProject(null);
    setDialogOpen(true);
  };

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (projectToDelete) {
      await deleteProject.mutateAsync(projectToDelete.id);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  return (
    <AppLayout
      title="Gestion des Projets"
      subtitle="Suivi et pilotage des projets multi-bailleurs"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un projet..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <TableExportButtons
              data={filteredProjects.map(p => ({
                ...p,
                statusLabel: p.status === 'active' ? 'En cours' : p.status === 'completed' ? 'Terminé' : p.status,
                consumptionRate: p.total_budget > 0 ? Math.round((p.consumed_budget / p.total_budget) * 100) : 0,
              }))}
              columns={[
                { key: "code", label: "Code" },
                { key: "name", label: "Nom" },
                { key: "total_budget", label: "Budget", format: (v) => formatCurrency(v) },
                { key: "consumed_budget", label: "Consommé", format: (v) => formatCurrency(v) },
                { key: "consumptionRate", label: "Taux", format: (v) => `${v}%` },
                { key: "statusLabel", label: "Statut" },
              ] as ExportColumn[]}
              filename="projets"
              title="Liste des Projets"
              subtitle={`${filteredProjects.length} projets`}
            />
            <PermissionButton
              variant="default"
              module="projets"
              permission="create"
              onClick={handleAdd}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau projet
            </PermissionButton>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm ? "Aucun projet trouvé" : "Aucun projet créé"}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                canUpdate={canUpdate}
                canDelete={canDelete}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={selectedProject}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le projet "{projectToDelete?.name}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
