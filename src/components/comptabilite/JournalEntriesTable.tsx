import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
import { Eye, MoreHorizontal, CheckCircle, Trash2, History } from "lucide-react";
import { JournalEntry, useJournalEntryMutations, EntryStatus, EntryType } from "@/hooks/useComptabilite";
import { JournalEntryDetailDialog } from "./JournalEntryDetailDialog";
import { ExpenseWorkflowActions } from "./ExpenseWorkflowActions";
import { ExpenseValidationHistory } from "./ExpenseValidationHistory";
import {
  ExpenseWorkflowStatus,
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_COLORS,
} from "@/hooks/useExpenseWorkflow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface JournalEntriesTableProps {
  entries: JournalEntry[];
  isLoading: boolean;
  showWorkflow?: boolean;
}

const STATUS_BADGES: Record<EntryStatus, { label: string; variant: "default" | "secondary" | "outline" }> = {
  brouillon: { label: "Brouillon", variant: "secondary" },
  valide: { label: "Validé", variant: "default" },
  cloture: { label: "Clôturé", variant: "outline" },
};

const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  depense: "Dépense",
  financement: "Financement",
  decaissement: "Décaissement",
  prise_en_charge: "Prise en charge",
  autre: "Autre",
};

export function JournalEntriesTable({ entries, isLoading, showWorkflow = false }: JournalEntriesTableProps) {
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const { validateMutation, deleteMutation } = useJournalEntryMutations();

  const handleValidate = async (entry: JournalEntry) => {
    await validateMutation.mutateAsync(entry.id);
  };

  const handleDelete = async () => {
    if (entryToDelete) {
      await deleteMutation.mutateAsync(entryToDelete.id);
      setEntryToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>Aucune écriture trouvée</p>
        <p className="text-sm">Créez votre première écriture comptable</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>N° Pièce</TableHead>
              <TableHead>Journal</TableHead>
              {!showWorkflow && <TableHead>Type</TableHead>}
              <TableHead>Libellé</TableHead>
              <TableHead>Tiers</TableHead>
              <TableHead>Devise</TableHead>
              <TableHead>{showWorkflow ? 'Statut Workflow' : 'Statut'}</TableHead>
              {showWorkflow && <TableHead>Actions</TableHead>}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => {
              const workflowStatus = (entry.expense_workflow_status || 'brouillon') as ExpenseWorkflowStatus;
              
              return (
                <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    {format(new Date(entry.entry_date), "dd/MM/yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="font-mono text-sm font-medium">
                    {entry.entry_number}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {entry.journal?.code}
                    </Badge>
                  </TableCell>
                  {!showWorkflow && (
                    <TableCell className="text-sm">
                      {ENTRY_TYPE_LABELS[entry.entry_type]}
                    </TableCell>
                  )}
                  <TableCell className="max-w-[200px] truncate">
                    {entry.description}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entry.third_party?.name || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {entry.currency?.code}
                  </TableCell>
                  <TableCell>
                    {showWorkflow ? (
                      <Badge className={EXPENSE_STATUS_COLORS[workflowStatus]}>
                        {EXPENSE_STATUS_LABELS[workflowStatus]}
                      </Badge>
                    ) : (
                      <Badge variant={STATUS_BADGES[entry.status].variant}>
                        {STATUS_BADGES[entry.status].label}
                      </Badge>
                    )}
                  </TableCell>
                  {showWorkflow && (
                    <TableCell>
                      <ExpenseWorkflowActions
                        entryId={entry.id}
                        currentStatus={workflowStatus}
                        creatorId={entry.created_by || undefined}
                        budgetLineId={entry.budget_line_id || undefined}
                        requestedAmount={entry.requested_amount || 0}
                      />
                    </TableCell>
                  )}
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
                          Voir détail
                        </DropdownMenuItem>
                        {showWorkflow && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEntry(entry);
                              setShowHistory(true);
                            }}
                          >
                            <History className="h-4 w-4 mr-2" />
                            Historique validation
                          </DropdownMenuItem>
                        )}
                        {!showWorkflow && entry.status === "brouillon" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleValidate(entry)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Valider
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setEntryToDelete(entry)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}
                        {showWorkflow && workflowStatus === 'brouillon' && (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setEntryToDelete(entry)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
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

      <JournalEntryDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        entryId={selectedEntry?.id || null}
      />

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Historique de validation</DialogTitle>
          </DialogHeader>
          <ExpenseValidationHistory entryId={selectedEntry?.id || null} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'écriture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'écriture {entryToDelete?.entry_number} sera
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
    </>
  );
}
