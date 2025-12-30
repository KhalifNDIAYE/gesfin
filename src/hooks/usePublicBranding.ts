import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PublicBranding {
  name: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  updated_at: string | null;
}

/**
 * Fetches public branding info (name, logo, favicon) without authentication.
 * Uses the get_public_branding() RPC function which is accessible to anon users.
 */
export const usePublicBranding = () => {
  return useQuery({
    queryKey: ['public-branding'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_branding');
      if (error) throw error;
      return data as unknown as PublicBranding | null;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
};
