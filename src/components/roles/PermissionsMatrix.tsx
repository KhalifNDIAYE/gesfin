import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Shield, 
  Search, 
  Plus, 
  Copy, 
  Trash2, 
  RotateCcw, 
  Download, 
  FileSpreadsheet,
  Loader2,
  Check,
  X,
  Lock,
  Info
} from 'lucide-react';
import { useRoles, Role, usePermissions as useAllPermissions, useGrantPermission, useRevokePermission, useCreateRole, useDeleteRole } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logAction } from '@/hooks/useAuditLogs';
import { RoleDialog } from './RoleDialog';

// Module config type
interface ModuleConfigItem {
  label: string;
  permissions: string[];
  permissionLabels: Record<string, string>;
  adminOnly?: boolean;
}

// Module definitions with their permissions
const MODULE_CONFIG: Record<string, ModuleConfigItem> = {
  dashboard: {
    label: 'Tableau de bord',
    permissions: ['read'],
    permissionLabels: { read: 'Voir' },
    adminOnly: false
  },
  comptabilite: {
    label: 'Comptabilité',
    permissions: ['read', 'create', 'update', 'delete'],
    permissionLabels: { read: 'Voir', create: 'Créer', update: 'Modifier', delete: 'Supprimer' },
    adminOnly: false
  },
  projets: {
    label: 'Projets',
    permissions: ['read', 'create', 'update', 'delete'],
    permissionLabels: { read: 'Voir', create: 'Créer', update: 'Modifier', delete: 'Supprimer' },
    adminOnly: false
  },
  bailleurs: {
    label: 'Bailleurs',
    permissions: ['read', 'create', 'update', 'delete'],
    permissionLabels: { read: 'Voir', create: 'Créer', update: 'Modifier', delete: 'Supprimer' },
    adminOnly: false
  },
  conventions: {
    label: 'Conventions',
    permissions: ['read', 'create', 'update', 'delete'],
    permissionLabels: { read: 'Voir', create: 'Créer', update: 'Modifier', delete: 'Supprimer' },
    adminOnly: false
  },
  decaissements: {
    label: 'Décaissements',
    permissions: ['read', 'create', 'update', 'delete'],
    permissionLabels: { read: 'Voir', create: 'Créer', update: 'Modifier', delete: 'Supprimer' },
    adminOnly: false
  },
  immobilisations: {
    label: 'Immobilisations',
    permissions: ['read', 'create', 'update', 'delete'],
    permissionLabels: { read: 'Voir', create: 'Créer', update: 'Modifier', delete: 'Supprimer' },
    adminOnly: false
  },
  marches: {
    label: 'Marchés',
    permissions: ['read', 'create', 'update', 'delete'],
    permissionLabels: { read: 'Voir', create: 'Créer', update: 'Modifier', delete: 'Supprimer' },
    adminOnly: false
  },
  rapports: {
    label: 'Rapports',
    permissions: ['read', 'create'],
    permissionLabels: { read: 'Voir', create: 'Exporter' },
    adminOnly: false
  },
  utilisateurs: {
    label: 'Utilisateurs (Admin)',
    permissions: ['read', 'create', 'update', 'delete'],
    permissionLabels: { read: 'Voir', create: 'Créer', update: 'Modifier', delete: 'Supprimer' },
    adminOnly: true
  },
  securite: {
    label: 'Sécurité (Admin)',
    permissions: ['read', 'create', 'update', 'delete'],
    permissionLabels: { read: 'Voir', create: 'Créer', update: 'Modifier', delete: 'Supprimer' },
    adminOnly: true
  },
  parametres: {
    label: 'Paramètres (Admin)',
    permissions: ['read', 'create', 'update', 'delete'],
    permissionLabels: { read: 'Voir', create: 'Créer', update: 'Modifier', delete: 'Supprimer' },
    adminOnly: true
  },
};

type ModuleKey = keyof typeof MODULE_CONFIG;

interface RolePermissions {
  [permissionId: string]: boolean;
}

interface RolePermissionsMap {
  [roleId: string]: RolePermissions;
}

