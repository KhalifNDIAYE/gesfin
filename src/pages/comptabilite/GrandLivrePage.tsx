import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, FileText, ChevronRight } from "lucide-react";
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

export default function GrandLivrePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const { data: fiscalYears } = useFiscalYears();
  const { data: accounts } = usePlanAccounts('comptable');
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);

  const filteredAccounts = accounts?.filter(account =>
    account.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    account.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <AppLayout 
      title="Grand Livre" 
      subtitle="Détail des mouvements par compte comptable"
    >
      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Accounts List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Plan Comptable
              </CardTitle>
              <CardDescription>Sélectionnez un compte</CardDescription>
              <div className="pt-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un compte..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-auto">
              <div className="space-y-1">
                {filteredAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccount(account.id)}
                    className={`flex w-full items-center justify-between rounded-lg p-3 text-left transition-colors hover:bg-muted ${
                      selectedAccount === account.id ? 'bg-primary/10 border border-primary/20' : ''
                    }`}
                  >
                    <div>
                      <p className="font-mono text-sm font-medium">{account.code}</p>
                      <p className="text-sm text-muted-foreground truncate">{account.name}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
                {filteredAccounts.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Aucun compte trouvé</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mouvements du compte</CardTitle>
                  <CardDescription>
                    {selectedAccount 
                      ? `Compte ${accounts?.find(a => a.id === selectedAccount)?.code}`
                      : 'Sélectionnez un compte pour voir les mouvements'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
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
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                    Exporter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedAccount ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>N° Pièce</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead className="text-right">Débit</TableHead>
                      <TableHead className="text-right">Crédit</TableHead>
                      <TableHead className="text-right">Solde</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun mouvement pour ce compte sur la période sélectionnée
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <FileText className="h-12 w-12 mb-4 opacity-50" />
                  <p>Sélectionnez un compte dans la liste</p>
                  <p className="text-sm">pour afficher ses mouvements</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
