import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download, 
  Plus,
  TrendingUp
} from "lucide-react";
import { useDisbursementStats, useFluxEvolution, useRecentMovements } from "@/hooks/useDecaissements";
import { formatCurrency } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";

const DecaissementsPage = () => {
  const [search, setSearch] = useState("");
  const { data: stats, isLoading: statsLoading } = useDisbursementStats();
  const { data: fluxData } = useFluxEvolution();
  const { data: movements, isLoading: movementsLoading } = useRecentMovements();

  const filteredMovements = movements?.filter(m => 
    m.reference.toLowerCase().includes(search.toLowerCase()) ||
    m.description.toLowerCase().includes(search.toLowerCase()) ||
    m.bailleur.toLowerCase().includes(search.toLowerCase()) ||
    m.beneficiary.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    toast.success("Export des mouvements en cours...");
  };

  const handleNewMovement = () => {
    toast.info("Fonctionnalité de nouveau mouvement à venir");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valide':
        return <Badge className="bg-success/10 text-success border-success/20">Validé</Badge>;
      case 'en_attente':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">En attente</Badge>;
      case 'rejete':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'encaissement') {
      return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10"><ArrowDownLeft className="h-4 w-4 text-success" /></div>;
    }
    return <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10"><ArrowUpRight className="h-4 w-4 text-warning" /></div>;
  };

  return (
    <AppLayout title="Décaissements" subtitle="Suivi des flux financiers">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <ArrowDownLeft className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">
                    {statsLoading ? "..." : formatCurrency(stats?.totalEncaissements || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Encaissements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <ArrowUpRight className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">
                    {statsLoading ? "..." : formatCurrency(stats?.totalDecaissements || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Décaissements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-muted-foreground">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "..." : stats?.pending || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {statsLoading ? "..." : formatCurrency(stats?.soldePeriode || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Solde période</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flux Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Évolution des flux
            </CardTitle>
            <CardDescription>Encaissements et décaissements (en millions FCFA)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fluxData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000000}`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="encaissements" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--success))' }}
                    name="Encaissements"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="decaissements" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--warning))' }}
                    name="Décaissements"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Search and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
            <Button onClick={handleNewMovement}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau mouvement
            </Button>
          </div>
        </div>

        {/* Recent Movements Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mouvements récents</CardTitle>
            <CardDescription>Historique des encaissements et décaissements</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Bailleur/Projet</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movementsLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredMovements?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun mouvement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMovements?.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-mono text-sm">{movement.reference}</TableCell>
                      <TableCell>{movement.date ? new Date(movement.date).toLocaleDateString('fr-FR') : '-'}</TableCell>
                      <TableCell>{getTypeIcon(movement.type)}</TableCell>
                      <TableCell>{movement.description}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{movement.bailleur}</p>
                          <p className="text-xs text-muted-foreground">{movement.project}</p>
                        </div>
                      </TableCell>
                      <TableCell>{movement.beneficiary}</TableCell>
                      <TableCell className={`text-right font-medium ${movement.type === 'encaissement' ? 'text-success' : ''}`}>
                        {movement.type === 'encaissement' ? '+' : '-'}{formatCurrency(movement.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(movement.status)}</TableCell>
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

export default DecaissementsPage;
