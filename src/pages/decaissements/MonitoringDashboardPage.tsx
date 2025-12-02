import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  PieChart as PieChartIcon
} from "lucide-react";
import { useDisbursementStats, useDisbursementsByBailleur, useDisbursementsByProject, useBudgetComparison } from "@/hooks/useDecaissements";
import { formatCurrency } from "@/lib/utils";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend,
  BarChart, Bar
} from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--info))'];

const MonitoringDashboardPage = () => {
  const { data: stats } = useDisbursementStats();
  const { data: bailleurs } = useDisbursementsByBailleur();
  const { data: projects } = useDisbursementsByProject();
  const { data: budgetLines } = useBudgetComparison();

  const totalBudget = projects?.reduce((sum, p) => sum + p.budget, 0) || 0;
  const totalDisbursed = projects?.reduce((sum, p) => sum + p.disbursed, 0) || 0;
  const consumptionRate = totalBudget > 0 ? (totalDisbursed / totalBudget) * 100 : 0;

  const pieData = bailleurs?.filter(b => b.disbursed > 0).slice(0, 5).map((b, index) => ({
    name: b.name,
    value: b.disbursed,
    color: COLORS[index % COLORS.length],
  })) || [];

  const projectPerformance = projects?.slice(0, 6).map(p => ({
    name: p.code,
    taux: p.rate,
  })) || [];

  const alertsCount = budgetLines?.filter(l => l.realized > l.forecast * 0.9).length || 0;
  const overBudgetCount = budgetLines?.filter(l => l.realized > l.forecast).length || 0;

  return (
    <AppLayout title="Tableau de Bord Monitoring" subtitle="Vue consolidée du suivi financier">
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux de Consommation</p>
                  <p className="text-3xl font-bold">{consumptionRate.toFixed(1)}%</p>
                  <Progress value={consumptionRate} className="mt-2 h-2" />
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Décaissé</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(totalDisbursed)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-xs text-success">+12.5% ce mois</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En Attente</p>
                  <p className="text-2xl font-bold text-warning">{stats?.pending || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">opérations à valider</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alertes</p>
                  <p className="text-2xl font-bold text-destructive">{alertsCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">dont {overBudgetCount} dépassements</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Disbursement by Bailleur Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Répartition par Bailleur
              </CardTitle>
              <CardDescription>Part des décaissements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Project Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance par Projet
              </CardTitle>
              <CardDescription>Taux de décaissement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={projectPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} className="text-xs" />
                    <YAxis type="category" dataKey="name" className="text-xs" width={60} />
                    <Tooltip 
                      formatter={(value: number) => `${value.toFixed(1)}%`}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="taux" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                      name="Taux de décaissement"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Status Grid */}
        <Card>
          <CardHeader>
            <CardTitle>État des Projets</CardTitle>
            <CardDescription>Vue d'ensemble de l'avancement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects?.slice(0, 6).map((project) => (
                <div key={project.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{project.code}</span>
                    <Badge variant={project.rate >= 80 ? "default" : project.rate >= 50 ? "secondary" : "outline"}>
                      {project.rate.toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 truncate">{project.name}</p>
                  <Progress value={project.rate} className="h-2 mb-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(project.disbursed)}</span>
                    <span>{formatCurrency(project.budget)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Projets Performants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{projects?.filter(p => p.rate >= 70).length || 0}</p>
                  <p className="text-xs text-muted-foreground">Taux {">"} 70%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Projets en Retard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{projects?.filter(p => p.rate < 30).length || 0}</p>
                  <p className="text-xs text-muted-foreground">Taux {"<"} 30%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Bailleurs Actifs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{bailleurs?.filter(b => b.conventions > 0).length || 0}</p>
                  <p className="text-xs text-muted-foreground">avec conventions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default MonitoringDashboardPage;
