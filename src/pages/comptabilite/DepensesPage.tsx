import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Upload, Wallet, FileText, Filter } from "lucide-react";
import { useJournalEntries } from "@/hooks/useComptabilite";
import { useFiscalYears } from "@/hooks/useParametrage";
import { JournalEntriesTable } from "@/components/comptabilite/JournalEntriesTable";
import { JournalEntryDialog } from "@/components/comptabilite/JournalEntryDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExpenseWorkflowStatus,
  EXPENSE_STATUS_LABELS,
} from "@/hooks/useExpenseWorkflow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WORKFLOW_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'brouillon', label: 'Brouillons' },
  { value: 'soumise', label: 'Soumises' },
  { value: 'en_validation', label: 'En validation' },
  { value: 'validee', label: 'Validées' },
  { value: 'rejetee', label: 'Rejetées' },
  { value: 'payee', label: 'Payées' },
];

export default function DepensesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [workflowFilter, setWorkflowFilter] = useState<string>("all");

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);

  const { data: entries, isLoading } = useJournalEntries({
    fiscalYearId: selectedFiscalYear || currentFiscalYear?.id,
    entryType: 'depense',
  });

  const filteredEntries = entries?.filter(entry => {
    const matchesSearch = 
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.entry_number.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (workflowFilter === 'all') return true;
    
    const status = entry.expense_workflow_status || 'brouillon';
    
    if (workflowFilter === 'en_validation') {
      return ['en_validation_daf', 'en_validation_dt', 'en_validation_dg'].includes(status);
    }
    
    return status === workflowFilter;
  }) || [];

  // Calculate counts
  const statusCounts = entries?.reduce((acc, entry) => {
    const status = entry.expense_workflow_status || 'brouillon';
    acc[status] = (acc[status] || 0) + 1;
    if (['en_validation_daf', 'en_validation_dt', 'en_validation_dg'].includes(status)) {
      acc['en_validation'] = (acc['en_validation'] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <AppLayout 
      title="Gestion des Dépenses" 
      subtitle="Workflow de validation et suivi des dépenses"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setWorkflowFilter('brouillon')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{statusCounts['brouillon'] || 0}</div>
              <p className="text-sm text-muted-foreground">Brouillons</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setWorkflowFilter('en_validation')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-amber-600">{statusCounts['en_validation'] || 0}</div>
              <p className="text-sm text-muted-foreground">En validation</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setWorkflowFilter('validee')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-600">{statusCounts['validee'] || 0}</div>
              <p className="text-sm text-muted-foreground">Validées</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setWorkflowFilter('rejetee')}>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-600">{statusCounts['rejetee'] || 0}</div>
              <p className="text-sm text-muted-foreground">Rejetées</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setWorkflowFilter('payee')}>
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
                  <CardDescription>Gestion et validation des dépenses</CardDescription>
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
                <Select value={workflowFilter} onValueChange={setWorkflowFilter}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrer par statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKFLOW_FILTERS.map((filter) => (
                      <SelectItem key={filter.value} value={filter.value}>
                        {filter.label}
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
                <Button variant="gradient" size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nouvelle dépense
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <JournalEntriesTable 
              entries={filteredEntries} 
              isLoading={isLoading} 
              showWorkflow={true}
            />
          </CardContent>
        </Card>
      </div>

      <JournalEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entryType="depense"
      />
    </AppLayout>
  );
}
