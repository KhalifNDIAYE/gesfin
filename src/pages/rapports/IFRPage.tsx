import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, RefreshCw, Building2, Calendar, DollarSign, TrendingUp } from "lucide-react";
import { useConventions, useBailleurs, useReplenishments, useDirectPayments } from "@/hooks/useConventionsBailleurs";
import { useFiscalYears } from "@/hooks/useParametrage";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const IFRPage = () => {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedBailleur, setSelectedBailleur] = useState<string>("all");
  const { data: fiscalYears } = useFiscalYears();
  const { data: conventions } = useConventions();
  const { data: bailleurs } = useBailleurs();
  const { data: replenishments } = useReplenishments();
  const { data: directPayments } = useDirectPayments();

  const handleExport = (reportType: string, format: string) => {
    toast.success(`Export ${format} du rapport ${reportType} en cours...`);
  };

  // Filter conventions by bailleur if selected
  const filteredConventions = selectedBailleur && selectedBailleur !== "all"
    ? conventions?.filter(c => c.bailleur_id === selectedBailleur)
    : conventions;

  // Calculate totals
  const totalBudget = filteredConventions?.reduce((sum, c) => sum + Number(c.total_amount || 0), 0) || 0;
  const totalDisbursed = filteredConventions?.reduce((sum, c) => sum + Number(c.disbursed_amount || 0), 0) || 0;
  const totalRemaining = totalBudget - totalDisbursed;
  const disbursementRate = totalBudget > 0 ? (totalDisbursed / totalBudget) * 100 : 0;

  return (
    <AppLayout 
      title="États IFR / RSF" 
      subtitle="Rapports Financiers Intermédiaires et Relevés de Suivi Financier"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                {fiscalYears?.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedBailleur} onValueChange={setSelectedBailleur}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tous les bailleurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les bailleurs</SelectItem>
                {bailleurs?.map((bailleur) => (
                  <SelectItem key={bailleur.id} value={bailleur.id}>
                    {bailleur.short_name || bailleur.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('IFR', 'PDF')}>
              <Download className="mr-2 h-4 w-4" />
              IFR PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('RSF', 'Excel')}>
              <Download className="mr-2 h-4 w-4" />
              RSF Excel
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget Total</p>
                  <p className="text-xl font-bold">{formatCurrency(totalBudget)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Décaissé</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(totalDisbursed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <Calendar className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Restant</p>
                  <p className="text-xl font-bold text-warning">{formatCurrency(totalRemaining)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                  <Building2 className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taux Décaissement</p>
                  <p className="text-xl font-bold text-info">{disbursementRate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* IFR Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rapport Financier Intermédiaire (IFR)
            </CardTitle>
            <CardDescription>État d'avancement des décaissements par convention</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Convention</TableHead>
                  <TableHead>Bailleur</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Décaissé</TableHead>
                  <TableHead className="text-right">Restant</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConventions?.map((convention) => {
                  const bailleur = bailleurs?.find(b => b.id === convention.bailleur_id);
                  const budget = Number(convention.total_amount || 0);
                  const disbursed = Number(convention.disbursed_amount || 0);
                  const remaining = budget - disbursed;
                  const rate = budget > 0 ? (disbursed / budget) * 100 : 0;
                  
                  return (
                    <TableRow key={convention.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{convention.code}</p>
                          <p className="text-xs text-muted-foreground">{convention.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>{bailleur?.short_name || bailleur?.name || '-'}</TableCell>
                      <TableCell className="text-right">{formatCurrency(budget)}</TableCell>
                      <TableCell className="text-right text-success">{formatCurrency(disbursed)}</TableCell>
                      <TableCell className="text-right text-warning">{formatCurrency(remaining)}</TableCell>
                      <TableCell className="text-right">{rate.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge variant={convention.status === 'active' ? 'default' : 'secondary'}>
                          {convention.status === 'active' ? 'Actif' : convention.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(!filteredConventions || filteredConventions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune convention trouvée
                    </TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-muted font-bold">
                  <TableCell colSpan={2}>TOTAL</TableCell>
                  <TableCell className="text-right">{formatCurrency(totalBudget)}</TableCell>
                  <TableCell className="text-right text-success">{formatCurrency(totalDisbursed)}</TableCell>
                  <TableCell className="text-right text-warning">{formatCurrency(totalRemaining)}</TableCell>
                  <TableCell className="text-right">{disbursementRate.toFixed(1)}%</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* RSF Section */}
        <Card>
          <CardHeader>
            <CardTitle>Relevé de Suivi Financier (RSF)</CardTitle>
            <CardDescription>Détail des mouvements financiers par catégorie de dépenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-2">Section A: Sources de financement</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Montant prévu</TableHead>
                      <TableHead className="text-right">Montant reçu</TableHead>
                      <TableHead className="text-right">Écart</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bailleurs?.slice(0, 5).map((bailleur) => {
                      const bailleurConventions = conventions?.filter(c => c.bailleur_id === bailleur.id) || [];
                      const prevu = bailleurConventions.reduce((sum, c) => sum + Number(c.total_amount || 0), 0);
                      const recu = bailleurConventions.reduce((sum, c) => sum + Number(c.disbursed_amount || 0), 0);
                      return (
                        <TableRow key={bailleur.id}>
                          <TableCell>{bailleur.short_name || bailleur.name}</TableCell>
                          <TableCell className="text-right">{formatCurrency(prevu)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(recu)}</TableCell>
                          <TableCell className={`text-right ${prevu - recu >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {formatCurrency(prevu - recu)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-2">Section B: Utilisation des fonds</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Répartition des dépenses par catégorie conformément au plan budgétaire approuvé.
                </p>
                <Button variant="outline" onClick={() => handleExport('RSF-B', 'Excel')}>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter le détail
                </Button>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-2">Section C: Rapprochement bancaire</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  État de rapprochement entre les soldes comptables et bancaires.
                </p>
                <Button variant="outline" onClick={() => handleExport('RSF-C', 'PDF')}>
                  <Download className="mr-2 h-4 w-4" />
                  Générer le rapprochement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default IFRPage;
