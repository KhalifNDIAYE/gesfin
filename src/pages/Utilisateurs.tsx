import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Users,
  Shield,
  Mail,
  MoreHorizontal,
  UserCheck,
  Loader2,
  Lock,
  Trash2,
  Edit
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUsers, useDeleteUser, UserWithRoles } from "@/hooks/useUsers";
import { useRoles, Role, RoleWithPermissions, useDeleteRole } from "@/hooks/useRoles";
import { UserDialog } from "@/components/users/UserDialog";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { RoleDialog } from "@/components/roles/RoleDialog";

const roleColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive",
  comptable: "bg-primary/10 text-primary",
  gestionnaire: "bg-info/10 text-info",
  auditeur: "bg-warning/10 text-warning",
  lecture: "bg-muted text-muted-foreground",
};

const Utilisateurs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleDialogMode, setRoleDialogMode] = useState<'create' | 'edit'>('create');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: roles, isLoading: rolesLoading } = useRoles();
  const deleteUser = useDeleteUser();
  const deleteRole = useDeleteRole();

  const filteredUsers = users?.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      user.full_name?.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.department?.toLowerCase().includes(search)
    );
  });

  const activeUsers = users?.filter(u => u.is_active).length || 0;
  const adminUsers = users?.filter(u => u.roles.some(r => r.name === 'admin')).length || 0;
  const lockedUsers = users?.filter(u => u.locked_until && new Date(u.locked_until) > new Date()).length || 0;

  const handleEditUser = (user: UserWithRoles) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setRoleDialogMode('create');
    setRoleDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role as RoleWithPermissions);
    setRoleDialogMode('edit');
    setRoleDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (deleteUserId) {
      await deleteUser.mutateAsync(deleteUserId);
      setDeleteUserId(null);
    }
  };

  const handleDeleteRole = async () => {
    if (deleteRoleId) {
      await deleteRole.mutateAsync(deleteRoleId);
      setDeleteRoleId(null);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <AppLayout 
      title="Utilisateurs & Rôles" 
      subtitle="Gestion des comptes, rôles et permissions"
    >
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="roles">Rôles</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{users?.length || 0}</p>
                    <p className="text-sm text-muted-foreground">Utilisateurs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                    <UserCheck className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{activeUsers}</p>
                    <p className="text-sm text-muted-foreground">Actifs</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                    <Shield className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{adminUsers}</p>
                    <p className="text-sm text-muted-foreground">Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                    <Lock className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{lockedUsers}</p>
                    <p className="text-sm text-muted-foreground">Verrouillés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un utilisateur..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="gradient" onClick={() => setCreateUserDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Ajouter un utilisateur
            </Button>
          </div>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des utilisateurs</CardTitle>
              <CardDescription>Gérer les accès et les rôles</CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Rôles</th>
                        <th>Département</th>
                        <th>Dernière connexion</th>
                        <th>Statut</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers?.map((user) => {
                        const isLocked = user.locked_until && new Date(user.locked_until) > new Date();
                        
                        return (
                          <tr key={user.id}>
                            <td>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {getInitials(user.full_name, user.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{user.full_name || 'Sans nom'}</p>
                                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    {user.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="flex flex-wrap gap-1">
                                {user.roles.length > 0 ? (
                                  user.roles.map((role) => (
                                    <Badge 
                                      key={role.id} 
                                      variant="secondary" 
                                      className={roleColors[role.name] || 'bg-muted'}
                                    >
                                      {role.name}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-muted-foreground">Aucun rôle</span>
                                )}
                              </div>
                            </td>
                            <td className="text-sm">{user.department || '-'}</td>
                            <td className="text-sm text-muted-foreground">
                              {user.last_login_at 
                                ? new Date(user.last_login_at).toLocaleDateString('fr-FR')
                                : 'Jamais'}
                            </td>
                            <td>
                              {isLocked ? (
                                <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                                  Verrouillé
                                </Badge>
                              ) : user.is_active ? (
                                <Badge variant="secondary" className="bg-success/10 text-success">
                                  Actif
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                  Inactif
                                </Badge>
                              )}
                            </td>
                            <td>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => setDeleteUserId(user.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers?.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-muted-foreground">
                            Aucun utilisateur trouvé
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          {/* Actions Bar */}
          <div className="flex justify-end">
            <Button variant="gradient" onClick={handleCreateRole}>
              <Plus className="h-4 w-4" />
              Nouveau rôle
            </Button>
          </div>

          {/* Roles Grid */}
          {rolesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roles?.map((role) => (
                <Card key={role.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        {role.name}
                      </CardTitle>
                      {role.is_system && (
                        <Badge variant="outline">Système</Badge>
                      )}
                    </div>
                    <CardDescription>{role.description || 'Pas de description'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleEditRole(role)}
                      >
                        <Edit className="h-4 w-4" />
                        Permissions
                      </Button>
                      {!role.is_system && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteRoleId(role.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* User Dialog */}
      <UserDialog 
        user={selectedUser}
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
      />

      {/* Create User Dialog */}
      <CreateUserDialog
        open={createUserDialogOpen}
        onOpenChange={setCreateUserDialogOpen}
      />

      {/* Role Dialog */}
      <RoleDialog
        role={selectedRole}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        mode={roleDialogMode}
      />

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'utilisateur et toutes ses données seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Role Confirmation */}
      <AlertDialog open={!!deleteRoleId} onOpenChange={() => setDeleteRoleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le rôle</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le rôle sera supprimé et retiré de tous les utilisateurs.
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
    </AppLayout>
  );
};

export default Utilisateurs;
