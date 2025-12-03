import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PermissionButton, PermissionGate } from "@/components/auth/PermissionButton";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2, Eye, FileText, CheckCircle, Clock, XCircle, Send, Lock, AlertCircle } from "lucide-react";
import { useBudgets, useDeleteBudget, Budget } from "@/hooks/useBudget";
import { useFiscalYears } from "@/hooks/useParametrage";
import { BudgetWorkflowActions } from "@/components/budget/BudgetWorkflowActions";
import { useCanPerformBudgetAction, BudgetWorkflowStatus, BUDGET_STATUS_LABELS, BUDGET_STATUS_COLORS } from "@/hooks/useBudgetWorkflow";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { BudgetDialog } from "@/components/budget/BudgetDialog";

export default function BudgetsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  const fiscalYearId = selectedFiscalYear || currentFiscalYear?.id;

  const { data: budgets, isLoading } = useBudgets(fiscalYearId);
  const deleteMutation = useDeleteBudget();

  const filteredBudgets = budgets?.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.code.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: BudgetWorkflowStatus) => {
    const label = BUDGET_STATUS_LABELS[status] || status;
    const colorClass = BUDGET_STATUS_COLORS[status] || 'bg-muted text-muted-foreground';
    
    const icons: Record<string, React.ReactNode> = {
      draft: <Clock className="h-3 w-3 mr-1" />,
      soumis: <Send className="h-3 w-3 mr-1" />,
      valide: <CheckCircle className="h-3 w-3 mr-1" />,
      rejete: <XCircle className="h-3 w-3 mr-1" />,
      clos: <Lock className="h-3 w-3 mr-1" />,
    };
    
    return (
      <Badge className={colorClass}>
        {icons[status]}
        {label}
      </Badge>
    );
  };
  
  const canEditBudget = (status: BudgetWorkflowStatus) => status === 'draft' || status === 'rejete';
  const canDeleteBudget = (status: BudgetWorkflowStatus) => status === 'draft';

  return (
    <AppLayout
      title="Budgets"
      subtitle="Gestion des budgets par exercice"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
          <PermissionButton module="comptabilite" permission="create" onClick={() => { setEditingBudget(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Budget
          </PermissionButton>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Liste des Budgets
            </CardTitle>
            <CardDescription>
              {filteredBudgets.length} budget(s) trouvé(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Exercice</TableHead>
                    <TableHead>Devise</TableHead>
                    <TableHead className="text-right">Montant Total</TableHead>
                    <TableHead>Statut / Workflow</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBudgets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucun budget trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBudgets.map((budget) => (
                      <TableRow key={budget.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/budget/${budget.id}`)}>
                        <TableCell>
                          <Badge variant="outline">{budget.code}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{budget.name}</TableCell>
                        <TableCell>{budget.fiscal_year?.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{budget.currency?.code}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(budget.total_amount).toLocaleString('fr-FR')} {budget.currency?.symbol}
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <BudgetWorkflowActions
                            budgetId={budget.id}
                            currentStatus={budget.status as BudgetWorkflowStatus}
                            compact
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" onClick={() => navigate(`/budget/${budget.id}`)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canEditBudget(budget.status as BudgetWorkflowStatus) && (
                              <PermissionGate module="comptabilite" permission="update">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(budget)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </PermissionGate>
                            )}
                            {canDeleteBudget(budget.status as BudgetWorkflowStatus) && (
                              <PermissionGate module="comptabilite" permission="delete">
                                <Button variant="ghost" size="icon" onClick={() => setDeleteId(budget.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </PermissionGate>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        budget={editingBudget}
        fiscalYearId={fiscalYearId}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le budget et toutes ses lignes seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
