import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, SplitSquareHorizontal } from "lucide-react";
import { useFiscalYears, usePlanAccounts } from "@/hooks/useParametrage";
import { useDistributionRules, useDistributionRuleMutations } from "@/hooks/useComptabiliteAnalytique";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function RepartitionPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"a_priori" | "a_posteriori">("a_priori");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    source_account_id: "",
    allocation_type: "activity" as const,
  });

  const { data: accounts } = usePlanAccounts('comptable');
  const { data: rules, isLoading } = useDistributionRules();
  const { createMutation, deleteMutation } = useDistributionRuleMutations();

  const filteredRules = rules?.filter(rule =>
    rule.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSubmit = () => {
    createMutation.mutate({
      rule: {
        name: formData.name,
        source_account_id: formData.source_account_id || null,
        allocation_type: formData.allocation_type,
        is_active: true,
      },
      lines: [],
    }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setFormData({ name: "", source_account_id: "", allocation_type: "activity" });
      }
    });
  };

  const getAllocationType = (type: string) => {
    switch (type) {
      case 'activity': return { label: 'Activité', color: 'bg-blue-100 text-blue-800' };
      case 'component': return { label: 'Composante', color: 'bg-green-100 text-green-800' };
      case 'geographic': return { label: 'Zone Géo.', color: 'bg-purple-100 text-purple-800' };
      case 'cost_center': return { label: 'Centre de coûts', color: 'bg-orange-100 text-orange-800' };
      default: return { label: type, color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <AppLayout 
      title="Répartition A Priori / A Posteriori" 
      subtitle="Gestion des règles de répartition des charges"
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "a_priori" | "a_posteriori")}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="a_priori">Répartition A Priori</TabsTrigger>
            <TabsTrigger value="a_posteriori">Répartition A Posteriori</TabsTrigger>
          </TabsList>

          <TabsContent value="a_priori">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <SplitSquareHorizontal className="h-5 w-5" />
                      Règles de Répartition A Priori
                    </CardTitle>
                    <CardDescription>
                      Définissez les règles de répartition automatique des charges
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nouvelle règle
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une règle..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom de la règle</TableHead>
                      <TableHead>Compte source</TableHead>
                      <TableHead>Type d'affectation</TableHead>
                      <TableHead>Statut</TableHead>
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
                    ) : filteredRules.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Aucune règle de répartition trouvée
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRules.map((rule) => {
                        const typeInfo = getAllocationType(rule.allocation_type);
                        return (
                          <TableRow key={rule.id}>
                            <TableCell className="font-medium">{rule.name}</TableCell>
                            <TableCell>
                              {rule.source_account ? (
                                <Badge variant="outline">
                                  {rule.source_account.code} - {rule.source_account.name}
                                </Badge>
                              ) : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge className={typeInfo.color}>
                                {typeInfo.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={rule.is_active ? "default" : "secondary"}>
                                {rule.is_active ? "Actif" : "Inactif"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => deleteMutation.mutate(rule.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="a_posteriori">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SplitSquareHorizontal className="h-5 w-5" />
                  Répartition A Posteriori
                </CardTitle>
                <CardDescription>
                  Effectuez des répartitions manuelles après constatation des charges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <SplitSquareHorizontal className="h-12 w-12 mb-4 opacity-50" />
                  <p>Sélectionnez des écritures comptables</p>
                  <p className="text-sm">pour effectuer une répartition a posteriori</p>
                  <Button className="mt-4" variant="outline">
                    Sélectionner des écritures
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle Règle de Répartition</DialogTitle>
            <DialogDescription>
              Créez une règle de répartition automatique des charges
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nom de la règle</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Répartition frais généraux"
              />
            </div>
            <div>
              <Label>Compte source</Label>
              <Select value={formData.source_account_id} onValueChange={(v) => setFormData({...formData, source_account_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.code} - {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type d'affectation</Label>
              <Select value={formData.allocation_type} onValueChange={(v: any) => setFormData({...formData, allocation_type: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activity">Par Activité</SelectItem>
                  <SelectItem value="component">Par Composante</SelectItem>
                  <SelectItem value="geographic">Par Zone Géographique</SelectItem>
                  <SelectItem value="cost_center">Par Centre de Coûts</SelectItem>
                </SelectContent>
              </Select>
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
