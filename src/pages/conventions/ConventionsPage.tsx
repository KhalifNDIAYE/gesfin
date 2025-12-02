import { useState } from "react";
import { Plus, Edit, Trash2, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useConventions, useDeleteConvention, Convention } from "@/hooks/useConventionsBailleurs";
import { ConventionDialog } from "@/components/conventions/ConventionDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  suspended: { label: "Suspendue", variant: "destructive" },
  closed: { label: "Clôturée", variant: "outline" },
};

export default function ConventionsPage() {
  const { data: conventions, isLoading } = useConventions();
  const deleteConvention = useDeleteConvention();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConvention, setSelectedConvention] = useState<Convention | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const formatAmount = (amount: number, symbol?: string) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + (symbol ? ` ${symbol}` : "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Conventions</h1>
          <p className="text-muted-foreground">Gestion des conventions de financement</p>
        </div>
        <Button onClick={() => { setSelectedConvention(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nouvelle convention
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Liste des conventions ({conventions?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Bailleur</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Décaissé</TableHead>
                  <TableHead>Clôture</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conventions?.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.code}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{c.name}</TableCell>
                    <TableCell>{c.bailleur?.short_name || c.bailleur?.name}</TableCell>
                    <TableCell>{formatAmount(c.total_amount, c.currency?.symbol)}</TableCell>
                    <TableCell>{formatAmount(c.disbursed_amount, c.currency?.symbol)}</TableCell>
                    <TableCell>{c.closing_date ? format(new Date(c.closing_date), "dd/MM/yyyy", { locale: fr }) : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[c.status]?.variant || "secondary"}>
                        {statusLabels[c.status]?.label || c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/conventions/${c.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setSelectedConvention(c); setDialogOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConventionDialog open={dialogOpen} onOpenChange={setDialogOpen} convention={selectedConvention} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action supprimera la convention et toutes les données associées.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={async () => { if (deleteId) { await deleteConvention.mutateAsync(deleteId); setDeleteId(null); } }}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
