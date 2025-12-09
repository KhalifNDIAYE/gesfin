import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Eye, 
  Loader2, 
  RefreshCw,
  FileSignature,
  TrendingUp
} from "lucide-react";
import { useProjectDerivedBailleurs, useSyncProjectBailleurs } from "@/hooks/useProjectSync";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ProjectBailleursTabProps {
  projectId: string;
}

export function ProjectBailleursTab({ projectId }: ProjectBailleursTabProps) {
  const navigate = useNavigate();
  const { data: bailleurs = [], isLoading, refetch } = useProjectDerivedBailleurs(projectId);
  const syncBailleurs = useSyncProjectBailleurs();

  const handleSync = async () => {
    await syncBailleurs.mutateAsync(projectId);
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Calculer les totaux
  const totals = bailleurs.reduce((acc, b) => ({
    committed: acc.committed + b.total_committed,
    disbursed: acc.disbursed + b.total_disbursed,
    remaining: acc.remaining + b.total_remaining,
  }), { committed: 0, disbursed: 0, remaining: 0 });

  const globalRate = totals.committed > 0 ? (totals.disbursed / totals.committed) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      {bailleurs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Synthèse des financements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Bailleurs</p>
                <p className="text-2xl font-bold">{bailleurs.length}</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-primary/10">
                <p className="text-sm text-muted-foreground">Engagé</p>
                <p className="text-2xl font-bold text-primary">
                  {(totals.committed / 1000000).toLocaleString('fr-FR')} M
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-success/10">
                <p className="text-sm text-muted-foreground">Décaissé</p>
                <p className="text-2xl font-bold text-success">
                  {(totals.disbursed / 1000000).toLocaleString('fr-FR')} M
                </p>
              </div>
              <div className="text-center p-3 rounded-lg bg-warning/10">
                <p className="text-sm text-muted-foreground">Taux global</p>
                <p className="text-2xl font-bold text-warning">
                  {globalRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Bailleurs du projet
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleSync}
            disabled={syncBailleurs.isPending}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", syncBailleurs.isPending && "animate-spin")} />
            Synchroniser
          </Button>
        </CardHeader>
        <CardContent>
          {bailleurs.length > 0 ? (
            <div className="space-y-4">
              {bailleurs.map((bailleur) => (
                <div key={bailleur.bailleur_id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{bailleur.bailleur_name}</span>
                          {bailleur.short_name && (
                            <Badge variant="outline" className="text-xs">
                              {bailleur.short_name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {bailleur.conventions.length} convention{bailleur.conventions.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {bailleur.execution_rate.toFixed(1)}% exécuté
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => navigate(`/bailleurs/${bailleur.bailleur_id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Conventions liées */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {bailleur.conventions.map((conv) => (
                      <Badge 
                        key={conv.id} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-secondary/80"
                        onClick={() => navigate(`/conventions/${conv.id}`)}
                      >
                        <FileSignature className="h-3 w-3 mr-1" />
                        {conv.code}
                      </Badge>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-muted-foreground">Engagé</p>
                      <p className="font-medium">
                        {(bailleur.total_committed / 1000000).toLocaleString('fr-FR')} M
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Décaissé</p>
                      <p className="font-medium text-success">
                        {(bailleur.total_disbursed / 1000000).toLocaleString('fr-FR')} M
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Restant</p>
                      <p className="font-medium text-warning">
                        {(bailleur.total_remaining / 1000000).toLocaleString('fr-FR')} M
                      </p>
                    </div>
                  </div>
                  
                  <Progress value={bailleur.execution_rate} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                Aucun bailleur associé à ce projet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Les bailleurs sont automatiquement synchronisés depuis les conventions liées
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
