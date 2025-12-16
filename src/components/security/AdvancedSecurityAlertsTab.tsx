import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Bell,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Info,
  Eye,
  UserCheck,
  MessageSquare,
  Clock,
  User,
  MapPin,
  Monitor,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { 
  useAlertEvents,
  useAlertEventMutations,
  useAlertHistory,
  useAlertEngineStats,
  AlertSeverityLevel,
  AlertCategory,
  AlertStatus,
  SecurityAlertEvent,
} from "@/hooks/useSecurityAlertEngine";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TableExportButtons } from "@/components/export/TableExportButtons";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

const severityConfig: Record<AlertSeverityLevel, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  info: { label: "Info", color: "text-info", bgColor: "bg-info/10", icon: <Info className="h-4 w-4" /> },
  low: { label: "Faible", color: "text-success", bgColor: "bg-success/10", icon: <AlertCircle className="h-4 w-4" /> },
  medium: { label: "Moyen", color: "text-warning", bgColor: "bg-warning/10", icon: <AlertTriangle className="h-4 w-4" /> },
  high: { label: "Élevé", color: "text-orange-500", bgColor: "bg-orange-500/10", icon: <AlertTriangle className="h-4 w-4" /> },
  critical: { label: "Critique", color: "text-destructive", bgColor: "bg-destructive/10", icon: <XCircle className="h-4 w-4" /> },
};

const statusConfig: Record<AlertStatus, { label: string; color: string }> = {
  new: { label: "Nouvelle", color: "bg-destructive/10 text-destructive" },
  acknowledged: { label: "Prise en compte", color: "bg-blue-500/10 text-blue-500" },
  in_progress: { label: "En cours", color: "bg-warning/10 text-warning" },
  resolved: { label: "Résolue", color: "bg-success/10 text-success" },
  ignored: { label: "Ignorée", color: "bg-muted text-muted-foreground" },
  escalated: { label: "Escaladée", color: "bg-purple-500/10 text-purple-500" },
};

const categoryConfig: Record<AlertCategory, { label: string; color: string }> = {
  authentication: { label: "Auth", color: "#3b82f6" },
  authorization: { label: "Perms", color: "#8b5cf6" },
  data_access: { label: "Data", color: "#22c55e" },
  system: { label: "Système", color: "#f97316" },
  compliance: { label: "Conformité", color: "#ec4899" },
};

export const AdvancedSecurityAlertsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<SecurityAlertEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  
  const { data: alerts, isLoading } = useAlertEvents();
  const { data: stats } = useAlertEngineStats();
  const { updateStatus, addComment } = useAlertEventMutations();
  const { data: alertHistory } = useAlertHistory(selectedAlert?.id || '');

  const filteredAlerts = alerts?.filter(alert => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || alert.category === categoryFilter;
    return matchesSearch && matchesSeverity && matchesStatus && matchesCategory;
  }) || [];

  const handleStatusChange = (alertId: string, status: AlertStatus, comment?: string) => {
    updateStatus.mutate({ id: alertId, status, comment });
  };

  const handleAddComment = () => {
    if (selectedAlert && newComment.trim()) {
      addComment.mutate({ alert_id: selectedAlert.id, comment: newComment });
      setNewComment("");
    }
  };

  const exportColumns = [
    { key: "created_at", label: "Date", format: (v: string) => format(new Date(v), "dd/MM/yyyy HH:mm", { locale: fr }) },
    { key: "title", label: "Titre" },
    { key: "category", label: "Catégorie", format: (v: AlertCategory) => categoryConfig[v]?.label || v },
    { key: "severity", label: "Sévérité", format: (v: AlertSeverityLevel) => severityConfig[v]?.label || v },
    { key: "status", label: "Statut", format: (v: AlertStatus) => statusConfig[v]?.label || v },
    { key: "user_email", label: "Utilisateur" },
    { key: "ip_address", label: "IP" },
    { key: "risk_score", label: "Score" },
  ];

  // Charts data
  const severityChartData = stats ? [
    { name: 'Critique', value: stats.bySeverity.critical, color: '#ef4444' },
    { name: 'Élevé', value: stats.bySeverity.high, color: '#f97316' },
    { name: 'Moyen', value: stats.bySeverity.medium, color: '#eab308' },
    { name: 'Faible', value: stats.bySeverity.low, color: '#22c55e' },
    { name: 'Info', value: stats.bySeverity.info, color: '#3b82f6' },
  ].filter(d => d.value > 0) : [];

  const categoryChartData = stats ? Object.entries(stats.byCategory).map(([key, value]) => ({
    name: categoryConfig[key as AlertCategory]?.label || key,
    value,
    color: categoryConfig[key as AlertCategory]?.color || '#666',
  })) : [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-primary">{stats?.openAlerts || 0}</p>
                <p className="text-sm text-muted-foreground">Alertes ouvertes</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-destructive">{stats?.bySeverity.critical || 0}</p>
                <p className="text-sm text-muted-foreground">Critiques</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-success">{stats?.resolvedAlerts || 0}</p>
                <p className="text-sm text-muted-foreground">Résolues</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats?.avgResolutionTime || 0}m</p>
                <p className="text-sm text-muted-foreground">Temps moyen</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">{stats?.alertsThisWeek || 0}</p>
                {stats?.weekTrend !== undefined && (
                  <span className={`text-xs flex items-center ${stats.weekTrend > 0 ? 'text-destructive' : 'text-success'}`}>
                    {stats.weekTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(stats.weekTrend)}%
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Cette semaine</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Par sévérité</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={severityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={categoryChartData} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={80} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertes de sécurité
          </CardTitle>
          <CardDescription>
            Gestion et traitement des alertes détectées par le moteur
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
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
              data={filteredAlerts}
              columns={exportColumns}
              filename="alertes_securite_avancees"
              title="Alertes de sécurité"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Alerte</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Utilisateur</TableHead>
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
                ) : filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune alerte trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert) => {
                    const severity = severityConfig[alert.severity];
                    const status = statusConfig[alert.status];
                    const category = categoryConfig[alert.category];
                    return (
                      <TableRow key={alert.id} className="cursor-pointer hover:bg-muted/50" onClick={() => { setSelectedAlert(alert); setIsDetailOpen(true); }}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(alert.created_at), "dd/MM HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {alert.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{ borderColor: category?.color, color: category?.color }}>
                            {category?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${severity.bgColor} ${severity.color}`}>
                            <span className="flex items-center gap-1">
                              {severity.icon}
                              {severity.label}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {alert.user_email ? (
                            <div className="text-sm">
                              <p>{alert.user_email}</p>
                              {alert.ip_address && (
                                <p className="text-xs text-muted-foreground">{alert.ip_address}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedAlert(alert); setIsDetailOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
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

      {/* Alert Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedAlert && severityConfig[selectedAlert.severity].icon}
              {selectedAlert?.title}
            </DialogTitle>
            <DialogDescription>{selectedAlert?.description}</DialogDescription>
          </DialogHeader>
          
          {selectedAlert && (
            <Tabs defaultValue="details" className="flex-1 overflow-hidden">
              <TabsList>
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="evidence">Preuves</TabsTrigger>
                <TabsTrigger value="history">Historique</TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1 mt-4">
                <TabsContent value="details" className="space-y-4 pr-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Sévérité</Label>
                      <Badge className={`${severityConfig[selectedAlert.severity].bgColor} ${severityConfig[selectedAlert.severity].color}`}>
                        {severityConfig[selectedAlert.severity].label}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Score de risque</Label>
                      <p className="font-mono text-lg">{selectedAlert.risk_score}/100</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Catégorie</Label>
                      <p>{categoryConfig[selectedAlert.category].label}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Type d'événement</Label>
                      <p className="font-mono text-sm">{selectedAlert.event_type}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground flex items-center gap-1 mb-2">
                      <User className="h-4 w-4" /> Contexte utilisateur
                    </Label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Email:</span> {selectedAlert.user_email || '-'}</div>
                      <div><span className="text-muted-foreground">IP:</span> {selectedAlert.ip_address || '-'}</div>
                      <div><span className="text-muted-foreground">Localisation:</span> {selectedAlert.location || '-'}</div>
                      <div><span className="text-muted-foreground">Pays:</span> {selectedAlert.country_code || '-'}</div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground mb-2">Statut actuel</Label>
                    <div className="flex gap-2 flex-wrap">
                      {(Object.keys(statusConfig) as AlertStatus[]).map((status) => (
                        <Button
                          key={status}
                          variant={selectedAlert.status === status ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleStatusChange(selectedAlert.id, status)}
                          disabled={updateStatus.isPending}
                        >
                          {statusConfig[status].label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground flex items-center gap-1 mb-2">
                      <MessageSquare className="h-4 w-4" /> Ajouter un commentaire
                    </Label>
                    <div className="flex gap-2">
                      <Textarea 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Votre commentaire..."
                        rows={2}
                      />
                      <Button onClick={handleAddComment} disabled={!newComment.trim() || addComment.isPending}>
                        Envoyer
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="evidence" className="space-y-4 pr-4">
                  <div>
                    <Label className="text-muted-foreground">Données de l'événement</Label>
                    <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto max-h-[200px]">
                      {JSON.stringify(selectedAlert.event_data, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Preuves collectées</Label>
                    <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-auto max-h-[200px]">
                      {JSON.stringify(selectedAlert.evidence, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">User Agent</Label>
                    <p className="text-xs mt-1 font-mono">{selectedAlert.user_agent || '-'}</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="pr-4">
                  <div className="space-y-3">
                    {alertHistory?.map((h) => (
                      <div key={h.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-medium text-sm">{h.action}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(h.performed_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                            </p>
                          </div>
                          {h.from_status && h.to_status && (
                            <p className="text-xs text-muted-foreground">
                              {statusConfig[h.from_status]?.label} → {statusConfig[h.to_status]?.label}
                            </p>
                          )}
                          {h.comment && (
                            <p className="text-sm mt-1">{h.comment}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!alertHistory || alertHistory.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">Aucun historique</p>
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
