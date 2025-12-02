import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types - Using interface definitions that match Supabase schema
export interface Bailleur {
  id: string;
  code: string;
  name: string;
  short_name: string | null;
  bailleur_type: string;
  country_id: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  country?: { id: string; name: string; code: string };
}

export interface Convention {
  id: string;
  code: string;
  name: string;
  bailleur_id: string;
  currency_id: string;
  total_amount: number;
  total_amount_local: number;
  exchange_rate: number;
  signing_date: string | null;
  effective_date: string | null;
  closing_date: string | null;
  status: string;
  convention_type: string;
  description: string | null;
  objectives: string | null;
  special_conditions: string | null;
  disbursed_amount: number;
  disbursed_amount_local: number;
  remaining_amount: number;
  remaining_amount_local: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  bailleur?: Bailleur;
  currency?: { id: string; code: string; name: string; symbol: string };
}

export interface ExpenseCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Replenishment {
  id: string;
  code: string;
  convention_id: string;
  request_date: string;
  amount: number;
  amount_local: number | null;
  exchange_rate: number;
  status: string;
  submitted_date: string | null;
  approved_date: string | null;
  received_date: string | null;
  bank_reference: string | null;
  notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  convention?: Convention;
}

export interface DirectPayment {
  id: string;
  code: string;
  convention_id: string;
  expense_category_id: string | null;
  beneficiary_name: string;
  beneficiary_account: string | null;
  amount: number;
  amount_local: number | null;
  exchange_rate: number;
  request_date: string;
  payment_date: string | null;
  status: string;
  description: string | null;
  invoice_reference: string | null;
  contract_reference: string | null;
  bank_reference: string | null;
  notes: string | null;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  convention?: Convention;
  expense_category?: ExpenseCategory;
}

export interface FinancialReport {
  id: string;
  code: string;
  convention_id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  status: string;
  total_expenses: number;
  total_expenses_local: number;
  opening_balance: number;
  closing_balance: number;
  replenishment_requested: number;
  submission_date: string | null;
  approval_date: string | null;
  notes: string | null;
  report_data: any;
  created_by: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  convention?: Convention;
}

// Bailleurs hooks
export function useBailleurs() {
  return useQuery({
    queryKey: ["bailleurs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bailleurs")
        .select("*, country:countries(*)")
        .order("name");
      if (error) throw error;
      return data as Bailleur[];
    },
  });
}

export function useBailleur(id: string) {
  return useQuery({
    queryKey: ["bailleurs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bailleurs")
        .select("*, country:countries(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Bailleur;
    },
    enabled: !!id,
  });
}

