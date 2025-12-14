import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Plus,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  Filter,
  X,
  Eye,
  MoreHorizontal,
  CheckCircle,
  Trash2,
  History,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useJournalEntries, useJournals, EntryType, EntryStatus, JournalEntry, useJournalEntryMutations, useJournalEntryWithLines } from "@/hooks/useComptabilite";
import { useFiscalYears, useCurrencies } from "@/hooks/useParametrage";
import { useProjects } from "@/hooks/useProjects";
import { JournalEntryDialog } from "@/components/comptabilite/JournalEntryDialog";
import { JournalEntryDetailDialog } from "@/components/comptabilite/JournalEntryDetailDialog";
import { PermissionButton, PermissionGate, useModulePermissions } from "@/components/auth/PermissionButton";
import { TableExportButtons, ExportColumn } from "@/components/export/TableExportButtons";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_BADGES: Record<EntryStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
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

const ENTRY_TYPE_COLORS: Record<EntryType, string> = {
  depense: "bg-red-500/10 text-red-600 border-red-200",
  financement: "bg-green-500/10 text-green-600 border-green-200",
  decaissement: "bg-blue-500/10 text-blue-600 border-blue-200",
  prise_en_charge: "bg-purple-500/10 text-purple-600 border-purple-200",
  autre: "bg-gray-500/10 text-gray-600 border-gray-200",
};

