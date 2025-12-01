import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  bailleur: string;
  budget: number;
  consumed: number;
  status: "active" | "completed" | "pending" | "suspended";
}

const projects: Project[] = [
  { id: "1", name: "Programme Eau Potable Rural", bailleur: "Banque Mondiale", budget: 2500000000, consumed: 1875000000, status: "active" },
  { id: "2", name: "Électrification Villages", bailleur: "AFD", budget: 1800000000, consumed: 900000000, status: "active" },
  { id: "3", name: "Routes Nationales Phase II", bailleur: "BAD", budget: 5000000000, consumed: 4750000000, status: "completed" },
  { id: "4", name: "Santé Communautaire", bailleur: "USAID", budget: 800000000, consumed: 240000000, status: "active" },
  { id: "5", name: "Formation Professionnelle", bailleur: "UE", budget: 600000000, consumed: 0, status: "pending" },
];

const statusStyles = {
  active: "badge-success",
  completed: "badge-info",
  pending: "badge-warning",
  suspended: "badge-destructive",
};

const statusLabels = {
  active: "En cours",
  completed: "Terminé",
  pending: "En attente",
  suspended: "Suspendu",
};

export function ProjectsOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Projets en cours</CardTitle>
        <CardDescription>Vue d'ensemble des principaux projets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {projects.map((project) => {
            const percentage = (project.consumed / project.budget) * 100;
            
            return (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-muted-foreground">{project.bailleur}</p>
                  </div>
                  <span className={cn("badge-status", statusStyles[project.status])}>
                    {statusLabels[project.status]}
                  </span>
                </div>
                <div className="space-y-1">
                  <Progress value={percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{(project.consumed / 1000000).toLocaleString()} M FCFA consommés</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
