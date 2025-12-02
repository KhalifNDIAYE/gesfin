import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Coins, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
import { useFiscalYears } from "@/hooks/useParametrage";

export default function CaissePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [selectedCaisse, setSelectedCaisse] = useState<string>("");

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);

  return (
    <AppLayout 
      title="Gestion de la Caisse" 
      subtitle="Suivi des opérations de caisse"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Solde caisse</p>
                  <p className="text-2xl font-bold">0,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Encaissements</p>
                  <p className="text-2xl font-bold">0,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Décaissements</p>
                  <p className="text-2xl font-bold">0,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Opérations du jour</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                <div>
                  <CardTitle>Journal de Caisse</CardTitle>
                  <CardDescription>Opérations d'encaissement et décaissement</CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={selectedCaisse}
                  onValueChange={setSelectedCaisse}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Caisse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principale">Caisse Principale</SelectItem>
                    <SelectItem value="menues">Menues Dépenses</SelectItem>
                  </SelectContent>
                </Select>
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
                  <Download className="h-4 w-4" />
                  Exporter
                </Button>
                <Button variant="gradient" size="sm">
                  <Plus className="h-4 w-4" />
                  Nouvelle opération
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>N° Pièce</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Bénéficiaire</TableHead>
                  <TableHead className="text-right">Entrée</TableHead>
                  <TableHead className="text-right">Sortie</TableHead>
                  <TableHead className="text-right">Solde</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucune opération de caisse
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
