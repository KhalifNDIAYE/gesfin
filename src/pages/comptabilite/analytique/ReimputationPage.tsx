import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeftRight, AlertCircle } from "lucide-react";
import { useFiscalYears } from "@/hooks/useParametrage";
import { useAnalyticalAllocations } from "@/hooks/useComptabiliteAnalytique";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ReimputationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  
  const { data: allocations, isLoading } = useAnalyticalAllocations({
    fiscal_year_id: selectedFiscalYear || currentFiscalYear?.id,
    allocation_method: 'reallocation',
  });

  const filteredAllocations = allocations?.filter(alloc =>
    alloc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'activity': return <Badge className="bg-blue-100 text-blue-800">Activité</Badge>;
      case 'component': return <Badge className="bg-green-100 text-green-800">Composante</Badge>;
      case 'geographic': return <Badge className="bg-purple-100 text-purple-800">Zone Géo.</Badge>;
      case 'cost_center': return <Badge className="bg-orange-100 text-orange-800">Centre de coûts</Badge>;
      default: return <Badge>{type}</Badge>;
    }
  };

  return (
    <AppLayout 
      title="Réimputation des Charges" 
      subtitle="Modification des affectations analytiques existantes"
    >
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            La réimputation permet de modifier les affectations analytiques déjà validées.
            Cette opération génère des écritures de régularisation pour assurer la traçabilité.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5" />
                  Historique des Réimputations
                </CardTitle>
                <CardDescription>Liste des réimputations effectuées</CardDescription>
              </div>
              <Button>
                <ArrowLeftRight className="h-4 w-4 mr-2" />
                Nouvelle réimputation
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedFiscalYear || currentFiscalYear?.id || ""}
                onValueChange={setSelectedFiscalYear}
              >
                <SelectTrigger className="w-[180px]">
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
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Origine</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredAllocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune réimputation trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAllocations.map((alloc) => (
                    <TableRow key={alloc.id}>
                      <TableCell className="font-mono text-sm">
                        {new Date(alloc.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{getTypeBadge(alloc.allocation_type)}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        {alloc.activity?.name || alloc.component?.name || alloc.geographic_zone?.name || alloc.cost_center?.name || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(alloc.amount).toLocaleString('fr-FR')} FCFA
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {alloc.description || "-"}
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
}
