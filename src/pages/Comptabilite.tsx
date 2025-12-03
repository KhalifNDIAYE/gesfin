import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Search, 
  Download,
  Upload,
  FileText,
  Calculator,
  BookOpen,
  PieChart,
  Wallet,
  CreditCard,
  Receipt,
  FileCheck,
  CheckCircle
} from "lucide-react";
import { useJournalEntries, useJournals, EntryType } from "@/hooks/useComptabilite";
import { useFiscalYears } from "@/hooks/useParametrage";
import { JournalEntriesTable } from "@/components/comptabilite/JournalEntriesTable";
import { JournalEntryDialog } from "@/components/comptabilite/JournalEntryDialog";
import { ThirdPartiesTab } from "@/components/comptabilite/ThirdPartiesTab";
import { PermissionButton, PermissionGate, useModulePermissions } from "@/components/auth/PermissionButton";

const ENTRY_TYPE_CARDS: { type: EntryType; label: string; icon: typeof Wallet; color: string }[] = [
  { type: 'depense', label: 'Dépenses', icon: Wallet, color: 'bg-red-500/10 text-red-600' },
  { type: 'financement', label: 'Financements', icon: CreditCard, color: 'bg-green-500/10 text-green-600' },
  { type: 'decaissement', label: 'Décaissements', icon: Receipt, color: 'bg-blue-500/10 text-blue-600' },
  { type: 'prise_en_charge', label: 'Prises en charge', icon: FileCheck, color: 'bg-purple-500/10 text-purple-600' },
];

const Comptabilite = () => {
  const [selectedTab, setSelectedTab] = useState("journal");
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [selectedEntryType, setSelectedEntryType] = useState<EntryType>('autre');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [selectedJournal, setSelectedJournal] = useState<string>("");
  const [selectedEntryTypeFilter, setSelectedEntryTypeFilter] = useState<string>("");

  const { canCreate, canValidate, canExport } = useModulePermissions('comptabilite');

  const { data: fiscalYears } = useFiscalYears();
  const { data: journals } = useJournals();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);

  const { data: journalEntries, isLoading: entriesLoading } = useJournalEntries({
    fiscalYearId: selectedFiscalYear || currentFiscalYear?.id,
    journalId: selectedJournal || undefined,
    entryType: selectedEntryTypeFilter as EntryType | undefined,
  });

  const filteredEntries = journalEntries?.filter(entry =>
    entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.entry_number.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleNewEntry = (type: EntryType) => {
    if (!canCreate) return;
    setSelectedEntryType(type);
    setEntryDialogOpen(true);
  };

  // Calculate stats
  const totalEntries = journalEntries?.length || 0;
  const draftEntries = journalEntries?.filter(e => e.status === 'brouillon').length || 0;
  const validatedEntries = journalEntries?.filter(e => e.status === 'valide').length || 0;

  return (
    <AppLayout 
      title="Comptabilité Générale" 
      subtitle="Saisie des écritures comptables avec multi-exercices et multi-devises"
    >
      <div className="space-y-6">
        {/* Quick Entry Buttons - Only show if user can create */}
        <PermissionGate module="comptabilite" permission="create">
          <div className="grid gap-4 md:grid-cols-4">
            {ENTRY_TYPE_CARDS.map(({ type, label, icon: Icon, color }) => (
              <Card 
                key={type} 
                className="cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleNewEntry(type)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-muted-foreground">Nouvelle saisie</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </PermissionGate>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total écritures</p>
                <p className="text-2xl font-bold">{totalEntries}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <FileText className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Brouillons</p>
                <p className="text-2xl font-bold">{draftEntries}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <Calculator className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validées</p>
                <p className="text-2xl font-bold">{validatedEntries}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                <PieChart className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exercice</p>
                <p className="text-2xl font-bold">{currentFiscalYear?.name || "-"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="journal">Journal</TabsTrigger>
              <TabsTrigger value="tiers">Tiers</TabsTrigger>
              <TabsTrigger value="grand-livre">Grand Livre</TabsTrigger>
              <TabsTrigger value="balance">Balance</TabsTrigger>
              <TabsTrigger value="analytique">Analytique</TabsTrigger>
            </TabsList>
            {selectedTab === "journal" && (
              <div className="flex items-center gap-2">
                <PermissionButton module="comptabilite" permission="create" variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                  Importer
                </PermissionButton>
                <PermissionButton module="comptabilite" permission="export" variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                  Exporter
                </PermissionButton>
                <PermissionButton module="comptabilite" permission="validate" variant="outline" size="sm">
                  <CheckCircle className="h-4 w-4" />
                  Valider sélection
                </PermissionButton>
                <PermissionButton 
                  module="comptabilite" 
                  permission="create" 
                  variant="gradient" 
                  size="sm" 
                  onClick={() => handleNewEntry('autre')}
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle écriture
                </PermissionButton>
              </div>
            )}
          </div>

          <TabsContent value="journal" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Journal des Opérations</CardTitle>
                    <CardDescription>Enregistrement chronologique des écritures comptables</CardDescription>
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
                    <Select value={selectedJournal} onValueChange={setSelectedJournal}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Journal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous</SelectItem>
                        {journals?.map((j) => (
                          <SelectItem key={j.id} value={j.id}>
                            {j.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedEntryTypeFilter} onValueChange={setSelectedEntryTypeFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous types</SelectItem>
                        <SelectItem value="depense">Dépense</SelectItem>
                        <SelectItem value="financement">Financement</SelectItem>
                        <SelectItem value="decaissement">Décaissement</SelectItem>
                        <SelectItem value="prise_en_charge">Prise en charge</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
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
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <JournalEntriesTable entries={filteredEntries} isLoading={entriesLoading} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tiers" className="space-y-4">
            <ThirdPartiesTab />
          </TabsContent>

          <TabsContent value="grand-livre">
            <Card>
              <CardHeader>
                <CardTitle>Grand Livre</CardTitle>
                <CardDescription>Détail des mouvements par compte</CardDescription>
              </CardHeader>
              <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
                Sélectionnez un compte pour afficher les mouvements
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="balance">
            <Card>
              <CardHeader>
                <CardTitle>Balance Générale</CardTitle>
                <CardDescription>État récapitulatif des soldes</CardDescription>
              </CardHeader>
              <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
                Balance des comptes
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytique">
            <Card>
              <CardHeader>
                <CardTitle>Comptabilité Analytique</CardTitle>
                <CardDescription>Répartition par centre de coût et projet</CardDescription>
              </CardHeader>
              <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
                Analyse des coûts par centre analytique
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <JournalEntryDialog
        open={entryDialogOpen}
        onOpenChange={setEntryDialogOpen}
        entryType={selectedEntryType}
      />
    </AppLayout>
  );
};

export default Comptabilite;
