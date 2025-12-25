-- Add is_active column to roles table
ALTER TABLE public.roles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.roles.is_active IS 'Indicates if the role is active and can be assigned to users';