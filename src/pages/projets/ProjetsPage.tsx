import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PermissionButton } from "@/components/auth/PermissionButton";
import { useModulePermissions } from "@/components/auth/PermissionButton";
import { Plus, Search, Filter, Loader2, Map, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableExportButtons, ExportColumn } from "@/components/export/TableExportButtons";
import { formatCurrency } from "@/lib/utils";

const statusOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "draft", label: "Planifié" },
  { value: "active", label: "En cours" },
  { value: "pending", label: "En retard" },
  { value: "suspended", label: "Bloqué" },
  { value: "completed", label: "Terminé" },
  { value: "closed", label: "Clôturé" },
];

export default function ProjetsPage() {
  const { projects, isLoading, deleteProject } = useProjects();
  const { canCreate, canUpdate, canDelete } = useModulePermissions("projets");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bailleurFilter, setBailleurFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Extract unique bailleurs from projects
  const bailleurs = useMemo(() => {
    const bailleurMap: Record<string, { id: string; name: string; code: string }> = {};
    projects.forEach((project) => {
      project.project_bailleurs?.forEach((pb) => {
        if (pb.bailleur && !bailleurMap[pb.bailleur.id]) {
          bailleurMap[pb.bailleur.id] = {
            id: pb.bailleur.id,
            name: pb.bailleur.name,
            code: pb.bailleur.code,
          };
        }
      });
    });
    return Object.values(bailleurMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  // Filter projects based on search, status and bailleur
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Search filter
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;

      // Bailleur filter - check if project has the selected bailleur
      const matchesBailleur =
        bailleurFilter === "all" ||
        p.project_bailleurs?.some((pb) => pb.bailleur?.id === bailleurFilter);

      return matchesSearch && matchesStatus && matchesBailleur;
    });
  }, [projects, searchTerm, statusFilter, bailleurFilter]);

  const hasActiveFilters = statusFilter !== "all" || bailleurFilter !== "all" || searchTerm !== "";

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setBailleurFilter("all");
  };

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
          </div>
          <div className="flex gap-2">
            <Link to="/projets/carte">
              <Button variant="outline">
                <Map className="h-4 w-4 mr-2" />
                Carte
              </Button>
            </Link>
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

        {/* Filters Section */}
        <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtres :</span>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={bailleurFilter} onValueChange={setBailleurFilter}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Bailleur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les bailleurs</SelectItem>
              {bailleurs.map((bailleur) => (
                <SelectItem key={bailleur.id} value={bailleur.id}>
                  {bailleur.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Réinitialiser
            </Button>
          )}

          <span className="ml-auto text-sm text-muted-foreground">
            {filteredProjects.length} projet{filteredProjects.length !== 1 ? "s" : ""} trouvé{filteredProjects.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {hasActiveFilters ? "Aucun projet ne correspond aux filtres" : searchTerm ? "Aucun projet trouvé" : "Aucun projet créé"}
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