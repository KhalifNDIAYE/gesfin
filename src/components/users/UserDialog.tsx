import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserWithRoles, useUpdateUser, useAssignRole, useRemoveRole, useUnlockUser } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { Loader2, Unlock, User, Mail, Phone } from 'lucide-react';
import { z } from 'zod';

const updateUserSchema = z.object({
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  firstName: z.string().max(50, 'Le prénom ne peut pas dépasser 50 caractères').optional(),
  phone: z.string().max(20, 'Téléphone trop long').optional(),
});

interface UserDialogProps {
  user: UserWithRoles | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserDialog: React.FC<UserDialogProps> = ({ user, open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    phone: '',
    is_active: true,
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { data: allRoles } = useRoles();
  const updateUser = useUpdateUser();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const unlockUser = useUnlockUser();

  useEffect(() => {
    if (user) {
      // Parse full_name into lastName and firstName
      const nameParts = (user.full_name || '').split(' ');
      const lastName = nameParts[0] || '';
      const firstName = nameParts.slice(1).join(' ') || '';
      
      setFormData({
        lastName,
        firstName,
        phone: user.phone || '',
        is_active: user.is_active,
      });
      setSelectedRoles(user.roles.map(r => r.id));
      setErrors({});
    }
  }, [user]);

  const getFullName = () => {
    const parts = [formData.lastName, formData.firstName].filter(Boolean);
    return parts.join(' ');
  };

  const handleRoleToggle = async (roleId: string) => {
    if (!user) return;
    
    const isCurrentlyAssigned = selectedRoles.includes(roleId);
    
    if (isCurrentlyAssigned) {
      await removeRole.mutateAsync({ userId: user.id, roleId });
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    } else {
      await assignRole.mutateAsync({ userId: user.id, roleId });
      setSelectedRoles(prev => [...prev, roleId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrors({});

    // Validate form
    try {
      updateUserSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    await updateUser.mutateAsync({
      userId: user.id,
      data: {
        full_name: getFullName(),
        phone: formData.phone || null,
        is_active: formData.is_active,
      },
    });
    onOpenChange(false);
  };

  const handleUnlock = async () => {
    if (!user) return;
    await unlockUser.mutateAsync(user.id);
  };

  const isLocked = user?.locked_until && new Date(user.locked_until) > new Date();

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l'utilisateur</DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="lastName"
                  className="pl-10"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                className="pl-10"
                placeholder="+33 6 12 34 56 78"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label>Rôles</Label>
            <ScrollArea className="h-[120px] rounded-lg border border-border p-3">
              <div className="space-y-2">
                {allRoles?.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-role-${role.id}`}
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={() => handleRoleToggle(role.id)}
                      disabled={assignRole.isPending || removeRole.isPending}
                    />
                    <label
                      htmlFor={`edit-role-${role.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      <span className="font-medium">{role.name}</span>
                      {role.description && (
                        <span className="text-muted-foreground ml-2 text-xs">- {role.description}</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <Label>Statut</Label>
              <p className="text-sm text-muted-foreground">
                {formData.is_active ? "L'utilisateur peut se connecter" : "L'utilisateur ne peut pas se connecter"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!formData.is_active ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>Inactif</span>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <span className={`text-sm ${formData.is_active ? 'text-success' : 'text-muted-foreground/50'}`}>Actif</span>
            </div>
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
                      <Unlock className="h-4 w-4 mr-1" />
                      Déverrouiller
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={updateUser.isPending}>
              {updateUser.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enregistrement...
                </>
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
