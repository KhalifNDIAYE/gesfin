import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, 
  Key,
  Lock,
  AlertTriangle,
  CheckCircle2,
  History,
  Download,
  RefreshCw,
  Database,
  Eye
} from "lucide-react";

const Securite = () => {
  return (
    <AppLayout 
      title="Sécurité" 
      subtitle="Configuration et audit de sécurité"
    >
      <div className="space-y-6">
        {/* Security Status */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-success/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Shield className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Statut global</p>
                  <p className="text-lg font-semibold text-success">Sécurisé</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                  <Database className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dernière sauvegarde</p>
                  <p className="text-lg font-semibold">Il y a 2h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Alertes</p>
                  <p className="text-lg font-semibold">2 mineures</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sessions actives</p>
                  <p className="text-lg font-semibold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Paramètres de sécurité
              </CardTitle>
              <CardDescription>Configuration des politiques de sécurité</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <p className="font-medium">Authentification à deux facteurs</p>
                  <p className="text-sm text-muted-foreground">Exiger 2FA pour tous les utilisateurs</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <p className="font-medium">Expiration de session</p>
                  <p className="text-sm text-muted-foreground">Déconnexion automatique après 30 min</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <p className="font-medium">Politique de mot de passe fort</p>
                  <p className="text-sm text-muted-foreground">Min. 12 caractères, majuscules, chiffres</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <p className="font-medium">Journalisation des actions</p>
                  <p className="text-sm text-muted-foreground">Enregistrer toutes les opérations</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <p className="font-medium">Chiffrement des données</p>
                  <p className="text-sm text-muted-foreground">AES-256 pour les données sensibles</p>
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success">Activé</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Backup Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sauvegardes
              </CardTitle>
              <CardDescription>Gestion des sauvegardes et restauration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sauvegarde automatique</span>
                  <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Quotidienne à 02:00 - Conservation 30 jours</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Sauvegardes récentes</p>
                {[
                  { date: "2024-01-15 02:00", size: "2.4 GB", status: "success" },
                  { date: "2024-01-14 02:00", size: "2.3 GB", status: "success" },
                  { date: "2024-01-13 02:00", size: "2.3 GB", status: "success" },
                ].map((backup, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <div>
                        <p className="text-sm font-medium">{backup.date}</p>
                        <p className="text-xs text-muted-foreground">{backup.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <RefreshCw className="h-4 w-4" />
                  Restaurer
                </Button>
                <Button variant="gradient" className="flex-1">
                  <Database className="h-4 w-4" />
                  Sauvegarder maintenant
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audit Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Journal d'audit
            </CardTitle>
            <CardDescription>Historique des actions et connexions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: "14:32", user: "Amadou Diallo", action: "Connexion réussie", type: "auth", ip: "192.168.1.45" },
                { time: "14:28", user: "Fatou Sow", action: "Création écriture comptable JOD-2024-156", type: "write", ip: "192.168.1.23" },
                { time: "14:15", user: "Ousmane Ba", action: "Export rapport budgétaire", type: "export", ip: "192.168.1.67" },
                { time: "13:55", user: "Mariama Koné", action: "Modification convention CONV-BM-2022-001", type: "update", ip: "192.168.1.89" },
                { time: "13:42", user: "Ibrahim Traoré", action: "Tentative connexion échouée", type: "error", ip: "192.168.1.12" },
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-3">
                  <span className="font-mono text-sm text-muted-foreground">{log.time}</span>
                  <Badge 
                    variant="secondary" 
                    className={
                      log.type === 'auth' ? 'bg-success/10 text-success' :
                      log.type === 'write' ? 'bg-primary/10 text-primary' :
                      log.type === 'export' ? 'bg-info/10 text-info' :
                      log.type === 'update' ? 'bg-warning/10 text-warning' :
                      'bg-destructive/10 text-destructive'
                    }
                  >
                    {log.type}
                  </Badge>
                  <span className="font-medium">{log.user}</span>
                  <span className="flex-1 text-sm text-muted-foreground">{log.action}</span>
                  <span className="font-mono text-xs text-muted-foreground">{log.ip}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Button variant="outline">Voir tout l'historique</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Securite;
