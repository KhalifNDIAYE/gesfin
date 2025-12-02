import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, BellOff, CheckCircle, Eye, Filter } from "lucide-react";
import { useBudgetAlerts, useMarkAlertRead, useResolveAlert } from "@/hooks/useBudget";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function BudgetAlertsPage() {
  const [filter, setFilter] = useState<string>("all");
  const { data: alerts, isLoading } = useBudgetAlerts();
  const markReadMutation = useMarkAlertRead();
  const resolveMutation = useResolveAlert();

  const filteredAlerts = alerts?.filter(alert => {
    if (filter === "unread") return !alert.is_read;
    if (filter === "unresolved") return !alert.is_resolved;
    if (filter === "warning") return alert.alert_type === "warning";
    if (filter === "critical") return alert.alert_type === "critical";
    if (filter === "overspent") return alert.alert_type === "overspent";
    return true;
  }) || [];

  const handleMarkRead = async (id: string) => {
    await markReadMutation.mutateAsync(id);
  };

  const handleResolve = async (id: string) => {
    await resolveMutation.mutateAsync(id);
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'overspent':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Dépassé</Badge>;
      case 'critical':
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Critique</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Attention</Badge>;
    }
  };

  const unreadCount = alerts?.filter(a => !a.is_read).length || 0;
  const unresolvedCount = alerts?.filter(a => !a.is_resolved).length || 0;

  return (
    <AppLayout
      title="Alertes Budgétaires"
      subtitle="Suivi et gestion des alertes"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Total Alertes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                Non Lues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Non Résolues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{unresolvedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Résolues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {(alerts?.length || 0) - unresolvedCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Liste des Alertes
                </CardTitle>
                <CardDescription>{filteredAlerts.length} alerte(s)</CardDescription>
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="unread">Non lues</SelectItem>
                  <SelectItem value="unresolved">Non résolues</SelectItem>
                  <SelectItem value="warning">Attention</SelectItem>
                  <SelectItem value="critical">Critiques</SelectItem>
                  <SelectItem value="overspent">Dépassées</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Seuil</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <BellOff className="h-8 w-8 opacity-50" />
                          <p>Aucune alerte</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAlerts.map((alert) => (
                      <TableRow key={alert.id} className={!alert.is_read ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}>
                        <TableCell>{getAlertBadge(alert.alert_type)}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className={`truncate ${!alert.is_read ? "font-medium" : ""}`}>
                            {alert.message}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{alert.budget?.code}</Badge>
                        </TableCell>
                        <TableCell>
                          {alert.threshold_reached ? `${alert.threshold_reached.toFixed(1)}%` : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {alert.created_at && format(new Date(alert.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {!alert.is_read && (
                              <Badge variant="outline" className="text-blue-500 border-blue-500/20">Nouveau</Badge>
                            )}
                            {alert.is_resolved ? (
                              <Badge variant="outline" className="text-green-500 border-green-500/20">Résolu</Badge>
                            ) : (
                              <Badge variant="outline" className="text-red-500 border-red-500/20">Actif</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {!alert.is_read && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleMarkRead(alert.id)}
                                disabled={markReadMutation.isPending}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            {!alert.is_resolved && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleResolve(alert.id)}
                                disabled={resolveMutation.isPending}
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
