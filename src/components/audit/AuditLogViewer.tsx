import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuditLogs, AuditLog } from '@/hooks/useAuditLogs';
import { History, Search, Filter, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ModuleName } from '@/types/database';

const moduleLabels: Record<string, string> = {
  dashboard: 'Tableau de bord',
  projets: 'Projets',
  comptabilite: 'Comptabilité',
  bailleurs: 'Bailleurs',
  conventions: 'Conventions',
  immobilisations: 'Immobilisations',
  marches: 'Marchés',
  decaissements: 'Décaissements',
  rapports: 'Rapports',
  utilisateurs: 'Utilisateurs',
  securite: 'Sécurité',
  parametres: 'Paramètres',
};

const actionColors: Record<string, string> = {
  login: 'bg-success/10 text-success',
  logout: 'bg-muted text-muted-foreground',
  create: 'bg-primary/10 text-primary',
  update: 'bg-warning/10 text-warning',
  delete: 'bg-destructive/10 text-destructive',
  view: 'bg-info/10 text-info',
  export: 'bg-info/10 text-info',
  failed_login: 'bg-destructive/10 text-destructive',
};

const getActionColor = (action: string): string => {
  const lowerAction = action.toLowerCase();
  for (const [key, color] of Object.entries(actionColors)) {
    if (lowerAction.includes(key)) return color;
  }
  return 'bg-muted text-muted-foreground';
};

interface AuditLogViewerProps {
  limit?: number;
  showFilters?: boolean;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ 
  limit = 100,
  showFilters = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<ModuleName | 'all'>('all');
  
  const { data: logs, isLoading } = useAuditLogs({ 
    module: moduleFilter !== 'all' ? moduleFilter : undefined,
    limit,
  });

  const filteredLogs = logs?.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.user_email?.toLowerCase().includes(search) ||
      log.resource_type?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Journal d'audit
        </CardTitle>
        <CardDescription>Historique des actions et événements</CardDescription>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={moduleFilter} onValueChange={(value) => setModuleFilter(value as ModuleName | 'all')}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Tous les modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                {Object.entries(moduleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          {filteredLogs?.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Aucun événement trouvé</p>
          ) : (
            filteredLogs?.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors"
              >
                <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: fr })}
                </span>
                <Badge variant="secondary" className={getActionColor(log.action)}>
                  {log.action}
                </Badge>
                {log.module && (
                  <Badge variant="outline">
                    {moduleLabels[log.module] || log.module}
                  </Badge>
                )}
                <span className="font-medium text-sm truncate">
                  {log.user_email || 'Système'}
                </span>
                {log.resource_type && (
                  <span className="text-sm text-muted-foreground truncate">
                    {log.resource_type}
                    {log.resource_id && ` #${log.resource_id.slice(0, 8)}`}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
