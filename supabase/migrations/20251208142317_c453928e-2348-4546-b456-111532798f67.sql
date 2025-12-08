-- First create the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create project_conventions junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.project_conventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  convention_id uuid NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, convention_id)
);

-- Enable RLS
ALTER TABLE public.project_conventions ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_conventions
DROP POLICY IF EXISTS "Authenticated users can view project conventions" ON public.project_conventions;
CREATE POLICY "Authenticated users can view project conventions"
  ON public.project_conventions FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users with projets permission can manage project conventions" ON public.project_conventions;
CREATE POLICY "Users with projets permission can manage project conventions"
  ON public.project_conventions FOR ALL
  USING (
    has_permission(auth.uid(), 'projets'::module_name, 'create'::permission_type)
    OR is_admin(auth.uid())
  );

-- Create trigger for updated_at on project_conventions
DROP TRIGGER IF EXISTS update_project_conventions_updated_at ON public.project_conventions;
CREATE TRIGGER update_project_conventions_updated_at
  BEFORE UPDATE ON public.project_conventions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();