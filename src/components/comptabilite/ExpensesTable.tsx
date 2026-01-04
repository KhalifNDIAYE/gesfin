import { useState, useMemo } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import * as XLSX from "xlsx";
import { usePDFGeneration } from "@/hooks/usePDFGeneration";
import { addTable, addSectionHeader } from "@/utils/pdfTemplate";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Eye, MoreHorizontal, Pencil, Send, History, Trash2, Download, FileSpreadsheet, FileText, Search, Filter, X } from "lucide-react";
import { JournalEntry, useJournalEntryMutations } from "@/hooks/useComptabilite";
import { JournalEntryDetailDialog } from "./JournalEntryDetailDialog";
import { ExpenseWorkflowActions } from "./ExpenseWorkflowActions";
import { ExpenseValidationHistory } from "./ExpenseValidationHistory";
import {
  ExpenseWorkflowStatus,
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_COLORS,
} from "@/hooks/useExpenseWorkflow";
import { useProjects } from "@/hooks/useProjects";
import { useThirdParties } from "@/hooks/useComptabilite";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ExpensesTableProps {
  entries: JournalEntry[];
  isLoading: boolean;
  onRefresh?: () => void;
}

const STATUS_ROW_COLORS: Record<string, string> = {
  brouillon: "",
  soumise: "bg-blue-50 dark:bg-blue-950/20",
  en_validation_daf: "bg-amber-50 dark:bg-amber-950/20",
  en_validation_dt: "bg-amber-50 dark:bg-amber-950/20",
  en_validation_dg: "bg-amber-50 dark:bg-amber-950/20",
  validee: "bg-green-50 dark:bg-green-950/20",
  rejetee: "bg-red-50 dark:bg-red-950/20",
  payee: "bg-emerald-50 dark:bg-emerald-950/20",
};

