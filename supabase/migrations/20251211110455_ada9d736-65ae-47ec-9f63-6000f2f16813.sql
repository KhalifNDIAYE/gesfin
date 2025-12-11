-- Create regions table with geolocation
CREATE TABLE public.regions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_id UUID REFERENCES public.countries(id),
  latitude NUMERIC,
  longitude NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add region_id to projects
ALTER TABLE public.projects ADD COLUMN region_id UUID REFERENCES public.regions(id);

-- Enable RLS on regions
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- RLS policies for regions
CREATE POLICY "Authenticated users can view regions" 
ON public.regions FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage regions" 
ON public.regions FOR ALL 
USING (is_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_regions_country_id ON public.regions(country_id);
CREATE INDEX idx_projects_region_id ON public.projects(region_id);