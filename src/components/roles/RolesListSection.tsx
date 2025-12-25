import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2,
  Loader2,
  Info,
  Lock,
  Users
} from 'lucide-react';
import { Role, useDeleteRole, useUpdateRole } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { logAction } from '@/hooks/useAuditLogs';
import { RoleDialog } from './RoleDialog';

// Role descriptions for tooltips - configurable mapping
const ROLE_DESCRIPTIONS: Record<string, { fullName: string; description: string }> = {
  admin: {
    fullName: "Administrateur",
    description: "Administration globale du système avec tous les accès"
  },
  daf: {
    fullName: "Directeur Administratif et Financier",
    description: "Supervision financière et administrative, validation des budgets"
  },
  comptable: {
    fullName: "Comptable",
    description: "Responsable de la saisie et du suivi comptable"
  },
  auditeur: {
    fullName: "Auditeur",
    description: "Contrôle et audit des opérations et des données"
  },
  chef_projet: {
    fullName: "Chef de Projet",
    description: "Gestion et suivi des projets, coordination des équipes"
  },
  gestionnaire: {
    fullName: "Gestionnaire",
    description: "Gestion opérationnelle des données et processus"
  },
  consultant: {
    fullName: "Consultant",
    description: "Accès en lecture pour consultation et analyse"
  },
  directeur: {
    fullName: "Directeur",
    description: "Direction générale, validation stratégique et supervision"
  },
  dg: {
    fullName: "Directeur Général",
    description: "Direction générale, validation finale et supervision stratégique"
  },
  dt: {
    fullName: "Directeur Technique",
    description: "Direction technique, validation des aspects techniques"
  },
  responsable_budget: {
    fullName: "Responsable Budget",
    description: "Élaboration et suivi des budgets, contrôle budgétaire"
  },
  tresorier: {
    fullName: "Trésorier",
    description: "Gestion de la trésorerie et des flux financiers"
  },
  assistant: {
    fullName: "Assistant",
    description: "Support administratif et saisie de données"
  },
  validateur: {
    fullName: "Validateur",
    description: "Validation des opérations et des documents"
  },
  lecteur: {
    fullName: "Lecteur",
    description: "Accès en lecture seule aux données"
  }
};

// Helper function to get role tooltip info
const getRoleTooltipInfo = (roleName: string, roleDescription?: string | null) => {
  const knownRole = ROLE_DESCRIPTIONS[roleName.toLowerCase()];
  if (knownRole) {
    return knownRole;
  }
  return {
    fullName: roleName.charAt(0).toUpperCase() + roleName.slice(1),
    description: roleDescription || "Rôle personnalisé"
  };
};

interface RolesListSectionProps {
  roles: Role[];
  isLoading: boolean;
  canManageRoles: boolean;
}

