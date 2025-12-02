import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReportingStats {
  totalExports: number;
  pendingReports: number;
  currentPeriod: string;
  lastBilanDate: string | null;
}

export interface AccountBalance {
  id: string;
  code: string;
  name: string;
  debit: number;
  credit: number;
  balance: number;
  accountType: string;
}

export interface FinancialRatio {
  name: string;
  value: number;
  description: string;
  category: string;
  trend?: 'up' | 'down' | 'stable';
}

// Get reporting statistics
export const useReportingStats = () => {
  return useQuery({
    queryKey: ['reporting-stats'],
    queryFn: async () => {
      const currentDate = new Date();
      const currentMonth = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      
      // Get current fiscal year
      const { data: fiscalYear } = await supabase
        .from('fiscal_years')
        .select('*')
        .eq('is_current', true)
        .single();

      // Count financial reports
      const { count: reportsCount } = await supabase
        .from('financial_reports')
        .select('*', { count: 'exact', head: true });

      // Count pending reports
      const { count: pendingCount } = await supabase
        .from('financial_reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      return {
        totalExports: reportsCount || 0,
        pendingReports: pendingCount || 0,
        currentPeriod: fiscalYear?.name || currentMonth,
        lastBilanDate: fiscalYear?.end_date || null,
      } as ReportingStats;
    },
  });
};

