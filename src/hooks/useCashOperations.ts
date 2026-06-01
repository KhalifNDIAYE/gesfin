import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { logAction } from '@/hooks/useAuditLogs';

export type OperationType = 'entree' | 'sortie';
export type PaymentMethod = 'especes' | 'cheque' | 'virement' | 'autre';
export type CashOperationStatus = 'brouillon' | 'valide' | 'annule';

export interface CashOperation {
  id: string;
  code: string;
  operation_type: OperationType;
  operation_date: string;
  amount: number;
  amount_local: number;
  currency_id: string | null;
  exchange_rate: number;
  description: string;
  payment_method: PaymentMethod;
  payment_method_other: string | null;
  cash_account_id: string;
  counterpart_account_id: string;
  fiscal_year_id: string;
  journal_id: string | null;
  journal_entry_id: string | null;
  project_id: string | null;
  bailleur_id: string | null;
  convention_id: string | null;
  budget_id: string | null;
  budget_line_id: string | null;
  third_party_id: string | null;
  status: CashOperationStatus;
  validated_by: string | null;
  validated_at: string | null;
  attachments: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  currency?: { id: string; code: string; symbol: string } | null;
  cash_account?: { id: string; code: string; name: string } | null;
  counterpart_account?: { id: string; code: string; name: string } | null;
  fiscal_year?: { id: string; name: string } | null;
  journal?: { id: string; code: string; name: string } | null;
  project?: { id: string; code: string; name: string } | null;
  bailleur?: { id: string; code: string; name: string } | null;
  convention?: { id: string; code: string; name: string } | null;
  budget?: { id: string; code: string; name: string } | null;
  budget_line?: { id: string; description: string; forecast_amount: number; realized_amount: number } | null;
  third_party?: { id: string; code: string; name: string } | null;
  validated_by_profile?: { id: string; full_name: string } | null;
  created_by_profile?: { id: string; full_name: string } | null;
}

export interface CashOperationFormData {
  code?: string;
  operation_type: OperationType;
  operation_date: string;
  amount: number;
  currency_id?: string;
  exchange_rate?: number;
  description: string;
  payment_method: PaymentMethod;
  payment_method_other?: string;
  cash_account_id: string;
  counterpart_account_id: string;
  fiscal_year_id: string;
  journal_id?: string;
  project_id?: string;
  bailleur_id?: string;
  convention_id?: string;
  budget_id?: string;
  budget_line_id?: string;
  third_party_id?: string;
  attachments?: { name: string; url: string; size: number }[];
}

