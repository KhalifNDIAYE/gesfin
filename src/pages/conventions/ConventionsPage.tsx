import { useState, useMemo } from "react";
import { Plus, Search, Download, FileText, CheckCircle, AlertTriangle, Clock, XCircle, Eye, Pencil, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConventions, useDeleteConvention, useBailleurs, Convention } from "@/hooks/useConventionsBailleurs";
import { useProjects } from "@/hooks/useProjects";
import { ConventionDialog } from "@/components/conventions/ConventionDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { PermissionButton, useModulePermissions } from "@/components/auth/PermissionButton";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  draft: { label: "Brouillon", variant: "secondary", icon: FileText },
  active: { label: "Active", variant: "default", icon: CheckCircle },
  suspended: { label: "Suspendue", variant: "destructive", icon: XCircle },
  closed: { label: "Clôturée", variant: "outline", icon: XCircle },
  expired: { label: "Expirée", variant: "destructive", icon: Clock },
  expiring: { label: "Expire bientôt", variant: "outline", icon: AlertTriangle },
};

export default function ConventionsPage() {
  const { data: conventions, isLoading } = useConventions();
  const { data: bailleurs } = useBailleurs();
  const { projects } = useProjects();
  const deleteConvention = useDeleteConvention();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConvention, setSelectedConvention] = useState<Convention | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filters
  const [bailleurFilter, setBailleurFilter] = useState<string>("all");
  const [projetFilter, setProjetFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { canCreate, canExport, canUpdate, canDelete } = useModulePermissions('conventions');

  const urlBailleurFilter = searchParams.get("bailleur");

  // Calculate stats
  const stats = useMemo(() => {
    if (!conventions) return { active: 0, expiringSoon: 0, expired: 0, inNegotiation: 0 };
    
    const now = new Date();
    let expiringSoon = 0;
    let expired = 0;
    
    conventions.forEach(c => {
      if (c.closing_date) {
        const closingDate = new Date(c.closing_date);
        const daysUntilClose = differenceInDays(closingDate, now);
        if (daysUntilClose < 0 && c.status === "active") {
          expired++;
        } else if (daysUntilClose <= 90 && daysUntilClose >= 0 && c.status === "active") {
          expiringSoon++;
        }
      }
    });
    
    return {
      active: conventions.filter(c => c.status === "active").length,
      expiringSoon,
      expired,
      inNegotiation: conventions.filter(c => c.status === "draft").length,
    };
  }, [conventions]);

  const getConventionStatus = (convention: Convention): string => {
    if (!convention.closing_date) return convention.status;
    
    const now = new Date();
    const closingDate = new Date(convention.closing_date);
    const daysUntilClose = differenceInDays(closingDate, now);
    
    if (daysUntilClose < 0 && convention.status === "active") {
      return "expired";
    }
    if (daysUntilClose <= 90 && daysUntilClose >= 0 && convention.status === "active") {
      return "expiring";
    }
    return convention.status;
  };

  // Filter conventions
  const filteredConventions = useMemo(() => {
    if (!conventions) return [];
    let filtered = conventions;
    
    // URL bailleur filter (from navigation)
    if (urlBailleurFilter) {
      filtered = filtered.filter(c => c.bailleur_id === urlBailleurFilter);
    }
    
    // Dropdown bailleur filter
    if (bailleurFilter && bailleurFilter !== "all") {
      filtered = filtered.filter(c => c.bailleur_id === bailleurFilter);
    }
    
    // Project filter - Note: conventions don't have direct project link, so we skip if not available
    // This would need a project_conventions join table in DB
    
    // Status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(c => {
        const displayStatus = getConventionStatus(c);
        return displayStatus === statusFilter;
      });
    }
    
    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        c.bailleur?.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [conventions, searchQuery, urlBailleurFilter, bailleurFilter, statusFilter]);

  const formatAmount = (amount: number, currencyCode?: string) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + " " + (currencyCode || "FCFA");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setSelectedConvention(null);
    setDialogOpen(true);
  };

  const handleEdit = (convention: Convention) => {
    if (!canUpdate) return;
    setSelectedConvention(convention);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteConvention.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const clearFilters = () => {
    setBailleurFilter("all");
    setProjetFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
  };

  return (
    <AppLayout title="Conventions" subtitle="Gestion des accords de financement">
      <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.active}</p>
              <p className="text-sm text-muted-foreground">Actives</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expiringSoon}</p>
              <p className="text-sm text-muted-foreground">Expirent bientôt</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <Clock className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.expired}</p>
              <p className="text-sm text-muted-foreground">Expirées</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.inNegotiation}</p>
              <p className="text-sm text-muted-foreground">En négociation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro, nom..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Bailleur Filter */}
            <Select value={bailleurFilter} onValueChange={setBailleurFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Bailleur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les bailleurs</SelectItem>
                {bailleurs?.map((bailleur) => (
                  <SelectItem key={bailleur.id} value={bailleur.id}>
                    {bailleur.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Project Filter */}
            <Select value={projetFilter} onValueChange={setProjetFilter}>
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
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expire bientôt</SelectItem>
                <SelectItem value="expired">Expirée</SelectItem>
                <SelectItem value="suspended">Suspendue</SelectItem>
                <SelectItem value="closed">Clôturée</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Actions Row */}
          <div className="flex justify-between items-center mt-4">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Réinitialiser les filtres
            </Button>
            <div className="flex gap-2">
              <PermissionButton module="conventions" permission="export" variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" /> Exporter
              </PermissionButton>
              <PermissionButton module="conventions" permission="create" size="sm" onClick={handleAdd}>
                <Plus className="mr-2 h-4 w-4" /> Nouvelle convention
              </PermissionButton>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conventions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Conventions ({filteredConventions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">Chargement...</div>
          ) : filteredConventions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucune convention trouvée
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Bailleur</TableHead>
                    <TableHead>Projet</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConventions.map((convention) => {
                    const displayStatus = getConventionStatus(convention);
                    const statusInfo = statusConfig[displayStatus] || statusConfig.draft;
                    const StatusIcon = statusInfo.icon;

                    return (
                      <TableRow key={convention.id}>
                        <TableCell className="font-mono font-medium">
                          {convention.code}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{convention.bailleur?.name || "-"}</div>
                            {convention.bailleur?.short_name && (
                              <div className="text-xs text-muted-foreground">{convention.bailleur.short_name}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground">-</span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(convention.total_amount, convention.currency?.code)}
                        </TableCell>
                        <TableCell>
                          {formatDate(convention.effective_date)}
                        </TableCell>
                        <TableCell>
                          {formatDate(convention.closing_date)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/conventions/${convention.id}`)}
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canUpdate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(convention)}
                                title="Modifier"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteId(convention.id)}
                                title="Supprimer"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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

      <ConventionDialog open={dialogOpen} onOpenChange={setDialogOpen} convention={selectedConvention} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AppLayout>
  );
}
