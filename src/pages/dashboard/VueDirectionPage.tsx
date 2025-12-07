import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon,
  BarChart3,
  Target,
  ArrowUpRight,
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

// Custom hook for direction dashboard data
const useDirectionStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['direction-stats'],
    queryFn: async () => {
      // Get total budget from approved budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('total_amount')
        .eq('status', 'approved');
      
      const budgetTotal = budgets?.reduce((sum, b) => sum + Number(b.total_amount || 0), 0) || 0;

      // Get expenses from journal entries
      const { data: expenses } = await supabase
        .from('journal_entry_lines')
        .select('debit_amount, credit_amount')
        .gt('debit_amount', 0);
      
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.debit_amount || 0), 0) || 0;

      // Calculate balance and execution rate
      const solde = budgetTotal - totalExpenses;
      const tauxExecution = budgetTotal > 0 ? (totalExpenses / budgetTotal) * 100 : 0;

      return {
        budgetTotal,
        totalExpenses,
        solde,
        tauxExecution: Math.round(tauxExecution * 10) / 10,
      };
    },
    enabled: !!user,
  });
};

const useBudgetVsRealise = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budget-vs-realise'],
    queryFn: async () => {
      const categories = ['Personnel', 'Équipements', 'Services', 'Fonctionnement', 'Investissements', 'Autres'];
      
      const { data: budgetLines } = await supabase
        .from('budget_lines')
        .select(`
          forecast_amount,
          realized_amount,
          plan_accounts:account_id (name, code)
        `);

      // If we have data, aggregate by category
      if (budgetLines && budgetLines.length > 0) {
        const categoryData: Record<string, { budget: number; realise: number }> = {};
        
        budgetLines.forEach(line => {
          const categoryName = (line.plan_accounts as any)?.name || 'Autres';
          const shortName = categoryName.length > 15 ? categoryName.substring(0, 12) + '...' : categoryName;
          
          if (!categoryData[shortName]) {
            categoryData[shortName] = { budget: 0, realise: 0 };
          }
          categoryData[shortName].budget += Number(line.forecast_amount || 0);
          categoryData[shortName].realise += Number(line.realized_amount || 0);
        });

        return Object.entries(categoryData)
          .slice(0, 6)
          .map(([category, data]) => ({
            category,
            budget: data.budget,
            realise: data.realise,
          }));
      }

      // Sample data
      return categories.map((category, i) => ({
        category,
        budget: [150000000, 80000000, 120000000, 60000000, 200000000, 40000000][i],
        realise: [120000000, 75000000, 90000000, 55000000, 150000000, 30000000][i],
      }));
    },
    enabled: !!user,
  });
};

const useExpensesByProject = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['expenses-by-project'],
    queryFn: async () => {
      const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))'];
      
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, code, consumed_budget, total_budget')
        .order('consumed_budget', { ascending: false })
        .limit(6);

      if (projects && projects.length > 0) {
        return projects.map((p, index) => ({
          name: p.code || p.name?.substring(0, 10) || `Projet ${index + 1}`,
          value: Number(p.consumed_budget || 0),
          color: colors[index % colors.length],
        }));
      }

      // Sample data
      return [
        { name: 'Eau Potable', value: 450000000, color: colors[0] },
        { name: 'Électrification', value: 320000000, color: colors[1] },
        { name: 'Routes', value: 280000000, color: colors[2] },
        { name: 'Santé', value: 180000000, color: colors[3] },
        { name: 'Éducation', value: 120000000, color: colors[4] },
      ];
    },
    enabled: !!user,
  });
};

