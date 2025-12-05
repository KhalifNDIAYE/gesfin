import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet } from "lucide-react";
import { useJournalEntries } from "@/hooks/useComptabilite";
import { useFiscalYears } from "@/hooks/useParametrage";
import { ExpensesTable } from "@/components/comptabilite/ExpensesTable";
import { ExpenseFormDialog } from "@/components/comptabilite/ExpenseFormDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DepensesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);

  const { data: entries, isLoading, refetch } = useJournalEntries({
    fiscalYearId: selectedFiscalYear || currentFiscalYear?.id,
    entryType: 'depense',
  });

  // Calculate counts
  const statusCounts = entries?.reduce((acc, entry) => {
    const status = entry.expense_workflow_status || 'brouillon';
    acc[status] = (acc[status] || 0) + 1;
    if (['en_validation_daf', 'en_validation_dt', 'en_validation_dg'].includes(status)) {
      acc['en_validation'] = (acc['en_validation'] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const totalAmount = entries?.reduce((sum, e) => sum + (e.requested_amount || 0), 0) || 0;

  return (
    <AppLayout 
      title="Gestion des Dépenses" 
      subtitle="Workflow de validation et suivi des dépenses"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{entries?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total dépenses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{statusCounts['brouillon'] || 0}</div>
              <p className="text-sm text-muted-foreground">Brouillons</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">{statusCounts['en_validation'] || 0}</div>
              <p className="text-sm text-muted-foreground">En validation</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{statusCounts['validee'] || 0}</div>
              <p className="text-sm text-muted-foreground">Validées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{statusCounts['rejetee'] || 0}</div>
              <p className="text-sm text-muted-foreground">Rejetées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-emerald-600">{statusCounts['payee'] || 0}</div>
              <p className="text-sm text-muted-foreground">Payées</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-red-500" />
                <div>
                  <CardTitle>Dépenses</CardTitle>
                  <CardDescription>
                    Montant total : {totalAmount.toLocaleString()} XOF
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
                <Button variant="gradient" size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvelle dépense
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ExpensesTable 
              entries={entries || []} 
              isLoading={isLoading}
              onRefresh={refetch}
            />
          </CardContent>
        </Card>
      </div>

      <ExpenseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppLayout>
  );
}
