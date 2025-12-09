import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  History, 
  User, 
  Calendar, 
  Loader2,
  FileSignature,
  Building2,
  RefreshCw,
  TrendingUp,
  Plus,
  Trash2,
  Edit
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectHistoryTabProps {
  projectId: string;
}

interface AuditLog {
  id: string;
  action: string;
  user_email: string | null;
  created_at: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
}

const actionConfig: Record<string, { label: string; className: string; icon: typeof History }> = {
  create: { label: "Création", className: "bg-success/10 text-success", icon: Plus },
  update: { label: "Modification", className: "bg-info/10 text-info", icon: Edit },
  delete: { label: "Suppression", className: "bg-destructive/10 text-destructive", icon: Trash2 },
  convention_added: { label: "Convention ajoutée", className: "bg-success/10 text-success", icon: FileSignature },
  convention_removed: { label: "Convention retirée", className: "bg-warning/10 text-warning", icon: FileSignature },
  convention_updated: { label: "Convention mise à jour", className: "bg-info/10 text-info", icon: FileSignature },
  bailleur_updated: { label: "Bailleur mis à jour", className: "bg-info/10 text-info", icon: Building2 },
  sync_bailleurs_from_conventions: { label: "Synchronisation bailleurs", className: "bg-primary/10 text-primary", icon: RefreshCw },
  recalculate_project_kpis: { label: "Recalcul KPIs", className: "bg-accent text-accent-foreground", icon: TrendingUp },
};

const fieldLabels: Record<string, string> = {
  name: "Nom",
  description: "Description",
  status: "Statut",
  total_budget: "Budget total",
  consumed_budget: "Budget consommé",
  start_date: "Date de début",
  end_date: "Date de fin",
  responsible_id: "Responsable",
  site_id: "Site",
  notes: "Notes",
  convention_id: "Convention",
  bailleur: "Bailleur",
  old_total: "Ancien montant",
  new_total: "Nouveau montant",
  old_disbursed: "Ancien décaissé",
  new_disbursed: "Nouveau décaissé",
  old_bailleur: "Ancien bailleur",
  new_bailleur: "Nouveau bailleur",
  execution_rate: "Taux d'exécution",
  bailleurs_count: "Nombre de bailleurs",
  details: "Détails",
};

export function ProjectHistoryTab({ projectId }: ProjectHistoryTabProps) {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['project-audit-logs', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('resource_type', 'project')
        .eq('resource_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as AuditLog[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'number') {
      if (value >= 1000000) return `${(value / 1000000).toLocaleString('fr-FR')} M`;
      return value.toLocaleString('fr-FR');
    }
    return String(value);
  };

  const getChanges = (oldValues: Record<string, any> | null, newValues: Record<string, any> | null) => {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    
    // Pour les actions de synchronisation, afficher les détails
    if (newValues?.details) {
      return [{ field: 'details', oldValue: null, newValue: newValues.details }];
    }
    
    if (!oldValues && newValues) {
      // Creation
      Object.entries(newValues).forEach(([key, value]) => {
        if (fieldLabels[key] && value !== null && value !== undefined) {
          changes.push({ field: key, oldValue: null, newValue: value });
        }
      });
    } else if (oldValues && newValues) {
      // Update - afficher les changements
      const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);
      allKeys.forEach((key) => {
        if (fieldLabels[key]) {
          const oldVal = oldValues[key];
          const newVal = newValues[key];
          if (oldVal !== newVal && (oldVal !== undefined || newVal !== undefined)) {
            changes.push({ field: key, oldValue: oldVal, newValue: newVal });
          }
        }
      });
    } else if (oldValues && !newValues) {
      // Delete
      Object.entries(oldValues).forEach(([key, value]) => {
        if (fieldLabels[key] && value !== null && value !== undefined) {
          changes.push({ field: key, oldValue: value, newValue: null });
        }
      });
    }
    
    return changes;
  };

  // Grouper les logs par jour
  const logsByDate = logs.reduce((acc, log) => {
    const date = new Date(log.created_at).toLocaleDateString('fr-FR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, AuditLog[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des modifications et synchronisations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(logsByDate).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(logsByDate).map(([date, dateLogs]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">{date}</span>
                  <Badge variant="outline" className="text-xs">
                    {dateLogs.length} action{dateLogs.length > 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="space-y-3 ml-6 border-l-2 border-muted pl-4">
                  {dateLogs.map((log) => {
                    const config = actionConfig[log.action] || { 
                      label: log.action, 
                      className: "bg-muted text-muted-foreground", 
                      icon: History 
                    };
                    const IconComponent = config.icon;
                    const changes = getChanges(log.old_values, log.new_values);

                    return (
                      <div key={log.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${config.className}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <Badge className={config.className}>{config.label}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {log.user_email || "Système"}
                            </div>
                            <span>{new Date(log.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                        
                        {changes.length > 0 && (
                          <div className="mt-3 space-y-1.5 text-sm">
                            {changes.map((change, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <span className="font-medium text-muted-foreground min-w-32">
                                  {fieldLabels[change.field] || change.field}:
                                </span>
                                <div className="flex-1">
                                  {change.oldValue !== null && change.oldValue !== undefined && (
                                    <span className="text-muted-foreground line-through mr-2">
                                      {formatValue(change.oldValue)}
                                    </span>
                                  )}
                                  {change.newValue !== null && change.newValue !== undefined && (
                                    <span className="text-foreground">
                                      {formatValue(change.newValue)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Aucune modification enregistrée
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              L'historique des synchronisations et modifications apparaîtra ici
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
