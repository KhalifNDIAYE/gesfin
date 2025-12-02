import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Projets from "./pages/Projets";
import Comptabilite from "./pages/Comptabilite";
// Old static pages removed - using dynamic pages from bailleurs/ and conventions/ folders
import Immobilisations from "./pages/Immobilisations";
import MouvementsPage from "./pages/immobilisations/MouvementsPage";
import AmortissementsPage from "./pages/immobilisations/AmortissementsPage";
import SortiesPage from "./pages/immobilisations/SortiesPage";
import RapprochementImmoPage from "./pages/immobilisations/RapprochementPage";
import MarchesPage from "./pages/marches/MarchesPage";
import ContractDetailPage from "./pages/marches/ContractDetailPage";
import Decaissements from "./pages/Decaissements";
import Utilisateurs from "./pages/Utilisateurs";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/projets" element={<ProtectedRoute><Projets /></ProtectedRoute>} />
            <Route path="/comptabilite" element={<ProtectedRoute><Comptabilite /></ProtectedRoute>} />
            <Route path="/comptabilite/depenses" element={<ProtectedRoute><DepensesPage /></ProtectedRoute>} />
            <Route path="/comptabilite/financements" element={<ProtectedRoute><FinancementsPage /></ProtectedRoute>} />
            <Route path="/comptabilite/decaissements" element={<ProtectedRoute><DecaissementsComptaPage /></ProtectedRoute>} />
            <Route path="/comptabilite/prises-en-charge" element={<ProtectedRoute><PrisesEnChargePage /></ProtectedRoute>} />
            <Route path="/comptabilite/tiers" element={<ProtectedRoute><TiersPage /></ProtectedRoute>} />
            <Route path="/comptabilite/grand-livre" element={<ProtectedRoute><GrandLivrePage /></ProtectedRoute>} />
            <Route path="/comptabilite/balances" element={<ProtectedRoute><BalancesPage /></ProtectedRoute>} />
            <Route path="/comptabilite/lettrage" element={<ProtectedRoute><LettragePage /></ProtectedRoute>} />
            <Route path="/comptabilite/rapprochement" element={<ProtectedRoute><RapprochementPage /></ProtectedRoute>} />
            <Route path="/comptabilite/caisse" element={<ProtectedRoute><CaissePage /></ProtectedRoute>} />
            <Route path="/comptabilite/echeances" element={<ProtectedRoute><EcheancesPage /></ProtectedRoute>} />
            <Route path="/comptabilite/a-nouveaux" element={<ProtectedRoute><ANouveauxPage /></ProtectedRoute>} />
            <Route path="/comptabilite/clotures" element={<ProtectedRoute><CloturesPage /></ProtectedRoute>} />
            <Route path="/comptabilite/editions" element={<ProtectedRoute><EditionsPage /></ProtectedRoute>} />
            {/* Comptabilité Analytique routes */}
            <Route path="/comptabilite/analytique/activite" element={<ProtectedRoute><AffectationActivitePage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/composante" element={<ProtectedRoute><AffectationComposantePage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/geographique" element={<ProtectedRoute><AffectationGeographiquePage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/repartition" element={<ProtectedRoute><RepartitionPage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/reimputation" element={<ProtectedRoute><ReimputationPage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/centres-couts" element={<ProtectedRoute><CentresCoutsPage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/analyse-projet" element={<ProtectedRoute><AnalyseProjetPage /></ProtectedRoute>} />
            <Route path="/comptabilite/analytique/synthese" element={<ProtectedRoute><SyntheseAnalytiquePage /></ProtectedRoute>} />
            {/* Budget routes */}
            <Route path="/budget" element={<ProtectedRoute><BudgetsPage /></ProtectedRoute>} />
            <Route path="/budget/:id" element={<ProtectedRoute><BudgetDetailPage /></ProtectedRoute>} />
            <Route path="/budget/dashboard" element={<ProtectedRoute><BudgetDashboardPage /></ProtectedRoute>} />
            <Route path="/budget/comparaison" element={<ProtectedRoute><BudgetComparisonPage /></ProtectedRoute>} />
            <Route path="/budget/alertes" element={<ProtectedRoute><BudgetAlertsPage /></ProtectedRoute>} />
            {/* Bailleurs & Conventions routes */}
            <Route path="/bailleurs" element={<ProtectedRoute><BailleursPage /></ProtectedRoute>} />
            <Route path="/bailleurs/:id" element={<ProtectedRoute><BailleurDetailPage /></ProtectedRoute>} />
            <Route path="/conventions" element={<ProtectedRoute><ConventionsPage /></ProtectedRoute>} />
            <Route path="/conventions/:id" element={<ProtectedRoute><ConventionDetailPage /></ProtectedRoute>} />
            <Route path="/immobilisations" element={<ProtectedRoute><Immobilisations /></ProtectedRoute>} />
            <Route path="/immobilisations/mouvements" element={<ProtectedRoute><MouvementsPage /></ProtectedRoute>} />
            <Route path="/immobilisations/amortissements" element={<ProtectedRoute><AmortissementsPage /></ProtectedRoute>} />
            <Route path="/immobilisations/sorties" element={<ProtectedRoute><SortiesPage /></ProtectedRoute>} />
            <Route path="/immobilisations/rapprochement" element={<ProtectedRoute><RapprochementImmoPage /></ProtectedRoute>} />
            <Route path="/marches" element={<ProtectedRoute><MarchesPage /></ProtectedRoute>} />
            <Route path="/marches/:id" element={<ProtectedRoute><ContractDetailPage /></ProtectedRoute>} />
            <Route path="/decaissements" element={<ProtectedRoute><Decaissements /></ProtectedRoute>} />
            {/* Rapports routes */}
            <Route path="/rapports" element={<ProtectedRoute><RapportsPage /></ProtectedRoute>} />
            <Route path="/rapports/bilan" element={<ProtectedRoute><BilanPage /></ProtectedRoute>} />
            <Route path="/rapports/resultat" element={<ProtectedRoute><ResultatPage /></ProtectedRoute>} />
            <Route path="/rapports/financement" element={<ProtectedRoute><FinancementPage /></ProtectedRoute>} />
            <Route path="/rapports/ratios" element={<ProtectedRoute><RatiosPage /></ProtectedRoute>} />
            <Route path="/rapports/dashboard" element={<ProtectedRoute><DashboardReportingPage /></ProtectedRoute>} />
            <Route path="/rapports/syscohada" element={<ProtectedRoute><SYSCOHADAPage /></ProtectedRoute>} />
            <Route path="/rapports/ifr" element={<ProtectedRoute><IFRPage /></ProtectedRoute>} />
            <Route path="/utilisateurs" element={<ProtectedRoute requiredRole="admin"><Utilisateurs /></ProtectedRoute>} />
            <Route path="/securite" element={<ProtectedRoute requiredRole="admin"><Securite /></ProtectedRoute>} />
            <Route path="/parametres" element={<ProtectedRoute requiredRole="admin"><Parametres /></ProtectedRoute>} />
            <Route path="/profil" element={<ProtectedRoute><Profil /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
