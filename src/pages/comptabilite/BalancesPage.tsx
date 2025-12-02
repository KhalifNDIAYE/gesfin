import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Scale, Filter } from "lucide-react";
import { usePlanAccounts, useFiscalYears } from "@/hooks/useParametrage";
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

export default function BalancesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [balanceType, setBalanceType] = useState<string>("generale");

  const { data: fiscalYears } = useFiscalYears();
  const { data: accounts } = usePlanAccounts('comptable');
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);

  const filteredAccounts = accounts?.filter(account =>
    account.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <AppLayout 
      title="Balances" 
      subtitle="États récapitulatifs des soldes comptables"
    >
      <div className="space-y-6">
        {/* Balance Type Selection */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card 
            className={`cursor-pointer transition-colors ${balanceType === 'generale' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
            onClick={() => setBalanceType('generale')}
          >
            <CardContent className="p-4">
              <h3 className="font-medium">Balance Générale</h3>
              <p className="text-sm text-muted-foreground">Tous les comptes</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors ${balanceType === 'fournisseurs' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
            onClick={() => setBalanceType('fournisseurs')}
          >
            <CardContent className="p-4">
              <h3 className="font-medium">Balance Fournisseurs</h3>
              <p className="text-sm text-muted-foreground">Comptes 401xxx</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors ${balanceType === 'clients' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
            onClick={() => setBalanceType('clients')}
          >
            <CardContent className="p-4">
              <h3 className="font-medium">Balance Clients</h3>
              <p className="text-sm text-muted-foreground">Comptes 411xxx</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-colors ${balanceType === 'agee' ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
            onClick={() => setBalanceType('agee')}
          >
            <CardContent className="p-4">
              <h3 className="font-medium">Balance Âgée</h3>
              <p className="text-sm text-muted-foreground">Par ancienneté</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                <div>
                  <CardTitle>
                    {balanceType === 'generale' && 'Balance Générale'}
                    {balanceType === 'fournisseurs' && 'Balance Fournisseurs'}
                    {balanceType === 'clients' && 'Balance Clients'}
                    {balanceType === 'agee' && 'Balance Âgée'}
                  </CardTitle>
                  <CardDescription>
                    Exercice: {currentFiscalYear?.name || 'Non sélectionné'}
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedFiscalYear || currentFiscalYear?.id || ""}
                  onValueChange={setSelectedFiscalYear}
                >
                  <SelectTrigger className="w-[140px]">
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
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                  Filtres
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                  Exporter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Compte</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Débit</TableHead>
                  <TableHead className="text-right">Crédit</TableHead>
                  <TableHead className="text-right">Solde Débiteur</TableHead>
                  <TableHead className="text-right">Solde Créditeur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.slice(0, 20).map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-mono">{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell className="text-right font-mono">0,00</TableCell>
                    <TableCell className="text-right font-mono">0,00</TableCell>
                    <TableCell className="text-right font-mono">0,00</TableCell>
                    <TableCell className="text-right font-mono">0,00</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <tfoot>
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={2}>TOTAUX</TableCell>
                  <TableCell className="text-right font-mono">0,00</TableCell>
                  <TableCell className="text-right font-mono">0,00</TableCell>
                  <TableCell className="text-right font-mono">0,00</TableCell>
                  <TableCell className="text-right font-mono">0,00</TableCell>
                </TableRow>
              </tfoot>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
