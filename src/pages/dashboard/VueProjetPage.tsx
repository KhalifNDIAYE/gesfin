import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  TrendingDown, 
  ArrowDownRight,
  PiggyBank,
  FolderKanban,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
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
  Legend
} from "recharts";

// Hook for project financial data
const useProjectFinancials = (projectId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-financials', projectId],
    queryFn: async () => {
      if (!projectId) return null;

      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select(`
          id, name, code, total_budget, consumed_budget, status,
          project_bailleurs (
            contribution_amount,
            bailleur:bailleurs (name, short_name)
          )
        `)
        .eq('id', projectId)
        .single();

      if (!project) return null;

      // Get project conventions for disbursements
      const { data: contracts } = await supabase
        .from('contracts')
        .select('paid_amount, total_amount')
        .eq('project_id', projectId);

      const totalPaid = contracts?.reduce((sum, c) => sum + Number(c.paid_amount || 0), 0) || 0;

      const budget = Number(project.total_budget || 0);
      const consumed = Number(project.consumed_budget || 0);
      const remaining = budget - consumed;
      const consumptionRate = budget > 0 ? (consumed / budget) * 100 : 0;

      return {
        project: {
          id: project.id,
          name: project.name,
          code: project.code,
          status: project.status,
        },
        budget,
        expenses: consumed,
        disbursements: totalPaid,
        remaining,
        consumptionRate: Math.round(consumptionRate * 10) / 10,
        bailleurs: (project.project_bailleurs as any[])?.map(pb => ({
          name: pb.bailleur?.short_name || pb.bailleur?.name || 'N/A',
          amount: Number(pb.contribution_amount || 0),
        })) || [],
      };
    },
    enabled: !!user && !!projectId,
  });
};

// Hook for project expense breakdown
const useProjectExpenseBreakdown = (projectId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-expense-breakdown', projectId],
    queryFn: async () => {
      if (!projectId) {
        // Sample data
        return [
          { category: 'Personnel', amount: 45000000, color: 'hsl(var(--primary))' },
          { category: 'Équipements', amount: 32000000, color: 'hsl(var(--success))' },
          { category: 'Services', amount: 28000000, color: 'hsl(var(--warning))' },
          { category: 'Fonctionnement', amount: 15000000, color: 'hsl(var(--info))' },
          { category: 'Autres', amount: 8000000, color: 'hsl(var(--muted-foreground))' },
        ];
      }

      const colors = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--muted-foreground))'];

      // Get contracts by type for the project
      const { data: contracts } = await supabase
        .from('contracts')
        .select('contract_type, paid_amount')
        .eq('project_id', projectId);

      if (contracts && contracts.length > 0) {
        const typeMap: Record<string, number> = {};
        contracts.forEach(c => {
          const type = c.contract_type || 'other';
          typeMap[type] = (typeMap[type] || 0) + Number(c.paid_amount || 0);
        });

        const typeLabels: Record<string, string> = {
          works: 'Travaux',
          supplies: 'Fournitures',
          services: 'Services',
          consulting: 'Consultations',
          other: 'Autres',
        };

        return Object.entries(typeMap).map(([type, amount], index) => ({
          category: typeLabels[type] || type,
          amount,
          color: colors[index % colors.length],
        }));
      }

      return [
        { category: 'Personnel', amount: 45000000, color: colors[0] },
        { category: 'Équipements', amount: 32000000, color: colors[1] },
        { category: 'Services', amount: 28000000, color: colors[2] },
        { category: 'Fonctionnement', amount: 15000000, color: colors[3] },
        { category: 'Autres', amount: 8000000, color: colors[4] },
      ];
    },
    enabled: !!user,
  });
};

// Hook for monthly project consumption
const useProjectMonthlyConsumption = (projectId: string | null) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['project-monthly-consumption', projectId],
    queryFn: async () => {
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
      
      // Sample data - in real app, would aggregate from contract payments
      return months.map((month, i) => ({
        month,
        budget: [50000000, 50000000, 50000000, 50000000, 50000000, 50000000][i],
        depenses: [35000000, 42000000, 38000000, 45000000, 48000000, 40000000][i],
        cumul: [35000000, 77000000, 115000000, 160000000, 208000000, 248000000][i],
      }));
    },
    enabled: !!user,
  });
};

