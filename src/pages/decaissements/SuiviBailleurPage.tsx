import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Search, Building2, TrendingUp } from "lucide-react";
import { useDisbursementsByBailleur } from "@/hooks/useDecaissements";
import { formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--info))'];

const SuiviBailleurPage = () => {
  const [search, setSearch] = useState("");
  const { data: bailleurs, isLoading } = useDisbursementsByBailleur();

  const filteredBailleurs = bailleurs?.filter(b =>
    b.code.toLowerCase().includes(search.toLowerCase()) ||
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalBudget = bailleurs?.reduce((sum, b) => sum + b.budget, 0) || 0;
  const totalDisbursed = bailleurs?.reduce((sum, b) => sum + b.disbursed, 0) || 0;
  const activeBailleurs = bailleurs?.filter(b => b.conventions > 0).length || 0;

  const pieData = bailleurs?.filter(b => b.disbursed > 0).slice(0, 5).map((b, index) => ({
    name: b.name,
    value: b.disbursed,
    color: COLORS[index % COLORS.length],
  })) || [];

  return (
    <AppLayout title="Suivi par Bailleur" subtitle="Décaissements par source de financement">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeBailleurs}</p>
                  <p className="text-sm text-muted-foreground">Bailleurs actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Financement Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Décaissé</p>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalDisbursed)}</p>
                <Progress value={totalBudget > 0 ? (totalDisbursed / totalBudget) * 100 : 0} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Répartition par Bailleur
              </CardTitle>
              <CardDescription>Part des décaissements par source</CardDescription>
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
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Bailleurs */}
          <Card>
            <CardHeader>
              <CardTitle>Top Bailleurs</CardTitle>
              <CardDescription>Par montant décaissé</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bailleurs?.sort((a, b) => b.disbursed - a.disbursed).slice(0, 5).map((bailleur, index) => (
                  <div key={bailleur.id} className="flex items-center gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{bailleur.name}</span>
                        <span className="text-sm text-muted-foreground">{bailleur.rate.toFixed(1)}%</span>
                      </div>
                      <Progress value={bailleur.rate} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatCurrency(bailleur.disbursed)}</span>
                        <span>{formatCurrency(bailleur.budget)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un bailleur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Bailleurs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Détail par Bailleur</CardTitle>
            <CardDescription>État des décaissements par source de financement</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Bailleur</TableHead>
                  <TableHead className="text-center">Conventions</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Décaissé</TableHead>
                  <TableHead className="text-right">Restant</TableHead>
                  <TableHead>Taux</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Chargement...</TableCell>
                  </TableRow>
                ) : filteredBailleurs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun bailleur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBailleurs?.map((bailleur) => (
                    <TableRow key={bailleur.id}>
                      <TableCell className="font-mono">{bailleur.code}</TableCell>
                      <TableCell className="font-medium">{bailleur.name}</TableCell>
                      <TableCell className="text-center">{bailleur.conventions}</TableCell>
                      <TableCell className="text-right">{formatCurrency(bailleur.budget)}</TableCell>
                      <TableCell className="text-right text-success">{formatCurrency(bailleur.disbursed)}</TableCell>
                      <TableCell className="text-right text-warning">{formatCurrency(bailleur.remaining)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={bailleur.rate} className="w-16" />
                          <span className="text-sm">{bailleur.rate.toFixed(1)}%</span>
                        </div>
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

export default SuiviBailleurPage;
