import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Play, CheckCircle, AlertCircle, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFiscalYears } from "@/hooks/useParametrage";

export default function ANouveauxPage() {
  const [selectedSourceYear, setSelectedSourceYear] = useState<string>("");
  const [selectedTargetYear, setSelectedTargetYear] = useState<string>("");

  const { data: fiscalYears } = useFiscalYears();

  const handleGenerateANouveaux = () => {
    console.log("Génération des à-nouveaux de", selectedSourceYear, "vers", selectedTargetYear);
  };

  return (
    <AppLayout 
      title="Génération des À-Nouveaux" 
      subtitle="Report des soldes d'un exercice à l'autre"
    >
      <div className="space-y-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              <div>
                <CardTitle>Paramètres de génération</CardTitle>
                <CardDescription>
                  Sélectionnez les exercices source et cible
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Exercice source (clôturé)</label>
                <Select
                  value={selectedSourceYear}
                  onValueChange={setSelectedSourceYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'exercice source" />
                  </SelectTrigger>
                  <SelectContent>
                    {fiscalYears?.filter(fy => !fy.is_open).map((fy) => (
                      <SelectItem key={fy.id} value={fy.id}>
                        {fy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Exercice cible</label>
                <Select
                  value={selectedTargetYear}
                  onValueChange={setSelectedTargetYear}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'exercice cible" />
                  </SelectTrigger>
                  <SelectContent>
                    {fiscalYears?.filter(fy => fy.is_open).map((fy) => (
                      <SelectItem key={fy.id} value={fy.id}>
                        {fy.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="gradient" 
                    disabled={!selectedSourceYear || !selectedTargetYear}
                  >
                    <Play className="h-4 w-4" />
                    Générer les à-nouveaux
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer la génération</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action va générer les écritures d'à-nouveaux à partir des soldes
                      de l'exercice source. Les à-nouveaux existants seront remplacés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleGenerateANouveaux}>
                      Confirmer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Preview / Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <div>
                  <CardTitle>Aperçu des à-nouveaux</CardTitle>
                  <CardDescription>Soldes à reporter</CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedSourceYear ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compte</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Solde Débiteur</TableHead>
                    <TableHead className="text-right">Solde Créditeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Sélectionnez un exercice source pour voir l'aperçu
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mb-4 opacity-50" />
                <p>Sélectionnez les exercices</p>
                <p className="text-sm">pour prévisualiser les à-nouveaux</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des générations</CardTitle>
            <CardDescription>Générations d'à-nouveaux effectuées</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Exercice source</TableHead>
                  <TableHead>Exercice cible</TableHead>
                  <TableHead>Nb comptes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Utilisateur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Aucune génération effectuée
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
