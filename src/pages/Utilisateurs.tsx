import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  Users,
  Shield,
  Mail,
  MoreHorizontal,
  UserCheck,
  UserX
} from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "comptable" | "gestionnaire" | "auditeur" | "lecture";
  department: string;
  lastActive: string;
  status: "active" | "inactive" | "pending";
  projects: number;
}

const users: User[] = [
  { id: "1", name: "Amadou Diallo", email: "a.diallo@org.gouv.ml", role: "admin", department: "Direction Générale", lastActive: "Il y a 2 min", status: "active", projects: 12 },
  { id: "2", name: "Fatou Sow", email: "f.sow@org.gouv.ml", role: "comptable", department: "Direction Financière", lastActive: "Il y a 15 min", status: "active", projects: 8 },
  { id: "3", name: "Ousmane Ba", email: "o.ba@org.gouv.ml", role: "gestionnaire", department: "Projets Infrastructures", lastActive: "Il y a 1h", status: "active", projects: 3 },
  { id: "4", name: "Mariama Koné", email: "m.kone@org.gouv.ml", role: "comptable", department: "Direction Financière", lastActive: "Il y a 3h", status: "active", projects: 6 },
  { id: "5", name: "Ibrahim Traoré", email: "i.traore@org.gouv.ml", role: "gestionnaire", department: "Projets Sociaux", lastActive: "Hier", status: "active", projects: 4 },
  { id: "6", name: "Aissata Camara", email: "a.camara@org.gouv.ml", role: "auditeur", department: "Audit Interne", lastActive: "Il y a 2j", status: "inactive", projects: 12 },
  { id: "7", name: "Moussa Diarra", email: "m.diarra@org.gouv.ml", role: "lecture", department: "Partenaires", lastActive: "-", status: "pending", projects: 2 },
];

const roleConfig = {
  admin: { label: "Administrateur", className: "bg-destructive/10 text-destructive" },
  comptable: { label: "Comptable", className: "bg-primary/10 text-primary" },
  gestionnaire: { label: "Gestionnaire", className: "bg-info/10 text-info" },
  auditeur: { label: "Auditeur", className: "bg-warning/10 text-warning" },
  lecture: { label: "Lecture seule", className: "bg-muted text-muted-foreground" },
};

const statusConfig = {
  active: { label: "Actif", className: "bg-success/10 text-success" },
  inactive: { label: "Inactif", className: "bg-muted text-muted-foreground" },
  pending: { label: "En attente", className: "bg-warning/10 text-warning" },
};

const Utilisateurs = () => {
  return (
    <AppLayout 
      title="Utilisateurs" 
      subtitle="Gestion des comptes et permissions"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.length}</p>
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
                  <p className="text-2xl font-bold">{users.filter(u => u.status === 'active').length}</p>
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
                  <p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <UserX className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users.filter(u => u.status === 'pending').length}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Rechercher un utilisateur..." className="pl-9" />
          </div>
          <Button variant="gradient">
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
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Département</th>
                    <th>Projets</th>
                    <th>Dernière activité</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const role = roleConfig[user.role];
                    const status = statusConfig[user.status];
                    const initials = user.name.split(' ').map(n => n[0]).join('');
                    
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge variant="secondary" className={role.className}>
                            {role.label}
                          </Badge>
                        </td>
                        <td className="text-sm">{user.department}</td>
                        <td className="text-sm text-muted-foreground">{user.projects}</td>
                        <td className="text-sm text-muted-foreground">{user.lastActive}</td>
                        <td>
                          <Badge variant="secondary" className={status.className}>
                            {status.label}
                          </Badge>
                        </td>
                        <td>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Utilisateurs;
