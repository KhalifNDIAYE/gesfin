import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Shield,
  Activity,
  Database,
  Wrench,
  Settings,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  HardDrive,
  Server,
  Key,
  Eye,
  FileText,
  Zap,
  Power,
  Lock
} from "lucide-react";

interface UtilitairesSystemeTabProps {
  canEdit: boolean;
}

// Mock data
const mockSecurityLogs = [
  { id: "1", type: "auth_failure", user: "user@example.com", ip: "192.168.1.45", action: "Échec connexion (3 tentatives)", date: "2024-01-15 14:32", severity: "warning" },
  { id: "2", type: "access", user: "admin@example.com", ip: "10.0.0.1", action: "Accès module Sécurité", date: "2024-01-15 14:28", severity: "info" },
  { id: "3", type: "sensitive", user: "daf@example.com", ip: "192.168.1.20", action: "Export données budgétaires", date: "2024-01-15 14:15", severity: "info" },
  { id: "4", type: "anomaly", user: "unknown", ip: "185.234.12.45", action: "Tentative accès non autorisé", date: "2024-01-15 13:45", severity: "critical" },
];

const mockBackups = [
  { id: "1", name: "backup_2024-01-15_08-00", date: "2024-01-15 08:00", size: "245 MB", type: "auto", status: "success", includes: "DB + Docs + Config" },
  { id: "2", name: "backup_2024-01-14_08-00", date: "2024-01-14 08:00", size: "243 MB", type: "auto", status: "success", includes: "DB + Docs" },
  { id: "3", name: "backup_2024-01-13_20-30", date: "2024-01-13 20:30", size: "242 MB", type: "manual", status: "success", includes: "Full" },
];

const mockSystemHealth = [
  { service: "API Backend", status: "operational", responseTime: "45ms", uptime: "99.98%" },
  { service: "Base de données", status: "operational", responseTime: "12ms", uptime: "99.99%" },
  { service: "Stockage fichiers", status: "operational", responseTime: "85ms", uptime: "99.95%" },
  { service: "Service Email", status: "degraded", responseTime: "320ms", uptime: "98.50%" },
  { service: "Cache Redis", status: "operational", responseTime: "3ms", uptime: "100%" },
];

const mockMaintenanceTasks = [
  { id: "1", name: "Purge logs > 90 jours", lastRun: "2024-01-10", nextRun: "2024-02-10", status: "scheduled" },
  { id: "2", name: "Rotation clés API", lastRun: "2024-01-01", nextRun: "2024-04-01", status: "scheduled" },
  { id: "3", name: "Nettoyage cache", lastRun: "2024-01-15", nextRun: "2024-01-16", status: "completed" },
  { id: "4", name: "Réindexation globale", lastRun: "2024-01-08", nextRun: "2024-01-22", status: "scheduled" },
];

