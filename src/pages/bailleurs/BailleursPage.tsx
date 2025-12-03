import { useState, useMemo } from "react";
import { Plus, Search, Download, Building2, Mail, Phone, FileText, ExternalLink, Globe, Edit, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useBailleurs, useDeleteBailleur, useConventions, Bailleur } from "@/hooks/useConventionsBailleurs";
import { BailleurDialog } from "@/components/bailleurs/BailleurDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { PermissionButton, PermissionGate, useModulePermissions } from "@/components/auth/PermissionButton";
const bailleurTypeLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  bilateral: { label: "Bilatéral", variant: "default" },
  multilateral: { label: "Multilatéral", variant: "secondary" },
  ong: { label: "ONG", variant: "outline" },
  prive: { label: "Privé", variant: "outline" },
};

export default function BailleursPage() {
  const { data: bailleurs, isLoading } = useBailleurs();
  const { data: conventions } = useConventions();
  const deleteBailleur = useDeleteBailleur();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBailleur, setSelectedBailleur] = useState<Bailleur | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { canCreate, canUpdate, canDelete, canExport } = useModulePermissions('bailleurs');

  // Calculate stats
  const stats = useMemo(() => {
    if (!bailleurs || !conventions) return { total: 0, activeConventions: 0, totalFinancing: 0, inNegotiation: 0 };
    
    const activeConventions = conventions.filter(c => c.status === "active").length;
    const totalFinancing = conventions.reduce((acc, c) => acc + (c.total_amount || 0), 0);
    const inNegotiation = conventions.filter(c => c.status === "draft").length;
    
    return {
      total: bailleurs.length,
      activeConventions,
      totalFinancing,
      inNegotiation,
    };
  }, [bailleurs, conventions]);

  // Calculate stats per bailleur
  const bailleurStats = useMemo(() => {
    if (!conventions) return {};
    const statsMap: Record<string, { totalFinancing: number; activeProjects: number; conventionsCount: number }> = {};
    
    conventions.forEach(c => {
      if (!statsMap[c.bailleur_id]) {
        statsMap[c.bailleur_id] = { totalFinancing: 0, activeProjects: 0, conventionsCount: 0 };
      }
      statsMap[c.bailleur_id].totalFinancing += c.total_amount || 0;
      statsMap[c.bailleur_id].conventionsCount += 1;
      if (c.status === "active") {
        statsMap[c.bailleur_id].activeProjects += 1;
      }
    });
    
    return statsMap;
  }, [conventions]);

  // Filter bailleurs
  const filteredBailleurs = useMemo(() => {
    if (!bailleurs) return [];
    if (!searchQuery) return bailleurs;
    
    const query = searchQuery.toLowerCase();
    return bailleurs.filter(b => 
      b.name.toLowerCase().includes(query) ||
      b.code.toLowerCase().includes(query) ||
      b.short_name?.toLowerCase().includes(query)
    );
  }, [bailleurs, searchQuery]);

  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)} Mrd`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} M`;
    }
    return new Intl.NumberFormat("fr-FR").format(amount);
  };

  const getInitials = (name: string, code: string) => {
    if (code.length <= 4) return code;
    return name.split(' ').map(w => w[0]).join('').substring(0, 3).toUpperCase();
  };

  const handleEdit = (bailleur: Bailleur) => {
    if (!canUpdate) return;
    setSelectedBailleur(bailleur);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    if (!canCreate) return;
    setSelectedBailleur(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteBailleur.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <AppLayout title="Bailleurs de Fonds" subtitle="Gestion des partenaires techniques et financiers">
      <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Bailleurs</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
              <FileText className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conventions Actives</p>
              <p className="text-2xl font-bold">{stats.activeConventions}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <Globe className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Financement Total</p>
              <p className="text-2xl font-bold">{formatAmount(stats.totalFinancing)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10">
              <FileText className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En négociation</p>
              <p className="text-2xl font-bold">{stats.inNegotiation}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un bailleur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <PermissionButton module="bailleurs" permission="export" variant="outline">
            <Download className="mr-2 h-4 w-4" /> Exporter
          </PermissionButton>
          <PermissionButton module="bailleurs" permission="create" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un bailleur
          </PermissionButton>
        </div>
      </div>

      {/* Bailleurs Grid */}
      {isLoading ? (
        <div className="text-center py-12">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBailleurs.map((bailleur) => {
            const bStats = bailleurStats[bailleur.id] || { totalFinancing: 0, activeProjects: 0, conventionsCount: 0 };
            const typeInfo = bailleurTypeLabels[bailleur.bailleur_type] || { label: bailleur.bailleur_type, variant: "outline" as const };
            
            return (
              <Card key={bailleur.id} className="bg-card border hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-lg">
                      {getInitials(bailleur.name, bailleur.code)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{bailleur.name}</h3>
                      <p className="text-sm text-muted-foreground">{bailleur.country?.name || "International"}</p>
                      <Badge variant={typeInfo.variant} className="mt-1">
                        {typeInfo.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Financement total</p>
                      <p className="text-lg font-bold">{formatAmount(bStats.totalFinancing)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Projets actifs</p>
                      <p className="text-lg font-bold">{bStats.activeProjects}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground">Conventions</p>
                    <p className="text-lg font-bold">{bStats.conventionsCount}</p>
                  </div>

                  {(bailleur.email || bailleur.phone) && (
                    <div className="space-y-2 mb-4 pt-4 border-t">
                      {bailleur.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{bailleur.email}</span>
                        </div>
                      )}
                      {bailleur.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{bailleur.phone}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/conventions?bailleur=${bailleur.id}`)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Conventions
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate(`/bailleurs/${bailleur.id}`)}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Détails
                    </Button>
                    <PermissionGate module="bailleurs" permission="update">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(bailleur)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </PermissionGate>
                    <PermissionGate module="bailleurs" permission="delete">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDeleteId(bailleur.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </PermissionGate>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {filteredBailleurs.length === 0 && !isLoading && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun bailleur trouvé
        </div>
      )}

      <BailleurDialog open={dialogOpen} onOpenChange={setDialogOpen} bailleur={selectedBailleur} />

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
