import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, Edit, FileText, DollarSign, Shield, Calendar,
  Building2, Plus, Pencil, Trash2
} from 'lucide-react';
import { 
  useContract, useContractDecomptes, useContractPayments, 
  useContractGuarantees, useContractEngagements,
  useDecompteMutations, usePaymentMutations, useGuaranteeMutations, useEngagementMutations,
  ContractDecompte, ContractPayment, ContractGuarantee, ContractEngagement
} from '@/hooks/useContracts';
import { ContractDialog } from '@/components/marches/ContractDialog';
import { DecompteDialog } from '@/components/marches/DecompteDialog';
import { PaymentDialog } from '@/components/marches/PaymentDialog';
import { GuaranteeDialog } from '@/components/marches/GuaranteeDialog';
import { EngagementDialog } from '@/components/marches/EngagementDialog';
import { formatCurrency } from '@/lib/utils';
import { getContractFinancialSummary } from '@/lib/contractCalculations';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-700' },
  validated: { label: 'Validé', className: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'En cours', className: 'bg-green-100 text-green-700' },
  completed: { label: 'Terminé', className: 'bg-emerald-100 text-emerald-700' },
  suspended: { label: 'Suspendu', className: 'bg-yellow-100 text-yellow-700' },
  terminated: { label: 'Résilié', className: 'bg-red-100 text-red-700' },
  disputed: { label: 'Litige', className: 'bg-red-100 text-red-700' },
};

