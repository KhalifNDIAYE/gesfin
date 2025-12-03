import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppLayout } from "@/components/layout/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  FolderKanban, 
  Building2, 
  TrendingUp,
  TrendingDown,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { 
  useDashboardStats, 
  useBudgetChartData, 
  useBailleurChartData, 
  useProjectsOverview, 
  useRecentTransactions, 
  useDashboardAlerts,
  useDashboardRealtime 
} from "@/hooks/useDashboardData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const Index = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: stats } = useDashboardStats();
  const { data: budgetChartData } = useBudgetChartData();
  const { data: bailleurChartData } = useBailleurChartData();
  const { data: projectsOverview } = useProjectsOverview();
  const { data: recentTransactions } = useRecentTransactions();
  const { data: alerts } = useDashboardAlerts();

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['budget-chart-data'] });
    queryClient.invalidateQueries({ queryKey: ['bailleur-chart-data'] });
    queryClient.invalidateQueries({ queryKey: ['projects-overview'] });
    queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-alerts'] });
  }, [queryClient]);

  useDashboardRealtime(handleRefresh);

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Mrd`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)} M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)} K`;
    return value.toString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">En cours</Badge>;
      case 'completed':
        return <Badge variant="secondary">Terminé</Badge>;
      case 'pending':
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">En attente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'danger':
        return 'bg-destructive/10 border-destructive/20';
      case 'warning':
        return 'bg-warning/10 border-warning/20';
      default:
        return 'bg-info/10 border-info/20';
    }
  };

  return (
    <AppLayout 
      title="Tableau de bord" 
      subtitle="Vue d'ensemble de la gestion financière"
    >
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="animate-slide-up opacity-0 stagger-1">
            <StatCard
              title="Budget Total"
              value={stats ? formatCurrency(stats.budgetTotal) : "0"}
              change={stats?.budgetChange || 0}
              changeLabel="vs mois dernier"
              icon={<Wallet className="h-6 w-6" />}
              variant="primary"
            />
          </div>
          <div className="animate-slide-up opacity-0 stagger-2">
            <StatCard
              title="Projets Actifs"
              value={stats?.projetsActifs?.toString() || "0"}
              change={stats?.projetsChange || 0}
              changeLabel="vs ce trimestre"
              icon={<FolderKanban className="h-6 w-6" />}
              variant="success"
            />
          </div>
          <div className="animate-slide-up opacity-0 stagger-3">
            <StatCard
              title="Bailleurs"
              value={stats?.bailleurs?.toString() || "0"}
              icon={<Building2 className="h-6 w-6" />}
              variant="info"
            />
          </div>
          <div className="animate-slide-up opacity-0 stagger-4">
            <StatCard
              title="Taux Décaissement"
              value={`${stats?.tauxDecaissement || 0}%`}
              change={stats?.tauxChange || 0}
              changeLabel="vs objectif"
              icon={<TrendingUp className="h-6 w-6" />}
              variant="warning"
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Budget Chart - 2 columns */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Suivi Budgétaire</CardTitle>
              <CardDescription>Budget vs Dépenses mensuelles (en FCFA)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetChartData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => formatCurrency(v)} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="budget" fill="hsl(var(--primary))" name="Budget" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="depenses" fill="hsl(var(--success))" name="Dépenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Donors Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par bailleur</CardTitle>
              <CardDescription>Budget total en millions FCFA</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bailleurChartData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {bailleurChartData?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects and Transactions */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Projects Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Projets en cours</CardTitle>
              <CardDescription>Vue d'ensemble des principaux projets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectsOverview?.map((project) => (
                <div 
                  key={project.id} 
                  className="space-y-2 cursor-pointer hover:bg-muted/50 p-2 rounded-lg transition-colors"
                  onClick={() => navigate(`/projets/${project.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.bailleur}</p>
                    </div>
                    {getStatusBadge(project.status)}
                  </div>
                  <Progress value={project.percentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(project.consumed)} FCFA consommés</span>
                    <span>{project.percentage}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions récentes</CardTitle>
              <CardDescription>Derniers mouvements financiers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentTransactions?.map((transaction) => (
                <div key={transaction.id} className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${transaction.type === 'income' ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    {transaction.type === 'income' ? (
                      <ArrowDownRight className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{transaction.description}</p>
                    <p className="text-xs text-muted-foreground">{transaction.project}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                      {transaction.type === 'income' ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Quick Actions */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertes
              </CardTitle>
              <CardDescription>Actions requises et notifications importantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts?.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-center justify-between rounded-lg border p-3 ${getAlertBgColor(alert.type)}`}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => navigate(alert.href)}>
                    {alert.action}
                  </Button>
                </div>
              ))}
              <Button 
                variant="ghost" 
                className="w-full text-sm" 
                onClick={() => navigate('/rapports/risques-alertes')}
              >
                Voir le tableau de bord Risques & Alertes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Actions rapides
              </CardTitle>
              <CardDescription>Raccourcis vers les opérations courantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => navigate('/decaissements')}
                >
                  <Wallet className="h-5 w-5" />
                  <span className="text-xs">Nouveau décaissement</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => navigate('/comptabilite')}
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Saisie écriture</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => navigate('/bailleurs')}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="text-xs">Ajouter bailleur</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-auto flex-col gap-2 p-4"
                  onClick={() => navigate('/projets')}
                >
                  <FolderKanban className="h-5 w-5" />
                  <span className="text-xs">Créer projet</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
