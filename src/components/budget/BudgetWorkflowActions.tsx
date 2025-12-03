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
  CheckCircle,
  XCircle,
  RotateCcw,
  Lock,
  Loader2,
} from 'lucide-react';
import {
  BudgetWorkflowStatus,
  BUDGET_STATUS_LABELS,
  BUDGET_STATUS_COLORS,
  useCanPerformBudgetAction,
  useBudgetWorkflowTransition,
} from '@/hooks/useBudgetWorkflow';

interface BudgetWorkflowActionsProps {
  budgetId: string;
  currentStatus: BudgetWorkflowStatus;
  compact?: boolean;
}

export function BudgetWorkflowActions({
  budgetId,
  currentStatus,
  compact = false,
}: BudgetWorkflowActionsProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const permissions = useCanPerformBudgetAction(currentStatus);
  const transitionMutation = useBudgetWorkflowTransition();
  
  const handleTransition = async (newStatus: BudgetWorkflowStatus, comment?: string) => {
    await transitionMutation.mutateAsync({
      budgetId,
      newStatus,
      comment,
    });
  };
  
  const handleReject = async () => {
    await handleTransition('rejete', rejectReason);
    setRejectDialogOpen(false);
    setRejectReason('');
  };
  
  const isLoading = transitionMutation.isPending;
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={BUDGET_STATUS_COLORS[currentStatus]}>
          {BUDGET_STATUS_LABELS[currentStatus]}
        </Badge>
        
        {permissions.canSubmit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTransition('soumis')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        )}
        
        {permissions.canValidate && (
          <Button
            size="sm"
            variant="outline"
            className="text-green-600 border-green-600"
            onClick={() => handleTransition('valide')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
          </Button>
        )}
        
        {permissions.canReject && (
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 border-red-600"
            onClick={() => setRejectDialogOpen(true)}
            disabled={isLoading}
          >
            <XCircle className="h-3 w-3" />
          </Button>
        )}
        
        {permissions.canClose && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTransition('clos')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lock className="h-3 w-3" />}
          </Button>
        )}
        
        {permissions.canResubmit && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleTransition('draft')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
          </Button>
        )}
        
        <RejectDialog
          open={rejectDialogOpen}
          onOpenChange={setRejectDialogOpen}
          reason={rejectReason}
          onReasonChange={setRejectReason}
          onConfirm={handleReject}
          isLoading={isLoading}
        />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Statut actuel:</span>
        <Badge className={BUDGET_STATUS_COLORS[currentStatus]}>
          {BUDGET_STATUS_LABELS[currentStatus]}
        </Badge>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {permissions.canSubmit && (
          <Button
            onClick={() => handleTransition('soumis')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Soumettre
          </Button>
        )}
        
        {permissions.canValidate && (
          <Button
            variant="outline"
            className="text-green-600 border-green-600 hover:bg-green-50"
            onClick={() => handleTransition('valide')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Valider
          </Button>
        )}
        
        {permissions.canReject && (
          <Button
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
            onClick={() => setRejectDialogOpen(true)}
            disabled={isLoading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeter
          </Button>
        )}
        
        {permissions.canClose && (
          <Button
            variant="outline"
            onClick={() => handleTransition('clos')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
            Clôturer
          </Button>
        )}
        
        {permissions.canResubmit && (
          <Button
            variant="outline"
            onClick={() => handleTransition('draft')}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
            Remettre en brouillon
          </Button>
        )}
      </div>
      
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={handleReject}
        isLoading={isLoading}
      />
    </div>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rejeter le budget</DialogTitle>
          <DialogDescription>
            Veuillez indiquer la raison du rejet. Cette information sera
            communiquée au DAF.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="reject-reason">Motif du rejet</Label>
          <Textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Expliquez la raison du rejet..."
            className="mt-2"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmer le rejet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
