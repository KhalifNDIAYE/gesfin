import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FinancialReportLine {
  id: string;
  financial_report_id: string;
  expense_category_id: string | null;
  line_number: number | null;
  description: string | null;
  amount: number;
  amount_local: number;
  cumulative_amount: number;
  budget_amount: number;
  variance_amount: number;
  created_at: string;
}

export const useFinancialReportLines = (reportId?: string) => {
  return useQuery({
    queryKey: ['financial-report-lines', reportId],
    queryFn: async () => {
      if (!reportId) return [];
      
      const { data, error } = await supabase
        .from('financial_report_lines')
        .select('*')
        .eq('financial_report_id', reportId)
        .order('line_number');
      
      if (error) throw error;
      return data as FinancialReportLine[];
    },
    enabled: !!reportId,
  });
};
