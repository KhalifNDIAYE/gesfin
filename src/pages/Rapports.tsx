import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PermissionButton } from "@/components/auth/PermissionButton";
import { 
  FileText, 
  Download, 
  Calendar,
  BarChart3,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  Printer
} from "lucide-react";

interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  formats: string[];
  lastGenerated?: string;
}

const reports: ReportType[] = [
  { id: "1", title: "Bilan Comptable", description: "État de la situation patrimoniale", icon: FileText, formats: ["PDF", "Excel"], lastGenerated: "2024-01-10" },
  { id: "2", title: "Compte de Résultat", description: "Produits et charges de l'exercice", icon: TrendingUp, formats: ["PDF", "Excel"], lastGenerated: "2024-01-10" },
  { id: "3", title: "Tableau de Financement", description: "Emplois et ressources", icon: BarChart3, formats: ["PDF", "Excel"], lastGenerated: "2024-01-05" },
  { id: "4", title: "Balance Générale", description: "Soldes des comptes", icon: FileSpreadsheet, formats: ["PDF", "Excel", "CSV"], lastGenerated: "2024-01-15" },
  { id: "5", title: "État d'Exécution Budgétaire", description: "Suivi budget vs réalisé", icon: PieChart, formats: ["PDF", "Excel"], lastGenerated: "2024-01-12" },
  { id: "6", title: "Rapport aux Bailleurs", description: "Rapport financier consolidé", icon: FileText, formats: ["PDF", "Word"], lastGenerated: "2023-12-31" },
  { id: "7", title: "Tableau des Immobilisations", description: "État du patrimoine", icon: FileSpreadsheet, formats: ["PDF", "Excel"], lastGenerated: "2024-01-08" },
  { id: "8", title: "État des Décaissements", description: "Suivi des flux par bailleur", icon: TrendingUp, formats: ["PDF", "Excel"], lastGenerated: "2024-01-14" },
];

const Rapports = () => {
  return (
    <AppLayout 
      title="Rapports & États Financiers" 
      subtitle="Génération et export des documents financiers"
    >
      <div className="space-y-6">
        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-primary text-primary-foreground">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-foreground/20">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm opacity-90">Rapport rapide</p>
                <p className="text-lg font-semibold">Bilan mensuel</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <Calendar className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clôture</p>
                <p className="text-lg font-semibold">Janvier 2024</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                <Download className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ce mois</p>
                <p className="text-lg font-semibold">24 exports</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Printer className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-lg font-semibold">3 rapports</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reports.map((report, index) => {
            const Icon = report.icon;
            
            return (
              <Card 
                key={report.id}
                className={`group transition-all duration-300 hover:shadow-lg animate-slide-up opacity-0 stagger-${Math.min(index + 1, 5)}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-sm">{report.title}</CardTitle>
                      <CardDescription className="text-xs">{report.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.lastGenerated && (
                    <p className="text-xs text-muted-foreground">
                      Dernier: {report.lastGenerated}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {report.formats.map((format) => (
                      <Button 
                        key={format} 
                        variant="outline" 
                        size="sm"
                        className="h-8 text-xs"
                      >
                        <Download className="mr-1 h-3 w-3" />
                        {format}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Custom Report Section */}
        <Card>
          <CardHeader>
            <CardTitle>Rapport personnalisé</CardTitle>
            <CardDescription>Générer un rapport sur mesure avec les paramètres de votre choix</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Créez votre propre rapport</p>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez les données, la période et le format souhaités
                </p>
              </div>
              <PermissionButton variant="gradient" module="rapports" permission="create">
                Créer un rapport
              </PermissionButton>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Rapports;
