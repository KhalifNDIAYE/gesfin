import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';

const createUserSchema = z.object({
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  firstName: z.string().max(50, 'Le prénom ne peut pas dépasser 50 caractères').optional(),
  email: z.string().email('Email invalide').max(255, 'Email trop long'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(72, 'Le mot de passe ne peut pas dépasser 72 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
});

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onOpenChange }) => {
  const [formData, setFormData] = useState({
    lastName: '',
    firstName: '',
    email: '',
    password: '',
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { data: roles } = useRoles();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormData({ lastName: '', firstName: '', email: '', password: '' });
    setSelectedRoles([]);
    setIsActive(true);
    setShowPassword(false);
    setErrors({});
  };

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  const getFullName = () => {
    const parts = [formData.lastName, formData.firstName].filter(Boolean);
    return parts.join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form
    try {
      createUserSchema.parse(formData);
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

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          fullName: getFullName(),
          isActive: isActive,
          roleIds: selectedRoles.length > 0 ? selectedRoles : undefined,
        },
      });

      if (response.error) {
        toast.error(response.error.message || 'Erreur lors de la création');
        return;
      }

      if (response.data?.error) {
        toast.error(response.data.error);
        return;
      }

      toast.success('Utilisateur créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
      onOpenChange(false);
    } catch {
      toast.error('Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Créez un nouveau compte utilisateur
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
                  placeholder="Dupont"
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
                placeholder="Jean"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="jean.dupont@exemple.com"
                className="pl-10"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 caractères, 1 maj., 1 min., 1 chiffre"
                className="pl-10 pr-10"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            <p className="text-xs text-muted-foreground">
              Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Rôles</Label>
            <ScrollArea className="h-[120px] rounded-lg border border-border p-3">
              <div className="space-y-2">
                {roles?.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={() => handleRoleToggle(role.id)}
                    />
                    <label
                      htmlFor={`role-${role.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      <span className="font-medium">{role.name}</span>
                      {role.description && (
                        <span className="text-muted-foreground ml-2 text-xs">- {role.description}</span>
                      )}
                    </label>
                  </div>
                ))}
                {(!roles || roles.length === 0) && (
                  <p className="text-sm text-muted-foreground">Aucun rôle disponible</p>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <Label>Statut</Label>
              <p className="text-sm text-muted-foreground">
                {isActive ? "L'utilisateur pourra se connecter" : "L'utilisateur ne pourra pas se connecter"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!isActive ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>Inactif</span>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <span className={`text-sm ${isActive ? 'text-success' : 'text-muted-foreground/50'}`}>Actif</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Création...
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
