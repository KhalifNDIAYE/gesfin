import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, RefreshCw, Printer, BookOpen, Scale, TrendingUp, Wallet } from "lucide-react";
import { useBilanData, useResultatData, useCashFlowData } from "@/hooks/useReporting";
import { useFiscalYears } from "@/hooks/useParametrage";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";

const SYSCOHADAPage = () => {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const { data: fiscalYears } = useFiscalYears();
  const { data: bilanData, refetch: refetchBilan } = useBilanData(selectedYear);
  const { data: resultatData, refetch: refetchResultat } = useResultatData(selectedYear);
  const { data: cashFlowData } = useCashFlowData(selectedYear);

  const handleExport = (reportType: string, format: string) => {
    toast.success(`Export ${format} de l'état ${reportType} en cours...`);
  };

  const refetchAll = () => {
    refetchBilan();
    refetchResultat();
    toast.success("Données actualisées");
  };

  const syscohadaStates = [
    { id: 'bilan', title: 'Bilan', subtitle: 'État de la situation patrimoniale', icon: FileText },
    { id: 'resultat', title: 'Compte de Résultat', subtitle: 'Produits et charges', icon: TrendingUp },
    { id: 'tafire', title: 'TAFIRE', subtitle: 'Tableau financier des ressources et emplois', icon: Scale },
    { id: 'variation', title: 'État de Variation des Capitaux', subtitle: 'Évolution des fonds propres', icon: Wallet },
    { id: 'annexes', title: 'État Annexé', subtitle: 'Notes explicatives', icon: BookOpen },
  ];

  return (
    <AppLayout 
      title="États SYSCOHADA" 
      subtitle="États financiers selon le Système Comptable OHADA"
    >
      <div className="space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Exercice fiscal" />
              </SelectTrigger>
              <SelectContent>
                {fiscalYears?.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={refetchAll}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('complet', 'PDF')}>
              <Download className="mr-2 h-4 w-4" />
              Liasse complète PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('complet', 'Excel')}>
              <Download className="mr-2 h-4 w-4" />
              Liasse complète Excel
            </Button>
          </div>
        </div>

        {/* States Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {syscohadaStates.map((state) => {
            const Icon = state.icon;
            return (
              <Card key={state.id} className="group cursor-pointer transition-all hover:shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-3 font-semibold">{state.title}</h3>
                    <p className="text-xs text-muted-foreground">{state.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detailed States */}
        <Tabs defaultValue="bilan" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="bilan">Bilan</TabsTrigger>
            <TabsTrigger value="resultat">Compte de Résultat</TabsTrigger>
            <TabsTrigger value="tafire">TAFIRE</TabsTrigger>
            <TabsTrigger value="variation">Variation Capitaux</TabsTrigger>
            <TabsTrigger value="annexes">État Annexé</TabsTrigger>
          </TabsList>

          <TabsContent value="bilan" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Bilan SYSCOHADA</CardTitle>
                  <CardDescription>Présentation normalisée de la situation patrimoniale</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExport('Bilan', 'PDF')}>
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleExport('Bilan', 'Excel')}>
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2">
                  {/* Actif */}
                  <div className="border-r">
                    <div className="bg-primary/5 p-3 font-semibold">ACTIF</div>
                    <Table>
                      <TableBody>
                        <TableRow className="bg-muted/30 font-medium">
                          <TableCell>ACTIF IMMOBILISÉ</TableCell>
                          <TableCell className="text-right">{formatCurrency(bilanData?.actif.immobilise || 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Immobilisations incorporelles</TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Immobilisations corporelles</TableCell>
                          <TableCell className="text-right">{formatCurrency(bilanData?.actif.immobilise || 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Immobilisations financières</TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/30 font-medium">
                          <TableCell>ACTIF CIRCULANT</TableCell>
                          <TableCell className="text-right">{formatCurrency(bilanData?.actif.circulant || 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Stocks</TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Créances</TableCell>
                          <TableCell className="text-right">{formatCurrency(bilanData?.actif.circulant || 0)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/30 font-medium">
                          <TableCell>TRÉSORERIE-ACTIF</TableCell>
                          <TableCell className="text-right">{formatCurrency(bilanData?.actif.tresorerie || 0)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-primary/10 font-bold">
                          <TableCell>TOTAL ACTIF</TableCell>
                          <TableCell className="text-right">{formatCurrency(bilanData?.totalActif || 0)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Passif */}
                  <div>
                    <div className="bg-success/5 p-3 font-semibold">PASSIF</div>
                    <Table>
                      <TableBody>
                        <TableRow className="bg-muted/30 font-medium">
                          <TableCell>CAPITAUX PROPRES</TableCell>
                          <TableCell className="text-right">{formatCurrency(bilanData?.passif.capitaux || 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Capital</TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Réserves</TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Résultat de l'exercice</TableCell>
                          <TableCell className="text-right">{formatCurrency(resultatData?.resultatNet || 0)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/30 font-medium">
                          <TableCell>DETTES FINANCIÈRES</TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/30 font-medium">
                          <TableCell>PASSIF CIRCULANT</TableCell>
                          <TableCell className="text-right">{formatCurrency(bilanData?.passif.dettes || 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="pl-6">Fournisseurs</TableCell>
                          <TableCell className="text-right">{formatCurrency(bilanData?.passif.dettes || 0)}</TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/30 font-medium">
                          <TableCell>TRÉSORERIE-PASSIF</TableCell>
                          <TableCell className="text-right">-</TableCell>
                        </TableRow>
                        <TableRow className="bg-success/10 font-bold">
                          <TableCell>TOTAL PASSIF</TableCell>
                          <TableCell className="text-right">{formatCurrency(bilanData?.totalPassif || 0)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resultat" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Compte de Résultat SYSCOHADA</CardTitle>
                  <CardDescription>Présentation des soldes intermédiaires de gestion</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleExport('Résultat', 'PDF')}>
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>LIBELLÉ</TableHead>
                      <TableHead className="text-right">EXERCICE N</TableHead>
                      <TableHead className="text-right">EXERCICE N-1</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>PRODUITS D'EXPLOITATION</TableCell>
                      <TableCell className="text-right">{formatCurrency(resultatData?.produits.exploitation || 0)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>CHARGES D'EXPLOITATION</TableCell>
                      <TableCell className="text-right">{formatCurrency(resultatData?.charges.exploitation || 0)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell>RÉSULTAT D'EXPLOITATION</TableCell>
                      <TableCell className="text-right">{formatCurrency(resultatData?.resultatExploitation || 0)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>PRODUITS FINANCIERS</TableCell>
                      <TableCell className="text-right">{formatCurrency(resultatData?.produits.financiers || 0)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>CHARGES FINANCIÈRES</TableCell>
                      <TableCell className="text-right">{formatCurrency(resultatData?.charges.financieres || 0)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                    <TableRow className="bg-info/10 font-bold">
                      <TableCell>RÉSULTAT FINANCIER</TableCell>
                      <TableCell className="text-right">{formatCurrency(resultatData?.resultatFinancier || 0)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>PRODUITS HAO</TableCell>
                      <TableCell className="text-right">{formatCurrency(resultatData?.produits.exceptionnels || 0)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>CHARGES HAO</TableCell>
                      <TableCell className="text-right">{formatCurrency(resultatData?.charges.exceptionnelles || 0)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                    <TableRow className="bg-warning/10 font-bold">
                      <TableCell>RÉSULTAT HAO</TableCell>
                      <TableCell className="text-right">{formatCurrency(resultatData?.resultatExceptionnel || 0)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                    <TableRow className="bg-success/10 font-bold text-lg">
                      <TableCell>RÉSULTAT NET</TableCell>
                      <TableCell className={`text-right ${(resultatData?.resultatNet || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                        {formatCurrency(resultatData?.resultatNet || 0)}
                      </TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tafire" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>TAFIRE - Tableau Financier des Ressources et Emplois</CardTitle>
                <CardDescription>Analyse des flux de trésorerie selon SYSCOHADA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Scale className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Le TAFIRE sera généré automatiquement à partir des données comptables de l'exercice.
                  </p>
                  <Button className="mt-4" onClick={() => handleExport('TAFIRE', 'PDF')}>
                    <Download className="mr-2 h-4 w-4" />
                    Générer le TAFIRE
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="variation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>État de Variation des Capitaux Propres</CardTitle>
                <CardDescription>Évolution des fonds propres sur l'exercice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wallet className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    L'état de variation des capitaux propres retrace les mouvements affectant les fonds propres.
                  </p>
                  <Button className="mt-4" onClick={() => handleExport('Variation', 'PDF')}>
                    <Download className="mr-2 h-4 w-4" />
                    Générer l'état
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="annexes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>État Annexé</CardTitle>
                <CardDescription>Notes et informations complémentaires</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    L'état annexé comprend les notes explicatives sur les méthodes comptables et les informations complémentaires.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold mb-2">Méthodes comptables</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Référentiel: SYSCOHADA révisé</li>
                          <li>• Méthode d'amortissement: Linéaire</li>
                          <li>• Évaluation des stocks: PEPS</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <h4 className="font-semibold mb-2">Événements significatifs</h4>
                        <p className="text-sm text-muted-foreground">
                          Aucun événement significatif à signaler pour l'exercice en cours.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <Button onClick={() => handleExport('Annexe', 'PDF')}>
                    <Download className="mr-2 h-4 w-4" />
                    Générer l'état annexé complet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default SYSCOHADAPage;
