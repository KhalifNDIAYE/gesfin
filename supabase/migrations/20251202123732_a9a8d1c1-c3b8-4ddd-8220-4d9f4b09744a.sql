-- Table des bailleurs (donateurs/financeurs)
CREATE TABLE public.bailleurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT,
  bailleur_type TEXT NOT NULL DEFAULT 'bilateral', -- bilateral, multilateral, ong, prive
  country_id UUID REFERENCES public.countries(id),
  address TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des conventions de financement
CREATE TABLE public.conventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  bailleur_id UUID NOT NULL REFERENCES public.bailleurs(id) ON DELETE RESTRICT,
  currency_id UUID NOT NULL REFERENCES public.currencies(id),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount_local NUMERIC DEFAULT 0,
  exchange_rate NUMERIC DEFAULT 1,
  signing_date DATE,
  effective_date DATE,
  closing_date DATE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, active, suspended, closed
  convention_type TEXT DEFAULT 'grant', -- grant, loan, mixed
  description TEXT,
  objectives TEXT,
  special_conditions TEXT,
  disbursed_amount NUMERIC DEFAULT 0,
  disbursed_amount_local NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  remaining_amount_local NUMERIC DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des catégories de dépenses
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.expense_categories(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table de liaison conventions - catégories de dépenses (avec budget par catégorie)
CREATE TABLE public.convention_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  convention_id UUID NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
  expense_category_id UUID NOT NULL REFERENCES public.expense_categories(id) ON DELETE RESTRICT,
  budget_amount NUMERIC DEFAULT 0,
  budget_amount_local NUMERIC DEFAULT 0,
  committed_amount NUMERIC DEFAULT 0,
  disbursed_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(convention_id, expense_category_id)
);

-- Table des réapprovisionnements
CREATE TABLE public.replenishments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  convention_id UUID NOT NULL REFERENCES public.conventions(id) ON DELETE RESTRICT,
  request_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  amount_local NUMERIC,
  exchange_rate NUMERIC DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, submitted, approved, received
  submitted_date DATE,
  approved_date DATE,
  received_date DATE,
  bank_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des paiements directs
CREATE TABLE public.direct_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  convention_id UUID NOT NULL REFERENCES public.conventions(id) ON DELETE RESTRICT,
  expense_category_id UUID REFERENCES public.expense_categories(id),
  beneficiary_name TEXT NOT NULL,
  beneficiary_account TEXT,
  amount NUMERIC NOT NULL,
  amount_local NUMERIC,
  exchange_rate NUMERIC DEFAULT 1,
  request_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, submitted, approved, paid, rejected
  description TEXT,
  invoice_reference TEXT,
  contract_reference TEXT,
  bank_reference TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des rapports financiers (IFR, RSF, SOE)
CREATE TABLE public.financial_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  convention_id UUID NOT NULL REFERENCES public.conventions(id) ON DELETE RESTRICT,
  report_type TEXT NOT NULL, -- ifr, rsf, soe
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, submitted, approved, rejected
  total_expenses NUMERIC DEFAULT 0,
  total_expenses_local NUMERIC DEFAULT 0,
  opening_balance NUMERIC DEFAULT 0,
  closing_balance NUMERIC DEFAULT 0,
  replenishment_requested NUMERIC DEFAULT 0,
  submission_date DATE,
  approval_date DATE,
  notes TEXT,
  report_data JSONB,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des lignes de rapport financier
CREATE TABLE public.financial_report_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  financial_report_id UUID NOT NULL REFERENCES public.financial_reports(id) ON DELETE CASCADE,
  expense_category_id UUID REFERENCES public.expense_categories(id),
  description TEXT,
  amount NUMERIC DEFAULT 0,
  amount_local NUMERIC DEFAULT 0,
  cumulative_amount NUMERIC DEFAULT 0,
  budget_amount NUMERIC DEFAULT 0,
  variance_amount NUMERIC DEFAULT 0,
  line_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bailleurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convention_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replenishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_report_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bailleurs
