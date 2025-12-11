-- Add ISO codes to countries table
ALTER TABLE public.countries 
ADD COLUMN IF NOT EXISTS code_iso2 text,
ADD COLUMN IF NOT EXISTS code_iso3 text;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_countries_code_iso2 ON public.countries(code_iso2);
CREATE INDEX IF NOT EXISTS idx_countries_code_iso3 ON public.countries(code_iso3);

-- Update existing countries to use code as iso2 if not set
UPDATE public.countries SET code_iso2 = code WHERE code_iso2 IS NULL AND LENGTH(code) = 2;
UPDATE public.countries SET code_iso3 = code WHERE code_iso3 IS NULL AND LENGTH(code) = 3;