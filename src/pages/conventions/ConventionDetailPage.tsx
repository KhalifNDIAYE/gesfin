import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Plus, RefreshCw, CreditCard, BarChart3, Edit, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useConvention, useReplenishments, useDirectPayments, useFinancialReports, useDeleteReplenishment, useDeleteDirectPayment, useDeleteFinancialReport, Replenishment, DirectPayment, FinancialReport } from "@/hooks/useConventionsBailleurs";
import { ReplenishmentDialog } from "@/components/conventions/ReplenishmentDialog";
import { DirectPaymentDialog } from "@/components/conventions/DirectPaymentDialog";
import { FinancialReportDialog } from "@/components/conventions/FinancialReportDialog";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { useFinancialReportLines } from "@/hooks/useFinancialReportLines";
import { generateDetailedReportPDF } from "@/utils/reportGenerator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "Brouillon", variant: "secondary" },
  active: { label: "Active", variant: "default" },
  suspended: { label: "Suspendue", variant: "destructive" },
  closed: { label: "Clôturée", variant: "outline" },
  submitted: { label: "Soumis", variant: "outline" },
  approved: { label: "Approuvé", variant: "default" },
  received: { label: "Reçu", variant: "default" },
  paid: { label: "Payé", variant: "default" },
  rejected: { label: "Rejeté", variant: "destructive" },
};

const reportTypeLabels: Record<string, string> = {
  ifr: "IFR",
  rsf: "RSF",
  soe: "SOE",
};

