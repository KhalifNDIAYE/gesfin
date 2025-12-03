import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DisbursementStats {
  totalEncaissements: number;
  totalDecaissements: number;
  pending: number;
  soldePeriode: number;
}

export interface DisbursementMovement {
  id: string;
  reference: string;
  date: string;
  type: 'encaissement' | 'decaissement';
  description: string;
  bailleur: string;
  project: string;
  beneficiary: string;
  amount: number;
  status: 'valide' | 'en_attente' | 'rejete';
  workflow_status?: string;
}

export interface FluxData {
  month: string;
  encaissements: number;
  decaissements: number;
}

// Get disbursement statistics
export const useDisbursementStats = () => {
  return useQuery({
    queryKey: ['disbursement-stats'],
    queryFn: async () => {
      // Get replenishments (encaissements)
      const { data: replenishments } = await supabase
        .from('replenishments')
        .select('amount, status');

      const totalEncaissements = replenishments
        ?.filter(r => r.status === 'received')
        .reduce((sum, r) => sum + Number(r.amount || 0), 0) || 0;

      // Get direct payments (décaissements)
      const { data: directPayments } = await supabase
        .from('direct_payments')
        .select('amount, status');

      const totalDecaissements = directPayments
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

      const pending = directPayments
        ?.filter(p => p.status === 'pending' || p.status === 'draft')
        .length || 0;

      // Get contract payments
      const { data: contractPayments } = await supabase
        .from('contract_payments')
        .select('amount, status');

      const contractDecaissements = contractPayments
        ?.filter(p => p.status === 'processed')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

      return {
        totalEncaissements,
        totalDecaissements: totalDecaissements + contractDecaissements,
        pending,
        soldePeriode: totalEncaissements - totalDecaissements - contractDecaissements,
      } as DisbursementStats;
    },
  });
};

// Get flux evolution data
export const useFluxEvolution = () => {
  return useQuery({
    queryKey: ['flux-evolution'],
    queryFn: async () => {
      const months = ['Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc', 'Jan'];
      
      // Get replenishments by month
      const { data: replenishments } = await supabase
        .from('replenishments')
        .select('amount, received_date, status')
        .eq('status', 'received');

      // Get direct payments by month
      const { data: directPayments } = await supabase
        .from('direct_payments')
        .select('amount, payment_date, status')
        .eq('status', 'paid');

      // Aggregate by month (simplified - using random data for demo)
      const fluxData: FluxData[] = months.map((month, index) => {
        const monthReplenishments = replenishments?.filter(r => {
          if (!r.received_date) return false;
          const date = new Date(r.received_date);
          return date.getMonth() === (6 + index) % 12;
        }) || [];
        
        const monthPayments = directPayments?.filter(p => {
          if (!p.payment_date) return false;
          const date = new Date(p.payment_date);
          return date.getMonth() === (6 + index) % 12;
        }) || [];

        return {
          month,
          encaissements: monthReplenishments.reduce((sum, r) => sum + Number(r.amount || 0), 0),
          decaissements: monthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
        };
      });

      return fluxData;
    },
  });
};