export const RolesListSection = ({ roles, isLoading, canManageRoles }: RolesListSectionProps) => {
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogMode, setRoleDialogMode] = useState<'create' | 'edit'>('create');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [deleteBlockReason, setDeleteBlockReason] = useState<string | null>(null);
  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const deleteRole = useDeleteRole();
  const updateRole = useUpdateRole();

  const handleCreateRole = () => {
    setSelectedRole(null);
    setRoleDialogMode('create');
    setRoleDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleDialogMode('edit');
    setRoleDialogOpen(true);
  };

  const handleDeleteClick = async (roleId: string) => {
    const roleToDelete = roles.find(r => r.id === roleId);
    
    if (roleToDelete?.is_system) {
      toast.error('Impossible de supprimer un rôle système');
      return;
    }

    // Check if role has users
    const { count } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role_id', roleId);

    if (count && count > 0) {
      setDeleteBlockReason(`Ce rôle est attribué à ${count} utilisateur(s) actif(s). Retirez-le d'abord de tous les utilisateurs avant de le supprimer.`);
      setDeleteRoleId(roleId);
      return;
    }

    setDeleteBlockReason(null);
    setDeleteRoleId(roleId);
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleId || deleteBlockReason) return;

    const roleToDelete = roles.find(r => r.id === deleteRoleId);
    
    await deleteRole.mutateAsync(deleteRoleId);
    await logAction('role_delete', 'securite', 'role', deleteRoleId, 
      { roleName: roleToDelete?.name }, 
      null
    );
    setDeleteRoleId(null);
    queryClient.invalidateQueries({ queryKey: ['roles'] });
  };

  const handleToggleActive = async (role: Role) => {
    if (role.is_system || role.name === 'admin') {
      toast.error('Impossible de désactiver un rôle système');
      return;
    }

    setTogglingRoleId(role.id);
    
    try {
      const { error } = await supabase
        .from('roles')
        .update({ is_active: !role.is_active })
        .eq('id', role.id);

      if (error) throw error;

      await logAction(
        role.is_active ? 'role_deactivate' : 'role_activate',
        'securite',
        'role',
        role.id,
        { is_active: role.is_active },
        { is_active: !role.is_active }
      );

      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast.success(role.is_active ? 'Rôle désactivé' : 'Rôle activé');
    } catch (error) {
      toast.error('Erreur lors de la modification du statut');
    } finally {
      setTogglingRoleId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Liste des Rôles
            </CardTitle>
            <CardDescription>
              Gérez les rôles disponibles dans l'application
            </CardDescription>
          </div>
          {canManageRoles && (
            <Button variant="gradient" onClick={handleCreateRole}>
              <Plus className="h-4 w-4 mr-1" />
              Nouveau rôle
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rôle</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Type</TableHead>
                {canManageRoles && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map(role => {
                const roleInfo = getRoleTooltipInfo(role.name, role.description);
                const isAdmin = role.name === 'admin';
                
                return (
                  <TableRow key={role.id} className={!role.is_active ? 'opacity-60' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="flex items-center gap-1 font-medium cursor-help">
                                {role.name}
                                <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-primary transition-colors" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-[280px]">
                              <div className="text-sm">
                                <p className="font-semibold">{roleInfo.fullName}</p>
                                <p className="text-muted-foreground text-xs mt-1">{roleInfo.description}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {isAdmin && (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[300px] truncate">
                      {role.description || roleInfo.description}
                    </TableCell>
                    <TableCell className="text-center">
                      {canManageRoles && !role.is_system && !isAdmin ? (
                        <div className="flex items-center justify-center">
                          {togglingRoleId === role.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Switch
                              checked={role.is_active}
                              onCheckedChange={() => handleToggleActive(role)}
                            />
                          )}
                        </div>
                      ) : (
                        <Badge variant={role.is_active ? 'default' : 'secondary'}>
                          {role.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {role.is_system ? (
                        <Badge variant="outline" className="bg-primary/10">
                          Système
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Personnalisé
                        </Badge>
                      )}
                    </TableCell>
                    {canManageRoles && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isAdmin && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleEditRole(role)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Modifier</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {!role.is_system && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={() => handleDeleteClick(role.id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Supprimer</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <RoleDialog
        role={selectedRole as any}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        mode={roleDialogMode}
      />

      {/* Delete Role Confirmation / Block Dialog */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={() => { setDeleteRoleId(null); setDeleteBlockReason(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteBlockReason ? 'Suppression impossible' : 'Supprimer le rôle'}
            </AlertDialogTitle>
            <AlertDialogDescription className="flex items-start gap-2">
              {deleteBlockReason ? (
                <>
                  <Users className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span>{deleteBlockReason}</span>
                </>
              ) : (
                'Cette action est irréversible. Le rôle sera supprimé définitivement.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {deleteBlockReason ? 'Fermer' : 'Annuler'}
            </AlertDialogCancel>
            {!deleteBlockReason && (
              <AlertDialogAction 
                onClick={handleDeleteRole}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
