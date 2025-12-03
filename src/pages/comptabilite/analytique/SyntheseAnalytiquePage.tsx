import { useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart as PieChartIcon, Download, RefreshCw, Activity, Layers, MapPin, Building, FileSpreadsheet, FileText } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444', '#06b6d4', '#eab308', '#ec4899'];

export default function SyntheseAnalytiquePage() {
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: fiscalYears } = useFiscalYears();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);
  const fiscalYearId = selectedFiscalYear || currentFiscalYear?.id;
  const selectedFiscalYearName = fiscalYears?.find(fy => fy.id === fiscalYearId)?.name || "Exercice";
  
  const { data: summary, isLoading: summaryLoading, refetch } = useAnalyticalSummary(fiscalYearId);
  const { data: allAllocations } = useAnalyticalAllocations({ fiscal_year_id: fiscalYearId });

  // Group allocations by type
  const byActivity = allAllocations?.filter(a => a.allocation_type === 'activity') || [];
  const byComponent = allAllocations?.filter(a => a.allocation_type === 'component') || [];
  const byGeographic = allAllocations?.filter(a => a.allocation_type === 'geographic') || [];
  const byCostCenter = allAllocations?.filter(a => a.allocation_type === 'cost_center') || [];

  // Pie chart data
  const pieData = [
    { name: 'Par Activité', value: summary?.by_activity || 0, color: COLORS[0] },
    { name: 'Par Composante', value: summary?.by_component || 0, color: COLORS[1] },
    { name: 'Par Zone Géo.', value: summary?.by_geographic || 0, color: COLORS[2] },
    { name: 'Par Centre de Coûts', value: summary?.by_cost_center || 0, color: COLORS[3] },
  ].filter(item => item.value > 0);

  // Bar chart data by allocation method
  const methodData = [
    {
      name: 'A Priori',
      activity: allAllocations?.filter(a => a.allocation_type === 'activity' && a.allocation_method === 'a_priori').reduce((sum, a) => sum + Number(a.amount), 0) || 0,
      component: allAllocations?.filter(a => a.allocation_type === 'component' && a.allocation_method === 'a_priori').reduce((sum, a) => sum + Number(a.amount), 0) || 0,
      geographic: allAllocations?.filter(a => a.allocation_type === 'geographic' && a.allocation_method === 'a_priori').reduce((sum, a) => sum + Number(a.amount), 0) || 0,
      cost_center: allAllocations?.filter(a => a.allocation_type === 'cost_center' && a.allocation_method === 'a_priori').reduce((sum, a) => sum + Number(a.amount), 0) || 0,
    },
    {
      name: 'A Posteriori',
      activity: allAllocations?.filter(a => a.allocation_type === 'activity' && a.allocation_method === 'a_posteriori').reduce((sum, a) => sum + Number(a.amount), 0) || 0,
      component: allAllocations?.filter(a => a.allocation_type === 'component' && a.allocation_method === 'a_posteriori').reduce((sum, a) => sum + Number(a.amount), 0) || 0,
      geographic: allAllocations?.filter(a => a.allocation_type === 'geographic' && a.allocation_method === 'a_posteriori').reduce((sum, a) => sum + Number(a.amount), 0) || 0,
      cost_center: allAllocations?.filter(a => a.allocation_type === 'cost_center' && a.allocation_method === 'a_posteriori').reduce((sum, a) => sum + Number(a.amount), 0) || 0,
    },
    {
      name: 'Réimputation',
      activity: allAllocations?.filter(a => a.allocation_type === 'activity' && a.allocation_method === 'reallocation').reduce((sum, a) => sum + Number(a.amount), 0) || 0,
      component: allAllocations?.filter(a => a.allocation_type === 'component' && a.allocation_method === 'reallocation').reduce((sum, a) => sum + Number(a.amount), 0) || 0,
      geographic: allAllocations?.filter(a => a.allocation_type === 'geographic' && a.allocation_method === 'reallocation').reduce((sum, a) => sum + Number(a.amount), 0) || 0,
      cost_center: allAllocations?.filter(a => a.allocation_type === 'cost_center' && a.allocation_method === 'reallocation').reduce((sum, a) => sum + Number(a.amount), 0) || 0,
    },
  ];

  // Horizontal bar chart data for comparison
  const comparisonData = [
    { name: 'Activités', montant: summary?.by_activity || 0, fill: COLORS[0] },
    { name: 'Composantes', montant: summary?.by_component || 0, fill: COLORS[1] },
    { name: 'Zones Géo.', montant: summary?.by_geographic || 0, fill: COLORS[2] },
    { name: 'Centres Coûts', montant: summary?.by_cost_center || 0, fill: COLORS[3] },
  ];

  // Group by activity for detailed bar chart
  const activityBarData = byActivity.reduce((acc, alloc) => {
    const name = alloc.activity?.name || 'Non défini';
    const existing = acc.find(item => item.name === name);
    if (existing) {
      existing.montant += Number(alloc.amount);
    } else {
      acc.push({ name, montant: Number(alloc.amount) });
    }
    return acc;
  }, [] as { name: string; montant: number }[]).slice(0, 8);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-sm mb-1">{label || payload[0]?.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color || entry.fill }}>
              {entry.dataKey || 'Montant'}: {Number(entry.value).toLocaleString('fr-FR')} FCFA
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Export to PDF
  const exportToPDF = async () => {
    if (!contentRef.current) return;
    
    setIsExporting(true);
    toast.info("Génération du PDF en cours...");
    
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      // Add title
      pdf.setFontSize(16);
      pdf.text(`Synthèse Analytique - ${selectedFiscalYearName}`, pdfWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(10);
      pdf.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pdfWidth / 2, 22, { align: 'center' });
      
      // Calculate if we need multiple pages
      const scaledImgHeight = imgHeight * ratio;
      const maxHeight = pdfHeight - 30;
      
      if (scaledImgHeight <= maxHeight) {
        pdf.addImage(imgData, 'PNG', imgX, 25, imgWidth * ratio, scaledImgHeight);
      } else {
        // Split into multiple pages
        let remainingHeight = imgHeight;
        let sourceY = 0;
        let page = 0;
        
        while (remainingHeight > 0) {
          const sliceHeight = Math.min(remainingHeight, (maxHeight / ratio));
          
          if (page > 0) {
            pdf.addPage();
          }
          
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = imgWidth;
          tempCanvas.height = sliceHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            tempCtx.drawImage(canvas, 0, sourceY, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight);
            const sliceData = tempCanvas.toDataURL('image/png');
            pdf.addImage(sliceData, 'PNG', imgX, page === 0 ? 25 : 10, imgWidth * ratio, sliceHeight * ratio);
          }
          
          sourceY += sliceHeight;
          remainingHeight -= sliceHeight;
          page++;
        }
      }
      
      pdf.save(`synthese-analytique-${selectedFiscalYearName}.pdf`);
      toast.success("PDF exporté avec succès");
    } catch {
      toast.error("Erreur lors de l'export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    setIsExporting(true);
    toast.info("Génération du fichier Excel en cours...");
    
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['Synthèse Analytique', selectedFiscalYearName],
        ['Généré le', new Date().toLocaleDateString('fr-FR')],
        [],
        ['Type', 'Montant (FCFA)', 'Pourcentage'],
        ['Total', summary?.total || 0, '100%'],
        ['Par Activité', summary?.by_activity || 0, summary?.total ? `${((summary.by_activity / summary.total) * 100).toFixed(1)}%` : '0%'],
        ['Par Composante', summary?.by_component || 0, summary?.total ? `${((summary.by_component / summary.total) * 100).toFixed(1)}%` : '0%'],
        ['Par Zone Géographique', summary?.by_geographic || 0, summary?.total ? `${((summary.by_geographic / summary.total) * 100).toFixed(1)}%` : '0%'],
        ['Par Centre de Coûts', summary?.by_cost_center || 0, summary?.total ? `${((summary.by_cost_center / summary.total) * 100).toFixed(1)}%` : '0%'],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Synthèse');
      
      // Method distribution sheet
      const methodSheetData = [
        ['Répartition par Méthode d\'Affectation'],
        [],
        ['Méthode', 'Activités', 'Composantes', 'Zones Géo.', 'Centres Coûts', 'Total'],
        ...methodData.map(row => [
          row.name,
          row.activity,
          row.component,
          row.geographic,
          row.cost_center,
          row.activity + row.component + row.geographic + row.cost_center
        ])
      ];
      const methodSheet = XLSX.utils.aoa_to_sheet(methodSheetData);
      XLSX.utils.book_append_sheet(workbook, methodSheet, 'Par Méthode');
      
      // Activities sheet
      if (byActivity.length > 0) {
        const activityData = [
          ['Affectations par Activité'],
          [],
          ['Code', 'Activité', 'Méthode', 'Montant (FCFA)', 'Pourcentage'],
          ...byActivity.map(alloc => [
            alloc.activity?.code || '',
            alloc.activity?.name || '',
            alloc.allocation_method,
            Number(alloc.amount),
            alloc.percentage ? `${alloc.percentage}%` : '-'
          ])
        ];
        const activitySheet = XLSX.utils.aoa_to_sheet(activityData);
        XLSX.utils.book_append_sheet(workbook, activitySheet, 'Activités');
      }
      
      // Components sheet
      if (byComponent.length > 0) {
        const componentData = [
          ['Affectations par Composante'],
          [],
          ['Code', 'Composante', 'Méthode', 'Montant (FCFA)', 'Pourcentage'],
          ...byComponent.map(alloc => [
            alloc.component?.code || '',
            alloc.component?.name || '',
            alloc.allocation_method,
            Number(alloc.amount),
            alloc.percentage ? `${alloc.percentage}%` : '-'
          ])
        ];
        const componentSheet = XLSX.utils.aoa_to_sheet(componentData);
        XLSX.utils.book_append_sheet(workbook, componentSheet, 'Composantes');
      }
      
      // Geographic zones sheet
      if (byGeographic.length > 0) {
        const geoData = [
          ['Affectations par Zone Géographique'],
          [],
          ['Code', 'Zone', 'Méthode', 'Montant (FCFA)', 'Pourcentage'],
          ...byGeographic.map(alloc => [
            alloc.geographic_zone?.code || '',
            alloc.geographic_zone?.name || '',
            alloc.allocation_method,
            Number(alloc.amount),
            alloc.percentage ? `${alloc.percentage}%` : '-'
          ])
        ];
        const geoSheet = XLSX.utils.aoa_to_sheet(geoData);
        XLSX.utils.book_append_sheet(workbook, geoSheet, 'Zones Géographiques');
      }
      
      // Cost centers sheet
      if (byCostCenter.length > 0) {
        const costCenterData = [
          ['Affectations par Centre de Coûts'],
          [],
          ['Code', 'Centre de Coûts', 'Méthode', 'Montant (FCFA)', 'Pourcentage'],
          ...byCostCenter.map(alloc => [
            alloc.cost_center?.code || '',
            alloc.cost_center?.name || '',
            alloc.allocation_method,
            Number(alloc.amount),
            alloc.percentage ? `${alloc.percentage}%` : '-'
          ])
        ];
        const costCenterSheet = XLSX.utils.aoa_to_sheet(costCenterData);
        XLSX.utils.book_append_sheet(workbook, costCenterSheet, 'Centres de Coûts');
      }
      
      XLSX.writeFile(workbook, `synthese-analytique-${selectedFiscalYearName}.xlsx`);
      toast.success("Excel exporté avec succès");
    } catch {
      toast.error("Erreur lors de l'export Excel");
    } finally {
      setIsExporting(false);
    }
  };

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Export..." : "Exporter"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Exporter en PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Exporter en Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {summaryLoading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div ref={contentRef} className="space-y-6 bg-background">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" />
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

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Répartition par Type
                  </CardTitle>
                  <CardDescription>Distribution des affectations analytiques</CardDescription>
                </CardHeader>
                <CardContent>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          labelLine={false}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <PieChartIcon className="h-12 w-12 mb-4 opacity-50" />
                      <p>Aucune donnée à afficher</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Horizontal Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Comparaison par Dimension</CardTitle>
                  <CardDescription>Montants par type d'affectation</CardDescription>
                </CardHeader>
                <CardContent>
                  {comparisonData.some(d => d.montant > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={comparisonData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          type="number" 
                          tickFormatter={formatCurrency}
                          className="text-xs"
                        />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          width={75}
                          className="text-xs"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="montant" radius={[0, 4, 4, 0]}>
                          {comparisonData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <Activity className="h-12 w-12 mb-4 opacity-50" />
                      <p>Aucune donnée à afficher</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Stacked Bar Chart by Method */}
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Méthode d'Affectation</CardTitle>
                <CardDescription>Comparaison A Priori / A Posteriori / Réimputation</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={methodData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis tickFormatter={formatCurrency} className="text-xs" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="activity" name="Activités" stackId="a" fill={COLORS[0]} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="component" name="Composantes" stackId="a" fill={COLORS[1]} />
                    <Bar dataKey="geographic" name="Zones Géo." stackId="a" fill={COLORS[2]} />
                    <Bar dataKey="cost_center" name="Centres Coûts" stackId="a" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Activity Bar Chart */}
            {activityBarData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Top Activités par Montant
                  </CardTitle>
                  <CardDescription>Les 8 activités avec les plus grands montants affectés</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={activityBarData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        className="text-xs"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tickFormatter={formatCurrency} className="text-xs" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar 
                        dataKey="montant" 
                        name="Montant"
                        fill={COLORS[0]} 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Detailed Tables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
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
          </div>
        )}
      </div>
    </AppLayout>
  );
}
