import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Palette, Save } from "lucide-react";

export function InterfaceTab() {
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
  );
}