// Get recent movements
export const useRecentMovements = () => {
  return useQuery({
    queryKey: ['recent-movements'],
    queryFn: async () => {
      const movements: DisbursementMovement[] = [];

      // Get replenishments
      const { data: replenishments } = await supabase
        .from('replenishments')
        .select(`
          id, code, received_date, amount, status, description,
          conventions!inner (
            name, code,
            bailleurs!inner (name, short_name)
          )
        `)
        .order('received_date', { ascending: false })
        .limit(10);

      replenishments?.forEach((r: any) => {
        movements.push({
          id: r.id,
          reference: r.code,
          date: r.received_date || '',
          type: 'encaissement',
          description: r.description || 'Réapprovisionnement',
          bailleur: r.conventions?.bailleurs?.short_name || r.conventions?.bailleurs?.name || '-',
          project: r.conventions?.code || '-',
          beneficiary: 'Compte Projet',
          amount: Number(r.amount || 0),
          status: r.status === 'received' ? 'valide' : r.status === 'rejected' ? 'rejete' : 'en_attente',
        });
      });

      // Get direct payments
      const { data: directPayments } = await supabase
        .from('direct_payments')
        .select(`
          id, code, payment_date, amount, status, description, beneficiary_name, workflow_status,
          conventions!inner (
            name, code,
            bailleurs!inner (name, short_name)
          )
        `)
        .order('payment_date', { ascending: false })
        .limit(10);

      directPayments?.forEach((p: any) => {
        movements.push({
          id: p.id,
          reference: p.code,
          date: p.payment_date || p.request_date || '',
          type: 'decaissement',
          description: p.description || 'Paiement direct',
          bailleur: p.conventions?.bailleurs?.short_name || p.conventions?.bailleurs?.name || '-',
          project: p.conventions?.code || '-',
          beneficiary: p.beneficiary_name || '-',
          amount: Number(p.amount || 0),
          status: p.status === 'paid' ? 'valide' : p.status === 'rejected' ? 'rejete' : 'en_attente',
          workflow_status: p.workflow_status || 'brouillon',
        });
      });

      // Sort by date
      return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
  });
};

// Get disbursements by project
export const useDisbursementsByProject = () => {
  return useQuery({
    queryKey: ['disbursements-by-project'],
    queryFn: async () => {
      const { data: conventions } = await supabase
        .from('conventions')
        .select(`
          id, code, name, total_amount, disbursed_amount,
          bailleurs!inner (name, short_name)
        `);

      return conventions?.map((c: any) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        bailleur: c.bailleurs?.short_name || c.bailleurs?.name,
        budget: Number(c.total_amount || 0),
        disbursed: Number(c.disbursed_amount || 0),
        remaining: Number(c.total_amount || 0) - Number(c.disbursed_amount || 0),
        rate: c.total_amount > 0 ? (Number(c.disbursed_amount || 0) / Number(c.total_amount)) * 100 : 0,
      })) || [];
    },
  });
};

// Get disbursements by bailleur
export const useDisbursementsByBailleur = () => {
  return useQuery({
    queryKey: ['disbursements-by-bailleur'],
    queryFn: async () => {
      const { data: bailleurs } = await supabase
        .from('bailleurs')
        .select('id, code, name, short_name');

      const { data: conventions } = await supabase
        .from('conventions')
        .select('bailleur_id, total_amount, disbursed_amount');

      return bailleurs?.map(b => {
        const bailleurConventions = conventions?.filter(c => c.bailleur_id === b.id) || [];
        const totalBudget = bailleurConventions.reduce((sum, c) => sum + Number(c.total_amount || 0), 0);
        const totalDisbursed = bailleurConventions.reduce((sum, c) => sum + Number(c.disbursed_amount || 0), 0);

        return {
          id: b.id,
          code: b.code,
          name: b.short_name || b.name,
          conventions: bailleurConventions.length,
          budget: totalBudget,
          disbursed: totalDisbursed,
          remaining: totalBudget - totalDisbursed,
          rate: totalBudget > 0 ? (totalDisbursed / totalBudget) * 100 : 0,
        };
      }) || [];
    },
  });
};

// Get budget comparison data
export const useBudgetComparison = () => {
  return useQuery({
    queryKey: ['budget-comparison'],
    queryFn: async () => {
      const { data: budgetLines } = await supabase
        .from('budget_lines')
        .select(`
          id, description, forecast_amount, realized_amount, committed_amount,
          plan_accounts (code, name),
          budgets!inner (code, name)
        `);

      return budgetLines?.map((line: any) => ({
        id: line.id,
        budget: line.budgets?.name || '-',
        category: line.plan_accounts?.name || line.description || '-',
        accountCode: line.plan_accounts?.code || '-',
        forecast: Number(line.forecast_amount || 0),
        committed: Number(line.committed_amount || 0),
        realized: Number(line.realized_amount || 0),
        variance: Number(line.forecast_amount || 0) - Number(line.realized_amount || 0),
        varianceRate: line.forecast_amount > 0 
          ? ((Number(line.forecast_amount) - Number(line.realized_amount || 0)) / Number(line.forecast_amount)) * 100 
          : 0,
      })) || [];
    },
  });
};
