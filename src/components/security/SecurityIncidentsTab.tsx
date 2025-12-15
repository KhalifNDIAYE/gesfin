import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Search, 
  Edit,
  Eye,
  AlertTriangle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { useSecurityIncidents, useSecurityIncidentMutations, IncidentSeverity, IncidentStatus } from "@/hooks/useSecurityCompliance";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TableExportButtons } from "@/components/export/TableExportButtons";
import { useAuth } from "@/contexts/AuthContext";

const severityConfig: Record<IncidentSeverity, { label: string; color: string; icon: React.ReactNode }> = {
  mineur: { label: "Mineur", color: "bg-info/10 text-info", icon: <AlertCircle className="h-4 w-4" /> },
  majeur: { label: "Majeur", color: "bg-warning/10 text-warning", icon: <AlertTriangle className="h-4 w-4" /> },
  critique: { label: "Critique", color: "bg-destructive/10 text-destructive", icon: <XCircle className="h-4 w-4" /> },
};

const statusConfig: Record<IncidentStatus, { label: string; color: string }> = {
  ouvert: { label: "Ouvert", color: "bg-destructive/10 text-destructive" },
  en_cours: { label: "En cours", color: "bg-warning/10 text-warning" },
  clos: { label: "Clos", color: "bg-success/10 text-success" },
};

