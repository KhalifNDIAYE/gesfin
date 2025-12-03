import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Shield, 
  ShieldAlert, 
  ShieldX, 
  Search, 
  Download, 
  Calendar,
  Monitor,
  Smartphone,
  Tablet,
  AlertTriangle,
  AlertCircle,
  Info,
  Eye,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useBlockedActions, useBlockedActionsStats, BlockedAction } from '@/hooks/useBlockedActions';
import { MODULE_NAMES, PERMISSION_LABELS } from '@/types/database';

const SEVERITY_CONFIG = {
  critical: { label: 'Critique', icon: ShieldX, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  medium: { label: 'Moyen', icon: ShieldAlert, className: 'bg-warning/10 text-warning border-warning/20' },
  low: { label: 'Faible', icon: Shield, className: 'bg-muted text-muted-foreground' },
};

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

const MODULE_LABELS: Record<string, string> = {
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

const ACTION_LABELS: Record<string, string> = {
  read: 'Lecture',
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
  validate: 'Validation',
  export: 'Export',
  import: 'Import',
};

export default function BlockedActionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<BlockedAction | null>(null);

  const { data: stats, isLoading: statsLoading } = useBlockedActionsStats();
  const { data: blockedActions, isLoading: actionsLoading } = useBlockedActions({
    module: moduleFilter !== 'all' ? moduleFilter : undefined,
    severity: severityFilter !== 'all' ? severityFilter : undefined,
    search: searchQuery || undefined,
  });

  const filteredActions = useMemo(() => {
    if (!blockedActions) return [];
    return blockedActions.filter(action => {
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        return (
          action.user_email?.toLowerCase().includes(search) ||
          action.user_full_name?.toLowerCase().includes(search) ||
          action.module?.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [blockedActions, searchQuery]);

  const handleExportCSV = () => {
    if (!filteredActions.length) return;

    const headers = [
      'Date/Heure',
      'Utilisateur',
      'Email',
      'Rôles',
      'Module',
      'Action',
      'Sévérité',
      'Source',
      'Navigateur',
      'OS',
      'Device',
    ];

    const rows = filteredActions.map(action => [
      format(new Date(action.timestamp), 'dd/MM/yyyy HH:mm:ss'),
      action.user_full_name || '',
      action.user_email || '',
      (action.user_roles || []).join(', '),
      MODULE_LABELS[action.module] || action.module,
      ACTION_LABELS[action.action_attempted] || action.action_attempted,
      SEVERITY_CONFIG[action.severity as keyof typeof SEVERITY_CONFIG]?.label || action.severity,
      action.block_source,
      action.browser || '',
      action.operating_system || '',
      action.device_type || '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tentatives-bloquees-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const isLoading = statsLoading || actionsLoading;

  return (
    <AppLayout title="Tentatives Bloquées" subtitle="Journalisation des actions refusées par le système de permissions">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Total blocages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                  <ShieldX className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.critical || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Critiques</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <ShieldAlert className="h-5 w-5 text-warning" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.today || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <Calendar className="h-5 w-5 text-info" />
                </div>
                <div>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold">{stats?.thisWeek || 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Cette semaine</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par utilisateur, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les modules</SelectItem>
                {MODULE_NAMES.map(module => (
                  <SelectItem key={module} value={module}>
                    {MODULE_LABELS[module] || module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Sévérité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="critical">Critique</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} disabled={!filteredActions.length}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Journal des Actions Bloquées</CardTitle>
            <CardDescription>
              {filteredActions.length} entrée(s) trouvée(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredActions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold">Aucune tentative bloquée</h3>
                <p className="text-sm text-muted-foreground">
                  Toutes les actions sont conformes aux permissions
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Heure</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Rôle(s)</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Sévérité</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead className="text-right">Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActions.map((action) => {
                      const severityConfig = SEVERITY_CONFIG[action.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.low;
                      const SeverityIcon = severityConfig.icon;
                      const DeviceIcon = DEVICE_ICONS[action.device_type as keyof typeof DEVICE_ICONS] || Monitor;

                      return (
                        <TableRow key={action.id}>
                          <TableCell className="whitespace-nowrap">
                            <div className="text-sm">
                              {format(new Date(action.timestamp), 'dd/MM/yyyy', { locale: fr })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(action.timestamp), 'HH:mm:ss')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{action.user_full_name || '-'}</div>
                            <div className="text-xs text-muted-foreground">{action.user_email}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {(action.user_roles || []).map((role, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {MODULE_LABELS[action.module] || action.module}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {ACTION_LABELS[action.action_attempted] || action.action_attempted}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={severityConfig.className}>
                              <SeverityIcon className="h-3 w-3 mr-1" />
                              {severityConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm capitalize">{action.block_source}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{action.browser}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedAction(action)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la Tentative Bloquée</DialogTitle>
            <DialogDescription>
              Informations complètes sur l'action refusée
            </DialogDescription>
          </DialogHeader>
          {selectedAction && (
            <div className="space-y-6">
              {/* User Info */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" /> Informations Utilisateur
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nom:</span>
                    <span className="ml-2 font-medium">{selectedAction.user_full_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <span className="ml-2 font-medium">{selectedAction.user_email}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID:</span>
                    <span className="ml-2 font-mono text-xs">{selectedAction.user_id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rôles:</span>
                    <span className="ml-2">{(selectedAction.user_roles || []).join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Technical Info */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Monitor className="h-4 w-4" /> Informations Techniques
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Navigateur:</span>
                    <span className="ml-2">{selectedAction.browser}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">OS:</span>
                    <span className="ml-2">{selectedAction.operating_system}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Device:</span>
                    <span className="ml-2 capitalize">{selectedAction.device_type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">URL:</span>
                    <span className="ml-2 text-xs truncate">{selectedAction.request_url}</span>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4" /> Informations Sécurité
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Module:</span>
                    <span className="ml-2">{MODULE_LABELS[selectedAction.module] || selectedAction.module}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Action:</span>
                    <span className="ml-2">{ACTION_LABELS[selectedAction.action_attempted] || selectedAction.action_attempted}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Permission requise:</span>
                    <span className="ml-2">{selectedAction.permission_required}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Permissions détenues:</span>
                    <span className="ml-2">{(selectedAction.permissions_held || []).join(', ') || 'Aucune'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Source blocage:</span>
                    <span className="ml-2 capitalize">{selectedAction.block_source}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sévérité:</span>
                    <Badge variant="outline" className={SEVERITY_CONFIG[selectedAction.severity as keyof typeof SEVERITY_CONFIG]?.className}>
                      {SEVERITY_CONFIG[selectedAction.severity as keyof typeof SEVERITY_CONFIG]?.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Temporal Info */}
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Informations Temporelles
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Date/Heure:</span>
                    <span className="ml-2">{format(new Date(selectedAction.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Fuseau horaire:</span>
                    <span className="ml-2">{selectedAction.timezone || 'UTC'}</span>
                  </div>
                </div>
              </div>

              {selectedAction.resource_type && (
                <div>
                  <h4 className="font-semibold mb-2">Ressource ciblée</h4>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2">{selectedAction.resource_type}</span>
                    {selectedAction.resource_id && (
                      <>
                        <span className="ml-4 text-muted-foreground">ID:</span>
                        <span className="ml-2 font-mono text-xs">{selectedAction.resource_id}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
