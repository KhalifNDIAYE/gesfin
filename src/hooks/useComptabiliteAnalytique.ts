import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent?: CostCenter;
}

export interface AnalyticalAllocation {
  id: string;
  journal_entry_line_id: string | null;
  cost_center_id: string | null;
  activity_id: string | null;
  component_id: string | null;
  geographic_zone_id: string | null;
  amount: number;
  percentage: number | null;
  allocation_type: 'activity' | 'component' | 'geographic' | 'cost_center';
  allocation_method: 'a_priori' | 'a_posteriori' | 'reallocation';
  fiscal_year_id: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  cost_center?: CostCenter;
  activity?: { id: string; code: string; name: string };
  component?: { id: string; code: string; name: string };
  geographic_zone?: { id: string; code: string; name: string };
}

export interface DistributionRule {
  id: string;
  name: string;
  source_account_id: string | null;
  allocation_type: 'activity' | 'component' | 'geographic' | 'cost_center';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  source_account?: { id: string; code: string; name: string };
  lines?: DistributionRuleLine[];
}

export interface DistributionRuleLine {
  id: string;
  distribution_rule_id: string;
  target_id: string;
  percentage: number;
  created_at: string;
}

// Cost Centers hooks
export function useCostCenters() {
  return useQuery({
    queryKey: ['cost-centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .order('code');
      
      if (error) throw error;
      return data as CostCenter[];
    },
  });
}

export function useCostCenterMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Omit<CostCenter, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('cost_centers')
        .insert(data as never)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast.success('Centre de coûts créé avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CostCenter> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('cost_centers')
        .update(data as never)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast.success('Centre de coûts mis à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cost_centers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cost-centers'] });
      toast.success('Centre de coûts supprimé');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { createMutation, updateMutation, deleteMutation };
}

// Analytical Allocations hooks
export function useAnalyticalAllocations(filters?: {
  fiscal_year_id?: string;
  allocation_type?: string;
  allocation_method?: string;
}) {
  return useQuery({
    queryKey: ['analytical-allocations', filters],
    queryFn: async () => {
      let query = supabase
        .from('analytical_allocations')
        .select(`
          *,
          cost_center:cost_centers(*),
          activity:tracking_axes!activity_id(*),
          component:plan_accounts!component_id(*),
          geographic_zone:plan_accounts!geographic_zone_id(*)
        `)
        .order('created_at', { ascending: false });

      if (filters?.fiscal_year_id) {
        query = query.eq('fiscal_year_id', filters.fiscal_year_id);
      }
      if (filters?.allocation_type) {
        query = query.eq('allocation_type', filters.allocation_type);
      }
      if (filters?.allocation_method) {
        query = query.eq('allocation_method', filters.allocation_method);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AnalyticalAllocation[];
    },
  });
}

export function useAnalyticalAllocationMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Omit<AnalyticalAllocation, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('analytical_allocations')
        .insert(data as never)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytical-allocations'] });
      toast.success('Affectation créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<AnalyticalAllocation> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('analytical_allocations')
        .update(data as never)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytical-allocations'] });
      toast.success('Affectation mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('analytical_allocations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytical-allocations'] });
      toast.success('Affectation supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { createMutation, updateMutation, deleteMutation };
}

// Distribution Rules hooks
export function useDistributionRules() {
  return useQuery({
    queryKey: ['distribution-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('distribution_rules')
        .select(`
          *,
          source_account:plan_accounts(*)
        `)
        .order('name');
      
      if (error) throw error;
      return data as DistributionRule[];
    },
  });
}

export function useDistributionRuleMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: { 
      rule: Omit<DistributionRule, 'id' | 'created_at' | 'updated_at'>;
      lines: Omit<DistributionRuleLine, 'id' | 'distribution_rule_id' | 'created_at'>[];
    }) => {
      const { data: rule, error: ruleError } = await supabase
        .from('distribution_rules')
        .insert(data.rule as never)
        .select()
        .single();
      
      if (ruleError) throw ruleError;

      if (data.lines.length > 0) {
        const linesWithRuleId = data.lines.map(line => ({
          ...line,
          distribution_rule_id: rule.id,
        }));

        const { error: linesError } = await supabase
          .from('distribution_rule_lines')
          .insert(linesWithRuleId);

        if (linesError) throw linesError;
      }

      return rule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution-rules'] });
      toast.success('Règle de répartition créée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('distribution_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distribution-rules'] });
      toast.success('Règle de répartition supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { createMutation, deleteMutation };
}

// Analytical summary data
export function useAnalyticalSummary(fiscalYearId?: string) {
  return useQuery({
    queryKey: ['analytical-summary', fiscalYearId],
    queryFn: async () => {
      let query = supabase
        .from('analytical_allocations')
        .select('allocation_type, amount');

      if (fiscalYearId) {
        query = query.eq('fiscal_year_id', fiscalYearId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const summary = {
        by_activity: 0,
        by_component: 0,
        by_geographic: 0,
        by_cost_center: 0,
        total: 0,
      };

      data?.forEach(item => {
        const amount = Number(item.amount) || 0;
        summary.total += amount;
        switch (item.allocation_type) {
          case 'activity':
            summary.by_activity += amount;
            break;
          case 'component':
            summary.by_component += amount;
            break;
          case 'geographic':
            summary.by_geographic += amount;
            break;
          case 'cost_center':
            summary.by_cost_center += amount;
            break;
        }
      });

      return summary;
    },
  });
}
