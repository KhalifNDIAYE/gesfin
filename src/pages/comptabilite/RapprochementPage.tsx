import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Landmark, Upload, Download, CheckCircle, AlertCircle } from "lucide-react";
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

export default function RapprochementPage() {
  const [selectedBank, setSelectedBank] = useState<string>("");

  return (
    <AppLayout 
      title="Rapprochement Bancaire" 
      subtitle="Rapprochement des relevés bancaires avec la comptabilité"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Rapprochées</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Solde banque</p>
                  <p className="text-2xl font-bold">0,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-info" />
                <div>
                  <p className="text-sm text-muted-foreground">Solde comptable</p>
                  <p className="text-2xl font-bold">0,00</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rapprochement" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="rapprochement">Rapprochement</TabsTrigger>
              <TabsTrigger value="releves">Relevés importés</TabsTrigger>
              <TabsTrigger value="historique">Historique</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Select
                value={selectedBank}
                onValueChange={setSelectedBank}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Compte bancaire" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512100">512100 - Banque Principale</SelectItem>
                  <SelectItem value="512200">512200 - Banque Secondaire</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" />
                Importer relevé
              </Button>
            </div>
          </div>

          <TabsContent value="rapprochement" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Bank Statement */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Relevé bancaire</CardTitle>
                  <CardDescription>Opérations du relevé</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">
                          <Checkbox />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Importez un relevé bancaire
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Accounting Entries */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Écritures comptables</CardTitle>
                  <CardDescription>Opérations non rapprochées</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">
                          <Checkbox />
                        </TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Libellé</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Sélectionnez un compte bancaire
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="gradient" disabled>
                <CheckCircle className="h-4 w-4" />
                Rapprocher la sélection
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="releves">
            <Card>
              <CardHeader>
                <CardTitle>Relevés bancaires importés</CardTitle>
                <CardDescription>Historique des relevés</CardDescription>
              </CardHeader>
              <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
                Aucun relevé importé
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historique">
            <Card>
              <CardHeader>
                <CardTitle>Historique des rapprochements</CardTitle>
                <CardDescription>États de rapprochement validés</CardDescription>
              </CardHeader>
              <CardContent className="flex h-64 items-center justify-center text-muted-foreground">
                Aucun historique disponible
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
