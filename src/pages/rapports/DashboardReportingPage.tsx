import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Download, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Activity } from "lucide-react";
import { useBilanData, useResultatData, useCashFlowData, useFinancialRatios } from "@/hooks/useReporting";
import { useFiscalYears } from "@/hooks/useParametrage";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart as RechartsPieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line
} from "recharts";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))'];

const DashboardReportingPage = () => {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const { data: fiscalYears } = useFiscalYears();
  const { data: bilanData, refetch: refetchBilan } = useBilanData(selectedYear);
  const { data: resultatData, refetch: refetchResultat } = useResultatData(selectedYear);
  const { data: cashFlowData, refetch: refetchCashFlow } = useCashFlowData(selectedYear);
  const { data: ratios, refetch: refetchRatios } = useFinancialRatios(selectedYear);

  const refetchAll = () => {
    refetchBilan();
    refetchResultat();
    refetchCashFlow();
    refetchRatios();
    toast.success("Données actualisées");
  };

  // Monthly evolution data (simulated)
  const monthlyData = [
    { month: 'Jan', produits: 5000000, charges: 4200000, resultat: 800000 },
    { month: 'Fév', produits: 5500000, charges: 4500000, resultat: 1000000 },
    { month: 'Mar', produits: 4800000, charges: 4100000, resultat: 700000 },
    { month: 'Avr', produits: 6200000, charges: 5000000, resultat: 1200000 },
    { month: 'Mai', produits: 5800000, charges: 4800000, resultat: 1000000 },
    { month: 'Jun', produits: 6500000, charges: 5200000, resultat: 1300000 },
  ];

  // Actif structure data
  const actifStructure = [
    { name: 'Immobilisé', value: bilanData?.actif.immobilise || 0 },
    { name: 'Circulant', value: bilanData?.actif.circulant || 0 },
    { name: 'Trésorerie', value: bilanData?.actif.tresorerie || 0 },
  ];

  // Passif structure data
  const passifStructure = [
    { name: 'Capitaux Propres', value: bilanData?.passif.capitaux || 0 },
    { name: 'Dettes', value: bilanData?.passif.dettes || 0 },
    { name: 'Provisions', value: bilanData?.passif.provisions || 0 },
  ];

  const isProfit = (resultatData?.resultatNet || 0) >= 0;

  return (
    <AppLayout 
      title="Tableau de Bord Financier" 
      subtitle="Vue consolidée des indicateurs financiers"
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
            <Button variant="outline" onClick={() => toast.success("Export PDF en cours...")}>
              <Download className="mr-2 h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Bilan</p>
                  <p className="text-2xl font-bold">{formatCurrency(bilanData?.totalActif || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chiffre d'Affaires</p>
                  <p className="text-2xl font-bold text-success">{formatCurrency(resultatData?.totalProduits || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isProfit ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {isProfit ? (
                    <TrendingUp className="h-6 w-6 text-success" />
                  ) : (
                    <TrendingDown className="h-6 w-6 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Résultat Net</p>
                  <p className={`text-2xl font-bold ${isProfit ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(resultatData?.resultatNet || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-info/10">
                  <Activity className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trésorerie</p>
                  <p className="text-2xl font-bold text-info">{formatCurrency(bilanData?.actif.tresorerie || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="evolution" className="space-y-4">
          <TabsList>
            <TabsTrigger value="evolution">Évolution</TabsTrigger>
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="ratios">Ratios</TabsTrigger>
          </TabsList>

          <TabsContent value="evolution" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Évolution Mensuelle</CardTitle>
                  <CardDescription>Produits, charges et résultat</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="produits" name="Produits" stroke="hsl(var(--success))" fill="hsl(var(--success))" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="charges" name="Charges" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Résultat Mensuel</CardTitle>
                  <CardDescription>Évolution du résultat net</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="resultat" name="Résultat" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="structure" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Structure de l'Actif</CardTitle>
                  <CardDescription>Répartition des emplois</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={actifStructure}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {actifStructure.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Structure du Passif</CardTitle>
                  <CardDescription>Répartition des ressources</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={passifStructure}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {passifStructure.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Comparaison Actif / Passif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { 
                        name: 'Actif', 
                        Immobilisé: bilanData?.actif.immobilise || 0,
                        Circulant: bilanData?.actif.circulant || 0,
                        Trésorerie: bilanData?.actif.tresorerie || 0,
                      },
                      { 
                        name: 'Passif', 
                        'Capitaux Propres': bilanData?.passif.capitaux || 0,
                        Dettes: bilanData?.passif.dettes || 0,
                        Provisions: bilanData?.passif.provisions || 0,
                      },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Bar dataKey="Immobilisé" stackId="a" fill={COLORS[0]} />
                      <Bar dataKey="Circulant" stackId="a" fill={COLORS[1]} />
                      <Bar dataKey="Trésorerie" stackId="a" fill={COLORS[2]} />
                      <Bar dataKey="Capitaux Propres" stackId="b" fill={COLORS[0]} />
                      <Bar dataKey="Dettes" stackId="b" fill={COLORS[3]} />
                      <Bar dataKey="Provisions" stackId="b" fill={COLORS[4]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ratios" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ratios?.map((ratio, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{ratio.name}</p>
                        <p className="text-2xl font-bold">
                          {ratio.category === 'Trésorerie' 
                            ? formatCurrency(ratio.value) 
                            : `${ratio.value.toFixed(2)}${ratio.category.includes('Liquidité') ? '' : '%'}`
                          }
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{ratio.description}</p>
                      </div>
                      {ratio.trend === 'up' && <TrendingUp className="h-8 w-8 text-success" />}
                      {ratio.trend === 'down' && <TrendingDown className="h-8 w-8 text-destructive" />}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default DashboardReportingPage;
