import { Link } from "react-router-dom";
import { ShieldX, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8 max-w-md">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-6">
            <ShieldX className="h-16 w-16 text-destructive" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Accès Refusé
          </h1>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Veuillez contacter votre administrateur si vous pensez qu'il s'agit d'une erreur.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link to="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
          <Button asChild>
            <Link to="#" onClick={() => window.history.back()} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Page précédente
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
