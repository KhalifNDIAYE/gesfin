import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lock, Unlock, Calendar, CheckCircle, AlertTriangle, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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

const MONTHS = [
  { value: "01", label: "Janvier" },
  { value: "02", label: "Février" },
  { value: "03", label: "Mars" },
  { value: "04", label: "Avril" },
  { value: "05", label: "Mai" },
  { value: "06", label: "Juin" },
  { value: "07", label: "Juillet" },
  { value: "08", label: "Août" },
  { value: "09", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
];

export default function CloturesPage() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find((fy) => fy.is_current);

  const handleCloseMonth = () => {
    // TODO: Implement month closing logic
  };

  const handleCloseYear = () => {
    // TODO: Implement year closing logic
  };

  return (
    <AppLayout title="Clôtures Comptables" subtitle="Clôture mensuelle et annuelle des exercices">
      <div className="space-y-6">
        <Tabs defaultValue="mensuelle" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mensuelle">Clôture Mensuelle</TabsTrigger>
            <TabsTrigger value="annuelle">Clôture Annuelle</TabsTrigger>
          </TabsList>

          <TabsContent value="mensuelle" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <div>
                    <CardTitle>Clôture Mensuelle</CardTitle>
                    <CardDescription>Verrouillage des écritures d'un mois</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Exercice</label>
                    <Select
                      value={selectedFiscalYear || currentFiscalYear?.id || ""}
                      onValueChange={setSelectedFiscalYear}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {fiscalYears?.map((fy) => (
                          <SelectItem key={fy.id} value={fy.id}>
                            {fy.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mois à clôturer</label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner le mois" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Monthly Status Grid */}
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2 pt-4">
                  {MONTHS.map((month) => (
                    <div key={month.value} className="flex flex-col items-center p-3 rounded-lg border bg-card">
                      <span className="text-xs font-medium">{month.label.slice(0, 9)}</span>
                      <Badge variant="secondary" className="mt-1">
                        Ouvert
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="gradient" disabled={!selectedMonth}>
                        <Lock className="h-4 w-4" />
                        Clôturer le mois
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la clôture mensuelle</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action va verrouiller toutes les écritures du mois sélectionné. Aucune modification ne
                          sera possible après la clôture.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCloseMonth}>Confirmer la clôture</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="annuelle" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  <div>
                    <CardTitle>Clôture Annuelle</CardTitle>
                    <CardDescription>Clôture définitive de l'exercice</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Exercice à clôturer</label>
                  <Select value={selectedFiscalYear || ""} onValueChange={setSelectedFiscalYear}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Sélectionner l'exercice" />
                    </SelectTrigger>
                    <SelectContent>
                      {fiscalYears
                        ?.filter((fy) => fy.is_open)
                        .map((fy) => (
                          <SelectItem key={fy.id} value={fy.id}>
                            {fy.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Checklist */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-medium">Vérifications avant clôture</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Tous les mois sont clôturés</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Balance équilibrée</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <span>Écritures en brouillon: 0</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span>Rapprochements bancaires terminés</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="gradient" disabled={!selectedFiscalYear}>
                        <Lock className="h-4 w-4" />
                        Clôturer l'exercice
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la clôture annuelle</AlertDialogTitle>
                        <AlertDialogDescription>
                          <strong className="text-destructive">Attention !</strong> Cette action est irréversible.
                          L'exercice sera définitivement clôturé et aucune modification ne sera possible. Assurez-vous
                          d'avoir généré tous les états nécessaires.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCloseYear}>Confirmer la clôture définitive</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle>Historique des clôtures</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date clôture</TableHead>
                      <TableHead>Exercice</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Utilisateur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Aucune clôture effectuée
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
