import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SessionTimeoutProvider } from "@/components/auth/SessionTimeoutProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AccessDenied from "./pages/AccessDenied";
import ProjetsPage from "./pages/projets/ProjetsPage";
import ProjetDetailPage from "./pages/projets/ProjetDetailPage";
import Comptabilite from "./pages/Comptabilite";
// Old static pages removed - using dynamic pages from bailleurs/ and conventions/ folders
import Immobilisations from "./pages/Immobilisations";
import MouvementsPage from "./pages/immobilisations/MouvementsPage";
import AmortissementsPage from "./pages/immobilisations/AmortissementsPage";
import SortiesPage from "./pages/immobilisations/SortiesPage";
import RapprochementImmoPage from "./pages/immobilisations/RapprochementPage";
import MarchesPage from "./pages/marches/MarchesPage";
import ContractDetailPage from "./pages/marches/ContractDetailPage";
import Utilisateurs from "./pages/Utilisateurs";

// Decaissements pages
import DecaissementsPage from "./pages/decaissements/DecaissementsPage";
import SuiviProjetPage from "./pages/decaissements/SuiviProjetPage";
import SuiviBailleurPage from "./pages/decaissements/SuiviBailleurPage";
import SuiviBudgetPage from "./pages/decaissements/SuiviBudgetPage";
import MonitoringDashboardPage from "./pages/decaissements/MonitoringDashboardPage";
import Securite from "./pages/Securite";
import Parametres from "./pages/Parametrage";
import Profil from "./pages/Profil";
import NotFound from "./pages/NotFound";

// Comptabilité sub-pages
import DepensesPage from "./pages/comptabilite/DepensesPage";
import FinancementsPage from "./pages/comptabilite/FinancementsPage";
import DecaissementsComptaPage from "./pages/comptabilite/DecaissementsComptaPage";
import PrisesEnChargePage from "./pages/comptabilite/PrisesEnChargePage";
import TiersPage from "./pages/comptabilite/TiersPage";
import GrandLivrePage from "./pages/comptabilite/GrandLivrePage";
import BalancesPage from "./pages/comptabilite/BalancesPage";
import LettragePage from "./pages/comptabilite/LettragePage";
import RapprochementPage from "./pages/comptabilite/RapprochementPage";
import CaissePage from "./pages/comptabilite/CaissePage";
import EcheancesPage from "./pages/comptabilite/EcheancesPage";
import ANouveauxPage from "./pages/comptabilite/ANouveauxPage";
import CloturesPage from "./pages/comptabilite/CloturesPage";
import EditionsPage from "./pages/comptabilite/EditionsPage";

// Comptabilité Analytique sub-pages
import AffectationActivitePage from "./pages/comptabilite/analytique/AffectationActivitePage";
import AffectationComposantePage from "./pages/comptabilite/analytique/AffectationComposantePage";
import AffectationGeographiquePage from "./pages/comptabilite/analytique/AffectationGeographiquePage";
import RepartitionPage from "./pages/comptabilite/analytique/RepartitionPage";
import ReimputationPage from "./pages/comptabilite/analytique/ReimputationPage";
import CentresCoutsPage from "./pages/comptabilite/analytique/CentresCoutsPage";
import AnalyseProjetPage from "./pages/comptabilite/analytique/AnalyseProjetPage";
import SyntheseAnalytiquePage from "./pages/comptabilite/analytique/SyntheseAnalytiquePage";

// Budget pages
import BudgetsPage from "./pages/budget/BudgetsPage";
import BudgetDetailPage from "./pages/budget/BudgetDetailPage";
import BudgetDashboardPage from "./pages/budget/BudgetDashboardPage";
import BudgetComparisonPage from "./pages/budget/BudgetComparisonPage";
import BudgetAlertsPage from "./pages/budget/BudgetAlertsPage";

// Bailleurs & Conventions pages
import BailleursPage from "./pages/bailleurs/BailleursPage";
import BailleurDetailPage from "./pages/bailleurs/BailleurDetailPage";
import ConventionsPage from "./pages/conventions/ConventionsPage";
import ConventionDetailPage from "./pages/conventions/ConventionDetailPage";

// Rapports pages
import RapportsPage from "./pages/rapports/RapportsPage";
import BilanPage from "./pages/rapports/BilanPage";
import ResultatPage from "./pages/rapports/ResultatPage";
import FinancementPage from "./pages/rapports/FinancementPage";
import RatiosPage from "./pages/rapports/RatiosPage";
import DashboardReportingPage from "./pages/rapports/DashboardReportingPage";
import SYSCOHADAPage from "./pages/rapports/SYSCOHADAPage";
import IFRPage from "./pages/rapports/IFRPage";
import RisquesAlertesPage from "./pages/rapports/RisquesAlertesPage";

