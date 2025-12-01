import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Calendar,
  Users,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  code: string;
  name: string;
  bailleur: string;
  dateDebut: string;
  dateFin: string;
  budget: number;
  consumed: number;
  status: "active" | "completed" | "pending" | "suspended";
  responsable: string;
}

const projects: Project[] = [
  { 
    id: "1", 
    code: "PRJ-001", 
    name: "Programme National d'Eau Potable en Milieu Rural",
    bailleur: "Banque Mondiale", 
    dateDebut: "2022-01-01",
    dateFin: "2025-12-31",
    budget: 2500000000, 
    consumed: 1875000000, 
    status: "active",
    responsable: "Dr. Amadou Diallo"
  },
  { 
    id: "2", 
    code: "PRJ-002", 
    name: "Électrification des Villages Ruraux Phase I",
    bailleur: "AFD", 
    dateDebut: "2023-03-15",
    dateFin: "2026-03-14",
    budget: 1800000000, 
    consumed: 900000000, 
    status: "active",
    responsable: "Ing. Fatou Sow"
  },
  { 
    id: "3", 
    code: "PRJ-003", 
    name: "Réhabilitation Routes Nationales Phase II",
    bailleur: "BAD", 
    dateDebut: "2020-06-01",
    dateFin: "2023-12-31",
    budget: 5000000000, 
    consumed: 4750000000, 
    status: "completed",
    responsable: "M. Ousmane Ba"
  },
  { 
    id: "4", 
    code: "PRJ-004", 
    name: "Renforcement du Système de Santé Communautaire",
    bailleur: "USAID", 
    dateDebut: "2023-09-01",
    dateFin: "2027-08-31",
    budget: 800000000, 
    consumed: 240000000, 
    status: "active",
    responsable: "Dr. Mariama Koné"
  },
  { 
    id: "5", 
    code: "PRJ-005", 
    name: "Formation Professionnelle des Jeunes",
    bailleur: "UE", 
    dateDebut: "2024-01-01",
    dateFin: "2028-12-31",
    budget: 600000000, 
    consumed: 0, 
    status: "pending",
    responsable: "M. Ibrahim Traoré"
  },
];

const statusConfig = {
  active: { label: "En cours", className: "bg-success/10 text-success border-success/20" },
  completed: { label: "Terminé", className: "bg-info/10 text-info border-info/20" },
  pending: { label: "En attente", className: "bg-warning/10 text-warning border-warning/20" },
  suspended: { label: "Suspendu", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const Projets = () => {
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
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="gradient">
            <Plus className="h-4 w-4" />
            Nouveau projet
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => {
            const percentage = (project.consumed / project.budget) * 100;
            const status = statusConfig[project.status];
            
            return (
              <Card 
                key={project.id} 
                className={cn(
                  "group transition-all duration-300 hover:shadow-lg animate-slide-up opacity-0",
                  `stagger-${index + 1}`
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">{project.code}</p>
                      <CardTitle className="text-base leading-tight">{project.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <Badge variant="outline" className={cn("w-fit", status.className)}>
                    {status.label}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Bailleur</p>
                      <p className="font-medium">{project.bailleur}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Responsable</p>
                      <p className="font-medium truncate">{project.responsable}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Consommation budgétaire</span>
                      <span className="font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{(project.consumed / 1000000).toLocaleString()} M FCFA</span>
                      <span>{(project.budget / 1000000).toLocaleString()} M FCFA</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{project.dateDebut.split('-')[0]} - {project.dateFin.split('-')[0]}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Projets;
