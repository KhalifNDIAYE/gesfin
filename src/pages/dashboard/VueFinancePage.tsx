import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  ArrowRight,
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line
} from "recharts";

// Hook for monthly expenses
const useMonthlyExpenses = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['monthly-expenses'],
    queryFn: async () => {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      
      // Use direct_payments as expenses proxy
      const { data: payments } = await supabase
        .from('direct_payments')
        .select('amount, payment_date, status')
        .eq('status', 'paid');

      const monthlyData: Record<string, number> = {};
      months.forEach(m => { monthlyData[m] = 0; });

      payments?.forEach(p => {
        if (p.payment_date) {
          const date = new Date(p.payment_date);
          const monthIndex = date.getMonth();
          const monthName = months[monthIndex];
          monthlyData[monthName] += Number(p.amount || 0);
        }
      });

      const hasData = Object.values(monthlyData).some(v => v > 0);
      
      if (!hasData) {
        // Sample data
        return months.map((month, i) => ({
          month,
          depenses: [45000000, 52000000, 48000000, 61000000, 55000000, 58000000, 
                     62000000, 49000000, 67000000, 54000000, 71000000, 63000000][i],
          tendance: [42000000, 48000000, 51000000, 54000000, 57000000, 60000000,
                     63000000, 66000000, 69000000, 72000000, 75000000, 78000000][i],
        }));
      }

      return months.map(month => ({
        month,
        depenses: monthlyData[month],
        tendance: monthlyData[month] * 1.1,
      }));
    },
    enabled: !!user,
  });
};

// Hook for disbursements by donor
const useDisbursementsByBailleur = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['finance-disbursements-by-bailleur'],
    queryFn: async () => {
      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];
      
      const { data: bailleurs } = await supabase
        .from('bailleurs')
        .select('id, name, short_name');

      const { data: conventions } = await supabase
        .from('conventions')
        .select('bailleur_id, disbursed_amount, total_amount');

      const bailleurData = bailleurs?.map((b, index) => {
        const bailleurConventions = conventions?.filter(c => c.bailleur_id === b.id) || [];
        const totalDisbursed = bailleurConventions.reduce((sum, c) => sum + Number(c.disbursed_amount || 0), 0);
        const totalBudget = bailleurConventions.reduce((sum, c) => sum + Number(c.total_amount || 0), 0);

        return {
          name: b.short_name || b.name,
          decaisse: totalDisbursed,
          budget: totalBudget,
          color: colors[index % colors.length],
        };
      }).filter(b => b.budget > 0) || [];

      if (bailleurData.length === 0) {
        return [
          { name: 'Banque Mondiale', decaisse: 2500000000, budget: 4500000000, color: colors[0] },
          { name: 'AFD', decaisse: 1800000000, budget: 2800000000, color: colors[1] },
          { name: 'BAD', decaisse: 1200000000, budget: 1900000000, color: colors[2] },
          { name: 'USAID', decaisse: 600000000, budget: 1000000000, color: colors[3] },
          { name: 'UE', decaisse: 350000000, budget: 500000000, color: colors[4] },
        ];
      }

      return bailleurData;
    },
    enabled: !!user,
  });
};

// Hook for budget engagement rate
const useBudgetEngagementRate = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budget-engagement-rate'],
    queryFn: async () => {
      const { data: budgetLines } = await supabase
        .from('budget_lines')
        .select(`
          forecast_amount,
          committed_amount,
          realized_amount,
          budgets!inner (name, code, status)
        `)
        .eq('budgets.status', 'approved');

      if (budgetLines && budgetLines.length > 0) {
        const totalForecast = budgetLines.reduce((sum, l) => sum + Number(l.forecast_amount || 0), 0);
        const totalCommitted = budgetLines.reduce((sum, l) => sum + Number(l.committed_amount || 0), 0);
        const totalRealized = budgetLines.reduce((sum, l) => sum + Number(l.realized_amount || 0), 0);

        return {
          forecast: totalForecast,
          committed: totalCommitted,
          realized: totalRealized,
          engagementRate: totalForecast > 0 ? (totalCommitted / totalForecast) * 100 : 0,
          realizationRate: totalForecast > 0 ? (totalRealized / totalForecast) * 100 : 0,
        };
      }

      return {
        forecast: 850000000,
        committed: 612000000,
        realized: 485000000,
        engagementRate: 72,
        realizationRate: 57,
      };
    },
    enabled: !!user,
  });
};

