import { useEffect, useState } from 'react';
import { AlertTriangle, X, Bug, Eye } from 'lucide-react';
import { useLayoutValidation, LayoutRegressionError } from '@/hooks/useLayoutValidation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function LayoutRegressionAlert() {
  const { regressionErrors, lastValidation, getValidationHistory, clearHistory } = useLayoutValidation();
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Ne montrer qu'en mode développement
  if (!import.meta.env.DEV) {
    return null;
  }

  // Ne rien afficher si pas d'erreurs ou si dismissed
  if (regressionErrors.length === 0 || dismissed) {
    return null;
  }

  const criticalErrors = regressionErrors.filter(e => e.severity === 'critical');
  const warningErrors = regressionErrors.filter(e => e.severity === 'warning');

  const getSeverityColor = (severity: string) => {
    return severity === 'critical' ? 'destructive' : 'secondary';
  };

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'layout_missing':
        return '🏗️';
      case 'header_missing':
        return '📋';
      case 'sidebar_missing':
        return '📑';
      case 'content_empty':
        return '📄';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Alert variant="destructive" className="border-2 shadow-lg">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="flex items-center justify-between">
          <span>Régression Visuelle Détectée</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="space-y-2">
            <div className="flex gap-2">
              {criticalErrors.length > 0 && (
                <Badge variant="destructive">
                  {criticalErrors.length} critique{criticalErrors.length > 1 ? 's' : ''}
                </Badge>
              )}
              {warningErrors.length > 0 && (
                <Badge variant="secondary">
                  {warningErrors.length} avertissement{warningErrors.length > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="text-sm space-y-1 max-h-32 overflow-y-auto">
              {regressionErrors.slice(0, 3).map((error, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span>{getErrorIcon(error.type)}</span>
                  <span className="truncate">{error.message}</span>
                </div>
              ))}
              {regressionErrors.length > 3 && (
                <div className="text-muted-foreground">
                  +{regressionErrors.length - 3} autres erreurs...
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Rapport de Régression Visuelle</DialogTitle>
                    <DialogDescription>
                      Dernière validation: {lastValidation?.timestamp.toLocaleString('fr-FR')}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    {/* État actuel */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Page actuelle: {lastValidation?.pageName}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span>{lastValidation?.checks.hasAppLayout ? '✅' : '❌'}</span>
                          <span>AppLayout</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{lastValidation?.checks.hasHeader ? '✅' : '❌'}</span>
                          <span>Header</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{lastValidation?.checks.hasSidebar ? '✅' : '❌'}</span>
                          <span>Sidebar</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{lastValidation?.checks.hasMainContent ? '✅' : '❌'}</span>
                          <span>Main Content</span>
                        </div>
                      </div>
                    </div>

                    {/* Liste des erreurs */}
                    <div className="space-y-2">
                      <h4 className="font-semibold">Erreurs détectées ({regressionErrors.length})</h4>
                      {regressionErrors.map((error, index) => (
                        <div
                          key={index}
                          className={`border rounded p-3 ${
                            error.severity === 'critical' 
                              ? 'border-destructive bg-destructive/10' 
                              : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getSeverityColor(error.severity)}>
                              {error.severity}
                            </Badge>
                            <span className="font-medium">{error.type}</span>
                          </div>
                          <p className="text-sm">{error.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Chemin: {error.pagePath}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={clearHistory}>
                        Effacer l'historique
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                        Fermer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDismissed(true)}
              >
                Ignorer
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