// Get account balances for financial statements
export const useAccountBalances = (fiscalYearId?: string) => {
  return useQuery({
    queryKey: ['account-balances', fiscalYearId],
    queryFn: async () => {
      let query = supabase
        .from('journal_entry_lines')
        .select(`
          account_id,
          debit_amount,
          credit_amount,
          journal_entries!inner (
            fiscal_year_id,
            status
          ),
          plan_accounts!inner (
            id,
            code,
            name,
            account_type
          )
        `)
        .eq('journal_entries.status', 'valide');

      if (fiscalYearId) {
        query = query.eq('journal_entries.fiscal_year_id', fiscalYearId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by account
      const accountMap = new Map<string, AccountBalance>();
      
      data?.forEach((line: any) => {
        const account = line.plan_accounts;
        const existing = accountMap.get(account.id);
        
        if (existing) {
          existing.debit += Number(line.debit_amount) || 0;
          existing.credit += Number(line.credit_amount) || 0;
          existing.balance = existing.debit - existing.credit;
        } else {
          accountMap.set(account.id, {
            id: account.id,
            code: account.code,
            name: account.name,
            debit: Number(line.debit_amount) || 0,
            credit: Number(line.credit_amount) || 0,
            balance: (Number(line.debit_amount) || 0) - (Number(line.credit_amount) || 0),
            accountType: account.account_type,
          });
        }
      });

      return Array.from(accountMap.values()).sort((a, b) => a.code.localeCompare(b.code));
    },
    enabled: true,
  });
};

// Get balance sheet data (Bilan)
export const useBilanData = (fiscalYearId?: string) => {
  return useQuery({
    queryKey: ['bilan-data', fiscalYearId],
    queryFn: async () => {
      const { data: balances } = await supabase
        .from('journal_entry_lines')
        .select(`
          debit_amount,
          credit_amount,
          plan_accounts!inner (
            code,
            name,
            account_type
          )
        `);

      // Classify accounts for balance sheet
      const actif: { immobilise: number; circulant: number; tresorerie: number } = {
        immobilise: 0,
        circulant: 0,
        tresorerie: 0,
      };
      
      const passif: { capitaux: number; dettes: number; provisions: number } = {
        capitaux: 0,
        dettes: 0,
        provisions: 0,
      };

      balances?.forEach((line: any) => {
        const code = line.plan_accounts.code;
        const balance = (Number(line.debit_amount) || 0) - (Number(line.credit_amount) || 0);
        
        // Actif classes (2x, 3x, 4x debit, 5x)
        if (code.startsWith('2')) actif.immobilise += balance;
        else if (code.startsWith('3')) actif.circulant += balance;
        else if (code.startsWith('5')) actif.tresorerie += balance;
        else if (code.startsWith('4') && balance > 0) actif.circulant += balance;
        
        // Passif classes (1x, 4x credit)
        if (code.startsWith('1')) passif.capitaux -= balance;
        else if (code.startsWith('4') && balance < 0) passif.dettes -= balance;
        else if (code.startsWith('15')) passif.provisions -= balance;
      });

      return {
        actif,
        passif,
        totalActif: actif.immobilise + actif.circulant + actif.tresorerie,
        totalPassif: passif.capitaux + passif.dettes + passif.provisions,
      };
    },
  });
};

// Get income statement data (Compte de résultat)
export const useResultatData = (fiscalYearId?: string) => {
  return useQuery({
    queryKey: ['resultat-data', fiscalYearId],
    queryFn: async () => {
      const { data: balances } = await supabase
        .from('journal_entry_lines')
        .select(`
          debit_amount,
          credit_amount,
          plan_accounts!inner (
            code,
            name,
            account_type
          )
        `);

      let produits = { exploitation: 0, financiers: 0, exceptionnels: 0 };
      let charges = { exploitation: 0, financieres: 0, exceptionnelles: 0 };

      balances?.forEach((line: any) => {
        const code = line.plan_accounts.code;
        const debit = Number(line.debit_amount) || 0;
        const credit = Number(line.credit_amount) || 0;
        
        // Charges (6x)
        if (code.startsWith('60') || code.startsWith('61') || code.startsWith('62') || 
            code.startsWith('63') || code.startsWith('64') || code.startsWith('65')) {
          charges.exploitation += debit - credit;
        } else if (code.startsWith('66')) {
          charges.financieres += debit - credit;
        } else if (code.startsWith('67') || code.startsWith('68') || code.startsWith('69')) {
          charges.exceptionnelles += debit - credit;
        }
        
        // Produits (7x)
        if (code.startsWith('70') || code.startsWith('71') || code.startsWith('72') || 
            code.startsWith('73') || code.startsWith('74') || code.startsWith('75')) {
          produits.exploitation += credit - debit;
        } else if (code.startsWith('76')) {
          produits.financiers += credit - debit;
        } else if (code.startsWith('77') || code.startsWith('78') || code.startsWith('79')) {
          produits.exceptionnels += credit - debit;
        }
      });

      const totalProduits = produits.exploitation + produits.financiers + produits.exceptionnels;
      const totalCharges = charges.exploitation + charges.financieres + charges.exceptionnelles;

      return {
        produits,
        charges,
        totalProduits,
        totalCharges,
        resultatExploitation: produits.exploitation - charges.exploitation,
        resultatFinancier: produits.financiers - charges.financieres,
        resultatExceptionnel: produits.exceptionnels - charges.exceptionnelles,
        resultatNet: totalProduits - totalCharges,
      };
    },
  });
};

// Get financial ratios
export const useFinancialRatios = (fiscalYearId?: string) => {
  const { data: bilanData } = useBilanData(fiscalYearId);
  const { data: resultatData } = useResultatData(fiscalYearId);

  return useQuery({
    queryKey: ['financial-ratios', fiscalYearId, bilanData, resultatData],
    queryFn: async () => {
      if (!bilanData || !resultatData) return [];

      const ratios: FinancialRatio[] = [
        {
          name: 'Ratio de liquidité générale',
          value: bilanData.actif.circulant > 0 ? 
            (bilanData.actif.circulant + bilanData.actif.tresorerie) / (bilanData.passif.dettes || 1) : 0,
          description: 'Capacité à couvrir les dettes à court terme',
          category: 'Liquidité',
          trend: 'stable',
        },
        {
          name: 'Ratio de solvabilité',
          value: bilanData.totalActif > 0 ? 
            bilanData.passif.capitaux / bilanData.totalActif * 100 : 0,
          description: 'Part des capitaux propres dans le total bilan',
          category: 'Solvabilité',
          trend: 'up',
        },
        {
          name: 'Ratio d\'endettement',
          value: bilanData.passif.capitaux > 0 ? 
            bilanData.passif.dettes / bilanData.passif.capitaux * 100 : 0,
          description: 'Niveau d\'endettement par rapport aux capitaux',
          category: 'Endettement',
          trend: 'down',
        },
        {
          name: 'Marge nette',
          value: resultatData.totalProduits > 0 ? 
            resultatData.resultatNet / resultatData.totalProduits * 100 : 0,
          description: 'Rentabilité nette des activités',
          category: 'Rentabilité',
          trend: 'up',
        },
        {
          name: 'Marge d\'exploitation',
          value: resultatData.produits.exploitation > 0 ? 
            resultatData.resultatExploitation / resultatData.produits.exploitation * 100 : 0,
          description: 'Rentabilité de l\'exploitation',
          category: 'Rentabilité',
          trend: 'stable',
        },
        {
          name: 'Trésorerie nette',
          value: bilanData.actif.tresorerie,
          description: 'Disponibilités immédiates',
          category: 'Trésorerie',
          trend: 'up',
        },
      ];

      return ratios;
    },
    enabled: !!bilanData && !!resultatData,
  });
};

// Get cash flow data (Tableau de financement)
export const useCashFlowData = (fiscalYearId?: string) => {
  return useQuery({
    queryKey: ['cash-flow-data', fiscalYearId],
    queryFn: async () => {
      // Get budget movements for cash flow analysis
      const { data: movements } = await supabase
        .from('budget_movements')
        .select('*')
        .order('movement_date', { ascending: true });

      // Get replenishments and direct payments
      const { data: replenishments } = await supabase
        .from('replenishments')
        .select('*')
        .eq('status', 'received');

      const { data: payments } = await supabase
        .from('direct_payments')
        .select('*')
        .eq('status', 'paid');

      const totalReplenishments = replenishments?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      const totalPayments = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      return {
        ressources: {
          apportsInitiaux: totalReplenishments,
          subventions: 0,
          emprunts: 0,
        },
        emplois: {
          investissements: 0,
          remboursements: 0,
          decaissements: totalPayments,
        },
        variationTresorerie: totalReplenishments - totalPayments,
      };
    },
  });
};
