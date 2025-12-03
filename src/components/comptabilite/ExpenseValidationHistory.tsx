import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Send,
  Clock,
  RotateCcw,
  Banknote,
  User,
} from 'lucide-react';
import {
  useExpenseValidationHistory,
  ExpenseWorkflowStatus,
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_COLORS,
} from '@/hooks/useExpenseWorkflow';

interface ExpenseValidationHistoryProps {
  entryId: string | null;
}

const getActionIcon = (toStatus: ExpenseWorkflowStatus) => {
  switch (toStatus) {
    case 'soumise':
      return <Send className="h-4 w-4 text-blue-500" />;
    case 'en_validation_daf':
    case 'en_validation_dt':
    case 'en_validation_dg':
      return <Clock className="h-4 w-4 text-amber-500" />;
    case 'validee':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'rejetee':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'payee':
      return <Banknote className="h-4 w-4 text-emerald-500" />;
    case 'brouillon':
      return <RotateCcw className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

export function ExpenseValidationHistory({ entryId }: ExpenseValidationHistoryProps) {
  const { data: history, isLoading } = useExpenseValidationHistory(entryId);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  
  if (!history?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun historique de validation
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-4">
        {history.map((item, index) => (
          <div
            key={item.id}
            className="relative flex gap-4 pb-4"
          >
            {/* Timeline line */}
            {index < history.length - 1 && (
              <div className="absolute left-[19px] top-10 h-full w-px bg-border" />
            )}
            
            {/* Icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background">
              {getActionIcon(item.to_status as ExpenseWorkflowStatus)}
            </div>
            
            {/* Content */}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={EXPENSE_STATUS_COLORS[item.to_status as ExpenseWorkflowStatus]}>
                  {EXPENSE_STATUS_LABELS[item.to_status as ExpenseWorkflowStatus]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(item.performed_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </span>
              </div>
              
              {item.performer && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  {item.performer.full_name || item.performer.email}
                </div>
              )}
              
              {item.comment && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-md p-2 mt-2">
                  {item.comment}
                </p>
              )}
              
              <p className="text-xs text-muted-foreground">
                {EXPENSE_STATUS_LABELS[item.from_status as ExpenseWorkflowStatus]} → {EXPENSE_STATUS_LABELS[item.to_status as ExpenseWorkflowStatus]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
