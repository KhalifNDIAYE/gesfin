import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PermissionButton, PermissionGate } from '@/components/auth/PermissionButton';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, Clock, DollarSign, AlertTriangle, Plus, Search, 
  Building2, Calendar, Edit, Eye 
} from 'lucide-react';
import { useContracts, useContractStats, Contract } from '@/hooks/useContracts';
import { ContractDialog } from '@/components/marches/ContractDialog';
import { formatCurrency } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const contractTypeConfig: Record<string, { label: string; className: string }> = {
  works: { label: 'Travaux', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  supplies: { label: 'Fournitures', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  services: { label: 'Services', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  studies: { label: 'Études', className: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
};

const contractStatusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText },
  in_progress: { label: 'En cours', className: 'bg-green-100 text-green-700 border-green-200', icon: Clock },
  completed: { label: 'Terminé', className: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: FileText },
  suspended: { label: 'Suspendu', className: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  terminated: { label: 'Résilié', className: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
  disputed: { label: 'Litige', className: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle },
};

export default function MarchesPage() {
  const navigate = useNavigate();
  const { data: contracts = [], isLoading } = useContracts();
  const { data: stats } = useContractStats();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  const filteredContracts = contracts.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.object.toLowerCase().includes(search.toLowerCase()) ||
      (c.supplier_name && c.supplier_name.toLowerCase().includes(search.toLowerCase()))
  );

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

  return (
    <AppLayout title="Gestion des Marchés" subtitle="Suivi des contrats et marchés publics">
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-sm text-muted-foreground">Total marchés</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.inProgress || 0}</p>
                <p className="text-sm text-muted-foreground">En cours</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-purple-100">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatAmount(stats?.totalAmount || 0)}</p>
                <p className="text-sm text-muted-foreground">Montant total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.disputed || 0}</p>
                <p className="text-sm text-muted-foreground">En litige</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un marché..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <PermissionButton module="marches" permission="create" onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau marché
          </PermissionButton>
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Chargement...</CardContent></Card>
          ) : filteredContracts.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun marché trouvé</CardContent></Card>
          ) : (
            filteredContracts.map((contract) => {
              const typeConfig = contractTypeConfig[contract.contract_type] || contractTypeConfig.works;
              const statusConfig = contractStatusConfig[contract.status] || contractStatusConfig.draft;
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={contract.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm text-muted-foreground">{contract.code}</span>
                          <Badge variant="outline" className={typeConfig.className}>
                            {typeConfig.label}
                          </Badge>
                          <Badge variant="outline" className={statusConfig.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg">{contract.object}</h3>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                          {contract.supplier_name && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              {contract.supplier_name}
                            </span>
                          )}
                          {contract.start_date && contract.end_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {contract.start_date} → {contract.end_date}
                            </span>
                          )}
                          <span className="font-semibold text-foreground">
                            {formatAmount(contract.total_amount)} FCFA
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 min-w-[150px]">
                        <div className="text-right">
                          <span className="text-sm text-muted-foreground">Avancement</span>
                          <span className="ml-2 font-semibold">{contract.progress_percentage || 0}%</span>
                        </div>
                        <Progress value={contract.progress_percentage || 0} className="w-32 h-2" />
                        <div className="flex gap-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/marches/${contract.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <PermissionGate module="marches" permission="update">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(contract)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PermissionGate>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <ContractDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          contract={selectedContract}
        />
      </div>
    </AppLayout>
  );
}