export const SecurityIncidentsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);
  const [viewingIncident, setViewingIncident] = useState<any>(null);
  
  const { user } = useAuth();
  const { data: incidents, isLoading } = useSecurityIncidents();
  const { createIncident, updateIncident } = useSecurityIncidentMutations();

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    severity: "mineur" as IncidentSeverity,
    status: "ouvert" as IncidentStatus,
    impact: "",
    affected_systems: [] as string[],
    corrective_actions: "",
    preventive_actions: "",
    notes: "",
  });

  const filteredIncidents = incidents?.filter(incident => {
    const matchesSearch = 
      incident.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "all" || incident.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  }) || [];

  const handleSubmit = async () => {
    const code = formData.code || `INC-${Date.now().toString(36).toUpperCase()}`;
    if (editingIncident) {
      await updateIncident.mutateAsync({ id: editingIncident.id, ...formData });
    } else {
      await createIncident.mutateAsync({ ...formData, code, reported_by: user?.id });
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (incident: any) => {
    setEditingIncident(incident);
    setFormData({
      code: incident.code,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      impact: incident.impact || "",
      affected_systems: incident.affected_systems || [],
      corrective_actions: incident.corrective_actions || "",
      preventive_actions: incident.preventive_actions || "",
      notes: incident.notes || "",
    });
    setDialogOpen(true);
  };

  const handleView = (incident: any) => {
    setViewingIncident(incident);
    setViewDialogOpen(true);
  };

  const resetForm = () => {
    setEditingIncident(null);
    setFormData({
      code: "",
      title: "",
      description: "",
      severity: "mineur",
      status: "ouvert",
      impact: "",
      affected_systems: [],
      corrective_actions: "",
      preventive_actions: "",
      notes: "",
    });
  };

  const exportColumns = [
    { header: "Code", accessor: "code" },
    { header: "Titre", accessor: "title" },
    { header: "Sévérité", accessor: (row: any) => severityConfig[row.severity as IncidentSeverity].label },
    { header: "Statut", accessor: (row: any) => statusConfig[row.status as IncidentStatus].label },
    { header: "Date détection", accessor: (row: any) => format(new Date(row.detection_date), "dd/MM/yyyy HH:mm", { locale: fr }) },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">
                {incidents?.filter(i => i.status !== 'clos').length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Incidents ouverts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">
                {incidents?.filter(i => i.severity === 'critique' && i.status !== 'clos').length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Critiques</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">
                {incidents?.filter(i => i.status === 'en_cours').length || 0}
              </p>
              <p className="text-sm text-muted-foreground">En cours</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {incidents?.filter(i => i.status === 'clos').length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Résolus</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Incidents de sécurité
              </CardTitle>
              <CardDescription>
                Déclaration et suivi des incidents de sécurité
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Déclarer un incident
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingIncident ? "Modifier l'incident" : "Déclarer un incident"}</DialogTitle>
                  <DialogDescription>
                    Décrivez l'incident de sécurité
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Code</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="Auto-généré si vide"
                        disabled={!!editingIncident}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="severity">Sévérité *</Label>
                      <Select
                        value={formData.severity}
                        onValueChange={(v) => setFormData({ ...formData, severity: v as IncidentSeverity })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(severityConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                {config.icon}
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Titre de l'incident"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description détaillée de l'incident..."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="impact">Impact</Label>
                    <Textarea
                      id="impact"
                      value={formData.impact}
                      onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                      placeholder="Impact sur les opérations..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="affected_systems">Systèmes affectés</Label>
                    <Input
                      id="affected_systems"
                      value={formData.affected_systems.join(", ")}
                      onChange={(e) => setFormData({ ...formData, affected_systems: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                      placeholder="Séparés par des virgules"
                    />
                  </div>
                  {editingIncident && (
                    <div className="space-y-2">
                      <Label htmlFor="status">Statut</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) => setFormData({ ...formData, status: v as IncidentStatus })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="corrective_actions">Actions correctives</Label>
                    <Textarea
                      id="corrective_actions"
                      value={formData.corrective_actions}
                      onChange={(e) => setFormData({ ...formData, corrective_actions: e.target.value })}
                      placeholder="Actions entreprises pour résoudre l'incident..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preventive_actions">Actions préventives</Label>
                    <Textarea
                      id="preventive_actions"
                      value={formData.preventive_actions}
                      onChange={(e) => setFormData({ ...formData, preventive_actions: e.target.value })}
                      placeholder="Actions pour éviter la récurrence..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Annuler
                  </Button>
                  <Button 
                    variant="gradient" 
                    onClick={handleSubmit} 
                    disabled={!formData.title || !formData.description}
                  >
                    {editingIncident ? "Mettre à jour" : "Déclarer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {Object.entries(severityConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TableExportButtons
              data={filteredIncidents}
              columns={exportColumns}
              filename="incidents_securite"
              title="Incidents de sécurité"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date détection</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredIncidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun incident trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIncidents.map((incident) => {
                    const severity = severityConfig[incident.severity];
                    const status = statusConfig[incident.status];
                    return (
                      <TableRow key={incident.id}>
                        <TableCell className="font-mono font-medium">{incident.code}</TableCell>
                        <TableCell>{incident.title}</TableCell>
                        <TableCell>
                          <Badge className={severity.color}>
                            <span className="flex items-center gap-1">
                              {severity.icon}
                              {severity.label}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(incident.detection_date), "dd/MM/yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleView(incident)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(incident)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail de l'incident</DialogTitle>
          </DialogHeader>
          {viewingIncident && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Code</Label>
                  <p className="font-mono font-medium">{viewingIncident.code}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sévérité</Label>
                  <Badge className={severityConfig[viewingIncident.severity as IncidentSeverity].color}>
                    {severityConfig[viewingIncident.severity as IncidentSeverity].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <Badge className={statusConfig[viewingIncident.status as IncidentStatus].color}>
                    {statusConfig[viewingIncident.status as IncidentStatus].label}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Titre</Label>
                <p className="font-medium">{viewingIncident.title}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p>{viewingIncident.description}</p>
              </div>
              {viewingIncident.impact && (
                <div>
                  <Label className="text-muted-foreground">Impact</Label>
                  <p>{viewingIncident.impact}</p>
                </div>
              )}
              {viewingIncident.affected_systems?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Systèmes affectés</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {viewingIncident.affected_systems.map((sys: string) => (
                      <Badge key={sys} variant="secondary">{sys}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {viewingIncident.corrective_actions && (
                <div>
                  <Label className="text-muted-foreground">Actions correctives</Label>
                  <p>{viewingIncident.corrective_actions}</p>
                </div>
              )}
              {viewingIncident.preventive_actions && (
                <div>
                  <Label className="text-muted-foreground">Actions préventives</Label>
                  <p>{viewingIncident.preventive_actions}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Date de détection</Label>
                  <p>{format(new Date(viewingIncident.detection_date), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                </div>
                {viewingIncident.resolution_date && (
                  <div>
                    <Label className="text-muted-foreground">Date de résolution</Label>
                    <p>{format(new Date(viewingIncident.resolution_date), "dd/MM/yyyy HH:mm", { locale: fr })}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
