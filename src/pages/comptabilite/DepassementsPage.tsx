import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertTriangle, 
  Check, 
  X, 
  Clock, 
  TrendingUp, 
  FileText, 
  User,
  Shield,
  Download
} from "lucide-react";
import { 
  useExceptionalOverrides, 
  usePendingOverridesForDirector, 
  usePendingOverridesForAdmin,
  useDirectorOverrideDecision,
  useAdminOverrideDecision,
  type ExceptionalOverride
} from "@/hooks/useExceptionalOverrides";
import { useUserBudgetRole } from "@/hooks/useBudgetWorkflow";
import { TableExportButtons } from "@/components/export/TableExportButtons";

const STATUS_BADGES = {
  pending: { label: 'En attente', variant: 'outline' as const, icon: Clock },
  approved: { label: 'Approuvé', variant: 'default' as const, icon: Check },
  rejected: { label: 'Rejeté', variant: 'destructive' as const, icon: X },
};

export default function DepassementsPage() {
  const { data: allOverrides, isLoading } = useExceptionalOverrides();
  const { data: pendingDirector } = usePendingOverridesForDirector();
  const { data: pendingAdmin } = usePendingOverridesForAdmin();
  const { data: userRole } = useUserBudgetRole();
  
  const directorDecision = useDirectorOverrideDecision();
  const adminDecision = useAdminOverrideDecision();
  
  const [selectedOverride, setSelectedOverride] = useState<ExceptionalOverride | null>(null);
  const [decisionDialog, setDecisionDialog] = useState<{ type: 'director' | 'admin'; decision: 'approved' | 'rejected' } | null>(null);
  const [comment, setComment] = useState("");

  const handleOpenDecisionDialog = (override: ExceptionalOverride, type: 'director' | 'admin', decision: 'approved' | 'rejected') => {
    setSelectedOverride(override);
    setDecisionDialog({ type, decision });
    setComment("");
  };

  const handleConfirmDecision = () => {
    if (!selectedOverride || !decisionDialog) return;

    if (decisionDialog.type === 'director') {
      directorDecision.mutate({
        overrideLogId: selectedOverride.id,
        decision: decisionDialog.decision,
        comment,
      });
    } else {
      adminDecision.mutate({
        overrideLogId: selectedOverride.id,
        decision: decisionDialog.decision,
        comment,
      });
    }
    
    setDecisionDialog(null);
    setSelectedOverride(null);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' XOF';
  };

  const stats = {
    total: allOverrides?.length || 0,
    pending: allOverrides?.filter(o => o.final_status === 'pending').length || 0,
    approved: allOverrides?.filter(o => o.final_status === 'approved').length || 0,
    rejected: allOverrides?.filter(o => o.final_status === 'rejected').length || 0,
    totalAmount: allOverrides?.filter(o => o.final_status === 'approved').reduce((sum, o) => sum + o.override_amount, 0) || 0,
  };

  const renderOverrideRow = (override: ExceptionalOverride, showActions: 'director' | 'admin' | null = null) => {
    const StatusBadge = STATUS_BADGES[override.final_status];
    const StatusIcon = StatusBadge.icon;

    return (
      <TableRow key={override.id}>
        <TableCell className="font-medium">
          {override.journal_entry?.entry_number || '-'}
        </TableCell>
        <TableCell>
          <div className="max-w-[200px] truncate" title={override.journal_entry?.description}>
            {override.journal_entry?.description || '-'}
          </div>
        </TableCell>
        <TableCell>{override.project?.code || '-'}</TableCell>
        <TableCell className="text-right font-semibold text-destructive">
          {formatAmount(override.override_amount)}
        </TableCell>
        <TableCell className="text-right">
          {override.override_percentage.toFixed(1)}%
        </TableCell>
        <TableCell>
          <div className="max-w-[150px] truncate" title={override.override_reason}>
            {override.override_reason}
          </div>
        </TableCell>
        <TableCell>
          {override.requester?.full_name || '-'}
        </TableCell>
        <TableCell>
          {format(new Date(override.requested_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
        </TableCell>
        <TableCell>
          <Badge variant={StatusBadge.variant} className="flex items-center gap-1 w-fit">
            <StatusIcon className="h-3 w-3" />
            {StatusBadge.label}
          </Badge>
        </TableCell>
        {showActions && (
          <TableCell>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => handleOpenDecisionDialog(override, showActions, 'approved')}
              >
                <Check className="h-4 w-4 mr-1" />
                Approuver
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleOpenDecisionDialog(override, showActions, 'rejected')}
              >
                <X className="h-4 w-4 mr-1" />
                Rejeter
              </Button>
            </div>
          </TableCell>
        )}
      </TableRow>
    );
  };

  return (
    <AppLayout 
      title="Dépassements Exceptionnels" 
      subtitle="Suivi et validation des dépassements budgétaires autorisés"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total demandes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approuvés</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejetés</p>
                <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
              </div>
              <X className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Montant total</p>
                <p className="text-xl font-bold text-primary">{formatAmount(stats.totalAmount)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            Tous les dépassements
          </TabsTrigger>
          {(userRole?.isDg || userRole?.isAdmin) && (
            <TabsTrigger value="pending-director" className="relative">
              <User className="h-4 w-4 mr-2" />
              Validation Directeur
              {pendingDirector && pendingDirector.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingDirector.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          {userRole?.isAdmin && (
            <TabsTrigger value="pending-admin" className="relative">
              <Shield className="h-4 w-4 mr-2" />
              Validation Admin
              {pendingAdmin && pendingAdmin.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingAdmin.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        {/* All Overrides Tab */}
        <TabsContent value="all">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Rapport des Dépassements Exceptionnels
                </CardTitle>
                <CardDescription>
                  Historique complet des demandes de dépassement budgétaire
                </CardDescription>
              </div>
              <TableExportButtons
                data={allOverrides || []}
                columns={[
                  { key: 'journal_entry.entry_number', label: 'N° Écriture' },
                  { key: 'journal_entry.description', label: 'Description' },
                  { key: 'project.code', label: 'Projet' },
                  { key: 'override_amount', label: 'Dépassement' },
                  { key: 'override_percentage', label: '%', format: (v) => v?.toFixed(1) + '%' },
                  { key: 'override_reason', label: 'Motif' },
                  { key: 'requester.full_name', label: 'Demandeur' },
                  { key: 'requested_at', label: 'Date', format: (v) => v ? format(new Date(v), 'dd/MM/yyyy') : '-' },
                  { key: 'final_status', label: 'Statut', format: (v) => STATUS_BADGES[v as keyof typeof STATUS_BADGES]?.label || v },
                ]}
                filename="depassements_exceptionnels"
                title="Dépassements Exceptionnels"
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Écriture</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Projet</TableHead>
                    <TableHead className="text-right">Dépassement</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead>Motif</TableHead>
                    <TableHead>Demandeur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : allOverrides?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Aucun dépassement exceptionnel enregistré
                      </TableCell>
                    </TableRow>
                  ) : (
                    allOverrides?.map(override => renderOverrideRow(override))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Director Pending Tab */}
        {(userRole?.isDg || userRole?.isAdmin) && (
          <TabsContent value="pending-director">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Demandes en attente de validation Directeur
                </CardTitle>
                <CardDescription>
                  Approuvez ou rejetez les demandes de dépassement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Écriture</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Projet</TableHead>
                      <TableHead className="text-right">Dépassement</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead>Demandeur</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingDirector?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          Aucune demande en attente
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingDirector?.map(override => renderOverrideRow(override, 'director'))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Admin Pending Tab */}
        {userRole?.isAdmin && (
          <TabsContent value="pending-admin">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Demandes en attente de validation Administrateur
                </CardTitle>
                <CardDescription>
                  Validation finale des dépassements approuvés par le Directeur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Écriture</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Projet</TableHead>
                      <TableHead className="text-right">Dépassement</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead>Demandeur</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingAdmin?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          Aucune demande en attente
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingAdmin?.map(override => renderOverrideRow(override, 'admin'))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Decision Dialog */}
      <Dialog open={!!decisionDialog} onOpenChange={() => setDecisionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionDialog?.decision === 'approved' ? 'Approuver' : 'Rejeter'} le dépassement
            </DialogTitle>
            <DialogDescription>
              {decisionDialog?.type === 'director' 
                ? 'En tant que Directeur, vous ' + (decisionDialog?.decision === 'approved' ? 'approuvez' : 'rejetez') + ' cette demande.'
                : 'En tant qu\'Administrateur, cette décision est finale.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedOverride && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Montant du dépassement:</span>
                  <span className="font-semibold text-destructive">{formatAmount(selectedOverride.override_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pourcentage:</span>
                  <span className="font-semibold">{selectedOverride.override_percentage.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Demandeur:</span>
                  <span>{selectedOverride.requester?.full_name}</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Commentaire {decisionDialog?.decision === 'rejected' ? '(obligatoire)' : '(optionnel)'}</label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={decisionDialog?.decision === 'rejected' ? "Motif du rejet..." : "Commentaire..."}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionDialog(null)}>
              Annuler
            </Button>
            <Button
              variant={decisionDialog?.decision === 'approved' ? 'default' : 'destructive'}
              onClick={handleConfirmDecision}
              disabled={decisionDialog?.decision === 'rejected' && !comment.trim()}
            >
              {decisionDialog?.decision === 'approved' ? 'Confirmer l\'approbation' : 'Confirmer le rejet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
