import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  FileX,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useAssetDisposals, useAssets } from "@/hooks/useAssets";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { DisposalDialog } from "@/components/immobilisations/DisposalDialog";

const disposalTypeConfig: Record<string, { label: string; className: string }> = {
  sale: { label: "Cession", className: "bg-success/10 text-success border-success/20" },
  scrapping: { label: "Mise au rebut", className: "bg-destructive/10 text-destructive border-destructive/20" },
  donation: { label: "Don", className: "bg-info/10 text-info border-info/20" },
  loss: { label: "Perte", className: "bg-warning/10 text-warning border-warning/20" },
  theft: { label: "Vol", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const SortiesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: disposals, isLoading } = useAssetDisposals();
  const { data: assets } = useAssets();

  const getAssetInfo = (assetId: string) => {
    return assets?.find(a => a.id === assetId);
  };

  const filteredDisposals = disposals?.filter((disp) => {
    const asset = (disp as any).asset;
    return asset?.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
           asset?.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
           disp.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  // Calculate summary stats
  const totalDisposalValue = filteredDisposals.reduce((sum, d) => sum + (d.disposal_value || 0), 0);
  const totalGainLoss = filteredDisposals.reduce((sum, d) => sum + (d.gain_loss || 0), 0);

  return (
    <AppLayout 
      title="Sorties & Réformes" 
      subtitle="Gestion des sorties d'actifs"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <FileX className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filteredDisposals.length}</p>
                  <p className="text-sm text-muted-foreground">Sorties enregistrées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <DollarSign className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalDisposalValue)}</p>
                  <p className="text-sm text-muted-foreground">Valeur des cessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${totalGainLoss >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {totalGainLoss >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div>
                  <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(totalGainLoss)}
                  </p>
                  <p className="text-sm text-muted-foreground">Plus/Moins-values</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Rechercher une sortie..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Button variant="gradient" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Enregistrer une sortie
          </Button>
        </div>

        {/* Disposals Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registre des Sorties</CardTitle>
            <CardDescription>
              Historique des sorties et réformes d'actifs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredDisposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileX className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Aucune sortie enregistrée</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enregistrez la sortie d'un actif
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Enregistrer une sortie
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Actif</th>
                      <th>Type</th>
                      <th className="text-right">VNC sortie</th>
                      <th className="text-right">Valeur cession</th>
                      <th className="text-right">+/- Value</th>
                      <th>Acquéreur</th>
                      <th>Motif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDisposals.map((disp) => {
                      const asset = (disp as any).asset;
                      const typeConfig = disposalTypeConfig[disp.disposal_type] || 
                        { label: disp.disposal_type, className: "bg-muted" };
                      const gainLoss = disp.gain_loss || 0;
                      
                      return (
                        <tr key={disp.id}>
                          <td className="text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(disp.disposal_date).toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td>
                            <div>
                              <p className="font-medium">{asset?.code}</p>
                              <p className="text-xs text-muted-foreground">{asset?.designation}</p>
                            </div>
                          </td>
                          <td>
                            <Badge variant="outline" className={typeConfig.className}>
                              {typeConfig.label}
                            </Badge>
                          </td>
                          <td className="text-right font-mono">
                            {formatCurrency(disp.net_book_value_at_disposal || 0)}
                          </td>
                          <td className="text-right font-mono">
                            {formatCurrency(disp.disposal_value || 0)}
                          </td>
                          <td className={`text-right font-mono ${gainLoss >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                          </td>
                          <td className="text-sm">
                            {disp.buyer_name || '-'}
                          </td>
                          <td className="text-sm text-muted-foreground">
                            {disp.reason || '-'}
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

      <DisposalDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
};

export default SortiesPage;
