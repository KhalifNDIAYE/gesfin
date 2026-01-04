-- Add legal_mentions column to organization_settings for PDF footer
ALTER TABLE public.organization_settings
ADD COLUMN IF NOT EXISTS legal_mentions TEXT;