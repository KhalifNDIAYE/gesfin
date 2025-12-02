import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { useThirdParties, useThirdPartyMutations, ThirdParty, ThirdPartyType } from "@/hooks/useComptabilite";
import { ThirdPartyDialog } from "./ThirdPartyDialog";

const THIRD_PARTY_TYPE_LABELS: Record<ThirdPartyType, string> = {
  fournisseur: "Fournisseur",
  client: "Client",
  employe: "Employé",
  bailleur: "Bailleur",
  autre: "Autre",
};

const TYPE_COLORS: Record<ThirdPartyType, string> = {
  fournisseur: "bg-blue-500/10 text-blue-600",
  client: "bg-green-500/10 text-green-600",
  employe: "bg-purple-500/10 text-purple-600",
  bailleur: "bg-orange-500/10 text-orange-600",
  autre: "bg-gray-500/10 text-gray-600",
};

export function ThirdPartiesTab() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedThirdParty, setSelectedThirdParty] = useState<ThirdParty | null>(null);
  const [thirdPartyToDelete, setThirdPartyToDelete] = useState<ThirdParty | null>(null);

  const { data: thirdParties, isLoading } = useThirdParties();
  const { deleteMutation } = useThirdPartyMutations();

  const filteredThirdParties = thirdParties?.filter(
    (tp) =>
      tp.name.toLowerCase().includes(search.toLowerCase()) ||
      tp.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (thirdParty: ThirdParty) => {
    setSelectedThirdParty(thirdParty);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (thirdPartyToDelete) {
      await deleteMutation.mutateAsync(thirdPartyToDelete.id);
      setThirdPartyToDelete(null);
    }
  };

  const handleOpenCreate = () => {
    setSelectedThirdParty(null);
    setDialogOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <div>
                <CardTitle>Gestion des Tiers</CardTitle>
                <CardDescription>
                  Fournisseurs, clients, employés et autres tiers
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="gradient" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4" />
                Nouveau tiers
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-muted-foreground">Chargement...</div>
            </div>
          ) : filteredThirdParties && filteredThirdParties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Compte auxiliaire</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredThirdParties.map((tp) => (
                  <TableRow key={tp.id}>
                    <TableCell className="font-mono font-medium">{tp.code}</TableCell>
                    <TableCell>{tp.name}</TableCell>
                    <TableCell>
                      <Badge className={TYPE_COLORS[tp.third_party_type]} variant="secondary">
                        {THIRD_PARTY_TYPE_LABELS[tp.third_party_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {tp.account_code || "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tp.email || tp.phone || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tp.is_active ? "default" : "secondary"}>
                        {tp.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(tp)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setThirdPartyToDelete(tp)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p>Aucun tiers trouvé</p>
              <p className="text-sm">Créez votre premier tiers</p>
            </div>
          )}
        </CardContent>
      </Card>

      <ThirdPartyDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        thirdParty={selectedThirdParty}
      />

      <AlertDialog open={!!thirdPartyToDelete} onOpenChange={() => setThirdPartyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le tiers ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le tiers {thirdPartyToDelete?.name} sera
              définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
