import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface BudgetLineRisk {
  id: string;
  budget_id: string;
  budget_code: string;
  budget_name: string;
  description: string | null;
  forecast_amount: number;
  committed_amount: number;
  realized_amount: number;
  consumption_percentage: number;
  is_blocked: boolean;
  is_frozen: boolean;
}

export interface ExceptionalOverride {
  id: string;
  journal_entry_id: string | null;
  expense_reference: string | null;
  budget_line_id: string | null;
  budget_line_description: string | null;
  override_amount: number;
  original_available: number;
  reason: string;
  override_status: string;
  requested_at: string;
  requested_by_name: string | null;
  director_decision: string | null;
  admin_decision: string | null;
}

export interface RejectedExpense {
  id: string;
  action: string;
  resource_type: string;
  created_at: string;
  user_email: string | null;
  budget_line_description: string | null;
  requested_amount: number;
  available_budget: number;
  block_reason: string;
}

// Fetch budget lines at more than 80% consumption
export function useBudgetsAtRisk(thresholdPercentage = 80) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['budget_lines_at_risk', thresholdPercentage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_lines')
        .select(`
          id,
          budget_id,
          description,
          forecast_amount,
          committed_amount,
          realized_amount,
          budget:budgets (
            id,
            code,
            name,
            is_frozen
          )
        `)
        .gt('forecast_amount', 0);

      if (error) throw error;

      const atRisk: BudgetLineRisk[] = [];

      data?.forEach((line) => {
        const forecast = line.forecast_amount || 0;
        const committed = line.committed_amount || 0;
        const realized = line.realized_amount || 0;
        const consumed = committed + realized;
        const percentage = forecast > 0 ? (consumed / forecast) * 100 : 0;

        if (percentage >= thresholdPercentage) {
          atRisk.push({
            id: line.id,
            budget_id: line.budget_id,
            budget_code: (line.budget as any)?.code || '',
            budget_name: (line.budget as any)?.name || '',
            description: line.description,
            forecast_amount: forecast,
            committed_amount: committed,
            realized_amount: realized,
            consumption_percentage: percentage,
            is_blocked: percentage >= 100,
            is_frozen: (line.budget as any)?.is_frozen || false,
          });
        }
      });

      // Sort by consumption percentage descending
      return atRisk.sort((a, b) => b.consumption_percentage - a.consumption_percentage);
    },
    enabled: !!user,
  });
}

