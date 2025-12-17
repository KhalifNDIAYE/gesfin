import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAICorrelatedAlerts, type RiskLevel } from '@/hooks/useAICorrelationEngine';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Activity, Clock, AlertTriangle, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

const riskConfig: Record<RiskLevel, { color: string; bgColor: string; icon: React.ReactNode }> = {
  critical: { color: 'text-red-600', bgColor: 'bg-red-100', icon: <XCircle className="h-4 w-4" /> },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100', icon: <AlertTriangle className="h-4 w-4" /> },
  medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: <AlertCircle className="h-4 w-4" /> },
  low: { color: 'text-green-600', bgColor: 'bg-green-100', icon: <CheckCircle2 className="h-4 w-4" /> }
};

export const AICorrelationTimeline: React.FC = () => {
  const { data: alerts, isLoading } = useAICorrelatedAlerts({ limit: 30 });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Timeline des corrélations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-6">
              {alerts?.map((alert, idx) => (
                <div key={alert.id} className="relative pl-10">
                  <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${riskConfig[alert.risk_level].bgColor}`}>
                    <div className={riskConfig[alert.risk_level].color}>
                      {riskConfig[alert.risk_level].icon}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">{alert.correlation_type}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(alert.created_at), 'dd/MM HH:mm', { locale: fr })}
                      </span>
                    </div>
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                    <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                      <span>{alert.event_count} événements</span>
                      <span>•</span>
                      <span>Score: {alert.risk_score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
