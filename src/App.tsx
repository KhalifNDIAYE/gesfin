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
import Bailleurs from "./pages/Bailleurs";
import Conventions from "./pages/Conventions";
import Immobilisations from "./pages/Immobilisations";
import Marches from "./pages/Marches";
import Decaissements from "./pages/Decaissements";
import Rapports from "./pages/Rapports";
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
            <Route path="/bailleurs" element={<ProtectedRoute><Bailleurs /></ProtectedRoute>} />
            <Route path="/conventions" element={<ProtectedRoute><Conventions /></ProtectedRoute>} />
            <Route path="/immobilisations" element={<ProtectedRoute><Immobilisations /></ProtectedRoute>} />
            <Route path="/marches" element={<ProtectedRoute><Marches /></ProtectedRoute>} />
            <Route path="/decaissements" element={<ProtectedRoute><Decaissements /></ProtectedRoute>} />
            <Route path="/rapports" element={<ProtectedRoute><Rapports /></ProtectedRoute>} />
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
