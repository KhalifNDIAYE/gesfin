import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, RefreshCw, TrendingUp, TrendingDown, Minus, Calculator, DollarSign, Percent, Activity } from "lucide-react";
import { useFinancialRatios, useBilanData, useResultatData } from "@/hooks/useReporting";
import { useFiscalYears } from "@/hooks/useParametrage";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const RatiosPage = () => {
  const [selectedYear, setSelectedYear] = useState<string>("");
  const { data: fiscalYears } = useFiscalYears();
  const { data: ratios, isLoading, refetch } = useFinancialRatios(selectedYear);
  const { data: bilanData } = useBilanData(selectedYear);
  const { data: resultatData } = useResultatData(selectedYear);

  const radarData = ratios?.map(r => ({
    subject: r.name.split(' ').slice(0, 2).join(' '),
    A: Math.min(Math.abs(r.value), 100),
    fullMark: 100,
  })) || [];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Liquidité': return DollarSign;
      case 'Solvabilité': return Calculator;
      case 'Endettement': return Percent;
      case 'Rentabilité': return TrendingUp;
      case 'Trésorerie': return Activity;
      default: return Calculator;
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'bg-success/10 text-success';
      case 'down': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleExport = (format: string) => {
    toast.success(`Export ${format} des ratios financiers en cours...`);
  };

  // Group ratios by category
  const ratiosByCategory = ratios?.reduce((acc, ratio) => {
    if (!acc[ratio.category]) {
      acc[ratio.category] = [];
    }
    acc[ratio.category].push(ratio);
    return acc;
  }, {} as Record<string, typeof ratios>) || {};

  return (
    <AppLayout 
      title="Ratios Financiers" 
      subtitle="Analyse de la performance financière"
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
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualiser
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('PDF')}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('Excel')}>
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Actif</p>
                  <p className="text-xl font-bold">{formatCurrency(bilanData?.totalActif || 0)}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Capitaux Propres</p>
                  <p className="text-xl font-bold">{formatCurrency(bilanData?.passif.capitaux || 0)}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <Calculator className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chiffre d'Affaires</p>
                  <p className="text-xl font-bold">{formatCurrency(resultatData?.totalProduits || 0)}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                  <TrendingUp className="h-5 w-5 text-info" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Résultat Net</p>
                  <p className={`text-xl font-bold ${(resultatData?.resultatNet || 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(resultatData?.resultatNet || 0)}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${(resultatData?.resultatNet || 0) >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                  {(resultatData?.resultatNet || 0) >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-success" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-destructive" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Radar Chart and Ratio Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Vue d'ensemble des Ratios</CardTitle>
              <CardDescription>Performance globale normalisée</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Ratios" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Indicateurs Clés</CardTitle>
              <CardDescription>Évolution et tendances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {ratios?.slice(0, 5).map((ratio, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{ratio.name}</span>
                      {getTrendIcon(ratio.trend)}
                    </div>
                    <span className="font-bold">
                      {ratio.category === 'Trésorerie' 
                        ? formatCurrency(ratio.value) 
                        : `${ratio.value.toFixed(2)}${ratio.category.includes('Liquidité') ? '' : '%'}`
                      }
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(Math.abs(ratio.value), 100)} 
                    className="h-2" 
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Ratios by Category */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(ratiosByCategory).map(([category, categoryRatios]) => {
            const CategoryIcon = getCategoryIcon(category);
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                    {category}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {categoryRatios?.map((ratio, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex-1">
                        <p className="font-medium">{ratio.name}</p>
                        <p className="text-xs text-muted-foreground">{ratio.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTrendColor(ratio.trend)}>
                          {ratio.category === 'Trésorerie' 
                            ? formatCurrency(ratio.value) 
                            : `${ratio.value.toFixed(2)}${ratio.category.includes('Liquidité') ? '' : '%'}`
                          }
                        </Badge>
                        {getTrendIcon(ratio.trend)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Interpretation Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Guide d'Interprétation</CardTitle>
            <CardDescription>Comment interpréter les ratios financiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-primary">Liquidité</h4>
                <p className="text-sm text-muted-foreground">
                  Un ratio &gt; 1 indique une capacité à couvrir les dettes à court terme. 
                  Idéalement entre 1,5 et 2.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-success">Solvabilité</h4>
                <p className="text-sm text-muted-foreground">
                  Un ratio &gt; 20% est généralement considéré comme sain. 
                  Plus il est élevé, plus l'entreprise est autonome.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-warning">Endettement</h4>
                <p className="text-sm text-muted-foreground">
                  Un ratio &lt; 100% est préférable. Au-delà, l'entreprise 
                  est fortement endettée par rapport à ses capitaux.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-info">Rentabilité</h4>
                <p className="text-sm text-muted-foreground">
                  Plus les marges sont élevées, meilleure est la rentabilité. 
                  À comparer avec le secteur d'activité.
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold text-destructive">Trésorerie</h4>
                <p className="text-sm text-muted-foreground">
                  Une trésorerie positive assure la capacité à faire face 
                  aux engagements immédiats.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default RatiosPage;