interface CashOperationsFilters {
  fiscalYearId?: string;
  operationType?: OperationType;
  status?: CashOperationStatus;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

// Fetch cash operations
export function useCashOperations(filters?: CashOperationsFilters) {
  return useQuery({
    queryKey: ['cash-operations', filters],
    queryFn: async () => {
      let query: any = supabase
        .from('cash_operations')
        .select(`
          *,
          currency:currencies(id, code, symbol),
          cash_account:plan_accounts!cash_operations_cash_account_id_fkey(id, code, name),
          counterpart_account:plan_accounts!cash_operations_counterpart_account_id_fkey(id, code, name),
          fiscal_year:fiscal_years(id, name),
          journal:journals(id, code, name),
          project:projects(id, code, name),
          bailleur:bailleurs(id, code, name),
          convention:conventions(id, code, name),
          budget:budgets(id, code, name),
          budget_line:budget_lines(id, description, forecast_amount, realized_amount),
          third_party:third_parties(id, code, name),
          validated_by_profile:profiles!cash_operations_validated_by_fkey(id, full_name),
          created_by_profile:profiles!cash_operations_created_by_fkey(id, full_name)
        `)
        .order('operation_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filters?.fiscalYearId) {
        query = query.eq('fiscal_year_id', filters.fiscalYearId);
      }
      if (filters?.operationType) {
        query = query.eq('operation_type', filters.operationType);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }
      if (filters?.startDate) {
        query = query.gte('operation_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('operation_date', filters.endDate);
      }
      if (filters?.search) {
        query = query.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as CashOperation[];
    },
  });
}

// Fetch single cash operation
export function useCashOperation(id: string | null) {
  return useQuery({
    queryKey: ['cash-operation', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await (supabase as any)
        .from('cash_operations')
        .select(`
          *,
          currency:currencies(id, code, symbol),
          cash_account:plan_accounts!cash_operations_cash_account_id_fkey(id, code, name),
          counterpart_account:plan_accounts!cash_operations_counterpart_account_id_fkey(id, code, name),
          fiscal_year:fiscal_years(id, name),
          journal:journals(id, code, name),
          project:projects(id, code, name),
          bailleur:bailleurs(id, code, name),
          convention:conventions(id, code, name),
          budget:budgets(id, code, name),
          budget_line:budget_lines(id, description, forecast_amount, realized_amount),
          third_party:third_parties(id, code, name),
          validated_by_profile:profiles!cash_operations_validated_by_fkey(id, full_name),
          created_by_profile:profiles!cash_operations_created_by_fkey(id, full_name)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as unknown as CashOperation;
    },
    enabled: !!id,
  });
}

// Get cash balance statistics
export function useCashStatistics(fiscalYearId?: string) {
  return useQuery({
    queryKey: ['cash-statistics', fiscalYearId],
    queryFn: async () => {
      let query = supabase
        .from('cash_operations')
        .select('operation_type, amount, status, operation_date')
        .eq('status', 'valide');

      if (fiscalYearId) {
        query = query.eq('fiscal_year_id', fiscalYearId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const stats = {
        totalEntrees: 0,
        totalSorties: 0,
        solde: 0,
        operationsJour: 0,
      };

      data?.forEach(op => {
        const amount = Number(op.amount);
        if (op.operation_type === 'entree') {
          stats.totalEntrees += amount;
        } else {
          stats.totalSorties += amount;
        }
        if (op.operation_date === today) {
          stats.operationsJour++;
        }
      });

      stats.solde = stats.totalEntrees - stats.totalSorties;

      return stats;
    },
  });
}

// Generate code
export function useGenerateCashOperationCode() {
  return useQuery({
    queryKey: ['generate-cash-operation-code'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('generate_cash_operation_code');
      if (error) throw error;
      return data as string;
    },
    staleTime: 0,
    refetchOnMount: true,
  });
}

// Create cash operation
export function useCreateCashOperation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: CashOperationFormData) => {
      // Generate code if not provided
      let code = formData.code;
      if (!code) {
        const { data: generatedCode, error: codeError } = await supabase.rpc('generate_cash_operation_code');
        if (codeError) throw codeError;
        code = generatedCode;
      }

      // Calculate amount_local
      const exchangeRate = formData.exchange_rate || 1;
      const amountLocal = formData.amount * exchangeRate;

      const { data, error } = await supabase
        .from('cash_operations')
        .insert({
          ...formData,
          code,
          amount_local: amountLocal,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await logAction(
        'create',
        'comptabilite',
        'cash_operation',
        data.id,
        undefined,
        { code, amount: formData.amount, operation_type: formData.operation_type }
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-operations'] });
      queryClient.invalidateQueries({ queryKey: ['cash-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Opération de caisse créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Update cash operation
export function useUpdateCashOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: Partial<CashOperationFormData> & { id: string }) => {
      // Calculate amount_local if amount changed
      let updateData: Record<string, unknown> = { ...formData };
      if (formData.amount !== undefined) {
        const exchangeRate = formData.exchange_rate || 1;
        updateData.amount_local = formData.amount * exchangeRate;
      }

      const { data, error } = await supabase
        .from('cash_operations')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await logAction(
        'update',
        'comptabilite',
        'cash_operation',
        id,
        undefined,
        updateData
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-operations'] });
      queryClient.invalidateQueries({ queryKey: ['cash-operation'] });
      queryClient.invalidateQueries({ queryKey: ['cash-statistics'] });
      toast.success('Opération de caisse mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Validate cash operation
export function useValidateCashOperation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get operation details
      const { data: operation, error: fetchError } = await supabase
        .from('cash_operations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update status
      const { data, error } = await supabase
        .from('cash_operations')
        .update({
          status: 'valide',
          validated_by: user?.id,
          validated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Create journal entry for validated operation
      await createJournalEntryForOperation(operation as unknown as CashOperation);

      // Update budget if linked
      if (operation.budget_line_id && operation.operation_type === 'sortie') {
        await updateBudgetRealization(operation.budget_line_id, operation.amount);
      }

      // Log audit
      await logAction(
        'validate',
        'comptabilite',
        'cash_operation',
        id,
        { status: 'brouillon' },
        { status: 'valide', validated_by: user?.id }
      );

      // Create notification
      await supabase.from('notifications').insert({
        user_id: operation.created_by,
        title: 'Opération de caisse validée',
        message: `L'opération ${operation.code} a été validée`,
        type: 'info',
        link: `/comptabilite/caisse`,
      } as never);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-operations'] });
      queryClient.invalidateQueries({ queryKey: ['cash-operation'] });
      queryClient.invalidateQueries({ queryKey: ['cash-statistics'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['budget_lines'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Opération validée et écritures comptables générées');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Delete cash operation
export function useDeleteCashOperation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get operation for audit
      const { data: operation } = await supabase
        .from('cash_operations')
        .select('code, amount, operation_type')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from('cash_operations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log audit
      if (operation) {
        await logAction(
          'delete',
          'comptabilite',
          'cash_operation',
          id,
          operation,
          undefined
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-operations'] });
      queryClient.invalidateQueries({ queryKey: ['cash-statistics'] });
      toast.success('Opération supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Helper: Create journal entry for validated operation
async function createJournalEntryForOperation(operation: CashOperation) {
  // Get cash journal
  const { data: cashJournal } = await supabase
    .from('journals')
    .select('id')
    .eq('journal_type', 'caisse')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!cashJournal) return;

  // Generate entry number
  const { data: entryNumber } = await supabase.rpc('generate_entry_number', {
    _journal_code: 'CSE',
    _fiscal_year_id: operation.fiscal_year_id,
  });

  // Create journal entry
  const { data: journalEntry, error: entryError } = await supabase
    .from('journal_entries')
    .insert({
      entry_number: entryNumber || `CSE-${Date.now()}`,
      entry_date: operation.operation_date,
      journal_id: cashJournal.id,
      fiscal_year_id: operation.fiscal_year_id,
      entry_type: operation.operation_type === 'sortie' ? 'depense' : 'financement',
      description: operation.description,
      reference: operation.code,
      currency_id: operation.currency_id,
      exchange_rate: operation.exchange_rate,
      status: 'valide',
      third_party_id: operation.third_party_id,
      project_id: operation.project_id,
      created_by: operation.created_by,
      validated_by: operation.validated_by,
      validated_at: operation.validated_at,
    })
    .select()
    .single();

  if (entryError) throw entryError;

  // Create journal entry lines
  const lines = [];
  
  if (operation.operation_type === 'entree') {
    // Debit cash account, credit counterpart
    lines.push({
      journal_entry_id: journalEntry.id,
      line_number: 1,
      account_id: operation.cash_account_id,
      description: operation.description,
      debit_amount: operation.amount_local,
      credit_amount: 0,
      debit_amount_currency: operation.amount,
      credit_amount_currency: 0,
      third_party_id: operation.third_party_id,
    });
    lines.push({
      journal_entry_id: journalEntry.id,
      line_number: 2,
      account_id: operation.counterpart_account_id,
      description: operation.description,
      debit_amount: 0,
      credit_amount: operation.amount_local,
      debit_amount_currency: 0,
      credit_amount_currency: operation.amount,
      third_party_id: operation.third_party_id,
    });
  } else {
    // Debit counterpart, credit cash account
    lines.push({
      journal_entry_id: journalEntry.id,
      line_number: 1,
      account_id: operation.counterpart_account_id,
      description: operation.description,
      debit_amount: operation.amount_local,
      credit_amount: 0,
      debit_amount_currency: operation.amount,
      credit_amount_currency: 0,
      third_party_id: operation.third_party_id,
    });
    lines.push({
      journal_entry_id: journalEntry.id,
      line_number: 2,
      account_id: operation.cash_account_id,
      description: operation.description,
      debit_amount: 0,
      credit_amount: operation.amount_local,
      debit_amount_currency: 0,
      credit_amount_currency: operation.amount,
      third_party_id: operation.third_party_id,
    });
  }

  await supabase.from('journal_entry_lines').insert(lines);

  // Update cash operation with journal entry link
  await supabase
    .from('cash_operations')
    .update({ journal_entry_id: journalEntry.id, journal_id: cashJournal.id })
    .eq('id', operation.id);
}

// Helper: Update budget realization
async function updateBudgetRealization(budgetLineId: string, amount: number) {
  const { data: line } = await supabase
    .from('budget_lines')
    .select('realized_amount, realized_amount_local, forecast_amount')
    .eq('id', budgetLineId)
    .single();

  if (line) {
    const newRealized = Number(line.realized_amount) + amount;
    const isOverBudget = newRealized > Number(line.forecast_amount);

    await supabase
      .from('budget_lines')
      .update({
        realized_amount: newRealized,
        realized_amount_local: newRealized,
        is_over_budget: isOverBudget,
      })
      .eq('id', budgetLineId);
  }
}

// Check budget availability
export async function checkBudgetAvailability(budgetLineId: string, amount: number): Promise<{
  available: boolean;
  remainingBudget: number;
  message?: string;
}> {
  const { data: line } = await supabase
    .from('budget_lines')
    .select('forecast_amount, realized_amount, description')
    .eq('id', budgetLineId)
    .single();

  if (!line) {
    return { available: false, remainingBudget: 0, message: 'Ligne budgétaire non trouvée' };
  }

  const remaining = Number(line.forecast_amount) - Number(line.realized_amount);
  const available = remaining >= amount;

  return {
    available,
    remainingBudget: remaining,
    message: available
      ? undefined
      : `Budget insuffisant. Disponible: ${remaining.toLocaleString('fr-FR')} - Demandé: ${amount.toLocaleString('fr-FR')}`,
  };
}
