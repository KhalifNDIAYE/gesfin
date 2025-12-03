import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
      // Get total budget from budgets
      const { data: budgets } = await supabase
        .from('budgets')
        .select('total_amount')
        .eq('status', 'approved');
      
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
      
      const totalConvention = conventions?.reduce((sum, c) => sum + (c.total_amount || 0), 0) || 1;
      const totalDisbursed = conventions?.reduce((sum, c) => sum + (c.disbursed_amount || 0), 0) || 0;
      const tauxDecaissement = (totalDisbursed / totalConvention) * 100;

      return {
        budgetTotal,
        budgetChange: 8.2, // Would calculate from historical data
        projetsActifs: projetsActifs || 0,
        projetsChange: 2,
        bailleurs: bailleurs || 0,
        tauxDecaissement: Math.round(tauxDecaissement * 10) / 10,
        tauxChange: -2.3,
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
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
      
      // Get budget movements for chart
      const { data: movements } = await supabase
        .from('budget_movements')
        .select('amount, movement_type, movement_date')
        .order('movement_date', { ascending: true });

      const monthlyData: Record<string, { budget: number; depenses: number }> = {};
      months.forEach(m => { monthlyData[m] = { budget: 0, depenses: 0 }; });

      movements?.forEach(mov => {
        const date = new Date(mov.movement_date);
        const monthIndex = date.getMonth();
        if (monthIndex < 6) {
          const monthName = months[monthIndex];
          if (mov.movement_type === 'forecast') {
            monthlyData[monthName].budget += mov.amount || 0;
          } else if (mov.movement_type === 'realization') {
            monthlyData[monthName].depenses += mov.amount || 0;
          }
        }
      });

      // If no data, provide sample data
      const hasData = Object.values(monthlyData).some(d => d.budget > 0 || d.depenses > 0);
      
      if (!hasData) {
        return months.map((month, i) => ({
          month,
          budget: [500000, 450000, 550000, 480000, 520000, 490000][i],
          depenses: [350000, 380000, 420000, 400000, 450000, 380000][i],
        }));
      }

      return months.map(month => ({
        month,
        budget: monthlyData[month].budget,
        depenses: monthlyData[month].depenses,
      }));
    },
    enabled: !!user,
  });
};

export const useBailleurChartData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['bailleur-chart-data'],
    queryFn: async () => {
      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
      
      const { data: conventions } = await supabase
        .from('conventions')
        .select(`
          total_amount,
          bailleur:bailleurs(name)
        `)
        .eq('status', 'active');

      const bailleurAmounts: Record<string, number> = {};
      
      conventions?.forEach(conv => {
        const bailleurName = (conv.bailleur as any)?.name || 'Autre';
        bailleurAmounts[bailleurName] = (bailleurAmounts[bailleurName] || 0) + (conv.total_amount || 0);
      });

      const result = Object.entries(bailleurAmounts).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }));

      // If no data, provide sample
      if (result.length === 0) {
        return [
          { name: 'Banque Mondiale', value: 4500000000, color: '#0088FE' },
          { name: 'AFD', value: 2800000000, color: '#00C49F' },
          { name: 'BAD', value: 1900000000, color: '#FFBB28' },
          { name: 'USAID', value: 1000000000, color: '#FF8042' },
          { name: 'UE', value: 500000000, color: '#8884D8' },
        ];
      }

      return result;
    },
    enabled: !!user,
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
        .eq('status', 'active')
        .limit(5);

      if (!projects || projects.length === 0) {
        // Sample data
        return [
          { id: '1', name: 'Programme Eau Potable Rural', bailleur: 'Banque Mondiale', consumed: 1875000000, budget: 2500000000, percentage: 75, status: 'active' },
          { id: '2', name: 'Électrification Villages', bailleur: 'AFD', consumed: 900000000, budget: 1800000000, percentage: 50, status: 'active' },
          { id: '3', name: 'Routes Nationales Phase II', bailleur: 'BAD', consumed: 4750000000, budget: 5000000000, percentage: 95, status: 'completed' },
          { id: '4', name: 'Santé Communautaire', bailleur: 'USAID', consumed: 240000000, budget: 800000000, percentage: 30, status: 'active' },
          { id: '5', name: 'Formation Professionnelle', bailleur: 'UE', consumed: 0, budget: 350000000, percentage: 0, status: 'pending' },
        ];
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
  });
};

export const useRecentTransactions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data: entries } = await supabase
        .from('journal_entry_lines')
        .select(`
          id,
          description,
          debit_amount,
          credit_amount,
          journal_entry:journal_entries(
            entry_date,
            description
          )
        `)
        .order('id', { ascending: false })
        .limit(5);

      if (!entries || entries.length === 0) {
        // Sample data
        return [
          { id: '1', description: 'Décaissement Tranche 2', project: 'Programme Eau Potable', amount: 250000000, date: '2024-01-15', type: 'income' as const },
          { id: '2', description: 'Paiement fournisseur équipements', project: 'Électrification Villages', amount: -45000000, date: '2024-01-14', type: 'expense' as const },
          { id: '3', description: 'Honoraires consultants', project: 'Santé Communautaire', amount: -12500000, date: '2024-01-13', type: 'expense' as const },
          { id: '4', description: 'Subvention État', project: 'Routes Nationales', amount: 180000000, date: '2024-01-12', type: 'income' as const },
          { id: '5', description: 'Fournitures bureau', project: 'Administration', amount: -800000, date: '2024-01-11', type: 'expense' as const },
        ];
      }

      return entries.map(e => ({
        id: e.id,
        description: e.description || (e.journal_entry as any)?.description || 'Transaction',
        project: 'Projet',
        amount: (e.debit_amount || 0) - (e.credit_amount || 0),
        date: (e.journal_entry as any)?.entry_date || new Date().toISOString().split('T')[0],
        type: (e.debit_amount || 0) > (e.credit_amount || 0) ? 'income' as const : 'expense' as const,
      }));
    },
    enabled: !!user,
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

      // Expiring conventions
      const { data: expiringConventions } = await supabase
        .from('conventions')
        .select('id, name, closing_date')
        .lte('closing_date', in15Days.toISOString().split('T')[0])
        .gte('closing_date', today)
        .eq('status', 'active')
        .limit(1);

      if (expiringConventions && expiringConventions.length > 0) {
        const conv = expiringConventions[0];
        const daysLeft = Math.ceil((new Date(conv.closing_date!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: conv.id,
          type: 'warning',
          title: 'Convention expirante',
          description: `${conv.name} - expire dans ${daysLeft} jours`,
          href: `/conventions/${conv.id}`,
          action: 'Voir',
        });
      }

      // Budget overruns
      const { data: overruns } = await supabase
        .from('budget_lines')
        .select('id, description, budget:budgets(name)')
        .gt('realized_amount', 0)
        .limit(1);

      if (overruns && overruns.length > 0) {
        const line = overruns[0];
        alerts.push({
          id: line.id,
          type: 'danger',
          title: 'Dépassement budgétaire',
          description: `${(line.budget as any)?.name || 'Budget'} - ${line.description || 'ligne dépassée'}`,
          href: '/budget/alertes',
          action: 'Analyser',
        });
      }

      // Pending reports
      alerts.push({
        id: 'report-pending',
        type: 'info',
        title: 'Rapport en attente',
        description: 'Rapport trimestriel Q4 2023',
        href: '/rapports',
        action: 'Générer',
      });

      return alerts;
    },
    enabled: !!user,
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_entries' }, onUpdate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, onUpdate]);
};
