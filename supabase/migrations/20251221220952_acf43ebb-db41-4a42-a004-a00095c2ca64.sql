-- Create cash_operations table for cash register operations
CREATE TABLE public.cash_operations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL,
  operation_type text NOT NULL CHECK (operation_type IN ('entree', 'sortie')),
  operation_date date NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  amount_local numeric DEFAULT 0,
  currency_id uuid REFERENCES public.currencies(id),
  exchange_rate numeric DEFAULT 1,
  description text NOT NULL,
  
  -- Payment method
  payment_method text NOT NULL DEFAULT 'especes' CHECK (payment_method IN ('especes', 'cheque', 'virement', 'autre')),
  payment_method_other text,
  
  -- Accounting
  cash_account_id uuid REFERENCES public.plan_accounts(id) NOT NULL,
  counterpart_account_id uuid REFERENCES public.plan_accounts(id) NOT NULL,
  fiscal_year_id uuid REFERENCES public.fiscal_years(id) NOT NULL,
  journal_id uuid REFERENCES public.journals(id),
  journal_entry_id uuid REFERENCES public.journal_entries(id),
  
  -- Business links
  project_id uuid REFERENCES public.projects(id),
  bailleur_id uuid REFERENCES public.bailleurs(id),
  convention_id uuid REFERENCES public.conventions(id),
  budget_id uuid REFERENCES public.budgets(id),
  budget_line_id uuid REFERENCES public.budget_lines(id),
  third_party_id uuid REFERENCES public.third_parties(id),
  
  -- Status and workflow
  status text NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'valide', 'annule')),
  validated_by uuid REFERENCES public.profiles(id),
  validated_at timestamp with time zone,
  
  -- Attachments
  attachments jsonb DEFAULT '[]'::jsonb,
  
  -- Audit
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_cash_operation_code UNIQUE (code)
);

-- Enable RLS
ALTER TABLE public.cash_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view cash operations"
ON public.cash_operations
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can create cash operations"
ON public.cash_operations
FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'comptabilite'::module_name, 'create'::permission_type));

CREATE POLICY "Users with comptabilite permission can update draft cash operations"
ON public.cash_operations
FOR UPDATE
USING (has_permission(auth.uid(), 'comptabilite'::module_name, 'update'::permission_type) AND status = 'brouillon');

CREATE POLICY "Users with comptabilite delete permission can delete draft cash operations"
ON public.cash_operations
FOR DELETE
USING (has_permission(auth.uid(), 'comptabilite'::module_name, 'delete'::permission_type) AND status = 'brouillon');

-- Create function to generate cash operation code
CREATE OR REPLACE FUNCTION public.generate_cash_operation_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year text;
  next_seq integer;
  new_code text;
BEGIN
  current_year := to_char(now(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(code FROM 'OPR-' || current_year || '-(\d+)') AS integer)
  ), 0) + 1
  INTO next_seq
  FROM cash_operations
  WHERE code LIKE 'OPR-' || current_year || '-%';
  
  new_code := 'OPR-' || current_year || '-' || LPAD(next_seq::text, 4, '0');
  
  RETURN new_code;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_cash_operations_updated_at
  BEFORE UPDATE ON public.cash_operations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_cash_operations_fiscal_year ON public.cash_operations(fiscal_year_id);
CREATE INDEX idx_cash_operations_operation_date ON public.cash_operations(operation_date);
CREATE INDEX idx_cash_operations_status ON public.cash_operations(status);
CREATE INDEX idx_cash_operations_project ON public.cash_operations(project_id);
CREATE INDEX idx_cash_operations_convention ON public.cash_operations(convention_id);

-- Add permissions for cash operations to permissions table
INSERT INTO public.permissions (module, permission, description)
VALUES 
  ('comptabilite', 'validate', 'Peut valider les opérations de caisse')
ON CONFLICT DO NOTHING;