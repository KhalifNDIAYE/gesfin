import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  Search, 
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PermissionButton, PermissionGate, useModulePermissions } from "@/components/auth/PermissionButton";

interface Convention {
  id: string;
  reference: string;
  title: string;
  bailleur: string;
  projet: string;
  dateSignature: string;
  dateExpiration: string;
  montant: number;
  decaisse: number;
  status: "active" | "expiring" | "expired" | "draft";
}

const conventions: Convention[] = [
  {
    id: "1",
    reference: "CONV-BM-2022-001",
    title: "Accord de financement Programme Eau Potable",
    bailleur: "Banque Mondiale",
    projet: "Programme Eau Potable Rural",
    dateSignature: "2022-01-15",
    dateExpiration: "2025-12-31",
    montant: 2500000000,
    decaisse: 1875000000,
    status: "active"
  },
  {
    id: "2",
    reference: "CONV-AFD-2023-001",
    title: "Convention de prêt Électrification",
    bailleur: "AFD",
    projet: "Électrification Villages",
    dateSignature: "2023-03-01",
    dateExpiration: "2024-02-15",
    montant: 1800000000,
    decaisse: 900000000,
    status: "expiring"
  },
  {
    id: "3",
    reference: "CONV-BAD-2020-002",
    title: "Don Routes Nationales Phase II",
    bailleur: "BAD",
    projet: "Routes Nationales Phase II",
    dateSignature: "2020-06-01",
    dateExpiration: "2023-12-31",
    montant: 5000000000,
    decaisse: 4750000000,
    status: "expired"
  },
  {
    id: "4",
    reference: "CONV-USAID-2023-001",
    title: "Accord de coopération Santé",
    bailleur: "USAID",
    projet: "Santé Communautaire",
    dateSignature: "2023-09-01",
    dateExpiration: "2027-08-31",
    montant: 800000000,
    decaisse: 240000000,
    status: "active"
  },
  {
    id: "5",
    reference: "CONV-UE-2024-001",
    title: "Subvention Formation Professionnelle",
    bailleur: "UE",
    projet: "Formation Professionnelle",
    dateSignature: "2024-01-01",
    dateExpiration: "2028-12-31",
    montant: 600000000,
    decaisse: 0,
    status: "draft"
  },
];

const statusConfig = {
  active: { 
    label: "Active", 
    className: "bg-success/10 text-success border-success/20",
    icon: CheckCircle2
  },
  expiring: { 
    label: "Expire bientôt", 
    className: "bg-warning/10 text-warning border-warning/20",
    icon: AlertTriangle
  },
  expired: { 
    label: "Expirée", 
    className: "bg-destructive/10 text-destructive border-destructive/20",
    icon: Clock
  },
  draft: { 
    label: "Brouillon", 
    className: "bg-muted text-muted-foreground",
    icon: FileText
  },
};

const Conventions = () => {
  const { canCreate, canUpdate, canDelete, canExport } = useModulePermissions('conventions');

  return (
    <AppLayout 
      title="Conventions" 
      subtitle="Gestion des accords de financement"
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-sm text-muted-foreground">Actives</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">2</p>
                  <p className="text-sm text-muted-foreground">Expirent bientôt</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">5</p>
                  <p className="text-sm text-muted-foreground">Expirées</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <FileText className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-sm text-muted-foreground">En négociation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher une convention..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            <PermissionButton module="conventions" permission="export" variant="outline">
              <Download className="h-4 w-4" />
              Exporter
            </PermissionButton>
            <PermissionButton module="conventions" permission="create" variant="gradient">
              <Plus className="h-4 w-4" />
              Nouvelle convention
            </PermissionButton>
          </div>
        </div>

        {/* Conventions List */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des Conventions</CardTitle>
            <CardDescription>Accords de financement avec les bailleurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {conventions.map((conv, index) => {
                const status = statusConfig[conv.status];
                const StatusIcon = status.icon;
                const percentage = (conv.decaisse / conv.montant) * 100;
                
                return (
                  <div 
                    key={conv.id}
                    className={cn(
                      "group rounded-lg border border-border p-4 transition-all duration-200 hover:bg-muted/50 animate-slide-up opacity-0",
                      `stagger-${index + 1}`
                    )}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={status.className}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {status.label}
                          </Badge>
                          <span className="font-mono text-sm text-muted-foreground">{conv.reference}</span>
                        </div>
                        <h4 className="font-semibold">{conv.title}</h4>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          <span>{conv.bailleur}</span>
                          <span>•</span>
                          <span>{conv.projet}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {conv.dateSignature} → {conv.dateExpiration}
                          </span>
                        </div>
                      </div>
                      <div className="w-full lg:w-64 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Décaissement</span>
                          <span className="font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{(conv.decaisse / 1000000).toLocaleString()} M</span>
                          <span>{(conv.montant / 1000000).toLocaleString()} M FCFA</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          Voir détails
                        </Button>
                        <PermissionGate module="conventions" permission="update">
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate module="conventions" permission="delete">
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Conventions;
