import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Building,
  Globe,
  Bell,
  Palette,
  Database,
  FileText,
  Save
} from "lucide-react";

const Parametres = () => {
  return (
    <AppLayout 
      title="Paramètres" 
      subtitle="Configuration générale du système"
    >
      <div className="space-y-6">
        <Tabs defaultValue="organisation" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="organisation">Organisation</TabsTrigger>
            <TabsTrigger value="comptabilite">Comptabilité</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="interface">Interface</TabsTrigger>
            <TabsTrigger value="systeme">Système</TabsTrigger>
          </TabsList>

          <TabsContent value="organisation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations de l'organisation
                </CardTitle>
                <CardDescription>Paramètres généraux de votre structure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="org-name">Nom de l'organisation</Label>
                    <Input id="org-name" defaultValue="Ministère des Finances" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-code">Code organisation</Label>
                    <Input id="org-code" defaultValue="MINFIN-001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-address">Adresse</Label>
                    <Input id="org-address" defaultValue="Avenue de l'Indépendance, Bamako" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-country">Pays</Label>
                    <Input id="org-country" defaultValue="Mali" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-email">Email principal</Label>
                    <Input id="org-email" type="email" defaultValue="contact@finances.gouv.ml" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="org-phone">Téléphone</Label>
                    <Input id="org-phone" defaultValue="+223 20 22 XX XX" />
                  </div>
                </div>
                <Button variant="gradient">
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comptabilite" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Paramètres comptables
                </CardTitle>
                <CardDescription>Configuration du plan comptable et des exercices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fiscal-year">Exercice fiscal en cours</Label>
                    <Input id="fiscal-year" defaultValue="2024" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Devise</Label>
                    <Input id="currency" defaultValue="FCFA" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chart">Plan comptable</Label>
                    <Input id="chart" defaultValue="SYSCOHADA révisé" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vat-rate">Taux TVA par défaut (%)</Label>
                    <Input id="vat-rate" type="number" defaultValue="18" />
                  </div>
                </div>
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <p className="font-medium">Numérotation automatique des pièces</p>
                      <p className="text-sm text-muted-foreground">Générer automatiquement les numéros de pièce</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <p className="font-medium">Validation en deux étapes</p>
                      <p className="text-sm text-muted-foreground">Exiger une double validation pour les écritures</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <Button variant="gradient">
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Préférences de notification
                </CardTitle>
                <CardDescription>Configurer les alertes et rappels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <p className="font-medium">Alertes de dépassement budgétaire</p>
                    <p className="text-sm text-muted-foreground">Notification en cas de dépassement</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <p className="font-medium">Rappels de conventions expirantes</p>
                    <p className="text-sm text-muted-foreground">30 jours avant l'expiration</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <p className="font-medium">Notifications par email</p>
                    <p className="text-sm text-muted-foreground">Recevoir les alertes par email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <p className="font-medium">Rapport quotidien</p>
                    <p className="text-sm text-muted-foreground">Résumé des opérations du jour</p>
                  </div>
                  <Switch />
                </div>
                <Button variant="gradient">
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interface" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Personnalisation de l'interface
                </CardTitle>
                <CardDescription>Apparence et préférences d'affichage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="language">Langue</Label>
                    <Input id="language" defaultValue="Français" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Format de date</Label>
                    <Input id="date-format" defaultValue="DD/MM/YYYY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number-format">Format numérique</Label>
                    <Input id="number-format" defaultValue="1 234 567,89" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Fuseau horaire</Label>
                    <Input id="timezone" defaultValue="UTC+0 (Bamako)" />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="space-y-0.5">
                    <p className="font-medium">Sidebar réduite par défaut</p>
                    <p className="text-sm text-muted-foreground">Afficher la sidebar en mode compact</p>
                  </div>
                  <Switch />
                </div>
                <Button variant="gradient">
                  <Save className="h-4 w-4" />
                  Enregistrer
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="systeme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Informations système
                </CardTitle>
                <CardDescription>Version et maintenance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Version de l'application</p>
                    <p className="text-lg font-semibold">2.4.1</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
                    <p className="text-lg font-semibold">15 janvier 2024</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Base de données</p>
                    <p className="text-lg font-semibold">PostgreSQL 15.2</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground">Espace utilisé</p>
                    <p className="text-lg font-semibold">24.7 GB / 100 GB</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Vérifier les mises à jour</Button>
                  <Button variant="outline">Documentation</Button>
                  <Button variant="outline">Support technique</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Parametres;
