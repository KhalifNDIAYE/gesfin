import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subMonths, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface DashboardStats {
  budgetTotal: number;
  budgetChange: number;
  projetsActifs: number;
  projetsChange: number;
  bailleurs: number;
  tauxDecaissement: number;
  tauxChange: number;
}

export interface BudgetChartData {
  month: string;
  budget: number;
  depenses: number;
}

export interface BailleurChartData {
  name: string;
  value: number;
  color: string;
}

export interface ProjectOverview {
  id: string;
  name: string;
  bailleur: string;
  consumed: number;
  budget: number;
  percentage: number;
  status: string;
}

export interface RecentTransaction {
  id: string;
  description: string;
  project: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  source: string;
}

export interface DashboardAlert {
  id: string;
  type: 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  href: string;
  action: string;
}

export const useDashboardStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Get total budget from validated budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('total_amount, status')
        .in('status', ['approved', 'validated', 'active']);
      
      const budgetTotal = budgets?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

      // Get active projects count
      const { count: projetsActifs } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get bailleurs count
      const { count: bailleurs } = await supabase
        .from('bailleurs')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Calculate disbursement rate from conventions
      const { data: conventions } = await supabase
        .from('conventions')
        .select('total_amount, disbursed_amount')
        .eq('status', 'active');
      
      const totalConvention = conventions?.reduce((sum, c) => sum + (c.total_amount || 0), 0) || 0;
      const totalDisbursed = conventions?.reduce((sum, c) => sum + (c.disbursed_amount || 0), 0) || 0;
      const tauxDecaissement = totalConvention > 0 ? (totalDisbursed / totalConvention) * 100 : 0;

      // Calculate budget change compared to last month
      const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
      const { data: lastMonthBudgets } = await supabase
        .from('budgets')
        .select('total_amount')
        .in('status', ['approved', 'validated', 'active'])
        .lt('created_at', lastMonthStart.toISOString());
      
      const lastMonthTotal = lastMonthBudgets?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const budgetChange = lastMonthTotal > 0 ? ((budgetTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

      return {
        budgetTotal,
        budgetChange: Math.round(budgetChange * 10) / 10,
        projetsActifs: projetsActifs || 0,
        projetsChange: 0,
        bailleurs: bailleurs || 0,
        tauxDecaissement: Math.round(tauxDecaissement * 10) / 10,
        tauxChange: 0,
      } as DashboardStats;
    },
    enabled: !!user,
    staleTime: 30000,
  });
};

export const useBudgetChartData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budget-chart-data'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_budget_tracking_data' as any, { p_months: 6 });

      if (error) throw error;

      return ((data as any[]) || []).map((item: any) => ({
        month: format(new Date(item.month_start), 'MMM', { locale: fr })
          .replace(/^./, (c: string) => c.toUpperCase()),
        budget: item.budget || 0,
        depenses: item.depenses || 0,
      })) as BudgetChartData[];
    },
    enabled: !!user,
    staleTime: 60000,
  });
};

export const useBailleurChartData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bailleur-chart-data'],
    queryFn: async () => {
      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#A4DE6C', '#D0ED57'];
      
      // Get conventions with bailleur amounts
      const { data: conventions } = await supabase
        .from('conventions')
        .select(`
          total_amount,
          bailleur:bailleurs(name)
        `)
        .eq('status', 'active');

      const bailleurAmounts: Record<string, number> = {};
      
      conventions?.forEach(conv => {
        const bailleurName = (conv.bailleur as any)?.name || 'Non défini';
        bailleurAmounts[bailleurName] = (bailleurAmounts[bailleurName] || 0) + (conv.total_amount || 0);
      });

      // Also check project_bailleurs for direct allocations (using committed_amount)
      const { data: projectBailleurs } = await supabase
        .from('project_bailleurs')
        .select(`
          committed_amount,
          bailleur:bailleurs(name)
        `);

      projectBailleurs?.forEach(pb => {
        const bailleurName = (pb.bailleur as any)?.name || 'Non défini';
        bailleurAmounts[bailleurName] = (bailleurAmounts[bailleurName] || 0) + (pb.committed_amount || 0);
      });

      const result = Object.entries(bailleurAmounts)
        .filter(([_, value]) => value > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value], index) => ({
          name,
          value,
          color: colors[index % colors.length],
        }));

      return result;
    },
    enabled: !!user,
    staleTime: 60000,
  });
};

