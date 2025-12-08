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
  Banknote,
  Loader2,
  UserCheck,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  DisbursementWorkflowStatus,
  DISBURSEMENT_STATUS_LABELS,
  DISBURSEMENT_STATUS_COLORS,
  useCanPerformDisbursementAction,
  useDisbursementWorkflowTransition,
} from '@/hooks/useDisbursementWorkflow';
import { useDisbursementControlCheck } from '@/hooks/useDisbursementControl';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DisbursementWorkflowActionsProps {
  disbursementId: string;
  currentStatus: DisbursementWorkflowStatus;
  compact?: boolean;
}

export function DisbursementWorkflowActions({
  disbursementId,
  currentStatus,
  compact = false,
}: DisbursementWorkflowActionsProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  const permissions = useCanPerformDisbursementAction(currentStatus);
  const transitionMutation = useDisbursementWorkflowTransition();
  
  // Vérifier les conditions de paiement uniquement si le statut permet le paiement
  const shouldCheckControl = currentStatus === 'valide';
  const { data: controlData, isLoading: controlLoading } = useDisbursementControlCheck(
    shouldCheckControl ? disbursementId : null
  );
  
  const handleTransition = async (newStatus: DisbursementWorkflowStatus, comment?: string) => {
    await transitionMutation.mutateAsync({
      disbursementId,
      newStatus,
      comment,
    });
  };
  
  const handleReject = async () => {
    await handleTransition('rejete', rejectReason);
    setRejectDialogOpen(false);
    setRejectReason('');
  };
  
  const getNextDafStatus = (): DisbursementWorkflowStatus => {
    if (currentStatus === 'soumis') return 'en_validation_daf';
    if (currentStatus === 'en_validation_daf') return 'en_validation_dg';
    return 'en_validation_daf';
  };
  
  const isLoading = transitionMutation.isPending;
  
  // Indicateur des conditions de paiement
  const renderPaymentConditions = () => {
    if (!shouldCheckControl || !controlData?.control) return null;
    
    const { control } = controlData;
    const allConditionsMet = control.canProceed;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              allConditionsMet 
                ? 'bg-success/10 text-success' 
                : 'bg-destructive/10 text-destructive'
            }`}>
              {allConditionsMet ? (
                <ShieldCheck className="h-3 w-3" />
              ) : (
                <ShieldAlert className="h-3 w-3" />
              )}
              <span className="hidden sm:inline">
                {allConditionsMet ? 'Prêt' : 'Bloqué'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">Conditions de paiement :</p>
              <ul className="space-y-1 text-sm">
                <li className={`flex items-center gap-2 ${control.expenseValidated ? 'text-success' : 'text-destructive'}`}>
                  {control.expenseValidated ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  Dépense validée
                </li>
                <li className={`flex items-center gap-2 ${control.budgetAvailable ? 'text-success' : 'text-destructive'}`}>
                  {control.budgetAvailable ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  Budget disponible
                </li>
                <li className={`flex items-center gap-2 ${control.treasuryAvailable ? 'text-success' : 'text-destructive'}`}>
                  {control.treasuryAvailable ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  Trésorerie disponible
                </li>
              </ul>
              {control.blockReasons.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <p className="text-destructive text-xs">{control.blockReasons[0]}</p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge className={DISBURSEMENT_STATUS_COLORS[currentStatus]}>
          {DISBURSEMENT_STATUS_LABELS[currentStatus]}
        </Badge>
        
        {renderPaymentConditions()}
        
        {permissions.canSubmit && (
          <Button size="sm" variant="outline" onClick={() => handleTransition('soumis')} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        )}
        
        {permissions.canValidateDaf && (
          <Button size="sm" variant="outline" className="text-amber-600 border-amber-600" onClick={() => handleTransition(getNextDafStatus())} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
          </Button>
        )}
        
        {permissions.canValidateDg && (
          <Button size="sm" variant="outline" className="text-green-600 border-green-600" onClick={() => handleTransition('valide')} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
          </Button>
        )}
        
        {permissions.canReject && (
          <Button size="sm" variant="outline" className="text-red-600 border-red-600" onClick={() => setRejectDialogOpen(true)} disabled={isLoading}>
            <XCircle className="h-3 w-3" />
          </Button>
        )}
        
        {permissions.canPay && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={`${controlData?.control?.canProceed === false 
                    ? 'text-muted-foreground border-muted cursor-not-allowed' 
                    : 'text-emerald-600 border-emerald-600'}`} 
                  onClick={() => handleTransition('paye')} 
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Banknote className="h-3 w-3" />}
                </Button>
              </TooltipTrigger>
              {controlData?.control?.canProceed === false && (
                <TooltipContent>
                  <p className="text-xs">Conditions non remplies - cliquez pour voir les détails</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
        
        {permissions.canResubmit && (
          <Button size="sm" variant="outline" onClick={() => handleTransition('brouillon')} disabled={isLoading}>
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
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">Statut actuel:</span>
        <Badge className={DISBURSEMENT_STATUS_COLORS[currentStatus]}>
          {DISBURSEMENT_STATUS_LABELS[currentStatus]}
        </Badge>
        {renderPaymentConditions()}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {permissions.canSubmit && (
          <Button onClick={() => handleTransition('soumis')} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Soumettre
          </Button>
        )}
        
        {permissions.canValidateDaf && (
          <Button variant="outline" className="text-amber-600 border-amber-600 hover:bg-amber-50" onClick={() => handleTransition(getNextDafStatus())} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserCheck className="h-4 w-4 mr-2" />}
            Valider DAF
          </Button>
        )}
        
        {permissions.canValidateDg && (
          <Button variant="outline" className="text-green-600 border-green-600 hover:bg-green-50" onClick={() => handleTransition('valide')} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Valider DG
          </Button>
        )}
        
        {permissions.canReject && (
          <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => setRejectDialogOpen(true)} disabled={isLoading}>
            <XCircle className="h-4 w-4 mr-2" />
            Rejeter
          </Button>
        )}
        
        {permissions.canPay && (
          <Button variant="outline" className="text-emerald-600 border-emerald-600 hover:bg-emerald-50" onClick={() => handleTransition('paye')} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Banknote className="h-4 w-4 mr-2" />}
            Marquer comme payé
          </Button>
        )}
        
        {permissions.canResubmit && (
          <Button variant="outline" onClick={() => handleTransition('brouillon')} disabled={isLoading}>
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
          <DialogTitle>Rejeter le décaissement</DialogTitle>
          <DialogDescription>
            Veuillez indiquer la raison du rejet. Cette information sera
            communiquée au comptable.
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
          <Button variant="destructive" onClick={onConfirm} disabled={!reason.trim() || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmer le rejet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
