import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Link2, Unlink, Wand2, Users } from "lucide-react";
import { useThirdParties } from "@/hooks/useComptabilite";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";

export default function LettragePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThirdParty, setSelectedThirdParty] = useState<string>("");
  const [selectedLines, setSelectedLines] = useState<string[]>([]);

  const { data: thirdParties } = useThirdParties();

  const handleLettering = () => {
    console.log("Lettrage des lignes:", selectedLines);
  };

  const handleAutoLettering = () => {
    console.log("Lettrage automatique pour:", selectedThirdParty);
  };

  return (
    <AppLayout 
      title="Lettrage" 
      subtitle="Rapprochement des écritures de tiers"
    >
      <div className="space-y-6">
        <Tabs defaultValue="manual" className="space-y-4">
          <TabsList>
            <TabsTrigger value="manual">Lettrage Manuel</TabsTrigger>
            <TabsTrigger value="auto">Lettrage Automatique</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5" />
                    <div>
                      <CardTitle>Lettrage Manuel</CardTitle>
                      <CardDescription>Sélectionnez les lignes à lettrer</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={selectedThirdParty}
                      onValueChange={setSelectedThirdParty}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Sélectionner un tiers" />
                      </SelectTrigger>
                      <SelectContent>
                        {thirdParties?.map((tp) => (
                          <SelectItem key={tp.id} value={tp.id}>
                            {tp.code} - {tp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Button 
                      variant="gradient" 
                      size="sm" 
                      onClick={handleLettering}
                      disabled={selectedLines.length < 2}
                    >
                      <Link2 className="h-4 w-4" />
                      Lettrer ({selectedLines.length})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedThirdParty ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>N° Pièce</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead className="text-right">Débit</TableHead>
                        <TableHead className="text-right">Crédit</TableHead>
                        <TableHead>Lettrage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Aucune écriture non lettrée pour ce tiers
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Users className="h-12 w-12 mb-4 opacity-50" />
                    <p>Sélectionnez un tiers</p>
                    <p className="text-sm">pour afficher ses écritures non lettrées</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auto" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  <div>
                    <CardTitle>Lettrage Automatique</CardTitle>
                    <CardDescription>
                      Rapprochement automatique des écritures par montant et référence
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tiers</label>
                    <Select
                      value={selectedThirdParty}
                      onValueChange={setSelectedThirdParty}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les tiers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous les tiers</SelectItem>
                        {thirdParties?.map((tp) => (
                          <SelectItem key={tp.id} value={tp.id}>
                            {tp.code} - {tp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Critères de rapprochement</label>
                    <Select defaultValue="montant">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="montant">Par montant exact</SelectItem>
                        <SelectItem value="reference">Par référence</SelectItem>
                        <SelectItem value="both">Montant et référence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="gradient" onClick={handleAutoLettering}>
                    <Wand2 className="h-4 w-4" />
                    Lancer le lettrage automatique
                  </Button>
                  <Button variant="outline">
                    <Unlink className="h-4 w-4" />
                    Délettrer tout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