const useTop5Projects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['top-5-consuming-projects'],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id, 
          name, 
          code, 
          consumed_budget, 
          total_budget,
          project_bailleurs(bailleur:bailleurs(name, short_name))
        `)
        .order('consumed_budget', { ascending: false })
        .limit(5);

      if (projects && projects.length > 0) {
        return projects.map(p => ({
          id: p.id,
          name: p.name,
          code: p.code,
          bailleur: (p.project_bailleurs as any)?.[0]?.bailleur?.short_name || 
                    (p.project_bailleurs as any)?.[0]?.bailleur?.name || 'N/A',
          consumed: Number(p.consumed_budget || 0),
          budget: Number(p.total_budget || 0),
          percentage: p.total_budget && p.total_budget > 0 
            ? Math.round((Number(p.consumed_budget || 0) / Number(p.total_budget)) * 100) 
            : 0,
        }));
      }

      // Sample data
      return [
        { id: '1', name: 'Programme Eau Potable Rural', code: 'PEPR', bailleur: 'BM', consumed: 1875000000, budget: 2500000000, percentage: 75 },
        { id: '2', name: 'Électrification Villages', code: 'ELEV', bailleur: 'AFD', consumed: 900000000, budget: 1800000000, percentage: 50 },
        { id: '3', name: 'Routes Nationales Phase II', code: 'RNII', bailleur: 'BAD', consumed: 4750000000, budget: 5000000000, percentage: 95 },
        { id: '4', name: 'Santé Communautaire', code: 'SACO', bailleur: 'USAID', consumed: 240000000, budget: 800000000, percentage: 30 },
        { id: '5', name: 'Formation Professionnelle', code: 'FPRO', bailleur: 'UE', consumed: 175000000, budget: 350000000, percentage: 50 },
      ];
    },
    enabled: !!user,
  });
};

const VueDirectionPage = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useDirectionStats();
  const { data: budgetVsRealise } = useBudgetVsRealise();
  const { data: expensesByProject } = useExpensesByProject();
  const { data: top5Projects } = useTop5Projects();

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-destructive';
    if (percentage >= 70) return 'text-warning';
    return 'text-success';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <AppLayout title="Vue Direction" subtitle="Tableau de bord exécutif">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Budget Total */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Budget Total</p>
                  <p className="text-2xl font-bold mt-1">
                    {statsLoading ? "..." : formatCurrency(stats?.budgetTotal || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-success">
                    <TrendingUp className="h-3 w-3" />
                    <span>+8.2% vs année précédente</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dépenses */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-warning/10 rounded-bl-full" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Dépenses</p>
                  <p className="text-2xl font-bold mt-1 text-warning">
                    {statsLoading ? "..." : formatCurrency(stats?.totalExpenses || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>Cumul exercice en cours</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <TrendingDown className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Solde */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-success/10 rounded-bl-full" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Solde Disponible</p>
                  <p className="text-2xl font-bold mt-1 text-success">
                    {statsLoading ? "..." : formatCurrency(stats?.solde || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" />
                    <span>Reste à consommer</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <BarChart3 className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Taux d'exécution */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-info/10 rounded-bl-full" />
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Taux d'Exécution</p>
                  <p className="text-2xl font-bold mt-1 text-info">
                    {statsLoading ? "..." : `${stats?.tauxExecution || 0}%`}
                  </p>
                  <Progress 
                    value={stats?.tauxExecution || 0} 
                    className="h-2 mt-3"
                  />
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                  <Target className="h-6 w-6 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Budget vs Réalisé */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Budget vs Réalisé
              </CardTitle>
              <CardDescription>Comparaison par catégorie de dépenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetVsRealise || []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number" 
                      className="text-xs" 
                      tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                    />
                    <YAxis 
                      dataKey="category" 
                      type="category" 
                      width={100}
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
                    <Bar dataKey="budget" fill="hsl(var(--primary))" name="Budget" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="realise" fill="hsl(var(--success))" name="Réalisé" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Dépenses par projet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Dépenses par Projet
              </CardTitle>
              <CardDescription>Répartition des dépenses cumulées</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByProject || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {expensesByProject?.map((entry, index) => (
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

        {/* Top 5 Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top 5 Projets les Plus Consommateurs
            </CardTitle>
            <CardDescription>Classement par montant de dépenses cumulées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {top5Projects?.map((project, index) => (
                <div 
                  key={project.id} 
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projets/${project.id}`)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{project.name}</p>
                      <Badge variant="outline">{project.code}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Bailleur: {project.bailleur}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Budget: {formatCurrency(project.budget)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(project.consumed)}</p>
                    <p className={`text-sm ${getPercentageColor(project.percentage)}`}>
                      {project.percentage}% consommé
                    </p>
                  </div>
                  <div className="w-24">
                    <Progress 
                      value={project.percentage} 
                      className={`h-2 ${getProgressColor(project.percentage)}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default VueDirectionPage;