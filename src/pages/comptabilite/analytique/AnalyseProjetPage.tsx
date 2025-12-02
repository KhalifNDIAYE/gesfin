import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { useFiscalYears } from "@/hooks/useParametrage";
import { useAnalyticalSummary } from "@/hooks/useComptabiliteAnalytique";
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

export default function AnalyseProjetPage() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  
  const { data: summary } = useAnalyticalSummary(selectedFiscalYear || currentFiscalYear?.id);

  // Mock data for projects - in real implementation, this would come from a projects table
  const mockProjects = [
    { id: '1', code: 'PRJ001', name: 'Projet Alpha', budget: 50000000, spent: 35000000, status: 'En cours' },
    { id: '2', code: 'PRJ002', name: 'Projet Beta', budget: 30000000, spent: 28000000, status: 'En cours' },
    { id: '3', code: 'PRJ003', name: 'Projet Gamma', budget: 80000000, spent: 45000000, status: 'En cours' },
    { id: '4', code: 'PRJ004', name: 'Projet Delta', budget: 20000000, spent: 20000000, status: 'Clôturé' },
  ];

  const totalBudget = mockProjects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = mockProjects.reduce((sum, p) => sum + p.spent, 0);

  return (
    <AppLayout 
      title="Analyse des Coûts par Projet" 
      subtitle="Suivi et analyse des coûts analytiques par projet"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Select
            value={selectedFiscalYear || currentFiscalYear?.id || ""}
            onValueChange={setSelectedFiscalYear}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Exercice" />
            </SelectTrigger>
            <SelectContent>
              {fiscalYears?.map((fy) => (
                <SelectItem key={fy.id} value={fy.id}>
                  {fy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Budget Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalBudget.toLocaleString('fr-FR')} FCFA
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Dépensé
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {totalSpent.toLocaleString('fr-FR')} FCFA
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Disponible
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(totalBudget - totalSpent).toLocaleString('fr-FR')} FCFA
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taux d'exécution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((totalSpent / totalBudget) * 100).toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Analyse par Projet
            </CardTitle>
            <CardDescription>Vue détaillée des coûts par projet</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Dépensé</TableHead>
                  <TableHead className="text-right">Disponible</TableHead>
                  <TableHead className="text-right">Taux</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockProjects.map((project) => {
                  const available = project.budget - project.spent;
                  const rate = (project.spent / project.budget) * 100;
                  const isOverBudget = rate > 100;
                  const isNearLimit = rate > 90 && rate <= 100;

                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">{project.code}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell className="text-right font-mono">
                        {project.budget.toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-600">
                        {project.spent.toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${available < 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {available.toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={isOverBudget ? "destructive" : isNearLimit ? "secondary" : "outline"}
                        >
                          {rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={project.status === 'En cours' ? "default" : "secondary"}>
                          {project.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {summary && (
          <Card>
            <CardHeader>
              <CardTitle>Répartition Analytique</CardTitle>
              <CardDescription>Synthèse des affectations par type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950">
                  <p className="text-sm text-muted-foreground">Par Activité</p>
                  <p className="text-xl font-bold">{summary.by_activity.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950">
                  <p className="text-sm text-muted-foreground">Par Composante</p>
                  <p className="text-xl font-bold">{summary.by_component.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950">
                  <p className="text-sm text-muted-foreground">Par Zone Géo.</p>
                  <p className="text-xl font-bold">{summary.by_geographic.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950">
                  <p className="text-sm text-muted-foreground">Par Centre de Coûts</p>
                  <p className="text-xl font-bold">{summary.by_cost_center.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
