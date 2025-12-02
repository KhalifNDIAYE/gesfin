-- Create enum for plan types
CREATE TYPE public.plan_type AS ENUM ('comptable', 'budgetaire', 'analytique', 'financier', 'geographique');

-- Fiscal Years (Exercices comptables)
CREATE TABLE public.fiscal_years (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_open BOOLEAN DEFAULT true,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Currencies (Monnaies)
CREATE TABLE public.currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT,
  is_default BOOLEAN DEFAULT false,
  exchange_rate DECIMAL(18, 6) DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Countries (Pays)
CREATE TABLE public.countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Sites
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address TEXT,
  country_id UUID REFERENCES public.countries(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Work Units (Unités d'œuvre)
CREATE TABLE public.work_units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Locations (Emplacements)
CREATE TABLE public.locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  site_id UUID REFERENCES public.sites(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Plan Accounts (Comptes des plans)
CREATE TABLE public.plan_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_type public.plan_type NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.plan_accounts(id),
  level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(plan_type, code)
);

-- Tracking Axes (Axes de suivi)
CREATE TABLE public.tracking_axes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Organization Settings (Paramètres organisation)
CREATE TABLE public.organization_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  tax_id TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_axes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fiscal_years
CREATE POLICY "Authenticated users can view fiscal years"
ON public.fiscal_years FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage fiscal years"
ON public.fiscal_years FOR ALL
USING (public.is_admin(auth.uid()));

-- RLS Policies for currencies
CREATE POLICY "Authenticated users can view currencies"
ON public.currencies FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage currencies"
ON public.currencies FOR ALL
USING (public.is_admin(auth.uid()));

-- RLS Policies for countries
CREATE POLICY "Authenticated users can view countries"
ON public.countries FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage countries"
ON public.countries FOR ALL
USING (public.is_admin(auth.uid()));

-- RLS Policies for sites
CREATE POLICY "Authenticated users can view sites"
ON public.sites FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage sites"
ON public.sites FOR ALL
USING (public.is_admin(auth.uid()));

-- RLS Policies for work_units
CREATE POLICY "Authenticated users can view work units"
ON public.work_units FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage work units"
ON public.work_units FOR ALL
USING (public.is_admin(auth.uid()));

-- RLS Policies for locations
CREATE POLICY "Authenticated users can view locations"
ON public.locations FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage locations"
ON public.locations FOR ALL
USING (public.is_admin(auth.uid()));

-- RLS Policies for plan_accounts
CREATE POLICY "Authenticated users can view plan accounts"
ON public.plan_accounts FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage plan accounts"
ON public.plan_accounts FOR ALL
USING (public.is_admin(auth.uid()));

-- RLS Policies for tracking_axes
CREATE POLICY "Authenticated users can view tracking axes"
ON public.tracking_axes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage tracking axes"
ON public.tracking_axes FOR ALL
USING (public.is_admin(auth.uid()));

-- RLS Policies for organization_settings
CREATE POLICY "Authenticated users can view organization settings"
ON public.organization_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage organization settings"
ON public.organization_settings FOR ALL
USING (public.is_admin(auth.uid()));

-- Create triggers for updated_at
CREATE TRIGGER update_fiscal_years_updated_at BEFORE UPDATE ON public.fiscal_years FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON public.currencies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON public.countries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_work_units_updated_at BEFORE UPDATE ON public.work_units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON public.locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_plan_accounts_updated_at BEFORE UPDATE ON public.plan_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_tracking_axes_updated_at BEFORE UPDATE ON public.tracking_axes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON public.organization_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Insert default organization settings
INSERT INTO public.organization_settings (name) VALUES ('Mon Organisation');