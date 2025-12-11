import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Region {
  id: string;
  code: string;
  name: string;
  country_id: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  country?: { id: string; name: string; code: string } | null;
}

export interface RegionFormData {
  code: string;
  name: string;
  country_id: string | null;
  latitude: number | null;
  longitude: number | null;
  is_active: boolean;
}

export const useRegions = (countryId?: string) => {
  const queryClient = useQueryClient();

  const { data: regions = [], isLoading, error } = useQuery({
    queryKey: ['regions', countryId],
    queryFn: async () => {
      let query = supabase
        .from('regions')
        .select(`
          *,
          country:countries(id, name, code)
        `)
        .eq('is_active', true)
        .order('name');

      if (countryId) {
        query = query.eq('country_id', countryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Region[];
    },
  });

  const createRegion = useMutation({
    mutationFn: async (data: RegionFormData) => {
      const { error } = await supabase.from('regions').insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast.success('Région créée avec succès');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateRegion = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<RegionFormData> }) => {
      const { error } = await supabase.from('regions').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast.success('Région mise à jour');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteRegion = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('regions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      toast.success('Région supprimée');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return {
    regions,
    isLoading,
    error,
    createRegion,
    updateRegion,
    deleteRegion,
  };
};

export const useRegionsByCountry = (countryId: string | undefined) => {
  return useQuery({
    queryKey: ['regions-by-country', countryId],
    queryFn: async () => {
      if (!countryId) return [];
      
      const { data, error } = await supabase
        .from('regions')
        .select('id, code, name, latitude, longitude')
        .eq('country_id', countryId)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!countryId,
  });
};
