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
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Search, 
  Edit,
  Eye,
  ScrollText,
  Key,
  Shield,
  Database,
  Clock,
  FileText
} from "lucide-react";
import { useSecurityPolicies, useSecurityPolicyMutations, SecurityPolicyType } from "@/hooks/useSecurityCompliance";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TableExportButtons } from "@/components/export/TableExportButtons";
import { useAuth } from "@/contexts/AuthContext";

const policyTypeConfig: Record<SecurityPolicyType, { label: string; icon: React.ReactNode }> = {
  mot_de_passe: { label: "Politique mot de passe", icon: <Key className="h-4 w-4" /> },
  acces: { label: "Politique d'accès", icon: <Shield className="h-4 w-4" /> },
  sauvegarde: { label: "Politique de sauvegarde", icon: <Database className="h-4 w-4" /> },
  conservation_donnees: { label: "Conservation des données", icon: <Clock className="h-4 w-4" /> },
};

export const SecurityPoliciesTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<any>(null);
  const [viewingPolicy, setViewingPolicy] = useState<any>(null);
  
  const { user } = useAuth();
  const { data: policies, isLoading } = useSecurityPolicies();
  const { createPolicy, updatePolicy } = useSecurityPolicyMutations();

  const [formData, setFormData] = useState({
    code: "",
    policy_type: "mot_de_passe" as SecurityPolicyType,
    name: "",
    description: "",
    content: "",
    version: "1.0",
    effective_date: new Date().toISOString().split('T')[0],
    requires_acknowledgment: false,
  });

  const filteredPolicies = policies?.filter(policy => {
    const matchesSearch = 
      policy.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || policy.policy_type === typeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const handleSubmit = async () => {
    if (editingPolicy) {
      await updatePolicy.mutateAsync({ id: editingPolicy.id, ...formData });
    } else {
      await createPolicy.mutateAsync({ ...formData, created_by: user?.id });
    }
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (policy: any) => {
    setEditingPolicy(policy);
    setFormData({
      code: policy.code,
      policy_type: policy.policy_type,
      name: policy.name,
      description: policy.description || "",
      content: policy.content,
      version: policy.version,
      effective_date: policy.effective_date,
      requires_acknowledgment: policy.requires_acknowledgment,
    });
    setDialogOpen(true);
  };

  const handleView = (policy: any) => {
    setViewingPolicy(policy);
    setViewDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPolicy(null);
    setFormData({
      code: "",
      policy_type: "mot_de_passe",
      name: "",
      description: "",
      content: "",
      version: "1.0",
      effective_date: new Date().toISOString().split('T')[0],
      requires_acknowledgment: false,
    });
  };

  const exportColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Nom" },
    { key: "policy_type", label: "Type", format: (value: any) => policyTypeConfig[value as SecurityPolicyType]?.label || value },
    { key: "version", label: "Version" },
    { key: "effective_date", label: "Date d'effet", format: (value: any) => format(new Date(value), "dd/MM/yyyy", { locale: fr }) },
    { key: "is_active", label: "Actif", format: (value: any) => value ? "Oui" : "Non" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5" />
                Politiques de sécurité
              </CardTitle>
              <CardDescription>
                Gestion des politiques de sécurité versionnées
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button variant="gradient">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle politique
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPolicy ? "Modifier la politique" : "Nouvelle politique de sécurité"}</DialogTitle>
                  <DialogDescription>
                    Définissez la politique de sécurité
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Code *</Label>
                      <Input
                        id="code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="POL-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="policy_type">Type *</Label>
                      <Select
                        value={formData.policy_type}
                        onValueChange={(v) => setFormData({ ...formData, policy_type: v as SecurityPolicyType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(policyTypeConfig).map(([key, config]) => (
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
                      <Label htmlFor="version">Version *</Label>
                      <Input
                        id="version"
                        value={formData.version}
                        onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                        placeholder="1.0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de la politique *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Politique de complexité des mots de passe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description courte de la politique..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Contenu de la politique *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Contenu détaillé de la politique..."
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="effective_date">Date d'effet *</Label>
                      <Input
                        id="effective_date"
                        type="date"
                        value={formData.effective_date}
                        onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-8">
                      <Switch
                        id="requires_acknowledgment"
                        checked={formData.requires_acknowledgment}
                        onCheckedChange={(checked) => setFormData({ ...formData, requires_acknowledgment: checked })}
                      />
                      <Label htmlFor="requires_acknowledgment">Exige une acceptation utilisateur</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                    Annuler
                  </Button>
                  <Button 
                    variant="gradient" 
                    onClick={handleSubmit} 
                    disabled={!formData.code || !formData.name || !formData.content}
                  >
                    {editingPolicy ? "Mettre à jour" : "Créer"}
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(policyTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TableExportButtons
              data={filteredPolicies}
              columns={exportColumns}
              filename="politiques_securite"
              title="Politiques de sécurité"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Date d'effet</TableHead>
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
                ) : filteredPolicies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune politique trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPolicies.map((policy) => {
                    const type = policyTypeConfig[policy.policy_type];
                    return (
                      <TableRow key={policy.id}>
                        <TableCell className="font-mono font-medium">{policy.code}</TableCell>
                        <TableCell>{policy.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            {type.icon}
                            {type.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">v{policy.version}</Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(policy.effective_date), "dd/MM/yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          {policy.is_active ? (
                            <Badge className="bg-success/10 text-success">Active</Badge>
                          ) : (
                            <Badge className="bg-muted text-muted-foreground">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleView(policy)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(policy)}>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewingPolicy?.name}
            </DialogTitle>
          </DialogHeader>
          {viewingPolicy && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-muted-foreground">Code</Label>
                  <p className="font-mono font-medium">{viewingPolicy.code}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Version</Label>
                  <Badge variant="secondary">v{viewingPolicy.version}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date d'effet</Label>
                  <p>{format(new Date(viewingPolicy.effective_date), "dd/MM/yyyy", { locale: fr })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  {viewingPolicy.is_active ? (
                    <Badge className="bg-success/10 text-success">Active</Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground">Inactive</Badge>
                  )}
                </div>
              </div>
              {viewingPolicy.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p>{viewingPolicy.description}</p>
                </div>
              )}
              <div>
                <Label className="text-muted-foreground">Contenu de la politique</Label>
                <div className="mt-2 rounded-md border bg-muted/50 p-4">
                  <pre className="whitespace-pre-wrap text-sm">{viewingPolicy.content}</pre>
                </div>
              </div>
              {viewingPolicy.requires_acknowledgment && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">Exige une acceptation utilisateur</Badge>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
