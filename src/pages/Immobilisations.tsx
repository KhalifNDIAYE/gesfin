import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Package,
  Car,
  Building,
  Monitor,
  Wrench,
  Download,
  QrCode
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Asset {
  id: string;
  code: string;
  designation: string;
  categorie: "vehicule" | "mobilier" | "informatique" | "batiment" | "equipement";
  dateAcquisition: string;
  valeurAcquisition: number;
  valeurNette: number;
  localisation: string;
  projet: string;
  status: "en_service" | "en_panne" | "reforme";
}

const assets: Asset[] = [
  { id: "1", code: "VEH-001", designation: "Toyota Land Cruiser 4x4", categorie: "vehicule", dateAcquisition: "2022-03-15", valeurAcquisition: 45000000, valeurNette: 36000000, localisation: "Garage Central", projet: "PRJ-001", status: "en_service" },
  { id: "2", code: "INF-001", designation: "Serveur Dell PowerEdge R740", categorie: "informatique", dateAcquisition: "2023-01-10", valeurAcquisition: 8500000, valeurNette: 7650000, localisation: "Salle Serveur", projet: "Administration", status: "en_service" },
  { id: "3", code: "MOB-001", designation: "Bureau direction complet", categorie: "mobilier", dateAcquisition: "2021-06-01", valeurAcquisition: 2500000, valeurNette: 1875000, localisation: "Bureau DG", projet: "Administration", status: "en_service" },
  { id: "4", code: "EQP-001", designation: "Groupe électrogène 100KVA", categorie: "equipement", dateAcquisition: "2022-09-20", valeurAcquisition: 25000000, valeurNette: 20000000, localisation: "Annexe technique", projet: "PRJ-002", status: "en_service" },
  { id: "5", code: "VEH-002", designation: "Mitsubishi L200", categorie: "vehicule", dateAcquisition: "2020-01-05", valeurAcquisition: 32000000, valeurNette: 16000000, localisation: "Garage Central", projet: "PRJ-003", status: "en_panne" },
  { id: "6", code: "INF-002", designation: "Ordinateurs portables (lot de 10)", categorie: "informatique", dateAcquisition: "2023-06-15", valeurAcquisition: 15000000, valeurNette: 13500000, localisation: "Pool informatique", projet: "PRJ-004", status: "en_service" },
];

const categorieConfig = {
  vehicule: { label: "Véhicule", icon: Car, color: "text-info" },
  mobilier: { label: "Mobilier", icon: Package, color: "text-warning" },
  informatique: { label: "Informatique", icon: Monitor, color: "text-primary" },
  batiment: { label: "Bâtiment", icon: Building, color: "text-success" },
  equipement: { label: "Équipement", icon: Wrench, color: "text-accent" },
};

const statusConfig = {
  en_service: { label: "En service", className: "bg-success/10 text-success" },
  en_panne: { label: "En panne", className: "bg-warning/10 text-warning" },
  reforme: { label: "Réformé", className: "bg-destructive/10 text-destructive" },
};

const Immobilisations = () => {
  const totalValeur = assets.reduce((sum, a) => sum + a.valeurAcquisition, 0);
  const totalVNC = assets.reduce((sum, a) => sum + a.valeurNette, 0);

  return (
    <AppLayout 
      title="Immobilisations" 
      subtitle="Gestion du patrimoine et des actifs"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{assets.length}</p>
                  <p className="text-sm text-muted-foreground">Total actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Building className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{(totalValeur / 1000000).toFixed(0)} M</p>
                  <p className="text-sm text-muted-foreground">Valeur brute</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <Monitor className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{(totalVNC / 1000000).toFixed(0)} M</p>
                  <p className="text-sm text-muted-foreground">Valeur nette comptable</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Wrench className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{assets.filter(a => a.status === 'en_panne').length}</p>
                  <p className="text-sm text-muted-foreground">En maintenance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Rechercher une immobilisation..." className="pl-9" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <QrCode className="h-4 w-4" />
              Scanner
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4" />
              Exporter
            </Button>
            <Button variant="gradient">
              <Plus className="h-4 w-4" />
              Ajouter un actif
            </Button>
          </div>
        </div>

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <CardTitle>Registre des Immobilisations</CardTitle>
            <CardDescription>Liste complète des actifs du patrimoine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Désignation</th>
                    <th>Catégorie</th>
                    <th>Acquisition</th>
                    <th className="text-right">Valeur brute</th>
                    <th className="text-right">VNC</th>
                    <th>Localisation</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => {
                    const cat = categorieConfig[asset.categorie];
                    const CatIcon = cat.icon;
                    const status = statusConfig[asset.status];
                    
                    return (
                      <tr key={asset.id}>
                        <td className="font-mono text-sm">{asset.code}</td>
                        <td className="font-medium">{asset.designation}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <CatIcon className={cn("h-4 w-4", cat.color)} />
                            <span className="text-sm">{cat.label}</span>
                          </div>
                        </td>
                        <td className="text-sm text-muted-foreground">{asset.dateAcquisition}</td>
                        <td className="text-right font-mono">{(asset.valeurAcquisition / 1000000).toFixed(1)} M</td>
                        <td className="text-right font-mono">{(asset.valeurNette / 1000000).toFixed(1)} M</td>
                        <td className="text-sm">{asset.localisation}</td>
                        <td>
                          <Badge variant="secondary" className={status.className}>
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

export default Immobilisations;
