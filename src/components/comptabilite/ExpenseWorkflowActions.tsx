import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Send,
  CheckCircle2,
  XCircle,
  Banknote,
  RotateCcw,
  Clock,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import {
  ExpenseWorkflowStatus,
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_COLORS,
  useCanPerformWorkflowAction,
  useExpenseWorkflowTransition,
  useCheckBudgetAvailability,
  getNextValidationStatus,
} from '@/hooks/useExpenseWorkflow';
import { toast } from '@/hooks/use-toast';

interface ExpenseWorkflowActionsProps {
  entryId: string;
  currentStatus: ExpenseWorkflowStatus;
  creatorId?: string;
  budgetLineId?: string;
  requestedAmount?: number;
  projectResponsibleId?: string;
  dafValidatedBy?: string;
  dtValidatedBy?: string;
  dgValidatedBy?: string;
  onStatusChange?: () => void;
}

export function ExpenseWorkflowActions({
  entryId,
  currentStatus,
  creatorId,
  budgetLineId,
  requestedAmount = 0,
  projectResponsibleId,
  dafValidatedBy,
  dtValidatedBy,
  dgValidatedBy,
  onStatusChange,
}: ExpenseWorkflowActionsProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const permissions = useCanPerformWorkflowAction(
    currentStatus, 
    creatorId,
    projectResponsibleId,
    dafValidatedBy,
    dtValidatedBy,
    dgValidatedBy
  );
  const transitionMutation = useExpenseWorkflowTransition();
  const checkBudget = useCheckBudgetAvailability();
  
  const handleSubmit = async () => {
    if (!budgetLineId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une ligne budgétaire',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Check budget availability
      const isAvailable = await checkBudget.mutateAsync({
        budgetLineId,
        amount: requestedAmount,
      });
      
      if (!isAvailable) {
        toast({
          title: 'Budget insuffisant',
          description: 'Le budget disponible est insuffisant pour cette dépense',
          variant: 'destructive',
        });
        return;
      }
      
      await transitionMutation.mutateAsync({
        entryId,
        newStatus: 'soumise',
      });
      onStatusChange?.();
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleValidate = async () => {
    const nextStatus = getNextValidationStatus(currentStatus);
    if (!nextStatus) return;
    
    setIsProcessing(true);
    try {
      await transitionMutation.mutateAsync({
        entryId,
        newStatus: nextStatus,
      });
      onStatusChange?.();
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez indiquer le motif du rejet',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      await transitionMutation.mutateAsync({
        entryId,
        newStatus: 'rejetee',
        comment: rejectionReason,
      });
      setRejectDialogOpen(false);
      setRejectionReason('');
      onStatusChange?.();
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePay = async () => {
    setIsProcessing(true);
    try {
      await transitionMutation.mutateAsync({
        entryId,
        newStatus: 'payee',
      });
      onStatusChange?.();
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleResubmit = async () => {
    setIsProcessing(true);
    try {
      await transitionMutation.mutateAsync({
        entryId,
        newStatus: 'brouillon',
      });
      onStatusChange?.();
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className={EXPENSE_STATUS_COLORS[currentStatus]}>
        {EXPENSE_STATUS_LABELS[currentStatus]}
      </Badge>
      
      {permissions.canSubmit && (
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isProcessing}
        >
          <Send className="mr-2 h-4 w-4" />
          Soumettre
        </Button>
      )}
      
      {permissions.canValidate && (
        <Button
          size="sm"
          variant="default"
          onClick={handleValidate}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Valider
        </Button>
      )}
      
      {permissions.canReject && (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setRejectDialogOpen(true)}
          disabled={isProcessing}
        >
          <XCircle className="mr-2 h-4 w-4" />
          Rejeter
        </Button>
      )}
      
      {permissions.canPay && (
        <Button
          size="sm"
          onClick={handlePay}
          disabled={isProcessing}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Banknote className="mr-2 h-4 w-4" />
          Marquer payée
        </Button>
      )}
      
      {permissions.canResubmit && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleResubmit}
          disabled={isProcessing}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reprendre
        </Button>
      )}
      
      {currentStatus === 'rejetee' && (
        <div className="flex items-center gap-1 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          Dépense rejetée
        </div>
      )}
      
      {['en_validation_daf', 'en_validation_dt', 'en_validation_dg'].includes(currentStatus) && !permissions.fraudBlocked && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          En attente de validation
        </div>
      )}
      
      {permissions.fraudBlocked && permissions.fraudReason && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span className="font-medium">Règle anti-fraude:</span>
          <span>{permissions.fraudReason}</span>
        </div>
      )}
      
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la dépense</DialogTitle>
            <DialogDescription>
              Veuillez indiquer le motif du rejet. Le demandeur sera notifié.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motif du rejet *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Indiquez la raison du rejet..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
