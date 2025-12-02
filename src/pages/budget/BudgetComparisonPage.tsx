import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, BarChart3, ArrowRight, Minus } from "lucide-react";
import { useBudgets, useBudgetLines, Budget } from "@/hooks/useBudget";
import { useFiscalYears } from "@/hooks/useParametrage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";

export default function BudgetComparisonPage() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [selectedBudget, setSelectedBudget] = useState<string>("");

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  const fiscalYearId = selectedFiscalYear || currentFiscalYear?.id;

  const { data: budgets } = useBudgets(fiscalYearId);
  const { data: lines, isLoading } = useBudgetLines(selectedBudget);

  const selectedBudgetData = budgets?.find(b => b.id === selectedBudget);

  // Prepare chart data
  const chartData = lines?.map(line => ({
    name: line.account?.code || `Ligne ${line.line_number}`,
    prevision: Number(line.forecast_amount),
    engage: Number(line.committed_amount),
    realise: Number(line.realized_amount),
    ecart: Number(line.variance_amount),
  })) || [];

  // Calculate totals
  const totals = {
    forecast: lines?.reduce((sum, l) => sum + Number(l.forecast_amount), 0) || 0,
    committed: lines?.reduce((sum, l) => sum + Number(l.committed_amount), 0) || 0,
    realized: lines?.reduce((sum, l) => sum + Number(l.realized_amount), 0) || 0,
    variance: lines?.reduce((sum, l) => sum + Number(l.variance_amount), 0) || 0,
  };

  const consumptionRate = totals.forecast > 0 ? (totals.realized / totals.forecast) * 100 : 0;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {Number(entry.value).toLocaleString('fr-FR')} FCFA
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getVarianceIndicator = (variance: number, forecast: number) => {
    if (forecast === 0) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const percentage = (variance / forecast) * 100;
    if (variance >= 0) {
      return (
        <span className="flex items-center text-green-600">
          <TrendingUp className="h-4 w-4 mr-1" />
          +{percentage.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="flex items-center text-red-600">
        <TrendingDown className="h-4 w-4 mr-1" />
        {percentage.toFixed(1)}%
      </span>
    );
  };

  return (
    <AppLayout
      title="Comparaison Budget vs Réalisé"
      subtitle="Analyse des écarts budgétaires"
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex gap-4">
          <Select
            value={selectedFiscalYear || currentFiscalYear?.id || ""}
            onValueChange={(value) => {
              setSelectedFiscalYear(value);
              setSelectedBudget("");
            }}
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

          <Select value={selectedBudget} onValueChange={setSelectedBudget}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Sélectionner un budget" />
            </SelectTrigger>
            <SelectContent>
              {budgets?.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.code} - {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedBudget ? (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Prévision</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {totals.forecast.toLocaleString('fr-FR')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedBudgetData?.currency?.symbol}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Réalisé</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {totals.realized.toLocaleString('fr-FR')}
                  </div>
                  <Progress value={Math.min(consumptionRate, 100)} className="h-2 mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Écart</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totals.variance >= 0 ? '+' : ''}{totals.variance.toLocaleString('fr-FR')}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {totals.variance >= 0 ? 'Économie' : 'Dépassement'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Taux d'exécution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${consumptionRate > 100 ? 'text-red-600' : ''}`}>
                    {consumptionRate.toFixed(1)}%
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span>Prévision</span>
                    <ArrowRight className="h-3 w-3 mx-1" />
                    <span>Réalisé</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Comparaison par Ligne Budgétaire
                </CardTitle>
                <CardDescription>Prévision vs Engagé vs Réalisé</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        className="text-xs"
                      />
                      <YAxis tickFormatter={formatCurrency} className="text-xs" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="prevision" name="Prévision" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="engage" name="Engagé" fill="#f97316" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="realise" name="Réalisé" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                    <p>Aucune donnée disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card>
              <CardHeader>
                <CardTitle>Détail des Écarts</CardTitle>
                <CardDescription>Analyse ligne par ligne</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Compte</TableHead>
                        <TableHead className="text-right">Prévision</TableHead>
                        <TableHead className="text-right">Engagé</TableHead>
                        <TableHead className="text-right">Réalisé</TableHead>
                        <TableHead className="text-right">Écart</TableHead>
                        <TableHead>Variation</TableHead>
                        <TableHead>Exécution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Aucune ligne budgétaire
                          </TableCell>
                        </TableRow>
                      ) : (
                        <>
                          {lines?.map((line) => {
                            const execRate = line.forecast_amount > 0 
                              ? (Number(line.realized_amount) / Number(line.forecast_amount)) * 100 
                              : 0;
                            return (
                              <TableRow key={line.id} className={line.is_over_budget ? "bg-red-50 dark:bg-red-950/20" : ""}>
                                <TableCell>{line.line_number}</TableCell>
                                <TableCell>
                                  {line.account ? (
                                    <>
                                      <Badge variant="outline">{line.account.code}</Badge>
                                      <span className="ml-2 text-sm">{line.account.name}</span>
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground">{line.description || "-"}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono text-blue-600">
                                  {Number(line.forecast_amount).toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell className="text-right font-mono text-yellow-600">
                                  {Number(line.committed_amount).toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell className="text-right font-mono text-green-600">
                                  {Number(line.realized_amount).toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell className={`text-right font-mono ${Number(line.variance_amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {Number(line.variance_amount) >= 0 ? '+' : ''}
                                  {Number(line.variance_amount).toLocaleString('fr-FR')}
                                </TableCell>
                                <TableCell>
                                  {getVarianceIndicator(Number(line.variance_amount), Number(line.forecast_amount))}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress value={Math.min(execRate, 100)} className="w-16 h-2" />
                                    <span className={`text-xs ${execRate > 100 ? 'text-red-600 font-bold' : ''}`}>
                                      {execRate.toFixed(0)}%
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {/* Total Row */}
                          <TableRow className="bg-muted/50 font-bold">
                            <TableCell colSpan={2}>TOTAL</TableCell>
                            <TableCell className="text-right font-mono text-blue-600">
                              {totals.forecast.toLocaleString('fr-FR')}
                            </TableCell>
                            <TableCell className="text-right font-mono text-yellow-600">
                              {totals.committed.toLocaleString('fr-FR')}
                            </TableCell>
                            <TableCell className="text-right font-mono text-green-600">
                              {totals.realized.toLocaleString('fr-FR')}
                            </TableCell>
                            <TableCell className={`text-right font-mono ${totals.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {totals.variance >= 0 ? '+' : ''}
                              {totals.variance.toLocaleString('fr-FR')}
                            </TableCell>
                            <TableCell>
                              {getVarianceIndicator(totals.variance, totals.forecast)}
                            </TableCell>
                            <TableCell>
                              <span className={`text-sm ${consumptionRate > 100 ? 'text-red-600' : ''}`}>
                                {consumptionRate.toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        </>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BarChart3 className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">Sélectionnez un budget pour voir la comparaison</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
