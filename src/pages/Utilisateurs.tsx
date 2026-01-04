import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
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
  Edit,
  Eye,
  UserX,
  Download,
  FileSpreadsheet,
  FileText,
  CalendarIcon,
  X,
  Filter
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUsers, useDeleteUser, useUpdateUser, UserWithRoles } from "@/hooks/useUsers";
import { useRoles } from "@/hooks/useRoles";
import { UserDialog } from "@/components/users/UserDialog";
import { CreateUserDialog } from "@/components/users/CreateUserDialog";
import { PermissionsMatrix } from "@/components/roles/PermissionsMatrix";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { usePDFGeneration } from "@/hooks/usePDFGeneration";
import { addTable, addSectionHeader } from "@/utils/pdfTemplate";

const roleColors: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive",
  comptable: "bg-primary/10 text-primary",
  gestionnaire: "bg-info/10 text-info",
  auditeur: "bg-warning/10 text-warning",
  daf: "bg-success/10 text-success",
  dg: "bg-purple-500/10 text-purple-600",
  dt: "bg-blue-500/10 text-blue-600",
  lecture: "bg-muted text-muted-foreground",
};

const Utilisateurs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<UserWithRoles | null>(null);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: roles } = useRoles();
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      // Search filter
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        user.full_name?.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search);

      // Role filter
      const matchesRole = roleFilter === "all" || 
        user.roles.some(r => r.id === roleFilter);

      // Status filter
      const isLocked = user.locked_until && new Date(user.locked_until) > new Date();
      let matchesStatus = true;
      if (statusFilter === "active") matchesStatus = user.is_active && !isLocked;
      else if (statusFilter === "inactive") matchesStatus = !user.is_active;
      else if (statusFilter === "locked") matchesStatus = !!isLocked;

      // Date filter
      const createdAt = new Date(user.created_at);
      const matchesDateFrom = !dateFrom || createdAt >= dateFrom;
      const matchesDateTo = !dateTo || createdAt <= new Date(dateTo.setHours(23, 59, 59));

      return matchesSearch && matchesRole && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [users, searchTerm, roleFilter, statusFilter, dateFrom, dateTo]);

  const activeUsers = users?.filter(u => u.is_active).length || 0;
  const adminUsers = users?.filter(u => u.roles.some(r => r.name === 'admin')).length || 0;
  const lockedUsers = users?.filter(u => u.locked_until && new Date(u.locked_until) > new Date()).length || 0;

  const handleEditUser = (user: UserWithRoles) => {
    setSelectedUser(user);
    setUserDialogOpen(true);
  };

  const handleViewUser = (user: UserWithRoles) => {
    setViewUser(user);
  };

  const handleToggleActive = async (user: UserWithRoles) => {
    try {
      await updateUser.mutateAsync({
        userId: user.id,
        data: { is_active: !user.is_active }
      });
      toast.success(user.is_active ? "Utilisateur désactivé" : "Utilisateur activé");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDeleteUser = async () => {
    if (deleteUserId) {
      await deleteUser.mutateAsync(deleteUserId);
      setDeleteUserId(null);
    }
  };

  const clearFilters = () => {
    setRoleFilter("all");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearchTerm("");
  };

  const hasActiveFilters = roleFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo || searchTerm;

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  };

  // Export functions
  const exportToExcel = () => {
    const data = filteredUsers.map(user => ({
      "Nom": user.full_name || 'Sans nom',
      "Email": user.email,
      "Rôles": user.roles.map(r => r.name).join(', ') || 'Aucun',
      "Statut": user.locked_until && new Date(user.locked_until) > new Date() 
        ? "Verrouillé" 
        : user.is_active ? "Actif" : "Inactif",
      "Dernière connexion": user.last_login_at 
        ? format(new Date(user.last_login_at), 'dd/MM/yyyy HH:mm', { locale: fr })
        : 'Jamais',
      "Date création": format(new Date(user.created_at), 'dd/MM/yyyy', { locale: fr }),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Utilisateurs");
    XLSX.writeFile(wb, `utilisateurs_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success("Export Excel généré");
  };

  const { downloadPDF } = usePDFGeneration();

  const exportToPDF = async () => {
    await downloadPDF(
      {
        title: "Liste des Utilisateurs",
        documentDate: new Date(),
        documentRef: `USERS-${format(new Date(), 'yyyyMMdd')}`,
        auditModule: "utilisateurs",
        auditResourceType: "export",
      },
      `utilisateurs_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
      (ctx) => {
        addSectionHeader(ctx, "Utilisateurs");
        
        const headers = ["Nom", "Email", "Rôles", "Statut", "Connexion", "Création"];
        const rows = filteredUsers.map((user) => {
          const isLocked = user.locked_until && new Date(user.locked_until) > new Date();
          const status = isLocked ? "Verrouillé" : user.is_active ? "Actif" : "Inactif";
          const lastLogin = user.last_login_at 
            ? format(new Date(user.last_login_at), 'dd/MM/yy', { locale: fr })
            : 'Jamais';
          
          return [
            (user.full_name || 'Sans nom').substring(0, 20),
            user.email.substring(0, 28),
            user.roles.map(r => r.name).join(', ').substring(0, 15) || '-',
            status,
            lastLogin,
            format(new Date(user.created_at), 'dd/MM/yy', { locale: fr })
          ];
        });
        
        addTable(ctx, headers, rows, [35, 50, 30, 22, 25, 25]);
      }
    );
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

          {/* Search and Actions Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Rechercher par nom ou email..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={exportToExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="gradient" onClick={() => setCreateUserDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Ajouter un utilisateur
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtres</span>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Réinitialiser
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les rôles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    {roles?.map(role => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="locked">Verrouillé</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'dd/MM/yyyy', { locale: fr }) : "Date début"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'dd/MM/yyyy', { locale: fr }) : "Date fin"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des utilisateurs</CardTitle>
              <CardDescription>
                {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} trouvé{filteredUsers.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôles</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Dernière connexion</TableHead>
                        <TableHead>Date création</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => {
                        const isLocked = user.locked_until && new Date(user.locked_until) > new Date();
                        
                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {getInitials(user.full_name, user.email)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.full_name || 'Sans nom'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell>
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
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {user.last_login_at 
                                ? format(new Date(user.last_login_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                                : 'Jamais'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(user.created_at)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewUser(user)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Voir
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Modifier
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                                    <UserX className="h-4 w-4 mr-2" />
                                    {user.is_active ? "Désactiver" : "Activer"}
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
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Aucun utilisateur trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <PermissionsMatrix />
        </TabsContent>
      </Tabs>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
            <DialogDescription>Informations du compte</DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {getInitials(viewUser.full_name, viewUser.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{viewUser.full_name || 'Sans nom'}</h3>
                  <p className="text-sm text-muted-foreground">{viewUser.email}</p>
                </div>
              </div>
              
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Département</span>
                  <span>{viewUser.department || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Téléphone</span>
                  <span>{viewUser.phone || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rôles</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {viewUser.roles.length > 0 ? viewUser.roles.map(r => (
                      <Badge key={r.id} variant="secondary" className={roleColors[r.name] || 'bg-muted'}>
                        {r.name}
                      </Badge>
                    )) : <span>Aucun</span>}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Statut</span>
                  <Badge variant="secondary" className={viewUser.is_active ? "bg-success/10 text-success" : "bg-muted"}>
                    {viewUser.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dernière connexion</span>
                  <span>{viewUser.last_login_at ? format(new Date(viewUser.last_login_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : 'Jamais'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date de création</span>
                  <span>{format(new Date(viewUser.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </AppLayout>
  );
};

export default Utilisateurs;
