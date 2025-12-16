import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Settings2,
  Plus,
  Edit2,
  Trash2,
  Shield,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Info,
  Zap,
} from "lucide-react";
import { 
  useAlertRules, 
  useAlertRuleMutations,
  AlertCategory,
  AlertSeverityLevel,
  SecurityAlertRule
} from "@/hooks/useSecurityAlertEngine";
import { TableExportButtons } from "@/components/export/TableExportButtons";

const severityConfig: Record<AlertSeverityLevel, { label: string; color: string; icon: React.ReactNode }> = {
  info: { label: "Info", color: "bg-info/10 text-info", icon: <Info className="h-4 w-4" /> },
  low: { label: "Faible", color: "bg-success/10 text-success", icon: <AlertCircle className="h-4 w-4" /> },
  medium: { label: "Moyen", color: "bg-warning/10 text-warning", icon: <AlertTriangle className="h-4 w-4" /> },
  high: { label: "Élevé", color: "bg-orange-500/10 text-orange-500", icon: <AlertTriangle className="h-4 w-4" /> },
  critical: { label: "Critique", color: "bg-destructive text-destructive-foreground", icon: <XCircle className="h-4 w-4" /> },
};

const categoryConfig: Record<AlertCategory, { label: string; color: string }> = {
  authentication: { label: "Authentification", color: "bg-blue-500/10 text-blue-500" },
  authorization: { label: "Autorisation", color: "bg-purple-500/10 text-purple-500" },
  data_access: { label: "Accès données", color: "bg-green-500/10 text-green-500" },
  system: { label: "Système", color: "bg-orange-500/10 text-orange-500" },
  compliance: { label: "Conformité", color: "bg-pink-500/10 text-pink-500" },
};

export const AlertRulesTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editingRule, setEditingRule] = useState<SecurityAlertRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: rules, isLoading } = useAlertRules();
  const { toggleRule, deleteRule } = useAlertRuleMutations();

  const filteredRules = rules?.filter(rule => {
    const matchesSearch = 
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || rule.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const handleToggle = (rule: SecurityAlertRule) => {
    toggleRule.mutate({ id: rule.id, is_enabled: !rule.is_enabled });
  };

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette règle ?")) {
      deleteRule.mutate(id);
    }
  };

  const exportColumns = [
    { key: "code", label: "Code" },
    { key: "name", label: "Nom" },
    { key: "category", label: "Catégorie", format: (v: AlertCategory) => categoryConfig[v]?.label || v },
    { key: "severity", label: "Sévérité", format: (v: AlertSeverityLevel) => severityConfig[v]?.label || v },
    { key: "risk_score", label: "Score risque" },
    { key: "threshold_count", label: "Seuil" },
    { key: "threshold_window_minutes", label: "Fenêtre (min)" },
    { key: "is_enabled", label: "Actif", format: (v: boolean) => v ? "Oui" : "Non" },
  ];

  // Stats
  const enabledRules = rules?.filter(r => r.is_enabled).length || 0;
  const criticalRules = rules?.filter(r => r.severity === 'critical').length || 0;
  const authRules = rules?.filter(r => r.category === 'authentication').length || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{rules?.length || 0}</p>
              <p className="text-sm text-muted-foreground">Règles totales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{enabledRules}</p>
              <p className="text-sm text-muted-foreground">Actives</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">{criticalRules}</p>
              <p className="text-sm text-muted-foreground">Critiques</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{authRules}</p>
              <p className="text-sm text-muted-foreground">Authentification</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Règles d'alertes
          </CardTitle>
          <CardDescription>
            Configuration des règles de détection automatique
          </CardDescription>
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TableExportButtons
              data={filteredRules}
              columns={exportColumns}
              filename="regles_alertes"
              title="Règles d'alertes"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Seuil</TableHead>
                  <TableHead>Actions auto</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucune règle trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map((rule) => {
                    const severity = severityConfig[rule.severity];
                    const category = categoryConfig[rule.category];
                    return (
                      <TableRow key={rule.id}>
                        <TableCell className="font-mono text-sm">{rule.code}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{rule.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                              {rule.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={category.color}>{category.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={severity.color}>
                            <span className="flex items-center gap-1">
                              {severity.icon}
                              {severity.label}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono">{rule.risk_score}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {rule.threshold_count}x / {rule.threshold_window_minutes}min
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {rule.auto_actions?.slice(0, 2).map((action, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {action.replace('_', ' ')}
                              </Badge>
                            ))}
                            {rule.auto_actions && rule.auto_actions.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{rule.auto_actions.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch 
                            checked={rule.is_enabled}
                            onCheckedChange={() => handleToggle(rule)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => {
                                setEditingRule(rule);
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
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

      {/* Rule Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Détail de la règle
            </DialogTitle>
            <DialogDescription>
              Configuration et paramètres de la règle d'alerte
            </DialogDescription>
          </DialogHeader>
          
          {editingRule && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Code</Label>
                  <Input value={editingRule.code} disabled />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input value={editingRule.name} disabled />
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea value={editingRule.description || ''} disabled rows={2} />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Catégorie</Label>
                  <Badge className={categoryConfig[editingRule.category].color}>
                    {categoryConfig[editingRule.category].label}
                  </Badge>
                </div>
                <div>
                  <Label>Sévérité</Label>
                  <Badge className={severityConfig[editingRule.severity].color}>
                    {severityConfig[editingRule.severity].label}
                  </Badge>
                </div>
                <div>
                  <Label>Score de risque</Label>
                  <p className="font-mono text-lg">{editingRule.risk_score}/100</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Seuil de déclenchement</Label>
                  <p className="text-sm">{editingRule.threshold_count} événement(s)</p>
                </div>
                <div>
                  <Label>Fenêtre temporelle</Label>
                  <p className="text-sm">{editingRule.threshold_window_minutes} minute(s)</p>
                </div>
              </div>
              
              <div>
                <Label>Actions automatiques</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {editingRule.auto_actions?.map((action, i) => (
                    <Badge key={i} variant="outline">
                      <Zap className="h-3 w-3 mr-1" />
                      {action.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Canaux de notification</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {editingRule.notify_channels?.map((channel, i) => (
                    <Badge key={i} variant="secondary">{channel}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Temps de cooldown</Label>
                  <p className="text-sm">{editingRule.cooldown_minutes} minute(s)</p>
                </div>
                <div>
                  <Label>Type d'événement</Label>
                  <p className="font-mono text-sm">{editingRule.event_type}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
