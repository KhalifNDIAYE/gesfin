import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Bell,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Filter
} from "lucide-react";
import { useSecurityAlerts } from "@/hooks/useSecurityCompliance";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TableExportButtons } from "@/components/export/TableExportButtons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const severityConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  info: { label: "Info", color: "bg-info/10 text-info", icon: <AlertCircle className="h-4 w-4" /> },
  warning: { label: "Attention", color: "bg-warning/10 text-warning", icon: <AlertTriangle className="h-4 w-4" /> },
  error: { label: "Erreur", color: "bg-destructive/10 text-destructive", icon: <XCircle className="h-4 w-4" /> },
  critical: { label: "Critique", color: "bg-destructive text-destructive-foreground", icon: <XCircle className="h-4 w-4" /> },
};

export const SecurityAlertsTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: alerts, isLoading } = useSecurityAlerts();
  const queryClient = useQueryClient();

  const filteredAlerts = alerts?.filter(alert => {
    const matchesSearch = 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "resolved" ? alert.is_resolved : !alert.is_resolved);
    return matchesSearch && matchesSeverity && matchesStatus;
  }) || [];

  const handleResolve = async (id: string) => {
    const { error } = await supabase
      .from('security_alerts')
      .update({ 
        is_resolved: true, 
        resolved_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      toast.error("Erreur lors de la résolution de l'alerte");
    } else {
      toast.success("Alerte marquée comme résolue");
      queryClient.invalidateQueries({ queryKey: ['security-alerts'] });
    }
  };

  const exportColumns = [
    { header: "Date", accessor: (row: any) => format(new Date(row.created_at), "dd/MM/yyyy HH:mm", { locale: fr }) },
    { header: "Titre", accessor: "title" },
    { header: "Type", accessor: "alert_type" },
    { header: "Sévérité", accessor: (row: any) => severityConfig[row.severity]?.label || row.severity },
    { header: "Statut", accessor: (row: any) => row.is_resolved ? "Résolu" : "Actif" },
  ];

  // Stats
  const activeAlerts = alerts?.filter(a => !a.is_resolved).length || 0;
  const criticalAlerts = alerts?.filter(a => a.severity === 'critical' && !a.is_resolved).length || 0;
  const warningAlerts = alerts?.filter(a => a.severity === 'warning' && !a.is_resolved).length || 0;
  const resolvedToday = alerts?.filter(a => {
    if (!a.resolved_at) return false;
    const today = new Date();
    const resolved = new Date(a.resolved_at);
    return resolved.toDateString() === today.toDateString();
  }).length || 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{activeAlerts}</p>
              <p className="text-sm text-muted-foreground">Alertes actives</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">{criticalAlerts}</p>
              <p className="text-sm text-muted-foreground">Critiques</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">{warningAlerts}</p>
              <p className="text-sm text-muted-foreground">Avertissements</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{resolvedToday}</p>
              <p className="text-sm text-muted-foreground">Résolues aujourd'hui</p>
            </div>
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
            Alertes générées automatiquement par le système
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
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="resolved">Résolues</SelectItem>
              </SelectContent>
            </Select>
            <TableExportButtons
              data={filteredAlerts}
              columns={exportColumns}
              filename="alertes_securite"
              title="Alertes de sécurité"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Statut</TableHead>
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
                ) : filteredAlerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucune alerte trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlerts.map((alert) => {
                    const severity = severityConfig[alert.severity] || severityConfig.info;
                    return (
                      <TableRow key={alert.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{alert.title}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {alert.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{alert.alert_type}</Badge>
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
                          {alert.is_resolved ? (
                            <Badge className="bg-success/10 text-success">
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Résolu
                            </Badge>
                          ) : (
                            <Badge className="bg-destructive/10 text-destructive">
                              Actif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!alert.is_resolved && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleResolve(alert.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Résoudre
                            </Button>
                          )}
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
