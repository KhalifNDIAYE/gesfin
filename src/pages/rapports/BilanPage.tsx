import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, RefreshCw, Printer } from "lucide-react";
import { useBilanData, useAccountBalances } from "@/hooks/useReporting";
import { useFiscalYears } from "@/hooks/useParametrage";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const BilanPage = () => {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const { data: fiscalYears } = useFiscalYears();
  const { data: bilanData, isLoading, refetch } = useBilanData(selectedYear);
  const { data: accountBalances } = useAccountBalances(selectedYear);

  const actifAccounts = accountBalances?.filter(a => 
    a.code.startsWith('2') || a.code.startsWith('3') || a.code.startsWith('5') ||
    (a.code.startsWith('4') && a.balance > 0)
  ) || [];

  const passifAccounts = accountBalances?.filter(a => 
    a.code.startsWith('1') || (a.code.startsWith('4') && a.balance < 0)
  ) || [];

  const handleExport = (format: string) => {
    toast.success(`Export ${format} du bilan en cours...`);
  };

  return (
    <AppLayout 
      title="Bilan Comptable" 
      subtitle="État de la situation patrimoniale - SYSCOHADA"
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
                <p className="text-sm text-muted-foreground">Total Actif</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(bilanData?.totalActif || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Passif</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(bilanData?.totalPassif || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Capitaux Propres</p>
                <p className="text-2xl font-bold text-success">
                  {formatCurrency(bilanData?.passif.capitaux || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Trésorerie</p>
                <p className="text-2xl font-bold text-info">
                  {formatCurrency(bilanData?.actif.tresorerie || 0)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bilan Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Actif */}
          <Card>
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ACTIF
              </CardTitle>
              <CardDescription>Emplois des ressources</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compte</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>Actif Immobilisé</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bilanData?.actif.immobilise || 0)}
                    </TableCell>
                  </TableRow>
                  {actifAccounts.filter(a => a.code.startsWith('2')).map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono text-xs">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Math.abs(account.balance))}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>Actif Circulant</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bilanData?.actif.circulant || 0)}
                    </TableCell>
                  </TableRow>
                  {actifAccounts.filter(a => a.code.startsWith('3') || (a.code.startsWith('4') && a.balance > 0)).map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono text-xs">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Math.abs(account.balance))}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>Trésorerie-Actif</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bilanData?.actif.tresorerie || 0)}
                    </TableCell>
                  </TableRow>
                  {actifAccounts.filter(a => a.code.startsWith('5')).map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono text-xs">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Math.abs(account.balance))}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell colSpan={2}>TOTAL ACTIF</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bilanData?.totalActif || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Passif */}
          <Card>
            <CardHeader className="bg-success/5">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                PASSIF
              </CardTitle>
              <CardDescription>Origine des ressources</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compte</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>Capitaux Propres</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bilanData?.passif.capitaux || 0)}
                    </TableCell>
                  </TableRow>
                  {passifAccounts.filter(a => a.code.startsWith('1')).map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono text-xs">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Math.abs(account.balance))}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>Dettes</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bilanData?.passif.dettes || 0)}
                    </TableCell>
                  </TableRow>
                  {passifAccounts.filter(a => a.code.startsWith('4') && a.balance < 0).map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-mono text-xs">{account.code}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Math.abs(account.balance))}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-success/10 font-bold">
                    <TableCell colSpan={2}>TOTAL PASSIF</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bilanData?.totalPassif || 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default BilanPage;
