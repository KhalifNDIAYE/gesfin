import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wallet, TrendingUp, TrendingDown, AlertTriangle, Target, CheckCircle, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { useBudgets, useBudgetSummary, useBudgetAlerts } from "@/hooks/useBudget";
import { useFiscalYears } from "@/hooks/useParametrage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#06b6d4'];

export default function BudgetDashboardPage() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  const fiscalYearId = selectedFiscalYear || currentFiscalYear?.id;

  const { data: summary, isLoading } = useBudgetSummary(fiscalYearId);
  const { data: budgets } = useBudgets(fiscalYearId);
  const { data: alerts } = useBudgetAlerts(undefined, true);

  const unreadAlerts = alerts?.filter(a => !a.is_read).length || 0;
  const consumptionRate = summary?.totalForecast ? (summary.totalRealized / summary.totalForecast) * 100 : 0;
  const engagementRate = summary?.totalForecast ? (summary.totalCommitted / summary.totalForecast) * 100 : 0;

  // Pie chart data
  const pieData = [
    { name: 'Réalisé', value: summary?.totalRealized || 0, color: '#22c55e' },
    { name: 'Engagé', value: summary?.totalCommitted || 0, color: '#f97316' },
    { name: 'Disponible', value: Math.max(0, (summary?.totalForecast || 0) - (summary?.totalRealized || 0) - (summary?.totalCommitted || 0)), color: '#3b82f6' },
  ].filter(item => item.value > 0);

  // Bar chart data by budget
  const budgetBarData = budgets?.slice(0, 6).map(b => ({
    name: b.code,
    prevision: b.total_amount,
    realise: 0, // Would need to aggregate from lines
  })) || [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-1">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color || entry.fill }}>
              {entry.name}: {Number(entry.value).toLocaleString('fr-FR')} FCFA
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AppLayout
      title="Tableau de Bord Budgétaire"
      subtitle="Vue d'ensemble du suivi budgétaire"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Select
            value={selectedFiscalYear || currentFiscalYear?.id || ""}
            onValueChange={setSelectedFiscalYear}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Exercice" />
            </SelectTrigger>
            <SelectContent>
              {fiscalYears?.map((fy) => (
                <SelectItem key={fy.id} value={fy.id}>
                  {fy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-blue-500" />
                    Total Prévisions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(summary?.totalForecast || 0).toLocaleString('fr-FR')} FCFA
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary?.totalBudgets || 0} budget(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4 text-yellow-500" />
                    Engagements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {(summary?.totalCommitted || 0).toLocaleString('fr-FR')} FCFA
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {engagementRate.toFixed(1)}% du budget
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Réalisations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {(summary?.totalRealized || 0).toLocaleString('fr-FR')} FCFA
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {consumptionRate.toFixed(1)}% consommé
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Alertes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {unreadAlerts}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary?.overBudgetLines || 0} ligne(s) en dépassement
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Consumption Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Taux de Consommation Global
                </CardTitle>
                <CardDescription>Progression budgétaire</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Engagements</span>
                    <span className="font-mono">{engagementRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={Math.min(engagementRate, 100)} className="h-3 bg-yellow-100" />

                  <div className="flex items-center justify-between text-sm mt-4">
                    <span>Réalisations</span>
                    <span className="font-mono">{consumptionRate.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(consumptionRate, 100)} 
                    className={`h-3 ${consumptionRate > 100 ? 'bg-red-100' : 'bg-green-100'}`} 
                  />

                  <div className="flex items-center justify-between text-sm pt-4 border-t">
                    <span>Disponible</span>
                    <span className="font-mono font-bold">
                      {Math.max(0, (summary?.totalForecast || 0) - (summary?.totalRealized || 0)).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Répartition du Budget
                  </CardTitle>
                  <CardDescription>Disponible vs Engagé vs Réalisé</CardDescription>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <PieChartIcon className="h-12 w-12 mb-4 opacity-50" />
                      <p>Aucune donnée à afficher</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Alertes Récentes
                  </CardTitle>
                  <CardDescription>Dernières alertes non résolues</CardDescription>
                </CardHeader>
                <CardContent>
                  {alerts && alerts.length > 0 ? (
                    <div className="space-y-3">
                      {alerts.slice(0, 5).map((alert) => (
                        <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <Badge
                            variant="outline"
                            className={
                              alert.alert_type === 'overspent'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : alert.alert_type === 'critical'
                                ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            }
                          >
                            {alert.alert_type === 'overspent' ? 'Dépassé' : alert.alert_type === 'critical' ? 'Critique' : 'Attention'}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{alert.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {alert.budget?.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mb-4 opacity-50 text-green-500" />
                      <p>Aucune alerte active</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Variance Indicators */}
            <Card>
              <CardHeader>
                <CardTitle>Écarts Budgétaires</CardTitle>
                <CardDescription>Analyse des variances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {(summary?.totalVariance || 0) >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      <span className="text-sm text-muted-foreground">Écart Total</span>
                    </div>
                    <div className={`text-2xl font-bold ${(summary?.totalVariance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(summary?.totalVariance || 0).toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span className="text-sm text-muted-foreground">Lignes en Dépassement</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {summary?.overBudgetLines || 0}
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Wallet className="h-5 w-5 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Reste à Engager</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.max(0, (summary?.totalForecast || 0) - (summary?.totalCommitted || 0)).toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