export function useCreateBailleur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bailleur: Omit<Partial<Bailleur>, 'id' | 'created_at' | 'updated_at' | 'country'>) => {
      const { data, error } = await supabase
        .from("bailleurs")
        .insert(bailleur as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bailleurs"] });
      toast.success("Bailleur créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateBailleur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...bailleur }: Partial<Bailleur> & { id: string }) => {
      const { data, error } = await supabase
        .from("bailleurs")
        .update(bailleur as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bailleurs"] });
      toast.success("Bailleur mis à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteBailleur() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bailleurs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bailleurs"] });
      toast.success("Bailleur supprimé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Conventions hooks
export function useConventions() {
  return useQuery({
    queryKey: ["conventions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conventions")
        .select("*, bailleur:bailleurs(*), currency:currencies(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Convention[];
    },
  });
}

export function useConvention(id: string) {
  return useQuery({
    queryKey: ["conventions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conventions")
        .select("*, bailleur:bailleurs(*), currency:currencies(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Convention;
    },
    enabled: !!id,
  });
}

export function useConventionsByBailleur(bailleurId: string) {
  return useQuery({
    queryKey: ["conventions", "bailleur", bailleurId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conventions")
        .select("*, bailleur:bailleurs(*), currency:currencies(*)")
        .eq("bailleur_id", bailleurId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Convention[];
    },
    enabled: !!bailleurId,
  });
}

export function useCreateConvention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (convention: Omit<Partial<Convention>, 'id' | 'created_at' | 'updated_at' | 'bailleur' | 'currency'>) => {
      const { data, error } = await supabase
        .from("conventions")
        .insert(convention as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conventions"] });
      toast.success("Convention créée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateConvention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...convention }: Partial<Convention> & { id: string }) => {
      const { data, error } = await supabase
        .from("conventions")
        .update(convention as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conventions"] });
      toast.success("Convention mise à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteConvention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("conventions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conventions"] });
      toast.success("Convention supprimée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Expense Categories hooks
export function useExpenseCategories() {
  return useQuery({
    queryKey: ["expense-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_categories")
        .select("*")
        .order("code");
      if (error) throw error;
      return data as ExpenseCategory[];
    },
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (category: Omit<Partial<ExpenseCategory>, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("expense_categories")
        .insert(category as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("Catégorie créée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...category }: Partial<ExpenseCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("expense_categories")
        .update(category as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("Catégorie mise à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expense_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-categories"] });
      toast.success("Catégorie supprimée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Replenishments hooks
export function useReplenishments(conventionId?: string) {
  return useQuery({
    queryKey: ["replenishments", conventionId],
    queryFn: async () => {
      let query = supabase
        .from("replenishments")
        .select("*, convention:conventions(*, bailleur:bailleurs(*), currency:currencies(*))")
        .order("request_date", { ascending: false });
      
      if (conventionId) {
        query = query.eq("convention_id", conventionId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Replenishment[];
    },
  });
}

export function useCreateReplenishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (replenishment: Omit<Partial<Replenishment>, 'id' | 'created_at' | 'updated_at' | 'convention'>) => {
      const { data, error } = await supabase
        .from("replenishments")
        .insert(replenishment as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replenishments"] });
      queryClient.invalidateQueries({ queryKey: ["conventions"] });
      toast.success("Demande de réapprovisionnement créée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateReplenishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...replenishment }: Partial<Replenishment> & { id: string }) => {
      const { data, error } = await supabase
        .from("replenishments")
        .update(replenishment as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replenishments"] });
      queryClient.invalidateQueries({ queryKey: ["conventions"] });
      toast.success("Demande mise à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteReplenishment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("replenishments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replenishments"] });
      queryClient.invalidateQueries({ queryKey: ["conventions"] });
      toast.success("Demande supprimée avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Direct Payments hooks
export function useDirectPayments(conventionId?: string) {
  return useQuery({
    queryKey: ["direct-payments", conventionId],
    queryFn: async () => {
      let query = supabase
        .from("direct_payments")
        .select("*, convention:conventions(*, bailleur:bailleurs(*), currency:currencies(*)), expense_category:expense_categories(*)")
        .order("request_date", { ascending: false });
      
      if (conventionId) {
        query = query.eq("convention_id", conventionId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DirectPayment[];
    },
  });
}

export function useCreateDirectPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: Omit<Partial<DirectPayment>, 'id' | 'created_at' | 'updated_at' | 'convention' | 'expense_category'>) => {
      const { data, error } = await supabase
        .from("direct_payments")
        .insert(payment as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direct-payments"] });
      queryClient.invalidateQueries({ queryKey: ["conventions"] });
      toast.success("Paiement direct créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateDirectPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payment }: Partial<DirectPayment> & { id: string }) => {
      const { data, error } = await supabase
        .from("direct_payments")
        .update(payment as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direct-payments"] });
      queryClient.invalidateQueries({ queryKey: ["conventions"] });
      toast.success("Paiement mis à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteDirectPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("direct_payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direct-payments"] });
      queryClient.invalidateQueries({ queryKey: ["conventions"] });
      toast.success("Paiement supprimé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Financial Reports hooks
export function useFinancialReports(conventionId?: string) {
  return useQuery({
    queryKey: ["financial-reports", conventionId],
    queryFn: async () => {
      let query = supabase
        .from("financial_reports")
        .select("*, convention:conventions(*, bailleur:bailleurs(*), currency:currencies(*))")
        .order("created_at", { ascending: false });
      
      if (conventionId) {
        query = query.eq("convention_id", conventionId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as FinancialReport[];
    },
  });
}

export function useCreateFinancialReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (report: Omit<Partial<FinancialReport>, 'id' | 'created_at' | 'updated_at' | 'convention'>) => {
      const { data, error } = await supabase
        .from("financial_reports")
        .insert(report as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-reports"] });
      toast.success("Rapport financier créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useUpdateFinancialReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...report }: Partial<FinancialReport> & { id: string }) => {
      const { data, error } = await supabase
        .from("financial_reports")
        .update(report as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-reports"] });
      toast.success("Rapport mis à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

export function useDeleteFinancialReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-reports"] });
      toast.success("Rapport supprimé avec succès");
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
}

// Statistics hooks
export function useBailleurStats(bailleurId: string) {
  return useQuery({
    queryKey: ["bailleur-stats", bailleurId],
    queryFn: async () => {
      const { data: conventions, error } = await supabase
        .from("conventions")
        .select("total_amount, disbursed_amount, remaining_amount, status")
        .eq("bailleur_id", bailleurId);
      
      if (error) throw error;
      
      const totalAmount = conventions?.reduce((sum, c) => sum + (c.total_amount || 0), 0) || 0;
      const disbursedAmount = conventions?.reduce((sum, c) => sum + (c.disbursed_amount || 0), 0) || 0;
      const remainingAmount = conventions?.reduce((sum, c) => sum + (c.remaining_amount || 0), 0) || 0;
      const activeConventions = conventions?.filter(c => c.status === 'active').length || 0;
      
      return {
        totalAmount,
        disbursedAmount,
        remainingAmount,
        activeConventions,
        totalConventions: conventions?.length || 0,
      };
    },
    enabled: !!bailleurId,
  });
}
