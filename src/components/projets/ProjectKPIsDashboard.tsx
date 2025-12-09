import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Loader2, 
  RefreshCw,
  Wallet,
  Calendar,
  Building2,
  FileSignature,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { useProjectKPIs, useRecalculateProjectKPIs } from "@/hooks/useProjectSync";
import { cn } from "@/lib/utils";

interface ProjectKPIsDashboardProps {
  projectId: string;
}

export function ProjectKPIsDashboard({ projectId }: ProjectKPIsDashboardProps) {
  const { data: kpis, isLoading, refetch } = useProjectKPIs(projectId);
  const recalculate = useRecalculateProjectKPIs();

  const handleRecalculate = async () => {
    await recalculate.mutateAsync(projectId);
    refetch();
  };

  if (isLoading || !kpis) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const isHealthy = kpis.execution_rate >= 70 && !kpis.is_overdue;
  const isWarning = kpis.execution_rate >= 50 && kpis.execution_rate < 70;
  const isCritical = kpis.execution_rate < 50 || kpis.is_overdue;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Indicateurs Clés de Performance (KPIs)
        </CardTitle>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleRecalculate}
          disabled={recalculate.isPending}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", recalculate.isPending && "animate-spin")} />
          Recalculer
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status global */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div className="flex items-center gap-3">
            {isHealthy && <CheckCircle2 className="h-6 w-6 text-success" />}
            {isWarning && <AlertTriangle className="h-6 w-6 text-warning" />}
            {isCritical && <AlertTriangle className="h-6 w-6 text-destructive" />}
            <div>
              <p className="font-medium">État du projet</p>
              <p className="text-sm text-muted-foreground">
                {isHealthy && "Bonne santé financière"}
                {isWarning && "Surveillance recommandée"}
                {isCritical && "Attention requise"}
              </p>
            </div>
          </div>
          <Badge className={cn(
            isHealthy && "bg-success/10 text-success",
            isWarning && "bg-warning/10 text-warning",
            isCritical && "bg-destructive/10 text-destructive"
          )}>
            {kpis.status}
          </Badge>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-primary/10 text-center">
            <Wallet className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Budget total</p>
            <p className="text-xl font-bold">
              {(kpis.total_budget / 1000000).toLocaleString('fr-FR')} M
            </p>
          </div>

          <div className="p-4 rounded-lg bg-success/10 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-success mb-2" />
            <p className="text-sm text-muted-foreground">Consommé</p>
            <p className="text-xl font-bold text-success">
              {(kpis.consumed_budget / 1000000).toLocaleString('fr-FR')} M
            </p>
          </div>

          <div className="p-4 rounded-lg bg-warning/10 text-center">
            <Wallet className="h-6 w-6 mx-auto text-warning mb-2" />
            <p className="text-sm text-muted-foreground">Disponible</p>
            <p className="text-xl font-bold text-warning">
              {(kpis.available_budget / 1000000).toLocaleString('fr-FR')} M
            </p>
          </div>

          <div className={cn(
            "p-4 rounded-lg text-center",
            kpis.execution_rate >= 70 ? "bg-success/10" : 
            kpis.execution_rate >= 50 ? "bg-warning/10" : "bg-destructive/10"
          )}>
            <TrendingUp className={cn(
              "h-6 w-6 mx-auto mb-2",
              kpis.execution_rate >= 70 ? "text-success" : 
              kpis.execution_rate >= 50 ? "text-warning" : "text-destructive"
            )} />
            <p className="text-sm text-muted-foreground">Taux d'exécution</p>
            <p className={cn(
              "text-xl font-bold",
              kpis.execution_rate >= 70 ? "text-success" : 
              kpis.execution_rate >= 50 ? "text-warning" : "text-destructive"
            )}>
              {kpis.execution_rate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progression budgétaire</span>
            <span className="font-medium">{kpis.execution_rate.toFixed(1)}%</span>
          </div>
          <Progress value={kpis.execution_rate} className="h-3" />
        </div>

        {/* Relations */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 rounded-lg border">
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bailleurs</p>
              <p className="text-2xl font-bold">{kpis.bailleur_count}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg border">
            <div className="p-2 rounded-lg bg-accent/50">
              <FileSignature className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conventions</p>
              <p className="text-2xl font-bold">{kpis.convention_count}</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {(kpis.start_date || kpis.end_date) && (
          <div className="p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Calendrier</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Début</p>
                <p className="font-medium">
                  {kpis.start_date ? new Date(kpis.start_date).toLocaleDateString('fr-FR') : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Fin prévue</p>
                <p className={cn("font-medium", kpis.is_overdue && "text-destructive")}>
                  {kpis.end_date ? new Date(kpis.end_date).toLocaleDateString('fr-FR') : '—'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Jours restants</p>
                <p className={cn(
                  "font-medium",
                  kpis.is_overdue ? "text-destructive" : 
                  (kpis.days_remaining !== null && kpis.days_remaining < 30) ? "text-warning" : ""
                )}>
                  {kpis.is_overdue ? "En retard" : 
                   kpis.days_remaining !== null ? `${kpis.days_remaining} jours` : '—'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
