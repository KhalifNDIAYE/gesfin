-- Table de configuration des notifications email
CREATE TABLE public.email_notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT false,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_username text,
  smtp_password text,
  from_email text,
  from_name text DEFAULT 'Système de Gestion',
  organization_logo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Table des types d'alertes configurables
CREATE TABLE public.email_alert_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_enabled boolean DEFAULT true,
  send_immediately boolean DEFAULT true,
  severity text DEFAULT 'warning' CHECK (severity IN ('critical', 'major', 'warning')),
  created_at timestamp with time zone DEFAULT now()
);

-- Table de liaison alertes - rôles destinataires
CREATE TABLE public.email_alert_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type_id uuid REFERENCES public.email_alert_types(id) ON DELETE CASCADE,
  role_id uuid REFERENCES public.roles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(alert_type_id, role_id)
);

-- Table des logs d'emails envoyés
CREATE TABLE public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type text NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  body_preview text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  related_module text,
  related_entity_id text,
  related_entity_name text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Insert types d'alertes par défaut
INSERT INTO public.email_alert_types (alert_type, name, description, is_enabled, send_immediately, severity) VALUES
  ('budget_overrun', 'Dépassement de budget', 'Alerte lorsqu''un budget dépasse le seuil autorisé', true, true, 'critical'),
  ('project_late', 'Projet en retard', 'Alerte lorsqu''un projet dépasse sa date de fin', true, false, 'major'),
  ('convention_expired', 'Convention expirée', 'Alerte lorsqu''une convention active dépasse sa date de clôture', true, true, 'critical'),
  ('blocked_action_critical', 'Action bloquée critique', 'Alerte lors d''une tentative d''action non autorisée critique', true, true, 'critical'),
  ('sensitive_deletion', 'Suppression sensible', 'Alerte lors d''une suppression de données sensibles', true, true, 'major'),
  ('sensitive_validation', 'Validation sensible', 'Alerte lors d''une validation importante', true, false, 'warning');

-- Enable RLS
ALTER TABLE public.email_notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_alert_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_alert_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage email notification settings" ON public.email_notification_settings FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can view email notification settings" ON public.email_notification_settings FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage email alert types" ON public.email_alert_types FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can view email alert types" ON public.email_alert_types FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage email alert recipients" ON public.email_alert_recipients FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated users can view email alert recipients" ON public.email_alert_recipients FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view email logs" ON public.email_logs FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "System can insert email logs" ON public.email_logs FOR INSERT WITH CHECK (true);

-- Insert default settings row
INSERT INTO public.email_notification_settings (is_enabled) VALUES (false);

-- Trigger pour updated_at
CREATE TRIGGER update_email_notification_settings_updated_at
  BEFORE UPDATE ON public.email_notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();