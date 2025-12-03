import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Package,
  Car,
  Building,
  Monitor,
  Wrench,
  Download,
  QrCode,
  Edit,
  Trash2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useAssets, useAssetStats, useAssetCategories, useAssetMutations } from "@/hooks/useAssets";
import { AssetDialog } from "@/components/immobilisations/AssetDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Asset } from "@/hooks/useAssets";
import { PermissionButton, PermissionGate, useModulePermissions } from "@/components/auth/PermissionButton";

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'VEH': Car,
  'MOB': Package,
  'INF': Monitor,
  'BAT': Building,
  'EQP': Wrench,
};

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "En service", className: "bg-success/10 text-success border-success/20" },
  maintenance: { label: "En maintenance", className: "bg-warning/10 text-warning border-warning/20" },
  disposed: { label: "Sorti", className: "bg-destructive/10 text-destructive border-destructive/20" },
  inactive: { label: "Inactif", className: "bg-muted text-muted-foreground" },
};

const Immobilisations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const { canCreate, canUpdate, canDelete, canExport } = useModulePermissions('immobilisations');

  const { data: assets, isLoading } = useAssets();
  const { data: stats } = useAssetStats();
  const { data: categories } = useAssetCategories();
  const { deleteMutation } = useAssetMutations();

  const filteredAssets = assets?.filter((asset) => {
    const matchesSearch = 
      asset.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.brand?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || asset.category_id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  }) || [];

  const handleEdit = (asset: Asset) => {
    if (!canUpdate) return;
    setSelectedAsset(asset);
    setDialogOpen(true);
  };

  const handleDelete = (asset: Asset) => {
    if (!canDelete) return;
    setAssetToDelete(asset);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (assetToDelete) {
      deleteMutation.mutate(assetToDelete.id);
      setDeleteDialogOpen(false);
      setAssetToDelete(null);
    }
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setSelectedAsset(null);
    setDialogOpen(true);
  };

  const getCategoryIcon = (categoryCode?: string) => {
    if (!categoryCode) return Package;
    const prefix = categoryCode.substring(0, 3).toUpperCase();
    return categoryIcons[prefix] || Package;
  };

  return (
    <AppLayout 
      title="Immobilisations" 
      subtitle="Gestion du patrimoine et des actifs"
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
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.totalCount || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Total actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Building className="h-5 w-5 text-success" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">{formatCurrency(stats?.totalGrossValue || 0)}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Valeur brute</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <Monitor className="h-5 w-5 text-info" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">{formatCurrency(stats?.totalNetBookValue || 0)}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Valeur nette comptable</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Wrench className="h-5 w-5 text-warning" />
                </div>
                <div>
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.maintenanceCount || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">En maintenance</p>
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
                placeholder="Rechercher (code, désignation, marque, N° série)..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">En service</SelectItem>
                <SelectItem value="maintenance">En maintenance</SelectItem>
                <SelectItem value="disposed">Sorti</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <QrCode className="h-4 w-4" />
              Scanner
            </Button>
            <PermissionButton module="immobilisations" permission="export" variant="outline">
              <Download className="h-4 w-4" />
              Exporter
            </PermissionButton>
            <PermissionButton module="immobilisations" permission="create" variant="gradient" onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              Ajouter un actif
            </PermissionButton>
          </div>
        </div>

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registre des Immobilisations</CardTitle>
            <CardDescription>
              {filteredAssets.length} actif(s) trouvé(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Aucun actif trouvé</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                    ? "Modifiez vos filtres ou ajoutez un nouvel actif"
                    : "Commencez par ajouter votre premier actif"}
                </p>
                <PermissionButton module="immobilisations" permission="create" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un actif
                </PermissionButton>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Désignation</th>
                      <th>Catégorie</th>
                      <th>Acquisition</th>
                      <th className="text-right">Valeur brute</th>
                      <th className="text-right">VNC</th>
                      <th>Localisation</th>
                      <th>Statut</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset) => {
                      const CategoryIcon = getCategoryIcon(asset.category?.code);
                      const status = statusConfig[asset.status] || statusConfig.inactive;
                      
                      return (
                        <tr key={asset.id}>
                          <td className="font-mono text-sm font-medium">{asset.code}</td>
                          <td>
                            <div>
                              <p className="font-medium">{asset.designation}</p>
                              {asset.brand && (
                                <p className="text-xs text-muted-foreground">
                                  {asset.brand} {asset.model}
                                </p>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="h-4 w-4 text-primary" />
                              <span className="text-sm">{asset.category?.name || '-'}</span>
                            </div>
                          </td>
                          <td className="text-sm text-muted-foreground">
                            {new Date(asset.acquisition_date).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="text-right font-mono">
                            {formatCurrency(asset.acquisition_value)}
                          </td>
                          <td className="text-right font-mono">
                            {formatCurrency(asset.net_book_value || 0)}
                          </td>
                          <td className="text-sm">
                            {asset.location?.name || asset.site?.name || '-'}
                          </td>
                          <td>
                            <Badge variant="outline" className={status.className}>
                              {status.label}
                            </Badge>
                          </td>
                          <td>
                            <div className="flex items-center justify-end gap-1">
                              <PermissionGate module="immobilisations" permission="update">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEdit(asset)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              <PermissionGate module="immobilisations" permission="delete">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDelete(asset)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </PermissionGate>
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

      <AssetDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        asset={selectedAsset}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'actif</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'actif "{assetToDelete?.designation}" ? 
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Immobilisations;
