import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Role, RoleWithPermissions, Permission, useCreateRole, useUpdateRole, usePermissions, useGrantPermission, useRevokePermission } from '@/hooks/useRoles';
import { Loader2 } from 'lucide-react';

interface RoleDialogProps {
  role: RoleWithPermissions | null;
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
  });
  
  const { data: allPermissions } = usePermissions();
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const grantPermission = useGrantPermission();
  const revokePermission = useRevokePermission();

  useEffect(() => {
    if (role && mode === 'edit') {
      setFormData({
        name: role.name,
        description: role.description || '',
      });
    } else {
      setFormData({ name: '', description: '' });
    }
  }, [role, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'create') {
      await createRole.mutateAsync(formData);
    } else if (role) {
      await updateRole.mutateAsync({
        roleId: role.id,
        data: formData,
      });
    }
    onOpenChange(false);
  };

  const handlePermissionChange = async (permissionId: string, checked: boolean) => {
    if (!role) return;

    if (checked) {
      await grantPermission.mutateAsync({ roleId: role.id, permissionId });
    } else {
      await revokePermission.mutateAsync({ roleId: role.id, permissionId });
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
    return role?.permissions.some(p => p.id === permissionId) || false;
  };

  const isLoading = createRole.isPending || updateRole.isPending;
  const isSystem = role?.is_system;

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

          {mode === 'edit' && role && (
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
      </DialogContent>
    </Dialog>
  );
};
