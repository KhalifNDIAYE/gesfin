import { AppLayout } from "@/components/layout/AppLayout";
import { ThirdPartiesTab } from "@/components/comptabilite/ThirdPartiesTab";

export default function TiersPage() {
  return (
    <AppLayout 
      title="Gestion des Tiers" 
      subtitle="Comptabilité auxiliaire - Fournisseurs, clients, employés"
    >
      <div className="space-y-6">
        <ThirdPartiesTab />
      </div>
    </AppLayout>
  );
}