// Hook for budget overrun alerts
const useBudgetAlerts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budget-overrun-alerts'],
    queryFn: async () => {
      const { data: alerts } = await supabase
        .from('budget_alerts')
        .select(`
          id,
          alert_type,
          message,
          threshold_reached,
          is_resolved,
          created_at,
          budget:budgets (name, code),
          budget_line:budget_lines (description)
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (alerts && alerts.length > 0) {
        return alerts.map(a => ({
          id: a.id,
          type: a.alert_type === 'overrun' ? 'danger' : 'warning',
          budget: (a.budget as any)?.name || 'Budget',
          line: (a.budget_line as any)?.description || 'Ligne budgétaire',
          message: a.message,
          threshold: a.threshold_reached || 0,
          date: a.created_at,
        }));
      }

      // Sample data
      return [
        { id: '1', type: 'danger', budget: 'Budget Eau Potable', line: 'Travaux de forage', message: 'Dépassement de 15% du budget alloué', threshold: 115, date: new Date().toISOString() },
        { id: '2', type: 'warning', budget: 'Budget Électrification', line: 'Équipements', message: 'Seuil d\'alerte 90% atteint', threshold: 90, date: new Date().toISOString() },
        { id: '3', type: 'warning', budget: 'Budget Santé', line: 'Formations', message: 'Seuil d\'alerte 85% atteint', threshold: 85, date: new Date().toISOString() },
        { id: '4', type: 'danger', budget: 'Budget Routes', line: 'Études techniques', message: 'Dépassement de 8% du budget alloué', threshold: 108, date: new Date().toISOString() },
      ];
    },
    enabled: !!user,
  });
};

const VueFinancePage = () => {
  const navigate = useNavigate();
  const { data: monthlyExpenses } = useMonthlyExpenses();
  const { data: disbursementsByBailleur } = useDisbursementsByBailleur();
  const { data: engagementData } = useBudgetEngagementRate();
  const { data: budgetAlerts } = useBudgetAlerts();

  const getAlertBadge = (type: string) => {
    if (type === 'danger') {
      return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Dépassement</Badge>;
    }
    return <Badge className="bg-warning/10 text-warning border-warning/20">Alerte</Badge>;
  };

  return (
    <AppLayout title="Vue Finance" subtitle="Tableau de bord financier">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {/* Taux d'engagement */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Taux d'Engagement</p>
                  <p className="text-3xl font-bold mt-1 text-primary">
                    {engagementData?.engagementRate.toFixed(1)}%
                  </p>
                  <Progress value={engagementData?.engagementRate || 0} className="h-2 mt-3" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatCurrency(engagementData?.committed || 0)} engagés sur {formatCurrency(engagementData?.forecast || 0)}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Taux de réalisation */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-success/5 rounded-bl-full" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Taux de Réalisation</p>
                  <p className="text-3xl font-bold mt-1 text-success">
                    {engagementData?.realizationRate.toFixed(1)}%
                  </p>
                  <Progress value={engagementData?.realizationRate || 0} className="h-2 mt-3 bg-success/20" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatCurrency(engagementData?.realized || 0)} réalisés
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertes actives */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-destructive/5 rounded-bl-full" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Alertes Actives</p>
                  <p className="text-3xl font-bold mt-1 text-destructive">
                    {budgetAlerts?.length || 0}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {budgetAlerts?.filter(a => a.type === 'danger').length || 0} critiques
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {budgetAlerts?.filter(a => a.type === 'warning').length || 0} avertissements
                    </Badge>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Dépenses par mois */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Dépenses par Mois
              </CardTitle>
              <CardDescription>Évolution mensuelle des dépenses avec tendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyExpenses || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis 
                      className="text-xs" 
                      tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="depenses" fill="hsl(var(--primary))" name="Dépenses" radius={[4, 4, 0, 0]} />
                    <Line 
                      type="monotone" 
                      dataKey="tendance" 
                      stroke="hsl(var(--warning))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Tendance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Décaissements par bailleur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Décaissements par Bailleur
              </CardTitle>
              <CardDescription>Comparaison budget vs décaissé par bailleur</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={disbursementsByBailleur || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      className="text-xs" 
                      tickFormatter={(v) => `${(v / 1000000000).toFixed(1)}Md`}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={80}
                      className="text-xs" 
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="budget" fill="hsl(var(--muted-foreground))" name="Budget" radius={[0, 4, 4, 0]} opacity={0.5} />
                    <Bar dataKey="decaisse" fill="hsl(var(--primary))" name="Décaissé" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Alerts Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Alertes Dépassement Budgétaire
              </CardTitle>
              <CardDescription>Lignes budgétaires nécessitant une attention</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/budget/alertes')}>
              Voir toutes les alertes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {budgetAlerts?.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    alert.type === 'danger' 
                      ? 'bg-destructive/5 border-destructive/20' 
                      : 'bg-warning/5 border-warning/20'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      alert.type === 'danger' ? 'bg-destructive/10' : 'bg-warning/10'
                    }`}>
                      {alert.type === 'danger' ? (
                        <TrendingDown className="h-5 w-5 text-destructive" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{alert.budget}</p>
                        {getAlertBadge(alert.type)}
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.line}</p>
                      <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      alert.type === 'danger' ? 'text-destructive' : 'text-warning'
                    }`}>
                      {alert.threshold}%
                    </p>
                    <p className="text-xs text-muted-foreground">du budget</p>
                  </div>
                </div>
              ))}

              {(!budgetAlerts || budgetAlerts.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune alerte de dépassement budgétaire
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default VueFinancePage;