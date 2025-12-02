
-- Table des catégories d'immobilisations
CREATE TABLE public.asset_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  depreciation_rate NUMERIC DEFAULT 0,
  depreciation_method TEXT DEFAULT 'linear',
  useful_life_years INTEGER DEFAULT 5,
  account_id UUID REFERENCES public.plan_accounts(id),
  depreciation_account_id UUID REFERENCES public.plan_accounts(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table principale des immobilisations
CREATE TABLE public.assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  designation TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.asset_categories(id),
  acquisition_date DATE NOT NULL,
  acquisition_value NUMERIC NOT NULL DEFAULT 0,
  residual_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  accumulated_depreciation NUMERIC DEFAULT 0,
  net_book_value NUMERIC DEFAULT 0,
  depreciation_start_date DATE,
  useful_life_years INTEGER,
  depreciation_rate NUMERIC,
  depreciation_method TEXT DEFAULT 'linear',
  status TEXT NOT NULL DEFAULT 'active',
  location_id UUID REFERENCES public.locations(id),
  site_id UUID REFERENCES public.sites(id),
  assigned_to UUID REFERENCES public.profiles(id),
  project_id UUID,
  convention_id UUID REFERENCES public.conventions(id),
  supplier_id UUID REFERENCES public.third_parties(id),
  invoice_reference TEXT,
  serial_number TEXT,
  brand TEXT,
  model TEXT,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des mouvements d'immobilisations
CREATE TABLE public.asset_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL,
  movement_date DATE NOT NULL,
  from_location_id UUID REFERENCES public.locations(id),
  to_location_id UUID REFERENCES public.locations(id),
  from_assigned_to UUID REFERENCES public.profiles(id),
  to_assigned_to UUID REFERENCES public.profiles(id),
  reason TEXT,
  notes TEXT,
  document_reference TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des amortissements
CREATE TABLE public.asset_depreciations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  fiscal_year_id UUID REFERENCES public.fiscal_years(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  depreciation_amount NUMERIC NOT NULL DEFAULT 0,
  accumulated_amount NUMERIC NOT NULL DEFAULT 0,
  net_book_value NUMERIC NOT NULL DEFAULT 0,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  status TEXT DEFAULT 'calculated',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des sorties/réformes
CREATE TABLE public.asset_disposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES public.assets(id),
  disposal_type TEXT NOT NULL,
  disposal_date DATE NOT NULL,
  disposal_value NUMERIC DEFAULT 0,
  net_book_value_at_disposal NUMERIC DEFAULT 0,
  gain_loss NUMERIC DEFAULT 0,
  reason TEXT,
  buyer_name TEXT,
  document_reference TEXT,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table de rapprochement comptabilité/inventaire
CREATE TABLE public.asset_reconciliations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reconciliation_date DATE NOT NULL,
  fiscal_year_id UUID REFERENCES public.fiscal_years(id),
  total_assets_count INTEGER DEFAULT 0,
  total_book_value NUMERIC DEFAULT 0,
  total_physical_count INTEGER DEFAULT 0,
  variance_count INTEGER DEFAULT 0,
  variance_value NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  reconciled_by UUID REFERENCES public.profiles(id),
  reconciled_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_depreciations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_disposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_reconciliations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view asset categories" ON public.asset_categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with immobilisations permission can manage asset categories" ON public.asset_categories FOR ALL USING (has_permission(auth.uid(), 'immobilisations'::module_name, 'create'::permission_type));

CREATE POLICY "Authenticated users can view assets" ON public.assets FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with immobilisations permission can manage assets" ON public.assets FOR ALL USING (has_permission(auth.uid(), 'immobilisations'::module_name, 'create'::permission_type));

CREATE POLICY "Authenticated users can view asset movements" ON public.asset_movements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with immobilisations permission can manage asset movements" ON public.asset_movements FOR ALL USING (has_permission(auth.uid(), 'immobilisations'::module_name, 'create'::permission_type));

CREATE POLICY "Authenticated users can view asset depreciations" ON public.asset_depreciations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with immobilisations permission can manage asset depreciations" ON public.asset_depreciations FOR ALL USING (has_permission(auth.uid(), 'immobilisations'::module_name, 'create'::permission_type));

CREATE POLICY "Authenticated users can view asset disposals" ON public.asset_disposals FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with immobilisations permission can manage asset disposals" ON public.asset_disposals FOR ALL USING (has_permission(auth.uid(), 'immobilisations'::module_name, 'create'::permission_type));

CREATE POLICY "Authenticated users can view asset reconciliations" ON public.asset_reconciliations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users with immobilisations permission can manage asset reconciliations" ON public.asset_reconciliations FOR ALL USING (has_permission(auth.uid(), 'immobilisations'::module_name, 'create'::permission_type));

-- Trigger pour mise à jour automatique
CREATE TRIGGER update_asset_categories_updated_at BEFORE UPDATE ON public.asset_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Fonction pour calculer les amortissements
CREATE OR REPLACE FUNCTION public.calculate_asset_depreciation(_asset_id UUID, _period_end DATE)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _asset RECORD;
  _annual_depreciation NUMERIC;
  _daily_depreciation NUMERIC;
  _days_in_period INTEGER;
  _depreciation_amount NUMERIC;
BEGIN
  SELECT * INTO _asset FROM assets WHERE id = _asset_id;
  
  IF _asset.depreciation_method = 'linear' THEN
    _annual_depreciation := (_asset.acquisition_value - COALESCE(_asset.residual_value, 0)) / COALESCE(_asset.useful_life_years, 5);
    _daily_depreciation := _annual_depreciation / 365;
    _days_in_period := _period_end - COALESCE(_asset.depreciation_start_date, _asset.acquisition_date);
    _depreciation_amount := _daily_depreciation * _days_in_period;
  ELSE
    _depreciation_amount := (_asset.acquisition_value - _asset.accumulated_depreciation) * COALESCE(_asset.depreciation_rate, 20) / 100;
  END IF;
  
  RETURN LEAST(_depreciation_amount, _asset.acquisition_value - _asset.accumulated_depreciation - COALESCE(_asset.residual_value, 0));
END;
$$;
