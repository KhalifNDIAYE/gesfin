import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";

export function SystemeTab() {
  return (
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
  );
}
