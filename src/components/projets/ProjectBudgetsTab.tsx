import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Wallet, Eye, Loader2, Calendar } from "lucide-react";
import { useProjectBudgets } from "@/hooks/useProjectBudgets";
import { useNavigate } from "react-router-dom";

interface ProjectBudgetsTabProps {
  projectId: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  soumis: { label: "Soumis", className: "bg-info/10 text-info" },
  valide: { label: "Validé", className: "bg-success/10 text-success" },
  rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive" },
  clos: { label: "Clôturé", className: "bg-muted text-muted-foreground" },
};

export function ProjectBudgetsTab({ projectId }: ProjectBudgetsTabProps) {
  const navigate = useNavigate();
  const { data: budgets = [], isLoading } = useProjectBudgets(projectId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Budgets du projet
        </CardTitle>
      </CardHeader>
      <CardContent>
        {budgets.length > 0 ? (
          <div className="space-y-4">
            {budgets.map((pb) => {
              const budget = pb.budget;
              if (!budget) return null;
              
              const status = statusConfig[budget.status] || statusConfig.draft;
              const executionRate = pb.forecast_amount > 0 
                ? (pb.consumed_amount / pb.forecast_amount) * 100 
                : 0;

              return (
                <div key={pb.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Wallet className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{budget.name}</span>
                          <Badge variant="outline" className="text-xs">{budget.code}</Badge>
                        </div>
                        {budget.fiscal_year && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {budget.fiscal_year.name}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={status.className}>{status.label}</Badge>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => navigate(`/budget/${budget.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Prévisionnel</p>
                      <p className="font-medium">
                        {(pb.forecast_amount / 1000000).toLocaleString('fr-FR')} M
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Engagé</p>
                      <p className="font-medium text-info">
                        {(pb.committed_amount / 1000000).toLocaleString('fr-FR')} M
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Consommé</p>
                      <p className="font-medium text-success">
                        {(pb.consumed_amount / 1000000).toLocaleString('fr-FR')} M
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Disponible</p>
                      <p className="font-medium text-warning">
                        {(pb.remaining_amount / 1000000).toLocaleString('fr-FR')} M
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taux de consommation</span>
                      <span>{executionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={executionRate} className="h-2" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Aucun budget associé à ce projet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
