import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calculator, 
  Search, 
  Play,
  Calendar,
  TrendingDown,
  FileText
} from "lucide-react";
import { useAssetDepreciations, useAssets, useCalculateDepreciation } from "@/hooks/useAssets";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; className: string }> = {
  calculated: { label: "Calculé", className: "bg-info/10 text-info border-info/20" },
  posted: { label: "Comptabilisé", className: "bg-success/10 text-success border-success/20" },
  pending: { label: "En attente", className: "bg-warning/10 text-warning border-warning/20" },
};

const AmortissementsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");

  const { data: depreciations, isLoading } = useAssetDepreciations();
  const { data: assets } = useAssets();
  const calculateDepreciation = useCalculateDepreciation();

  const activeAssets = assets?.filter(a => a.status === 'active') || [];

  const getAssetInfo = (assetId: string) => {
    return assets?.find(a => a.id === assetId);
  };

  const handleCalculateDepreciation = () => {
    if (!selectedAssetId) {
      toast.error("Veuillez sélectionner un actif");
      return;
    }

    calculateDepreciation.mutate({
      assetId: selectedAssetId,
      periodEnd: new Date().toISOString().split('T')[0],
    });
  };

  const filteredDepreciations = depreciations?.filter((dep) => {
    const asset = getAssetInfo(dep.asset_id);
    return asset?.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
           asset?.designation.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  // Calculate summary stats
  const totalDepreciation = filteredDepreciations.reduce((sum, d) => sum + d.depreciation_amount, 0);
  const totalAccumulated = filteredDepreciations.reduce((sum, d) => sum + d.accumulated_amount, 0);

  return (
    <AppLayout 
      title="Amortissements" 
      subtitle="Calcul et suivi des amortissements"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Calculator className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filteredDepreciations.length}</p>
                  <p className="text-sm text-muted-foreground">Calculs effectués</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <TrendingDown className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalDepreciation)}</p>
                  <p className="text-sm text-muted-foreground">Dotation période</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <FileText className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalAccumulated)}</p>
                  <p className="text-sm text-muted-foreground">Cumul amortissements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calculate Depreciation */}
        <Card>
          <CardHeader>
            <CardTitle>Calculer l'amortissement</CardTitle>
            <CardDescription>Sélectionnez un actif pour calculer son amortissement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Actif</label>
                <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un actif" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeAssets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.code} - {asset.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="gradient" 
                onClick={handleCalculateDepreciation}
                disabled={calculateDepreciation.isPending}
              >
                <Play className="h-4 w-4" />
                {calculateDepreciation.isPending ? "Calcul en cours..." : "Calculer"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Rechercher..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Depreciations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tableau des Amortissements</CardTitle>
            <CardDescription>
              Historique des calculs d'amortissement
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredDepreciations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calculator className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Aucun amortissement calculé</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Sélectionnez un actif ci-dessus pour calculer son amortissement
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Actif</th>
                      <th>Période</th>
                      <th className="text-right">Dotation</th>
                      <th className="text-right">Cumul</th>
                      <th className="text-right">VNC</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepreciations.map((dep) => {
                      const asset = getAssetInfo(dep.asset_id);
                      const status = statusConfig[dep.status || 'calculated'];
                      
                      return (
                        <tr key={dep.id}>
                          <td>
                            <div>
                              <p className="font-medium">{asset?.code}</p>
                              <p className="text-xs text-muted-foreground">{asset?.designation}</p>
                            </div>
                          </td>
                          <td className="text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(dep.period_start).toLocaleDateString('fr-FR')} - {new Date(dep.period_end).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="text-right font-mono text-warning">
                            {formatCurrency(dep.depreciation_amount)}
                          </td>
                          <td className="text-right font-mono">
                            {formatCurrency(dep.accumulated_amount)}
                          </td>
                          <td className="text-right font-mono text-success">
                            {formatCurrency(dep.net_book_value)}
                          </td>
                          <td>
                            <Badge variant="outline" className={status.className}>
                              {status.label}
                            </Badge>
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

export default AmortissementsPage;
