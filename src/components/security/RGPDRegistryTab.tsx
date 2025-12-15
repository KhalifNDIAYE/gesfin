import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  FileText
} from "lucide-react";
import { useRGPDRegistry, useRGPDRegistryMutations } from "@/hooks/useSecurityCompliance";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TableExportButtons } from "@/components/export/TableExportButtons";
import { useAuth } from "@/contexts/AuthContext";

export const RGPDRegistryTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [viewingEntry, setViewingEntry] = useState<any>(null);
  
  const { user } = useAuth();
  const { data: registry, isLoading } = useRGPDRegistry();
  const { createEntry, updateEntry, deleteEntry } = useRGPDRegistryMutations();

  const [formData, setFormData] = useState({
    treatment_name: "",
    purpose: "",
    data_categories: [] as string[],
    legal_basis: "",
    retention_period: "",
    data_subjects: "",
    security_measures: "",
    subprocessors: [] as string[],
    cross_border_transfers: false,
    transfer_details: "",
    notes: "",
  });

  const filteredRegistry = registry?.filter(entry => {
    return entry.treatment_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           entry.purpose.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const handleSubmit = async () => {
    if (editingEntry) {
      await updateEntry.mutateAsync({ id: editingEntry.id, ...formData });
    } else {
      await createEntry.mutateAsync({ ...formData, created_by: user?.id });
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      treatment_name: entry.treatment_name,
      purpose: entry.purpose,
      data_categories: entry.data_categories || [],
      legal_basis: entry.legal_basis,
      retention_period: entry.retention_period,
      data_subjects: entry.data_subjects || "",
      security_measures: entry.security_measures || "",
      subprocessors: entry.subprocessors || [],
      cross_border_transfers: entry.cross_border_transfers,
      transfer_details: entry.transfer_details || "",
      notes: entry.notes || "",
    });
    setDialogOpen(true);
  };

  const handleView = (entry: any) => {
    setViewingEntry(entry);
    setViewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce traitement ?")) {
      await deleteEntry.mutateAsync(id);
    }
  };

  const resetForm = () => {
    setEditingEntry(null);
    setFormData({
      treatment_name: "",
      purpose: "",
      data_categories: [],
      legal_basis: "",
      retention_period: "",
      data_subjects: "",
      security_measures: "",
      subprocessors: [],
      cross_border_transfers: false,
      transfer_details: "",
      notes: "",
    });
  };

  const legalBases = [
    "Consentement",
    "Exécution d'un contrat",
    "Obligation légale",
    "Intérêts vitaux",
    "Mission d'intérêt public",
    "Intérêts légitimes",
  ];

  const exportColumns = [
    { header: "Traitement", accessor: "treatment_name" },
    { header: "Finalité", accessor: "purpose" },
    { header: "Base légale", accessor: "legal_basis" },
    { header: "Conservation", accessor: "retention_period" },
    { header: "Transfert hors UE", accessor: (row: any) => row.cross_border_transfers ? "Oui" : "Non" },
    { header: "Actif", accessor: (row: any) => row.is_active ? "Oui" : "Non" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Registre des traitements (RGPD)
              </CardTitle>
              <CardDescription>
                Registre obligatoire des traitements de données personnelles
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau traitement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingEntry ? "Modifier le traitement" : "Nouveau traitement"}</DialogTitle>
                  <DialogDescription>
                    Décrivez le traitement de données personnelles
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="treatment_name">Nom du traitement *</Label>
                    <Input
                      id="treatment_name"
                      value={formData.treatment_name}
                      onChange={(e) => setFormData({ ...formData, treatment_name: e.target.value })}
                      placeholder="Gestion des utilisateurs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Finalité du traitement *</Label>
                    <Textarea
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      placeholder="Gestion des comptes utilisateurs et authentification..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_categories">Catégories de données *</Label>
                    <Input
                      id="data_categories"
                      value={formData.data_categories.join(", ")}
                      onChange={(e) => setFormData({ ...formData, data_categories: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                      placeholder="Nom, Email, Téléphone (séparés par des virgules)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data_subjects">Personnes concernées</Label>
                    <Input
                      id="data_subjects"
                      value={formData.data_subjects}
                      onChange={(e) => setFormData({ ...formData, data_subjects: e.target.value })}
                      placeholder="Utilisateurs de l'application"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="legal_basis">Base légale *</Label>
                      <select
                        id="legal_basis"
                        value={formData.legal_basis}
                        onChange={(e) => setFormData({ ...formData, legal_basis: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Sélectionner...</option>
                        {legalBases.map((basis) => (
                          <option key={basis} value={basis}>{basis}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retention_period">Durée de conservation *</Label>
                      <Input
                        id="retention_period"
                        value={formData.retention_period}
                        onChange={(e) => setFormData({ ...formData, retention_period: e.target.value })}
                        placeholder="3 ans après la fin du contrat"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="security_measures">Mesures de sécurité</Label>
                    <Textarea
                      id="security_measures"
                      value={formData.security_measures}
                      onChange={(e) => setFormData({ ...formData, security_measures: e.target.value })}
                      placeholder="Chiffrement, contrôle d'accès, audit logs..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subprocessors">Sous-traitants</Label>
                    <Input
                      id="subprocessors"
                      value={formData.subprocessors.join(", ")}
                      onChange={(e) => setFormData({ ...formData, subprocessors: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                      placeholder="Nom des sous-traitants (séparés par des virgules)"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="cross_border"
                      checked={formData.cross_border_transfers}
                      onCheckedChange={(checked) => setFormData({ ...formData, cross_border_transfers: checked })}
                    />
                    <Label htmlFor="cross_border">Transfert hors UE</Label>
                  </div>
                  {formData.cross_border_transfers && (
                    <div className="space-y-2">
                      <Label htmlFor="transfer_details">Détails du transfert</Label>
                      <Textarea
                        id="transfer_details"
                        value={formData.transfer_details}
                        onChange={(e) => setFormData({ ...formData, transfer_details: e.target.value })}
                        placeholder="Pays, garanties appropriées..."
                      />
                    </div>
                  )}
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
                  <Button 
                    variant="gradient" 
                    onClick={handleSubmit} 
                    disabled={!formData.treatment_name || !formData.purpose || !formData.legal_basis || !formData.retention_period}
                  >
                    {editingEntry ? "Mettre à jour" : "Créer"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search & Export */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un traitement..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <TableExportButtons
              data={filteredRegistry}
              columns={exportColumns}
              filename="registre_rgpd"
              title="Registre RGPD"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Traitement</TableHead>
                  <TableHead>Finalité</TableHead>
                  <TableHead>Base légale</TableHead>
                  <TableHead>Conservation</TableHead>
                  <TableHead>Transfert hors UE</TableHead>
                  <TableHead>Statut</TableHead>
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
                ) : filteredRegistry.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun traitement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRegistry.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.treatment_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{entry.purpose}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{entry.legal_basis}</Badge>
                      </TableCell>
                      <TableCell>{entry.retention_period}</TableCell>
                      <TableCell>
                        {entry.cross_border_transfers ? (
                          <Badge className="bg-warning/10 text-warning">Oui</Badge>
                        ) : (
                          <Badge className="bg-success/10 text-success">Non</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {entry.is_active ? (
                          <Badge className="bg-success/10 text-success">Actif</Badge>
                        ) : (
                          <Badge className="bg-muted text-muted-foreground">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleView(entry)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
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
            <DialogTitle>Détail du traitement</DialogTitle>
          </DialogHeader>
          {viewingEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Traitement</Label>
                  <p className="font-medium">{viewingEntry.treatment_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Base légale</Label>
                  <p className="font-medium">{viewingEntry.legal_basis}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Finalité</Label>
                <p>{viewingEntry.purpose}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Catégories de données</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {viewingEntry.data_categories?.map((cat: string) => (
                    <Badge key={cat} variant="secondary">{cat}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Personnes concernées</Label>
                  <p>{viewingEntry.data_subjects || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Durée de conservation</Label>
                  <p>{viewingEntry.retention_period}</p>
                </div>
              </div>
              {viewingEntry.security_measures && (
                <div>
                  <Label className="text-muted-foreground">Mesures de sécurité</Label>
                  <p>{viewingEntry.security_measures}</p>
                </div>
              )}
              {viewingEntry.subprocessors?.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Sous-traitants</Label>
                  <p>{viewingEntry.subprocessors.join(", ")}</p>
                </div>
              )}
              {viewingEntry.cross_border_transfers && viewingEntry.transfer_details && (
                <div>
                  <Label className="text-muted-foreground">Détails transfert hors UE</Label>
                  <p>{viewingEntry.transfer_details}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
