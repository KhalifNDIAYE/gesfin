import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, FileSpreadsheet, PieChart } from "lucide-react";
import { useAnalyticalAllocations } from "@/hooks/useComptabiliteAnalytique";
import { useTrackingAxes, useFiscalYears } from "@/hooks/useParametrage";
import { useProjects } from "@/hooks/useProjects";
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
import * as XLSX from 'xlsx';
import { usePDFGeneration } from "@/hooks/usePDFGeneration";
import { addTable, addSectionHeader } from "@/utils/pdfTemplate";

export function AnalyticalAllocationsTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<string>("all");
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<string>("");

  const { data: fiscalYears } = useFiscalYears();
  const { data: activities } = useTrackingAxes();
  const { projects } = useProjects();
  const currentFiscalYear = fiscalYears?.find(fy => fy.is_current);

  const { data: allocations, isLoading } = useAnalyticalAllocations({
    fiscal_year_id: selectedFiscalYear || currentFiscalYear?.id,
  });

  // Get unique zones from allocations
  const uniqueZones = useMemo(() => {
    const zones = new Map<string, { id: string; code: string; name: string }>();
    allocations?.forEach(alloc => {
      if (alloc.geographic_zone) {
        zones.set(alloc.geographic_zone.id, alloc.geographic_zone);
      }
    });
    return Array.from(zones.values());
  }, [allocations]);

  // Filter allocations
  const filteredAllocations = useMemo(() => {
    if (!allocations) return [];

    return allocations.filter(alloc => {
      // Search filter
      const searchMatch = 
        alloc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alloc.activity?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alloc.component?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alloc.geographic_zone?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Activity filter
      const activityMatch = selectedActivity === "all" || alloc.activity_id === selectedActivity;
      
      // Zone filter
      const zoneMatch = selectedZone === "all" || alloc.geographic_zone_id === selectedZone;
      
      // Project filter - for now we match based on description containing project name
      const projectMatch = selectedProject === "all" || true; // TODO: Link to project if needed

      return (searchQuery === "" || searchMatch) && activityMatch && zoneMatch && projectMatch;
    });
  }, [allocations, searchQuery, selectedActivity, selectedZone, selectedProject]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedActivity("all");
    setSelectedZone("all");
    setSelectedProject("all");
  };

  const exportToExcel = () => {
    const data = filteredAllocations.map(alloc => ({
      "Dépense": alloc.description || "-",
      "Activité": alloc.activity ? `${alloc.activity.code} - ${alloc.activity.name}` : "-",
      "Composante": alloc.component ? `${alloc.component.code} - ${alloc.component.name}` : "-",
      "Zone": alloc.geographic_zone ? `${alloc.geographic_zone.code} - ${alloc.geographic_zone.name}` : "-",
      "Montant": Number(alloc.amount) || 0,
      "Pourcentage": alloc.percentage ? `${alloc.percentage}%` : "-",
      "Type": alloc.allocation_type,
      "Méthode": alloc.allocation_method,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Affectations Analytiques");
    XLSX.writeFile(wb, `affectations_analytiques_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const { downloadPDF } = usePDFGeneration();

  const exportToPDF = async () => {
    await downloadPDF(
      {
        title: "Affectations Analytiques",
        documentDate: new Date(),
        documentRef: `ANA-${new Date().toISOString().split('T')[0]}`,
        auditModule: "comptabilite",
        auditResourceType: "export",
      },
      `affectations_analytiques_${new Date().toISOString().split('T')[0]}.pdf`,
      (ctx) => {
        addSectionHeader(ctx, "Affectations Analytiques");
        
        const headers = ['Dépense', 'Activité', 'Composante', 'Zone', 'Montant'];
        const rows = filteredAllocations.slice(0, 100).map(alloc => [
          (alloc.description || "-").substring(0, 25),
          alloc.activity?.code || "-",
          alloc.component?.code || "-",
          alloc.geographic_zone?.code || "-",
          Number(alloc.amount).toLocaleString('fr-FR')
        ]);
        
        addTable(ctx, headers, rows, [50, 30, 30, 30, 30]);
      }
    );
  };

  const totalAmount = useMemo(() => {
    return filteredAllocations.reduce((sum, alloc) => sum + (Number(alloc.amount) || 0), 0);
  }, [filteredAllocations]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Affectations Analytiques
            </CardTitle>
            <CardDescription>
              {filteredAllocations.length} affectation(s) - Total: {totalAmount.toLocaleString('fr-FR')} FCFA
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedActivity} onValueChange={setSelectedActivity}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Activité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les activités</SelectItem>
              {activities?.map((act) => (
                <SelectItem key={act.id} value={act.id}>
                  {act.code} - {act.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les zones</SelectItem>
              {uniqueZones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.code} - {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedFiscalYear || currentFiscalYear?.id || ""}
            onValueChange={setSelectedFiscalYear}
          >
            <SelectTrigger className="w-[150px]">
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

          {(searchQuery || selectedActivity !== "all" || selectedZone !== "all" || selectedProject !== "all") && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dépense</TableHead>
                <TableHead>Activité</TableHead>
                <TableHead>Composante</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredAllocations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucune affectation trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredAllocations.map((alloc) => (
                  <TableRow key={alloc.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{alloc.description || "Sans description"}</span>
                        <span className="text-xs text-muted-foreground">
                          {alloc.allocation_method === 'a_priori' ? 'A priori' : 
                           alloc.allocation_method === 'a_posteriori' ? 'A posteriori' : 'Réimputation'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {alloc.activity ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {alloc.activity.code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {alloc.component ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {alloc.component.code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {alloc.geographic_zone ? (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          {alloc.geographic_zone.code}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {Number(alloc.amount).toLocaleString('fr-FR')} FCFA
                      {alloc.percentage && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({alloc.percentage}%)
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
