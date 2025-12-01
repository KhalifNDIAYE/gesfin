import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Download,
  Upload,
  FileText,
  Calculator,
  BookOpen,
  PieChart
} from "lucide-react";

interface JournalEntry {
  id: string;
  date: string;
  numero: string;
  libelle: string;
  compte: string;
  debit: number;
  credit: number;
  projet: string;
}

const journalEntries: JournalEntry[] = [
  { id: "1", date: "2024-01-15", numero: "JOD-001", libelle: "Décaissement BM Tranche 2", compte: "512100", debit: 250000000, credit: 0, projet: "PRJ-001" },
  { id: "2", date: "2024-01-15", numero: "JOD-001", libelle: "Décaissement BM Tranche 2", compte: "441100", debit: 0, credit: 250000000, projet: "PRJ-001" },
  { id: "3", date: "2024-01-14", numero: "JOD-002", libelle: "Paiement fournisseur ELEC-SA", compte: "401100", debit: 45000000, credit: 0, projet: "PRJ-002" },
  { id: "4", date: "2024-01-14", numero: "JOD-002", libelle: "Paiement fournisseur ELEC-SA", compte: "512100", debit: 0, credit: 45000000, projet: "PRJ-002" },
  { id: "5", date: "2024-01-13", numero: "JOD-003", libelle: "Honoraires consultants santé", compte: "622100", debit: 12500000, credit: 0, projet: "PRJ-004" },
  { id: "6", date: "2024-01-13", numero: "JOD-003", libelle: "Honoraires consultants santé", compte: "512100", debit: 0, credit: 12500000, projet: "PRJ-004" },
];

const Comptabilite = () => {
  return (
    <AppLayout 
      title="Comptabilité" 
      subtitle="Comptabilité générale, analytique et budgétaire"
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Écritures du mois</p>
                <p className="text-2xl font-bold">847</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <Calculator className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Balance équilibrée</p>
                <p className="text-2xl font-bold text-success">Oui</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                <PieChart className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Centres analytiques</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <FileText className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente validation</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="journal" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="journal">Journal</TabsTrigger>
              <TabsTrigger value="grand-livre">Grand Livre</TabsTrigger>
              <TabsTrigger value="balance">Balance</TabsTrigger>
              <TabsTrigger value="analytique">Analytique</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" />
                Importer
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Button variant="gradient" size="sm">
                <Plus className="h-4 w-4" />
                Nouvelle écriture
              </Button>
            </div>
          </div>

          <TabsContent value="journal" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Journal des Opérations</CardTitle>
                    <CardDescription>Enregistrement chronologique des écritures comptables</CardDescription>
                  </div>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Rechercher..." className="pl-9" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>N° Pièce</th>
                        <th>Libellé</th>
                        <th>Compte</th>
                        <th>Projet</th>
                        <th className="text-right">Débit</th>
                        <th className="text-right">Crédit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journalEntries.map((entry) => (
                        <tr key={entry.id}>
                          <td className="font-mono text-sm">{entry.date}</td>
                          <td className="font-mono text-sm">{entry.numero}</td>
                          <td>{entry.libelle}</td>
                          <td className="font-mono">{entry.compte}</td>
                          <td className="text-sm text-muted-foreground">{entry.projet}</td>
                          <td className="text-right font-mono">
                            {entry.debit > 0 ? entry.debit.toLocaleString() : "-"}
                          </td>
                          <td className="text-right font-mono">
                            {entry.credit > 0 ? entry.credit.toLocaleString() : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50 font-semibold">
                        <td colSpan={5}>Total</td>
                        <td className="text-right font-mono">307,500,000</td>
                        <td className="text-right font-mono">307,500,000</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
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

          <TabsContent value="budget">
            <Card>
              <CardHeader>
                <CardTitle>Suivi Budgétaire</CardTitle>
                <CardDescription>Comparaison budget vs réalisé</CardDescription>
              </CardHeader>
              <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
                Tableau de suivi budgétaire
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Comptabilite;
