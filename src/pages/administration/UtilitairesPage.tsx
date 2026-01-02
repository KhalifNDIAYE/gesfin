import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
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
import { usePermissions } from "@/hooks/usePermissions";
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  FileSpreadsheet, 
  FileText, 
  Building2, 
  Link2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  HardDrive,
  Calendar,
  Settings,
  Play,
  Pause,
  Trash2
} from "lucide-react";

// Mock data for backups
const mockBackups = [
  { id: "1", name: "backup_2024-01-15_08-00", date: "2024-01-15 08:00", size: "245 MB", type: "auto", status: "success" },
  { id: "2", name: "backup_2024-01-14_08-00", date: "2024-01-14 08:00", size: "243 MB", type: "auto", status: "success" },
  { id: "3", name: "backup_2024-01-13_20-30", date: "2024-01-13 20:30", size: "242 MB", type: "manual", status: "success" },
  { id: "4", name: "backup_2024-01-12_08-00", date: "2024-01-12 08:00", size: "240 MB", type: "auto", status: "success" },
];

const mockSites = [
  { id: "1", name: "Site Principal - Dakar", status: "connected", lastSync: "2024-01-15 10:30" },
  { id: "2", name: "Antenne Thiès", status: "connected", lastSync: "2024-01-15 10:25" },
  { id: "3", name: "Antenne Saint-Louis", status: "disconnected", lastSync: "2024-01-14 18:00" },
];

const mockInterfaces = [
  { id: "1", name: "Sage Comptabilité", type: "ERP", status: "active", lastExchange: "2024-01-15 09:00" },
  { id: "2", name: "SAP Business One", type: "ERP", status: "inactive", lastExchange: "-" },
  { id: "3", name: "Banque CBAO", type: "Banque", status: "active", lastExchange: "2024-01-15 08:30" },
  { id: "4", name: "SYSCOHADA Export", type: "Réglementaire", status: "active", lastExchange: "2024-01-10 14:00" },
];

