import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Coins, ArrowUpRight, ArrowDownRight, Eye, Edit, Trash2 } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFiscalYears } from "@/hooks/useParametrage";
import { useCashOperations, useCashStatistics, useDeleteCashOperation, CashOperation } from "@/hooks/useCashOperations";
import { CashOperationDialog } from "@/components/caisse/CashOperationDialog";
import { usePermissions } from "@/hooks/usePermissions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function CaissePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [selectedCaisse, setSelectedCaisse] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<CashOperation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [operationToDelete, setOperationToDelete] = useState<CashOperation | null>(null);

  const { canAccess, isAdmin } = usePermissions();
  const canCreate = canAccess("comptabilite", "create") || isAdmin;
  const canDelete = canAccess("comptabilite", "delete") || isAdmin;

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  const activeFiscalYearId = selectedFiscalYear || currentFiscalYear?.id;

  const { data: operations, isLoading } = useCashOperations({
    fiscalYearId: activeFiscalYearId,
    search: searchQuery || undefined,
  });
  const { data: stats } = useCashStatistics(activeFiscalYearId);
  const deleteMutation = useDeleteCashOperation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleNewOperation = () => {
    setSelectedOperation(null);
    setDialogOpen(true);
  };

  const handleEditOperation = (operation: CashOperation) => {
    setSelectedOperation(operation);
    setDialogOpen(true);
  };

  const handleDeleteOperation = (operation: CashOperation) => {
    setOperationToDelete(operation);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (operationToDelete) {
      await deleteMutation.mutateAsync(operationToDelete.id);
      setDeleteDialogOpen(false);
      setOperationToDelete(null);
    }
  };

  // Calculate running balance
  const operationsWithBalance = operations?.reduce((acc, op, index) => {
    const previousBalance = index > 0 ? acc[index - 1].runningBalance : 0;
    const amount = op.operation_type === 'entree' ? op.amount : -op.amount;
    const runningBalance = previousBalance + amount;
    return [...acc, { ...op, runningBalance }];
  }, [] as (CashOperation & { runningBalance: number })[]).reverse();

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
                  <p className="text-2xl font-bold">{formatCurrency(stats?.solde || 0)}</p>
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
                  <p className="text-2xl font-bold text-success">{formatCurrency(stats?.totalEntrees || 0)}</p>
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
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(stats?.totalSorties || 0)}</p>
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
                  <p className="text-2xl font-bold">{stats?.operationsJour || 0}</p>
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
                    <SelectItem value="all">Toutes les caisses</SelectItem>
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
                {canCreate && (
                  <Button variant="gradient" size="sm" onClick={handleNewOperation}>
                    <Plus className="h-4 w-4" />
                    Nouvelle opération
                  </Button>
                )}
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
                  <TableHead>Tiers</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Entrée</TableHead>
                  <TableHead className="text-right">Sortie</TableHead>
                  <TableHead className="text-right">Solde</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : operationsWithBalance && operationsWithBalance.length > 0 ? (
                  operationsWithBalance.map((op) => (
                    <TableRow key={op.id}>
                      <TableCell>
                        {format(new Date(op.operation_date), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{op.code}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={op.description}>
                        {op.description}
                      </TableCell>
                      <TableCell>{op.third_party?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={op.status === "valide" ? "default" : "secondary"}>
                          {op.status === "valide" ? "Validée" : "Brouillon"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-success font-medium">
                        {op.operation_type === "entree" ? formatCurrency(op.amount) : "-"}
                      </TableCell>
                      <TableCell className="text-right text-destructive font-medium">
                        {op.operation_type === "sortie" ? formatCurrency(op.amount) : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(op.runningBalance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditOperation(op)}
                          >
                            {op.status === "valide" ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <Edit className="h-4 w-4" />
                            )}
                          </Button>
                          {op.status === "brouillon" && canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteOperation(op)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Aucune opération de caisse
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Cash Operation Dialog */}
      <CashOperationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        operation={selectedOperation}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'opération {operationToDelete?.code} ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
