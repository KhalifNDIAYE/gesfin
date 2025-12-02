import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Bell, Save } from "lucide-react";

export function NotificationsTab() {
  return (
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
  );
}
