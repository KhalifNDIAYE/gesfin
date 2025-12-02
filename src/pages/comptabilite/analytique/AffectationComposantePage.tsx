import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Layers } from "lucide-react";
import { useFiscalYears, usePlanAccounts } from "@/hooks/useParametrage";
import { useAnalyticalAllocations, useAnalyticalAllocationMutations } from "@/hooks/useComptabiliteAnalytique";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AffectationComposantePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    component_id: "",
    amount: "",
    percentage: "",
    description: "",
  });

  const { data: fiscalYears } = useFiscalYears();
  const { data: components } = usePlanAccounts('analytique');
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  
  const { data: allocations, isLoading } = useAnalyticalAllocations({
    fiscal_year_id: selectedFiscalYear || currentFiscalYear?.id,
    allocation_type: 'component',
  });

  const { createMutation, deleteMutation } = useAnalyticalAllocationMutations();

  const filteredAllocations = allocations?.filter(alloc =>
    alloc.component?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    alloc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSubmit = () => {
    createMutation.mutate({
      component_id: formData.component_id,
      amount: parseFloat(formData.amount) || 0,
      percentage: formData.percentage ? parseFloat(formData.percentage) : null,
      allocation_type: 'component',
      allocation_method: 'a_posteriori',
      fiscal_year_id: selectedFiscalYear || currentFiscalYear?.id || null,
      description: formData.description || null,
      journal_entry_line_id: null,
      cost_center_id: null,
      activity_id: null,
      geographic_zone_id: null,
      created_by: null,
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ component_id: "", amount: "", percentage: "", description: "" });
      }
    });
  };

  return (
    <AppLayout 
      title="Affectation par Composante" 
      subtitle="Répartition des charges par composante de projet"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Affectations par Composante
                </CardTitle>
                <CardDescription>Gérez la répartition des charges par composante</CardDescription>
              </div>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle affectation
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
                  <TableHead>Composante</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">%</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredAllocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Aucune affectation trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAllocations.map((alloc) => (
                    <TableRow key={alloc.id}>
                      <TableCell>
                        <Badge variant="outline">{alloc.component?.code}</Badge>
                        <span className="ml-2">{alloc.component?.name}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {alloc.description || "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(alloc.amount).toLocaleString('fr-FR')} FCFA
                      </TableCell>
                      <TableCell className="text-right">
                        {alloc.percentage ? `${alloc.percentage}%` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteMutation.mutate(alloc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle Affectation par Composante</DialogTitle>
            <DialogDescription>
              Créez une nouvelle affectation de charges par composante
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Composante</Label>
              <Select value={formData.component_id} onValueChange={(v) => setFormData({...formData, component_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une composante" />
                </SelectTrigger>
                <SelectContent>
                  {components?.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.code} - {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Montant</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Pourcentage (%)</Label>
              <Input
                type="number"
                value={formData.percentage}
                onChange={(e) => setFormData({...formData, percentage: e.target.value})}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Description de l'affectation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
