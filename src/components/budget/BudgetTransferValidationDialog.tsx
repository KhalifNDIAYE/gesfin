import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useBudgetTransfers, BudgetTransfer, BudgetTransferHistory } from '@/hooks/useBudgetTransfers';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowRight, 
  Check, 
  X, 
  Clock, 
  User, 
  Calendar,
  FileText,
  History,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface BudgetTransferValidationDialogProps {
  transfer: BudgetTransfer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_director: { 
    label: 'En attente Directeur', 
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <Clock className="h-3 w-3" />
  },
  pending_admin: { 
    label: 'En attente Admin', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Clock className="h-3 w-3" />
  },
  approved: { 
    label: 'Exécuté', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <Check className="h-3 w-3" />
  },
  rejected: { 
    label: 'Rejeté', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <X className="h-3 w-3" />
  },
  cancelled: { 
    label: 'Annulé', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <X className="h-3 w-3" />
  },
};

const actionLabels: Record<string, string> = {
  created: 'Demande créée',
  director_approved: 'Approuvé par Directeur',
  director_rejected: 'Rejeté par Directeur',
  admin_approved: 'Approuvé par Admin',
  admin_rejected: 'Rejeté par Admin',
  executed: 'Transfert exécuté',
  cancelled: 'Annulé',
};

export const BudgetTransferValidationDialog = ({ 
  transfer, 
  open, 
  onOpenChange 
}: BudgetTransferValidationDialogProps) => {
  const { validateDirector, validateAdmin, getHistory } = useBudgetTransfers();
  const { roles } = useAuth();
  const [comment, setComment] = useState('');

  const { data: history, isLoading: historyLoading } = transfer 
    ? getHistory(transfer.id) 
    : { data: undefined, isLoading: false };

  const isDirector = roles?.some(r => r.name === 'dg') || roles?.some(r => r.name === 'admin');
  const isAdmin = roles?.some(r => r.name === 'admin');

  const canValidateAsDirector = transfer?.status === 'pending_director' && isDirector;
  const canValidateAsAdmin = transfer?.status === 'pending_admin' && isAdmin;

  const handleValidate = async (decision: 'approved' | 'rejected') => {
    if (!transfer) return;

    if (canValidateAsDirector) {
      await validateDirector.mutateAsync({
        transferId: transfer.id,
        decision,
        comment: comment || undefined,
      });
    } else if (canValidateAsAdmin) {
      await validateAdmin.mutateAsync({
        transferId: transfer.id,
        decision,
        comment: comment || undefined,
      });
    }

    setComment('');
    onOpenChange(false);
  };

  if (!transfer) return null;

  const statusInfo = statusConfig[transfer.status] || statusConfig.pending_director;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Transfert {transfer.code}
            <Badge className={statusInfo.color} variant="outline">
              {statusInfo.icon}
              <span className="ml-1">{statusInfo.label}</span>
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Détails et historique du transfert budgétaire
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Transfer Details */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Ligne source</p>
                <p className="font-medium">
                  {transfer.source_budget_line?.description || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {transfer.source_budget_line?.budget?.name}
                </p>
              </div>

              <div className="hidden md:flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  <ArrowRight className="h-6 w-6 text-primary" />
                  <span className="text-lg font-bold text-primary">
                    {transfer.amount.toLocaleString()} XOF
                  </span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Ligne destination</p>
                <p className="font-medium">
                  {transfer.destination_budget_line?.description || 'N/A'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {transfer.destination_budget_line?.budget?.name}
                </p>
              </div>
            </div>

            {/* Justification */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4" />
                Justification
              </Label>
              <div className="p-3 bg-muted/30 rounded-md">
                <p className="text-sm">{transfer.reason}</p>
                {transfer.description && (
                  <p className="text-sm text-muted-foreground mt-2">{transfer.description}</p>
                )}
              </div>
            </div>

            {/* Requester info */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Demandé par: <strong>{transfer.requester?.full_name}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(transfer.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
              </div>
            </div>

            {/* Validation status */}
            {(transfer.director_validated_by || transfer.admin_validated_by) && (
              <div className="space-y-2">
                <Label>Validations</Label>
                <div className="space-y-2">
                  {transfer.director_validated_by && (
                    <div className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Directeur: {transfer.director_validator?.full_name}</span>
                      {transfer.director_validated_at && (
                        <span className="text-muted-foreground">
                          ({format(new Date(transfer.director_validated_at), 'dd/MM/yyyy HH:mm')})
                        </span>
                      )}
                    </div>
                  )}
                  {transfer.admin_validated_by && (
                    <div className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded">
                      <Check className="h-4 w-4 text-green-600" />
                      <span>Administrateur: {transfer.admin_validator?.full_name}</span>
                      {transfer.admin_validated_at && (
                        <span className="text-muted-foreground">
                          ({format(new Date(transfer.admin_validated_at), 'dd/MM/yyyy HH:mm')})
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rejection reason */}
            {transfer.status === 'rejected' && transfer.rejection_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 text-red-800 mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Motif de rejet</span>
                </div>
                <p className="text-sm text-red-700">{transfer.rejection_reason}</p>
              </div>
            )}

            <Separator />

            {/* History */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4" />
                Historique
              </Label>
              {historyLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {history?.map((entry: BudgetTransferHistory) => (
                    <div key={entry.id} className="flex items-start gap-3 text-sm p-2 border rounded">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium">{actionLabels[entry.action] || entry.action}</p>
                        {entry.comment && (
                          <p className="text-muted-foreground">{entry.comment}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {entry.performer?.full_name} • {format(new Date(entry.performed_at), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Validation form */}
            {(canValidateAsDirector || canValidateAsAdmin) && (
              <>
                <Separator />
                <div>
                  <Label htmlFor="comment">Commentaire (optionnel)</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Ajoutez un commentaire..."
                    className="mt-2"
                  />
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          
          {(canValidateAsDirector || canValidateAsAdmin) && (
            <>
              <Button 
                variant="destructive" 
                onClick={() => handleValidate('rejected')}
                disabled={validateDirector.isPending || validateAdmin.isPending}
              >
                {(validateDirector.isPending || validateAdmin.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <X className="mr-2 h-4 w-4" />
                Rejeter
              </Button>
              <Button 
                onClick={() => handleValidate('approved')}
                disabled={validateDirector.isPending || validateAdmin.isPending}
              >
                {(validateDirector.isPending || validateAdmin.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Check className="mr-2 h-4 w-4" />
                {canValidateAsAdmin ? 'Approuver et Exécuter' : 'Approuver'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
