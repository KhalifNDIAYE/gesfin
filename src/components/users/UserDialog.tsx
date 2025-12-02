import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { UserWithRoles, useUpdateUser, useAssignRole, useRemoveRole, useUnlockUser } from '@/hooks/useUsers';
import { useRoles, Role } from '@/hooks/useRoles';
import { Loader2, Plus, X, Unlock } from 'lucide-react';

interface UserDialogProps {
  user: UserWithRoles | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDialog: React.FC<UserDialogProps> = ({ user, open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    department: '',
    phone: '',
    is_active: true,
  });
  
  const { data: allRoles } = useRoles();
  const updateUser = useUpdateUser();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const unlockUser = useUnlockUser();

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        department: user.department || '',
        phone: user.phone || '',
        is_active: user.is_active,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    await updateUser.mutateAsync({
      userId: user.id,
      data: formData,
    });
    onOpenChange(false);
  };

  const handleAssignRole = async (roleId: string) => {
    if (!user) return;
    await assignRole.mutateAsync({ userId: user.id, roleId });
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!user) return;
    await removeRole.mutateAsync({ userId: user.id, roleId });
  };

  const handleUnlock = async () => {
    if (!user) return;
    await unlockUser.mutateAsync(user.id);
  };

  const availableRoles = allRoles?.filter(
    role => !user?.roles.some(ur => ur.id === role.id)
  ) || [];

  const isLocked = user?.locked_until && new Date(user.locked_until) > new Date();

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nom complet</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Département</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <Label>Compte actif</Label>
              <p className="text-sm text-muted-foreground">L'utilisateur peut se connecter</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          {isLocked && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">Compte verrouillé</p>
                  <p className="text-sm text-muted-foreground">
                    {user.failed_login_attempts} tentatives échouées
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUnlock}
                  disabled={unlockUser.isPending}
                >
                  {unlockUser.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Unlock className="h-4 w-4" />
                      Déverrouiller
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Rôles assignés</Label>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge key={role.id} variant="secondary" className="gap-1">
                  {role.name}
                  <button
                    type="button"
                    onClick={() => handleRemoveRole(role.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {user.roles.length === 0 && (
                <span className="text-sm text-muted-foreground">Aucun rôle assigné</span>
              )}
            </div>
          </div>

          {availableRoles.length > 0 && (
            <div className="space-y-2">
              <Label>Ajouter un rôle</Label>
              <div className="flex flex-wrap gap-2">
                {availableRoles.map((role) => (
                  <Button
                    key={role.id}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssignRole(role.id)}
                    disabled={assignRole.isPending}
                  >
                    <Plus className="h-3 w-3" />
                    {role.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={updateUser.isPending}>
              {updateUser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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
