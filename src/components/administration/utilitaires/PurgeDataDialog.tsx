import { useState, type MouseEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  Trash2,
  ShieldAlert,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  FileText,
  FolderOpen,
  Users,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface PurgeDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PurgeStep = "warning" | "confirmation" | "password" | "executing" | "result";

interface PurgeResult {
  success: boolean;
  message: string;
  deletedCounts?: Record<string, number>;
  error?: string;
}

const CONFIRMATION_TEXT = "SUPPRIMER TOUTES LES DONNÉES";

const DATA_TO_DELETE = [
  { icon: FolderOpen, label: "Projets", description: "Tous les projets et leurs associations" },
  { icon: Users, label: "Bailleurs", description: "Tous les bailleurs de fonds" },
  { icon: FileText, label: "Conventions", description: "Toutes les conventions et rapports financiers" },
  { icon: Database, label: "Budgets", description: "Budgets, lignes budgétaires, transferts, alertes" },
  { icon: FileText, label: "Marchés", description: "Contrats, engagements, décomptes, garanties" },
  { icon: FileText, label: "Dépenses", description: "Dépenses et validations" },
  { icon: FileText, label: "Décaissements", description: "Décaissements et validations" },
  { icon: FileText, label: "Opérations de caisse", description: "Toutes les opérations de caisse" },
  { icon: FileText, label: "Écritures comptables", description: "Journal, lignes d'écritures" },
  { icon: FileText, label: "Immobilisations", description: "Actifs, amortissements, mouvements" },
  { icon: FileText, label: "Documents", description: "Tous les fichiers stockés" },
  { icon: AlertCircle, label: "Notifications", description: "Toutes les notifications" },
];

const DATA_PRESERVED = [
  { label: "Comptes utilisateurs", description: "Profils et authentification" },
  { label: "Rôles & permissions", description: "Configuration des accès" },
  { label: "Paramètres système", description: "Organisation, devises, pays, sites" },
  { label: "Plan comptable", description: "Structure des comptes" },
  { label: "Catégories de dépenses", description: "Nomenclature des catégories" },
  { label: "Exercices fiscaux", description: "Périodes comptables" },
];

export function PurgeDataDialog({ open, onOpenChange }: PurgeDataDialogProps) {
  const [step, setStep] = useState<PurgeStep>("warning");
  const [confirmationText, setConfirmationText] = useState("");
  const [password, setPassword] = useState("");
  const [includeLogs, setIncludeLogs] = useState(false);
  const [loadGoldenDataset, setLoadGoldenDataset] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<PurgeResult | null>(null);

  const resetDialog = () => {
    setStep("warning");
    setConfirmationText("");
    setPassword("");
    setIncludeLogs(false);
    setLoadGoldenDataset(false);
    setIsExecuting(false);
    setProgress(0);
    setResult(null);
  };

  const handleClose = () => {
    if (!isExecuting) {
      resetDialog();
      onOpenChange(false);
    }
  };

  const handleProceedToConfirmation = (e: MouseEvent) => {
    // Prevent Radix AlertDialogAction from auto-closing the dialog.
    // We want to transition to the next step instead.
    e.preventDefault();
    setStep("confirmation");
  };

  const handleProceedToPassword = () => {
    if (confirmationText !== CONFIRMATION_TEXT) {
      toast.error("Le texte de confirmation est incorrect");
      return;
    }
    setStep("password");
  };

  const handleExecutePurge = async () => {
    if (!password) {
      toast.error("Veuillez entrer votre mot de passe");
      return;
    }

    setStep("executing");
    setIsExecuting(true);
    setProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90));
      }, 500);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Session expirée. Veuillez vous reconnecter.");
      }

      const response = await supabase.functions.invoke("purge-all-data", {
        body: {
          password,
          includeLogs,
          loadGoldenDataset,
        },
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.error) {
        throw new Error(response.error.message || "Erreur lors de la purge");
      }

      const data = response.data as PurgeResult;

      if (!data.success) {
        throw new Error(data.error || "La purge a échoué");
      }

      setResult(data);
      setStep("result");
      
      // Show success notification
      toast.success("L'application a été réinitialisée avec succès", {
        duration: 10000,
        description: data.message,
      });

    } catch (error) {
      console.error("Purge error:", error);
      setResult({
        success: false,
        message: "",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      });
      setStep("result");
      toast.error("Erreur lors de la purge", {
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const renderWarningStep = () => (
    <AlertDialog
      open={step === "warning" && open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 text-destructive">
            <ShieldAlert className="h-8 w-8" />
            <AlertDialogTitle className="text-xl">
              ⚠️ Action critique et irréversible
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4 pt-4">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="font-semibold text-destructive mb-2">
                Vous êtes sur le point de supprimer TOUTES les données métier de l'application.
              </p>
              <p className="text-sm text-muted-foreground">
                Cette action est <strong>définitive et irréversible</strong>. Assurez-vous d'avoir effectué 
                une sauvegarde complète avant de procéder.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold text-destructive flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Données supprimées
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {DATA_TO_DELETE.slice(0, 6).map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <item.icon className="h-3 w-3" />
                      {item.label}
                    </li>
                  ))}
                  <li className="text-xs italic">...et plus encore</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-green-600 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Données préservées
                </h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {DATA_PRESERVED.map((item, i) => (
                    <li key={i}>✓ {item.label}</li>
                  ))}
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleProceedToConfirmation}
            className="bg-destructive hover:bg-destructive/90"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Je comprends, continuer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderConfirmationStep = () => (
    <Dialog open={step === "confirmation" && open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Lock className="h-5 w-5" />
            Confirmation de la purge
          </DialogTitle>
          <DialogDescription>
            Étape 2/3 : Saisissez le texte de confirmation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Pour confirmer, saisissez exactement le texte suivant :
            </p>
            <code className="block mt-2 p-2 bg-background rounded border text-center font-mono font-bold text-destructive">
              {CONFIRMATION_TEXT}
            </code>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">Texte de confirmation</Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Saisissez le texte ci-dessus..."
              className={
                confirmationText === CONFIRMATION_TEXT
                  ? "border-green-500 focus-visible:ring-green-500"
                  : ""
              }
            />
            {confirmationText && confirmationText !== CONFIRMATION_TEXT && (
              <p className="text-xs text-destructive">Le texte ne correspond pas</p>
            )}
            {confirmationText === CONFIRMATION_TEXT && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Texte confirmé
              </p>
            )}
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeLogs"
                checked={includeLogs}
                onCheckedChange={(checked) => setIncludeLogs(checked as boolean)}
              />
              <Label htmlFor="includeLogs" className="text-sm cursor-pointer">
                Inclure les logs d'audit (optionnel)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="loadGoldenDataset"
                checked={loadGoldenDataset}
                onCheckedChange={(checked) => setLoadGoldenDataset(checked as boolean)}
              />
              <Label htmlFor="loadGoldenDataset" className="text-sm cursor-pointer flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Charger le Golden Dataset après purge
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setStep("warning")}>
            Retour
          </Button>
          <Button
            variant="destructive"
            onClick={handleProceedToPassword}
            disabled={confirmationText !== CONFIRMATION_TEXT}
          >
            Continuer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderPasswordStep = () => (
    <Dialog open={step === "password" && open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Re-authentification requise
          </DialogTitle>
          <DialogDescription>
            Étape 3/3 : Confirmez votre identité
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Résumé de l'opération :</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Suppression de toutes les données métier</li>
              <li>• Suppression des fichiers stockés</li>
              {includeLogs && <li>• Suppression des logs d'audit</li>}
              {loadGoldenDataset && (
                <li className="text-amber-600">• Chargement du Golden Dataset après purge</li>
              )}
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe administrateur</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe..."
              autoComplete="current-password"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setStep("confirmation")}>
            Retour
          </Button>
          <Button
            variant="destructive"
            onClick={handleExecutePurge}
            disabled={!password}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Exécuter la purge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderExecutingStep = () => (
    <Dialog open={step === "executing" && open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-destructive" />
            Purge en cours...
          </DialogTitle>
          <DialogDescription>
            Ne fermez pas cette fenêtre
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <Progress value={progress} className="h-3" />
          <p className="text-center text-sm text-muted-foreground">
            {progress < 30 && "Suppression des documents..."}
            {progress >= 30 && progress < 50 && "Suppression des écritures comptables..."}
            {progress >= 50 && progress < 70 && "Suppression des budgets et conventions..."}
            {progress >= 70 && progress < 90 && "Suppression des projets et bailleurs..."}
            {progress >= 90 && "Finalisation..."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );

  const renderResultStep = () => (
    <Dialog open={step === "result" && open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {result?.success ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-600">Purge terminée avec succès</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="text-destructive">Erreur lors de la purge</span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {result?.success ? (
            <>
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-200">
                  {result.message}
                </p>
              </div>

              {result.deletedCounts && Object.keys(result.deletedCounts).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Détail des suppressions :</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(result.deletedCounts)
                      .filter(([, count]) => count > 0)
                      .map(([table, count]) => (
                        <div key={table} className="flex justify-between bg-muted/50 rounded px-2 py-1">
                          <span className="text-muted-foreground">{table}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p>L'application a été réinitialisée. Vous pouvez maintenant :</p>
                <ul className="mt-2 space-y-1">
                  <li>• Commencer une nouvelle configuration</li>
                  <li>• Importer de nouvelles données</li>
                  <li>• Effectuer des tests fonctionnels</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <p className="text-sm text-destructive">
                {result?.error || "Une erreur inconnue s'est produite"}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>
            {result?.success ? "Fermer" : "Fermer et réessayer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <>
      {renderWarningStep()}
      {renderConfirmationStep()}
      {renderPasswordStep()}
      {renderExecutingStep()}
      {renderResultStep()}
    </>
  );
}
