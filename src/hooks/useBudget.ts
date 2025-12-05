import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Budget {
  id: string;
  code: string;
  name: string;
  description?: string;
  fiscal_year_id: string;
  currency_id: string;
  exchange_rate: number;
  status: 'draft' | 'soumis' | 'valide' | 'rejete' | 'clos';
  total_amount: number;
  total_amount_local: number;
  start_date?: string;
  end_date?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  submitted_by?: string;
  submitted_at?: string;
  validated_by?: string;
  validated_at?: string;
  rejected_by?: string;
  rejected_at?: string;
  rejection_reason?: string;
  closed_by?: string;
  closed_at?: string;
  created_at?: string;
  updated_at?: string;
  fiscal_year?: { id: string; name: string };
  currency?: { id: string; code: string; name: string; symbol?: string };
}

export interface BudgetLine {
  id: string;
  budget_id: string;
  account_id?: string;
  tracking_axis_id?: string;
  cost_center_id?: string;
  description?: string;
  forecast_amount: number;
  forecast_amount_local: number;
  committed_amount: number;
  committed_amount_local: number;
  realized_amount: number;
  realized_amount_local: number;
  variance_amount: number;
  variance_percentage: number;
  alert_threshold: number;
  is_over_budget: boolean;
  line_number: number;
  created_at?: string;
  updated_at?: string;
  account?: { id: string; code: string; name: string };
  tracking_axis?: { id: string; code: string; name: string };
  cost_center?: { id: string; code: string; name: string };
}

export interface BudgetMovement {
  id: string;
  budget_line_id: string;
  movement_type: 'forecast' | 'commitment' | 'realization';
  movement_date: string;
  amount: number;
  amount_local: number;
  reference?: string;
  description?: string;
  journal_entry_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BudgetAlert {
  id: string;
  budget_id: string;
  budget_line_id?: string;
  alert_type: 'warning' | 'overspent' | 'critical';
  message: string;
  threshold_reached?: number;
  is_read: boolean;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at?: string;
  budget?: Budget;
  budget_line?: BudgetLine;
}

// Extended Budget with aggregated amounts
export interface BudgetWithAggregates extends Budget {
  committed_amount?: number;
  realized_amount?: number;
  remaining_amount?: number;
}

// Fetch all budgets with aggregated line amounts
export function useBudgets(fiscalYearId?: string) {
  return useQuery({
    queryKey: ['budgets', fiscalYearId],
    queryFn: async () => {
      let query = supabase
        .from('budgets')
        .select(`
          *,
          fiscal_year:fiscal_years(id, name),
          currency:currencies(id, code, name, symbol)
        `)
        .order('created_at', { ascending: false });

      if (fiscalYearId) {
        query = query.eq('fiscal_year_id', fiscalYearId);
      }

      const { data: budgets, error } = await query;
      if (error) throw error;

      // Fetch aggregated amounts for each budget
      const budgetIds = budgets?.map(b => b.id) || [];
      if (budgetIds.length === 0) return [] as BudgetWithAggregates[];

      const { data: lines, error: linesError } = await supabase
        .from('budget_lines')
        .select('budget_id, committed_amount, realized_amount, forecast_amount')
        .in('budget_id', budgetIds);

      if (linesError) throw linesError;

      // Aggregate amounts by budget
      const aggregates = new Map<string, { committed: number; realized: number }>();
      lines?.forEach(line => {
        const current = aggregates.get(line.budget_id) || { committed: 0, realized: 0 };
        aggregates.set(line.budget_id, {
          committed: current.committed + Number(line.committed_amount || 0),
          realized: current.realized + Number(line.realized_amount || 0),
        });
      });

      return budgets?.map(budget => ({
        ...budget,
        committed_amount: aggregates.get(budget.id)?.committed || 0,
        realized_amount: aggregates.get(budget.id)?.realized || 0,
        remaining_amount: Number(budget.total_amount) - (aggregates.get(budget.id)?.realized || 0),
      })) as BudgetWithAggregates[];
    },
  });
}

// Fetch single budget
export function useBudget(id?: string) {
  return useQuery({
    queryKey: ['budget', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          fiscal_year:fiscal_years(id, name),
          currency:currencies(id, code, name, symbol)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Budget;
    },
    enabled: !!id,
  });
}

// Fetch budget lines
export function useBudgetLines(budgetId?: string) {
  return useQuery({
    queryKey: ['budget_lines', budgetId],
    queryFn: async () => {
      if (!budgetId) return [];
      const { data, error } = await supabase
        .from('budget_lines')
        .select(`
          *,
          account:plan_accounts(id, code, name),
          tracking_axis:tracking_axes(id, code, name),
          cost_center:cost_centers(id, code, name)
        `)
        .eq('budget_id', budgetId)
        .order('line_number');
      if (error) throw error;
      return data as BudgetLine[];
    },
    enabled: !!budgetId,
  });
}

// Fetch budget movements
export function useBudgetMovements(budgetLineId?: string) {
  return useQuery({
    queryKey: ['budget_movements', budgetLineId],
    queryFn: async () => {
      if (!budgetLineId) return [];
      const { data, error } = await supabase
        .from('budget_movements')
        .select('*')
        .eq('budget_line_id', budgetLineId)
        .order('movement_date', { ascending: false });
      if (error) throw error;
      return data as BudgetMovement[];
    },
    enabled: !!budgetLineId,
  });
}

// Fetch budget alerts
export function useBudgetAlerts(budgetId?: string, onlyUnread?: boolean) {
  return useQuery({
    queryKey: ['budget_alerts', budgetId, onlyUnread],
    queryFn: async () => {
      let query = supabase
        .from('budget_alerts')
        .select(`
          *,
          budget:budgets(id, code, name),
          budget_line:budget_lines(id, description, account:plan_accounts(id, code, name))
        `)
        .order('created_at', { ascending: false });

      if (budgetId) {
        query = query.eq('budget_id', budgetId);
      }
      if (onlyUnread) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as BudgetAlert[];
    },
  });
}

// Create budget mutation
export function useCreateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at' | 'fiscal_year' | 'currency'>) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert(budget)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Update budget mutation
export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...budget }: Partial<Budget> & { id: string }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(budget)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      toast.success('Budget mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Delete budget mutation
export function useDeleteBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Create budget line mutation
export function useCreateBudgetLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (line: Omit<BudgetLine, 'id' | 'created_at' | 'updated_at' | 'variance_amount' | 'variance_percentage' | 'is_over_budget' | 'account' | 'tracking_axis' | 'cost_center'>) => {
      const { data, error } = await supabase
        .from('budget_lines')
        .insert(line)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_lines'] });
      toast.success('Ligne budgétaire ajoutée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Update budget line mutation
export function useUpdateBudgetLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...line }: Partial<BudgetLine> & { id: string }) => {
      const { data, error } = await supabase
        .from('budget_lines')
        .update(line)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_lines'] });
      toast.success('Ligne budgétaire mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Delete budget line mutation
export function useDeleteBudgetLine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget_lines').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_lines'] });
      toast.success('Ligne budgétaire supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Create budget movement mutation
export function useCreateBudgetMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (movement: Omit<BudgetMovement, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('budget_movements')
        .insert(movement)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_movements'] });
      queryClient.invalidateQueries({ queryKey: ['budget_lines'] });
      toast.success('Mouvement budgétaire enregistré');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Mark alert as read
export function useMarkAlertRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget_alerts')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_alerts'] });
    },
  });
}