export function ExpensesTable({ entries, isLoading, onRefresh }: ExpensesTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const { deleteMutation } = useJournalEntryMutations();
  const { projects } = useProjects();
  const { data: suppliers } = useThirdParties('fournisseur');

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        entry.entry_number.toLowerCase().includes(searchLower) ||
        entry.description.toLowerCase().includes(searchLower) ||
        (entry.third_party?.name || "").toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;

      // Project filter
      if (projectFilter !== "all" && entry.project_id !== projectFilter) return false;

      // Status filter
      const status = entry.expense_workflow_status || 'brouillon';
      if (statusFilter !== "all") {
        if (statusFilter === 'en_validation') {
          if (!['en_validation_daf', 'en_validation_dt', 'en_validation_dg'].includes(status)) return false;
        } else if (status !== statusFilter) return false;
      }

      // Supplier filter
      if (supplierFilter !== "all" && entry.third_party_id !== supplierFilter) return false;

      // Date filters
      const entryDate = new Date(entry.entry_date);
      if (dateFrom && entryDate < dateFrom) return false;
      if (dateTo && entryDate > dateTo) return false;

      return true;
    });
  }, [entries, searchQuery, projectFilter, statusFilter, supplierFilter, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (entryToDelete) {
      await deleteMutation.mutateAsync(entryToDelete.id);
      setEntryToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setProjectFilter("all");
    setStatusFilter("all");
    setSupplierFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const hasActiveFilters = searchQuery || projectFilter !== "all" || statusFilter !== "all" || 
    supplierFilter !== "all" || dateFrom || dateTo;

  // Export functions
  const exportToExcel = () => {
    const data = filteredEntries.map(entry => ({
      "Numéro": entry.entry_number,
      "Date": format(new Date(entry.entry_date), "dd/MM/yyyy"),
      "Projet": projects?.find(p => p.id === entry.project_id)?.name || "-",
      "Fournisseur": entry.third_party?.name || "-",
      "Montant": entry.requested_amount || 0,
      "Devise": entry.currency?.code || "XOF",
      "Statut": EXPENSE_STATUS_LABELS[(entry.expense_workflow_status || 'brouillon') as ExpenseWorkflowStatus],
      "Description": entry.description,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dépenses");
    XLSX.writeFile(wb, `depenses_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
    toast({ title: "Export Excel réussi" });
  };

  const { downloadPDF } = usePDFGeneration();

  const exportToPDF = async () => {
    await downloadPDF(
      {
        title: "Liste des Dépenses",
        documentDate: new Date(),
        documentRef: `DEP-${format(new Date(), 'yyyyMMdd')}`,
        auditModule: "comptabilite",
        auditResourceType: "export",
      },
      `depenses_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`,
      (ctx) => {
        addSectionHeader(ctx, "Dépenses");
        
        const headers = ["Numéro", "Date", "Projet", "Fournisseur", "Montant", "Statut"];
        const rows = filteredEntries.map(entry => [
          entry.entry_number.substring(0, 10),
          format(new Date(entry.entry_date), "dd/MM/yyyy"),
          (projects?.find(p => p.id === entry.project_id)?.code || "-").substring(0, 12),
          (entry.third_party?.name || "-").substring(0, 15),
          `${(entry.requested_amount || 0).toLocaleString()} ${entry.currency?.code || ""}`,
          EXPENSE_STATUS_LABELS[(entry.expense_workflow_status || 'brouillon') as ExpenseWorkflowStatus].substring(0, 12),
        ]);
        
        addTable(ctx, headers, rows, [25, 25, 35, 35, 30, 25]);
      }
    );
  };

  const getProjectName = (projectId?: string | null) => {
    if (!projectId || !projects) return "-";
    const project = projects.find(p => p.id === projectId);
    return project?.code || project?.name || "-";
  };

  const getValidatorName = (entry: JournalEntry) => {
    if (entry.dg_validated_by) return "DG";
    if (entry.dt_validated_by) return "DT";
    if (entry.daf_validated_by) return "DAF";
    return "-";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro, description, fournisseur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Projet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.code} - {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="brouillon">Brouillon</SelectItem>
            <SelectItem value="soumise">Soumise</SelectItem>
            <SelectItem value="en_validation">En validation</SelectItem>
            <SelectItem value="validee">Validée</SelectItem>
            <SelectItem value="rejetee">Rejetée</SelectItem>
            <SelectItem value="payee">Payée</SelectItem>
          </SelectContent>
        </Select>

        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Fournisseur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les fournisseurs</SelectItem>
            {suppliers?.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Date début"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "dd/MM/yyyy") : "Date fin"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Effacer
          </Button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToPDF}>
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filteredEntries.length} dépense{filteredEntries.length > 1 ? 's' : ''} trouvée{filteredEntries.length > 1 ? 's' : ''}
      </div>

      {/* Table */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <p>Aucune dépense trouvée</p>
          <p className="text-sm">Modifiez vos filtres ou créez une nouvelle dépense</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Projet</TableHead>
                <TableHead>Fournisseur</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Validateur</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => {
                const workflowStatus = (entry.expense_workflow_status || 'brouillon') as ExpenseWorkflowStatus;
                const canEdit = workflowStatus === 'brouillon';
                
                return (
                  <TableRow 
                    key={entry.id} 
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      STATUS_ROW_COLORS[workflowStatus]
                    )}
                  >
                    <TableCell className="font-mono text-sm font-medium">
                      {entry.entry_number}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(entry.entry_date), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getProjectName(entry.project_id)}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {entry.third_party?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {(entry.requested_amount || 0).toLocaleString()} {entry.currency?.code}
                    </TableCell>
                    <TableCell>
                      <Badge className={EXPENSE_STATUS_COLORS[workflowStatus]}>
                        {EXPENSE_STATUS_LABELS[workflowStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.budget_line_id ? "Lié" : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getValidatorName(entry)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowDetail(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEntry(entry);
                                setShowEdit(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowHistory(true);
                            }}
                          >
                            <History className="h-4 w-4 mr-2" />
                            Historique
                          </DropdownMenuItem>
                          {canEdit && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setEntryToDelete(entry)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail Dialog */}
      <JournalEntryDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        entryId={selectedEntry?.id || null}
      />

      {/* Edit Dialog - Using detail dialog since edit is not available */}
      <JournalEntryDetailDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        entryId={selectedEntry?.id || null}
      />

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Historique de validation</DialogTitle>
          </DialogHeader>
          <ExpenseValidationHistory entryId={selectedEntry?.id || null} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la dépense ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La dépense {entryToDelete?.entry_number} sera
              définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
