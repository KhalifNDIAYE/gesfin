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
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Calculator,
  Trash2,
  FolderSearch,
  FileCheck,
  AlertTriangle,
  Bell,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Link2,
  Search
} from "lucide-react";

interface UtilitairesMetierTabProps {
  canEdit: boolean;
}

// Mock data for orphan detection
const mockOrphanData = [
  { id: "1", type: "Projet", name: "Projet TEST-001", issue: "Sans budget associé", createdAt: "2024-01-10" },
  { id: "2", type: "Budget", name: "BUD-2023-045", issue: "Projet supprimé", createdAt: "2023-12-15" },
  { id: "3", type: "Convention", name: "CONV-AFD-2022", issue: "Expirée depuis 60 jours", createdAt: "2022-06-01" },
  { id: "4", type: "Document", name: "rapport_final.pdf", issue: "Entité liée supprimée", createdAt: "2023-11-20" },
];

const mockDocuments = [
  { id: "1", name: "Contrat_Projet_Alpha.pdf", entity: "Projet Alpha", category: "Contrat", status: "valid", lastCheck: "2024-01-15" },
  { id: "2", name: "Budget_2024_v2.xlsx", entity: "Budget 2024", category: "Budget", status: "missing_signature", lastCheck: "2024-01-14" },
  { id: "3", name: "Convention_USAID.pdf", entity: "Convention USAID", category: "Convention", status: "valid", lastCheck: "2024-01-15" },
  { id: "4", name: "Annexe_technique.docx", entity: "Marché IT", category: "Annexe", status: "unclassified", lastCheck: "2024-01-13" },
];

const mockAlerts = [
  { id: "1", type: "budget", message: "Dépassement budget ligne 4.2", entity: "Projet Alpha", severity: "high", date: "2024-01-15" },
  { id: "2", type: "project", message: "Retard planification > 30 jours", entity: "Projet Beta", severity: "medium", date: "2024-01-14" },
  { id: "3", type: "convention", message: "Convention expire dans 15 jours", entity: "Conv. AFD-2024", severity: "high", date: "2024-01-15" },
  { id: "4", type: "validation", message: "5 dépenses en attente > 7 jours", entity: "Comptabilité", severity: "low", date: "2024-01-13" },
];