// Fetch blocked (frozen) budgets
export function useBlockedBudgets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['blocked_budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          id,
          code,
          name,
          is_frozen,
          frozen_at,
          frozen_reason,
          total_amount,
          status
        `)
        .eq('is_frozen', true);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

// Fetch 100% consumed budget lines (blocked)
export function useFullyConsumedBudgetLines() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['fully_consumed_budget_lines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_lines')
        .select(`
          id,
          budget_id,
          description,
          forecast_amount,
          committed_amount,
          realized_amount,
          budget:budgets (
            id,
            code,
            name
          )
        `)
        .gt('forecast_amount', 0);

      if (error) throw error;

      const blocked: BudgetLineRisk[] = [];

      data?.forEach((line) => {
        const forecast = line.forecast_amount || 0;
        const committed = line.committed_amount || 0;
        const realized = line.realized_amount || 0;
        const consumed = committed + realized;
        const percentage = forecast > 0 ? (consumed / forecast) * 100 : 0;

        if (percentage >= 100) {
          blocked.push({
            id: line.id,
            budget_id: line.budget_id,
            budget_code: (line.budget as any)?.code || '',
            budget_name: (line.budget as any)?.name || '',
            description: line.description,
            forecast_amount: forecast,
            committed_amount: committed,
            realized_amount: realized,
            consumption_percentage: percentage,
            is_blocked: true,
            is_frozen: false,
          });
        }
      });

      return blocked.sort((a, b) => b.consumption_percentage - a.consumption_percentage);
    },
    enabled: !!user,
  });
}

// Fetch exceptional overrides
export function useExceptionalOverridesForDashboard() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['exceptional_overrides_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exceptional_overrides_log')
        .select(`
          id,
          journal_entry_id,
          budget_line_id,
          override_amount,
          budget_available,
          override_reason,
          final_status,
          requested_at,
          requested_by,
          director_decision,
          admin_decision
        `)
        .order('requested_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user names for requesters
      const userIds = [...new Set(data?.map(d => d.requested_by).filter(Boolean))];
      let userMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds as string[]);
        
        profiles?.forEach(p => {
          userMap[p.id] = p.full_name || 'Utilisateur inconnu';
        });
      }

      // Get budget line descriptions
      const budgetLineIds = [...new Set(data?.map(d => d.budget_line_id).filter(Boolean))];
      let budgetLineMap: Record<string, string> = {};

      if (budgetLineIds.length > 0) {
        const { data: lines } = await supabase
          .from('budget_lines')
          .select('id, description')
          .in('id', budgetLineIds as string[]);
        
        lines?.forEach(l => {
          budgetLineMap[l.id] = l.description || 'Ligne non définie';
        });
      }

      return (data || []).map(d => ({
        id: d.id,
        journal_entry_id: d.journal_entry_id,
        expense_reference: d.journal_entry_id?.slice(0, 8) || null,
        budget_line_id: d.budget_line_id,
        budget_line_description: d.budget_line_id ? budgetLineMap[d.budget_line_id] || null : null,
        override_amount: d.override_amount || 0,
        original_available: d.budget_available || 0,
        reason: d.override_reason || '',
        override_status: d.final_status || 'pending',
        requested_at: d.requested_at,
        requested_by_name: d.requested_by ? userMap[d.requested_by] || 'Utilisateur' : null,
        director_decision: d.director_decision === 'approved' ? 'approved' : d.director_decision === 'rejected' ? 'rejected' : null,
        admin_decision: d.admin_decision === 'approved' ? 'approved' : d.admin_decision === 'rejected' ? 'rejected' : null,
      })) as ExceptionalOverride[];
    },
    enabled: !!user,
  });
}

// Fetch rejected expenses from audit logs
export function useRejectedExpenses() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['rejected_expenses_audit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .in('action', ['blocage_budget_creation', 'blocage_budget_soumission', 'blocage_marche_engagement'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return (data || []).map(log => {
        const oldValues = log.old_values as any || {};
        const newValues = log.new_values as any || {};

        return {
          id: log.id,
          action: log.action,
          resource_type: log.resource_type || 'expense',
          created_at: log.created_at,
          user_email: log.user_email,
          budget_line_description: oldValues.budget_line_description || null,
          requested_amount: newValues.requested_amount || 0,
          available_budget: oldValues.remaining_budget || oldValues.available_budget || 0,
          block_reason: newValues.blocked_reason || 'Raison non spécifiée',
        };
      }) as RejectedExpense[];
    },
    enabled: !!user,
  });
}

// Summary statistics for the dashboard
export function useBudgetRisksSummary() {
  const { data: atRisk } = useBudgetsAtRisk(80);
  const { data: blocked } = useBlockedBudgets();
  const { data: fullyConsumed } = useFullyConsumedBudgetLines();
  const { data: overrides } = useExceptionalOverridesForDashboard();
  const { data: rejected } = useRejectedExpenses();

  return {
    budgetsAbove80: atRisk?.filter(b => b.consumption_percentage < 100).length || 0,
    budgetsBlocked: (blocked?.length || 0) + (fullyConsumed?.length || 0),
    exceptionalOverrides: overrides?.length || 0,
    pendingOverrides: overrides?.filter(o => o.override_status === 'pending' || o.override_status === 'director_approved').length || 0,
    rejectedExpenses: rejected?.length || 0,
  };
}
