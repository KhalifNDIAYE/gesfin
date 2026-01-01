import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface InterfaceSettings {
  id: string;
  user_id: string;
  language: string;
  date_format: string;
  number_format: string;
  timezone: string;
  sidebar_collapsed: boolean;
  created_at: string;
  updated_at: string;
}

export function useInterfaceSettings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['interface-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('interface_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as InterfaceSettings | null;
    },
    enabled: !!user?.id,
  });
}

export function useInterfaceSettingsMutations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const upsertSettings = useMutation({
    mutationFn: async (settings: Partial<InterfaceSettings>) => {
      if (!user?.id) throw new Error('Utilisateur non connecté');

      // Check if settings exist
      const { data: existing } = await supabase
        .from('interface_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from('interface_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('interface_settings')
          .insert({
            ...settings,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interface-settings'] });
      toast.success('Paramètres d\'interface enregistrés');
    },
    onError: (error) => {
      console.error('Error saving interface settings:', error);
      toast.error('Erreur lors de l\'enregistrement des paramètres');
    },
  });

  return { upsertSettings };
}
