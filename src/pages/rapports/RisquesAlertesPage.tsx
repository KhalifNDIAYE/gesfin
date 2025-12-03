import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  AlertTriangle, 
  Clock, 
  FileX, 
  TrendingDown, 
  Shield, 
  CheckCircle,
  Download,
  FileText,
  Filter,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { 
  useRisksKPIs, 
  useDelayedProjectsByMonth, 
  useOverrunsByBailleur, 
  useBudgetAlertsTrend, 
  useTopRiskProjects,
  useRisksRealtime
} from '@/hooks/useRisksAlerts';
import { useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { toast } from 'sonner';

const RisquesAlertesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [periodFilter, setPeriodFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const { data: kpis, isLoading: kpisLoading } = useRisksKPIs();
  const { data: delayedByMonth } = useDelayedProjectsByMonth();
  const { data: overrunsByBailleur } = useOverrunsByBailleur();
  const { data: alertsTrend } = useBudgetAlertsTrend();
  const { data: topRiskProjects } = useTopRiskProjects(10);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['risks-kpis'] });
    queryClient.invalidateQueries({ queryKey: ['delayed-projects-by-month'] });
    queryClient.invalidateQueries({ queryKey: ['overruns-by-bailleur'] });
    queryClient.invalidateQueries({ queryKey: ['budget-alerts-trend'] });
    queryClient.invalidateQueries({ queryKey: ['top-risk-projects'] });
  }, [queryClient]);

  // Real-time updates
  useRisksRealtime(handleRefresh);

  const handleExportPDF = () => {
    toast.info('Export PDF en cours de préparation...');
    // Implementation would go here
  };

  const handleExportExcel = () => {
    toast.info('Export Excel en cours de préparation...');
    // Implementation would go here
  };

  const filteredProjects = topRiskProjects?.filter(p => {
    if (riskFilter !== 'all' && p.risk_level !== riskFilter) return false;
    return true;
  }) || [];

  const kpiCards = [
    {
      title: 'Projets en retard',
      value: kpis?.projetsEnRetard || 0,
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      href: '/projets?filter=retard',
    },
    {
      title: 'Conventions expirées',
      value: kpis?.conventionsExpirees || 0,
      icon: FileX,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      href: '/conventions?filter=expired',
    },
    {
      title: 'Dépassements budget',
      value: kpis?.depassementsBudget || 0,
      icon: TrendingDown,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      href: '/budget/alertes',
    },
    {
      title: 'Actions bloquées',
      value: kpis?.actionsBloquees || 0,
      icon: Shield,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      href: '/securite/tentatives-bloquees',
    },
    {
      title: 'Validations en attente',
      value: kpis?.validationsEnAttente || 0,
      icon: CheckCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      href: '/budget/alertes',
    },
  ];

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive">Critique</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Moyen</Badge>;
      default:
        return <Badge variant="secondary">Faible</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)} Mrd`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)} M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)} K`;
    return value.toString();
  };

  return (
    <AppLayout
      title="Risques & Alertes"
      subtitle="Tableau de bord stratégique de gestion des risques"
    >
      <div className="space-y-6">
        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les périodes</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[180px]">
                <AlertTriangle className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Niveau de risque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les niveaux</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {kpiCards.map((kpi, index) => (
            <Card 
              key={index} 
              className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
              onClick={() => navigate(kpi.href)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`rounded-lg p-2 ${kpi.bgColor}`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <span className="text-2xl font-bold">{kpi.value}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{kpi.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Delayed Projects by Month */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Projets en retard par mois
              </CardTitle>
              <CardDescription>Distribution mensuelle des retards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={delayedByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Budget Overruns by Bailleur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                Dépassements par bailleur
              </CardTitle>
              <CardDescription>Répartition des dépassements budgétaires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {overrunsByBailleur && overrunsByBailleur.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overrunsByBailleur}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {overrunsByBailleur.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    Aucun dépassement enregistré
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Alerts Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Évolution des alertes budgétaires
            </CardTitle>
            <CardDescription>Tendance mensuelle des alertes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={alertsTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--warning))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Risk Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Top 10 des projets à risque
            </CardTitle>
            <CardDescription>Projets nécessitant une attention particulière</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Bailleur</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Consommé</TableHead>
                  <TableHead className="text-center">Retard</TableHead>
                  <TableHead className="text-center">Risque</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{project.code}</TableCell>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.bailleur_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(project.budget)}</TableCell>
                      <TableCell className="text-right">
                        <span className={project.consumed > project.budget ? 'text-destructive font-medium' : ''}>
                          {formatCurrency(project.consumed)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {project.delay_days > 0 ? (
                          <span className="text-orange-500 font-medium">{project.delay_days}j</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{getRiskBadge(project.risk_level)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/projets/${project.id}`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun projet à risque trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default RisquesAlertesPage;
