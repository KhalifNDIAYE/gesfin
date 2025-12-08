import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBudgetTransfers, BudgetTransfer } from '@/hooks/useBudgetTransfers';
import { BudgetTransferDialog } from '@/components/budget/BudgetTransferDialog';
import { BudgetTransferValidationDialog } from '@/components/budget/BudgetTransferValidationDialog';
import { 
  Plus, 
  Search, 
  ArrowRightLeft, 
  Clock, 
  Check, 
  X,
  Eye,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_director: { label: 'Attente Directeur', variant: 'secondary' },
  pending_admin: { label: 'Attente Admin', variant: 'default' },
  approved: { label: 'Exécuté', variant: 'outline' },
  rejected: { label: 'Rejeté', variant: 'destructive' },
  cancelled: { label: 'Annulé', variant: 'secondary' },
};

export default function BudgetTransfersPage() {
  const { transfers, isLoading, refetch } = useBudgetTransfers();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<BudgetTransfer | null>(null);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTransfers = transfers.filter(transfer => {
    const matchesSearch = 
      transfer.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.requester?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    pending: transfers.filter(t => t.status === 'pending_director' || t.status === 'pending_admin').length,
    approved: transfers.filter(t => t.status === 'approved').length,
    rejected: transfers.filter(t => t.status === 'rejected').length,
  };

  const handleViewTransfer = (transfer: BudgetTransfer) => {
    setSelectedTransfer(transfer);
    setValidationDialogOpen(true);
  };

  return (
    <AppLayout 
      title="Transferts Budgétaires" 
      subtitle="Gestion des transferts entre lignes budgétaires avec double validation"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transfers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Check className="h-4 w-4" />
                Exécutés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <X className="h-4 w-4" />
                Rejetés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5" />
                  Liste des Transferts
                </CardTitle>
                <CardDescription>
                  Transferts nécessitant validation Directeur + Administrateur
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau transfert
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par code, justification, demandeur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="pending_director">Attente Directeur</SelectItem>
                  <SelectItem value="pending_admin">Attente Admin</SelectItem>
                  <SelectItem value="approved">Exécutés</SelectItem>
                  <SelectItem value="rejected">Rejetés</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTransfers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun transfert trouvé</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Source → Destination</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Demandeur</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransfers.map((transfer) => {
                      const status = statusConfig[transfer.status] || statusConfig.pending_director;
                      return (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-mono font-medium">
                            {transfer.code}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm truncate max-w-[120px]" title={transfer.source_budget_line?.description}>
                                {transfer.source_budget_line?.description || 'N/A'}
                              </span>
                              <ArrowRightLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm truncate max-w-[120px]" title={transfer.destination_budget_line?.description}>
                                {transfer.destination_budget_line?.description || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {transfer.amount.toLocaleString()} XOF
                          </TableCell>
                          <TableCell>
                            {transfer.requester?.full_name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(transfer.created_at), 'dd/MM/yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewTransfer(transfer)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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

      {/* Dialogs */}
      <BudgetTransferDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
      />
      
      <BudgetTransferValidationDialog
        transfer={selectedTransfer}
        open={validationDialogOpen}
        onOpenChange={setValidationDialogOpen}
      />
    </AppLayout>
  );
}
