import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Ban, 
  TrendingUp, 
  XCircle, 
  Shield, 
  Snowflake,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { 
  useBudgetsAtRisk, 
  useBlockedBudgets, 
  useFullyConsumedBudgetLines,
  useExceptionalOverridesForDashboard,
  useRejectedExpenses,
  useBudgetRisksSummary
} from '@/hooks/useBudgetRisks';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';

export default function BudgetRisksDashboardPage() {
  const { data: budgetsAtRisk, isLoading: loadingAtRisk } = useBudgetsAtRisk(80);
  const { data: blockedBudgets, isLoading: loadingBlocked } = useBlockedBudgets();
  const { data: fullyConsumed, isLoading: loadingFullyConsumed } = useFullyConsumedBudgetLines();
  const { data: overrides, isLoading: loadingOverrides } = useExceptionalOverridesForDashboard();
  const { data: rejectedExpenses, isLoading: loadingRejected } = useRejectedExpenses();
  const summary = useBudgetRisksSummary();

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'decimal', 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(amount) + ' XOF';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-700 border-green-500/30">Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'director_approved':
        return <Badge className="bg-blue-500/20 text-blue-700 border-blue-500/30">Dir. approuvé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const budgetsAbove80NotBlocked = budgetsAtRisk?.filter(b => b.consumption_percentage < 100) || [];

  return (
    <AppLayout title="Risques Budgétaires" subtitle="Vue consolidée des risques et alertes budgétaires">
      <div className="space-y-6">

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Budgets &gt; 80%</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{summary.budgetsAbove80}</div>
            <p className="text-xs text-orange-600">Lignes à surveiller</p>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Budgets Bloqués</CardTitle>
            <Ban className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{summary.budgetsBlocked}</div>
            <p className="text-xs text-red-600">100% consommés ou gelés</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/30 bg-purple-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Dépassements Except.</CardTitle>
            <AlertTriangle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{summary.exceptionalOverrides}</div>
            <p className="text-xs text-purple-600">{summary.pendingOverrides} en attente</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Dépenses Refusées</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{summary.rejectedExpenses}</div>
            <p className="text-xs text-destructive">Insuffisance budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="above80" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="above80" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            &gt;80%
          </TabsTrigger>
          <TabsTrigger value="blocked" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Bloqués
          </TabsTrigger>
          <TabsTrigger value="overrides" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Dépassements
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Refusées
          </TabsTrigger>
        </TabsList>

        {/* Budgets > 80% */}
        <TabsContent value="above80">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Lignes budgétaires à plus de 80%
              </CardTitle>
              <CardDescription>
                Lignes proches de leur limite budgétaire (hors bloquées)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAtRisk ? (
                <p className="text-center text-muted-foreground py-8">Chargement...</p>
              ) : budgetsAbove80NotBlocked.length === 0 ? (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Aucune ligne budgétaire n'a dépassé 80% de consommation.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Budget</TableHead>
                      <TableHead>Ligne</TableHead>
                      <TableHead className="text-right">Prévision</TableHead>
                      <TableHead className="text-right">Consommé</TableHead>
                      <TableHead className="text-right">%</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetsAbove80NotBlocked.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell className="font-medium">{line.budget_code}</TableCell>
                        <TableCell>{line.description || '-'}</TableCell>
                        <TableCell className="text-right">{formatAmount(line.forecast_amount)}</TableCell>
                        <TableCell className="text-right">
                          {formatAmount(line.committed_amount + line.realized_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={Math.min(line.consumption_percentage, 100)} 
                              className="w-16 h-2"
                            />
                            <span className={`text-sm font-medium ${
                              line.consumption_percentage >= 90 ? 'text-red-600' : 'text-orange-600'
                            }`}>
                              {line.consumption_percentage.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-700 border-orange-500/30">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            À surveiller
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blocked Budgets */}
        <TabsContent value="blocked">
          <div className="space-y-4">
            {/* Frozen budgets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Snowflake className="h-5 w-5 text-blue-600" />
                  Budgets Gelés
                </CardTitle>
                <CardDescription>
                  Budgets manuellement gelés par un administrateur
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingBlocked ? (
                  <p className="text-center text-muted-foreground py-8">Chargement...</p>
                ) : !blockedBudgets || blockedBudgets.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription>Aucun budget gelé.</AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead className="text-right">Montant Total</TableHead>
                        <TableHead>Raison</TableHead>
                        <TableHead>Gelé le</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blockedBudgets.map((budget) => (
                        <TableRow key={budget.id}>
                          <TableCell className="font-medium">{budget.code}</TableCell>
                          <TableCell>{budget.name}</TableCell>
                          <TableCell className="text-right">{formatAmount(budget.total_amount || 0)}</TableCell>
                          <TableCell>{budget.frozen_reason || '-'}</TableCell>
                          <TableCell>
                            {budget.frozen_at 
                              ? format(new Date(budget.frozen_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                              : '-'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* 100% consumed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-red-600" />
                  Lignes 100% Consommées
                </CardTitle>
                <CardDescription>
                  Lignes ayant atteint leur limite budgétaire (blocage automatique)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingFullyConsumed ? (
                  <p className="text-center text-muted-foreground py-8">Chargement...</p>
                ) : !fullyConsumed || fullyConsumed.length === 0 ? (
                  <Alert className="border-green-500/50 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Aucune ligne budgétaire n'est entièrement consommée.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Budget</TableHead>
                        <TableHead>Ligne</TableHead>
                        <TableHead className="text-right">Prévision</TableHead>
                        <TableHead className="text-right">Consommé</TableHead>
                        <TableHead className="text-right">Dépassement</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fullyConsumed.map((line) => {
                        const consumed = line.committed_amount + line.realized_amount;
                        const overrun = consumed - line.forecast_amount;
                        return (
                          <TableRow key={line.id}>
                            <TableCell className="font-medium">{line.budget_code}</TableCell>
                            <TableCell>{line.description || '-'}</TableCell>
                            <TableCell className="text-right">{formatAmount(line.forecast_amount)}</TableCell>
                            <TableCell className="text-right text-red-600 font-medium">
                              {formatAmount(consumed)}
                            </TableCell>
                            <TableCell className="text-right">
                              {overrun > 0 ? (
                                <span className="text-red-600 font-medium">+{formatAmount(overrun)}</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Exceptional Overrides */}
        <TabsContent value="overrides">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-purple-600" />
                Dépassements Exceptionnels
              </CardTitle>
              <CardDescription>
                Demandes de dépassement nécessitant validation du Directeur et de l'Administrateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingOverrides ? (
                <p className="text-center text-muted-foreground py-8">Chargement...</p>
              ) : !overrides || overrides.length === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>Aucune demande de dépassement exceptionnel.</AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>Ligne Budgétaire</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Raison</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Directeur</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overrides.map((override) => (
                      <TableRow key={override.id}>
                        <TableCell className="font-medium">
                          {override.expense_reference || override.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>{override.budget_line_description || '-'}</TableCell>
                        <TableCell className="text-right font-medium text-purple-600">
                          {formatAmount(override.override_amount)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={override.reason}>
                          {override.reason}
                        </TableCell>
                        <TableCell>{getStatusBadge(override.override_status)}</TableCell>
                        <TableCell>
                          {override.director_decision === 'approved' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : override.director_decision === 'rejected' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {override.admin_decision === 'approved' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : override.admin_decision === 'rejected' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {override.requested_at 
                            ? format(new Date(override.requested_at), 'dd/MM/yyyy', { locale: fr })
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rejected Expenses */}
        <TabsContent value="rejected">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                Dépenses Refusées pour Insuffisance Budgétaire
              </CardTitle>
              <CardDescription>
                Historique des tentatives de création/soumission bloquées par le contrôle budgétaire
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRejected ? (
                <p className="text-center text-muted-foreground py-8">Chargement...</p>
              ) : !rejectedExpenses || rejectedExpenses.length === 0 ? (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    Aucune dépense n'a été refusée pour insuffisance budgétaire.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Ligne Budgétaire</TableHead>
                      <TableHead className="text-right">Montant Demandé</TableHead>
                      <TableHead className="text-right">Budget Dispo.</TableHead>
                      <TableHead>Raison</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-sm">
                          {expense.created_at 
                            ? format(new Date(expense.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{expense.user_email || 'Inconnu'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {expense.action === 'blocage_budget_creation' ? 'Création' 
                              : expense.action === 'blocage_marche_engagement' ? 'Engagement marché'
                              : 'Soumission'}
                          </Badge>
                        </TableCell>
                        <TableCell>{expense.budget_line_description || '-'}</TableCell>
                        <TableCell className="text-right text-red-600 font-medium">
                          {formatAmount(expense.requested_amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatAmount(expense.available_budget)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground" title={expense.block_reason}>
                          {expense.block_reason}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}
