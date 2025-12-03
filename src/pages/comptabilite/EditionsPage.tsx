import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Printer, 
  FileText, 
  Download, 
  Calendar,
  BookOpen,
  Scale,
  Users,
  PieChart
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFiscalYears } from "@/hooks/useParametrage";

interface EditionCard {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const editions: EditionCard[] = [
  {
    id: 'journal',
    title: 'Journal',
    description: 'État chronologique des écritures',
    icon: BookOpen,
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    id: 'grand-livre',
    title: 'Grand Livre',
    description: 'Détail par compte comptable',
    icon: FileText,
    color: 'bg-green-500/10 text-green-600',
  },
  {
    id: 'balance',
    title: 'Balance Générale',
    description: 'Synthèse des soldes',
    icon: Scale,
    color: 'bg-purple-500/10 text-purple-600',
  },
  {
    id: 'balance-tiers',
    title: 'Balance des Tiers',
    description: 'Soldes fournisseurs et clients',
    icon: Users,
    color: 'bg-orange-500/10 text-orange-600',
  },
  {
    id: 'balance-agee',
    title: 'Balance Âgée',
    description: 'Créances par ancienneté',
    icon: Calendar,
    color: 'bg-red-500/10 text-red-600',
  },
  {
    id: 'analytique',
    title: 'États Analytiques',
    description: 'Répartition par centre de coût',
    icon: PieChart,
    color: 'bg-teal-500/10 text-teal-600',
  },
];

export default function EditionsPage() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedEdition, setSelectedEdition] = useState<string | null>(null);

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);

  const handleGenerate = (editionId: string) => {
    setSelectedEdition(editionId);
    // TODO: Implement generation logic for editionId
  };

  return (
    <AppLayout 
      title="Éditions Comptables" 
      subtitle="Génération des états et rapports comptables"
    >
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" />
              Paramètres d'édition
            </CardTitle>
            <CardDescription>Définissez la période et les filtres</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Exercice</label>
                <Select
                  value={selectedFiscalYear || currentFiscalYear?.id || ""}
                  onValueChange={setSelectedFiscalYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
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
                <label className="text-sm font-medium">Date début</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date fin</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <Select defaultValue="pdf">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Editions Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {editions.map((edition) => {
            const Icon = edition.icon;
            return (
              <Card 
                key={edition.id}
                className="cursor-pointer hover:border-primary/50 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${edition.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="text-lg">{edition.title}</CardTitle>
                  <CardDescription>{edition.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleGenerate(edition.id)}
                    >
                      <Printer className="h-4 w-4" />
                      Aperçu
                    </Button>
                    <Button 
                      variant="gradient" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleGenerate(edition.id)}
                    >
                      <Download className="h-4 w-4" />
                      Télécharger
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle>États récents</CardTitle>
            <CardDescription>Dernières éditions générées</CardDescription>
          </CardHeader>
          <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
            Aucune édition récente
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
