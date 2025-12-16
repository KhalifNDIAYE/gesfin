import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  History,
  Filter,
  LogIn,
  LogOut,
  ShieldAlert,
  Download,
  Edit,
  Trash2,
  Eye
} from "lucide-react";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useBlockedActions } from "@/hooks/useBlockedActions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TableExportButtons } from "@/components/export/TableExportButtons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ModuleName } from "@/types/database";

const moduleLabels: Record<string, string> = {
  dashboard: "Tableau de bord",
  projets: "Projets",
  comptabilite: "Comptabilité",
  bailleurs: "Bailleurs",
  conventions: "Conventions",
  immobilisations: "Immobilisations",
  marches: "Marchés",
  decaissements: "Décaissements",
  rapports: "Rapports",
  utilisateurs: "Utilisateurs",
  securite: "Sécurité",
  parametres: "Paramètres",
};

const actionColors: Record<string, string> = {
  login: "bg-success/10 text-success",
  logout: "bg-info/10 text-info",
  login_failed: "bg-destructive/10 text-destructive",
  create: "bg-primary/10 text-primary",
  update: "bg-warning/10 text-warning",
  delete: "bg-destructive/10 text-destructive",
  export: "bg-info/10 text-info",
  validate: "bg-success/10 text-success",
  reject: "bg-destructive/10 text-destructive",
  blocked: "bg-destructive/10 text-destructive",
};

const getActionIcon = (action: string) => {
  if (action === 'login') return <LogIn className="h-4 w-4" />;
  if (action === 'logout') return <LogOut className="h-4 w-4" />;
  if (action === 'login_failed' || action === 'blocked') return <ShieldAlert className="h-4 w-4" />;
  if (action === 'export') return <Download className="h-4 w-4" />;
  if (action === 'update') return <Edit className="h-4 w-4" />;
  if (action === 'delete') return <Trash2 className="h-4 w-4" />;
  return <Eye className="h-4 w-4" />;
};

export const SecurityAuditLogTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [activeSubTab, setActiveSubTab] = useState("audit");
  
  const { data: auditLogs, isLoading: auditLoading } = useAuditLogs({ limit: 200 });
  const { data: blockedActions, isLoading: blockedLoading } = useBlockedActions();

  // Filter audit logs
  const filteredAuditLogs = auditLogs?.filter(log => {
    const matchesSearch = 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter;
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesModule && matchesAction;
  }) || [];

  // Filter blocked actions
  const filteredBlockedActions = blockedActions?.filter(action => {
    const matchesSearch = 
      action.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.action_attempted?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === "all" || action.module === moduleFilter;
    return matchesSearch && matchesModule;
  }) || [];

  // Get unique actions for filter
  const uniqueActions = [...new Set(auditLogs?.map(log => log.action) || [])];

  const auditExportColumns = [
    { key: "created_at", label: "Date", format: (value: any) => format(new Date(value), "dd/MM/yyyy HH:mm:ss", { locale: fr }) },
    { key: "user_email", label: "Utilisateur" },
    { key: "action", label: "Action" },
    { key: "module", label: "Module", format: (value: any) => moduleLabels[value] || value || "-" },
    { key: "resource_type", label: "Ressource", format: (value: any, row: any) => row?.resource_type ? `${row.resource_type} (${row.resource_id})` : "-" },
    { key: "ip_address", label: "IP" },
  ];

  const blockedExportColumns = [
    { key: "created_at", label: "Date", format: (value: any) => format(new Date(value), "dd/MM/yyyy HH:mm:ss", { locale: fr }) },
    { key: "user_email", label: "Utilisateur" },
    { key: "action_attempted", label: "Action tentée" },
    { key: "module", label: "Module", format: (value: any) => moduleLabels[value] || value || "-" },
    { key: "severity", label: "Sévérité" },
    { key: "ip_address", label: "IP" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Journal de sécurité
          </CardTitle>
          <CardDescription>
            Historique complet des actions et accès
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
            <TabsList>
              <TabsTrigger value="audit">Journal d'audit</TabsTrigger>
              <TabsTrigger value="blocked">Actions bloquées</TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap gap-4 mt-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {Object.entries(moduleLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeSubTab === "audit" && (
                <>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {uniqueActions.map((action) => (
                        <SelectItem key={action} value={action}>{action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <TableExportButtons
                    data={filteredAuditLogs}
                    columns={auditExportColumns}
                    filename="journal_audit"
                    title="Journal d'audit"
                  />
                </>
              )}
              {activeSubTab === "blocked" && (
                <TableExportButtons
                  data={filteredBlockedActions}
                  columns={blockedExportColumns}
                  filename="actions_bloquees"
                  title="Actions bloquées"
                />
              )}
            </div>

            <TabsContent value="audit" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Ressource</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Chargement...
                        </TableCell>
                      </TableRow>
                    ) : filteredAuditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucun événement trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAuditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Badge className={actionColors[log.action] || "bg-muted"}>
                              <span className="flex items-center gap-1">
                                {getActionIcon(log.action)}
                                {log.action}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.module ? (
                              <Badge variant="outline">{moduleLabels[log.module] || log.module}</Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>{log.user_email || "-"}</TableCell>
                          <TableCell className="text-sm">
                            {log.resource_type ? (
                              <span className="text-muted-foreground">
                                {log.resource_type}
                                {log.resource_id && <span className="font-mono text-xs"> ({log.resource_id.slice(0, 8)}...)</span>}
                              </span>
                            ) : "-"}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {log.ip_address || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="blocked" className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Action tentée</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Sévérité</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Chargement...
                        </TableCell>
                      </TableRow>
                    ) : filteredBlockedActions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Aucune action bloquée
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBlockedActions.map((action) => (
                        <TableRow key={action.id}>
                          <TableCell className="font-mono text-sm">
                            {format(new Date(action.created_at), "dd/MM/yyyy HH:mm:ss", { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-destructive/10 text-destructive">
                              <span className="flex items-center gap-1">
                                <ShieldAlert className="h-4 w-4" />
                                {action.action_attempted}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {moduleLabels[action.module] || action.module}
                            </Badge>
                          </TableCell>
                          <TableCell>{action.user_email || "-"}</TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                action.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                                action.severity === 'high' ? 'bg-warning/10 text-warning' :
                                'bg-info/10 text-info'
                              }
                            >
                              {action.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {action.ip_address || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
