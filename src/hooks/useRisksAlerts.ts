import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

export interface RiskProject {
  id: string;
  name: string;
  code: string;
  status: string;
  bailleur_name: string;
  budget: number;
  consumed: number;
  delay_days: number;
  risk_level: 'low' | 'medium' | 'critical';
  end_date: string | null;
}

export interface RisksKPIs {
  projetsEnRetard: number;
  conventionsExpirees: number;
  depassementsBudget: number;
  actionsBloquees: number;
  validationsEnAttente: number;
}

export interface MonthlyData {
  month: string;
  value: number;
}

export interface BailleurOverrun {
  name: string;
  value: number;
  color: string;
}

export const useRisksKPIs = () => {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();

  return useQuery({
    queryKey: ['risks-kpis', user?.id, isAdmin],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      // Projects in delay
      const { data: delayedProjects } = await supabase
        .from('projects')
        .select('id')
        .lt('end_date', today)
        .eq('status', 'active');

      // Expired conventions
      const { data: expiredConventions } = await supabase
        .from('conventions')
        .select('id')
        .lt('closing_date', today)
        .eq('status', 'active');

      // Budget overruns
      const { data: budgetLines } = await supabase
        .from('budget_lines')
        .select('id, forecast_amount, realized_amount');
      
      const overruns = budgetLines?.filter(
        line => (line.realized_amount || 0) > (line.forecast_amount || 0)
      ).length || 0;

      // Blocked actions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: blockedActions } = await supabase
        .from('security_blocked_actions')
        .select('*', { count: 'exact', head: true })
        .gte('timestamp', thirtyDaysAgo.toISOString());

      // Pending validations (budget alerts not resolved)
      const { count: pendingValidations } = await supabase
        .from('budget_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('is_resolved', false);

      return {
        projetsEnRetard: delayedProjects?.length || 0,
        conventionsExpirees: expiredConventions?.length || 0,
        depassementsBudget: overruns,
        actionsBloquees: blockedActions || 0,
        validationsEnAttente: pendingValidations || 0,
      } as RisksKPIs;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
};

export const useDelayedProjectsByMonth = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['delayed-projects-by-month'],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select('end_date, status')
        .eq('status', 'active')
        .not('end_date', 'is', null);

      const monthlyData: Record<string, number> = {};
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      
      // Initialize all months
      months.forEach(m => { monthlyData[m] = 0; });

      const today = new Date();
      
      projects?.forEach(project => {
        if (project.end_date) {
          const endDate = new Date(project.end_date);
          if (endDate < today) {
            const monthIndex = endDate.getMonth();
            monthlyData[months[monthIndex]]++;
          }
        }
      });

      return months.map(month => ({
        month,
        value: monthlyData[month],
      }));
    },
    enabled: !!user,
  });
};

export const useOverrunsByBailleur = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['overruns-by-bailleur'],
    queryFn: async () => {
      const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
      
      // Get conventions with bailleurs
      const { data: conventions } = await supabase
        .from('conventions')
        .select(`
          id,
          total_amount,
          disbursed_amount,
          bailleur:bailleurs(name)
        `);

      const bailleurOverruns: Record<string, number> = {};
      
      conventions?.forEach(conv => {
        const disbursed = conv.disbursed_amount || 0;
        const total = conv.total_amount || 0;
        if (disbursed > total) {
          const bailleurName = (conv.bailleur as any)?.name || 'Non défini';
          bailleurOverruns[bailleurName] = (bailleurOverruns[bailleurName] || 0) + (disbursed - total);
        }
      });

      return Object.entries(bailleurOverruns).map(([name, value], index) => ({
        name,
        value,
        color: colors[index % colors.length],
      }));
    },
    enabled: !!user,
  });
};

export const useBudgetAlertsTrend = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budget-alerts-trend'],
    queryFn: async () => {
      const { data: alerts } = await supabase
        .from('budget_alerts')
        .select('created_at')
        .order('created_at', { ascending: true });

      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
      const monthlyData: Record<string, number> = {};
      months.forEach(m => { monthlyData[m] = 0; });

      alerts?.forEach(alert => {
        const date = new Date(alert.created_at);
        const monthIndex = date.getMonth();
        monthlyData[months[monthIndex]]++;
      });

      return months.map(month => ({
        month,
        value: monthlyData[month],
      }));
    },
    enabled: !!user,
  });
};

export const useTopRiskProjects = (limit = 10) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['top-risk-projects', limit],
    queryFn: async () => {
      const today = new Date();
      
      const { data: projects } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          code,
          status,
          total_budget,
          consumed_budget,
          end_date,
          project_bailleurs(
            bailleur:bailleurs(name)
          )
        `)
        .eq('status', 'active');

      const riskProjects: RiskProject[] = (projects || []).map(project => {
        const consumed = project.consumed_budget || 0;
        const budget = project.total_budget || 1;
        const endDate = project.end_date ? new Date(project.end_date) : null;
        const delayDays = endDate && endDate < today 
          ? Math.floor((today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        const budgetRatio = consumed / budget;
        let riskLevel: 'low' | 'medium' | 'critical' = 'low';
        
        if (budgetRatio > 1 || delayDays > 30) {
          riskLevel = 'critical';
        } else if (budgetRatio > 0.9 || delayDays > 0) {
          riskLevel = 'medium';
        }

        const bailleurName = (project.project_bailleurs as any)?.[0]?.bailleur?.name || 'Non défini';

        return {
          id: project.id,
          name: project.name,
          code: project.code,
          status: project.status,
          bailleur_name: bailleurName,
          budget,
          consumed,
          delay_days: delayDays,
          risk_level: riskLevel,
          end_date: project.end_date,
        };
      });

      // Sort by risk level and return top N
      const sorted = riskProjects.sort((a, b) => {
        const riskOrder = { critical: 0, medium: 1, low: 2 };
        return riskOrder[a.risk_level] - riskOrder[b.risk_level];
      });

      return sorted.slice(0, limit);
    },
    enabled: !!user,
  });
};

// Real-time subscription for risks
export const useRisksRealtime = (onUpdate: () => void) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('risks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conventions' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_alerts' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_lines' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'security_blocked_actions' }, onUpdate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, onUpdate]);
};