const VueProjetPage = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { projects, isLoading: projectsLoading } = useProjects();
  const { data: financials, isLoading: financialsLoading } = useProjectFinancials(selectedProjectId);
  const { data: expenseBreakdown } = useProjectExpenseBreakdown(selectedProjectId);
  const { data: monthlyData } = useProjectMonthlyConsumption(selectedProjectId);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      active: { label: 'En cours', className: 'bg-success/10 text-success' },
      completed: { label: 'Terminé', className: 'bg-muted text-muted-foreground' },
      pending: { label: 'En attente', className: 'bg-warning/10 text-warning' },
      suspended: { label: 'Suspendu', className: 'bg-destructive/10 text-destructive' },
    };
    const config = statusConfig[status] || { label: status, className: '' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getRemainingColor = (rate: number) => {
    if (rate >= 90) return 'text-destructive';
    if (rate >= 70) return 'text-warning';
    return 'text-success';
  };

  return (
    <AppLayout title="Vue Projet" subtitle="Tableau de bord par projet">
      <div className="space-y-6">
        {/* Project Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Sélection du Projet
            </CardTitle>
            <CardDescription>Choisissez un projet pour afficher ses indicateurs financiers</CardDescription>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedProjectId || ""} 
              onValueChange={(value) => setSelectedProjectId(value)}
            >
              <SelectTrigger className="w-full md:w-[400px]">
                <SelectValue placeholder="Sélectionner un projet..." />
              </SelectTrigger>
              <SelectContent>
                {projects?.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{project.code}</span>
                      <span>{project.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedProjectId && financials && (
          <>
            {/* Project Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {financials.project.name}
                  {getStatusBadge(financials.project.status)}
                </h2>
                <p className="text-sm text-muted-foreground">Code: {financials.project.code}</p>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Budget du projet */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full" />
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Budget du Projet</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(financials.budget)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {financials.bailleurs.length} bailleur(s)
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Wallet className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dépenses du projet */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-warning/10 rounded-bl-full" />
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dépenses du Projet</p>
                      <p className="text-2xl font-bold mt-1 text-warning">
                        {formatCurrency(financials.expenses)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {financials.consumptionRate}% du budget
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                      <TrendingDown className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Décaissements du projet */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-info/10 rounded-bl-full" />
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Décaissements</p>
                      <p className="text-2xl font-bold mt-1 text-info">
                        {formatCurrency(financials.disbursements)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Paiements effectués
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                      <ArrowDownRight className="h-6 w-6 text-info" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reste à consommer */}
              <Card className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-success/10 rounded-bl-full" />
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">Reste à Consommer</p>
                      <p className={`text-2xl font-bold mt-1 ${getRemainingColor(financials.consumptionRate)}`}>
                        {formatCurrency(financials.remaining)}
                      </p>
                      <Progress 
                        value={100 - financials.consumptionRate} 
                        className="h-2 mt-3"
                      />
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                      <PiggyBank className="h-6 w-6 text-success" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Évolution mensuelle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Évolution Mensuelle
                  </CardTitle>
                  <CardDescription>Budget vs Dépenses mensuelles</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData || []}>
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
                        <Bar dataKey="budget" fill="hsl(var(--muted-foreground))" name="Budget prévu" radius={[4, 4, 0, 0]} opacity={0.5} />
                        <Bar dataKey="depenses" fill="hsl(var(--primary))" name="Dépenses" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Répartition des dépenses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Répartition des Dépenses
                  </CardTitle>
                  <CardDescription>Par catégorie de dépenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseBreakdown || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="amount"
                          nameKey="category"
                          label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {expenseBreakdown?.map((entry, index) => (
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

            {/* Bailleurs contribution */}
            {financials.bailleurs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Contributions des Bailleurs</CardTitle>
                  <CardDescription>Répartition du financement par bailleur</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financials.bailleurs.map((bailleur, index) => {
                      const percentage = financials.budget > 0 
                        ? (bailleur.amount / financials.budget) * 100 
                        : 0;
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{bailleur.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(bailleur.amount)} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {!selectedProjectId && (
          <Card className="py-12">
            <CardContent className="text-center text-muted-foreground">
              <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Sélectionnez un projet pour afficher ses indicateurs financiers</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
};

export default VueProjetPage;