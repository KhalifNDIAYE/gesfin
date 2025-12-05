import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export type JournalType = 'achats' | 'ventes' | 'banque' | 'caisse' | 'operations_diverses' | 'a_nouveaux';
export type EntryType = 'depense' | 'financement' | 'decaissement' | 'prise_en_charge' | 'autre';
export type EntryStatus = 'brouillon' | 'valide' | 'cloture';
export type ThirdPartyType = 'fournisseur' | 'client' | 'employe' | 'bailleur' | 'autre';

export interface Journal {
  id: string;
  code: string;
  name: string;
  journal_type: JournalType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThirdParty {
  id: string;
  code: string;
  name: string;
  third_party_type: ThirdPartyType;
  account_code: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  journal_id: string;
  fiscal_year_id: string;
  entry_type: EntryType;
  description: string;
  reference: string | null;
  currency_id: string;
  exchange_rate: number;
  status: EntryStatus;
  third_party_id: string | null;
  created_by: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
  // Workflow fields
  expense_workflow_status?: string;
  project_id?: string | null;
  budget_line_id?: string | null;
  requested_amount?: number;
  rejection_reason?: string | null;
  rejected_by?: string | null;
  rejected_at?: string | null;
  daf_validated_by?: string | null;
  daf_validated_at?: string | null;
  dt_validated_by?: string | null;
  dt_validated_at?: string | null;
  dg_validated_by?: string | null;
  dg_validated_at?: string | null;
  paid_by?: string | null;
  paid_at?: string | null;
  attachment_url?: string | null;
  // Relations
  journal?: Partial<Journal>;
  fiscal_year?: { id: string; name: string };
  currency?: { id: string; code: string; symbol: string };
  third_party?: Partial<ThirdParty>;
  lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  line_number: number;
  account_id: string;
  description: string | null;
  debit_amount: number;
  credit_amount: number;
  debit_amount_currency: number;
  credit_amount_currency: number;
  third_party_id: string | null;
  tracking_axis_id: string | null;
  lettering_code: string | null;
  is_lettered: boolean;
  created_at: string;
  updated_at: string;
  account?: { id: string; code: string; name: string };
  third_party?: ThirdParty;
  tracking_axis?: { id: string; code: string; name: string };
}

// Journals Hook
export const useJournals = () => {
  return useQuery({
    queryKey: ['journals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .order('code');

      if (error) throw error;
      return data as Journal[];
    },
  });
};

// Third Parties Hook
export const useThirdParties = (type?: ThirdPartyType) => {
  return useQuery({
    queryKey: ['third-parties', type],
    queryFn: async () => {
      let query = supabase
        .from('third_parties')
        .select('*')
        .order('name');

      if (type) {
        query = query.eq('third_party_type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ThirdParty[];
    },
  });
};

export const useThirdPartyMutations = () => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: Omit<ThirdParty, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: result, error } = await supabase
        .from('third_parties')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-parties'] });
      toast({ title: 'Tiers créé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<ThirdParty> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('third_parties')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-parties'] });
      toast({ title: 'Tiers mis à jour avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('third_parties')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['third-parties'] });
      toast({ title: 'Tiers supprimé avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return { createMutation, updateMutation, deleteMutation };
};

// Journal Entries Hook
export const useJournalEntries = (filters?: {
  fiscalYearId?: string;
  journalId?: string;
  entryType?: EntryType;
  status?: EntryStatus;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['journal-entries', filters],
    queryFn: async () => {
      let query = supabase
        .from('journal_entries')
        .select(`
          *,
          journal:journals(id, code, name, journal_type),
          fiscal_year:fiscal_years(id, name),
          currency:currencies(id, code, symbol),
          third_party:third_parties(id, code, name)
        `)
        .order('entry_date', { ascending: false })
        .order('entry_number', { ascending: false });

      if (filters?.fiscalYearId) {
        query = query.eq('fiscal_year_id', filters.fiscalYearId);
      }
      if (filters?.journalId) {
        query = query.eq('journal_id', filters.journalId);
      }
      if (filters?.entryType) {
        query = query.eq('entry_type', filters.entryType);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('entry_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('entry_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as JournalEntry[];
    },
  });
};

export const useJournalEntryWithLines = (entryId: string | null) => {
  return useQuery({
    queryKey: ['journal-entry', entryId],
    queryFn: async () => {
      if (!entryId) return null;

      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal:journals(id, code, name, journal_type),
          fiscal_year:fiscal_years(id, name),
          currency:currencies(id, code, symbol),
          third_party:third_parties(id, code, name)
        `)
        .eq('id', entryId)
        .single();

      if (entryError) throw entryError;

      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_lines')
        .select(`
          *,
          account:plan_accounts(id, code, name),
          third_party:third_parties(id, code, name),
          tracking_axis:tracking_axes(id, code, name)
        `)
        .eq('journal_entry_id', entryId)
        .order('line_number');

      if (linesError) throw linesError;

      return { ...entry, lines } as JournalEntry;
    },
    enabled: !!entryId,
  });
};

export const useJournalEntryMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createMutation = useMutation({
    mutationFn: async ({
      entry,
      lines,
    }: {
      entry: Omit<JournalEntry, 'id' | 'entry_number' | 'created_at' | 'updated_at' | 'journal' | 'fiscal_year' | 'currency' | 'third_party' | 'lines'>;
      lines: Omit<JournalEntryLine, 'id' | 'journal_entry_id' | 'created_at' | 'updated_at' | 'account' | 'third_party' | 'tracking_axis'>[];
    }) => {
      // Get journal code for entry number generation
      const { data: journal } = await supabase
        .from('journals')
        .select('code')
        .eq('id', entry.journal_id)
        .single();

      if (!journal) throw new Error('Journal non trouvé');

      // Generate entry number
      const { data: entryNumber } = await supabase.rpc('generate_entry_number', {
        _journal_code: journal.code,
        _fiscal_year_id: entry.fiscal_year_id,
      });

      // Create entry
      const { data: newEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          ...entry,
          entry_number: entryNumber,
          created_by: user?.id,
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Create lines
      const linesToInsert = lines.map((line, index) => ({
        ...line,
        journal_entry_id: newEntry.id,
        line_number: index + 1,
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(linesToInsert);

      if (linesError) {
        // Rollback entry if lines fail
        await supabase.from('journal_entries').delete().eq('id', newEntry.id);
        throw linesError;
      }

      return newEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast({ title: 'Écriture créée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      entryId,
      entry,
      lines,
    }: {
      entryId: string;
      entry: Partial<JournalEntry>;
      lines?: Omit<JournalEntryLine, 'id' | 'journal_entry_id' | 'created_at' | 'updated_at' | 'account' | 'third_party' | 'tracking_axis'>[];
    }) => {
      // Update entry
      const { error: entryError } = await supabase
        .from('journal_entries')
        .update(entry)
        .eq('id', entryId);

      if (entryError) throw entryError;

      // Update lines if provided
      if (lines) {
        // Delete existing lines
        await supabase
          .from('journal_entry_lines')
          .delete()
          .eq('journal_entry_id', entryId);

        // Insert new lines
        const linesToInsert = lines.map((line, index) => ({
          ...line,
          journal_entry_id: entryId,
          line_number: index + 1,
        }));

        const { error: linesError } = await supabase
          .from('journal_entry_lines')
          .insert(linesToInsert);

        if (linesError) throw linesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entry'] });
      toast({ title: 'Écriture mise à jour avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('journal_entries')
        .update({
          status: 'valide',
          validated_by: user?.id,
          validated_at: new Date().toISOString(),
        })
        .eq('id', entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entry'] });
      toast({ title: 'Écriture validée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast({ title: 'Écriture supprimée avec succès' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    },
  });

  return { createMutation, updateMutation, validateMutation, deleteMutation };
};