CREATE POLICY "Authenticated users can view bailleurs" ON public.bailleurs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with bailleurs permission can manage bailleurs" ON public.bailleurs FOR ALL USING (has_permission(auth.uid(), 'bailleurs'::module_name, 'create'::permission_type));

-- RLS Policies for conventions
CREATE POLICY "Authenticated users can view conventions" ON public.conventions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with conventions permission can manage conventions" ON public.conventions FOR ALL USING (has_permission(auth.uid(), 'conventions'::module_name, 'create'::permission_type));

-- RLS Policies for expense_categories
CREATE POLICY "Authenticated users can view expense categories" ON public.expense_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage expense categories" ON public.expense_categories FOR ALL USING (is_admin(auth.uid()));

-- RLS Policies for convention_categories
CREATE POLICY "Authenticated users can view convention categories" ON public.convention_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with conventions permission can manage convention categories" ON public.convention_categories FOR ALL USING (has_permission(auth.uid(), 'conventions'::module_name, 'create'::permission_type));

-- RLS Policies for replenishments
CREATE POLICY "Authenticated users can view replenishments" ON public.replenishments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with conventions permission can manage replenishments" ON public.replenishments FOR ALL USING (has_permission(auth.uid(), 'conventions'::module_name, 'create'::permission_type));

-- RLS Policies for direct_payments
CREATE POLICY "Authenticated users can view direct payments" ON public.direct_payments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with conventions permission can manage direct payments" ON public.direct_payments FOR ALL USING (has_permission(auth.uid(), 'conventions'::module_name, 'create'::permission_type));

-- RLS Policies for financial_reports
CREATE POLICY "Authenticated users can view financial reports" ON public.financial_reports FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with conventions permission can manage financial reports" ON public.financial_reports FOR ALL USING (has_permission(auth.uid(), 'conventions'::module_name, 'create'::permission_type));

-- RLS Policies for financial_report_lines
CREATE POLICY "Authenticated users can view financial report lines" ON public.financial_report_lines FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with conventions permission can manage financial report lines" ON public.financial_report_lines FOR ALL USING (has_permission(auth.uid(), 'conventions'::module_name, 'create'::permission_type));

-- Triggers for updated_at
CREATE TRIGGER update_bailleurs_updated_at BEFORE UPDATE ON public.bailleurs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_conventions_updated_at BEFORE UPDATE ON public.conventions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_convention_categories_updated_at BEFORE UPDATE ON public.convention_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_replenishments_updated_at BEFORE UPDATE ON public.replenishments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_direct_payments_updated_at BEFORE UPDATE ON public.direct_payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_financial_reports_updated_at BEFORE UPDATE ON public.financial_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update convention amounts
CREATE OR REPLACE FUNCTION public.update_convention_amounts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.conventions
    SET 
      disbursed_amount = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM public.replenishments 
        WHERE convention_id = NEW.convention_id AND status = 'received'
      ) + (
        SELECT COALESCE(SUM(amount), 0) 
        FROM public.direct_payments 
        WHERE convention_id = NEW.convention_id AND status = 'paid'
      ),
      remaining_amount = total_amount - disbursed_amount
    WHERE id = NEW.convention_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.conventions
    SET 
      disbursed_amount = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM public.replenishments 
        WHERE convention_id = OLD.convention_id AND status = 'received'
      ) + (
        SELECT COALESCE(SUM(amount), 0) 
        FROM public.direct_payments 
        WHERE convention_id = OLD.convention_id AND status = 'paid'
      ),
      remaining_amount = total_amount - disbursed_amount
    WHERE id = OLD.convention_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_convention_on_replenishment AFTER INSERT OR UPDATE OR DELETE ON public.replenishments FOR EACH ROW EXECUTE FUNCTION update_convention_amounts();
CREATE TRIGGER update_convention_on_direct_payment AFTER INSERT OR UPDATE OR DELETE ON public.direct_payments FOR EACH ROW EXECUTE FUNCTION update_convention_amounts();