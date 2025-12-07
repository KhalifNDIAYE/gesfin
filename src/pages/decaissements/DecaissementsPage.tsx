import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PermissionButton } from "@/components/auth/PermissionButton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Search, 
  Plus,
  TrendingUp,
  CalendarIcon,
  X,
  Eye,
  CreditCard
} from "lucide-react";
import { useDisbursementStats, useFluxEvolution, useRecentMovements } from "@/hooks/useDecaissements";
import { DisbursementWorkflowActions } from "@/components/decaissements/DisbursementWorkflowActions";
import { DisbursementWorkflowStatus, DISBURSEMENT_STATUS_LABELS, DISBURSEMENT_STATUS_COLORS } from "@/hooks/useDisbursementWorkflow";
import { formatCurrency, cn } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { useProjects } from "@/hooks/useProjects";
import { TableExportButtons, ExportColumn } from "@/components/export/TableExportButtons";

const PAYMENT_METHODS: Record<string, string> = {
  transfer: "Virement",
  check: "Chèque",
  cash: "Espèces",
  card: "Carte",
};

const STATUS_OPTIONS = [
  { value: "brouillon", label: "Brouillon" },
  { value: "soumis", label: "Soumis" },
  { value: "valide_daf", label: "Validé DAF" },
  { value: "valide_dg", label: "Validé DG" },
  { value: "paye", label: "Payé" },
  { value: "rejete", label: "Rejeté" },
];

const DecaissementsPage = () => {
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  const { data: stats, isLoading: statsLoading } = useDisbursementStats();
  const { data: fluxData } = useFluxEvolution();
  const { data: movements, isLoading: movementsLoading } = useRecentMovements();
  const { projects } = useProjects();

  const filteredMovements = movements?.filter(m => {
    const matchesSearch = 
      m.reference.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      m.beneficiary.toLowerCase().includes(search.toLowerCase());
    
    const matchesProject = projectFilter === "all" || m.project === projectFilter;
    const matchesStatus = statusFilter === "all" || m.workflow_status === statusFilter;
    const matchesDate = !dateFilter || (m.date && format(new Date(m.date), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd'));

    return matchesSearch && matchesProject && matchesStatus && matchesDate;
  });

  const handleExport = () => {
    toast.success("Export des décaissements en cours...");
  };

  const handleNewMovement = () => {
    toast.info("Fonctionnalité de nouveau décaissement à venir");
  };

  const clearFilters = () => {
    setProjectFilter("all");
    setStatusFilter("all");
    setDateFilter(undefined);
    setSearch("");
  };

  const hasActiveFilters = projectFilter !== "all" || statusFilter !== "all" || dateFilter !== undefined;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground" },
      soumis: { label: "Soumis", className: "bg-info/10 text-info border-info/20" },
      valide_daf: { label: "Validé DAF", className: "bg-warning/10 text-warning border-warning/20" },
      valide_dg: { label: "Validé DG", className: "bg-primary/10 text-primary border-primary/20" },
      paye: { label: "Payé", className: "bg-success/10 text-success border-success/20" },
      rejete: { label: "Rejeté", className: "bg-destructive/10 text-destructive border-destructive/20" },
    };
    const config = statusConfig[status] || { label: status, className: "" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPaymentMethodBadge = (method: string) => {
    return (
      <Badge variant="outline" className="gap-1">
        <CreditCard className="h-3 w-3" />
        {PAYMENT_METHODS[method] || method}
      </Badge>
    );
  };

  // Get unique projects from movements for filter
  const uniqueProjects = [...new Set(movements?.map(m => m.project).filter(Boolean))];

  return (
    <AppLayout title="Décaissements" subtitle="Suivi des flux financiers">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                  <ArrowDownLeft className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-success">
                    {statsLoading ? "..." : formatCurrency(stats?.totalEncaissements || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Encaissements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                  <ArrowUpRight className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-warning">
                    {statsLoading ? "..." : formatCurrency(stats?.totalDecaissements || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Décaissements</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-muted-foreground">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {statsLoading ? "..." : stats?.pending || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {statsLoading ? "..." : formatCurrency(stats?.soldePeriode || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Solde période</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flux Evolution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Évolution des flux
            </CardTitle>
            <CardDescription>Encaissements et décaissements (en millions FCFA)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fluxData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `${value / 1000000}`} />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="encaissements" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--success))' }}
                    name="Encaissements"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="decaissements" 
                    stroke="hsl(var(--warning))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--warning))' }}
                    name="Décaissements"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Liste des décaissements</CardTitle>
                <CardDescription>Historique des paiements et décaissements</CardDescription>
              </div>
              <div className="flex gap-2">
                <TableExportButtons
                  data={(filteredMovements?.filter(m => m.type === 'decaissement') || []).map(m => ({
                    ...m,
                    formattedDate: m.date ? format(new Date(m.date), "dd/MM/yyyy") : "-",
                    statusLabel: STATUS_OPTIONS.find(s => s.value === m.workflow_status)?.label || m.workflow_status || "Brouillon",
                    paymentMethod: PAYMENT_METHODS.transfer,
                  }))}
                  columns={[
                    { key: "reference", label: "Numéro" },
                    { key: "description", label: "Dépense" },
                    { key: "project", label: "Projet" },
                    { key: "amount", label: "Montant", format: (v) => formatCurrency(v) },
                    { key: "paymentMethod", label: "Mode paiement" },
                    { key: "formattedDate", label: "Date" },
                    { key: "statusLabel", label: "Statut" },
                  ] as ExportColumn[]}
                  filename="decaissements"
                  title="Liste des Décaissements"
                  subtitle={`${filteredMovements?.filter(m => m.type === 'decaissement').length || 0} décaissements`}
                />
                <PermissionButton module="decaissements" permission="create" onClick={handleNewMovement}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau
                </PermissionButton>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par numéro, dépense, bénéficiaire..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tous les projets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les projets</SelectItem>
                  {uniqueProjects.map(project => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal", !dateFilter && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={setDateFilter}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  Effacer
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Dépense</TableHead>
                    <TableHead>Projet</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Mode paiement</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementsLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredMovements?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Aucun décaissement trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovements?.filter(m => m.type === 'decaissement').map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="font-mono text-sm font-medium">{movement.reference}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{movement.description}</p>
                            <p className="text-xs text-muted-foreground">{movement.beneficiary}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{movement.project}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(movement.amount)}
                        </TableCell>
                        <TableCell>
                          {getPaymentMethodBadge('transfer')}
                        </TableCell>
                        <TableCell>
                          {movement.date ? format(new Date(movement.date), 'dd/MM/yyyy', { locale: fr }) : '-'}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(movement.workflow_status || 'brouillon')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {movement.workflow_status && (
                              <DisbursementWorkflowActions
                                disbursementId={movement.id}
                                currentStatus={movement.workflow_status as DisbursementWorkflowStatus}
                                compact
                              />
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DecaissementsPage;