export const useProjectsOverview = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['projects-overview'],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          total_budget,
          consumed_budget,
          status,
          project_bailleurs(
            bailleur:bailleurs(name)
          )
        `)
        .in('status', ['active', 'in_progress', 'en_cours'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (!projects || projects.length === 0) {
        return [];
      }

      return projects.map(p => ({
        id: p.id,
        name: p.name,
        bailleur: (p.project_bailleurs as any)?.[0]?.bailleur?.name || 'Non défini',
        consumed: p.consumed_budget || 0,
        budget: p.total_budget || 0,
        percentage: p.total_budget ? Math.round(((p.consumed_budget || 0) / p.total_budget) * 100) : 0,
        status: p.status,
      }));
    },
    enabled: !!user,
    staleTime: 30000,
  });
};

export const useRecentTransactions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const transactions: RecentTransaction[] = [];

      // 1. Get recent cash operations
      const { data: cashOperations } = await supabase
        .from('cash_operations')
        .select(`
          id,
          code,
          description,
          amount,
          operation_type,
          operation_date,
          status,
          project:projects(name)
        `)
        .in('status', ['validated', 'valide', 'brouillon'])
        .order('operation_date', { ascending: false })
        .limit(10);

      cashOperations?.forEach(op => {
        transactions.push({
          id: `cash-${op.id}`,
          description: op.description || op.code || 'Opération de caisse',
          project: (op.project as any)?.name || 'Non affecté',
          amount: op.amount || 0,
          date: op.operation_date,
          type: op.operation_type === 'entree' ? 'income' : 'expense',
          source: 'Caisse',
        });
      });

      // 2. Get recent replenishments (reconstitutions) - using correct column names
      const { data: replenishments } = await supabase
        .from('replenishments')
        .select(`
          id,
          code,
          notes,
          amount,
          request_date,
          status,
          convention:conventions(name)
        `)
        .in('status', ['validated', 'pending', 'approved'])
        .order('request_date', { ascending: false })
        .limit(10);

      replenishments?.forEach(rep => {
        transactions.push({
          id: `rep-${rep.id}`,
          description: rep.notes || rep.code || 'Reconstitution',
          project: (rep.convention as any)?.name || 'Convention',
          amount: rep.amount || 0,
          date: rep.request_date,
          type: 'income',
          source: 'Reconstitution',
        });
      });

      // 3. Get recent direct payments
      const { data: directPayments } = await supabase
        .from('direct_payments')
        .select(`
          id,
          code,
          description,
          amount,
          payment_date,
          status,
          convention:conventions(name)
        `)
        .in('status', ['validated', 'pending', 'approved'])
        .order('payment_date', { ascending: false })
        .limit(10);

      directPayments?.forEach(dp => {
        transactions.push({
          id: `dp-${dp.id}`,
          description: dp.description || dp.code || 'Paiement direct',
          project: (dp.convention as any)?.name || 'Convention',
          amount: dp.amount || 0,
          date: dp.payment_date,
          type: 'expense',
          source: 'Paiement direct',
        });
      });

      // 4. Get recent budget movements
      const { data: budgetMovements } = await supabase
        .from('budget_movements')
        .select(`
          id,
          description,
          amount,
          movement_type,
          movement_date,
          budget_line:budget_lines(
            budget:budgets(name)
          )
        `)
        .eq('movement_type', 'realization')
        .order('movement_date', { ascending: false })
        .limit(10);

      budgetMovements?.forEach(mov => {
        transactions.push({
          id: `mov-${mov.id}`,
          description: mov.description || 'Mouvement budgétaire',
          project: (mov.budget_line as any)?.budget?.name || 'Budget',
          amount: mov.amount || 0,
          date: mov.movement_date,
          type: 'expense',
          source: 'Budget',
        });
      });

      // 5. Get recent journal entries with their line totals
      const { data: journalEntries } = await supabase
        .from('journal_entries')
        .select(`
          id,
          entry_number,
          description,
          entry_date,
          status,
          project:projects(name),
          journal_entry_lines(debit_amount)
        `)
        .eq('status', 'valide')
        .order('entry_date', { ascending: false })
        .limit(10);

      journalEntries?.forEach(entry => {
        const totalDebit = (entry.journal_entry_lines as any[])?.reduce(
          (sum, line) => sum + (line.debit_amount || 0), 0
        ) || 0;
        
        transactions.push({
          id: `je-${entry.id}`,
          description: entry.description || entry.entry_number || 'Écriture comptable',
          project: (entry.project as any)?.name || 'Comptabilité',
          amount: totalDebit,
          date: entry.entry_date,
          type: 'expense',
          source: 'Comptabilité',
        });
      });

      // Sort all transactions by date descending and take top 10
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return transactions.slice(0, 10);
    },
    enabled: !!user,
    staleTime: 30000,
  });
};

export const useDashboardAlerts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: async () => {
      const alerts: DashboardAlert[] = [];
      const today = new Date().toISOString().split('T')[0];
      const in15Days = new Date();
      in15Days.setDate(in15Days.getDate() + 15);

      // 1. Expiring conventions
      const { data: expiringConventions } = await supabase
        .from('conventions')
        .select('id, name, closing_date')
        .lte('closing_date', in15Days.toISOString().split('T')[0])
        .gte('closing_date', today)
        .eq('status', 'active')
        .limit(3);

      expiringConventions?.forEach(conv => {
        const daysLeft = Math.ceil((new Date(conv.closing_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `conv-${conv.id}`,
          type: daysLeft <= 7 ? 'danger' : 'warning',
          title: 'Convention expirante',
          description: `${conv.name} - expire dans ${daysLeft} jours`,
          href: `/conventions/${conv.id}`,
          action: 'Voir',
        });
      });

      // 2. Budget overruns (realized > forecast)
      const { data: overruns } = await supabase
        .from('budget_lines')
        .select('id, description, forecast_amount, realized_amount, budget:budgets(id, name)')
        .not('realized_amount', 'is', null)
        .limit(10);

      overruns?.filter(line => 
        (line.realized_amount || 0) > (line.forecast_amount || 0) * 0.9
      ).slice(0, 3).forEach(line => {
        const percentage = line.forecast_amount ? 
          Math.round(((line.realized_amount || 0) / line.forecast_amount) * 100) : 100;
        const isOver = percentage >= 100;
        
        alerts.push({
          id: `budget-${line.id}`,
          type: isOver ? 'danger' : 'warning',
          title: isOver ? 'Dépassement budgétaire' : 'Alerte budget',
          description: `${(line.budget as any)?.name || 'Budget'} - ${line.description || 'Ligne'} (${percentage}%)`,
          href: `/budget/${(line.budget as any)?.id || ''}`,
          action: 'Analyser',
        });
      });

      // 3. Unread budget alerts
      const { data: budgetAlerts } = await supabase
        .from('budget_alerts')
        .select('id, message, alert_type, budget:budgets(name)')
        .eq('is_read', false)
        .eq('is_resolved', false)
        .limit(3);

      budgetAlerts?.forEach(alert => {
        alerts.push({
          id: `alert-${alert.id}`,
          type: alert.alert_type === 'critical' ? 'danger' : 'warning',
          title: 'Alerte budgétaire',
          description: alert.message.substring(0, 80) + (alert.message.length > 80 ? '...' : ''),
          href: '/budget/alertes',
          action: 'Voir',
        });
      });

      // 4. Pending validations (budgets, transfers, expenses)
      const { count: pendingBudgets } = await supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'submitted');

      if (pendingBudgets && pendingBudgets > 0) {
        alerts.push({
          id: 'pending-budgets',
          type: 'info',
          title: 'Budgets en attente',
          description: `${pendingBudgets} budget(s) en attente de validation`,
          href: '/budget',
          action: 'Valider',
        });
      }

      const { count: pendingTransfers } = await supabase
        .from('budget_transfers')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending_director', 'pending_admin']);

      if (pendingTransfers && pendingTransfers > 0) {
        alerts.push({
          id: 'pending-transfers',
          type: 'info',
          title: 'Transferts en attente',
          description: `${pendingTransfers} transfert(s) budgétaire(s) à valider`,
          href: '/budget/transferts',
          action: 'Traiter',
        });
      }

      // 5. Pending cash operations
      const { count: pendingCashOps } = await supabase
        .from('cash_operations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'brouillon');

      if (pendingCashOps && pendingCashOps > 0) {
        alerts.push({
          id: 'pending-cash',
          type: 'info',
          title: 'Opérations de caisse',
          description: `${pendingCashOps} opération(s) en brouillon`,
          href: '/comptabilite/caisse',
          action: 'Valider',
        });
      }

      return alerts.slice(0, 5);
    },
    enabled: !!user,
    staleTime: 30000,
  });
};

export const useDashboardRealtime = (onUpdate: () => void) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conventions' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_lines' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_movements' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_alerts' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cash_operations' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_entries' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'replenishments' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_payments' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contract_payments' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contract_engagements' }, onUpdate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, onUpdate]);
};
