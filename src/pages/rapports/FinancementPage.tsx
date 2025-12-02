import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, ArrowUpCircle, ArrowDownCircle, RefreshCw, Printer, TrendingUp, TrendingDown } from "lucide-react";
import { useCashFlowData } from "@/hooks/useReporting";
import { useFiscalYears } from "@/hooks/useParametrage";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from "recharts";

const FinancementPage = () => {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const { data: fiscalYears } = useFiscalYears();
  const { data: cashFlowData, isLoading, refetch } = useCashFlowData(selectedYear);

  const totalRessources = (cashFlowData?.ressources.apportsInitiaux || 0) + 
    (cashFlowData?.ressources.subventions || 0) + 
    (cashFlowData?.ressources.emprunts || 0);

  const totalEmplois = (cashFlowData?.emplois.investissements || 0) + 
    (cashFlowData?.emplois.remboursements || 0) + 
    (cashFlowData?.emplois.decaissements || 0);

  const chartData = [
    { name: 'Ressources', Apports: cashFlowData?.ressources.apportsInitiaux || 0, Subventions: cashFlowData?.ressources.subventions || 0, Emprunts: cashFlowData?.ressources.emprunts || 0 },
    { name: 'Emplois', Investissements: cashFlowData?.emplois.investissements || 0, Remboursements: cashFlowData?.emplois.remboursements || 0, Décaissements: cashFlowData?.emplois.decaissements || 0 },
  ];

  const flowData = [
    { name: 'Jan', ressources: 1500000, emplois: 1200000 },
    { name: 'Fév', ressources: 800000, emplois: 900000 },
    { name: 'Mar', ressources: 2000000, emplois: 1500000 },
    { name: 'Avr', ressources: 1200000, emplois: 1100000 },
    { name: 'Mai', ressources: 1800000, emplois: 1400000 },
    { name: 'Jun', ressources: 900000, emplois: 1000000 },
  ];

  const handleExport = (format: string) => {
    toast.success(`Export ${format} du tableau de financement en cours...`);
  };

  const variationPositive = (cashFlowData?.variationTresorerie || 0) >= 0;

  return (
    <AppLayout 
      title="Tableau de Financement" 
      subtitle="Emplois et ressources - SYSCOHADA"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Exercice fiscal" />
              </SelectTrigger>
              <SelectContent>
                {fiscalYears?.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('PDF')}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('Excel')}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <ArrowUpCircle className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Ressources</p>
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(totalRessources)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                  <ArrowDownCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Emplois</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(totalEmplois)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={variationPositive ? 'border-success' : 'border-destructive'}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${variationPositive ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {variationPositive ? (
                    <TrendingUp className="h-6 w-6 text-success" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Variation Trésorerie</p>
                  <p className={`text-2xl font-bold ${variationPositive ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(cashFlowData?.variationTresorerie || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Évolution des Flux</CardTitle>
              <CardDescription>Ressources vs Emplois par mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={flowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="ressources" name="Ressources" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="emplois" name="Emplois" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Comparaison Annuelle</CardTitle>
              <CardDescription>Ressources et emplois cumulés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Ressources', value: totalRessources },
                    { name: 'Emplois', value: totalEmplois },
                  ]} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ressources */}
          <Card>
            <CardHeader className="bg-success/5">
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-success" />
                RESSOURCES
              </CardTitle>
              <CardDescription>Origine des fonds</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nature</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Apports initiaux / Dotations</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(cashFlowData?.ressources.apportsInitiaux || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Subventions reçues</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(cashFlowData?.ressources.subventions || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Emprunts et dettes</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(cashFlowData?.ressources.emprunts || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-success/10 font-bold">
                    <TableCell>TOTAL RESSOURCES</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalRessources)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Emplois */}
          <Card>
            <CardHeader className="bg-destructive/5">
              <CardTitle className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-destructive" />
                EMPLOIS
              </CardTitle>
              <CardDescription>Utilisation des fonds</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nature</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Investissements</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(cashFlowData?.emplois.investissements || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Remboursements d'emprunts</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(cashFlowData?.emplois.remboursements || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Décaissements opérationnels</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(cashFlowData?.emplois.decaissements || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-destructive/10 font-bold">
                    <TableCell>TOTAL EMPLOIS</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totalEmplois)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Variation Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Variation de la Trésorerie</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Total des ressources</TableCell>
                  <TableCell className="text-right font-bold text-success">
                    + {formatCurrency(totalRessources)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total des emplois</TableCell>
                  <TableCell className="text-right font-bold text-destructive">
                    - {formatCurrency(totalEmplois)}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-muted">
                  <TableCell className="text-lg font-bold">VARIATION DE TRÉSORERIE</TableCell>
                  <TableCell className={`text-right text-xl font-bold ${variationPositive ? 'text-success' : 'text-destructive'}`}>
                    {variationPositive ? '+ ' : ''}{formatCurrency(cashFlowData?.variationTresorerie || 0)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default FinancementPage;
