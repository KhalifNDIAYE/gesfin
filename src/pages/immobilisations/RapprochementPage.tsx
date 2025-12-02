import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  ClipboardCheck,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Package,
  FileText
} from "lucide-react";
import { useAssets, useAssetStats } from "@/hooks/useAssets";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const RapprochementPage = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: assets, isLoading } = useAssets();
  const { data: stats } = useAssetStats();

  // Group assets by location for reconciliation
  const assetsByLocation = assets?.reduce((acc, asset) => {
    const locationName = asset.location?.name || asset.site?.name || 'Non localisé';
    if (!acc[locationName]) {
      acc[locationName] = [];
    }
    acc[locationName].push(asset);
    return acc;
  }, {} as Record<string, typeof assets>) || {};

  const locationStats = Object.entries(assetsByLocation).map(([location, locationAssets]) => ({
    location,
    count: locationAssets?.length || 0,
    totalValue: locationAssets?.reduce((sum, a) => sum + (a.acquisition_value || 0), 0) || 0,
    totalVNC: locationAssets?.reduce((sum, a) => sum + (a.net_book_value || 0), 0) || 0,
    activeCount: locationAssets?.filter(a => a.status === 'active').length || 0,
  }));

  const filteredLocations = locationStats.filter(loc => 
    loc.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate reconciliation summary
  const totalAssets = stats?.totalCount || 0;
  const activeAssets = stats?.activeCount || 0;
  const reconciliationRate = totalAssets > 0 ? (activeAssets / totalAssets) * 100 : 0;

  return (
    <AppLayout 
      title="Rapprochement" 
      subtitle="Rapprochement comptabilité / inventaire physique"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalAssets}</p>
                  <p className="text-sm text-muted-foreground">Actifs comptables</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeAssets}</p>
                  <p className="text-sm text-muted-foreground">Actifs en service</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.maintenanceCount || 0}</p>
                  <p className="text-sm text-muted-foreground">En maintenance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <ClipboardCheck className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{reconciliationRate.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Taux de concordance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reconciliation Progress */}
        <Card>
          <CardHeader>
            <CardTitle>État du Rapprochement</CardTitle>
            <CardDescription>Progression de l'inventaire physique vs comptable</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Actifs vérifiés</span>
                <span className="font-medium">{activeAssets} / {totalAssets}</span>
              </div>
              <Progress value={reconciliationRate} className="h-2" />
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span>En service ({activeAssets})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-warning" />
                  <span>Maintenance ({stats?.maintenanceCount || 0})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive" />
                  <span>Sortis ({stats?.disposedCount || 0})</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par localisation..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="h-4 w-4" />
              Exporter rapport
            </Button>
            <Button variant="gradient">
              <Plus className="h-4 w-4" />
              Nouveau rapprochement
            </Button>
          </div>
        </div>

        {/* Location Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif par Localisation</CardTitle>
            <CardDescription>
              Vue d'ensemble des actifs par site/emplacement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredLocations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Aucune localisation trouvée</h3>
                <p className="text-sm text-muted-foreground">
                  Ajoutez des actifs avec des localisations pour voir le rapprochement
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Localisation</th>
                      <th className="text-right">Nb. Actifs</th>
                      <th className="text-right">Actifs en service</th>
                      <th className="text-right">Valeur brute</th>
                      <th className="text-right">VNC totale</th>
                      <th>Concordance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocations.map((loc) => {
                      const concordanceRate = loc.count > 0 ? (loc.activeCount / loc.count) * 100 : 0;
                      
                      return (
                        <tr key={loc.location}>
                          <td className="font-medium">{loc.location}</td>
                          <td className="text-right font-mono">{loc.count}</td>
                          <td className="text-right font-mono text-success">{loc.activeCount}</td>
                          <td className="text-right font-mono">{formatCurrency(loc.totalValue)}</td>
                          <td className="text-right font-mono">{formatCurrency(loc.totalVNC)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <Progress value={concordanceRate} className="h-2 w-20" />
                              <span className="text-sm font-medium">{concordanceRate.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default RapprochementPage;
