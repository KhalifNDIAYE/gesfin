import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAICorrelatedAlertDetails, useAICorrelationMutations, type RiskLevel } from '@/hooks/useAICorrelationEngine';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, CheckCircle, Clock, Shield, Target, Users, Brain } from 'lucide-react';

interface AIAlertDetailDialogProps {
  alertId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const riskColors: Record<RiskLevel, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

export const AIAlertDetailDialog: React.FC<AIAlertDetailDialogProps> = ({ alertId, open, onOpenChange }) => {
  const { data, isLoading } = useAICorrelatedAlertDetails(alertId);
  const { updateAlertStatus } = useAICorrelationMutations();

  const handleResolve = () => {
    if (alertId) {
      updateAlertStatus.mutate({ alertId, status: 'resolved' });
      onOpenChange(false);
    }
  };

  const handleAcknowledge = () => {
    if (alertId) {
      updateAlertStatus.mutate({ alertId, status: 'acknowledged' });
    }
  };

  if (!data?.alert) return null;

  const { alert, events } = data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {alert.title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6 pr-4">
            {/* Header Info */}
            <div className="flex flex-wrap gap-2">
              <Badge className={riskColors[alert.risk_level]}>{alert.risk_level}</Badge>
              <Badge variant="outline">{alert.correlation_type}</Badge>
              <Badge variant="secondary">{alert.status}</Badge>
            </div>

            <p className="text-muted-foreground">{alert.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <Target className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xl font-bold">{alert.risk_score}</p>
                <p className="text-xs text-muted-foreground">Score</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <Users className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xl font-bold">{alert.event_count}</p>
                <p className="text-xs text-muted-foreground">Événements</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <Brain className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xl font-bold">{Math.round(alert.detection_confidence * 100)}%</p>
                <p className="text-xs text-muted-foreground">Confiance</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <Clock className="h-5 w-5 mx-auto mb-1" />
                <p className="text-xl font-bold">{alert.time_span_minutes || '-'}</p>
                <p className="text-xs text-muted-foreground">Minutes</p>
              </div>
            </div>

            <Separator />

            {/* AI Reasoning */}
            {alert.ai_reasoning && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Raisonnement IA
                </h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {alert.ai_reasoning}
                </p>
              </div>
            )}

            {/* Risk Factors */}
            {alert.risk_factors && alert.risk_factors.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Facteurs de risque</h4>
                <div className="space-y-2">
                  {alert.risk_factors.map((factor, idx) => (
                    <div key={idx} className="p-3 rounded-lg border">
                      <p className="font-medium text-sm">{factor.factor}</p>
                      {factor.explanation && (
                        <p className="text-xs text-muted-foreground mt-1">{factor.explanation}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correlated Events */}
            {events && events.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Événements corrélés ({events.length})</h4>
                <div className="space-y-2">
                  {events.map((event, idx) => (
                    <div key={event.id} className="p-3 rounded-lg border text-sm">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{event.event_type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.event_timestamp), 'dd/MM HH:mm:ss', { locale: fr })}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1">Source: {event.event_source}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              {alert.status === 'new' && (
                <Button onClick={handleAcknowledge} variant="outline">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Accuser réception
                </Button>
              )}
              {alert.status !== 'resolved' && (
                <Button onClick={handleResolve}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marquer résolu
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
