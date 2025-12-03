import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Building2,
  Globe,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  Download,
  Edit,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PermissionButton, PermissionGate, useModulePermissions } from "@/components/auth/PermissionButton";

interface Donor {
  id: string;
  name: string;
  acronym: string;
  type: "multilateral" | "bilateral" | "private" | "government";
  country: string;
  totalFunding: number;
  activeProjects: number;
  contact: {
    email: string;
    phone: string;
  };
  conventions: number;
}

const donors: Donor[] = [
  {
    id: "1",
    name: "Banque Mondiale",
    acronym: "BM",
    type: "multilateral",
    country: "International",
    totalFunding: 2500000000,
    activeProjects: 3,
    contact: { email: "info@worldbank.org", phone: "+1 202 473 1000" },
    conventions: 5
  },
  {
    id: "2",
    name: "Agence Française de Développement",
    acronym: "AFD",
    type: "bilateral",
    country: "France",
    totalFunding: 1800000000,
    activeProjects: 2,
    contact: { email: "contact@afd.fr", phone: "+33 1 53 44 31 31" },
    conventions: 3
  },
  {
    id: "3",
    name: "Banque Africaine de Développement",
    acronym: "BAD",
    type: "multilateral",
    country: "Côte d'Ivoire",
    totalFunding: 5000000000,
    activeProjects: 1,
    contact: { email: "afdb@afdb.org", phone: "+225 20 26 10 20" },
    conventions: 4
  },
  {
    id: "4",
    name: "United States Agency for International Development",
    acronym: "USAID",
    type: "bilateral",
    country: "États-Unis",
    totalFunding: 800000000,
    activeProjects: 2,
    contact: { email: "info@usaid.gov", phone: "+1 202 712 0000" },
    conventions: 2
  },
  {
    id: "5",
    name: "Union Européenne",
    acronym: "UE",
    type: "multilateral",
    country: "Europe",
    totalFunding: 600000000,
    activeProjects: 1,
    contact: { email: "delegation@eeas.europa.eu", phone: "+32 2 584 11 11" },
    conventions: 2
  },
];

const typeConfig = {
  multilateral: { label: "Multilatéral", className: "bg-primary/10 text-primary" },
  bilateral: { label: "Bilatéral", className: "bg-info/10 text-info" },
  private: { label: "Privé", className: "bg-accent/10 text-accent" },
  government: { label: "État", className: "bg-success/10 text-success" },
};

const Bailleurs = () => {
  const { canCreate, canUpdate, canDelete, canExport } = useModulePermissions('bailleurs');

  return (
    <AppLayout 
      title="Bailleurs de Fonds" 
      subtitle="Gestion des partenaires techniques et financiers"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bailleurs</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <FileText className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conventions Actives</p>
                  <p className="text-2xl font-bold">16</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <Globe className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Financement Total</p>
                  <p className="text-2xl font-bold">10.7 Mrd</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <FileText className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">En négociation</p>
                  <p className="text-2xl font-bold">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher un bailleur..." className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            {/* Export button - only visible if user has export permission */}
            <PermissionButton 
              module="bailleurs" 
              permission="export" 
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Exporter
            </PermissionButton>
            
            {/* Add button - only visible if user has create permission */}
            <PermissionButton 
              module="bailleurs" 
              permission="create" 
              variant="gradient"
            >
              <Plus className="h-4 w-4" />
              Ajouter un bailleur
            </PermissionButton>
          </div>
        </div>

        {/* Donors Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {donors.map((donor, index) => {
            const typeInfo = typeConfig[donor.type];
            
            return (
              <Card 
                key={donor.id}
                className={cn(
                  "group transition-all duration-300 hover:shadow-lg animate-slide-up opacity-0",
                  `stagger-${index + 1}`
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                        {donor.acronym}
                      </div>
                      <div>
                        <CardTitle className="text-base">{donor.name}</CardTitle>
                        <CardDescription>{donor.country}</CardDescription>
                      </div>
                    </div>
                    {/* Edit/Delete actions - only visible with appropriate permissions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <PermissionGate module="bailleurs" permission="update">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
                      <PermissionGate module="bailleurs" permission="delete">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>
                  <Badge variant="secondary" className={cn("w-fit mt-2", typeInfo.className)}>
                    {typeInfo.label}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Financement total</p>
                      <p className="text-lg font-semibold">{(donor.totalFunding / 1000000000).toFixed(1)} Mrd</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Projets actifs</p>
                      <p className="text-lg font-semibold">{donor.activeProjects}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Conventions</p>
                      <p className="text-lg font-semibold">{donor.conventions}</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-border pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{donor.contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{donor.contact.phone}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="h-4 w-4" />
                      Conventions
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <ExternalLink className="h-4 w-4" />
                      Détails
                    </Button>
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

export default Bailleurs;
