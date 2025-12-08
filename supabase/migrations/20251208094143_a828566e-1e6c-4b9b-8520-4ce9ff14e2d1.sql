-- Create budget alert settings table
CREATE TABLE IF NOT EXISTS public.budget_alert_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level TEXT NOT NULL UNIQUE, -- 'preventive', 'critical', 'blocking'
  label TEXT NOT NULL,
  threshold_percentage NUMERIC NOT NULL DEFAULT 80,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  send_notification BOOLEAN NOT NULL DEFAULT true,
  send_email BOOLEAN NOT NULL DEFAULT true,
  log_to_audit BOOLEAN NOT NULL DEFAULT true,
  block_operations BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create junction table for alert recipients
CREATE TABLE IF NOT EXISTS public.budget_alert_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_setting_id UUID NOT NULL REFERENCES public.budget_alert_settings(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(alert_setting_id, role_id)
);

-- Enable RLS
ALTER TABLE public.budget_alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_alert_recipients ENABLE ROW LEVEL SECURITY;

-- RLS policies for budget_alert_settings
CREATE POLICY "Authenticated users can view budget alert settings"
  ON public.budget_alert_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage budget alert settings"
  ON public.budget_alert_settings FOR ALL
  USING (is_admin(auth.uid()));

-- RLS policies for budget_alert_recipients
CREATE POLICY "Authenticated users can view budget alert recipients"
  ON public.budget_alert_recipients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage budget alert recipients"
  ON public.budget_alert_recipients FOR ALL
  USING (is_admin(auth.uid()));

-- Insert default settings
INSERT INTO public.budget_alert_settings (level, label, threshold_percentage, is_enabled, send_notification, send_email, log_to_audit, block_operations)
VALUES 
  ('preventive', 'Alerte préventive', 80, true, true, true, true, false),
  ('critical', 'Alerte critique', 90, true, true, true, true, false),
  ('blocking', 'Blocage total', 100, true, true, true, true, true)
ON CONFLICT (level) DO NOTHING;

-- Insert default recipients based on existing roles
-- Preventive: comptable, daf
INSERT INTO public.budget_alert_recipients (alert_setting_id, role_id)
SELECT s.id, r.id
FROM public.budget_alert_settings s
CROSS JOIN public.roles r
WHERE s.level = 'preventive' AND r.name IN ('comptable', 'daf')
ON CONFLICT DO NOTHING;

-- Critical: daf, dg
INSERT INTO public.budget_alert_recipients (alert_setting_id, role_id)
SELECT s.id, r.id
FROM public.budget_alert_settings s
CROSS JOIN public.roles r
WHERE s.level = 'critical' AND r.name IN ('daf', 'dg')
ON CONFLICT DO NOTHING;

-- Blocking: admin, dg
INSERT INTO public.budget_alert_recipients (alert_setting_id, role_id)
SELECT s.id, r.id
FROM public.budget_alert_settings s
CROSS JOIN public.roles r
WHERE s.level = 'blocking' AND r.name IN ('admin', 'dg')
ON CONFLICT DO NOTHING;