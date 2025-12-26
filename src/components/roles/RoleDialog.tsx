import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Role, Permission, useCreateRole, useUpdateRole, usePermissions, useGrantPermission, useRevokePermission, useRole, useRoles } from '@/hooks/useRoles';
import { Loader2, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { logAction } from '@/hooks/useAuditLogs';

interface RoleDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
}

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
  budget: 'Budget',
};

const permissionLabels: Record<string, string> = {
  read: 'Voir',
  create: 'Créer',
  update: 'Modifier',
  delete: 'Supprimer',
  validate: 'Valider',
};

// System role names that cannot be used
const SYSTEM_ROLE_NAMES = ['admin', 'daf', 'dg', 'dt', 'comptable', 'auditeur'];

export const RoleDialog: React.FC<RoleDialogProps> = ({ role, open, onOpenChange, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [nameError, setNameError] = useState<string | null>(null);
  
  // Fetch all roles for uniqueness validation
  const { data: allRoles } = useRoles();
  
  // Fetch role with permissions when editing
  const { data: roleWithPermissions, isLoading: isLoadingRole, error: roleError } = useRole(
    mode === 'edit' && role?.id ? role.id : ''
  );
  
  const { data: allPermissions, isLoading: isLoadingPermissions } = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const grantPermission = useGrantPermission();
  const revokePermission = useRevokePermission();

  useEffect(() => {
    if (mode === 'edit' && roleWithPermissions) {
      setFormData({
        name: roleWithPermissions.name,
        description: roleWithPermissions.description || '',
        is_active: roleWithPermissions.is_active ?? true,
      });
      setSelectedPermissions(new Set(roleWithPermissions.permissions?.map(p => p.id) || []));
      setNameError(null);
    } else if (mode === 'create' && open) {
      setFormData({ name: '', description: '', is_active: true });
      setSelectedPermissions(new Set());
      setNameError(null);
    }
  }, [roleWithPermissions, mode, open]);

  // Validate role name
  const validateName = (name: string): string | null => {
    const trimmedName = name.trim().toLowerCase();
    
    if (!trimmedName) {
      return 'Le nom du rôle est obligatoire';
    }
    
    // Check system role conflict
    if (SYSTEM_ROLE_NAMES.includes(trimmedName)) {
      return 'Ce nom est réservé aux rôles système';
    }
    
    // Check uniqueness (exclude current role when editing)
    const isDuplicate = allRoles?.some(r => 
      r.name.toLowerCase() === trimmedName && 
      (mode === 'create' || r.id !== role?.id)
    );
    
    if (isDuplicate) {
      return 'Un rôle avec ce nom existe déjà';
    }
    
    return null;
  };

  const handleNameChange = (value: string) => {
    setFormData({ ...formData, name: value });
    setNameError(validateName(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateName(formData.name);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    // Check if at least one permission is selected
    if (selectedPermissions.size === 0) {
      toast.error('Veuillez sélectionner au moins une permission');
      return;
    }

    try {
      if (mode === 'create') {
        // Create the role
        const result = await createRole.mutateAsync({
          name: formData.name.trim(),
          description: formData.description,
          is_active: formData.is_active,
        });
        
        // Grant all selected permissions
        for (const permissionId of selectedPermissions) {
          await grantPermission.mutateAsync({ roleId: result.id, permissionId });
        }
        
        await logAction('role_create', 'securite', 'role', result.id, null, {
          name: formData.name,
          permissions_count: selectedPermissions.size,
        });
        
        toast.success('Rôle créé avec succès');
      } else if (roleWithPermissions) {
        const oldPermissionIds = new Set(roleWithPermissions.permissions?.map(p => p.id) || []);
        
        // Update role data
        await updateRole.mutateAsync({
          roleId: roleWithPermissions.id,
          data: {
            name: formData.name.trim(),
            description: formData.description,
            is_active: formData.is_active,
          },
        });
        
        // Grant new permissions
        for (const permissionId of selectedPermissions) {
          if (!oldPermissionIds.has(permissionId)) {
            await grantPermission.mutateAsync({ roleId: roleWithPermissions.id, permissionId });
          }
        }
        
        // Revoke removed permissions
        for (const permissionId of oldPermissionIds) {
          if (!selectedPermissions.has(permissionId)) {
            await revokePermission.mutateAsync({ roleId: roleWithPermissions.id, permissionId });
          }
        }
        
        await logAction('role_update', 'securite', 'role', roleWithPermissions.id, 
          { name: roleWithPermissions.name, is_active: roleWithPermissions.is_active },
          { name: formData.name, is_active: formData.is_active }
        );
        
        toast.success('Rôle modifié avec succès');
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Erreur lors de la sauvegarde du rôle');
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    const newPermissions = new Set(selectedPermissions);
    if (checked) {
      newPermissions.add(permissionId);
    } else {
      newPermissions.delete(permissionId);
    }
    setSelectedPermissions(newPermissions);
  };

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    return allPermissions?.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>) || {};
  }, [allPermissions]);

  const hasPermission = (permissionId: string) => {
    return selectedPermissions.has(permissionId);
  };

  // Select/deselect all permissions for a module
  const handleModuleSelectAll = (module: string, permissions: Permission[]) => {
    const modulePermissionIds = permissions.map(p => p.id);
    const allSelected = modulePermissionIds.every(id => selectedPermissions.has(id));
    
    const newPermissions = new Set(selectedPermissions);
    if (allSelected) {
      // Deselect all
      modulePermissionIds.forEach(id => newPermissions.delete(id));
    } else {
      // Select all
      modulePermissionIds.forEach(id => newPermissions.add(id));
    }
    setSelectedPermissions(newPermissions);
  };

  const isModuleFullySelected = (permissions: Permission[]) => {
    return permissions.every(p => selectedPermissions.has(p.id));
  };

  const isModulePartiallySelected = (permissions: Permission[]) => {
    const selected = permissions.filter(p => selectedPermissions.has(p.id));
    return selected.length > 0 && selected.length < permissions.length;
  };

  const isLoading = createRole.isPending || updateRole.isPending || grantPermission.isPending || revokePermission.isPending;
  const isSystem = roleWithPermissions?.is_system;
  const isDataLoading = mode === 'edit' && (isLoadingRole || isLoadingPermissions);
  const isPermissionsLoading = mode === 'create' && isLoadingPermissions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouveau rôle' : 'Modifier le rôle'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Créez un nouveau rôle et définissez ses permissions par module'
              : 'Modifiez les informations et les permissions du rôle'}
          </DialogDescription>
        </DialogHeader>

        {isDataLoading || isPermissionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chargement...</span>
          </div>
        ) : roleError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement du rôle. Veuillez réessayer.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du rôle *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={isSystem}
                  placeholder="Ex: gestionnaire_projet"
                  className={nameError ? 'border-destructive' : ''}
                  required
                />
                {isSystem && (
                  <p className="text-xs text-muted-foreground">Ce rôle système ne peut pas être renommé</p>
                )}
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="is_active">Statut</Label>
                <div className="flex items-center justify-between rounded-lg border border-border p-3 h-10">
                  <span className="text-sm">
                    {formData.is_active ? 'Actif' : 'Inactif'}
                  </span>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    disabled={isSystem}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                placeholder="Description du rôle et de ses responsabilités..."
              />
            </div>

            <div className="flex-1 min-h-0 space-y-2">
              <div className="flex items-center justify-between">
                <Label>Permissions par module *</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedPermissions.size} permission(s) sélectionnée(s)
                </span>
              </div>
              <ScrollArea className="h-[320px] rounded-lg border border-border p-4">
                <div className="space-y-6">
                  {Object.entries(permissionsByModule).map(([module, permissions]) => {
                    const isFullySelected = isModuleFullySelected(permissions);
                    const isPartiallySelected = isModulePartiallySelected(permissions);
                    
                    return (
                      <div key={module} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{moduleLabels[module] || module}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleModuleSelectAll(module, permissions)}
                          >
                            {isFullySelected ? (
                              <>
                                <Square className="h-3 w-3 mr-1" />
                                Tout désélectionner
                              </>
                            ) : (
                              <>
                                <CheckSquare className="h-3 w-3 mr-1" />
                                Tout sélectionner
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pl-4">
                          {permissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={permission.id}
                                checked={hasPermission(permission.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissionChange(permission.id, checked as boolean)
                                }
                              />
                              <label
                                htmlFor={permission.id}
                                className="text-sm cursor-pointer select-none"
                              >
                                {permissionLabels[permission.permission] || permission.permission}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="gradient" 
                disabled={isLoading || !!nameError || selectedPermissions.size === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enregistrement...
                  </>
                ) : mode === 'create' ? (
                  'Créer le rôle'
                ) : (
                  'Enregistrer les modifications'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
