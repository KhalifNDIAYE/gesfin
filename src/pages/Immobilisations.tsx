import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Search, 
  Package,
  Building,
  Monitor,
  Wrench,
  QrCode,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useAssets, useAssetStats, useAssetCategories, useAssetMutations, Asset } from "@/hooks/useAssets";
import { useProjects } from "@/hooks/useProjects";
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
import { PermissionButton, PermissionGate, useModulePermissions } from "@/components/auth/PermissionButton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TableExportButtons, ExportColumn } from "@/components/export/TableExportButtons";

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "En service", className: "bg-success/10 text-success border-success/20" },
  maintenance: { label: "En maintenance", className: "bg-warning/10 text-warning border-warning/20" },
  disposed: { label: "Sorti", className: "bg-destructive/10 text-destructive border-destructive/20" },
  inactive: { label: "Inactif", className: "bg-muted text-muted-foreground" },
};

const Immobilisations = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const { canCreate, canUpdate, canDelete, canExport } = useModulePermissions('immobilisations');

  const { data: assets, isLoading } = useAssets();
  const { data: stats } = useAssetStats();
  const { projects } = useProjects();
  const { deleteMutation } = useAssetMutations();

  const filteredAssets = assets?.filter((asset) => {
    const matchesSearch = 
      asset.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (asset.brand?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (asset.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesProject = projectFilter === "all" || asset.project_id === projectFilter;
    
    return matchesSearch && matchesStatus && matchesProject;
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setProjectFilter("all");
    setSearchQuery("");
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

        {/* Filters Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher par code, libellé..." 
                  className="pl-9" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Project Filter */}
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">En service</SelectItem>
                  <SelectItem value="maintenance">En maintenance</SelectItem>
                  <SelectItem value="disposed">Sorti</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Actions Row */}
            <div className="flex justify-between items-center mt-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Réinitialiser les filtres
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <QrCode className="h-4 w-4 mr-2" />
                  Scanner
                </Button>
                <TableExportButtons
                  data={filteredAssets.map(a => ({
                    ...a,
                    projectName: projects?.find(p => p.id === a.project_id)?.name || "-",
                    statusLabel: statusConfig[a.status]?.label || a.status,
                    usefulLife: a.useful_life_years ? `${a.useful_life_years} ans` : "-",
                  }))}
                  columns={[
                    { key: "code", label: "Code" },
                    { key: "designation", label: "Libellé" },
                    { key: "projectName", label: "Projet" },
                    { key: "acquisition_value", label: "Valeur", format: (v) => formatCurrency(v) },
                    { key: "acquisition_date", label: "Date acquisition", format: (v) => v ? format(new Date(v), "dd/MM/yyyy") : "-" },
                    { key: "usefulLife", label: "Durée" },
                    { key: "accumulated_depreciation", label: "Amortissement", format: (v) => formatCurrency(v || 0) },
                    { key: "statusLabel", label: "Statut" },
                  ] as ExportColumn[]}
                  filename="immobilisations"
                  title="Registre des Immobilisations"
                  subtitle={`${filteredAssets.length} actifs`}
                />
                <PermissionButton module="immobilisations" permission="create" size="sm" onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un actif
                </PermissionButton>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registre des Immobilisations ({filteredAssets.length})</CardTitle>
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
                  {searchQuery || statusFilter !== "all" || projectFilter !== "all"
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Projet</TableHead>
                      <TableHead className="text-right">Valeur</TableHead>
                      <TableHead>Date acquisition</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead className="text-right">Amortissement</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssets.map((asset) => {
                      const status = statusConfig[asset.status] || statusConfig.inactive;
                      const project = projects?.find(p => p.id === asset.project_id);
                      
                      return (
                        <TableRow key={asset.id}>
                          <TableCell className="font-mono font-medium">
                            {asset.code}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{asset.designation}</p>
                              {asset.brand && (
                                <p className="text-xs text-muted-foreground">
                                  {asset.brand} {asset.model}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {project?.name || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(asset.acquisition_value)}
                          </TableCell>
                          <TableCell>
                            {formatDate(asset.acquisition_date)}
                          </TableCell>
                          <TableCell>
                            {asset.useful_life_years ? `${asset.useful_life_years} ans` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(asset.accumulated_depreciation || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={status.className}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                title="Voir détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <PermissionGate module="immobilisations" permission="update">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEdit(asset)}
                                  title="Modifier"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              <PermissionGate module="immobilisations" permission="delete">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDelete(asset)}
                                  title="Supprimer"
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
