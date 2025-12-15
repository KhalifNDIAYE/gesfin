import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityDashboardTab } from "@/components/security/SecurityDashboardTab";
import { ComplianceControlsTab } from "@/components/security/ComplianceControlsTab";
import { RGPDRegistryTab } from "@/components/security/RGPDRegistryTab";
import { SecurityIncidentsTab } from "@/components/security/SecurityIncidentsTab";
import { SecurityPoliciesTab } from "@/components/security/SecurityPoliciesTab";
import { SecurityAuditLogTab } from "@/components/security/SecurityAuditLogTab";
import { SecurityAlertsTab } from "@/components/security/SecurityAlertsTab";
import { 
  LayoutDashboard, 
  ShieldCheck, 
  FileText, 
  AlertTriangle, 
  ScrollText, 
  History,
  Bell
} from "lucide-react";

const SecurityCompliancePage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <AppLayout 
      title="Sécurité & Conformité" 
      subtitle="Pilotage de la sécurité et conformité réglementaire (SOC 2, HIPAA, RGPD, FedRAMP, ISO 27001)"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-flex">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Conformité</span>
          </TabsTrigger>
          <TabsTrigger value="rgpd" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">RGPD</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Incidents</span>
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-2">
            <ScrollText className="h-4 w-4" />
            <span className="hidden sm:inline">Politiques</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Audit</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alertes</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <SecurityDashboardTab />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceControlsTab />
        </TabsContent>

        <TabsContent value="rgpd">
          <RGPDRegistryTab />
        </TabsContent>

        <TabsContent value="incidents">
          <SecurityIncidentsTab />
        </TabsContent>

        <TabsContent value="policies">
          <SecurityPoliciesTab />
        </TabsContent>

        <TabsContent value="audit">
          <SecurityAuditLogTab />
        </TabsContent>

        <TabsContent value="alerts">
          <SecurityAlertsTab />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default SecurityCompliancePage;
