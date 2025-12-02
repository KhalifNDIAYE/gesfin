import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useJournalEntryWithLines, EntryStatus, EntryType } from "@/hooks/useComptabilite";

interface JournalEntryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entryId: string | null;
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

export function JournalEntryDetailDialog({ open, onOpenChange, entryId }: JournalEntryDetailDialogProps) {
  const { data: entry, isLoading } = useJournalEntryWithLines(entryId);

  const totalDebit = entry?.lines?.reduce((sum, line) => sum + Number(line.debit_amount), 0) || 0;
  const totalCredit = entry?.lines?.reduce((sum, line) => sum + Number(line.credit_amount), 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Écriture {entry?.entry_number}
            {entry && (
              <Badge variant={STATUS_BADGES[entry.status].variant}>
                {STATUS_BADGES[entry.status].label}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Détail de l'écriture comptable
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Chargement...</div>
          </div>
        ) : entry ? (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(entry.entry_date), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Journal</p>
                <p className="font-medium">
                  {entry.journal?.code} - {entry.journal?.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exercice</p>
                <p className="font-medium">{entry.fiscal_year?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{ENTRY_TYPE_LABELS[entry.entry_type]}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Devise</p>
                <p className="font-medium">{entry.currency?.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Taux de change</p>
                <p className="font-medium">{entry.exchange_rate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tiers</p>
                <p className="font-medium">{entry.third_party?.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Référence</p>
                <p className="font-medium">{entry.reference || "-"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Libellé</p>
              <p className="font-medium">{entry.description}</p>
            </div>

            <Separator />

            {/* Lines */}
            <div>
              <h4 className="font-medium mb-3">Lignes d'écriture</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>N°</TableHead>
                      <TableHead>Compte</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Axe analytique</TableHead>
                      <TableHead className="text-right">Débit</TableHead>
                      <TableHead className="text-right">Crédit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.lines?.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell className="font-mono text-sm">
                          {line.line_number}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{line.account?.code}</span>
                          <span className="text-muted-foreground ml-2">
                            {line.account?.name}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {line.description || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {line.tracking_axis?.code || "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(line.debit_amount) > 0
                            ? Number(line.debit_amount).toLocaleString("fr-FR", {
                                minimumFractionDigits: 2,
                              })
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {Number(line.credit_amount) > 0
                            ? Number(line.credit_amount).toLocaleString("fr-FR", {
                                minimumFractionDigits: 2,
                              })
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <tfoot>
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={4} className="text-right">
                        Total
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {totalDebit.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {totalCredit.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
            </div>

            {/* Validation Info */}
            {entry.status !== "brouillon" && entry.validated_at && (
              <div className="text-sm text-muted-foreground">
                Validé le {format(new Date(entry.validated_at), "dd/MM/yyyy à HH:mm", { locale: fr })}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
