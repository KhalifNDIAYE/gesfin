import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Plus, Edit, Trash2, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { useBudget, useBudgetLines, useDeleteBudgetLine, BudgetLine } from "@/hooks/useBudget";
import { BudgetWorkflowActions } from "@/components/budget/BudgetWorkflowActions";
import { BudgetValidationHistory } from "@/components/budget/BudgetValidationHistory";
import { useCanPerformBudgetAction, BudgetWorkflowStatus } from "@/hooks/useBudgetWorkflow";
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
import { BudgetLineDialog } from "@/components/budget/BudgetLineDialog";

export default function BudgetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<BudgetLine | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: budget, isLoading: budgetLoading } = useBudget(id);
  const { data: lines, isLoading: linesLoading } = useBudgetLines(id);
  const deleteMutation = useDeleteBudgetLine();
  const permissions = useCanPerformBudgetAction(budget?.status as BudgetWorkflowStatus);

  const handleEdit = (line: BudgetLine) => {
    setEditingLine(line);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const totals = {
    forecast: lines?.reduce((sum, l) => sum + Number(l.forecast_amount), 0) || 0,
    committed: lines?.reduce((sum, l) => sum + Number(l.committed_amount), 0) || 0,
    realized: lines?.reduce((sum, l) => sum + Number(l.realized_amount), 0) || 0,
  };

  const consumptionRate = totals.forecast > 0 ? (totals.realized / totals.forecast) * 100 : 0;

  if (budgetLoading) {
    return (
      <AppLayout title="Chargement..." subtitle="">
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!budget) {
    return (
      <AppLayout title="Budget non trouvé" subtitle="">
        <Button onClick={() => navigate('/budget')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title={budget.name}
      subtitle={`Budget ${budget.code} - ${budget.fiscal_year?.name}`}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/budget')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex items-center gap-4">
            <BudgetWorkflowActions
              budgetId={budget.id}
              currentStatus={budget.status as BudgetWorkflowStatus}
            />
            {permissions.canEdit && (
              <Button onClick={() => { setEditingLine(null); setDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une ligne
              </Button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Prévisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totals.forecast.toLocaleString('fr-FR')} {budget.currency?.symbol}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Engagements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {totals.committed.toLocaleString('fr-FR')} {budget.currency?.symbol}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Réalisations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {totals.realized.toLocaleString('fr-FR')} {budget.currency?.symbol}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Taux de consommation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{consumptionRate.toFixed(1)}%</div>
                <Progress value={Math.min(consumptionRate, 100)} className={consumptionRate > 100 ? "bg-red-200" : ""} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Lines Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lignes budgétaires</CardTitle>
            <CardDescription>{lines?.length || 0} ligne(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {linesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Prévision</TableHead>
                    <TableHead className="text-right">Engagé</TableHead>
                    <TableHead className="text-right">Réalisé</TableHead>
                    <TableHead className="text-right">Écart</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Aucune ligne budgétaire
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines?.map((line) => {
                      const usagePercent = line.forecast_amount > 0 
                        ? (Number(line.realized_amount) / Number(line.forecast_amount)) * 100 
                        : 0;
                      return (
                        <TableRow key={line.id} className={line.is_over_budget ? "bg-red-50 dark:bg-red-950/20" : ""}>
                          <TableCell>{line.line_number}</TableCell>
                          <TableCell>
                            {line.account ? (
                              <Badge variant="outline">{line.account.code}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{line.description || line.account?.name || "-"}</TableCell>
                          <TableCell className="text-right font-mono">
                            {Number(line.forecast_amount).toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-right font-mono text-yellow-600">
                            {Number(line.committed_amount).toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-right font-mono text-green-600">
                            {Number(line.realized_amount).toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span className={Number(line.variance_amount) >= 0 ? "text-green-600" : "text-red-600"}>
                              {Number(line.variance_amount) >= 0 ? (
                                <TrendingUp className="inline h-3 w-3 mr-1" />
                              ) : (
                                <TrendingDown className="inline h-3 w-3 mr-1" />
                              )}
                              {Number(line.variance_amount).toLocaleString('fr-FR')}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={Math.min(usagePercent, 100)} className="w-16 h-2" />
                              <span className={`text-xs ${usagePercent > 100 ? "text-red-600 font-bold" : ""}`}>
                                {usagePercent.toFixed(0)}%
                              </span>
                              {line.is_over_budget && (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {permissions.canEdit && (
                                <>
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(line)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(line.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {/* Validation History */}
        <BudgetValidationHistory budgetId={id!} />
      </div>

      <BudgetLineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        budgetId={id!}
        line={editingLine}
        nextLineNumber={(lines?.length || 0) + 1}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Cette ligne budgétaire sera supprimée définitivement.
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