export default function ConventionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: convention, isLoading } = useConvention(id || "");
  const { data: replenishments } = useReplenishments(id);
  const { data: directPayments } = useDirectPayments(id);
  const { data: financialReports } = useFinancialReports(id);
  
  const { data: expenseCategories = [] } = useExpenseCategories();
  
  const deleteReplenishment = useDeleteReplenishment();
  const deleteDirectPayment = useDeleteDirectPayment();
  const deleteFinancialReport = useDeleteFinancialReport();

  const [replenishmentDialog, setReplenishmentDialog] = useState(false);
  const [directPaymentDialog, setDirectPaymentDialog] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [selectedReplenishment, setSelectedReplenishment] = useState<Replenishment | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<DirectPayment | null>(null);
  const [selectedReport, setSelectedReport] = useState<FinancialReport | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ type: string; id: string } | null>(null);

  const formatAmount = (amount: number, symbol?: string) => new Intl.NumberFormat("fr-FR").format(amount) + (symbol ? ` ${symbol}` : "");

  const generateReportPDF = async (report: FinancialReport) => {
    try {
      // Fetch report lines for detailed breakdown
      const { data: reportLines, error } = await supabase
        .from('financial_report_lines')
        .select('*')
        .eq('financial_report_id', report.id)
        .order('line_number');
      
      if (error) {
        console.error('Error fetching report lines:', error);
      }

      generateDetailedReportPDF(
        report,
        convention!,
        reportLines || [],
        expenseCategories
      );
      
      toast.success('Rapport PDF généré avec succès');
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    if (deleteItem.type === "replenishment") await deleteReplenishment.mutateAsync(deleteItem.id);
    else if (deleteItem.type === "payment") await deleteDirectPayment.mutateAsync(deleteItem.id);
    else if (deleteItem.type === "report") await deleteFinancialReport.mutateAsync(deleteItem.id);
    setDeleteItem(null);
  };

  if (isLoading) return <div className="p-6">Chargement...</div>;
  if (!convention) return <div className="p-6">Convention non trouvée</div>;

  const disbursementRate = convention.total_amount ? (convention.disbursed_amount / convention.total_amount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/conventions")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8" />
            {convention.code}
          </h1>
          <p className="text-muted-foreground">{convention.name}</p>
        </div>
        <Badge variant={statusLabels[convention.status]?.variant || "secondary"} className="text-sm">
          {statusLabels[convention.status]?.label || convention.status}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Bailleur</div>
            <div className="text-lg font-semibold">{convention.bailleur?.short_name || convention.bailleur?.name}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Montant total</div>
            <div className="text-lg font-semibold">{formatAmount(convention.total_amount, convention.currency?.symbol)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Décaissé</div>
            <div className="text-lg font-semibold">{formatAmount(convention.disbursed_amount, convention.currency?.symbol)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Restant</div>
            <div className="text-lg font-semibold">{formatAmount(convention.remaining_amount, convention.currency?.symbol)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Taux de décaissement</span>
            <span>{disbursementRate.toFixed(1)}%</span>
          </div>
          <Progress value={disbursementRate} className="h-3" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="replenishments">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="replenishments" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Réapprovisionnements ({replenishments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Paiements directs ({directPayments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Rapports ({financialReports?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="replenishments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Demandes de réapprovisionnement</CardTitle>
              <Button onClick={() => { setSelectedReplenishment(null); setReplenishmentDialog(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Nouvelle demande
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Date demande</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date réception</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {replenishments?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.code}</TableCell>
                      <TableCell>{format(new Date(r.request_date), "dd/MM/yyyy", { locale: fr })}</TableCell>
                      <TableCell>{formatAmount(r.amount, convention.currency?.symbol)}</TableCell>
                      <TableCell>{r.received_date ? format(new Date(r.received_date), "dd/MM/yyyy", { locale: fr }) : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[r.status]?.variant || "secondary"}>
                          {statusLabels[r.status]?.label || r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => { setSelectedReplenishment(r); setReplenishmentDialog(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteItem({ type: "replenishment", id: r.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Paiements directs</CardTitle>
              <Button onClick={() => { setSelectedPayment(null); setDirectPaymentDialog(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Nouveau paiement
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Date demande</TableHead>
                    <TableHead>Date paiement</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {directPayments?.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.code}</TableCell>
                      <TableCell>{p.beneficiary_name}</TableCell>
                      <TableCell>{formatAmount(p.amount, convention.currency?.symbol)}</TableCell>
                      <TableCell>{format(new Date(p.request_date), "dd/MM/yyyy", { locale: fr })}</TableCell>
                      <TableCell>{p.payment_date ? format(new Date(p.payment_date), "dd/MM/yyyy", { locale: fr }) : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[p.status]?.variant || "secondary"}>
                          {statusLabels[p.status]?.label || p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => { setSelectedPayment(p); setDirectPaymentDialog(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteItem({ type: "payment", id: p.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Rapports financiers (IFR, RSF, SOE)</CardTitle>
              <Button onClick={() => { setSelectedReport(null); setReportDialog(true); }}>
                <Plus className="mr-2 h-4 w-4" /> Nouveau rapport
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Total dépenses</TableHead>
                    <TableHead>Réappro. demandé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialReports?.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{reportTypeLabels[r.report_type]}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(r.period_start), "dd/MM/yy")} - {format(new Date(r.period_end), "dd/MM/yy")}
                      </TableCell>
                      <TableCell>{formatAmount(r.total_expenses, convention.currency?.symbol)}</TableCell>
                      <TableCell>{formatAmount(r.replenishment_requested, convention.currency?.symbol)}</TableCell>
                      <TableCell>
                        <Badge variant={statusLabels[r.status]?.variant || "secondary"}>
                          {statusLabels[r.status]?.label || r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={() => generateReportPDF(r)} title="Télécharger PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => { setSelectedReport(r); setReportDialog(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setDeleteItem({ type: "report", id: r.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ReplenishmentDialog open={replenishmentDialog} onOpenChange={setReplenishmentDialog} replenishment={selectedReplenishment} conventionId={id} />
      <DirectPaymentDialog open={directPaymentDialog} onOpenChange={setDirectPaymentDialog} payment={selectedPayment} conventionId={id} />
      <FinancialReportDialog open={reportDialog} onOpenChange={setReportDialog} report={selectedReport} conventionId={id} />

      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