export const PermissionsMatrix = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogMode, setRoleDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [duplicateRole, setDuplicateRole] = useState<Role | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [savingPermission, setSavingPermission] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const { data: allPermissions, isLoading: permissionsLoading } = useAllPermissions();
  const grantPermission = useGrantPermission();
  const revokePermission = useRevokePermission();
  const createRole = useCreateRole();
  const deleteRole = useDeleteRole();

  // Fetch role_permissions mapping
  const { data: rolePermissionsData } = useQuery({
    queryKey: ['role-permissions-matrix'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role_id, permission_id');
      
      if (error) throw error;
      
      const map: RolePermissionsMap = {};
      data.forEach(rp => {
        if (!map[rp.role_id]) map[rp.role_id] = {};
        map[rp.role_id][rp.permission_id] = true;
      });
      return map;
    },
  });

  // Build permission lookup by module+permission type
  const permissionLookup = useMemo(() => {
    const lookup: Record<string, string> = {};
    allPermissions?.forEach(p => {
      lookup[`${p.module}:${p.permission}`] = p.id;
    });
    return lookup;
  }, [allPermissions]);

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!roles) return [];
    return roles.filter(role => 
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [roles, searchTerm]);

  // Filter modules based on filter
  const filteredModules = useMemo(() => {
    const modules = Object.entries(MODULE_CONFIG);
    if (moduleFilter === 'all') return modules;
    if (moduleFilter === 'admin') return modules.filter(([_, config]) => config.adminOnly);
    if (moduleFilter === 'business') return modules.filter(([_, config]) => !config.adminOnly);
    return modules;
  }, [moduleFilter]);

  const hasPermission = (roleId: string, module: string, permission: string): boolean => {
    const permId = permissionLookup[`${module}:${permission}`];
    if (!permId) return false;
    return rolePermissionsData?.[roleId]?.[permId] || false;
  };

  const handlePermissionToggle = async (
    roleId: string, 
    roleName: string,
    module: string, 
    permission: string, 
    currentValue: boolean
  ) => {
    const permId = permissionLookup[`${module}:${permission}`];
    if (!permId) {
      toast.error('Permission non trouvée');
      return;
    }

    // Prevent modifying admin role
    if (roleName === 'admin') {
      toast.error('Les permissions du rôle Administrateur ne peuvent pas être modifiées');
      return;
    }

    // Prevent non-admin roles from getting admin permissions
    const moduleConfig = MODULE_CONFIG[module as ModuleKey];
    if (moduleConfig?.adminOnly && !currentValue) {
      toast.error('Seul le rôle Administrateur peut avoir accès à ce module');
      return;
    }

    setSavingPermission(`${roleId}:${module}:${permission}`);

    try {
      const oldValue = currentValue ? 'activé' : 'désactivé';
      const newValue = !currentValue ? 'activé' : 'désactivé';

      if (currentValue) {
        await revokePermission.mutateAsync({ roleId, permissionId: permId });
      } else {
        await grantPermission.mutateAsync({ roleId, permissionId: permId });
      }

      // Log the change
      await logAction(
        'permission_change',
        'securite',
        'role_permission',
        roleId,
        { role: roleName, module, permission, status: oldValue },
        { role: roleName, module, permission, status: newValue }
      );

      queryClient.invalidateQueries({ queryKey: ['role-permissions-matrix'] });
    } catch (error) {
      toast.error('Erreur lors de la modification de la permission');
    } finally {
      setSavingPermission(null);
    }
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setRoleDialogMode('create');
    setRoleDialogOpen(true);
  };

  const handleDuplicateRole = async () => {
    if (!duplicateRole || !duplicateName.trim()) return;

    try {
      // Create new role
      const { data: newRole, error: createError } = await supabase
        .from('roles')
        .insert({ name: duplicateName, description: `Copie de ${duplicateRole.name}` })
        .select()
        .single();

      if (createError) throw createError;

      // Copy permissions
      const existingPerms = rolePermissionsData?.[duplicateRole.id];
      if (existingPerms) {
        const newPerms = Object.keys(existingPerms)
          .filter(permId => {
            // Don't copy admin module permissions
            const perm = allPermissions?.find(p => p.id === permId);
            if (perm) {
              const config = MODULE_CONFIG[perm.module as ModuleKey];
              return !config?.adminOnly;
            }
            return false;
          })
          .map(permId => ({
            role_id: newRole.id,
            permission_id: permId,
          }));

        if (newPerms.length > 0) {
          await supabase.from('role_permissions').insert(newPerms);
        }
      }

      await logAction('role_duplicate', 'securite', 'role', newRole.id, 
        { sourceRole: duplicateRole.name },
        { newRole: duplicateName }
      );

      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions-matrix'] });
      toast.success('Rôle dupliqué avec succès');
      setDuplicateRole(null);
      setDuplicateName('');
    } catch (error) {
      toast.error('Erreur lors de la duplication du rôle');
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleId) return;

    const roleToDelete = roles?.find(r => r.id === deleteRoleId);
    if (roleToDelete?.is_system) {
      toast.error('Impossible de supprimer un rôle système');
      setDeleteRoleId(null);
      return;
    }

    // Check if role has users
    const { count } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', deleteRoleId);

    if (count && count > 0) {
      toast.error(`Ce rôle est attribué à ${count} utilisateur(s). Retirez-le d'abord.`);
      setDeleteRoleId(null);
      return;
    }

    await deleteRole.mutateAsync(deleteRoleId);
    await logAction('role_delete', 'securite', 'role', deleteRoleId, 
      { roleName: roleToDelete?.name }, 
      null
    );
    setDeleteRoleId(null);
  };

  const exportMatrix = async (format: 'csv' | 'json') => {
    if (!roles || !allPermissions) return;

    const data = roles.map(role => {
      const row: Record<string, any> = { role: role.name, description: role.description };
      
      Object.entries(MODULE_CONFIG).forEach(([module, config]) => {
        config.permissions.forEach(perm => {
          const key = `${config.label} - ${config.permissionLabels[perm as keyof typeof config.permissionLabels]}`;
          row[key] = hasPermission(role.id, module, perm) ? 'Oui' : 'Non';
        });
      });
      
      return row;
    });

    if (format === 'csv') {
      const headers = Object.keys(data[0] || {});
      const csv = [
        headers.join(';'),
        ...data.map(row => headers.map(h => row[h]).join(';'))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `matrice_permissions_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `matrice_permissions_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }

    toast.success('Export réalisé avec succès');
  };

  const isLoading = rolesLoading || permissionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un rôle..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les modules</SelectItem>
              <SelectItem value="business">Modules métier</SelectItem>
              <SelectItem value="admin">Administration</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportMatrix('csv')}>
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            Exporter CSV
          </Button>
          <Button variant="gradient" onClick={handleCreateRole}>
            <Plus className="h-4 w-4" />
            Nouveau rôle
          </Button>
        </div>
      </div>

      {/* Matrix Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Matrice des Permissions
          </CardTitle>
          <CardDescription>
            Gérez les permissions de chaque rôle. Les modifications sont sauvegardées automatiquement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="min-w-[800px]">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="sticky left-0 z-20 bg-muted/50 p-3 text-left font-medium border-b border-r min-w-[200px]">
                      Module / Permission
                    </th>
                    {filteredRoles.map(role => (
                      <th key={role.id} className="p-3 text-center font-medium border-b min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex items-center gap-1">
                            {role.name}
                            {role.is_system && (
                              <Badge variant="outline" className="text-[10px] px-1">Sys</Badge>
                            )}
                            {role.name === 'admin' && (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </span>
                          <div className="flex gap-1">
                            {role.name !== 'admin' && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6"
                                        onClick={() => {
                                          setDuplicateRole(role);
                                          setDuplicateName(`${role.name}_copie`);
                                        }}
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Dupliquer</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {!role.is_system && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 text-destructive hover:text-destructive"
                                          onClick={() => setDeleteRoleId(role.id)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Supprimer</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredModules.map(([module, config]) => (
                    <>
                      {/* Module header row */}
                      <tr key={`${module}-header`} className="bg-muted/30">
                        <td 
                          colSpan={filteredRoles.length + 1} 
                          className="sticky left-0 z-10 bg-muted/30 p-2 font-semibold text-sm border-b flex items-center gap-2"
                        >
                          {config.label}
                          {config.adminOnly && (
                            <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive">
                              Admin requis
                            </Badge>
                          )}
                        </td>
                      </tr>
                      {/* Permission rows */}
                      {config.permissions.map(permission => (
                        <tr key={`${module}-${permission}`} className="hover:bg-muted/20 transition-colors">
                          <td className="sticky left-0 z-10 bg-background p-3 text-sm border-b border-r pl-6">
                            {config.permissionLabels[permission as keyof typeof config.permissionLabels]}
                          </td>
                          {filteredRoles.map(role => {
                            const isAdmin = role.name === 'admin';
                            const isAdminModule = config.adminOnly;
                            const hasPerm = isAdmin || hasPermission(role.id, module, permission);
                            const isSaving = savingPermission === `${role.id}:${module}:${permission}`;
                            const isDisabled = isAdmin || (isAdminModule && !isAdmin);

                            return (
                              <td key={role.id} className="p-3 text-center border-b">
                                {isSaving ? (
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                ) : isDisabled ? (
                                  <div className="flex justify-center">
                                    {isAdmin ? (
                                      <Check className="h-5 w-5 text-success" />
                                    ) : (
                                      <X className="h-5 w-5 text-muted-foreground/30" />
                                    )}
                                  </div>
                                ) : (
                                  <Checkbox
                                    checked={hasPerm}
                                    onCheckedChange={() => 
                                      handlePermissionToggle(role.id, role.name, module, permission, hasPerm)
                                    }
                                    className="mx-auto"
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span>Permission accordée (admin)</span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked className="h-4 w-4" disabled />
              <span>Permission active</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-muted-foreground/30" />
              <span>Non autorisé (module admin)</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3" />
              <span>Rôle protégé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <RoleDialog
        role={selectedRole as any}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        mode={roleDialogMode}
      />

      {/* Delete Role Confirmation */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le rôle</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le rôle sera supprimé définitivement.
              Assurez-vous qu'aucun utilisateur n'utilise ce rôle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Role Dialog */}
      <AlertDialog open={!!duplicateRole} onOpenChange={() => setDuplicateRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dupliquer le rôle "{duplicateRole?.name}"</AlertDialogTitle>
            <AlertDialogDescription>
              Les permissions (hors administration) seront copiées vers le nouveau rôle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nom du nouveau rôle"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicateRole} disabled={!duplicateName.trim()}>
              Dupliquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
