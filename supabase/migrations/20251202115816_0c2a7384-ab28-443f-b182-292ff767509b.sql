
-- Create cost centers table
CREATE TABLE public.cost_centers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.cost_centers(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create analytical allocations table
CREATE TABLE public.analytical_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_line_id UUID REFERENCES public.journal_entry_lines(id) ON DELETE CASCADE,
  cost_center_id UUID REFERENCES public.cost_centers(id),
  activity_id UUID REFERENCES public.tracking_axes(id),
  component_id UUID REFERENCES public.plan_accounts(id),
  geographic_zone_id UUID REFERENCES public.plan_accounts(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  percentage NUMERIC,
  allocation_type TEXT NOT NULL CHECK (allocation_type IN ('activity', 'component', 'geographic', 'cost_center')),
  allocation_method TEXT NOT NULL CHECK (allocation_method IN ('a_priori', 'a_posteriori', 'reallocation')),
  fiscal_year_id UUID REFERENCES public.fiscal_years(id),
  description TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create distribution rules table for a priori distributions
CREATE TABLE public.distribution_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  source_account_id UUID REFERENCES public.plan_accounts(id),
  allocation_type TEXT NOT NULL CHECK (allocation_type IN ('activity', 'component', 'geographic', 'cost_center')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create distribution rule lines for percentages
CREATE TABLE public.distribution_rule_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  distribution_rule_id UUID REFERENCES public.distribution_rules(id) ON DELETE CASCADE NOT NULL,
  target_id UUID NOT NULL,
  percentage NUMERIC NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytical_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_rule_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cost_centers
CREATE POLICY "Authenticated users can view cost centers"
ON public.cost_centers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can manage cost centers"
ON public.cost_centers FOR ALL
USING (has_permission(auth.uid(), 'comptabilite'::module_name, 'create'::permission_type));

-- RLS Policies for analytical_allocations
CREATE POLICY "Authenticated users can view analytical allocations"
ON public.analytical_allocations FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can manage analytical allocations"
ON public.analytical_allocations FOR ALL
USING (has_permission(auth.uid(), 'comptabilite'::module_name, 'create'::permission_type));

-- RLS Policies for distribution_rules
CREATE POLICY "Authenticated users can view distribution rules"
ON public.distribution_rules FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can manage distribution rules"
ON public.distribution_rules FOR ALL
USING (has_permission(auth.uid(), 'comptabilite'::module_name, 'create'::permission_type));

-- RLS Policies for distribution_rule_lines
CREATE POLICY "Authenticated users can view distribution rule lines"
ON public.distribution_rule_lines FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can manage distribution rule lines"
ON public.distribution_rule_lines FOR ALL
USING (has_permission(auth.uid(), 'comptabilite'::module_name, 'create'::permission_type));

-- Create triggers for updated_at
CREATE TRIGGER update_cost_centers_updated_at
BEFORE UPDATE ON public.cost_centers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_analytical_allocations_updated_at
BEFORE UPDATE ON public.analytical_allocations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_distribution_rules_updated_at
BEFORE UPDATE ON public.distribution_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
