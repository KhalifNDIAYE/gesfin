import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, User, Calendar, Loader2 } from "lucide-react";
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

const actionLabels: Record<string, { label: string; className: string }> = {
  create: { label: "Création", className: "bg-success/10 text-success" },
  update: { label: "Modification", className: "bg-info/10 text-info" },
  delete: { label: "Suppression", className: "bg-destructive/10 text-destructive" },
};

const fieldLabels: Record<string, string> = {
  name: "Nom",
  description: "Description",
  status: "Statut",
  total_budget: "Budget total",
  start_date: "Date de début",
  end_date: "Date de fin",
  responsible_id: "Responsable",
  site_id: "Site",
  notes: "Notes",
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
        .limit(50);

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

  const getChanges = (oldValues: Record<string, any> | null, newValues: Record<string, any> | null) => {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];
    
    if (!oldValues && newValues) {
      // Creation
      Object.entries(newValues).forEach(([key, value]) => {
        if (fieldLabels[key] && value) {
          changes.push({ field: key, oldValue: null, newValue: value });
        }
      });
    } else if (oldValues && newValues) {
      // Update
      Object.keys({ ...oldValues, ...newValues }).forEach((key) => {
        if (fieldLabels[key] && oldValues[key] !== newValues[key]) {
          changes.push({ field: key, oldValue: oldValues[key], newValue: newValues[key] });
        }
      });
    }
    
    return changes;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des modifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length > 0 ? (
          <div className="space-y-4">
            {logs.map((log) => {
              const actionConfig = actionLabels[log.action] || { label: log.action, className: "bg-muted text-muted-foreground" };
              const changes = getChanges(log.old_values, log.new_values);

              return (
                <div key={log.id} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={actionConfig.className}>{actionConfig.label}</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="h-3 w-3" />
                        {log.user_email || "Système"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(log.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                  
                  {changes.length > 0 && (
                    <div className="space-y-2">
                      {changes.map((change, index) => (
                        <div key={index} className="text-sm">
                          <span className="font-medium">{fieldLabels[change.field] || change.field}:</span>{" "}
                          {change.oldValue && (
                            <span className="text-muted-foreground line-through mr-2">
                              {String(change.oldValue)}
                            </span>
                          )}
                          <span className="text-foreground">
                            {String(change.newValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Aucune modification enregistrée
          </p>
        )}
      </CardContent>
    </Card>
  );
}
