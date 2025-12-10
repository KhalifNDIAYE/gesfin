-- Add geolocation fields to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric,
ADD COLUMN IF NOT EXISTS location_name text;

-- Add comments for documentation
COMMENT ON COLUMN public.projects.latitude IS 'Project location latitude';
COMMENT ON COLUMN public.projects.longitude IS 'Project location longitude';
COMMENT ON COLUMN public.projects.location_name IS 'Project location name (city, region, etc.)';