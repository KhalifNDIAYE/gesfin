import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AssetCategory {
  id: string;
  code: string;
  name: string;
  depreciation_rate: number | null;
  depreciation_method: string | null;
  useful_life_years: number | null;
  account_id: string | null;
  depreciation_account_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Asset {
  id: string;
  code: string;
  designation: string;
  description: string | null;
  category_id: string | null;
  acquisition_date: string;
  acquisition_value: number;
  residual_value: number | null;
  current_value: number | null;
  accumulated_depreciation: number | null;
  net_book_value: number | null;
  depreciation_start_date: string | null;
  useful_life_years: number | null;
  depreciation_rate: number | null;
  depreciation_method: string | null;
  status: string;
  location_id: string | null;
  site_id: string | null;
  assigned_to: string | null;
  project_id: string | null;
  convention_id: string | null;
  supplier_id: string | null;
  invoice_reference: string | null;
  serial_number: string | null;
  brand: string | null;
  model: string | null;
  journal_entry_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  category?: AssetCategory | null;
  location?: { id: string; name: string; code: string } | null;
  site?: { id: string; name: string; code: string } | null;
  assigned_user?: { id: string; full_name: string | null; email: string } | null;
}

export interface AssetMovement {
  id: string;
  asset_id: string;
  movement_type: string;
  movement_date: string;
  from_location_id: string | null;
  to_location_id: string | null;
  from_assigned_to: string | null;
  to_assigned_to: string | null;
  reason: string | null;
  notes: string | null;
  document_reference: string | null;
  created_by: string | null;
  created_at: string | null;
}

export interface AssetDepreciation {
  id: string;
  asset_id: string;
  fiscal_year_id: string | null;
  period_start: string;
  period_end: string;
  depreciation_amount: number;
  accumulated_amount: number;
  net_book_value: number;
  journal_entry_id: string | null;
  status: string | null;
  created_by: string | null;
  created_at: string | null;
}

export interface AssetDisposal {
  id: string;
  asset_id: string;
  disposal_type: string;
  disposal_date: string;
  disposal_value: number | null;
  net_book_value_at_disposal: number | null;
  gain_loss: number | null;
  reason: string | null;
  buyer_name: string | null;
  document_reference: string | null;
  journal_entry_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string | null;
}

// Asset Categories hooks
export const useAssetCategories = () => {
  return useQuery({
    queryKey: ['asset-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .order('code');

      if (error) throw error;
      return data as AssetCategory[];
    },
  });
};

export const useAssetCategoryMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (category: Omit<AssetCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('asset_categories')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
      toast.success('Catégorie créée avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...category }: Partial<AssetCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('asset_categories')
        .update(category)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
      toast.success('Catégorie mise à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('asset_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-categories'] });
      toast.success('Catégorie supprimée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};

// Assets hooks
export const useAssets = (filters?: { status?: string; category_id?: string }) => {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: async () => {
      let query = supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(*),
          location:locations(*),
          site:sites(*),
          assigned_user:profiles!assets_assigned_to_fkey(id, full_name, email)
        `)
        .order('code');

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Asset[];
    },
  });
};

export const useAsset = (id: string | null) => {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(*),
          location:locations(*),
          site:sites(*),
          assigned_user:profiles!assets_assigned_to_fkey(id, full_name, email)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Asset | null;
    },
    enabled: !!id,
  });
};

export const useAssetMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (asset: Omit<Asset, 'id' | 'created_at' | 'updated_at' | 'category' | 'location' | 'site' | 'assigned_user'>) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('assets')
        .insert({
          ...asset,
          created_by: userData.user?.id,
          net_book_value: asset.acquisition_value - (asset.accumulated_depreciation || 0),
          current_value: asset.acquisition_value,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Actif créé avec succès');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...asset }: Partial<Asset> & { id: string }) => {
      const updateData = { ...asset };
      delete updateData.category;
      delete updateData.location;
      delete updateData.site;
      delete updateData.assigned_user;

      const { data, error } = await supabase
        .from('assets')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Actif mis à jour');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Actif supprimé');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};

// Asset Movements hooks
export const useAssetMovements = (assetId?: string) => {
  return useQuery({
    queryKey: ['asset-movements', assetId],
    queryFn: async () => {
      let query = supabase
        .from('asset_movements')
        .select(`
          *,
          from_location:locations!asset_movements_from_location_id_fkey(id, name, code),
          to_location:locations!asset_movements_to_location_id_fkey(id, name, code)
        `)
        .order('movement_date', { ascending: false });

      if (assetId) {
        query = query.eq('asset_id', assetId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
};

export const useAssetMovementMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (movement: Omit<AssetMovement, 'id' | 'created_at'>) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('asset_movements')
        .insert({
          ...movement,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update asset location/assigned_to if needed
      if (movement.to_location_id || movement.to_assigned_to) {
        const updateData: Record<string, string | null> = {};
        if (movement.to_location_id) updateData.location_id = movement.to_location_id;
        if (movement.to_assigned_to) updateData.assigned_to = movement.to_assigned_to;

        await supabase
          .from('assets')
          .update(updateData as never)
          .eq('id', movement.asset_id);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-movements'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Mouvement enregistré');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { createMutation };
};

// Asset Depreciations hooks
export const useAssetDepreciations = (assetId?: string) => {
  return useQuery({
    queryKey: ['asset-depreciations', assetId],
    queryFn: async () => {
      let query = supabase
        .from('asset_depreciations')
        .select('*')
        .order('period_end', { ascending: false });

      if (assetId) {
        query = query.eq('asset_id', assetId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AssetDepreciation[];
    },
  });
};

export const useCalculateDepreciation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ assetId, periodEnd }: { assetId: string; periodEnd: string }) => {
      const { data: userData } = await supabase.auth.getUser();

      // Get asset info
      const { data: asset } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();

      if (!asset) throw new Error('Asset not found');

      // Calculate depreciation
      const acquisitionValue = asset.acquisition_value || 0;
      const residualValue = asset.residual_value || 0;
      const usefulLife = asset.useful_life_years || 5;
      const accumulatedDepreciation = asset.accumulated_depreciation || 0;

      const annualDepreciation = (acquisitionValue - residualValue) / usefulLife;
      const depreciationAmount = Math.min(
        annualDepreciation,
        acquisitionValue - accumulatedDepreciation - residualValue
      );

      const newAccumulated = accumulatedDepreciation + depreciationAmount;
      const newNetBookValue = acquisitionValue - newAccumulated;

      // Insert depreciation record
      const { data, error } = await supabase
        .from('asset_depreciations')
        .insert({
          asset_id: assetId,
          period_start: asset.depreciation_start_date || asset.acquisition_date,
          period_end: periodEnd,
          depreciation_amount: depreciationAmount,
          accumulated_amount: newAccumulated,
          net_book_value: newNetBookValue,
          status: 'calculated',
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update asset
      await supabase
        .from('assets')
        .update({
          accumulated_depreciation: newAccumulated,
          net_book_value: newNetBookValue,
          current_value: newNetBookValue,
        })
        .eq('id', assetId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-depreciations'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Amortissement calculé');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });
};

// Asset Disposals hooks
export const useAssetDisposals = () => {
  return useQuery({
    queryKey: ['asset-disposals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_disposals')
        .select(`
          *,
          asset:assets(id, code, designation)
        `)
        .order('disposal_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useAssetDisposalMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (disposal: Omit<AssetDisposal, 'id' | 'created_at'>) => {
      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('asset_disposals')
        .insert({
          ...disposal,
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update asset status
      await supabase
        .from('assets')
        .update({ status: 'disposed' })
        .eq('id', disposal.asset_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-disposals'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast.success('Sortie enregistrée');
    },
    onError: (error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  return { createMutation };
};

// Stats
export const useAssetStats = () => {
  return useQuery({
    queryKey: ['asset-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('status, acquisition_value, net_book_value');

      if (error) throw error;

      const stats = {
        totalCount: data.length,
        activeCount: data.filter(a => a.status === 'active').length,
        maintenanceCount: data.filter(a => a.status === 'maintenance').length,
        disposedCount: data.filter(a => a.status === 'disposed').length,
        totalGrossValue: data.reduce((sum, a) => sum + (a.acquisition_value || 0), 0),
        totalNetBookValue: data.reduce((sum, a) => sum + (a.net_book_value || 0), 0),
      };

      return stats;
    },
  });
};