export function UtilitairesMetierTab({ canEdit }: UtilitairesMetierTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("import-export");
  
  // Import/Export state
  const [importEntityType, setImportEntityType] = useState("projets");
  const [exportEntityType, setExportEntityType] = useState("projets");
  const [exportFormat, setExportFormat] = useState("excel");
  const [exportPeriodStart, setExportPeriodStart] = useState("");
  const [exportPeriodEnd, setExportPeriodEnd] = useState("");
  const [exportFilter, setExportFilter] = useState("all");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isSimulationMode, setIsSimulationMode] = useState(true);
  
  // Recalculs state
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculationType, setRecalculationType] = useState("");
  
  // Nettoyage state
  const [isScanning, setIsScanning] = useState(false);
  
  // Documents state
  const [isReindexing, setIsReindexing] = useState(false);
  
  // Alertes state
  const [selectedAlertType, setSelectedAlertType] = useState("all");

  // Import/Export handlers
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour importer des données");
      return;
    }
    const file = event.target.files?.[0];
    if (file) {
      setIsImporting(true);
      setImportProgress(0);
      const mode = isSimulationMode ? "[SIMULATION]" : "";
      toast.info(`${mode} Import de "${file.name}" en cours...`);
      
      const interval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsImporting(false);
            if (isSimulationMode) {
              toast.success(`Simulation terminée: 150 lignes analysées, 3 erreurs détectées`);
            } else {
              toast.success(`${file.name} importé avec succès: 147 enregistrements créés`);
            }
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const handleExport = () => {
    if (!exportPeriodStart || !exportPeriodEnd) {
      toast.error("Veuillez sélectionner une période");
      return;
    }
    toast.success(`Export ${exportFormat.toUpperCase()} des ${exportEntityType} lancé`);
  };

  const handleDownloadTemplate = (entityType: string) => {
    toast.success(`Téléchargement du modèle "${entityType}" lancé`);
  };

  // Recalculs handlers
  const handleRecalculate = (type: string) => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour effectuer cette action");
      return;
    }
    setRecalculationType(type);
    setIsRecalculating(true);
    toast.info(`Recalcul des ${type} en cours...`);
    
    setTimeout(() => {
      setIsRecalculating(false);
      setRecalculationType("");
      toast.success(`Recalcul des ${type} terminé avec succès`);
    }, 3000);
  };

  const handleSync = (syncType: string) => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour synchroniser");
      return;
    }
    toast.info(`Synchronisation ${syncType} en cours...`);
    setTimeout(() => {
      toast.success(`Synchronisation ${syncType} terminée`);
    }, 2000);
  };

  // Nettoyage handlers
  const handleScanOrphans = () => {
    setIsScanning(true);
    toast.info("Analyse des données orphelines en cours...");
    setTimeout(() => {
      setIsScanning(false);
      toast.success("Analyse terminée: 4 éléments orphelins détectés");
    }, 3000);
  };

  const handleFixOrphan = (id: string, name: string) => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour cette action");
      return;
    }
    toast.success(`Correction assistée lancée pour "${name}"`);
  };

  // Documents handlers
  const handleReindexDocuments = () => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour réindexer");
      return;
    }
    setIsReindexing(true);
    toast.info("Réindexation des documents en cours...");
    setTimeout(() => {
      setIsReindexing(false);
      toast.success("Réindexation terminée: 1,245 documents indexés");
    }, 4000);
  };

  const handleReclassifyDocument = (docId: string, docName: string) => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour reclassifier");
      return;
    }
    toast.info(`Reclassification de "${docName}" ouverte`);
  };

  const handleVerifySignatures = () => {
    toast.info("Vérification des signatures électroniques en cours...");
    setTimeout(() => {
      toast.success("Vérification terminée: 2 documents sans signature valide");
    }, 2000);
  };

  const handleCheckMissingDocs = () => {
    toast.info("Contrôle des documents manquants en cours...");
    setTimeout(() => {
      toast.warning("5 documents obligatoires manquants détectés");
    }, 2000);
  };

  // Alertes handlers
  const handleResendAlert = (alertId: string, alertMessage: string) => {
    if (!canEdit) {
      toast.error("Vous n'avez pas les permissions pour relancer les alertes");
      return;
    }
    toast.success(`Alerte "${alertMessage}" relancée`);
  };

  const handleGlobalCoherenceCheck = () => {
    toast.info("Vérification de cohérence globale en cours...");
    setTimeout(() => {
      toast.success("Vérification terminée: 2 incohérences détectées");
    }, 3000);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="destructive">Critique</Badge>;
      case "medium":
        return <Badge className="bg-orange-500">Moyen</Badge>;
      case "low":
        return <Badge variant="secondary">Faible</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="import-export" className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          <span className="hidden md:inline">Import/Export</span>
        </TabsTrigger>
        <TabsTrigger value="recalculs" className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          <span className="hidden md:inline">Recalculs</span>
        </TabsTrigger>
        <TabsTrigger value="nettoyage" className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          <span className="hidden md:inline">Nettoyage</span>
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-2">
          <FolderSearch className="h-4 w-4" />
          <span className="hidden md:inline">Documents</span>
        </TabsTrigger>
        <TabsTrigger value="alertes" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden md:inline">Alertes</span>
        </TabsTrigger>
      </TabsList>

      {/* Import/Export Tab */}
      <TabsContent value="import-export" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import métier
              </CardTitle>
              <CardDescription>Importer des données métier avec validation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type d'entité</Label>
                <Select value={importEntityType} onValueChange={setImportEntityType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projets">Projets</SelectItem>
                    <SelectItem value="budgets">Budgets</SelectItem>
                    <SelectItem value="bailleurs">Bailleurs</SelectItem>
                    <SelectItem value="conventions">Conventions</SelectItem>
                    <SelectItem value="marches">Marchés</SelectItem>
                    <SelectItem value="operations">Opérations comptables</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mode simulation</Label>
                  <p className="text-sm text-muted-foreground">Prévisualiser sans importer</p>
                </div>
                <Switch checked={isSimulationMode} onCheckedChange={setIsSimulationMode} />
              </div>

              <div className="space-y-2">
                <Label>Fichier</Label>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImport}
                  disabled={!canEdit || isImporting}
                />
              </div>

              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{isSimulationMode ? "Simulation..." : "Import en cours..."}</span>
                    <span>{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} />
                </div>
              )}

              <div className="rounded-lg bg-muted/50 p-4">
                <h4 className="font-medium mb-2">Modèles d'import</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="link" className="h-auto p-0 text-sm justify-start" onClick={() => handleDownloadTemplate("projets")}>
                    <Download className="mr-1 h-3 w-3" /> Projets
                  </Button>
                  <Button variant="link" className="h-auto p-0 text-sm justify-start" onClick={() => handleDownloadTemplate("budgets")}>
                    <Download className="mr-1 h-3 w-3" /> Budgets
                  </Button>
                  <Button variant="link" className="h-auto p-0 text-sm justify-start" onClick={() => handleDownloadTemplate("bailleurs")}>
                    <Download className="mr-1 h-3 w-3" /> Bailleurs
                  </Button>
                  <Button variant="link" className="h-auto p-0 text-sm justify-start" onClick={() => handleDownloadTemplate("conventions")}>
                    <Download className="mr-1 h-3 w-3" /> Conventions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export métier
              </CardTitle>
              <CardDescription>Exporter les données par type et période</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Type d'entité</Label>
                <Select value={exportEntityType} onValueChange={setExportEntityType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projets">Projets</SelectItem>
                    <SelectItem value="budgets">Budgets</SelectItem>
                    <SelectItem value="bailleurs">Bailleurs</SelectItem>
                    <SelectItem value="conventions">Conventions</SelectItem>
                    <SelectItem value="marches">Marchés</SelectItem>
                    <SelectItem value="operations">Opérations comptables</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Période</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={exportPeriodStart} onChange={(e) => setExportPeriodStart(e.target.value)} />
                  <Input type="date" value={exportPeriodEnd} onChange={(e) => setExportPeriodEnd(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Filtrer par</Label>
                <Select value={exportFilter} onValueChange={setExportFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="projet">Par projet</SelectItem>
                    <SelectItem value="bailleur">Par bailleur</SelectItem>
                    <SelectItem value="statut">Par statut</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exporter
              </Button>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Recalculs Tab */}
      <TabsContent value="recalculs" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Recalculs des indicateurs
              </CardTitle>
              <CardDescription>Forcer le recalcul des données agrégées</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleRecalculate("soldes budgétaires")}
                disabled={!canEdit || (isRecalculating && recalculationType === "soldes budgétaires")}
              >
                {isRecalculating && recalculationType === "soldes budgétaires" ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="mr-2 h-4 w-4" />
                )}
                Recalculer les soldes budgétaires
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleRecalculate("indicateurs KPI")}
                disabled={!canEdit || (isRecalculating && recalculationType === "indicateurs KPI")}
              >
                {isRecalculating && recalculationType === "indicateurs KPI" ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="mr-2 h-4 w-4" />
                )}
                Recalculer les indicateurs KPI
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleRecalculate("taux d'exécution")}
                disabled={!canEdit || (isRecalculating && recalculationType === "taux d'exécution")}
              >
                {isRecalculating && recalculationType === "taux d'exécution" ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="mr-2 h-4 w-4" />
                )}
                Recalculer les taux d'exécution
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Synchronisation métier
              </CardTitle>
              <CardDescription>Synchroniser les données entre modules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleSync("Bailleurs → Conventions → Projets")}
                disabled={!canEdit}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Bailleurs → Conventions → Projets
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => handleSync("Budgets ↔ Comptabilité")}
                disabled={!canEdit}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Budgets ↔ Comptabilité
              </Button>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 mt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="text-sm text-orange-800">
                    <p className="font-medium">Actions sensibles</p>
                    <p className="text-orange-700">Ces opérations peuvent prendre plusieurs minutes. Une confirmation sera demandée.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Nettoyage Tab */}
      <TabsContent value="nettoyage" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Détection des anomalies
            </CardTitle>
            <CardDescription>Identifier les données orphelines ou incohérentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleScanOrphans} disabled={isScanning}>
                {isScanning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Lancer l'analyse
                  </>
                )}
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Élément</TableHead>
                  <TableHead>Problème détecté</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockOrphanData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Badge variant="outline">{item.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        {item.issue}
                      </span>
                    </TableCell>
                    <TableCell>{item.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFixOrphan(item.id, item.name)}
                        disabled={!canEdit}
                      >
                        Corriger
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note :</strong> La correction assistée ne supprime jamais directement les données.
                Elle propose des solutions de rattachement ou d'archivage contrôlé.
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Documents Tab */}
      <TabsContent value="documents" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <Button className="w-full" onClick={handleReindexDocuments} disabled={!canEdit || isReindexing}>
                {isReindexing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Réindexation...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Réindexer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Button className="w-full" variant="outline" onClick={handleVerifySignatures}>
                <FileCheck className="mr-2 h-4 w-4" />
                Vérifier signatures
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Button className="w-full" variant="outline" onClick={handleCheckMissingDocs}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Docs manquants
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <Button className="w-full" variant="outline" onClick={() => toast.info("Génération du rapport documentaire...")}>
                <FileText className="mr-2 h-4 w-4" />
                Rapport
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>État des documents</CardTitle>
            <CardDescription>Statut et classification des documents</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Entité liée</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Dernière vérification</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{doc.entity}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {doc.status === "valid" && (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Valide
                        </Badge>
                      )}
                      {doc.status === "missing_signature" && (
                        <Badge variant="destructive">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Sans signature
                        </Badge>
                      )}
                      {doc.status === "unclassified" && (
                        <Badge variant="secondary">
                          Non classé
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{doc.lastCheck}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReclassifyDocument(doc.id, doc.name)}
                        disabled={!canEdit}
                      >
                        Reclassifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Alertes Tab */}
      <TabsContent value="alertes" className="space-y-4">
        <div className="flex gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Select value={selectedAlertType} onValueChange={setSelectedAlertType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type d'alerte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les alertes</SelectItem>
                <SelectItem value="budget">Dépassement budget</SelectItem>
                <SelectItem value="project">Retard projet</SelectItem>
                <SelectItem value="convention">Convention expirée</SelectItem>
                <SelectItem value="validation">Validations en attente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGlobalCoherenceCheck}>
            <Search className="mr-2 h-4 w-4" />
            Vérification cohérence globale
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertes actives
            </CardTitle>
            <CardDescription>Relancer manuellement les notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Entité</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAlerts
                  .filter(alert => selectedAlertType === "all" || alert.type === selectedAlertType)
                  .map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell>
                        <Badge variant="outline">{alert.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{alert.message}</TableCell>
                      <TableCell>{alert.entity}</TableCell>
                      <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                      <TableCell>{alert.date}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResendAlert(alert.id, alert.message)}
                          disabled={!canEdit}
                        >
                          <Bell className="mr-1 h-4 w-4" />
                          Relancer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
