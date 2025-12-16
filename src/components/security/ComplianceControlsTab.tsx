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
  Download, 
  Filter,
  Edit,
  Trash2,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock
} from "lucide-react";
import { useComplianceControls, useComplianceControlMutations, ComplianceStandard, ComplianceStatus } from "@/hooks/useSecurityCompliance";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TableExportButtons } from "@/components/export/TableExportButtons";
import { useAuth } from "@/contexts/AuthContext";

const standardLabels: Record<ComplianceStandard, string> = {
  SOC2: "SOC 2",
  HIPAA: "HIPAA",
  RGPD: "RGPD",
  FedRAMP: "FedRAMP",
  ISO27001: "ISO 27001",
};

const statusConfig: Record<ComplianceStatus, { label: string; color: string; icon: React.ReactNode }> = {
  conforme: { label: "Conforme", color: "bg-success/10 text-success", icon: <CheckCircle2 className="h-4 w-4" /> },
  non_conforme: { label: "Non conforme", color: "bg-destructive/10 text-destructive", icon: <XCircle className="h-4 w-4" /> },
  a_ameliorer: { label: "À améliorer", color: "bg-warning/10 text-warning", icon: <AlertCircle className="h-4 w-4" /> },
  en_cours: { label: "En cours", color: "bg-info/10 text-info", icon: <Clock className="h-4 w-4" /> },
};

export const ComplianceControlsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [standardFilter, setStandardFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingControl, setEditingControl] = useState<any>(null);
  
  const { user } = useAuth();
  const { data: controls, isLoading } = useComplianceControls();
  const { createControl, updateControl, deleteControl } = useComplianceControlMutations();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    standard: "SOC2" as ComplianceStandard,
    status: "en_cours" as ComplianceStatus,
    evidence_description: "",
    notes: "",
  });

  const filteredControls = controls?.filter(control => {
    const matchesSearch = 
      control.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStandard = standardFilter === "all" || control.standard === standardFilter;
    const matchesStatus = statusFilter === "all" || control.status === statusFilter;
    return matchesSearch && matchesStandard && matchesStatus;
  }) || [];

  const handleSubmit = async () => {
    if (editingControl) {
      await updateControl.mutateAsync({ id: editingControl.id, ...formData });
    } else {
      await createControl.mutateAsync({ ...formData, created_by: user?.id });
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (control: any) => {
    setEditingControl(control);
    setFormData({
      code: control.code,
      name: control.name,
      description: control.description || "",
      standard: control.standard,
      status: control.status,
      evidence_description: control.evidence_description || "",
      notes: control.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce contrôle ?")) {
      await deleteControl.mutateAsync(id);
    }
  };

  const resetForm = () => {
    setEditingControl(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      standard: "SOC2",
      status: "en_cours",
      evidence_description: "",
      notes: "",
    });
  };

  const exportColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Nom" },
    { key: "standard", label: "Norme", format: (value: any) => standardLabels[value as ComplianceStandard] },
    { key: "status", label: "Statut", format: (value: any) => statusConfig[value as ComplianceStatus]?.label || value },
    { key: "last_verification_date", label: "Dernière vérification", format: (value: any) => value ? format(new Date(value), "dd/MM/yyyy", { locale: fr }) : "-" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Contrôles de conformité</CardTitle>
              <CardDescription>
                Gestion des contrôles SOC 2, HIPAA, RGPD, FedRAMP et ISO 27001
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau contrôle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingControl ? "Modifier le contrôle" : "Nouveau contrôle de conformité"}</DialogTitle>
                  <DialogDescription>
                    Définissez les informations du contrôle
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="SOC2-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="standard">Norme *</Label>
                      <Select
                        value={formData.standard}
                        onValueChange={(v) => setFormData({ ...formData, standard: v as ComplianceStandard })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(standardLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du contrôle *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contrôle d'accès physique"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description détaillée du contrôle..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Statut *</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v) => setFormData({ ...formData, status: v as ComplianceStatus })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([key, config]) => (
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
                  <div className="space-y-2">
                    <Label htmlFor="evidence">Preuve / Document</Label>
                    <Textarea
                      id="evidence"
                      value={formData.evidence_description}
                      onChange={(e) => setFormData({ ...formData, evidence_description: e.target.value })}
                      placeholder="Description de la preuve ou référence du document..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Annuler
                  </Button>
                  <Button variant="gradient" onClick={handleSubmit} disabled={!formData.code || !formData.name}>
                    {editingControl ? "Mettre à jour" : "Créer"}
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
            <Select value={standardFilter} onValueChange={setStandardFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Norme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {Object.entries(standardLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
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
              data={filteredControls}
              columns={exportColumns}
              filename="controles_conformite"
              title="Contrôles de conformité"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Norme</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière vérification</TableHead>
                  <TableHead>Preuve</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredControls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun contrôle trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredControls.map((control) => {
                    const status = statusConfig[control.status];
                    return (
                      <TableRow key={control.id}>
                        <TableCell className="font-mono font-medium">{control.code}</TableCell>
                        <TableCell>{control.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{standardLabels[control.standard]}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            <span className="flex items-center gap-1">
                              {status.icon}
                              {status.label}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {control.last_verification_date 
                            ? format(new Date(control.last_verification_date), "dd/MM/yyyy", { locale: fr })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {control.evidence_document_path ? (
                            <Button variant="ghost" size="sm">
                              <FileText className="h-4 w-4" />
                            </Button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(control)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(control.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
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
    </div>
  );
};