export function UtilitairesSystemeTab({ canEdit }: UtilitairesSystemeTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("securite");
  
  // Security state
  const [logFilter, setLogFilter] = useState("all");
  const [isExportingLogs, setIsExportingLogs] = useState(false);
  
  // Backup state
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [backupTime, setBackupTime] = useState("08:00");
  const [backupRetention, setBackupRetention] = useState("30");
  const [backupScope, setBackupScope] = useState("full");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState("");
  
  // Maintenance state
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isRotatingKeys, setIsRotatingKeys] = useState(false);
  
  // Settings state
  const [aiEnabled, setAiEnabled] = useState(true);
  const [maxUploadSize, setMaxUploadSize] = useState("20");
  const [sessionTimeout, setSessionTimeout] = useState("30");

  // Security handlers
  const handleExportLogs = () => {
    setIsExportingLogs(true);
    toast.info("Export des journaux en cours...");
    setTimeout(() => {
      setIsExportingLogs(false);
      toast.success("Journaux exportés avec succès");
    }, 2000);
  };

  const handleDetectAnomalies = () => {
    toast.info("Analyse des anomalies en cours...");
    setTimeout(() => {
      toast.warning("2 comportements suspects détectés");
    }, 3000);
  };

  const handleCorrelateEvents = () => {
    toast.info("Corrélation IA des événements en cours...");
    setTimeout(() => {
      toast.success("Corrélation terminée: 1 pattern identifié");
    }, 4000);
  };

  // Backup handlers
  const handleSaveBackupSettings = () => {
    if (!canEdit) {
      toast.error("Permissions insuffisantes");
      return;
    }
    toast.success("Paramètres de sauvegarde enregistrés");
  };

  const handleManualBackup = () => {
    if (!canEdit) {
      toast.error("Permissions insuffisantes");
      return;
    }
    setIsBackingUp(true);
    toast.info("Sauvegarde en cours...");
    setTimeout(() => {
      setIsBackingUp(false);
      toast.success("Sauvegarde effectuée avec succès");
    }, 4000);
  };

  const handleRestore = () => {
    if (!canEdit) {
      toast.error("Permissions insuffisantes");
      return;
    }
    if (!selectedBackupId) {
      toast.error("Veuillez sélectionner une sauvegarde");
      return;
    }
    setIsRestoring(true);
    toast.warning("Restauration en cours... Ne fermez pas cette page.");
    setTimeout(() => {
      setIsRestoring(false);
      toast.success("Restauration terminée avec succès");
    }, 6000);
  };

  const handleDownloadBackup = (backupName: string) => {
    toast.success(`Téléchargement de "${backupName}" lancé`);
  };

  const handleVerifyIntegrity = (backupId: string) => {
    toast.info("Vérification d'intégrité en cours...");
    setTimeout(() => {
      toast.success("Intégrité vérifiée: aucune corruption détectée");
    }, 2000);
  };

  // Maintenance handlers
  const handleToggleMaintenanceMode = () => {
    if (!canEdit) {
      toast.error("Permissions insuffisantes");
      return;
    }
    const newState = !isMaintenanceMode;
    setIsMaintenanceMode(newState);
    if (newState) {
      toast.warning("Mode maintenance activé - Les utilisateurs ne peuvent plus accéder à la plateforme");
    } else {
      toast.success("Mode maintenance désactivé - Plateforme accessible");
    }
  };

  const handlePurgeLogs = () => {
    if (!canEdit) {
      toast.error("Permissions insuffisantes");
      return;
    }
    setIsPurging(true);
    toast.info("Purge des logs en cours...");
    setTimeout(() => {
      setIsPurging(false);
      toast.success("Logs purgés: 15,432 entrées supprimées");
    }, 3000);
  };

  const handleRotateKeys = () => {
    if (!canEdit) {
      toast.error("Permissions insuffisantes");
      return;
    }
    setIsRotatingKeys(true);
    toast.warning("Rotation des clés en cours...");
    setTimeout(() => {
      setIsRotatingKeys(false);
      toast.success("Clés API renouvelées avec succès");
    }, 4000);
  };

  const handleClearCache = () => {
    if (!canEdit) {
      toast.error("Permissions insuffisantes");
      return;
    }
    toast.info("Nettoyage du cache...");
    setTimeout(() => {
      toast.success("Cache vidé: 128 MB libérés");
    }, 1500);
  };

  const handleReindex = () => {
    if (!canEdit) {
      toast.error("Permissions insuffisantes");
      return;
    }
    toast.info("Réindexation globale lancée (peut prendre plusieurs minutes)...");
  };

  const handleRunMaintenanceTask = (taskName: string) => {
    if (!canEdit) {
      toast.error("Permissions insuffisantes");
      return;
    }
    toast.info(`Exécution de "${taskName}" en cours...`);
    setTimeout(() => {
      toast.success(`"${taskName}" terminé avec succès`);
    }, 2000);
  };

  // Settings handlers
  const handleSaveSettings = () => {
    if (!canEdit) {
      toast.error("Permissions insuffisantes");
      return;
    }
    toast.success("Paramètres système enregistrés");
  };

  const handleToggleModule = (moduleName: string, enabled: boolean) => {
    if (!canEdit) {
      toast.error("Permissions insuffisantes");
      return;
    }
    toast.success(`Module "${moduleName}" ${enabled ? "activé" : "désactivé"}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-500"><CheckCircle2 className="mr-1 h-3 w-3" />Opérationnel</Badge>;
      case "degraded":
        return <Badge className="bg-orange-500"><AlertTriangle className="mr-1 h-3 w-3" />Dégradé</Badge>;
      case "down":
        return <Badge variant="destructive"><AlertCircle className="mr-1 h-3 w-3" />Hors service</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critique</Badge>;
      case "warning":
        return <Badge className="bg-orange-500">Attention</Badge>;
      case "info":
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="securite" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden md:inline">Sécurité</span>
        </TabsTrigger>
        <TabsTrigger value="diagnostics" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          <span className="hidden md:inline">Diagnostics</span>
        </TabsTrigger>
        <TabsTrigger value="sauvegardes" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          <span className="hidden md:inline">Sauvegardes</span>
        </TabsTrigger>
        <TabsTrigger value="maintenance" className="flex items-center gap-2">
          <Wrench className="h-4 w-4" />
          <span className="hidden md:inline">Maintenance</span>
        </TabsTrigger>
        <TabsTrigger value="parametres" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden md:inline">Paramètres</span>
        </TabsTrigger>
      </TabsList>

      {/* Sécurité Tab */}
      <TabsContent value="securite" className="space-y-4">
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Select value={logFilter} onValueChange={setLogFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type de log" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les logs</SelectItem>
                <SelectItem value="auth_failure">Échecs auth</SelectItem>
                <SelectItem value="access">Accès sensibles</SelectItem>
                <SelectItem value="sensitive">Actions sensibles</SelectItem>
                <SelectItem value="anomaly">Anomalies</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDetectAnomalies}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Détecter anomalies
            </Button>
            <Button variant="outline" onClick={handleCorrelateEvents}>
              <Zap className="mr-2 h-4 w-4" />
              Corrélation IA
            </Button>
            <Button onClick={handleExportLogs} disabled={isExportingLogs}>
              {isExportingLogs ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Export...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exporter logs
                </>
              )}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Journal de sécurité
            </CardTitle>
            <CardDescription>Logs d'accès, actions sensibles et anomalies</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Date/Heure</TableHead>
                  <TableHead>Sévérité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSecurityLogs
                  .filter(log => logFilter === "all" || log.type === logFilter)
                  .map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Badge variant="outline">{log.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell className="font-mono text-sm">{log.ip}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Diagnostics Tab */}
      <TabsContent value="diagnostics" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              État des services
            </CardTitle>
            <CardDescription>Santé et performance des composants système</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Temps de réponse</TableHead>
                  <TableHead>Disponibilité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSystemHealth.map((service, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{service.service}</TableCell>
                    <TableCell>{getStatusBadge(service.status)}</TableCell>
                    <TableCell>{service.responseTime}</TableCell>
                    <TableCell>{service.uptime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Stockage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Utilisé</span>
                  <span>12.5 GB / 50 GB</span>
                </div>
                <Progress value={25} />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Documents: 8.2 GB</p>
                <p>Sauvegardes: 3.1 GB</p>
                <p>Logs: 1.2 GB</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>CPU</span>
                  <span>23%</span>
                </div>
                <Progress value={23} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mémoire</span>
                  <span>45%</span>
                </div>
                <Progress value={45} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Connexions DB</span>
                  <span>12 / 100</span>
                </div>
                <Progress value={12} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Erreurs récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dernières 24h</span>
                  <Badge variant="secondary">3</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dernière semaine</span>
                  <Badge variant="secondary">12</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Critiques</span>
                  <Badge variant="destructive">0</Badge>
                </div>
              </div>
              <Button variant="link" className="mt-4 p-0 h-auto" onClick={() => toast.info("Ouverture des logs d'erreur...")}>
                Voir les détails →
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Sauvegardes Tab */}
      <TabsContent value="sauvegardes" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>Paramètres de sauvegarde automatique</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sauvegarde automatique</Label>
                  <p className="text-sm text-muted-foreground">Planification active</p>
                </div>
                <Switch checked={autoBackupEnabled} onCheckedChange={setAutoBackupEnabled} disabled={!canEdit} />
              </div>

              <div className="space-y-2">
                <Label>Fréquence</Label>
                <Select value={backupFrequency} onValueChange={setBackupFrequency} disabled={!canEdit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Horaire</SelectItem>
                    <SelectItem value="daily">Quotidienne</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Heure</Label>
                <Input type="time" value={backupTime} onChange={(e) => setBackupTime(e.target.value)} disabled={!canEdit} />
              </div>

              <div className="space-y-2">
                <Label>Rétention</Label>
                <Select value={backupRetention} onValueChange={setBackupRetention} disabled={!canEdit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 jours</SelectItem>
                    <SelectItem value="14">14 jours</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="90">90 jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contenu</Label>
                <Select value={backupScope} onValueChange={setBackupScope} disabled={!canEdit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Complet (DB + Docs + Config)</SelectItem>
                    <SelectItem value="db">Base de données uniquement</SelectItem>
                    <SelectItem value="db_docs">DB + Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" variant="outline" onClick={handleSaveBackupSettings} disabled={!canEdit}>
                Enregistrer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Actions
              </CardTitle>
              <CardDescription>Sauvegarde et restauration manuelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dernière sauvegarde</span>
                  <span className="text-sm font-medium">15 janv. 2024, 08:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Taille estimée</span>
                  <span className="text-sm font-medium">~250 MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Espace disponible</span>
                  <span className="text-sm font-medium">4.2 GB</span>
                </div>
              </div>

              <Button className="w-full" onClick={handleManualBackup} disabled={isBackingUp || !canEdit}>
                {isBackingUp ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sauvegarde en cours...
                  </>
                ) : (
                  <>
                    <Database className="mr-2 h-4 w-4" />
                    Sauvegarder maintenant
                  </>
                )}
              </Button>

              <div className="border-t pt-4 space-y-2">
                <Label>Restauration</Label>
                <Select value={selectedBackupId} onValueChange={setSelectedBackupId} disabled={!canEdit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une sauvegarde..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockBackups.map((backup) => (
                      <SelectItem key={backup.id} value={backup.id}>
                        {backup.name} ({backup.size})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="w-full" variant="destructive" onClick={handleRestore} disabled={isRestoring || !selectedBackupId || !canEdit}>
                  {isRestoring ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Restauration...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Restaurer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Historique des sauvegardes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contenu</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockBackups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell className="font-medium">{backup.name}</TableCell>
                    <TableCell>{backup.date}</TableCell>
                    <TableCell>{backup.size}</TableCell>
                    <TableCell>
                      <Badge variant={backup.type === "auto" ? "secondary" : "outline"}>
                        {backup.type === "auto" ? "Auto" : "Manuel"}
                      </Badge>
                    </TableCell>
                    <TableCell>{backup.includes}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-500">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Succès
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleVerifyIntegrity(backup.id)}>
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(backup.name)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Maintenance Tab */}
      <TabsContent value="maintenance" className="space-y-4">
        <Card className={isMaintenanceMode ? "border-destructive" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Power className="h-5 w-5" />
              Mode maintenance
            </CardTitle>
            <CardDescription>Suspendre l'accès utilisateur pendant les opérations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className={isMaintenanceMode ? "text-destructive" : ""}>
                  {isMaintenanceMode ? "Mode maintenance ACTIF" : "Mode maintenance désactivé"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {isMaintenanceMode 
                    ? "Les utilisateurs voient une page de maintenance"
                    : "La plateforme est accessible normalement"
                  }
                </p>
              </div>
              <Switch 
                checked={isMaintenanceMode} 
                onCheckedChange={handleToggleMaintenanceMode}
                disabled={!canEdit}
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Actions de maintenance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handlePurgeLogs}
                disabled={!canEdit || isPurging}
              >
                {isPurging ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Purger les logs anciens
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleRotateKeys}
                disabled={!canEdit || isRotatingKeys}
              >
                {isRotatingKeys ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Key className="mr-2 h-4 w-4" />
                )}
                Rotation des clés API
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleClearCache}
                disabled={!canEdit}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Vider le cache
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleReindex}
                disabled={!canEdit}
              >
                <Database className="mr-2 h-4 w-4" />
                Réindexation globale
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tâches planifiées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tâche</TableHead>
                    <TableHead>Prochaine exéc.</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMaintenanceTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium text-sm">{task.name}</TableCell>
                      <TableCell className="text-sm">{task.nextRun}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRunMaintenanceTask(task.name)}
                          disabled={!canEdit}
                        >
                          Exécuter
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Paramètres Tab */}
      <TabsContent value="parametres" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Limites système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Taille max. upload (MB)</Label>
                <Input 
                  type="number" 
                  value={maxUploadSize} 
                  onChange={(e) => setMaxUploadSize(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label>Timeout session (minutes)</Label>
                <Input 
                  type="number" 
                  value={sessionTimeout} 
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  disabled={!canEdit}
                />
              </div>
              <Button className="w-full" onClick={handleSaveSettings} disabled={!canEdit}>
                Enregistrer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Paramètres IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Moteur IA activé</Label>
                  <p className="text-sm text-muted-foreground">Corrélation et détection d'anomalies</p>
                </div>
                <Switch 
                  checked={aiEnabled} 
                  onCheckedChange={setAiEnabled}
                  disabled={!canEdit}
                />
              </div>
              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="font-medium mb-2">Fonctionnalités IA</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Corrélation d'événements de sécurité</li>
                  <li>• Détection de comportements suspects</li>
                  <li>• Prédiction des risques budgétaires</li>
                  <li>• Suggestions de correction automatique</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Activation / Désactivation des modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { name: "Comptabilité analytique", enabled: true },
                  { name: "Gestion documentaire", enabled: true },
                  { name: "Multi-devises", enabled: false },
                  { name: "Consolidation multi-sites", enabled: true },
                  { name: "Alertes IA", enabled: true },
                  { name: "API externe", enabled: false },
                ].map((module, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                    <span className="text-sm font-medium">{module.name}</span>
                    <Switch 
                      checked={module.enabled}
                      onCheckedChange={(checked) => handleToggleModule(module.name, checked)}
                      disabled={!canEdit}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
