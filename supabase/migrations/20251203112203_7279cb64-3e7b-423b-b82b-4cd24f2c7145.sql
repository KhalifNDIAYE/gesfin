-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'suspended', 'pending', 'completed', 'closed')),
  total_budget NUMERIC DEFAULT 0,
  consumed_budget NUMERIC DEFAULT 0,
  currency_id UUID REFERENCES public.currencies(id),
  exchange_rate NUMERIC DEFAULT 1,
  responsible_id UUID REFERENCES public.profiles(id),
  site_id UUID REFERENCES public.sites(id),
  tracking_axis_id UUID REFERENCES public.tracking_axes(id),
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_bailleurs junction table for multi-bailleur support
CREATE TABLE public.project_bailleurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  bailleur_id UUID NOT NULL REFERENCES public.bailleurs(id),
  committed_amount NUMERIC DEFAULT 0,
  disbursed_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  execution_rate NUMERIC DEFAULT 0,
  convention_id UUID REFERENCES public.conventions(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(project_id, bailleur_id)
);

-- Create project_budgets table for budget tracking
CREATE TABLE public.project_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  budget_id UUID REFERENCES public.budgets(id),
  forecast_amount NUMERIC DEFAULT 0,
  committed_amount NUMERIC DEFAULT 0,
  consumed_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC DEFAULT 0,
  fiscal_year_id UUID REFERENCES public.fiscal_years(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create project_documents table
CREATE TABLE public.project_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_bailleurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects
CREATE POLICY "Authenticated users can view projects"
ON public.projects FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with projets permission can manage projects"
ON public.projects FOR ALL
USING (has_permission(auth.uid(), 'projets'::module_name, 'create'::permission_type));

-- RLS policies for project_bailleurs
CREATE POLICY "Authenticated users can view project bailleurs"
ON public.project_bailleurs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with projets permission can manage project bailleurs"
ON public.project_bailleurs FOR ALL
USING (has_permission(auth.uid(), 'projets'::module_name, 'create'::permission_type));

-- RLS policies for project_budgets
CREATE POLICY "Authenticated users can view project budgets"
ON public.project_budgets FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with projets permission can manage project budgets"
ON public.project_budgets FOR ALL
USING (has_permission(auth.uid(), 'projets'::module_name, 'create'::permission_type));

-- RLS policies for project_documents
CREATE POLICY "Authenticated users can view project documents"
ON public.project_documents FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with projets permission can manage project documents"
ON public.project_documents FOR ALL
USING (has_permission(auth.uid(), 'projets'::module_name, 'create'::permission_type));

-- Triggers for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_project_bailleurs_updated_at
BEFORE UPDATE ON public.project_bailleurs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_project_budgets_updated_at
BEFORE UPDATE ON public.project_budgets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();