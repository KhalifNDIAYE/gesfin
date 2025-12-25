import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Role, RoleWithPermissions, Permission, useCreateRole, useUpdateRole, usePermissions, useGrantPermission, useRevokePermission, useRole } from '@/hooks/useRoles';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
};

const permissionLabels: Record<string, string> = {
  read: 'Lecture',
  create: 'Création',
  update: 'Modification',
  delete: 'Suppression',
};

export const RoleDialog: React.FC<RoleDialogProps> = ({ role, open, onOpenChange, mode }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  
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
    } else if (mode === 'create') {
      setFormData({ name: '', description: '', is_active: true });
    }
  }, [roleWithPermissions, mode, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'create') {
        await createRole.mutateAsync(formData);
      } else if (roleWithPermissions) {
        await updateRole.mutateAsync({
          roleId: roleWithPermissions.id,
          data: formData,
        });
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving role:', error);
    }
  };

  const handlePermissionChange = async (permissionId: string, checked: boolean) => {
    if (!roleWithPermissions) return;

    try {
      if (checked) {
        await grantPermission.mutateAsync({ roleId: roleWithPermissions.id, permissionId });
      } else {
        await revokePermission.mutateAsync({ roleId: roleWithPermissions.id, permissionId });
      }
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  // Group permissions by module
  const permissionsByModule = allPermissions?.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>) || {};

  const hasPermission = (permissionId: string) => {
    return roleWithPermissions?.permissions?.some(p => p.id === permissionId) || false;
  };

  const isLoading = createRole.isPending || updateRole.isPending;
  const isSystem = roleWithPermissions?.is_system;
  const isDataLoading = mode === 'edit' && (isLoadingRole || isLoadingPermissions);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nouveau rôle' : 'Modifier le rôle'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Créez un nouveau rôle et définissez ses permissions'
              : 'Modifiez les informations et les permissions du rôle'}
          </DialogDescription>
        </DialogHeader>

        {isDataLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Chargement du rôle...</span>
          </div>
        ) : roleError ? (
          <Alert variant="destructive">
            <AlertDescription>
              Erreur lors du chargement du rôle. Veuillez réessayer.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du rôle</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSystem}
                required
              />
              {isSystem && (
                <p className="text-xs text-muted-foreground">Ce rôle système ne peut pas être renommé</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            {mode === 'edit' && !isSystem && (
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active">Statut du rôle</Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_active ? 'Ce rôle est actif et peut être attribué' : 'Ce rôle est inactif'}
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            )}

            {mode === 'edit' && roleWithPermissions && (
              <div className="space-y-4">
                <Label>Permissions par module</Label>
                <ScrollArea className="h-[300px] rounded-lg border border-border p-4">
                  <div className="space-y-6">
                    {Object.entries(permissionsByModule).map(([module, permissions]) => (
                      <div key={module} className="space-y-2">
                        <h4 className="font-medium">{moduleLabels[module] || module}</h4>
                        <div className="grid grid-cols-2 gap-2 pl-4">
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
                                className="text-sm cursor-pointer"
                              >
                                {permissionLabels[permission.permission] || permission.permission}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" variant="gradient" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === 'create' ? (
                  'Créer'
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