// Administration pages
import UtilitairesPage from "./pages/administration/UtilitairesPage";
import BlockedActionsPage from "./pages/administration/BlockedActionsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SessionTimeoutProvider timeoutMinutes={30}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/acces-refuse" element={<AccessDenied />} />
            
            {/* Dashboard - accessible to all authenticated users */}
            <Route path="/" element={<ProtectedRoute requiredModule="dashboard"><Index /></ProtectedRoute>} />
            
            {/* Projets */}
            <Route path="/projets" element={<ProtectedRoute requiredModule="projets"><ProjetsPage /></ProtectedRoute>} />
            <Route path="/projets/:id" element={<ProtectedRoute requiredModule="projets"><ProjetDetailPage /></ProtectedRoute>} />
            
            {/* Comptabilité Générale */}
            <Route path="/comptabilite" element={<ProtectedRoute requiredModule="comptabilite"><Comptabilite /></ProtectedRoute>} />
            <Route path="/comptabilite/depenses" element={<ProtectedRoute requiredModule="comptabilite"><DepensesPage /></ProtectedRoute>} />
            <Route path="/comptabilite/financements" element={<ProtectedRoute requiredModule="comptabilite"><FinancementsPage /></ProtectedRoute>} />
            <Route path="/comptabilite/decaissements" element={<ProtectedRoute requiredModule="comptabilite"><DecaissementsComptaPage /></ProtectedRoute>} />
            <Route path="/comptabilite/prises-en-charge" element={<ProtectedRoute requiredModule="comptabilite"><PrisesEnChargePage /></ProtectedRoute>} />
            <Route path="/comptabilite/tiers" element={<ProtectedRoute requiredModule="comptabilite"><TiersPage /></ProtectedRoute>} />
            <Route path="/comptabilite/grand-livre" element={<ProtectedRoute requiredModule="comptabilite"><GrandLivrePage /></ProtectedRoute>} />
            <Route path="/comptabilite/balances" element={<ProtectedRoute requiredModule="comptabilite"><BalancesPage /></ProtectedRoute>} />
            <Route path="/comptabilite/lettrage" element={<ProtectedRoute requiredModule="comptabilite"><LettragePage /></ProtectedRoute>} />
            <Route path="/comptabilite/rapprochement" element={<ProtectedRoute requiredModule="comptabilite"><RapprochementPage /></ProtectedRoute>} />
            <Route path="/comptabilite/caisse" element={<ProtectedRoute requiredModule="comptabilite"><CaissePage /></ProtectedRoute>} />
            <Route path="/comptabilite/echeances" element={<ProtectedRoute requiredModule="comptabilite"><EcheancesPage /></ProtectedRoute>} />
            <Route path="/comptabilite/a-nouveaux" element={<ProtectedRoute requiredModule="comptabilite"><ANouveauxPage /></ProtectedRoute>} />
            <Route path="/comptabilite/clotures" element={<ProtectedRoute requiredModule="comptabilite"><CloturesPage /></ProtectedRoute>} />
            <Route path="/comptabilite/editions" element={<ProtectedRoute requiredModule="comptabilite"><EditionsPage /></ProtectedRoute>} />
            
            {/* Comptabilité Analytique */}
            <Route path="/comptabilite/analytique/activite" element={<ProtectedRoute requiredModule="comptabilite"><AffectationActivitePage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/composante" element={<ProtectedRoute requiredModule="comptabilite"><AffectationComposantePage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/geographique" element={<ProtectedRoute requiredModule="comptabilite"><AffectationGeographiquePage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/repartition" element={<ProtectedRoute requiredModule="comptabilite"><RepartitionPage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/reimputation" element={<ProtectedRoute requiredModule="comptabilite"><ReimputationPage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/centres-couts" element={<ProtectedRoute requiredModule="comptabilite"><CentresCoutsPage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/analyse-projet" element={<ProtectedRoute requiredModule="comptabilite"><AnalyseProjetPage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/synthese" element={<ProtectedRoute requiredModule="comptabilite"><SyntheseAnalytiquePage /></ProtectedRoute>} />
            
            {/* Budget (uses comptabilite module) */}
            <Route path="/budget" element={<ProtectedRoute requiredModule="comptabilite"><BudgetsPage /></ProtectedRoute>} />
            <Route path="/budget/:id" element={<ProtectedRoute requiredModule="comptabilite"><BudgetDetailPage /></ProtectedRoute>} />
            <Route path="/budget/dashboard" element={<ProtectedRoute requiredModule="comptabilite"><BudgetDashboardPage /></ProtectedRoute>} />
            <Route path="/budget/comparaison" element={<ProtectedRoute requiredModule="comptabilite"><BudgetComparisonPage /></ProtectedRoute>} />
            <Route path="/budget/alertes" element={<ProtectedRoute requiredModule="comptabilite"><BudgetAlertsPage /></ProtectedRoute>} />
            
            {/* Bailleurs */}
            <Route path="/bailleurs" element={<ProtectedRoute requiredModule="bailleurs"><BailleursPage /></ProtectedRoute>} />
            <Route path="/bailleurs/:id" element={<ProtectedRoute requiredModule="bailleurs"><BailleurDetailPage /></ProtectedRoute>} />
            
            {/* Conventions */}
            <Route path="/conventions" element={<ProtectedRoute requiredModule="conventions"><ConventionsPage /></ProtectedRoute>} />
            <Route path="/conventions/:id" element={<ProtectedRoute requiredModule="conventions"><ConventionDetailPage /></ProtectedRoute>} />
            
            {/* Immobilisations */}
            <Route path="/immobilisations" element={<ProtectedRoute requiredModule="immobilisations"><Immobilisations /></ProtectedRoute>} />
            <Route path="/immobilisations/mouvements" element={<ProtectedRoute requiredModule="immobilisations"><MouvementsPage /></ProtectedRoute>} />
            <Route path="/immobilisations/amortissements" element={<ProtectedRoute requiredModule="immobilisations"><AmortissementsPage /></ProtectedRoute>} />
            <Route path="/immobilisations/sorties" element={<ProtectedRoute requiredModule="immobilisations"><SortiesPage /></ProtectedRoute>} />
            <Route path="/immobilisations/rapprochement" element={<ProtectedRoute requiredModule="immobilisations"><RapprochementImmoPage /></ProtectedRoute>} />
            
            {/* Marchés */}
            <Route path="/marches" element={<ProtectedRoute requiredModule="marches"><MarchesPage /></ProtectedRoute>} />
            <Route path="/marches/:id" element={<ProtectedRoute requiredModule="marches"><ContractDetailPage /></ProtectedRoute>} />
            
            {/* Décaissements */}
            <Route path="/decaissements" element={<ProtectedRoute requiredModule="decaissements"><DecaissementsPage /></ProtectedRoute>} />
            <Route path="/decaissements/projet" element={<ProtectedRoute requiredModule="decaissements"><SuiviProjetPage /></ProtectedRoute>} />
            <Route path="/decaissements/bailleur" element={<ProtectedRoute requiredModule="decaissements"><SuiviBailleurPage /></ProtectedRoute>} />
            <Route path="/decaissements/budget" element={<ProtectedRoute requiredModule="decaissements"><SuiviBudgetPage /></ProtectedRoute>} />
            <Route path="/decaissements/monitoring" element={<ProtectedRoute requiredModule="decaissements"><MonitoringDashboardPage /></ProtectedRoute>} />
            
            {/* Rapports */}
            <Route path="/rapports" element={<ProtectedRoute requiredModule="rapports"><RapportsPage /></ProtectedRoute>} />
            <Route path="/rapports/bilan" element={<ProtectedRoute requiredModule="rapports"><BilanPage /></ProtectedRoute>} />
            <Route path="/rapports/resultat" element={<ProtectedRoute requiredModule="rapports"><ResultatPage /></ProtectedRoute>} />
            <Route path="/rapports/financement" element={<ProtectedRoute requiredModule="rapports"><FinancementPage /></ProtectedRoute>} />
            <Route path="/rapports/ratios" element={<ProtectedRoute requiredModule="rapports"><RatiosPage /></ProtectedRoute>} />
            <Route path="/rapports/dashboard" element={<ProtectedRoute requiredModule="rapports"><DashboardReportingPage /></ProtectedRoute>} />
            <Route path="/rapports/syscohada" element={<ProtectedRoute requiredModule="rapports"><SYSCOHADAPage /></ProtectedRoute>} />
            <Route path="/rapports/ifr" element={<ProtectedRoute requiredModule="rapports"><IFRPage /></ProtectedRoute>} />
            <Route path="/rapports/risques-alertes" element={<ProtectedRoute requiredModule="rapports"><RisquesAlertesPage /></ProtectedRoute>} />
            
            {/* Administration - ADMIN ONLY */}
            <Route path="/utilisateurs" element={<ProtectedRoute adminOnly><Utilisateurs /></ProtectedRoute>} />
            <Route path="/securite" element={<ProtectedRoute adminOnly><Securite /></ProtectedRoute>} />
            <Route path="/securite/tentatives-bloquees" element={<ProtectedRoute adminOnly><BlockedActionsPage /></ProtectedRoute>} />
            <Route path="/parametres" element={<ProtectedRoute adminOnly><Parametres /></ProtectedRoute>} />
            <Route path="/utilitaires" element={<ProtectedRoute adminOnly><UtilitairesPage /></ProtectedRoute>} />
            
            {/* Profil - accessible to all authenticated users */}
            <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          </SessionTimeoutProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
