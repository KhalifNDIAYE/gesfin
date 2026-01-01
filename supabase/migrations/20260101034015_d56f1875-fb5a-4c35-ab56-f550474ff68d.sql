-- Create interface_settings table for user-specific UI preferences
CREATE TABLE public.interface_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'Français',
  date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  number_format TEXT NOT NULL DEFAULT '1 234 567,89',
  timezone TEXT NOT NULL DEFAULT 'UTC+0 (Bamako)',
  sidebar_collapsed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_interface_settings UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.interface_settings ENABLE ROW LEVEL SECURITY;

-- Users can view their own settings
CREATE POLICY "Users can view their own interface settings"
ON public.interface_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert their own interface settings"
ON public.interface_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update their own interface settings"
ON public.interface_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_interface_settings_updated_at
BEFORE UPDATE ON public.interface_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();