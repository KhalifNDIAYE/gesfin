import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Save, Mail, Settings, History, AlertTriangle, CheckCircle, XCircle, Loader2, Info } from "lucide-react";
import { useEmailNotificationSettings, useEmailAlertTypes, useEmailLogs, useEmailNotificationMutations, EmailAlertType } from "@/hooks/useEmailNotifications";
import { useRoles } from "@/hooks/useRoles";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const severityConfig = {
  critical: { label: 'Critique', color: 'bg-destructive text-destructive-foreground' },
  major: { label: 'Majeur', color: 'bg-orange-500 text-white' },
  warning: { label: 'Avertissement', color: 'bg-yellow-500 text-black' },
};

const statusConfig = {
  pending: { label: 'En attente', icon: Loader2, color: 'text-muted-foreground' },
  sent: { label: 'Envoyé', icon: CheckCircle, color: 'text-green-500' },
  failed: { label: 'Échec', icon: XCircle, color: 'text-destructive' },
};

export function NotificationsTab() {
  const { data: settings, isLoading: settingsLoading } = useEmailNotificationSettings();
  const { data: alertTypes, isLoading: alertTypesLoading } = useEmailAlertTypes();
  const { data: emailLogs, isLoading: logsLoading } = useEmailLogs();
  const { data: roles } = useRoles();
  const { updateSettings, updateAlertType, updateAlertRecipients } = useEmailNotificationMutations();

  const [formData, setFormData] = useState({
    is_enabled: false,
    from_email: '',
    from_name: '',
  });

  const [selectedRecipients, setSelectedRecipients] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (settings) {
      setFormData({
        is_enabled: settings.is_enabled,
        from_email: settings.from_email || '',
        from_name: settings.from_name || '',
      });
    }
  }, [settings]);

  useEffect(() => {
    if (alertTypes) {
      const recipients: Record<string, string[]> = {};
      alertTypes.forEach((at) => {
        recipients[at.id] = at.email_alert_recipients?.map((r) => r.role_id) || [];
      });
      setSelectedRecipients(recipients);
    }
  }, [alertTypes]);

  const handleSaveSettings = () => {
    updateSettings.mutate(formData);
  };

  const handleAlertTypeToggle = (alertType: EmailAlertType, field: 'is_enabled' | 'send_immediately', value: boolean) => {
    updateAlertType.mutate({ id: alertType.id, [field]: value });
  };

  const handleRecipientToggle = (alertTypeId: string, roleId: string) => {
    const current = selectedRecipients[alertTypeId] || [];
    const updated = current.includes(roleId)
      ? current.filter((id) => id !== roleId)
      : [...current, roleId];
    
    setSelectedRecipients((prev) => ({ ...prev, [alertTypeId]: updated }));
    updateAlertRecipients.mutate({ alertTypeId, roleIds: updated });
  };

  if (settingsLoading || alertTypesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="config" className="space-y-4">
      <TabsList>
        <TabsTrigger value="config" className="gap-2">
          <Settings className="h-4 w-4" />
          Configuration
        </TabsTrigger>
        <TabsTrigger value="alerts" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          Types d'alertes
        </TabsTrigger>
        <TabsTrigger value="history" className="gap-2">
          <History className="h-4 w-4" />
          Historique
        </TabsTrigger>
      </TabsList>

      <TabsContent value="config">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Configuration Email
            </CardTitle>
            <CardDescription>
              Configurer l'envoi automatique des alertes par email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email Service Info */}
            <div className="flex items-start gap-3 rounded-lg border border-border p-4 bg-muted/30">
              <Info className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Service d'envoi d'emails</p>
                <p className="text-sm text-muted-foreground">
                  Les emails sont envoyés via Resend, un service sécurisé de livraison d'emails. 
                  Les identifiants sont stockés de manière sécurisée dans les secrets du serveur.
                </p>
              </div>
            </div>

            {/* Enable/Disable */}
            <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/30">
              <div className="space-y-0.5">
                <p className="font-medium">Activer les notifications par email</p>
                <p className="text-sm text-muted-foreground">
                  Les alertes seront envoyées automatiquement aux destinataires configurés
                </p>
              </div>
              <Switch
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_enabled: checked }))}
              />
            </div>

            {formData.is_enabled && (
              <>
                {/* From Address */}
                <div className="space-y-4 rounded-lg border border-border p-4">
                  <h3 className="font-medium">Adresse d'expédition</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="from_name">Nom de l'expéditeur</Label>
                      <Input
                        id="from_name"
                        placeholder="Système de Gestion"
                        value={formData.from_name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, from_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="from_email">Email de l'expéditeur</Label>
                      <Input
                        id="from_email"
                        type="email"
                        placeholder="alerts@votredomaine.com"
                        value={formData.from_email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, from_email: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Doit être un domaine vérifié sur Resend
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button variant="gradient" onClick={handleSaveSettings} disabled={updateSettings.isPending}>
              {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="alerts">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Types d'alertes
            </CardTitle>
            <CardDescription>
              Configurer les alertes à envoyer et leurs destinataires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type d'alerte</TableHead>
                  <TableHead>Sévérité</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead>Envoi immédiat</TableHead>
                  <TableHead>Destinataires (rôles)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertTypes?.map((alertType) => (
                  <TableRow key={alertType.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{alertType.name}</p>
                        <p className="text-sm text-muted-foreground">{alertType.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={severityConfig[alertType.severity].color}>
                        {severityConfig[alertType.severity].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={alertType.is_enabled}
                        onCheckedChange={(checked) => handleAlertTypeToggle(alertType, 'is_enabled', checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={alertType.send_immediately}
                        onCheckedChange={(checked) => handleAlertTypeToggle(alertType, 'send_immediately', checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {roles?.map((role) => (
                          <div key={role.id} className="flex items-center gap-1">
                            <Checkbox
                              id={`${alertType.id}-${role.id}`}
                              checked={selectedRecipients[alertType.id]?.includes(role.id) || false}
                              onCheckedChange={() => handleRecipientToggle(alertType.id, role.id)}
                            />
                            <Label htmlFor={`${alertType.id}-${role.id}`} className="text-xs cursor-pointer">
                              {role.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="history">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Historique des emails
            </CardTitle>
            <CardDescription>
              Les 50 derniers emails envoyés
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : emailLogs?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun email envoyé pour le moment
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Destinataire</TableHead>
                    <TableHead>Sujet</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLogs?.map((log) => {
                    const StatusIcon = statusConfig[log.status].icon;
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{log.recipient_name || '-'}</p>
                            <p className="text-xs text-muted-foreground">{log.recipient_email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {log.subject}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.related_module || '-'}
                        </TableCell>
                        <TableCell>
                          <div className={`flex items-center gap-1 ${statusConfig[log.status].color}`}>
                            <StatusIcon className={`h-4 w-4 ${log.status === 'pending' ? 'animate-spin' : ''}`} />
                            <span className="text-sm">{statusConfig[log.status].label}</span>
                          </div>
                          {log.error_message && (
                            <p className="text-xs text-destructive mt-1">{log.error_message}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
