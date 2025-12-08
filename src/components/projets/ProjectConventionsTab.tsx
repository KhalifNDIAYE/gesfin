import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, 
  FileSignature, 
  Eye, 
  Trash2, 
  Loader2,
  Building2
} from "lucide-react";
import { useProjectConventions, useAddProjectConvention, useRemoveProjectConvention, useAvailableConventions } from "@/hooks/useProjectConventions";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
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

interface ProjectConventionsTabProps {
  projectId: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
  active: { label: "En cours", className: "bg-success/10 text-success" },
  en_cours: { label: "En cours", className: "bg-success/10 text-success" },
  expired: { label: "Expiré", className: "bg-destructive/10 text-destructive" },
  closed: { label: "Clôturé", className: "bg-muted text-muted-foreground" },
};

export function ProjectConventionsTab({ projectId }: ProjectConventionsTabProps) {
  const navigate = useNavigate();
  const { data: conventions = [], isLoading } = useProjectConventions(projectId);
  const { data: availableConventions = [] } = useAvailableConventions(projectId);
  const addConvention = useAddProjectConvention();
  const removeConvention = useRemoveProjectConvention();
  const { canAccess } = usePermissions();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedConventionId, setSelectedConventionId] = useState<string>("");
  const [conventionToDelete, setConventionToDelete] = useState<string | null>(null);

  const canEdit = canAccess('projets', 'update');
  const canDelete = canAccess('projets', 'delete');

  const handleAdd = async () => {
    if (!selectedConventionId) return;
    await addConvention.mutateAsync({ projectId, conventionId: selectedConventionId });
    setShowAddDialog(false);
    setSelectedConventionId("");
  };

  const handleRemove = async () => {
    if (!conventionToDelete) return;
    await removeConvention.mutateAsync({ id: conventionToDelete, projectId });
    setConventionToDelete(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Conventions du projet
          </CardTitle>
          {canEdit && (
            <Button size="sm" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {conventions.length > 0 ? (
            <div className="space-y-4">
              {conventions.map((pc) => {
                const conv = pc.convention;
                if (!conv) return null;
                
                const status = statusConfig[conv.status] || statusConfig.draft;
                const executionRate = conv.total_amount > 0 
                  ? (conv.disbursed_amount / conv.total_amount) * 100 
                  : 0;

                return (
                  <div key={pc.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/50">
                          <FileSignature className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{conv.name}</span>
                            <Badge variant="outline" className="text-xs">{conv.code}</Badge>
                          </div>
                          {conv.bailleur && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {conv.bailleur.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={status.className}>{status.label}</Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => navigate(`/conventions/${conv.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canDelete && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setConventionToDelete(pc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Montant total</p>
                        <p className="font-medium">
                          {(conv.total_amount / 1000000).toLocaleString('fr-FR')} M
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Décaissé</p>
                        <p className="font-medium text-success">
                          {(conv.disbursed_amount / 1000000).toLocaleString('fr-FR')} M
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Restant</p>
                        <p className="font-medium text-warning">
                          {(conv.remaining_amount / 1000000).toLocaleString('fr-FR')} M
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taux d'exécution</span>
                        <span>{executionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={executionRate} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune convention associée à ce projet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add Convention Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une convention</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sélectionner une convention</label>
              <Select value={selectedConventionId} onValueChange={setSelectedConventionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une convention..." />
                </SelectTrigger>
                <SelectContent>
                  {availableConventions.map((conv: any) => (
                    <SelectItem key={conv.id} value={conv.id}>
                      {conv.code} - {conv.name}
                      {conv.bailleur && ` (${conv.bailleur.short_name || conv.bailleur.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableConventions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucune convention disponible à ajouter
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleAdd} 
                disabled={!selectedConventionId || addConvention.isPending}
              >
                {addConvention.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!conventionToDelete} onOpenChange={() => setConventionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer la convention ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va retirer la convention du projet. La convention elle-même ne sera pas supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground">
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
