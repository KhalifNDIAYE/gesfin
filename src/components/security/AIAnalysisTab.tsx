import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  AlertTriangle, 
  Activity, 
  Users, 
  Clock, 
  Shield, 
  TrendingUp,
  Eye,
  Play,
  RefreshCw,
  ChevronRight,
  Zap,
  Target,
  GitBranch,
  BarChart3,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  useAIEngineStats, 
  useAICorrelatedAlerts, 
  useAICorrelationPatterns,
  useAIDecisionsAudit,
  useAIEngineSettings,
  useAICorrelationMutations,
  type RiskLevel,
  type CorrelationType
} from '@/hooks/useAICorrelationEngine';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AICorrelationTimeline } from './AICorrelationTimeline';
import { AIAlertDetailDialog } from './AIAlertDetailDialog';
import { AIRiskScoresDashboard } from './AIRiskScoresDashboard';

const riskLevelConfig: Record<RiskLevel, { label: string; color: string; icon: React.ReactNode }> = {
  critical: { label: 'Critique', color: 'bg-red-500', icon: <XCircle className="h-4 w-4" /> },
  high: { label: 'Élevé', color: 'bg-orange-500', icon: <AlertTriangle className="h-4 w-4" /> },
  medium: { label: 'Moyen', color: 'bg-yellow-500', icon: <AlertCircle className="h-4 w-4" /> },
  low: { label: 'Faible', color: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4" /> }
};

const correlationTypeConfig: Record<CorrelationType, { label: string; icon: React.ReactNode }> = {
  temporal: { label: 'Temporelle', icon: <Clock className="h-4 w-4" /> },
  behavioral: { label: 'Comportementale', icon: <Users className="h-4 w-4" /> },
  contextual: { label: 'Contextuelle', icon: <GitBranch className="h-4 w-4" /> },
  data_sensitive: { label: 'Données sensibles', icon: <Shield className="h-4 w-4" /> }
};

export const AIAnalysisTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<CorrelationType | 'all'>('all');

  const { data: stats, isLoading: statsLoading } = useAIEngineStats();
  const { data: alerts, isLoading: alertsLoading } = useAICorrelatedAlerts({
    riskLevel: riskFilter !== 'all' ? riskFilter : undefined,
    correlationType: typeFilter !== 'all' ? typeFilter : undefined,
    limit: 50
  });
  const { data: patterns } = useAICorrelationPatterns();
  const { data: decisions } = useAIDecisionsAudit({ limit: 20 });
  const { data: settings } = useAIEngineSettings();

  const { analyzeEvents, detectAnomalies, updateEngineSetting } = useAICorrelationMutations();

  const aiEnabled = settings?.find(s => s.setting_key === 'ai_enabled')?.setting_value === true ||
                    settings?.find(s => s.setting_key === 'ai_enabled')?.setting_value === 'true';

  const handleRunAnalysis = () => {
    analyzeEvents.mutate({ timeWindowHours: 24 });
  };

  const handleDetectAnomalies = () => {
    detectAnomalies.mutate({ timeWindowHours: 24 });
  };

  const handleToggleAI = (enabled: boolean) => {
    updateEngineSetting.mutate({ key: 'ai_enabled', value: enabled });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Analyse IA</h2>
            <p className="text-muted-foreground">Moteur de corrélation d'événements intelligent</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              checked={aiEnabled} 
              onCheckedChange={handleToggleAI}
              id="ai-toggle"
            />
            <Label htmlFor="ai-toggle" className="text-sm">
              {aiEnabled ? 'IA Activée' : 'IA Désactivée'}
            </Label>
          </div>
          
          <Button 
            onClick={handleRunAnalysis} 
            disabled={!aiEnabled || analyzeEvents.isPending}
          >
            {analyzeEvents.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Analyser
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleDetectAnomalies}
            disabled={!aiEnabled || detectAnomalies.isPending}
          >
            {detectAnomalies.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            Détecter anomalies
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Alertes actives</p>
                <p className="text-3xl font-bold">{stats?.activeAlerts || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {stats?.alertsByRisk.critical ? (
                <Badge variant="destructive">{stats.alertsByRisk.critical} critiques</Badge>
              ) : null}
              {stats?.alertsByRisk.high ? (
                <Badge className="bg-orange-500">{stats.alertsByRisk.high} élevées</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Décisions IA (24h)</p>
                <p className="text-3xl font-bold">{stats?.decisionsLast24h || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Brain className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Corrélations et détections automatiques
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs à risque</p>
                <p className="text-3xl font-bold">
                  {(stats?.usersAtRisk.critical || 0) + (stats?.usersAtRisk.high || 0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                <Users className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {stats?.usersAtRisk.critical ? (
                <Badge variant="destructive">{stats.usersAtRisk.critical} critiques</Badge>
              ) : null}
              {stats?.usersAtRisk.high ? (
                <Badge className="bg-orange-500">{stats.usersAtRisk.high} élevés</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Score moyen</p>
                <p className="text-3xl font-bold">{Math.round(stats?.averageRiskScore || 0)}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <Target className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <Progress 
              value={stats?.averageRiskScore || 0} 
              className="mt-4"
            />
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertes
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Risques
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Audit IA
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Patterns actifs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Patterns de corrélation
                </CardTitle>
                <CardDescription>
                  {patterns?.filter(p => p.is_enabled).length || 0} patterns actifs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {patterns?.slice(0, 8).map(pattern => (
                      <div 
                        key={pattern.id} 
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          {correlationTypeConfig[pattern.correlation_type]?.icon}
                          <div>
                            <p className="font-medium text-sm">{pattern.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {pattern.time_window_minutes} min • {pattern.min_events_threshold} événements min.
                            </p>
                          </div>
                        </div>
                        <Badge variant={pattern.is_enabled ? "default" : "secondary"}>
                          {pattern.is_enabled ? 'Actif' : 'Inactif'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Dernières décisions IA */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Dernières décisions IA
                </CardTitle>
                <CardDescription>
                  Historique des analyses automatiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {decisions?.map(decision => (
                      <div 
                        key={decision.id} 
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{decision.decision_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(decision.created_at), 'dd/MM HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm font-medium">{decision.decision_made}</p>
                        {decision.confidence_score && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Confiance:</span>
                            <Progress value={decision.confidence_score * 100} className="h-2 flex-1" />
                            <span className="text-xs">{Math.round(decision.confidence_score * 100)}%</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Distribution des alertes */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution des alertes par type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(correlationTypeConfig).map(([type, config]) => {
                  const count = alerts?.filter(a => a.correlation_type === type).length || 0;
                  return (
                    <div key={type} className="text-center p-4 rounded-lg border">
                      <div className="flex justify-center mb-2">
                        {config.icon}
                      </div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskLevel | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Niveau de risque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as CorrelationType | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type de corrélation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="temporal">Temporelle</SelectItem>
                <SelectItem value="behavioral">Comportementale</SelectItem>
                <SelectItem value="contextual">Contextuelle</SelectItem>
                <SelectItem value="data_sensitive">Données sensibles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {alertsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : alerts?.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune alerte corrélée</p>
                </CardContent>
              </Card>
            ) : (
              alerts?.map(alert => (
                <Card 
                  key={alert.id} 
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setSelectedAlertId(alert.id)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={riskLevelConfig[alert.risk_level].color}>
                            {riskLevelConfig[alert.risk_level].icon}
                            <span className="ml-1">{riskLevelConfig[alert.risk_level].label}</span>
                          </Badge>
                          <Badge variant="outline">
                            {correlationTypeConfig[alert.correlation_type]?.label}
                          </Badge>
                          <Badge variant="secondary">{alert.status}</Badge>
                        </div>
                        
                        <h3 className="font-semibold text-lg">{alert.title}</h3>
                        <p className="text-muted-foreground mt-1">{alert.description}</p>
                        
                        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Activity className="h-4 w-4" />
                            {alert.event_count} événements
                          </span>
                          <span className="flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            Score: {alert.risk_score}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(alert.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </span>
                          {alert.user_email && (
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {alert.user_email}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    {/* Risk factors preview */}
                    {alert.risk_factors && alert.risk_factors.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">Facteurs de risque</p>
                        <div className="flex flex-wrap gap-2">
                          {alert.risk_factors.slice(0, 3).map((factor, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {factor.factor}
                            </Badge>
                          ))}
                          {alert.risk_factors.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{alert.risk_factors.length - 3} autres
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <AICorrelationTimeline />
        </TabsContent>

        {/* Risk Scores Tab */}
        <TabsContent value="risk">
          <AIRiskScoresDashboard />
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Journal des décisions IA
              </CardTitle>
              <CardDescription>
                Traçabilité complète des analyses et décisions automatiques (conformité RGPD)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {decisions?.map(decision => (
                    <div key={decision.id} className="p-4 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge>{decision.decision_type}</Badge>
                          {decision.is_explainable && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Explicable
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(decision.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                        </span>
                      </div>
                      
                      <p className="font-medium">{decision.decision_made}</p>
                      
                      {decision.decision_reasoning && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {decision.decision_reasoning}
                        </p>
                      )}
                      
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Modèle: <span className="font-mono">{decision.ai_model}</span>
                        </span>
                        {decision.confidence_score && (
                          <span className="text-muted-foreground">
                            Confiance: {Math.round(decision.confidence_score * 100)}%
                          </span>
                        )}
                        {decision.processing_time_ms && (
                          <span className="text-muted-foreground">
                            Temps: {decision.processing_time_ms}ms
                          </span>
                        )}
                      </div>
                      
                      {decision.compliance_tags && decision.compliance_tags.length > 0 && (
                        <div className="mt-3 flex gap-2">
                          {decision.compliance_tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alert Detail Dialog */}
      <AIAlertDetailDialog 
        alertId={selectedAlertId}
        open={!!selectedAlertId}
        onOpenChange={(open) => !open && setSelectedAlertId(null)}
      />
    </div>
  );
};

export default AIAnalysisTab;
