import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download, Upload, Receipt } from "lucide-react";
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

export default function DecaissementsComptaPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);

  const { data: entries, isLoading } = useJournalEntries({
    fiscalYearId: selectedFiscalYear || currentFiscalYear?.id,
    entryType: 'decaissement',
  });

  const filteredEntries = entries?.filter(entry =>
    entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.entry_number.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <AppLayout 
      title="Saisie des Décaissements" 
      subtitle="Enregistrement des décaissements et paiements"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-500" />
                <div>
                  <CardTitle>Décaissements</CardTitle>
                  <CardDescription>Liste des écritures de décaissements</CardDescription>
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
                  <Upload className="h-4 w-4" />
                  Importer
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                  Exporter
                </Button>
                <Button variant="gradient" size="sm" onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nouveau décaissement
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <JournalEntriesTable entries={filteredEntries} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>

      <JournalEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entryType="decaissement"
      />
    </AppLayout>
  );
}
