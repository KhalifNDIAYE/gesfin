import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Search, FolderKanban, TrendingUp } from "lucide-react";
import { useDisbursementsByProject } from "@/hooks/useDecaissements";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const SuiviProjetPage = () => {
  const [search, setSearch] = useState("");
  const { data: projects, isLoading } = useDisbursementsByProject();

  const filteredProjects = projects?.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase()) ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.bailleur?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBudget = projects?.reduce((sum, p) => sum + p.budget, 0) || 0;
  const totalDisbursed = projects?.reduce((sum, p) => sum + p.disbursed, 0) || 0;
  const totalRemaining = projects?.reduce((sum, p) => sum + p.remaining, 0) || 0;

  const chartData = filteredProjects?.slice(0, 8).map(p => ({
    name: p.code,
    budget: p.budget / 1000000,
    décaissé: p.disbursed / 1000000,
  })) || [];

  return (
    <AppLayout title="Suivi par Projet" subtitle="Décaissements par convention/projet">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FolderKanban className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{projects?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Projets actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Budget Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
                <p className="text-xs text-success mt-1">
                  {formatCurrency(totalDisbursed)} décaissé ({totalBudget > 0 ? ((totalDisbursed / totalBudget) * 100).toFixed(1) : 0}%)
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Solde Disponible</p>
                <p className="text-2xl font-bold text-warning">{formatCurrency(totalRemaining)}</p>
                <Progress value={totalBudget > 0 ? (totalDisbursed / totalBudget) * 100 : 0} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Budget vs Décaissements par Projet
            </CardTitle>
            <CardDescription>Comparaison en millions FCFA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(2)} M`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="budget" fill="hsl(var(--primary))" name="Budget" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="décaissé" fill="hsl(var(--success))" name="Décaissé" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Détail par Projet</CardTitle>
            <CardDescription>État des décaissements par convention</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom du Projet</TableHead>
                  <TableHead>Bailleur</TableHead>
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
                ) : filteredProjects?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun projet trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects?.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-mono">{project.code}</TableCell>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.bailleur}</TableCell>
                      <TableCell className="text-right">{formatCurrency(project.budget)}</TableCell>
                      <TableCell className="text-right text-success">{formatCurrency(project.disbursed)}</TableCell>
                      <TableCell className="text-right text-warning">{formatCurrency(project.remaining)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={project.rate} className="w-16" />
                          <span className="text-sm">{project.rate.toFixed(1)}%</span>
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

export default SuiviProjetPage;
