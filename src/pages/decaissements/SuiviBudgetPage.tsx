import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Search, Wallet, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
import { useBudgetComparison } from "@/hooks/useDecaissements";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";

const SuiviBudgetPage = () => {
  const [search, setSearch] = useState("");
  const { data: budgetLines, isLoading } = useBudgetComparison();

  const filteredLines = budgetLines?.filter(line =>
    line.budget.toLowerCase().includes(search.toLowerCase()) ||
    line.category.toLowerCase().includes(search.toLowerCase()) ||
    line.accountCode.toLowerCase().includes(search.toLowerCase())
  );

  const totalForecast = budgetLines?.reduce((sum, l) => sum + l.forecast, 0) || 0;
  const totalRealized = budgetLines?.reduce((sum, l) => sum + l.realized, 0) || 0;
  const totalCommitted = budgetLines?.reduce((sum, l) => sum + l.committed, 0) || 0;
  const overBudgetCount = budgetLines?.filter(l => l.realized > l.forecast).length || 0;

  const chartData = filteredLines?.slice(0, 10).map(line => ({
    name: line.accountCode || line.category.substring(0, 15),
    prévision: line.forecast / 1000000,
    réalisé: line.realized / 1000000,
    engagé: line.committed / 1000000,
  })) || [];

  return (
    <AppLayout title="Suivi par Budget" subtitle="Comparaison décaissements vs budget">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(totalForecast)}</p>
                  <p className="text-sm text-muted-foreground">Budget prévu</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <TrendingUp className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">{formatCurrency(totalCommitted)}</p>
                  <p className="text-sm text-muted-foreground">Engagé</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{formatCurrency(totalRealized)}</p>
                  <p className="text-sm text-muted-foreground">Réalisé</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-destructive">{overBudgetCount}</p>
                  <p className="text-sm text-muted-foreground">Dépassements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Comparaison Budget vs Réalisé
            </CardTitle>
            <CardDescription>Par ligne budgétaire (en millions FCFA)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="name" className="text-xs" width={80} />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(2)} M`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="prévision" fill="hsl(var(--primary))" name="Prévision" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="engagé" fill="hsl(var(--warning))" name="Engagé" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="réalisé" fill="hsl(var(--success))" name="Réalisé" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une ligne budgétaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Budget Lines Table */}
        <Card>
          <CardHeader>
            <CardTitle>Détail des Lignes Budgétaires</CardTitle>
            <CardDescription>Comparaison prévision vs réalisation</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Budget</TableHead>
                  <TableHead>Compte</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead className="text-right">Prévision</TableHead>
                  <TableHead className="text-right">Engagé</TableHead>
                  <TableHead className="text-right">Réalisé</TableHead>
                  <TableHead className="text-right">Écart</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">Chargement...</TableCell>
                  </TableRow>
                ) : filteredLines?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucune ligne budgétaire trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLines?.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.budget}</TableCell>
                      <TableCell className="font-mono text-sm">{line.accountCode}</TableCell>
                      <TableCell>{line.category}</TableCell>
                      <TableCell className="text-right">{formatCurrency(line.forecast)}</TableCell>
                      <TableCell className="text-right text-warning">{formatCurrency(line.committed)}</TableCell>
                      <TableCell className="text-right text-success">{formatCurrency(line.realized)}</TableCell>
                      <TableCell className={`text-right ${line.variance >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {line.variance >= 0 ? '+' : ''}{formatCurrency(line.variance)}
                      </TableCell>
                      <TableCell>
                        {line.realized > line.forecast ? (
                          <Badge variant="destructive">Dépassement</Badge>
                        ) : line.realized >= line.forecast * 0.9 ? (
                          <Badge className="bg-warning/10 text-warning border-warning/20">Attention</Badge>
                        ) : (
                          <Badge className="bg-success/10 text-success border-success/20">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SuiviBudgetPage;
