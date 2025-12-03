import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { History, User, MessageSquare } from 'lucide-react';
import {
  useDisbursementValidationHistory,
  DISBURSEMENT_STATUS_LABELS,
  DISBURSEMENT_STATUS_COLORS,
  DisbursementWorkflowStatus,
} from '@/hooks/useDisbursementWorkflow';

interface DisbursementValidationHistoryProps {
  disbursementId: string;
}

export function DisbursementValidationHistory({ disbursementId }: DisbursementValidationHistoryProps) {
  const { data: history, isLoading } = useDisbursementValidationHistory(disbursementId);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Historique des validations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Historique des validations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun historique disponible
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Historique des validations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="relative pl-6 pb-4 border-l-2 border-muted last:border-transparent"
              >
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={DISBURSEMENT_STATUS_COLORS[entry.from_status as DisbursementWorkflowStatus]}>
                      {DISBURSEMENT_STATUS_LABELS[entry.from_status as DisbursementWorkflowStatus] || entry.from_status}
                    </Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge className={DISBURSEMENT_STATUS_COLORS[entry.to_status as DisbursementWorkflowStatus]}>
                      {DISBURSEMENT_STATUS_LABELS[entry.to_status as DisbursementWorkflowStatus] || entry.to_status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {entry.performer && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {entry.performer.full_name || entry.performer.email}
                      </span>
                    )}
                    <span>
                      {format(new Date(entry.performed_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </span>
                  </div>
                  
                  {entry.comment && (
                    <div className="flex items-start gap-2 text-sm bg-muted/50 rounded-md p-2">
                      <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                      <span>{entry.comment}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
