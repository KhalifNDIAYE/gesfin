import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, Edit, FileText, DollarSign, Shield, Calendar,
  Building2, Plus
} from 'lucide-react';
import { 
  useContract, useContractDecomptes, useContractPayments, 
  useContractGuarantees, useContractEngagements 
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

  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [decompteDialogOpen, setDecompteDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [guaranteeDialogOpen, setGuaranteeDialogOpen] = useState(false);
  const [engagementDialogOpen, setEngagementDialogOpen] = useState(false);

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
  
  // Use centralized financial calculations for consistency
  const financials = getContractFinancialSummary(contract);

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
                  <p className="text-sm text-muted-foreground">Montant total</p>
                  <p className="font-bold">{formatCurrency(financials.totalAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <FileText className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Montant engagé</p>
                  <p className="font-bold">{formatCurrency(financials.engagedAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <DollarSign className="h-5 w-5 text-info" />
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
                <div className="p-2 rounded-lg bg-warning/10">
                  <DollarSign className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reste à payer</p>
                  <p className="font-bold">{formatCurrency(financials.remainingAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Avancement global</span>
              <span className="text-sm font-bold">{financials.progressPercentage}%</span>
            </div>
            <Progress value={financials.progressPercentage} className="h-3" />
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

              <TabsContent value="decomptes" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Décomptes</CardTitle>
                    <Button size="sm" onClick={() => setDecompteDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>N°</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {decomptes.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Aucun décompte
                            </TableCell>
                          </TableRow>
                        ) : (
                          decomptes.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell className="font-medium">{d.decompte_number}</TableCell>
                              <TableCell>{d.decompte_type}</TableCell>
                              <TableCell>{formatCurrency(d.amount)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{d.status}</Badge>
                              </TableCell>
                              <TableCell>{d.submission_date}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payments" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Règlements</CardTitle>
                    <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Aucun règlement
                            </TableCell>
                          </TableRow>
                        ) : (
                          payments.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">{p.code}</TableCell>
                              <TableCell>{formatCurrency(p.amount)}</TableCell>
                              <TableCell>{p.payment_method}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{p.status}</Badge>
                              </TableCell>
                              <TableCell>{p.payment_date}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="guarantees" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Garanties</CardTitle>
                    <Button size="sm" onClick={() => setGuaranteeDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Ajouter
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Émetteur</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Expiration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {guarantees.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Aucune garantie
                            </TableCell>
                          </TableRow>
                        ) : (
                          guarantees.map((g) => (
                            <TableRow key={g.id}>
                              <TableCell className="font-medium">{g.guarantee_type}</TableCell>
                              <TableCell>{formatCurrency(g.amount)}</TableCell>
                              <TableCell>{g.issuer_name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{g.status}</Badge>
                              </TableCell>
                              <TableCell>{g.expiry_date}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="engagements" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Engagements</CardTitle>
                    <Button size="sm" onClick={() => setEngagementDialogOpen(true)}>
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
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {engagements.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              Aucun engagement
                            </TableCell>
                          </TableRow>
                        ) : (
                          engagements.map((e) => (
                            <TableRow key={e.id}>
                              <TableCell className="font-medium">{e.code}</TableCell>
                              <TableCell>{e.engagement_type}</TableCell>
                              <TableCell>{formatCurrency(e.amount)}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{e.status}</Badge>
                              </TableCell>
                              <TableCell>{e.engagement_date}</TableCell>
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
          onOpenChange={setDecompteDialogOpen} 
          contractId={contract.id}
        />
        <PaymentDialog 
          open={paymentDialogOpen} 
          onOpenChange={setPaymentDialogOpen} 
          contractId={contract.id}
        />
        <GuaranteeDialog 
          open={guaranteeDialogOpen} 
          onOpenChange={setGuaranteeDialogOpen} 
          contractId={contract.id}
        />
        <EngagementDialog 
          open={engagementDialogOpen} 
          onOpenChange={setEngagementDialogOpen} 
          contractId={contract.id}
        />
      </div>
    </AppLayout>
  );
}