export default function JournalPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntryType, setSelectedEntryType] = useState<EntryType>("autre");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "drafts" | "validated">("all");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [selectedJournal, setSelectedJournal] = useState<string>("");
  const [selectedEntryTypeFilter, setSelectedEntryTypeFilter] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { canCreate, canValidate, canExport, canDelete } = useModulePermissions("comptabilite");

  const { data: fiscalYears } = useFiscalYears();
  const { data: journals } = useJournals();
  const { data: currencies } = useCurrencies();
  const { projects } = useProjects();
  const currentFiscalYear = fiscalYears?.find((fy) => fy.is_current);

  const { data: journalEntries, isLoading, refetch } = useJournalEntries({
    fiscalYearId: selectedFiscalYear || currentFiscalYear?.id,
    journalId: selectedJournal || undefined,
    entryType: selectedEntryTypeFilter as EntryType | undefined,
    status: selectedStatusFilter as EntryStatus | undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { validateMutation, deleteMutation } = useJournalEntryMutations();

  // Filter entries based on tab and search
  const filteredEntries = useMemo(() => {
    let entries = journalEntries || [];

    // Filter by tab
    if (activeTab === "drafts") {
      entries = entries.filter((e) => e.status === "brouillon");
    } else if (activeTab === "validated") {
      entries = entries.filter((e) => e.status === "valide");
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(
        (entry) =>
          entry.description.toLowerCase().includes(query) ||
          entry.entry_number.toLowerCase().includes(query) ||
          entry.reference?.toLowerCase().includes(query) ||
          entry.third_party?.name?.toLowerCase().includes(query)
      );
    }

    // Project filter
    if (selectedProject) {
      entries = entries.filter((e) => e.project_id === selectedProject);
    }

    return entries;
  }, [journalEntries, activeTab, searchQuery, selectedProject]);

  // Calculate totals from entry lines
  const totals = useMemo(() => {
    // Since we don't have lines in the list query, we'll show entry count stats
    const totalEntries = filteredEntries.length;
    const draftCount = filteredEntries.filter((e) => e.status === "brouillon").length;
    const validatedCount = filteredEntries.filter((e) => e.status === "valide").length;
    
    return {
      totalEntries,
      draftCount,
      validatedCount,
    };
  }, [filteredEntries]);

  const handleNewEntry = (type: EntryType) => {
    setSelectedEntryType(type);
    setDialogOpen(true);
  };

  const handleValidate = async (entry: JournalEntry) => {
    try {
      await validateMutation.mutateAsync(entry.id);
      toast.success("Écriture validée avec succès");
    } catch (error) {
      toast.error("Erreur lors de la validation");
    }
  };

  const handleDelete = async () => {
    if (entryToDelete) {
      try {
        await deleteMutation.mutateAsync(entryToDelete.id);
        setEntryToDelete(null);
        toast.success("Écriture supprimée avec succès");
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedJournal("");
    setSelectedEntryTypeFilter("");
    setSelectedStatusFilter("");
    setSelectedProject("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters =
    selectedJournal || selectedEntryTypeFilter || selectedStatusFilter || selectedProject || startDate || endDate;

  const exportColumns: ExportColumn[] = [
    { key: "entry_date", label: "Date", format: (v) => format(new Date(v), "dd/MM/yyyy") },
    { key: "entry_number", label: "N° Pièce" },
    { key: "journal.code", label: "Journal" },
    { key: "entry_type", label: "Type", format: (v) => ENTRY_TYPE_LABELS[v as EntryType] },
    { key: "description", label: "Libellé" },
    { key: "third_party.name", label: "Tiers" },
    { key: "reference", label: "Référence" },
    { key: "currency.code", label: "Devise" },
    { key: "status", label: "Statut", format: (v) => STATUS_BADGES[v as EntryStatus].label },
  ];

  return (
    <AppLayout title="Journal Comptable" subtitle="Enregistrement chronologique des écritures comptables">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total écritures</p>
                <p className="text-2xl font-bold">{totals.totalEntries}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                <FileText className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Brouillons</p>
                <p className="text-2xl font-bold">{totals.draftCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold">{totals.validatedCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exercice</p>
                <p className="text-2xl font-bold">{currentFiscalYear?.name || "-"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Journal des Opérations
                </CardTitle>
                <CardDescription>
                  {currentFiscalYear ? `Exercice ${currentFiscalYear.name}` : "Toutes les écritures"}
                </CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filtres
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-xs">
                      !
                    </Badge>
                  )}
                </Button>

                <PermissionGate module="comptabilite" permission="export">
                  <TableExportButtons
                    data={filteredEntries}
                    columns={exportColumns}
                    filename="journal-comptable"
                    title="Journal Comptable"
                  />
                </PermissionGate>

                <PermissionButton
                  module="comptabilite"
                  permission="create"
                  variant="gradient"
                  size="sm"
                  onClick={() => handleNewEntry("autre")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvelle écriture
                </PermissionButton>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filtres avancés</h4>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Effacer
                    </Button>
                  )}
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exercice</label>
                    <Select
                      value={selectedFiscalYear || currentFiscalYear?.id || ""}
                      onValueChange={setSelectedFiscalYear}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les exercices" />
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

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Journal</label>
                    <Select value={selectedJournal} onValueChange={setSelectedJournal}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les journaux" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous</SelectItem>
                        {journals?.map((j) => (
                          <SelectItem key={j.id} value={j.id}>
                            {j.code} - {j.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type d'écriture</label>
                    <Select value={selectedEntryTypeFilter} onValueChange={setSelectedEntryTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous</SelectItem>
                        <SelectItem value="depense">Dépense</SelectItem>
                        <SelectItem value="financement">Financement</SelectItem>
                        <SelectItem value="decaissement">Décaissement</SelectItem>
                        <SelectItem value="prise_en_charge">Prise en charge</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Statut</label>
                    <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les statuts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous</SelectItem>
                        <SelectItem value="brouillon">Brouillon</SelectItem>
                        <SelectItem value="valide">Validé</SelectItem>
                        <SelectItem value="cloture">Clôturé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Projet</label>
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les projets" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous</SelectItem>
                        {projects?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.code} - {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date début</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date fin</label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Recherche</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="N° pièce, libellé, tiers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* Quick Search if filters hidden */}
            {!showFilters && (
              <div className="flex items-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher une écriture..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
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
              </div>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4">
              <TabsList>
                <TabsTrigger value="all">
                  Toutes ({journalEntries?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="drafts">
                  Brouillons ({totals.draftCount})
                </TabsTrigger>
                <TabsTrigger value="validated">
                  Validées ({totals.validatedCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-pulse text-muted-foreground">Chargement...</div>
                  </div>
                ) : filteredEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mb-4 opacity-50" />
                    <p>Aucune écriture trouvée</p>
                    <p className="text-sm">Modifiez vos filtres ou créez une nouvelle écriture</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Date</TableHead>
                          <TableHead className="w-[120px]">N° Pièce</TableHead>
                          <TableHead className="w-[80px]">Journal</TableHead>
                          <TableHead className="w-[100px]">Type</TableHead>
                          <TableHead>Libellé</TableHead>
                          <TableHead>Tiers</TableHead>
                          <TableHead className="w-[80px]">Devise</TableHead>
                          <TableHead className="w-[100px]">Statut</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEntries.map((entry) => (
                          <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell className="font-mono text-sm">
                              {format(new Date(entry.entry_date), "dd/MM/yyyy", { locale: fr })}
                            </TableCell>
                            <TableCell className="font-mono text-sm font-medium">
                              {entry.entry_number}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{entry.journal?.code}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("border", ENTRY_TYPE_COLORS[entry.entry_type])}>
                                {ENTRY_TYPE_LABELS[entry.entry_type]}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[250px] truncate" title={entry.description}>
                              {entry.description}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.third_party?.name || "-"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {entry.currency?.code}
                            </TableCell>
                            <TableCell>
                              <Badge variant={STATUS_BADGES[entry.status].variant}>
                                {STATUS_BADGES[entry.status].label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover border shadow-lg z-50">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedEntry(entry);
                                      setShowDetail(true);
                                    }}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir détail
                                  </DropdownMenuItem>
                                  {entry.status === "brouillon" && canValidate && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleValidate(entry)}>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Valider
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {entry.status === "brouillon" && canDelete && (
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
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={9} className="text-right">
                            <span className="text-sm text-muted-foreground">
                              {filteredEntries.length} écriture(s) affichée(s)
                            </span>
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <JournalEntryDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        entryId={selectedEntry?.id || null}
      />

      {/* New Entry Dialog */}
      <JournalEntryDialog open={dialogOpen} onOpenChange={setDialogOpen} entryType={selectedEntryType} />

      {/* Delete Confirmation */}
      <AlertDialog open={!!entryToDelete} onOpenChange={() => setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'écriture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'écriture {entryToDelete?.entry_number} sera définitivement
              supprimée.
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
    </AppLayout>
  );
}
