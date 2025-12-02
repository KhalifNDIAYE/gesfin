import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FileText, Save } from "lucide-react";

export function ComptabiliteTab() {
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
  );
}
