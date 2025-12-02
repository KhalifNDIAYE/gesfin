import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  Coins,
  Globe,
  MapPin,
  Building2,
  Ruler,
  FileText,
  GitBranch,
  Settings2
} from "lucide-react";
import { FiscalYearsTab } from "@/components/parametrage/FiscalYearsTab";
import { CurrenciesTab } from "@/components/parametrage/CurrenciesTab";
import { CountriesTab } from "@/components/parametrage/CountriesTab";
import { SitesTab } from "@/components/parametrage/SitesTab";
import { LocationsTab } from "@/components/parametrage/LocationsTab";
import { WorkUnitsTab } from "@/components/parametrage/WorkUnitsTab";
import { PlansTab } from "@/components/parametrage/PlansTab";
import { TrackingAxesTab } from "@/components/parametrage/TrackingAxesTab";
import { OrganizationTab } from "@/components/parametrage/OrganizationTab";

const tabs = [
  { value: "organisation", label: "Organisation", icon: Building2 },
  { value: "exercices", label: "Exercices", icon: Calendar },
  { value: "monnaies", label: "Monnaies", icon: Coins },
  { value: "pays", label: "Pays", icon: Globe },
  { value: "sites", label: "Sites", icon: MapPin },
  { value: "emplacements", label: "Emplacements", icon: MapPin },
  { value: "unites-oeuvre", label: "Unités d'œuvre", icon: Ruler },
  { value: "plans", label: "Plans", icon: FileText },
  { value: "axes-suivi", label: "Axes de suivi", icon: GitBranch },
];

const Parametrage = () => {
  return (
    <AppLayout 
      title="Paramétrage" 
      subtitle="Configuration des données de référence du système"
    >
      <div className="space-y-6">
        <Tabs defaultValue="organisation" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 bg-muted/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger 
                  key={tab.value} 
                  value={tab.value}
                  className="flex items-center gap-2 text-xs sm:text-sm data-[state=active]:bg-background"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="organisation">
            <OrganizationTab />
          </TabsContent>

          <TabsContent value="exercices">
            <FiscalYearsTab />
          </TabsContent>

          <TabsContent value="monnaies">
            <CurrenciesTab />
          </TabsContent>

          <TabsContent value="pays">
            <CountriesTab />
          </TabsContent>

          <TabsContent value="sites">
            <SitesTab />
          </TabsContent>

          <TabsContent value="emplacements">
            <LocationsTab />
          </TabsContent>

          <TabsContent value="unites-oeuvre">
            <WorkUnitsTab />
          </TabsContent>

          <TabsContent value="plans">
            <PlansTab />
          </TabsContent>

          <TabsContent value="axes-suivi">
            <TrackingAxesTab />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Parametrage;
