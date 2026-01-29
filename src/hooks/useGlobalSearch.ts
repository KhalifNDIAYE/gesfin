import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';

export interface SearchResult {
  id: string;
  type: 'project' | 'convention' | 'contract' | 'bailleur';
  title: string;
  subtitle: string;
  code?: string;
  status?: string;
  link: string;
}

export interface SearchResults {
  projects: SearchResult[];
  conventions: SearchResult[];
  contracts: SearchResult[];
  bailleurs: SearchResult[];
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  active: 'Actif',
  suspended: 'Suspendu',
  pending: 'En attente',
  completed: 'Terminé',
  closed: 'Clôturé',
  in_progress: 'En cours',
  signed: 'Signé',
  terminated: 'Résilié',
};

export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const { canAccess, isLoading: permissionsLoading } = usePermissions();

  const canSearchProjects = canAccess('projets', 'read');
  const canSearchConventions = canAccess('conventions', 'read');
  const canSearchContracts = canAccess('marches', 'read');
  const canSearchBailleurs = canAccess('bailleurs', 'read');

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async (): Promise<SearchResults> => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        return { projects: [], conventions: [], contracts: [], bailleurs: [] };
      }

      const searchTerm = `%${debouncedQuery}%`;
      const searchResults: SearchResults = {
        projects: [],
        conventions: [],
        contracts: [],
        bailleurs: [],
      };

      // Search projects (if permission)
      if (canSearchProjects) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id, code, name, status')
          .or(`code.ilike.${searchTerm},name.ilike.${searchTerm}`)
          .limit(5);

        if (projects) {
          searchResults.projects = projects.map((p) => ({
            id: p.id,
            type: 'project' as const,
            title: p.name,
            subtitle: p.code,
            code: p.code,
            status: STATUS_LABELS[p.status] || p.status,
            link: `/projets/${p.id}`,
          }));
        }
      }

      // Search conventions (if permission)
      if (canSearchConventions) {
        const { data: conventions } = await supabase
          .from('conventions')
          .select('id, code, name, status')
          .or(`code.ilike.${searchTerm},name.ilike.${searchTerm}`)
          .limit(5);

        if (conventions) {
          searchResults.conventions = conventions.map((c) => ({
            id: c.id,
            type: 'convention' as const,
            title: c.name,
            subtitle: c.code,
            code: c.code,
            status: STATUS_LABELS[c.status] || c.status,
            link: `/conventions/${c.id}`,
          }));
        }
      }

      // Search contracts (if permission)
      if (canSearchContracts) {
        const { data: contracts } = await supabase
          .from('contracts')
          .select('id, code, object, status')
          .or(`code.ilike.${searchTerm},object.ilike.${searchTerm}`)
          .limit(5);

        if (contracts) {
          searchResults.contracts = contracts.map((c) => ({
            id: c.id,
            type: 'contract' as const,
            title: c.object,
            subtitle: c.code,
            code: c.code,
            status: STATUS_LABELS[c.status] || c.status,
            link: `/marches/${c.id}`,
          }));
        }
      }

      // Search bailleurs (if permission)
      if (canSearchBailleurs) {
        const { data: bailleurs } = await supabase
          .from('bailleurs')
          .select('id, code, name, short_name')
          .or(`code.ilike.${searchTerm},name.ilike.${searchTerm},short_name.ilike.${searchTerm}`)
          .limit(5);

        if (bailleurs) {
          searchResults.bailleurs = bailleurs.map((b) => ({
            id: b.id,
            type: 'bailleur' as const,
            title: b.name,
            subtitle: b.short_name || b.code,
            code: b.code,
            link: `/bailleurs/${b.id}`,
          }));
        }
      }

      return searchResults;
    },
    enabled: debouncedQuery.length >= 2 && !permissionsLoading,
    staleTime: 30000,
  });

  const totalResults = useMemo(() => {
    if (!results) return 0;
    return (
      results.projects.length +
      results.conventions.length +
      results.contracts.length +
      results.bailleurs.length
    );
  }, [results]);

  const hasResults = totalResults > 0;
  const isSearching = query.length >= 2 && isLoading;

  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    results: results || { projects: [], conventions: [], contracts: [], bailleurs: [] },
    isLoading: isSearching,
    error,
    hasResults,
    totalResults,
    clearSearch,
    canSearch: {
      projects: canSearchProjects,
      conventions: canSearchConventions,
      contracts: canSearchContracts,
      bailleurs: canSearchBailleurs,
    },
  };
}
