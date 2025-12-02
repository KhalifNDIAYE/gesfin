
-- Create contracts/marchés table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  object TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'works', -- works, supplies, services, studies
  status TEXT NOT NULL DEFAULT 'draft', -- draft, in_progress, completed, suspended, terminated, disputed
  supplier_id UUID REFERENCES public.third_parties(id),
  supplier_name TEXT,
  project_id UUID,
  convention_id UUID REFERENCES public.conventions(id),
  budget_line_id UUID REFERENCES public.budget_lines(id),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount_local NUMERIC DEFAULT 0,
  currency_id UUID REFERENCES public.currencies(id),
  exchange_rate NUMERIC DEFAULT 1,
  engaged_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  progress_percentage NUMERIC DEFAULT 0,
  signing_date DATE,
  start_date DATE,
  end_date DATE,
  actual_end_date DATE,
  warranty_end_date DATE,
  description TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create decomptes (progress payments/invoices) table
CREATE TABLE public.contract_decomptes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  decompte_number INTEGER NOT NULL,
  decompte_type TEXT NOT NULL DEFAULT 'progress', -- progress, partial, final, retention
  amount NUMERIC NOT NULL DEFAULT 0,
  amount_local NUMERIC DEFAULT 0,
  cumulative_amount NUMERIC DEFAULT 0,
  previous_amount NUMERIC DEFAULT 0,
  deduction_amount NUMERIC DEFAULT 0,
  net_amount NUMERIC DEFAULT 0,
  progress_percentage NUMERIC DEFAULT 0,
  submission_date DATE NOT NULL,
  approval_date DATE,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'submitted', -- submitted, approved, paid, rejected
  description TEXT,
  notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create reglements (payments) table
CREATE TABLE public.contract_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  decompte_id UUID REFERENCES public.contract_decomptes(id),
  code TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  amount_local NUMERIC DEFAULT 0,
  payment_date DATE NOT NULL,
  payment_method TEXT DEFAULT 'transfer', -- transfer, check, cash
  bank_reference TEXT,
  beneficiary_name TEXT,
  beneficiary_account TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processed, cancelled
  description TEXT,
  notes TEXT,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create garanties (guarantees/bonds) table
CREATE TABLE public.contract_guarantees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  guarantee_type TEXT NOT NULL DEFAULT 'performance', -- bid, performance, advance, retention
  amount NUMERIC NOT NULL DEFAULT 0,
  amount_local NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  issuer_name TEXT, -- bank or insurance company
  reference_number TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  release_date DATE,
  status TEXT NOT NULL DEFAULT 'active', -- active, released, called, expired
  description TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create engagements table for commitment tracking
CREATE TABLE public.contract_engagements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  engagement_type TEXT NOT NULL DEFAULT 'initial', -- initial, amendment, reduction
  amount NUMERIC NOT NULL DEFAULT 0,
  amount_local NUMERIC DEFAULT 0,
  engagement_date DATE NOT NULL,
  fiscal_year_id UUID REFERENCES public.fiscal_years(id),
  budget_line_id UUID REFERENCES public.budget_lines(id),
  description TEXT,
  reference TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, consumed, cancelled
  consumed_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_decomptes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_guarantees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_engagements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contracts
CREATE POLICY "Authenticated users can view contracts" ON public.contracts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with marches permission can manage contracts" ON public.contracts FOR ALL USING (has_permission(auth.uid(), 'marches'::module_name, 'create'::permission_type));

-- RLS Policies for contract_decomptes
CREATE POLICY "Authenticated users can view decomptes" ON public.contract_decomptes FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with marches permission can manage decomptes" ON public.contract_decomptes FOR ALL USING (has_permission(auth.uid(), 'marches'::module_name, 'create'::permission_type));

-- RLS Policies for contract_payments
CREATE POLICY "Authenticated users can view contract payments" ON public.contract_payments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with marches permission can manage contract payments" ON public.contract_payments FOR ALL USING (has_permission(auth.uid(), 'marches'::module_name, 'create'::permission_type));

-- RLS Policies for contract_guarantees
CREATE POLICY "Authenticated users can view guarantees" ON public.contract_guarantees FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with marches permission can manage guarantees" ON public.contract_guarantees FOR ALL USING (has_permission(auth.uid(), 'marches'::module_name, 'create'::permission_type));

-- RLS Policies for contract_engagements
CREATE POLICY "Authenticated users can view engagements" ON public.contract_engagements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with marches permission can manage engagements" ON public.contract_engagements FOR ALL USING (has_permission(auth.uid(), 'marches'::module_name, 'create'::permission_type));

-- Create triggers for updated_at
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contract_decomptes_updated_at BEFORE UPDATE ON public.contract_decomptes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contract_payments_updated_at BEFORE UPDATE ON public.contract_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contract_guarantees_updated_at BEFORE UPDATE ON public.contract_guarantees FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_contract_engagements_updated_at BEFORE UPDATE ON public.contract_engagements FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update contract amounts
CREATE OR REPLACE FUNCTION public.update_contract_amounts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.contracts
    SET 
      engaged_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.contract_engagements WHERE contract_id = NEW.contract_id AND status = 'active'),
      paid_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.contract_payments WHERE contract_id = NEW.contract_id AND status = 'processed'),
      remaining_amount = total_amount - paid_amount
    WHERE id = NEW.contract_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.contracts
    SET 
      engaged_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.contract_engagements WHERE contract_id = OLD.contract_id AND status = 'active'),
      paid_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.contract_payments WHERE contract_id = OLD.contract_id AND status = 'processed'),
      remaining_amount = total_amount - paid_amount
    WHERE id = OLD.contract_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers to update contract amounts
CREATE TRIGGER update_contract_amounts_on_engagement AFTER INSERT OR UPDATE OR DELETE ON public.contract_engagements FOR EACH ROW EXECUTE FUNCTION update_contract_amounts();
CREATE TRIGGER update_contract_amounts_on_payment AFTER INSERT OR UPDATE OR DELETE ON public.contract_payments FOR EACH ROW EXECUTE FUNCTION update_contract_amounts();
