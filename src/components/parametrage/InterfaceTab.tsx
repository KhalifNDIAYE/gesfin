import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Palette, Save, Loader2 } from "lucide-react";
import { useInterfaceSettings, useInterfaceSettingsMutations } from "@/hooks/useInterfaceSettings";
import { usePermissions } from "@/hooks/usePermissions";

export function InterfaceTab() {
  const { data: settings, isLoading } = useInterfaceSettings();
  const { upsertSettings } = useInterfaceSettingsMutations();
  const { canAccess, isAdmin } = usePermissions();
  
  const canEdit = isAdmin || canAccess('parametres', 'update');

  const [language, setLanguage] = useState('Français');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [numberFormat, setNumberFormat] = useState('1 234 567,89');
  const [timezone, setTimezone] = useState('UTC+0 (Bamako)');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load existing settings
  useEffect(() => {
    if (settings) {
      setLanguage(settings.language);
      setDateFormat(settings.date_format);
      setNumberFormat(settings.number_format);
      setTimezone(settings.timezone);
      setSidebarCollapsed(settings.sidebar_collapsed);
    }
  }, [settings]);

  const handleSave = () => {
    upsertSettings.mutate({
      language,
      date_format: dateFormat,
      number_format: numberFormat,
      timezone,
      sidebar_collapsed: sidebarCollapsed,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Personnalisation de l'interface
        </CardTitle>
        <CardDescription>Apparence et préférences d'affichage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canEdit && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Vous n'avez pas la permission de modifier ces paramètres.
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="language">Langue</Label>
            <Input 
              id="language" 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-format">Format de date</Label>
            <Input 
              id="date-format" 
              value={dateFormat}
              onChange={(e) => setDateFormat(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="number-format">Format numérique</Label>
            <Input 
              id="number-format" 
              value={numberFormat}
              onChange={(e) => setNumberFormat(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Fuseau horaire</Label>
            <Input 
              id="timezone" 
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div className="space-y-0.5">
            <p className="font-medium">Sidebar réduite par défaut</p>
            <p className="text-sm text-muted-foreground">Afficher la sidebar en mode compact</p>
          </div>
          <Switch 
            checked={sidebarCollapsed}
            onCheckedChange={setSidebarCollapsed}
            disabled={!canEdit}
          />
        </div>
        <Button 
          variant="gradient" 
          onClick={handleSave}
          disabled={!canEdit || upsertSettings.isPending}
        >
          {upsertSettings.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </CardContent>
    </Card>
  );
}
