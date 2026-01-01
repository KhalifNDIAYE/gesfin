import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccountingSettings {
  id: string;
  current_fiscal_year: string;
  default_currency: string;
  chart_of_accounts: string;
  default_vat_rate: number;
  auto_numbering_enabled: boolean;
  two_step_validation_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function useAccountingSettings() {
  return useQuery({
    queryKey: ['accounting-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounting_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data as AccountingSettings;
    },
  });
}

export function useAccountingSettingsMutations() {
  const queryClient = useQueryClient();

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Omit<AccountingSettings, 'id' | 'created_at' | 'updated_at'>>) => {
      // First get the existing settings ID
      const { data: existing, error: fetchError } = await supabase
        .from('accounting_settings')
        .select('id')
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from('accounting_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounting-settings'] });
      toast.success('Paramètres comptables enregistrés avec succès');
    },
    onError: (error: Error) => {
      console.error('Error updating accounting settings:', error);
      toast.error('Erreur lors de l\'enregistrement des paramètres');
    },
  });

  return { updateSettings };
}
