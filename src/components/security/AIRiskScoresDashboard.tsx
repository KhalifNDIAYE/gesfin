import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserRiskScores, useAICorrelationMutations, type RiskLevel } from '@/hooks/useAICorrelationEngine';
import { Target, RefreshCw, Users, AlertTriangle } from 'lucide-react';

const riskConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  critical: { label: 'Critique', color: 'text-red-600', bgColor: 'bg-red-100' },
  high: { label: 'Élevé', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  medium: { label: 'Moyen', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  low: { label: 'Faible', color: 'text-green-600', bgColor: 'bg-green-100' }
};

export const AIRiskScoresDashboard: React.FC = () => {
  const { data: riskScores, isLoading } = useUserRiskScores();
  const { calculateRisk } = useAICorrelationMutations();

  const handleRecalculate = (userId: string) => {
    calculateRisk.mutate(userId);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Chargement...</div>;
  }

  const highRiskUsers = riskScores?.filter(s => s.risk_level === 'critical' || s.risk_level === 'high') || [];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        {(['critical', 'high', 'medium', 'low'] as RiskLevel[]).map(level => {
          const count = riskScores?.filter(s => s.risk_level === level).length || 0;
          return (
            <Card key={level}>
              <CardContent className="pt-6">
                <div className={`text-center p-4 rounded-lg ${riskConfig[level].bgColor}`}>
                  <p className={`text-3xl font-bold ${riskConfig[level].color}`}>{count}</p>
                  <p className="text-sm text-muted-foreground">{riskConfig[level].label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* High Risk Users */}
      {highRiskUsers.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Utilisateurs à risque élevé
            </CardTitle>
            <CardDescription>
              Ces utilisateurs nécessitent une attention immédiate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highRiskUsers.map(score => (
                <div key={score.id} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span className="font-mono text-sm">{score.user_id.slice(0, 8)}...</span>
                    </div>
                    <Badge className={score.risk_level === 'critical' ? 'bg-red-500' : 'bg-orange-500'}>
                      {riskConfig[score.risk_level].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Progress value={score.current_score} className="h-3" />
                    </div>
                    <span className="font-bold text-lg">{Math.round(score.current_score)}</span>
                  </div>
                  {score.score_factors && score.score_factors.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {score.score_factors.map((factor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {factor.factor}: +{factor.contribution}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => handleRecalculate(score.user_id)}
                    disabled={calculateRisk.isPending}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Recalculer
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Tous les scores de risque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {riskScores?.map(score => (
                <div key={score.id} className="flex items-center gap-4 p-3 rounded-lg border">
                  <div className={`w-3 h-3 rounded-full ${
                    score.risk_level === 'critical' ? 'bg-red-500' :
                    score.risk_level === 'high' ? 'bg-orange-500' :
                    score.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <span className="font-mono text-sm flex-1">{score.user_id.slice(0, 12)}...</span>
                  <Progress value={score.current_score} className="w-32 h-2" />
                  <span className="font-medium w-12 text-right">{Math.round(score.current_score)}</span>
                  <Badge variant="outline">{riskConfig[score.risk_level].label}</Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
