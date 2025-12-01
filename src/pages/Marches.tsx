import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  FileCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  Building2,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Contract {
  id: string;
  reference: string;
  objet: string;
  type: "travaux" | "fournitures" | "services" | "etudes";
  fournisseur: string;
  montant: number;
  dateSignature: string;
  dateEcheance: string;
  avancement: number;
  status: "en_cours" | "termine" | "en_attente" | "litige";
  projet: string;
}

const contracts: Contract[] = [
  { id: "1", reference: "MC-2023-001", objet: "Construction de 50 forages", type: "travaux", fournisseur: "SOGEA-SATOM", montant: 850000000, dateSignature: "2023-02-15", dateEcheance: "2024-08-15", avancement: 65, status: "en_cours", projet: "PRJ-001" },
  { id: "2", reference: "MC-2023-002", objet: "Fourniture équipements électriques", type: "fournitures", fournisseur: "Schneider Electric", montant: 420000000, dateSignature: "2023-05-01", dateEcheance: "2024-01-31", avancement: 90, status: "en_cours", projet: "PRJ-002" },
  { id: "3", reference: "MC-2022-015", objet: "Réhabilitation tronçon RN7", type: "travaux", fournisseur: "Razel-Bec", montant: 2500000000, dateSignature: "2022-03-10", dateEcheance: "2023-12-31", avancement: 100, status: "termine", projet: "PRJ-003" },
  { id: "4", reference: "MC-2023-003", objet: "Étude d'impact environnemental", type: "etudes", fournisseur: "ERM Consulting", montant: 75000000, dateSignature: "2023-07-01", dateEcheance: "2023-12-31", avancement: 45, status: "en_cours", projet: "PRJ-004" },
  { id: "5", reference: "MC-2023-004", objet: "Formation et assistance technique", type: "services", fournisseur: "Cabinet Deloitte", montant: 180000000, dateSignature: "2023-09-15", dateEcheance: "2024-09-14", avancement: 25, status: "en_cours", projet: "PRJ-005" },
  { id: "6", reference: "MC-2023-005", objet: "Fourniture véhicules 4x4", type: "fournitures", fournisseur: "CFAO Motors", montant: 350000000, dateSignature: "2023-04-01", dateEcheance: "2023-10-01", avancement: 100, status: "litige", projet: "PRJ-001" },
];

const typeConfig = {
  travaux: { label: "Travaux", className: "bg-primary/10 text-primary" },
  fournitures: { label: "Fournitures", className: "bg-info/10 text-info" },
  services: { label: "Services", className: "bg-accent/10 text-accent" },
  etudes: { label: "Études", className: "bg-warning/10 text-warning" },
};

const statusConfig = {
  en_cours: { label: "En cours", className: "bg-success/10 text-success", icon: Clock },
  termine: { label: "Terminé", className: "bg-info/10 text-info", icon: CheckCircle2 },
  en_attente: { label: "En attente", className: "bg-warning/10 text-warning", icon: Clock },
  litige: { label: "Litige", className: "bg-destructive/10 text-destructive", icon: AlertCircle },
};

const Marches = () => {
  const totalMontant = contracts.reduce((sum, c) => sum + c.montant, 0);
  const enCours = contracts.filter(c => c.status === 'en_cours').length;

  return (
    <AppLayout 
      title="Gestion des Marchés" 
      subtitle="Suivi des contrats et marchés publics"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{contracts.length}</p>
                  <p className="text-sm text-muted-foreground">Total marchés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Clock className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{enCours}</p>
                  <p className="text-sm text-muted-foreground">En cours</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <Building2 className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{(totalMontant / 1000000000).toFixed(1)} Mrd</p>
                  <p className="text-sm text-muted-foreground">Montant total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{contracts.filter(c => c.status === 'litige').length}</p>
                  <p className="text-sm text-muted-foreground">En litige</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher un marché..." className="pl-9" />
          </div>
          <Button variant="gradient">
            <Plus className="h-4 w-4" />
            Nouveau marché
          </Button>
        </div>

        {/* Contracts List */}
        <div className="space-y-4">
          {contracts.map((contract, index) => {
            const type = typeConfig[contract.type];
            const status = statusConfig[contract.status];
            const StatusIcon = status.icon;
            
            return (
              <Card 
                key={contract.id}
                className={cn(
                  "transition-all duration-200 hover:shadow-md animate-slide-up opacity-0",
                  `stagger-${Math.min(index + 1, 5)}`
                )}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm text-muted-foreground">{contract.reference}</span>
                        <Badge variant="secondary" className={type.className}>{type.label}</Badge>
                        <Badge variant="outline" className={status.className}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {status.label}
                        </Badge>
                      </div>
                      <h4 className="font-semibold">{contract.objet}</h4>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {contract.fournisseur}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {contract.dateSignature} → {contract.dateEcheance}
                        </span>
                        <span className="font-medium text-foreground">
                          {(contract.montant / 1000000).toLocaleString()} M FCFA
                        </span>
                      </div>
                    </div>
                    <div className="w-full lg:w-48 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Avancement</span>
                        <span className="font-medium">{contract.avancement}%</span>
                      </div>
                      <Progress value={contract.avancement} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default Marches;
