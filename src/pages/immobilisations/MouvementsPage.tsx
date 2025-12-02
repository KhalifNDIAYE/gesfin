import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  ArrowRightLeft,
  MapPin,
  User,
  Calendar,
  FileText
} from "lucide-react";
import { useAssetMovements, useAssets } from "@/hooks/useAssets";
import { Skeleton } from "@/components/ui/skeleton";
import { MovementDialog } from "@/components/immobilisations/MovementDialog";

const movementTypeConfig: Record<string, { label: string; className: string }> = {
  transfer: { label: "Transfert", className: "bg-info/10 text-info border-info/20" },
  assignment: { label: "Affectation", className: "bg-success/10 text-success border-success/20" },
  return: { label: "Retour", className: "bg-warning/10 text-warning border-warning/20" },
  maintenance: { label: "Maintenance", className: "bg-accent/10 text-accent border-accent/20" },
};

const MouvementsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: movements, isLoading } = useAssetMovements();
  const { data: assets } = useAssets();

  const getAssetInfo = (assetId: string) => {
    return assets?.find(a => a.id === assetId);
  };

  const filteredMovements = movements?.filter((mov) => {
    const asset = getAssetInfo(mov.asset_id);
    return asset?.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
           asset?.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
           mov.reason?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <AppLayout 
      title="Mouvements" 
      subtitle="Historique des mouvements et affectations"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un mouvement..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Button variant="gradient" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Enregistrer un mouvement
          </Button>
        </div>

        {/* Movements Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des Mouvements</CardTitle>
            <CardDescription>
              {filteredMovements.length} mouvement(s) enregistré(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ArrowRightLeft className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Aucun mouvement enregistré</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Enregistrez le premier mouvement d'un actif
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Enregistrer un mouvement
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
                      <th>Origine</th>
                      <th>Destination</th>
                      <th>Motif</th>
                      <th>Référence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovements.map((mov) => {
                      const asset = getAssetInfo(mov.asset_id);
                      const typeConfig = movementTypeConfig[mov.movement_type] || 
                        { label: mov.movement_type, className: "bg-muted" };
                      
                      return (
                        <tr key={mov.id}>
                          <td className="text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {new Date(mov.movement_date).toLocaleDateString('fr-FR')}
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
                          <td className="text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {(mov as any).from_location?.name || '-'}
                            </div>
                          </td>
                          <td className="text-sm">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {(mov as any).to_location?.name || '-'}
                            </div>
                          </td>
                          <td className="text-sm text-muted-foreground">
                            {mov.reason || '-'}
                          </td>
                          <td className="text-sm font-mono">
                            {mov.document_reference || '-'}
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

      <MovementDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
};

export default MouvementsPage;