export default function UtilitairesPage() {
  const { canAccess, isAdmin } = usePermissions();
  const canEdit = isAdmin || canAccess('parametres', 'update');

  const [activeTab, setActiveTab] = useState("backup");

  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [backupTime, setBackupTime] = useState("08:00");
  const [backupRetention, setBackupRetention] = useState("30");
  const [backupTables, setBackupTables] = useState("all");
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string>("");
  const [restoreAll, setRestoreAll] = useState(true);
  const [restoreUsers, setRestoreUsers] = useState(false);
  const [restoreConfig, setRestoreConfig] = useState(true);
  const [importDataType, setImportDataType] = useState("journal");
  const [exportModule, setExportModule] = useState("comptabilite");
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [consolidateEntries, setConsolidateEntries] = useState(true);
  const [eliminateInterSite, setEliminateInterSite] = useState(false);
  const [interfaceType, setInterfaceType] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingBackupSettings, setIsSavingBackupSettings] = useState(false);

  const handleSaveBackupSettings = () => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour modifier ces paramètres");
      return;
    }
    setIsSavingBackupSettings(true);
    setTimeout(() => {
      setIsSavingBackupSettings(false);
      toast.success("Paramètres de sauvegarde enregistrés");
    }, 1000);
  };

  const handleManualBackup = () => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour effectuer cette action");
      return;
    }
    setIsBackingUp(true);
    toast.info("Sauvegarde en cours...");
    setTimeout(() => {
      setIsBackingUp(false);
      toast.success("Sauvegarde effectuée avec succès");
    }, 3000);
  };

  const handleDownloadBackup = (backupName: string) => {
    toast.success(`Téléchargement de "${backupName}" lancé`);
  };

  const handleDeleteBackup = (backupId: string, backupName: string) => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour supprimer cette sauvegarde");
      return;
    }
    toast.success(`Sauvegarde "${backupName}" supprimée`);
  };

  const handleRestore = () => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour effectuer cette action");
      return;
    }
    if (!selectedBackupId) {
      toast.error("Veuillez sélectionner une sauvegarde");
      return;
    }
    setIsRestoring(true);
    toast.info("Restauration en cours...");
    setTimeout(() => {
      setIsRestoring(false);
      toast.success("Restauration effectuée avec succès");
    }, 5000);
  };

  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour importer des données");
      return;
    }
    const file = event.target.files?.[0];
    if (file) {
      setIsImporting(true);
      setImportProgress(0);
      toast.info(`Importation de "${file.name}" en cours...`);
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsImporting(false);
            toast.success(`Fichier "${file.name}" importé avec succès`);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const handleDownloadTemplate = (templateName: string) => {
    toast.success(`Téléchargement du modèle "${templateName}" lancé`);
  };

  const handleExportExcel = () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error("Veuillez sélectionner une période");
      return;
    }
    toast.success(`Export Excel ${exportModule} lancé`);
  };

  const handleExportPDF = () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error("Veuillez sélectionner une période");
      return;
    }
    toast.success(`Export PDF ${exportModule} lancé`);
  };

  const handleQuickExport = (reportName: string) => {
    toast.success(`Export "${reportName}" lancé`);
  };

  const handleSyncSite = (siteName: string) => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour synchroniser");
      return;
    }
    toast.info(`Synchronisation de "${siteName}" en cours...`);
    setTimeout(() => {
      toast.success(`"${siteName}" synchronisé avec succès`);
    }, 2000);
  };

  const handleSyncAllSites = () => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour synchroniser");
      return;
    }
    setIsSyncing(true);
    toast.info("Synchronisation de tous les sites en cours...");
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("Tous les sites ont été synchronisés");
    }, 3000);
  };

  const handleGenerateConsolidatedStatements = () => {
    toast.info("Génération des états consolidés en cours...");
    setTimeout(() => {
      toast.success("États consolidés générés avec succès");
    }, 2000);
  };

  const handleConsolidationReport = () => {
    toast.success("Rapport de consolidation généré");
  };

  const handleToggleInterface = (interfaceName: string, currentStatus: string) => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour modifier cette interface");
      return;
    }
    const newStatus = currentStatus === "active" ? "désactivée" : "activée";
    toast.success(`Interface "${interfaceName}" ${newStatus}`);
  };

  const handleConfigureInterface = (interfaceName: string) => {
    toast.info(`Configuration de "${interfaceName}" ouverte`);
  };

  const handleAddInterface = () => {
    if (!interfaceType) {
      toast.error("Veuillez sélectionner un type d'interface");
      return;
    }
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour ajouter une interface");
      return;
    }
    toast.success(`Configuration de l'interface ${interfaceType} lancée`);
  };

  const handleManageSchedules = (type: string) => {
    toast.info(`Gestion des planifications ${type} ouverte`);
  };

  return (
    <AppLayout title="Utilitaires & Sauvegarde" subtitle="Gestion des sauvegardes, imports/exports et interfaces">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sauvegarde
          </TabsTrigger>
          <TabsTrigger value="restore" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Restauration
          </TabsTrigger>
          <TabsTrigger value="import-export" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Import/Export
          </TabsTrigger>
          <TabsTrigger value="consolidation" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Consolidation
          </TabsTrigger>
          <TabsTrigger value="interfaces" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Interfaces
          </TabsTrigger>
        </TabsList>

        {/* Sauvegarde Tab */}
        <TabsContent value="backup" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuration des sauvegardes
                </CardTitle>
                <CardDescription>Paramètres de sauvegarde automatique</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sauvegarde automatique</Label>
                    <p className="text-sm text-muted-foreground">Activer les sauvegardes planifiées</p>
                  </div>
                  <Switch checked={autoBackupEnabled} onCheckedChange={setAutoBackupEnabled} />
                </div>

                <div className="space-y-2">
                  <Label>Fréquence</Label>
                  <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Toutes les heures</SelectItem>
                      <SelectItem value="daily">Quotidienne</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuelle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Heure de sauvegarde</Label>
                  <Input type="time" value={backupTime} onChange={(e) => setBackupTime(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Rétention</Label>
                  <Select value={backupRetention} onValueChange={setBackupRetention}>
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

                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={handleSaveBackupSettings}
                  disabled={isSavingBackupSettings || !canEdit}
                >
                  {isSavingBackupSettings ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer les paramètres"
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Sauvegarde manuelle
                </CardTitle>
                <CardDescription>Créer une sauvegarde immédiate</CardDescription>
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

                <div className="space-y-2">
                  <Label>Tables à sauvegarder</Label>
                  <Select value={backupTables} onValueChange={setBackupTables}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les tables</SelectItem>
                      <SelectItem value="accounting">Comptabilité uniquement</SelectItem>
                      <SelectItem value="budget">Budget uniquement</SelectItem>
                      <SelectItem value="conventions">Conventions uniquement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleManualBackup}
                  disabled={isBackingUp}
                >
                  {isBackingUp ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Sauvegarde en cours...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-4 w-4" />
                      Lancer la sauvegarde
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Historique des sauvegardes</CardTitle>
              <CardDescription>Liste des sauvegardes disponibles</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Type</TableHead>
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
                          {backup.type === "auto" ? "Automatique" : "Manuelle"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Succès
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleDownloadBackup(backup.name)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDeleteBackup(backup.id, backup.name)} disabled={!canEdit}>
                            <Trash2 className="h-4 w-4" />
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

        {/* Restauration Tab */}
        <TabsContent value="restore" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Restauration des données
              </CardTitle>
              <CardDescription>Restaurer une sauvegarde précédente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-medium text-destructive">Attention</h4>
                    <p className="text-sm text-muted-foreground">
                      La restauration remplacera toutes les données actuelles. Cette action est irréversible.
                      Assurez-vous d'avoir une sauvegarde récente avant de procéder.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sélectionner une sauvegarde</Label>
                <Select value={selectedBackupId} onValueChange={setSelectedBackupId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une sauvegarde..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockBackups.map((backup) => (
                      <SelectItem key={backup.id} value={backup.id}>
                        {backup.name} ({backup.size})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Options de restauration</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="restore-all" checked={restoreAll} onCheckedChange={setRestoreAll} />
                    <Label htmlFor="restore-all">Restaurer toutes les tables</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="restore-users" checked={restoreUsers} onCheckedChange={setRestoreUsers} />
                    <Label htmlFor="restore-users">Inclure les utilisateurs</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="restore-config" checked={restoreConfig} onCheckedChange={setRestoreConfig} />
                    <Label htmlFor="restore-config">Inclure la configuration</Label>
                  </div>
                </div>
              </div>

              <Button 
                variant="destructive" 
                className="w-full"
                disabled={isRestoring || !selectedBackupId || !canEdit}
                onClick={handleRestore}
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Restauration en cours...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Lancer la restauration
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import/Export Tab */}
        <TabsContent value="import-export" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Excel
                </CardTitle>
                <CardDescription>Importer des données depuis un fichier Excel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Type de données</Label>
                  <Select value={importDataType} onValueChange={setImportDataType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="journal">Écritures comptables</SelectItem>
                      <SelectItem value="budget">Lignes budgétaires</SelectItem>
                      <SelectItem value="third_parties">Tiers</SelectItem>
                      <SelectItem value="plan_accounts">Plan comptable</SelectItem>
                      <SelectItem value="assets">Immobilisations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fichier Excel</Label>
                  <Input 
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={handleImportExcel}
                    disabled={!canEdit}
                  />
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Importation en cours...</span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                )}

                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium mb-2">Modèles disponibles</h4>
                  <div className="space-y-1">
                    <Button variant="link" className="h-auto p-0 text-sm" onClick={() => handleDownloadTemplate("écritures comptables")}>
                      <Download className="mr-1 h-3 w-3" />
                      Modèle écritures comptables
                    </Button>
                    <br />
                    <Button variant="link" className="h-auto p-0 text-sm" onClick={() => handleDownloadTemplate("lignes budgétaires")}>
                      <Download className="mr-1 h-3 w-3" />
                      Modèle lignes budgétaires
                    </Button>
                    <br />
                    <Button variant="link" className="h-auto p-0 text-sm" onClick={() => handleDownloadTemplate("tiers")}>
                      <Download className="mr-1 h-3 w-3" />
                      Modèle tiers
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export
                </CardTitle>
                <CardDescription>Exporter des données en Excel ou PDF</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Module</Label>
                  <Select value={exportModule} onValueChange={setExportModule}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comptabilite">Comptabilité</SelectItem>
                      <SelectItem value="budget">Budget</SelectItem>
                      <SelectItem value="conventions">Conventions</SelectItem>
                      <SelectItem value="marches">Marchés</SelectItem>
                      <SelectItem value="immobilisations">Immobilisations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Période</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} />
                    <Input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={handleExportExcel}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Export Excel
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF}>
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                  </Button>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium mb-2">Exports rapides</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => handleQuickExport("Grand Livre")}>
                      Grand Livre
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => handleQuickExport("Balance")}>
                      Balance
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => handleQuickExport("Journal")}>
                      Journal
                    </Button>
                    <Button variant="ghost" size="sm" className="justify-start" onClick={() => handleQuickExport("Bilan")}>
                      Bilan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Consolidation Tab */}
        <TabsContent value="consolidation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Consolidation multi-sites
              </CardTitle>
              <CardDescription>Gestion et synchronisation des différents sites</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière synchronisation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="font-medium">{site.name}</TableCell>
                      <TableCell>
                        <Badge variant={site.status === "connected" ? "default" : "destructive"}>
                          {site.status === "connected" ? (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Connecté
                            </>
                          ) : (
                            <>
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Déconnecté
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{site.lastSync}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleSyncSite(site.name)} disabled={!canEdit}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Synchroniser
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => toast.info(`Configuration de "${site.name}" ouverte`)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de consolidation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Synchronisation automatique</Label>
                    <p className="text-sm text-muted-foreground">Synchroniser les données toutes les heures</p>
                  </div>
                  <Switch checked={autoSync} onCheckedChange={setAutoSync} disabled={!canEdit} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Consolidation des écritures</Label>
                    <p className="text-sm text-muted-foreground">Regrouper les écritures de tous les sites</p>
                  </div>
                  <Switch checked={consolidateEntries} onCheckedChange={setConsolidateEntries} disabled={!canEdit} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Élimination inter-sites</Label>
                    <p className="text-sm text-muted-foreground">Éliminer les opérations inter-sites</p>
                  </div>
                  <Switch checked={eliminateInterSite} onCheckedChange={setEliminateInterSite} disabled={!canEdit} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions de consolidation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline" onClick={handleSyncAllSites} disabled={isSyncing || !canEdit}>
                  {isSyncing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Synchronisation...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Synchroniser tous les sites
                    </>
                  )}
                </Button>
                <Button className="w-full" variant="outline" onClick={handleGenerateConsolidatedStatements}>
                  <Database className="mr-2 h-4 w-4" />
                  Générer les états consolidés
                </Button>
                <Button className="w-full" variant="outline" onClick={handleConsolidationReport}>
                  <FileText className="mr-2 h-4 w-4" />
                  Rapport de consolidation
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Interfaces Tab */}
        <TabsContent value="interfaces" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Interfaces avec logiciels externes
              </CardTitle>
              <CardDescription>Configuration des connexions avec les systèmes tiers</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interface</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernier échange</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInterfaces.map((iface) => (
                    <TableRow key={iface.id}>
                      <TableCell className="font-medium">{iface.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{iface.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={iface.status === "active" ? "default" : "secondary"}>
                          {iface.status === "active" ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell>{iface.lastExchange}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {iface.status === "active" ? (
                            <Button variant="outline" size="sm" onClick={() => handleToggleInterface(iface.name, iface.status)} disabled={!canEdit}>
                              <Pause className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleToggleInterface(iface.name, iface.status)} disabled={!canEdit}>
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => handleConfigureInterface(iface.name)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ajouter une interface</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Type d'interface</Label>
                  <Select value={interfaceType} onValueChange={setInterfaceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="erp">ERP (Sage, SAP...)</SelectItem>
                      <SelectItem value="bank">Banque</SelectItem>
                      <SelectItem value="regulatory">Réglementaire</SelectItem>
                      <SelectItem value="api">API personnalisée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleAddInterface} disabled={!canEdit}>
                  <Link2 className="mr-2 h-4 w-4" />
                  Configurer
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import planifié</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Relevés bancaires</span>
                  <Badge>Quotidien</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Factures fournisseurs</span>
                  <Badge>Hebdomadaire</Badge>
                </div>
                <Button className="w-full" variant="outline" onClick={() => handleManageSchedules("import")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Gérer les planifications
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Export planifié</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">SYSCOHADA</span>
                  <Badge>Mensuel</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rapports bailleurs</span>
                  <Badge>Trimestriel</Badge>
                </div>
                <Button className="w-full" variant="outline" onClick={() => handleManageSchedules("export")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Gérer les planifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}
