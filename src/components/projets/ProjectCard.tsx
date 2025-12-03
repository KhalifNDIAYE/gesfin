import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MoreHorizontal, Calendar, Pencil, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Project } from "@/hooks/useProjects";
import { useNavigate } from "react-router-dom";

interface ProjectCardProps {
  project: Project;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  index: number;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground border-muted" },
  active: { label: "En cours", className: "bg-success/10 text-success border-success/20" },
  completed: { label: "Terminé", className: "bg-info/10 text-info border-info/20" },
  pending: { label: "En attente", className: "bg-warning/10 text-warning border-warning/20" },
  suspended: { label: "Suspendu", className: "bg-destructive/10 text-destructive border-destructive/20" },
  closed: { label: "Clôturé", className: "bg-muted text-muted-foreground border-muted" },
};

export function ProjectCard({ project, canUpdate, canDelete, onEdit, onDelete, index }: ProjectCardProps) {
  const navigate = useNavigate();
  const percentage = project.total_budget > 0 
    ? (project.consumed_budget / project.total_budget) * 100 
    : 0;
  const status = statusConfig[project.status] || statusConfig.draft;
  
  // Get primary bailleur (first one)
  const primaryBailleur = project.project_bailleurs?.[0]?.bailleur;

  return (
    <Card 
      className={cn(
        "group transition-all duration-300 hover:shadow-lg cursor-pointer animate-slide-up opacity-0",
        `stagger-${Math.min(index + 1, 6)}`
      )}
      onClick={() => navigate(`/projets/${project.id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{project.code}</p>
            <CardTitle className="text-base leading-tight line-clamp-2">{project.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/projets/${project.id}`); }}>
                <Eye className="mr-2 h-4 w-4" />
                Voir détails
              </DropdownMenuItem>
              {canUpdate && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(project); }}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Modifier
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(project); }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Badge variant="outline" className={cn("w-fit", status.className)}>
          {status.label}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Bailleur</p>
            <p className="font-medium">{primaryBailleur?.short_name || primaryBailleur?.name || "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Responsable</p>
            <p className="font-medium truncate">{project.responsible?.full_name || "—"}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Consommation budgétaire</span>
            <span className="font-medium">{percentage.toFixed(1)}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{(project.consumed_budget / 1000000).toLocaleString('fr-FR')} M FCFA</span>
            <span>{(project.total_budget / 1000000).toLocaleString('fr-FR')} M FCFA</span>
          </div>
        </div>

        <div className="flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              {project.start_date ? new Date(project.start_date).getFullYear() : "—"} - {project.end_date ? new Date(project.end_date).getFullYear() : "—"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
