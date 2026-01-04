import { useState, useMemo, useRef, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Map as MapIcon, AlertCircle } from 'lucide-react';
import { useProjectsForMap, MapFilters, useUpdateProjectLocation, projectStatusConfig } from '@/hooks/useProjectsMap';
import { useModulePermissions } from '@/components/auth/PermissionButton';
import { ProjectsMapFilters } from '@/components/projets/map/ProjectsMapFilters';
import { ProjectsMapControls, MapViewMode } from '@/components/projets/map/ProjectsMapControls';
import { ProjectsMapLegend } from '@/components/projets/map/ProjectsMapLegend';
import { ProjectsMapStats } from '@/components/projets/map/ProjectsMapStats';
import ProjectsLeafletMap from '@/components/projets/map/ProjectsLeafletMap';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { formatCurrency } from '@/lib/utils';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { addTable, addSectionHeader, checkPageBreak } from '@/utils/pdfTemplate';

export default function ProjectsMapPage() {
  const [filters, setFilters] = useState<MapFilters>({});
  const [viewMode, setViewMode] = useState<MapViewMode>('cluster');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const { data: projects = [], isLoading, error } = useProjectsForMap(filters);
  const updateLocation = useUpdateProjectLocation();
  const { canUpdate } = useModulePermissions('projets');

  // Count projects by status
  const projectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [projects]);

  // Geolocated projects count
  const geolocatedCount = useMemo(() => 
    projects.filter(p => p.latitude && p.longitude).length,
    [projects]
  );

  // Handle location update
  const handleLocationUpdate = useCallback((projectId: string, lat: number, lng: number) => {
    updateLocation.mutate({ projectId, latitude: lat, longitude: lng });
  }, [updateLocation]);

  // Export PNG
  const handleExportPNG = useCallback(async () => {
    if (!mapContainerRef.current) return;
    try {
      const canvas = await html2canvas(mapContainerRef.current, {
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = `carte-projets-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Image exportée');
    } catch (err) {
      toast.error('Erreur lors de l\'export');
    }
  }, []);

  const { downloadPDF } = usePDFGeneration();

  // Export PDF
  const handleExportPDF = useCallback(async () => {
    if (!mapContainerRef.current) return;
    try {
      const canvas = await html2canvas(mapContainerRef.current, {
        useCORS: true,
        allowTaint: true,
      });
      const imgData = canvas.toDataURL('image/png');
      
      await downloadPDF(
        {
          title: "Carte des Projets",
          documentDate: new Date(),
          documentRef: `MAP-${new Date().toISOString().split('T')[0]}`,
          orientation: 'landscape',
          auditModule: "projets",
          auditResourceType: "export",
        },
        `carte-projets-${new Date().toISOString().split('T')[0]}.pdf`,
        (ctx) => {
          // Add map image
          const pdfWidth = ctx.contentWidth;
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          ctx.doc.addImage(imgData, 'PNG', ctx.margin, ctx.yPos, pdfWidth, Math.min(pdfHeight, 100));
          ctx.yPos += Math.min(pdfHeight, 100) + 10;
          
          // Add projects table
          addSectionHeader(ctx, "Liste des projets");
          
          const headers = ['#', 'Code', 'Nom', 'Statut', 'Budget'];
          const rows = projects.slice(0, 50).map((p, i) => [
            String(i + 1),
            p.code,
            p.name.substring(0, 25),
            projectStatusConfig[p.status]?.label || p.status,
            formatCurrency(p.total_budget)
          ]);
          
          addTable(ctx, headers, rows, [10, 25, 60, 30, 35]);
        }
      );
    } catch (err) {
      toast.error('Erreur lors de l\'export');
    }
  }, [projects, downloadPDF]);

  // Export Excel
  const handleExportExcel = useCallback(() => {
    const data = projects.map(p => ({
      'Code': p.code,
      'Nom': p.name,
      'Statut': projectStatusConfig[p.status]?.label || p.status,
      'Budget Total': p.total_budget,
      'Budget Consommé': p.consumed_budget,
      'Taux Exécution': p.total_budget > 0 ? Math.round((p.consumed_budget / p.total_budget) * 100) + '%' : '0%',
      'Latitude': p.latitude,
      'Longitude': p.longitude,
      'Localisation': p.location_name || p.site?.name || '',
      'Bailleurs': p.project_bailleurs?.map(pb => pb.bailleur?.short_name || pb.bailleur?.name).join(', ') || '',
      'Conventions': p.project_conventions?.map(pc => pc.convention?.code).join(', ') || '',
      'Début': p.start_date,
      'Fin': p.end_date,
      'Responsable': p.responsible?.full_name || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projets');
    XLSX.writeFile(wb, `projets-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel exporté');
  }, [projects]);

  if (error) {
    return (
      <AppLayout title="Carte des Projets" subtitle="Erreur">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-2">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <p className="text-destructive">Erreur lors du chargement des projets</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Carte Géographique des Projets" 
      subtitle="Visualisation spatiale des projets par bailleur"
    >
      <div className="space-y-4">
        {/* Statistics */}
        <ProjectsMapStats projects={projects} />

        {/* Filters */}
        <ProjectsMapFilters filters={filters} onFiltersChange={setFilters} />

        {/* Map Container */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Carte interactive</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {geolocatedCount} / {projects.length} géolocalisés
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={mapContainerRef} className="relative h-[600px]">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <ProjectsLeafletMap
                    projects={projects}
                    viewMode={viewMode}
                    canEditLocation={canUpdate}
                    onLocationUpdate={handleLocationUpdate}
                  />
                  <ProjectsMapControls
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onExportPNG={handleExportPNG}
                    onExportPDF={handleExportPDF}
                    onExportExcel={handleExportExcel}
                    canExport={true}
                  />
                  <ProjectsMapLegend projectCounts={projectCounts} />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Non-geolocated projects alert */}
        {projects.length > 0 && geolocatedCount < projects.length && (
          <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800 dark:text-orange-200">
                    {projects.length - geolocatedCount} projet(s) sans coordonnées
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                    Ces projets ne sont pas affichés sur la carte. Modifiez-les pour ajouter leur localisation.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {projects
                      .filter(p => !p.latitude || !p.longitude)
                      .slice(0, 5)
                      .map(p => (
                        <Badge key={p.id} variant="outline" className="text-orange-700 border-orange-300">
                          {p.code}
                        </Badge>
                      ))}
                    {projects.filter(p => !p.latitude || !p.longitude).length > 5 && (
                      <Badge variant="outline" className="text-orange-700 border-orange-300">
                        +{projects.filter(p => !p.latitude || !p.longitude).length - 5} autres
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
