-- Table des budgets
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  fiscal_year_id UUID NOT NULL REFERENCES public.fiscal_years(id),
  currency_id UUID NOT NULL REFERENCES public.currencies(id),
  exchange_rate NUMERIC DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'closed')),
  total_amount NUMERIC DEFAULT 0,
  total_amount_local NUMERIC DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des lignes budgétaires
CREATE TABLE public.budget_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.plan_accounts(id),
  tracking_axis_id UUID REFERENCES public.tracking_axes(id),
  cost_center_id UUID REFERENCES public.cost_centers(id),
  description TEXT,
  forecast_amount NUMERIC DEFAULT 0,
  forecast_amount_local NUMERIC DEFAULT 0,
  committed_amount NUMERIC DEFAULT 0,
  committed_amount_local NUMERIC DEFAULT 0,
  realized_amount NUMERIC DEFAULT 0,
  realized_amount_local NUMERIC DEFAULT 0,
  variance_amount NUMERIC GENERATED ALWAYS AS (forecast_amount - realized_amount) STORED,
  variance_percentage NUMERIC GENERATED ALWAYS AS (
    CASE WHEN forecast_amount > 0 THEN ((forecast_amount - realized_amount) / forecast_amount) * 100 ELSE 0 END
  ) STORED,
  alert_threshold NUMERIC DEFAULT 80,
  is_over_budget BOOLEAN GENERATED ALWAYS AS (realized_amount > forecast_amount) STORED,
  line_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des mouvements budgétaires (prévisions, engagements, réalisations)
CREATE TABLE public.budget_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_line_id UUID NOT NULL REFERENCES public.budget_lines(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('forecast', 'commitment', 'realization')),
  movement_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  amount_local NUMERIC NOT NULL,
  reference TEXT,
  description TEXT,
  journal_entry_id UUID REFERENCES public.journal_entries(id),
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des alertes budgétaires
CREATE TABLE public.budget_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  budget_line_id UUID REFERENCES public.budget_lines(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('warning', 'overspent', 'critical')),
  message TEXT NOT NULL,
  threshold_reached NUMERIC,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budgets
CREATE POLICY "Authenticated users can view budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can manage budgets"
  ON public.budgets FOR ALL
  USING (has_permission(auth.uid(), 'comptabilite', 'create'));

-- RLS Policies for budget_lines
CREATE POLICY "Authenticated users can view budget lines"
  ON public.budget_lines FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can manage budget lines"
  ON public.budget_lines FOR ALL
  USING (has_permission(auth.uid(), 'comptabilite', 'create'));

-- RLS Policies for budget_movements
CREATE POLICY "Authenticated users can view budget movements"
  ON public.budget_movements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can manage budget movements"
  ON public.budget_movements FOR ALL
  USING (has_permission(auth.uid(), 'comptabilite', 'create'));

-- RLS Policies for budget_alerts
CREATE POLICY "Authenticated users can view budget alerts"
  ON public.budget_alerts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can manage budget alerts"
  ON public.budget_alerts FOR ALL
  USING (has_permission(auth.uid(), 'comptabilite', 'create'));

-- Triggers for updated_at
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_budget_lines_updated_at
  BEFORE UPDATE ON public.budget_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_budget_movements_updated_at
  BEFORE UPDATE ON public.budget_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to update budget line amounts from movements
CREATE OR REPLACE FUNCTION public.update_budget_line_amounts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.budget_lines
    SET 
      forecast_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.budget_movements WHERE budget_line_id = NEW.budget_line_id AND movement_type = 'forecast'),
      forecast_amount_local = (SELECT COALESCE(SUM(amount_local), 0) FROM public.budget_movements WHERE budget_line_id = NEW.budget_line_id AND movement_type = 'forecast'),
      committed_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.budget_movements WHERE budget_line_id = NEW.budget_line_id AND movement_type = 'commitment'),
      committed_amount_local = (SELECT COALESCE(SUM(amount_local), 0) FROM public.budget_movements WHERE budget_line_id = NEW.budget_line_id AND movement_type = 'commitment'),
      realized_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.budget_movements WHERE budget_line_id = NEW.budget_line_id AND movement_type = 'realization'),
      realized_amount_local = (SELECT COALESCE(SUM(amount_local), 0) FROM public.budget_movements WHERE budget_line_id = NEW.budget_line_id AND movement_type = 'realization')
    WHERE id = NEW.budget_line_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.budget_lines
    SET 
      forecast_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.budget_movements WHERE budget_line_id = OLD.budget_line_id AND movement_type = 'forecast'),
      forecast_amount_local = (SELECT COALESCE(SUM(amount_local), 0) FROM public.budget_movements WHERE budget_line_id = OLD.budget_line_id AND movement_type = 'forecast'),
      committed_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.budget_movements WHERE budget_line_id = OLD.budget_line_id AND movement_type = 'commitment'),
      committed_amount_local = (SELECT COALESCE(SUM(amount_local), 0) FROM public.budget_movements WHERE budget_line_id = OLD.budget_line_id AND movement_type = 'commitment'),
      realized_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.budget_movements WHERE budget_line_id = OLD.budget_line_id AND movement_type = 'realization'),
      realized_amount_local = (SELECT COALESCE(SUM(amount_local), 0) FROM public.budget_movements WHERE budget_line_id = OLD.budget_line_id AND movement_type = 'realization')
    WHERE id = OLD.budget_line_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_update_budget_line_amounts
  AFTER INSERT OR UPDATE OR DELETE ON public.budget_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_budget_line_amounts();

-- Function to check budget alerts
CREATE OR REPLACE FUNCTION public.check_budget_alerts()
RETURNS TRIGGER AS $$
DECLARE
  _budget_id UUID;
  _usage_percentage NUMERIC;
  _alert_type TEXT;
BEGIN
  SELECT budget_id INTO _budget_id FROM public.budget_lines WHERE id = NEW.id;
  
  IF NEW.forecast_amount > 0 THEN
    _usage_percentage := (NEW.realized_amount / NEW.forecast_amount) * 100;
    
    IF _usage_percentage >= 100 THEN
      _alert_type := 'overspent';
    ELSIF _usage_percentage >= 90 THEN
      _alert_type := 'critical';
    ELSIF _usage_percentage >= NEW.alert_threshold THEN
      _alert_type := 'warning';
    ELSE
      RETURN NEW;
    END IF;
    
    INSERT INTO public.budget_alerts (budget_id, budget_line_id, alert_type, message, threshold_reached)
    VALUES (
      _budget_id,
      NEW.id,
      _alert_type,
      CASE _alert_type
        WHEN 'overspent' THEN 'Budget dépassé: ' || _usage_percentage::TEXT || '% utilisé'
        WHEN 'critical' THEN 'Alerte critique: ' || _usage_percentage::TEXT || '% du budget utilisé'
        ELSE 'Attention: ' || _usage_percentage::TEXT || '% du budget utilisé'
      END,
      _usage_percentage
    )
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trigger_check_budget_alerts
  AFTER UPDATE ON public.budget_lines
  FOR EACH ROW
  WHEN (OLD.realized_amount IS DISTINCT FROM NEW.realized_amount)
  EXECUTE FUNCTION public.check_budget_alerts();