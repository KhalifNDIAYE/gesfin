import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Save, AlertTriangle, Bell, Mail, FileText, Ban } from "lucide-react";
import { toast } from "sonner";

interface BudgetAlertSetting {
  id: string;
  level: string;
  label: string;
  threshold_percentage: number;
  is_enabled: boolean;
  send_notification: boolean;
  send_email: boolean;
  log_to_audit: boolean;
  block_operations: boolean;
  budget_alert_recipients?: { role_id: string }[];
}

interface Role {
  id: string;
  name: string;
  description: string | null;
}

export function BudgetAlertsTab() {
  const queryClient = useQueryClient();
  const [editingSettings, setEditingSettings] = useState<Record<string, BudgetAlertSetting>>({});

  // Fetch alert settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['budget-alert-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_alert_settings')
        .select('*, budget_alert_recipients(role_id)')
        .order('threshold_percentage', { ascending: true });
      if (error) throw error;
      return data as BudgetAlertSetting[];
    },
  });

  // Fetch roles
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, description')
        .order('name');
      if (error) throw error;
      return data as Role[];
    },
  });

  // Update settings mutation
  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BudgetAlertSetting> & { id: string }) => {
      const { error } = await supabase
        .from('budget_alert_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-alert-settings'] });
      toast.success('Paramètres mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  // Update recipients mutation
  const updateRecipientsMutation = useMutation({
    mutationFn: async ({ settingId, roleIds }: { settingId: string; roleIds: string[] }) => {
      // Delete existing recipients
      await supabase
        .from('budget_alert_recipients')
        .delete()
        .eq('alert_setting_id', settingId);

      // Insert new recipients
      if (roleIds.length > 0) {
        const { error } = await supabase
          .from('budget_alert_recipients')
          .insert(roleIds.map(roleId => ({ 
            alert_setting_id: settingId, 
            role_id: roleId 
          })));
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-alert-settings'] });
      toast.success('Destinataires mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur: ' + error.message);
    },
  });

  const handleToggle = (setting: BudgetAlertSetting, field: keyof BudgetAlertSetting) => {
    updateSettingMutation.mutate({
      id: setting.id,
      [field]: !setting[field as keyof BudgetAlertSetting],
    });
  };

  const handleThresholdChange = (setting: BudgetAlertSetting, value: number) => {
    setEditingSettings(prev => ({
      ...prev,
      [setting.id]: { ...setting, threshold_percentage: value },
    }));
  };

  const handleSaveThreshold = (settingId: string) => {
    const editedSetting = editingSettings[settingId];
    if (editedSetting) {
      updateSettingMutation.mutate({
        id: settingId,
        threshold_percentage: editedSetting.threshold_percentage,
      });
      setEditingSettings(prev => {
        const newState = { ...prev };
        delete newState[settingId];
        return newState;
      });
    }
  };

  const handleRoleToggle = (setting: BudgetAlertSetting, roleId: string) => {
    const currentRoleIds = setting.budget_alert_recipients?.map(r => r.role_id) || [];
    const newRoleIds = currentRoleIds.includes(roleId)
      ? currentRoleIds.filter(id => id !== roleId)
      : [...currentRoleIds, roleId];
    
    updateRecipientsMutation.mutate({
      settingId: setting.id,
      roleIds: newRoleIds,
    });
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'preventive':
        return <Bell className="h-5 w-5 text-amber-500" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'blocking':
        return <Ban className="h-5 w-5 text-destructive" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'preventive':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">Préventive</Badge>;
      case 'critical':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">Critique</Badge>;
      case 'blocking':
        return <Badge variant="destructive">Blocage</Badge>;
      default:
        return <Badge variant="secondary">{level}</Badge>;
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Paramétrage des alertes budgétaires
          </CardTitle>
          <CardDescription>
            Configurez les seuils d'alerte, les destinataires et les actions à déclencher pour chaque niveau d'alerte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {settings?.map((setting) => {
            const editedSetting = editingSettings[setting.id];
            const currentThreshold = editedSetting?.threshold_percentage ?? setting.threshold_percentage;
            const selectedRoleIds = setting.budget_alert_recipients?.map(r => r.role_id) || [];

            return (
              <Card key={setting.id} className="border-2">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getLevelIcon(setting.level)}
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {setting.label}
                          {getLevelBadge(setting.level)}
                        </CardTitle>
                        <CardDescription>
                          Seuil: {currentThreshold}% du budget consommé
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`enabled-${setting.id}`} className="text-sm">
                        Activée
                      </Label>
                      <Switch
                        id={`enabled-${setting.id}`}
                        checked={setting.is_enabled}
                        onCheckedChange={() => handleToggle(setting, 'is_enabled')}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Threshold Configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Seuil de déclenchement (%)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={currentThreshold}
                          onChange={(e) => handleThresholdChange(setting, Number(e.target.value))}
                          className="w-24"
                          disabled={setting.level === 'blocking'}
                        />
                        {editedSetting && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveThreshold(setting.id)}
                            disabled={updateSettingMutation.isPending}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Enregistrer
                          </Button>
                        )}
                        {setting.level === 'blocking' && (
                          <span className="text-xs text-muted-foreground self-center">
                            (Le seuil de blocage est fixé à 100%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Configuration */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Actions à déclencher</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`notification-${setting.id}`}
                          checked={setting.send_notification}
                          onCheckedChange={() => handleToggle(setting, 'send_notification')}
                        />
                        <Label htmlFor={`notification-${setting.id}`} className="flex items-center gap-1 text-sm">
                          <Bell className="h-4 w-4" />
                          Notification
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`email-${setting.id}`}
                          checked={setting.send_email}
                          onCheckedChange={() => handleToggle(setting, 'send_email')}
                        />
                        <Label htmlFor={`email-${setting.id}`} className="flex items-center gap-1 text-sm">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`audit-${setting.id}`}
                          checked={setting.log_to_audit}
                          onCheckedChange={() => handleToggle(setting, 'log_to_audit')}
                        />
                        <Label htmlFor={`audit-${setting.id}`} className="flex items-center gap-1 text-sm">
                          <FileText className="h-4 w-4" />
                          Audit
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`block-${setting.id}`}
                          checked={setting.block_operations}
                          onCheckedChange={() => handleToggle(setting, 'block_operations')}
                          disabled={setting.level === 'blocking'}
                        />
                        <Label htmlFor={`block-${setting.id}`} className="flex items-center gap-1 text-sm">
                          <Ban className="h-4 w-4" />
                          Blocage
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Recipients Configuration */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Destinataires des alertes</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {roles?.map((role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${setting.id}-${role.id}`}
                            checked={selectedRoleIds.includes(role.id)}
                            onCheckedChange={() => handleRoleToggle(setting, role.id)}
                          />
                          <Label 
                            htmlFor={`role-${setting.id}-${role.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {role.name.toUpperCase()}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {selectedRoleIds.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Aucun destinataire sélectionné. Les alertes ne seront pas envoyées.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Fonctionnement des alertes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Alerte préventive (80%)</strong>: Avertissement envoyé lorsque la consommation budgétaire atteint le seuil configuré.
          </p>
          <p>
            <strong>Alerte critique (90%)</strong>: Alerte urgente signalant un risque imminent de dépassement budgétaire.
          </p>
          <p>
            <strong>Blocage total (100%)</strong>: Bloque toute nouvelle dépense sur la ligne budgétaire concernée.
          </p>
          <p className="pt-2 text-xs">
            Les alertes sont déclenchées automatiquement après chaque création de dépense. Pour éviter les doublons, 
            une même alerte ne sera pas renvoyée dans les 24 heures suivant son émission.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
