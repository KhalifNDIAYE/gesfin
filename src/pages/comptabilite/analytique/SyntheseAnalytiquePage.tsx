import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart, Download, RefreshCw, Activity, Layers, MapPin, Building } from "lucide-react";
import { useFiscalYears } from "@/hooks/useParametrage";
import { useAnalyticalSummary, useAnalyticalAllocations } from "@/hooks/useComptabiliteAnalytique";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SyntheseAnalytiquePage() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  const fiscalYearId = selectedFiscalYear || currentFiscalYear?.id;
  
  const { data: summary, isLoading: summaryLoading, refetch } = useAnalyticalSummary(fiscalYearId);
  const { data: allAllocations } = useAnalyticalAllocations({ fiscal_year_id: fiscalYearId });

  // Group allocations by type
  const byActivity = allAllocations?.filter(a => a.allocation_type === 'activity') || [];
  const byComponent = allAllocations?.filter(a => a.allocation_type === 'component') || [];
  const byGeographic = allAllocations?.filter(a => a.allocation_type === 'geographic') || [];
  const byCostCenter = allAllocations?.filter(a => a.allocation_type === 'cost_center') || [];

  const StatCard = ({ icon: Icon, title, value, color }: { icon: any, title: string, value: number, color: string }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toLocaleString('fr-FR')} FCFA
        </div>
        {summary && summary.total > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {((value / summary.total) * 100).toFixed(1)}% du total
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AppLayout 
      title="Synthèse Analytique" 
      subtitle="Vue consolidée de la comptabilité analytique"
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {summaryLoading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-5">
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Total Analytique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {(summary?.total || 0).toLocaleString('fr-FR')} FCFA
                  </div>
                </CardContent>
              </Card>
              <StatCard 
                icon={Activity} 
                title="Par Activité" 
                value={summary?.by_activity || 0} 
                color="text-blue-500"
              />
              <StatCard 
                icon={Layers} 
                title="Par Composante" 
                value={summary?.by_component || 0} 
                color="text-green-500"
              />
              <StatCard 
                icon={MapPin} 
                title="Par Zone Géo." 
                value={summary?.by_geographic || 0} 
                color="text-purple-500"
              />
              <StatCard 
                icon={Building} 
                title="Par Centre de Coûts" 
                value={summary?.by_cost_center || 0} 
                color="text-orange-500"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Détail des Affectations
                </CardTitle>
                <CardDescription>Analyse détaillée par dimension analytique</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="activity">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="activity" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Activités ({byActivity.length})
                    </TabsTrigger>
                    <TabsTrigger value="component" className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Composantes ({byComponent.length})
                    </TabsTrigger>
                    <TabsTrigger value="geographic" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Zones ({byGeographic.length})
                    </TabsTrigger>
                    <TabsTrigger value="cost_center" className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Centres ({byCostCenter.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="activity" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Activité</TableHead>
                          <TableHead>Méthode</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byActivity.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Aucune affectation par activité
                            </TableCell>
                          </TableRow>
                        ) : (
                          byActivity.map((alloc) => (
                            <TableRow key={alloc.id}>
                              <TableCell>
                                <Badge variant="outline">{alloc.activity?.code}</Badge>
                                <span className="ml-2">{alloc.activity?.name}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{alloc.allocation_method}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {Number(alloc.amount).toLocaleString('fr-FR')}
                              </TableCell>
                              <TableCell className="text-right">
                                {alloc.percentage ? `${alloc.percentage}%` : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="component" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Composante</TableHead>
                          <TableHead>Méthode</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byComponent.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Aucune affectation par composante
                            </TableCell>
                          </TableRow>
                        ) : (
                          byComponent.map((alloc) => (
                            <TableRow key={alloc.id}>
                              <TableCell>
                                <Badge variant="outline">{alloc.component?.code}</Badge>
                                <span className="ml-2">{alloc.component?.name}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{alloc.allocation_method}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {Number(alloc.amount).toLocaleString('fr-FR')}
                              </TableCell>
                              <TableCell className="text-right">
                                {alloc.percentage ? `${alloc.percentage}%` : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="geographic" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Zone Géographique</TableHead>
                          <TableHead>Méthode</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byGeographic.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Aucune affectation par zone géographique
                            </TableCell>
                          </TableRow>
                        ) : (
                          byGeographic.map((alloc) => (
                            <TableRow key={alloc.id}>
                              <TableCell>
                                <Badge variant="outline">{alloc.geographic_zone?.code}</Badge>
                                <span className="ml-2">{alloc.geographic_zone?.name}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{alloc.allocation_method}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {Number(alloc.amount).toLocaleString('fr-FR')}
                              </TableCell>
                              <TableCell className="text-right">
                                {alloc.percentage ? `${alloc.percentage}%` : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="cost_center" className="mt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Centre de Coûts</TableHead>
                          <TableHead>Méthode</TableHead>
                          <TableHead className="text-right">Montant</TableHead>
                          <TableHead className="text-right">%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {byCostCenter.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Aucune affectation par centre de coûts
                            </TableCell>
                          </TableRow>
                        ) : (
                          byCostCenter.map((alloc) => (
                            <TableRow key={alloc.id}>
                              <TableCell>
                                <Badge variant="outline">{alloc.cost_center?.code}</Badge>
                                <span className="ml-2">{alloc.cost_center?.name}</span>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{alloc.allocation_method}</Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {Number(alloc.amount).toLocaleString('fr-FR')}
                              </TableCell>
                              <TableCell className="text-right">
                                {alloc.percentage ? `${alloc.percentage}%` : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