const typeConfig: Record<string, string> = {
  works: 'Travaux',
  supplies: 'Fournitures',
  services: 'Services',
  studies: 'Études',
};

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading } = useContract(id!);
  const { data: decomptes = [] } = useContractDecomptes(id);
  const { data: payments = [] } = useContractPayments(id);
  const { data: guarantees = [] } = useContractGuarantees(id);
  const { data: engagements = [] } = useContractEngagements(id);

  const { deleteDecompte } = useDecompteMutations();
  const { deletePayment } = usePaymentMutations();
  const { deleteGuarantee } = useGuaranteeMutations();
  const { deleteEngagement } = useEngagementMutations();

  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [decompteDialogOpen, setDecompteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [guaranteeDialogOpen, setGuaranteeDialogOpen] = useState(false);
  const [engagementDialogOpen, setEngagementDialogOpen] = useState(false);

  const [editingDecompte, setEditingDecompte] = useState<ContractDecompte | null>(null);
  const [editingPayment, setEditingPayment] = useState<ContractPayment | null>(null);
  const [editingGuarantee, setEditingGuarantee] = useState<ContractGuarantee | null>(null);
  const [editingEngagement, setEditingEngagement] = useState<ContractEngagement | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; label: string; amount?: number } | null>(null);

  if (isLoading) {
    return (
      <AppLayout title="Chargement...">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </AppLayout>
    );
  }

  if (!contract) {
    return (
      <AppLayout title="Marché non trouvé">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Marché non trouvé</p>
        </div>
      </AppLayout>
    );
  }

  const status = statusConfig[contract.status] || statusConfig.draft;
  const financials = getContractFinancialSummary(contract);

  const handleEdit = (type: string, item: any) => {
    switch (type) {
      case 'decompte':
        setEditingDecompte(item);
        setDecompteDialogOpen(true);
        break;
      case 'payment':
        setEditingPayment(item);
        setPaymentDialogOpen(true);
        break;
      case 'guarantee':
        setEditingGuarantee(item);
        setGuaranteeDialogOpen(true);
        break;
      case 'engagement':
        setEditingEngagement(item);
        setEngagementDialogOpen(true);
        break;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    const { type, id: itemId, amount } = deleteConfirm;
    switch (type) {
      case 'decompte':
        await deleteDecompte.mutateAsync({ id: itemId, contractId: contract.id });
        break;
      case 'payment':
        await deletePayment.mutateAsync({ id: itemId, contractId: contract.id, amount: amount || 0 });
        break;
      case 'guarantee':
        await deleteGuarantee.mutateAsync({ id: itemId });
        break;
      case 'engagement':
        await deleteEngagement.mutateAsync({ id: itemId, contractId: contract.id });
        break;
    }
    setDeleteConfirm(null);
  };

  const handleAddNew = (type: string) => {
    switch (type) {
      case 'decompte':
        setEditingDecompte(null);
        setDecompteDialogOpen(true);
        break;
      case 'payment':
        setEditingPayment(null);
        setPaymentDialogOpen(true);
        break;
      case 'guarantee':
        setEditingGuarantee(null);
        setGuaranteeDialogOpen(true);
        break;
      case 'engagement':
        setEditingEngagement(null);
        setEngagementDialogOpen(true);
        break;
    }
  };

  return (
    <AppLayout title={contract.code} subtitle={contract.object}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/marches')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Badge className={status.className}>{status.label}</Badge>
          </div>
          <Button onClick={() => setContractDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant TTC</p>
                  <p className="font-bold">{formatCurrency(financials.calculated.total_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net à payer</p>
                  <p className="font-bold">{formatCurrency(financials.calculated.net_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant payé</p>
                  <p className="font-bold">{formatCurrency(financials.paidAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <DollarSign className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reste à payer</p>
                  <p className="font-bold">{formatCurrency(financials.calculated.remaining_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Taux d'exécution</span>
                <Badge variant={financials.calculated.financial_status === 'Soldé' ? 'default' : 'outline'}>
                  {financials.calculated.financial_status}
                </Badge>
              </div>
              <span className="text-sm font-bold">{financials.calculated.execution_rate}%</span>
            </div>
            <Progress value={financials.calculated.progress_percentage} className="h-3" />
          </CardContent>
        </Card>

        {/* Details and Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contract Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{typeConfig[contract.contract_type]}</span>
              </div>
              {contract.supplier_name && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Fournisseur:</span>
                  <span className="font-medium">{contract.supplier_name}</span>
                </div>
              )}
              {contract.signing_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Signature:</span>
                  <span className="font-medium">
                    {format(new Date(contract.signing_date), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
              )}
              {contract.start_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Début:</span>
                  <span className="font-medium">
                    {format(new Date(contract.start_date), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
              )}
              {contract.end_date && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Fin:</span>
                  <span className="font-medium">
                    {format(new Date(contract.end_date), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="decomptes" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="decomptes">Décomptes</TabsTrigger>
                <TabsTrigger value="payments">Règlements</TabsTrigger>
                <TabsTrigger value="guarantees">Garanties</TabsTrigger>
                <TabsTrigger value="engagements">Engagements</TabsTrigger>
              </TabsList>

              {/* DECOMPTES */}
              <TabsContent value="decomptes" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Décomptes</CardTitle>
                    <Button size="sm" onClick={() => handleAddNew('decompte')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>N°</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {decomptes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                              Aucun décompte
                            </TableCell>
                          </TableRow>
                        ) : (
                          decomptes.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-medium text-xs text-muted-foreground">{d.code}</TableCell>
                              <TableCell className="font-medium">{d.decompte_number}</TableCell>
                              <TableCell>{d.decompte_type}</TableCell>
                              <TableCell>{formatCurrency(d.amount)}</TableCell>
                              <TableCell><Badge variant="outline">{d.status}</Badge></TableCell>
                              <TableCell>{d.submission_date}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit('decompte', d)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ type: 'decompte', id: d.id, label: d.code })}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* PAYMENTS */}
              <TabsContent value="payments" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Règlements</CardTitle>
                    <Button size="sm" onClick={() => handleAddNew('payment')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Méthode</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              Aucun règlement
                            </TableCell>
                          </TableRow>
                        ) : (
                          payments.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">{p.code}</TableCell>
                              <TableCell>{formatCurrency(p.amount)}</TableCell>
                              <TableCell>{p.payment_method}</TableCell>
                              <TableCell><Badge variant="outline">{p.status}</Badge></TableCell>
                              <TableCell>{p.payment_date}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit('payment', p)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ type: 'payment', id: p.id, label: p.code, amount: p.amount })}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* GUARANTEES */}
              <TabsContent value="guarantees" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Garanties</CardTitle>
                    <Button size="sm" onClick={() => handleAddNew('guarantee')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Émetteur</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Expiration</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {guarantees.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                              Aucune garantie
                            </TableCell>
                          </TableRow>
                        ) : (
                          guarantees.map((g) => (
                            <TableRow key={g.id}>
                              <TableCell className="font-medium text-xs text-muted-foreground">{g.code}</TableCell>
                              <TableCell className="font-medium">{g.guarantee_type}</TableCell>
                              <TableCell>{formatCurrency(g.amount)}</TableCell>
                              <TableCell>{g.issuer_name}</TableCell>
                              <TableCell><Badge variant="outline">{g.status}</Badge></TableCell>
                              <TableCell>{g.expiry_date}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit('guarantee', g)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ type: 'guarantee', id: g.id, label: g.code })}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* ENGAGEMENTS */}
              <TabsContent value="engagements" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Engagements</CardTitle>
                    <Button size="sm" onClick={() => handleAddNew('engagement')}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {engagements.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              Aucun engagement
                            </TableCell>
                          </TableRow>
                        ) : (
                          engagements.map((e) => (
                            <TableRow key={e.id}>
                              <TableCell className="font-medium">{e.code}</TableCell>
                              <TableCell>{e.engagement_type}</TableCell>
                              <TableCell>{formatCurrency(e.amount)}</TableCell>
                              <TableCell><Badge variant="outline">{e.status}</Badge></TableCell>
                              <TableCell>{e.engagement_date}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit('engagement', e)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ type: 'engagement', id: e.id, label: e.code })}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Dialogs */}
        <ContractDialog 
          open={contractDialogOpen} 
          onOpenChange={setContractDialogOpen} 
          contract={contract}
        />
        <DecompteDialog 
          open={decompteDialogOpen} 
          onOpenChange={(open) => { setDecompteDialogOpen(open); if (!open) setEditingDecompte(null); }}
          contractId={contract.id}
          decompte={editingDecompte}
        />
        <PaymentDialog 
          open={paymentDialogOpen} 
          onOpenChange={(open) => { setPaymentDialogOpen(open); if (!open) setEditingPayment(null); }}
          contractId={contract.id}
          payment={editingPayment}
        />
        <GuaranteeDialog 
          open={guaranteeDialogOpen} 
          onOpenChange={(open) => { setGuaranteeDialogOpen(open); if (!open) setEditingGuarantee(null); }}
          contractId={contract.id}
          guarantee={editingGuarantee}
        />
        <EngagementDialog 
          open={engagementDialogOpen} 
          onOpenChange={(open) => { setEngagementDialogOpen(open); if (!open) setEditingEngagement(null); }}
          contractId={contract.id}
          engagement={editingEngagement}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer {deleteConfirm?.label} ? Cette action est irréversible et les indicateurs financiers du marché seront recalculés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
