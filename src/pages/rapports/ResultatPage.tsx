import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, TrendingUp, TrendingDown, RefreshCw, Printer } from "lucide-react";
import { useResultatData } from "@/hooks/useReporting";
import { useFiscalYears } from "@/hooks/useParametrage";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))'];

const ResultatPage = () => {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const { data: fiscalYears } = useFiscalYears();
  const { data: resultatData, isLoading, refetch } = useResultatData(selectedYear);

  const chargesData = [
    { name: 'Exploitation', value: resultatData?.charges.exploitation || 0 },
    { name: 'Financières', value: resultatData?.charges.financieres || 0 },
    { name: 'Exceptionnelles', value: resultatData?.charges.exceptionnelles || 0 },
  ];

  const produitsData = [
    { name: 'Exploitation', value: resultatData?.produits.exploitation || 0 },
    { name: 'Financiers', value: resultatData?.produits.financiers || 0 },
    { name: 'Exceptionnels', value: resultatData?.produits.exceptionnels || 0 },
  ];

  const comparisonData = [
    { name: 'Exploitation', produits: resultatData?.produits.exploitation || 0, charges: resultatData?.charges.exploitation || 0 },
    { name: 'Financier', produits: resultatData?.produits.financiers || 0, charges: resultatData?.charges.financieres || 0 },
    { name: 'Exceptionnel', produits: resultatData?.produits.exceptionnels || 0, charges: resultatData?.charges.exceptionnelles || 0 },
  ];

  const handleExport = (format: string) => {
    toast.success(`Export ${format} du compte de résultat en cours...`);
  };

  const isProfit = (resultatData?.resultatNet || 0) >= 0;

  return (
    <AppLayout 
      title="Compte de Résultat" 
      subtitle="Produits et charges de l'exercice - SYSCOHADA"
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Produits</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(resultatData?.totalProduits || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Charges</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(resultatData?.totalCharges || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Résultat Exploitation</p>
                <p className={`text-2xl font-bold ${(resultatData?.resultatExploitation || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(resultatData?.resultatExploitation || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className={isProfit ? 'border-success' : 'border-destructive'}>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  {isProfit ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                  <p className="text-sm text-muted-foreground">Résultat Net</p>
                </div>
                <p className={`text-2xl font-bold ${isProfit ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(resultatData?.resultatNet || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Répartition Produits vs Charges</CardTitle>
              <CardDescription>Comparaison par catégorie</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    />
                    <Legend />
                    <Bar dataKey="produits" name="Produits" fill="hsl(var(--success))" />
                    <Bar dataKey="charges" name="Charges" fill="hsl(var(--destructive))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Structure des Charges</CardTitle>
              <CardDescription>Répartition par nature</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chargesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chargesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Produits */}
          <Card>
            <CardHeader className="bg-success/5">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-success" />
                PRODUITS
              </CardTitle>
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
                    <TableCell>Produits d'exploitation</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(resultatData?.produits.exploitation || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Produits financiers</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(resultatData?.produits.financiers || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Produits exceptionnels</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(resultatData?.produits.exceptionnels || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-success/10 font-bold">
                    <TableCell>TOTAL PRODUITS</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(resultatData?.totalProduits || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Charges */}
          <Card>
            <CardHeader className="bg-destructive/5">
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                CHARGES
              </CardTitle>
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
                    <TableCell>Charges d'exploitation</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(resultatData?.charges.exploitation || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Charges financières</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(resultatData?.charges.financieres || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Charges exceptionnelles</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(resultatData?.charges.exceptionnelles || 0)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-destructive/10 font-bold">
                    <TableCell>TOTAL CHARGES</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(resultatData?.totalCharges || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Result Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Synthèse des Résultats</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Résultat d'exploitation</TableCell>
                  <TableCell className={`text-right font-bold ${(resultatData?.resultatExploitation || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(resultatData?.resultatExploitation || 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Résultat financier</TableCell>
                  <TableCell className={`text-right font-bold ${(resultatData?.resultatFinancier || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(resultatData?.resultatFinancier || 0)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Résultat exceptionnel</TableCell>
                  <TableCell className={`text-right font-bold ${(resultatData?.resultatExceptionnel || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(resultatData?.resultatExceptionnel || 0)}
                  </TableCell>
                </TableRow>
                <TableRow className="bg-muted">
                  <TableCell className="text-lg font-bold">RÉSULTAT NET DE L'EXERCICE</TableCell>
                  <TableCell className={`text-right text-xl font-bold ${isProfit ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(resultatData?.resultatNet || 0)}
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

export default ResultatPage;
