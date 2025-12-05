import React, { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PermissionButton, PermissionGate } from "@/components/auth/PermissionButton";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Edit, Trash2, Eye, FileText, CheckCircle, Clock, XCircle, Send, Lock, Filter } from "lucide-react";
import { useBudgets, useDeleteBudget, BudgetWithAggregates } from "@/hooks/useBudget";
import { useFiscalYears } from "@/hooks/useParametrage";
import { useProjects } from "@/hooks/useProjects";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function BudgetsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithAggregates | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  const fiscalYearId = selectedFiscalYear || currentFiscalYear?.id;

  const { data: budgets, isLoading } = useBudgets(fiscalYearId);
  const deleteMutation = useDeleteBudget();

  const filteredBudgets = useMemo(() => {
    return budgets?.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.code.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = selectedStatus === "all" || b.status === selectedStatus;
      return matchesSearch && matchesStatus;
    }) || [];
  }, [budgets, search, selectedStatus]);

  const handleEdit = (budget: BudgetWithAggregates) => {
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-amber-500";
    return "bg-primary";
  };
  
  const canEditBudget = (status: BudgetWorkflowStatus) => status === 'draft' || status === 'rejete';
  const canDeleteBudget = (status: BudgetWorkflowStatus) => status === 'draft';

  const formatAmount = (amount: number, symbol?: string) => {
    return `${Number(amount).toLocaleString('fr-FR')} ${symbol || ''}`;
  };

  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "draft", label: "Brouillon" },
    { value: "soumis", label: "Soumis" },
    { value: "valide", label: "Validé" },
    { value: "rejete", label: "Rejeté" },
    { value: "clos", label: "Clôturé" },
  ];

  const activeFiltersCount = (selectedStatus !== "all" ? 1 : 0);

  return (
    <AppLayout
      title="Budgets"
      subtitle="Gestion des budgets par exercice"
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
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
              <SelectTrigger className="w-[160px]">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="start">
                <div className="space-y-4">
                  <h4 className="font-medium">Filtres avancés</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Statut</label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {activeFiltersCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedStatus("all")}
                    >
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code / Nom</TableHead>
                      <TableHead>Exercice</TableHead>
                      <TableHead className="text-right">Montant Total</TableHead>
                      <TableHead className="text-right">Engagé</TableHead>
                      <TableHead className="text-right">Réalisé</TableHead>
                      <TableHead className="text-right">Reste</TableHead>
                      <TableHead className="w-[180px]">Progression</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBudgets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Aucun budget trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBudgets.map((budget) => {
                        const totalAmount = Number(budget.total_amount) || 0;
                        const committedAmount = budget.committed_amount || 0;
                        const realizedAmount = budget.realized_amount || 0;
                        const remainingAmount = budget.remaining_amount || 0;
                        const consumptionRate = totalAmount > 0 ? (realizedAmount / totalAmount) * 100 : 0;
                        const committedRate = totalAmount > 0 ? (committedAmount / totalAmount) * 100 : 0;

                        return (
                          <TableRow 
                            key={budget.id} 
                            className="cursor-pointer hover:bg-muted/50" 
                            onClick={() => navigate(`/budget/${budget.id}`)}
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <Badge variant="outline" className="w-fit mb-1">{budget.code}</Badge>
                                <span className="font-medium">{budget.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{budget.fiscal_year?.name}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono font-medium">
                              {formatAmount(totalAmount, budget.currency?.symbol)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-amber-600">
                              {formatAmount(committedAmount, budget.currency?.symbol)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-primary">
                              {formatAmount(realizedAmount, budget.currency?.symbol)}
                            </TableCell>
                            <TableCell className={`text-right font-mono ${remainingAmount < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {formatAmount(remainingAmount, budget.currency?.symbol)}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Progress 
                                    value={Math.min(consumptionRate, 100)} 
                                    className="h-2 flex-1"
                                  />
                                  <span className={`text-xs font-medium w-12 text-right ${consumptionRate >= 100 ? 'text-destructive' : consumptionRate >= 80 ? 'text-amber-600' : ''}`}>
                                    {consumptionRate.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>Engagé: {committedRate.toFixed(0)}%</span>
                                </div>
                              </div>
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
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
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
