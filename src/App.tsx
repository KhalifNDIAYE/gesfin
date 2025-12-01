import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
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
import Parametres from "./pages/Parametres";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/projets" element={<Projets />} />
          <Route path="/comptabilite" element={<Comptabilite />} />
          <Route path="/bailleurs" element={<Bailleurs />} />
          <Route path="/conventions" element={<Conventions />} />
          <Route path="/immobilisations" element={<Immobilisations />} />
          <Route path="/marches" element={<Marches />} />
          <Route path="/decaissements" element={<Decaissements />} />
          <Route path="/rapports" element={<Rapports />} />
          <Route path="/utilisateurs" element={<Utilisateurs />} />
          <Route path="/securite" element={<Securite />} />
          <Route path="/parametres" element={<Parametres />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
