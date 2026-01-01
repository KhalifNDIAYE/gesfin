import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileText, Save, Loader2 } from "lucide-react";
import { useAccountingSettings, useAccountingSettingsMutations } from "@/hooks/useAccountingSettings";
import { usePermissions } from "@/hooks/usePermissions";
import { Skeleton } from "@/components/ui/skeleton";

export function ComptabiliteTab() {
  const { data: settings, isLoading } = useAccountingSettings();
  const { updateSettings } = useAccountingSettingsMutations();
  const { canAccess } = usePermissions();
  
  const canEdit = canAccess('parametres', 'update');

  const [fiscalYear, setFiscalYear] = useState("");
  const [currency, setCurrency] = useState("");
  const [chartOfAccounts, setChartOfAccounts] = useState("");
  const [vatRate, setVatRate] = useState<number>(18);
  const [autoNumbering, setAutoNumbering] = useState(true);
  const [twoStepValidation, setTwoStepValidation] = useState(true);

  // Load settings into state when data is fetched
  useEffect(() => {
    if (settings) {
      setFiscalYear(settings.current_fiscal_year);
      setCurrency(settings.default_currency);
      setChartOfAccounts(settings.chart_of_accounts);
      setVatRate(settings.default_vat_rate);
      setAutoNumbering(settings.auto_numbering_enabled);
      setTwoStepValidation(settings.two_step_validation_enabled);
    }
  }, [settings]);

  const handleSave = () => {
    if (!fiscalYear || !currency || !chartOfAccounts) {
      return;
    }

    updateSettings.mutate({
      current_fiscal_year: fiscalYear,
      default_currency: currency,
      chart_of_accounts: chartOfAccounts,
      default_vat_rate: vatRate,
      auto_numbering_enabled: autoNumbering,
      two_step_validation_enabled: twoStepValidation,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
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
            <Input 
              id="fiscal-year" 
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Devise</Label>
            <Input 
              id="currency" 
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chart">Plan comptable</Label>
            <Input 
              id="chart" 
              value={chartOfAccounts}
              onChange={(e) => setChartOfAccounts(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vat-rate">Taux TVA par défaut (%)</Label>
            <Input 
              id="vat-rate" 
              type="number" 
              min={0}
              max={100}
              value={vatRate}
              onChange={(e) => setVatRate(Number(e.target.value))}
              disabled={!canEdit}
            />
          </div>
        </div>
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <p className="font-medium">Numérotation automatique des pièces</p>
              <p className="text-sm text-muted-foreground">Générer automatiquement les numéros de pièce</p>
            </div>
            <Switch 
              checked={autoNumbering}
              onCheckedChange={setAutoNumbering}
              disabled={!canEdit}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <p className="font-medium">Validation en deux étapes</p>
              <p className="text-sm text-muted-foreground">Exiger une double validation pour les écritures</p>
            </div>
            <Switch 
              checked={twoStepValidation}
              onCheckedChange={setTwoStepValidation}
              disabled={!canEdit}
            />
          </div>
        </div>
        {canEdit ? (
          <Button 
            variant="gradient" 
            onClick={handleSave}
            disabled={updateSettings.isPending || !fiscalYear || !currency || !chartOfAccounts}
          >
            {updateSettings.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Enregistrer
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Vous n'avez pas la permission de modifier ces paramètres.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
