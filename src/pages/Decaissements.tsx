import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { 
  Plus, 
  Search, 
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Disbursement {
  id: string;
  reference: string;
  date: string;
  montant: number;
  type: "encaissement" | "decaissement";
  bailleur: string;
  projet: string;
  beneficiaire: string;
  status: "valide" | "en_attente" | "rejete";
  description: string;
}

const disbursements: Disbursement[] = [
  { id: "1", reference: "DEC-2024-001", date: "2024-01-15", montant: 250000000, type: "encaissement", bailleur: "Banque Mondiale", projet: "PRJ-001", beneficiaire: "Compte Projet", status: "valide", description: "Décaissement Tranche 2" },
  { id: "2", reference: "DEC-2024-002", date: "2024-01-14", montant: 45000000, type: "decaissement", bailleur: "AFD", projet: "PRJ-002", beneficiaire: "SOGEA-SATOM", status: "valide", description: "Paiement facture travaux" },
  { id: "3", reference: "DEC-2024-003", date: "2024-01-13", montant: 12500000, type: "decaissement", bailleur: "USAID", projet: "PRJ-004", beneficiaire: "Cabinet Conseil", status: "valide", description: "Honoraires consultants" },
  { id: "4", reference: "DEC-2024-004", date: "2024-01-12", montant: 180000000, type: "encaissement", bailleur: "BAD", projet: "PRJ-003", beneficiaire: "Compte Projet", status: "valide", description: "Subvention État" },
  { id: "5", reference: "DEC-2024-005", date: "2024-01-11", montant: 35000000, type: "decaissement", bailleur: "Banque Mondiale", projet: "PRJ-001", beneficiaire: "Fournisseur X", status: "en_attente", description: "Fournitures équipements" },
  { id: "6", reference: "DEC-2024-006", date: "2024-01-10", montant: 8500000, type: "decaissement", bailleur: "UE", projet: "PRJ-005", beneficiaire: "Prestataire Y", status: "rejete", description: "Services formation" },
];

const chartData = [
  { month: "Juil", encaissements: 320, decaissements: 180 },
  { month: "Août", encaissements: 450, decaissements: 220 },
  { month: "Sep", encaissements: 280, decaissements: 350 },
  { month: "Oct", encaissements: 520, decaissements: 280 },
  { month: "Nov", encaissements: 380, decaissements: 420 },
  { month: "Déc", encaissements: 600, decaissements: 380 },
  { month: "Jan", encaissements: 430, decaissements: 290 },
];

const statusConfig = {
  valide: { label: "Validé", className: "bg-success/10 text-success", icon: CheckCircle2 },
  en_attente: { label: "En attente", className: "bg-warning/10 text-warning", icon: Clock },
  rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive", icon: XCircle },
};

const Decaissements = () => {
  const totalEncaissements = disbursements.filter(d => d.type === 'encaissement').reduce((sum, d) => sum + d.montant, 0);
  const totalDecaissements = disbursements.filter(d => d.type === 'decaissement').reduce((sum, d) => sum + d.montant, 0);

  return (
    <AppLayout 
      title="Décaissements" 
      subtitle="Suivi des flux financiers"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <ArrowDownLeft className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">{(totalEncaissements / 1000000).toFixed(0)} M</p>
                  <p className="text-sm text-muted-foreground">Encaissements</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <ArrowUpRight className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{(totalDecaissements / 1000000).toFixed(0)} M</p>
                  <p className="text-sm text-muted-foreground">Décaissements</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{disbursements.filter(d => d.status === 'en_attente').length}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <CheckCircle2 className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{((totalEncaissements - totalDecaissements) / 1000000).toFixed(0)} M</p>
                  <p className="text-sm text-muted-foreground">Solde période</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des flux</CardTitle>
            <CardDescription>Encaissements et décaissements (en millions FCFA)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorEnc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area type="monotone" dataKey="encaissements" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorEnc)" name="Encaissements" />
                <Area type="monotone" dataKey="decaissements" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorDec)" name="Décaissements" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button variant="gradient">
              <Plus className="h-4 w-4" />
              Nouveau mouvement
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mouvements récents</CardTitle>
            <CardDescription>Historique des encaissements et décaissements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Bailleur/Projet</th>
                    <th>Bénéficiaire</th>
                    <th className="text-right">Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {disbursements.map((d) => {
                    const status = statusConfig[d.status];
                    const StatusIcon = status.icon;
                    
                    return (
                      <tr key={d.id}>
                        <td className="font-mono text-sm">{d.reference}</td>
                        <td className="text-sm text-muted-foreground">{d.date}</td>
                        <td>
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full",
                            d.type === 'encaissement' ? "bg-success/10" : "bg-muted"
                          )}>
                            {d.type === 'encaissement' ? (
                              <ArrowDownLeft className="h-4 w-4 text-success" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </td>
                        <td className="font-medium">{d.description}</td>
                        <td className="text-sm">
                          <div>{d.bailleur}</div>
                          <div className="text-muted-foreground">{d.projet}</div>
                        </td>
                        <td className="text-sm">{d.beneficiaire}</td>
                        <td className={cn(
                          "text-right font-mono font-medium",
                          d.type === 'encaissement' && "text-success"
                        )}>
                          {d.type === 'encaissement' ? '+' : '-'}{(d.montant / 1000000).toFixed(1)} M
                        </td>
                        <td>
                          <Badge variant="secondary" className={status.className}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Decaissements;
