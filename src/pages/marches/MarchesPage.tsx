import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PermissionButton, PermissionGate } from '@/components/auth/PermissionButton';
import { 
  FileText, Clock, DollarSign, AlertTriangle, Plus, Search, 
  Eye, Pencil, Trash2
} from 'lucide-react';
import { useContracts, useContractStats, Contract, useContractMutations } from '@/hooks/useContracts';
import { useProjects } from '@/hooks/useProjects';
import { ContractDialog } from '@/components/marches/ContractDialog';
import { formatCurrency } from '@/lib/utils';
import { getContractFinancialSummary } from '@/lib/contractCalculations';
import { useNavigate } from 'react-router-dom';
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
import { TableExportButtons, ExportColumn } from "@/components/export/TableExportButtons";

const contractStatusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'En cours', className: 'bg-success/10 text-success border-success/20' },
  completed: { label: 'Terminé', className: 'bg-info/10 text-info border-info/20' },
  suspended: { label: 'Suspendu', className: 'bg-warning/10 text-warning border-warning/20' },
  terminated: { label: 'Résilié', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  disputed: { label: 'Litige', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function MarchesPage() {
  const navigate = useNavigate();
  const { data: contracts = [], isLoading } = useContracts();
  const { data: stats } = useContractStats();
  const { projects } = useProjects();
  const { deleteContract } = useContractMutations();
  
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Filters
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Get unique suppliers from contracts
  const suppliers = useMemo(() => {
    const supplierMap = new Map<string, string>();
    contracts.forEach(c => {
      if (c.supplier_id && c.supplier_name) {
        supplierMap.set(c.supplier_id, c.supplier_name);
      }
    });
    return Array.from(supplierMap.entries()).map(([id, name]) => ({ id, name }));
  }, [contracts]);

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const matchesSearch = 
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        c.object.toLowerCase().includes(search.toLowerCase()) ||
        (c.supplier_name && c.supplier_name.toLowerCase().includes(search.toLowerCase()));
      
      const matchesProject = projectFilter === "all" || c.project_id === projectFilter;
      const matchesSupplier = supplierFilter === "all" || c.supplier_id === supplierFilter;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      
      return matchesSearch && matchesProject && matchesSupplier && matchesStatus;
    });
  }, [contracts, search, projectFilter, supplierFilter, statusFilter]);

  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) {
      return `${(amount / 1000000000).toFixed(1)} Mrd`;
    }
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(0)} M`;
    }
    return formatCurrency(amount);
  };

  const handleEdit = (contract: Contract) => {
    setSelectedContract(contract);
    setDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedContract(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteContract.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const clearFilters = () => {
    setProjectFilter("all");
    setSupplierFilter("all");
    setStatusFilter("all");
    setSearch("");
  };

  return (
    <AppLayout title="Gestion des Marchés" subtitle="Suivi des contrats et marchés publics">
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total marchés</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.inProgress || 0}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <DollarSign className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatAmount(stats?.totalAmount || 0)}</p>
                <p className="text-sm text-muted-foreground">Montant total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.disputed || 0}</p>
                <p className="text-sm text-muted-foreground">En litige</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro, objet..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
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
              
              {/* Supplier Filter */}
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Fournisseur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les fournisseurs</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
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
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="terminated">Résilié</SelectItem>
                  <SelectItem value="disputed">Litige</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Actions Row */}
            <div className="flex justify-between items-center mt-4">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Réinitialiser les filtres
              </Button>
              <div className="flex gap-2">
                <TableExportButtons
                  data={filteredContracts.map(c => {
                    const fin = getContractFinancialSummary(c);
                    return {
                      ...c,
                      projectName: projects?.find(p => p.id === c.project_id)?.name || "-",
                      statusLabel: contractStatusConfig[c.status]?.label || c.status,
                      totalAmount: fin.calculated.total_amount,
                      paidAmount: fin.paidAmount,
                      remainingAmount: fin.calculated.remaining_amount,
                    };
                  })}
                  columns={[
                    { key: "code", label: "Numéro" },
                    { key: "supplier_name", label: "Fournisseur" },
                    { key: "projectName", label: "Projet" },
                    { key: "totalAmount", label: "Montant", format: (v) => formatCurrency(v) },
                    { key: "paidAmount", label: "Payé", format: (v) => formatCurrency(v) },
                    { key: "remainingAmount", label: "Reste", format: (v) => formatCurrency(v) },
                    { key: "statusLabel", label: "Statut" },
                  ] as ExportColumn[]}
                  filename="marches"
                  title="Liste des Marchés"
                  subtitle={`${filteredContracts.length} marchés`}
                />
                <PermissionButton module="marches" permission="create" size="sm" onClick={handleNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau marché
                </PermissionButton>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contracts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Marchés ({filteredContracts.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Chargement...</div>
            ) : filteredContracts.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">Aucun marché trouvé</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Projet</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead className="text-right">Payé</TableHead>
                      <TableHead className="text-right">Reste</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((contract) => {
                      const statusConfig = contractStatusConfig[contract.status] || contractStatusConfig.draft;
                      const project = projects?.find(p => p.id === contract.project_id);
                      
                      // Use centralized financial calculations for consistency
                      const financials = getContractFinancialSummary(contract);

                      return (
                        <TableRow key={contract.id}>
                          <TableCell>
                            <div>
                              <div className="font-mono font-medium">{contract.code}</div>
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {contract.object}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {contract.supplier_name || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {project?.name || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {formatCurrency(financials.calculated.total_amount)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-green-600">
                            {formatCurrency(financials.paidAmount)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-orange-600">
                            {formatCurrency(financials.calculated.remaining_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusConfig.className}>
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/marches/${contract.id}`)}
                                title="Voir détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <PermissionGate module="marches" permission="update">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(contract)}
                                  title="Modifier"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                              <PermissionGate module="marches" permission="delete">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteId(contract.id)}
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

        <ContractDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          contract={selectedContract}
        />

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le marché sera définitivement supprimé.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
