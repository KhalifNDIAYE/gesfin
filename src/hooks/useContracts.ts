import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { calculateRemainingAmount } from '@/lib/contractCalculations';

export interface Contract {
  id: string;
  code: string;
  object: string;
  contract_type: string;
  status: string;
  supplier_id: string | null;
  supplier_name: string | null;
  project_id: string | null;
  convention_id: string | null;
  budget_line_id: string | null;
  total_amount: number;
  total_amount_local: number | null;
  currency_id: string | null;
  exchange_rate: number | null;
  engaged_amount: number | null;
  paid_amount: number | null;
  remaining_amount: number | null;
  progress_percentage: number | null;
  signing_date: string | null;
  start_date: string | null;
  end_date: string | null;
  actual_end_date: string | null;
  warranty_end_date: string | null;
  description: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ContractDecompte {
  id: string;
  contract_id: string;
  code: string;
  decompte_number: number;
  decompte_type: string;
  amount: number;
  amount_local: number | null;
  cumulative_amount: number | null;
  previous_amount: number | null;
  deduction_amount: number | null;
  net_amount: number | null;
  progress_percentage: number | null;
  submission_date: string;
  approval_date: string | null;
  payment_date: string | null;
  status: string;
  description: string | null;
  notes: string | null;
  approved_by: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ContractPayment {
  id: string;
  contract_id: string;
  decompte_id: string | null;
  code: string;
  amount: number;
  amount_local: number | null;
  payment_date: string;
  payment_method: string | null;
  bank_reference: string | null;
  beneficiary_name: string | null;
  beneficiary_account: string | null;
  status: string;
  description: string | null;
  notes: string | null;
  journal_entry_id: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ContractGuarantee {
  id: string;
  contract_id: string;
  code: string;
  guarantee_type: string;
  amount: number;
  amount_local: number | null;
  percentage: number | null;
  issuer_name: string | null;
  reference_number: string | null;
  issue_date: string;
  expiry_date: string | null;
  release_date: string | null;
  status: string;
  description: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ContractEngagement {
  id: string;
  contract_id: string;
  code: string;
  engagement_type: string;
  amount: number;
  amount_local: number | null;
  engagement_date: string;
  fiscal_year_id: string | null;
  budget_line_id: string | null;
  description: string | null;
  reference: string | null;
  status: string;
  consumed_amount: number | null;
  remaining_amount: number | null;
  journal_entry_id: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// Contracts hooks
export function useContracts() {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: ['contracts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Contract;
    },
    enabled: !!id,
  });
}

export function useContractStats() {
  return useQuery({
    queryKey: ['contracts', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contracts').select('*');
      if (error) throw error;
      
      const contracts = data as Contract[];
      const total = contracts.length;
      const inProgress = contracts.filter(c => c.status === 'in_progress').length;
      const completed = contracts.filter(c => c.status === 'completed').length;
      const disputed = contracts.filter(c => c.status === 'disputed').length;
      
      // Use rounded values for all amounts
      const totalAmount = contracts.reduce((sum, c) => sum + Math.round(Number(c.total_amount) || 0), 0);
      const engagedAmount = contracts.reduce((sum, c) => sum + Math.round(Number(c.engaged_amount) || 0), 0);
      const paidAmount = contracts.reduce((sum, c) => sum + Math.round(Number(c.paid_amount) || 0), 0);
      
      return { total, inProgress, completed, disputed, totalAmount, engagedAmount, paidAmount };
    },
  });
}

export function useContractMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createContract = useMutation({
    mutationFn: async (contract: Partial<Contract>) => {
      const { data, error } = await supabase
        .from('contracts')
        .insert(contract as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Marché créé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contract> & { id: string }) => {
      const { data, error } = await supabase
        .from('contracts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Marché mis à jour avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contracts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Marché supprimé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return { createContract, updateContract, deleteContract };
}

// Decomptes hooks
export function useContractDecomptes(contractId?: string) {
  return useQuery({
    queryKey: ['contract_decomptes', contractId],
    queryFn: async () => {
      let query = supabase.from('contract_decomptes').select('*').order('decompte_number', { ascending: true });
      if (contractId) query = query.eq('contract_id', contractId);
      const { data, error } = await query;
      if (error) throw error;
      return data as ContractDecompte[];
    },
  });
}

export function useDecompteMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createDecompte = useMutation({
    mutationFn: async (decompte: Partial<ContractDecompte>) => {
      const { data, error } = await supabase
        .from('contract_decomptes')
        .insert(decompte as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_decomptes'] });
      toast({ title: 'Décompte créé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateDecompte = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContractDecompte> & { id: string }) => {
      const { data, error } = await supabase
        .from('contract_decomptes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_decomptes'] });
      toast({ title: 'Décompte mis à jour avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return { createDecompte, updateDecompte };
}

// Payments hooks
export function useContractPayments(contractId?: string) {
  return useQuery({
    queryKey: ['contract_payments', contractId],
    queryFn: async () => {
      let query = supabase.from('contract_payments').select('*').order('payment_date', { ascending: false });
      if (contractId) query = query.eq('contract_id', contractId);
      const { data, error } = await query;
      if (error) throw error;
      return data as ContractPayment[];
    },
  });
}

export function usePaymentMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPayment = useMutation({
    mutationFn: async (payment: Partial<ContractPayment>) => {
      const { data, error } = await supabase
        .from('contract_payments')
        .insert(payment as any)
        .select()
        .single();
      if (error) throw error;
      
      // Update contract paid_amount and remaining_amount
      if (payment.contract_id && payment.amount) {
        const { data: contract } = await supabase
          .from('contracts')
          .select('total_amount, paid_amount')
          .eq('id', payment.contract_id)
          .single();
        
        if (contract) {
          const newPaidAmount = (contract.paid_amount || 0) + Number(payment.amount);
          const newRemainingAmount = calculateRemainingAmount(contract.total_amount, newPaidAmount);
          
          await supabase
            .from('contracts')
            .update({
              paid_amount: Math.round(newPaidAmount),
              remaining_amount: Math.round(newRemainingAmount),
            })
            .eq('id', payment.contract_id);
        }
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_payments'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Règlement créé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return { createPayment };
}

// Guarantees hooks
export function useContractGuarantees(contractId?: string) {
  return useQuery({
    queryKey: ['contract_guarantees', contractId],
    queryFn: async () => {
      let query = supabase.from('contract_guarantees').select('*').order('issue_date', { ascending: false });
      if (contractId) query = query.eq('contract_id', contractId);
      const { data, error } = await query;
      if (error) throw error;
      return data as ContractGuarantee[];
    },
  });
}

export function useGuaranteeMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createGuarantee = useMutation({
    mutationFn: async (guarantee: Partial<ContractGuarantee>) => {
      const { data, error } = await supabase
        .from('contract_guarantees')
        .insert(guarantee as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_guarantees'] });
      toast({ title: 'Garantie créée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return { createGuarantee };
}

// Engagements hooks
export function useContractEngagements(contractId?: string) {
  return useQuery({
    queryKey: ['contract_engagements', contractId],
    queryFn: async () => {
      let query = supabase.from('contract_engagements').select('*').order('engagement_date', { ascending: false });
      if (contractId) query = query.eq('contract_id', contractId);
      const { data, error } = await query;
      if (error) throw error;
      return data as ContractEngagement[];
    },
  });
}

export function useEngagementMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createEngagement = useMutation({
    mutationFn: async (engagement: Partial<ContractEngagement>) => {
      const { data, error } = await supabase
        .from('contract_engagements')
        .insert(engagement as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract_engagements'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast({ title: 'Engagement créé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return { createEngagement };
}