// Resolve alert
export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('budget_alerts')
        .update({ 
          is_resolved: true,
          resolved_by: user?.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget_alerts'] });
      toast.success('Alerte résolue');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Get budget summary statistics
export function useBudgetSummary(fiscalYearId?: string) {
  return useQuery({
    queryKey: ['budget_summary', fiscalYearId],
    queryFn: async () => {
      let query = supabase
        .from('budgets')
        .select('id, total_amount, total_amount_local, status');

      if (fiscalYearId) {
        query = query.eq('fiscal_year_id', fiscalYearId);
      }

      const { data: budgets, error: budgetsError } = await query;
      if (budgetsError) throw budgetsError;

      const budgetIds = budgets?.map(b => b.id) || [];
      
      if (budgetIds.length === 0) {
        return {
          totalBudgets: 0,
          totalForecast: 0,
          totalCommitted: 0,
          totalRealized: 0,
          totalVariance: 0,
          alertsCount: 0,
          overBudgetLines: 0,
        };
      }

      const { data: lines, error: linesError } = await supabase
        .from('budget_lines')
        .select('forecast_amount, committed_amount, realized_amount, variance_amount, is_over_budget')
        .in('budget_id', budgetIds);
      if (linesError) throw linesError;

      const { data: alerts, error: alertsError } = await supabase
        .from('budget_alerts')
        .select('id')
        .in('budget_id', budgetIds)
        .eq('is_resolved', false);
      if (alertsError) throw alertsError;

      return {
        totalBudgets: budgets?.length || 0,
        totalForecast: lines?.reduce((sum, l) => sum + Number(l.forecast_amount), 0) || 0,
        totalCommitted: lines?.reduce((sum, l) => sum + Number(l.committed_amount), 0) || 0,
        totalRealized: lines?.reduce((sum, l) => sum + Number(l.realized_amount), 0) || 0,
        totalVariance: lines?.reduce((sum, l) => sum + Number(l.variance_amount), 0) || 0,
        alertsCount: alerts?.length || 0,
        overBudgetLines: lines?.filter(l => l.is_over_budget).length || 0,
      };
    },
  });
}
