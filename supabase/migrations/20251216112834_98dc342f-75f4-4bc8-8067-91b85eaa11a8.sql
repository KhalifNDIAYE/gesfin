
-- =============================================
-- MOTEUR D'ALERTES DE SÉCURITÉ AVANCÉ
-- =============================================

-- Enum pour les niveaux de sévérité des alertes
CREATE TYPE public.alert_severity_level AS ENUM (
  'info', 'low', 'medium', 'high', 'critical'
);

-- Enum pour les catégories d'alertes
CREATE TYPE public.alert_category AS ENUM (
  'authentication', 'authorization', 'data_access', 'system', 'compliance'
);

-- Enum pour le statut des alertes
CREATE TYPE public.alert_status AS ENUM (
  'new', 'acknowledged', 'in_progress', 'resolved', 'ignored', 'escalated'
);

-- Enum pour les types d'actions automatiques
CREATE TYPE public.alert_action_type AS ENUM (
  'block_account', 'force_logout', 'reset_password', 'disable_access', 
  'send_notification', 'send_email', 'send_webhook', 'escalate', 'log_only'
);

-- =============================================
-- TABLE: Règles d'alertes configurables
-- =============================================
CREATE TABLE public.security_alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category alert_category NOT NULL,
  severity alert_severity_level NOT NULL DEFAULT 'medium',
  risk_score INTEGER DEFAULT 50 CHECK (risk_score >= 0 AND risk_score <= 100),
  
  -- Conditions de déclenchement
  event_type TEXT NOT NULL,
  threshold_count INTEGER DEFAULT 1,
  threshold_window_minutes INTEGER DEFAULT 60,
  conditions JSONB DEFAULT '{}',
  
  -- Listes blanches/noires
  whitelist_ips TEXT[],
  blacklist_ips TEXT[],
  whitelist_users UUID[],
  blacklist_users UUID[],
  
  -- Actions automatiques
  auto_actions alert_action_type[] DEFAULT '{}',
  auto_action_config JSONB DEFAULT '{}',
  
  -- Notifications
  notify_channels TEXT[] DEFAULT ARRAY['notification'],
  notify_roles UUID[],
  
  -- Configuration
  is_enabled BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 5,
  
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABLE: Événements d'alertes détectés
-- =============================================
CREATE TABLE public.security_alert_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.security_alert_rules(id),
  
  -- Informations de l'alerte
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category alert_category NOT NULL,
  severity alert_severity_level NOT NULL,
  risk_score INTEGER DEFAULT 50,
  status alert_status DEFAULT 'new',
  
  -- Contexte de l'événement
  user_id UUID REFERENCES public.profiles(id),
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  location TEXT,
  country_code TEXT,
  
  -- Détails techniques
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  triggered_conditions JSONB DEFAULT '{}',
  evidence JSONB DEFAULT '{}',
  
  -- Gestion de l'alerte
  assigned_to UUID REFERENCES public.profiles(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES public.profiles(id),
  resolution_notes TEXT,
  
  -- Actions prises
  actions_taken TEXT[],
  escalated_to UUID REFERENCES public.profiles(id),
  escalated_at TIMESTAMP WITH TIME ZONE,
  
  -- Métadonnées
  source_module TEXT,
  correlation_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABLE: Historique des actions sur les alertes
-- =============================================
CREATE TABLE public.security_alert_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.security_alert_events(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  from_status alert_status,
  to_status alert_status,
  comment TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- =============================================
-- TABLE: Notifications envoyées
-- =============================================
CREATE TABLE public.security_alert_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.security_alert_events(id) ON DELETE CASCADE,
  channel TEXT NOT NULL, -- notification, email, webhook
  recipient_id UUID REFERENCES public.profiles(id),
  recipient_email TEXT,
  webhook_url TEXT,
  
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  response_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABLE: Actions automatiques exécutées
-- =============================================
CREATE TABLE public.security_alert_auto_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.security_alert_events(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.security_alert_rules(id),
  action_type alert_action_type NOT NULL,
  
  target_user_id UUID REFERENCES public.profiles(id),
  target_resource_type TEXT,
  target_resource_id TEXT,
  
  status TEXT DEFAULT 'pending', -- pending, executed, failed, reverted
  executed_at TIMESTAMP WITH TIME ZONE,
  reverted_at TIMESTAMP WITH TIME ZONE,
  reverted_by UUID REFERENCES public.profiles(id),
  
  result JSONB DEFAULT '{}',
  error_message TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =============================================
-- TABLE: Compteurs d'événements (pour seuils)
-- =============================================
CREATE TABLE public.security_event_counters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID NOT NULL REFERENCES public.security_alert_rules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  ip_address TEXT,
  
  event_type TEXT NOT NULL,
  counter INTEGER DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  window_end TIMESTAMP WITH TIME ZONE,
  
  last_event_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  
  UNIQUE(rule_id, user_id, ip_address, event_type, window_start)
);

-- =============================================
-- TABLE: Configuration du moteur
-- =============================================
CREATE TABLE public.security_engine_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insérer les configurations par défaut
INSERT INTO public.security_engine_config (key, value, description) VALUES
('engine_enabled', 'true', 'Activer/désactiver le moteur d''alertes'),
('default_cooldown', '5', 'Temps de cooldown par défaut en minutes'),
('email_enabled', 'true', 'Activer les notifications email'),
('webhook_enabled', 'false', 'Activer les webhooks'),
('auto_actions_enabled', 'true', 'Activer les actions automatiques'),
('max_alerts_per_hour', '100', 'Nombre maximum d''alertes par heure'),
('retention_days', '365', 'Durée de rétention des alertes en jours');

-- =============================================
-- Règles d'alertes par défaut
-- =============================================
INSERT INTO public.security_alert_rules (code, name, description, category, severity, risk_score, event_type, threshold_count, threshold_window_minutes, conditions, auto_actions, notify_channels) VALUES
-- Authentification
('AUTH_FAILED_REPEATED', 'Tentatives de connexion échouées répétées', 'Plus de 5 tentatives de connexion échouées en 10 minutes', 'authentication', 'high', 75, 'login_failed', 5, 10, '{"consecutive": true}', ARRAY['send_notification', 'block_account']::alert_action_type[], ARRAY['notification', 'email']),
('AUTH_UNUSUAL_IP', 'Connexion depuis une IP inhabituelle', 'Connexion détectée depuis une IP non reconnue', 'authentication', 'medium', 50, 'login_unusual_ip', 1, 60, '{}', ARRAY['send_notification']::alert_action_type[], ARRAY['notification']),
('AUTH_MULTIPLE_SESSIONS', 'Sessions multiples détectées', 'Connexion simultanée sur plusieurs appareils', 'authentication', 'low', 30, 'multiple_sessions', 1, 5, '{}', ARRAY['send_notification']::alert_action_type[], ARRAY['notification']),
('AUTH_SESSION_EXPIRED', 'Expiration de session', 'Session expirée ou révoquée', 'authentication', 'info', 10, 'session_expired', 1, 60, '{}', ARRAY['log_only']::alert_action_type[], ARRAY['notification']),

-- Autorisations
('PERM_ACCESS_DENIED', 'Accès refusé à une ressource', 'Tentative d''accès à une ressource non autorisée', 'authorization', 'medium', 40, 'access_denied', 1, 60, '{}', ARRAY['send_notification']::alert_action_type[], ARRAY['notification']),
('PERM_ACTION_BLOCKED', 'Action bloquée par permissions', 'Action bloquée par la matrice des permissions', 'authorization', 'medium', 45, 'action_blocked', 1, 60, '{}', ARRAY['send_notification']::alert_action_type[], ARRAY['notification']),
('PERM_PRIVILEGE_ESCALATION', 'Tentative d''élévation de privilèges', 'Tentative d''exécuter une action de niveau supérieur', 'authorization', 'critical', 90, 'privilege_escalation', 1, 5, '{}', ARRAY['send_notification', 'force_logout', 'send_email']::alert_action_type[], ARRAY['notification', 'email']),

-- Données
('DATA_MASS_DOWNLOAD', 'Téléchargement massif de documents', 'Téléchargement de plus de 50 documents en une heure', 'data_access', 'high', 70, 'mass_download', 50, 60, '{}', ARRAY['send_notification', 'send_email']::alert_action_type[], ARRAY['notification', 'email']),
('DATA_SENSITIVE_EXPORT', 'Export de données sensibles', 'Export de données sensibles détecté', 'data_access', 'high', 65, 'sensitive_export', 1, 60, '{}', ARRAY['send_notification', 'send_email']::alert_action_type[], ARRAY['notification', 'email']),
('DATA_CRITICAL_DELETE', 'Suppression de documents critiques', 'Suppression de documents marqués comme critiques', 'data_access', 'critical', 85, 'critical_delete', 1, 5, '{}', ARRAY['send_notification', 'send_email', 'escalate']::alert_action_type[], ARRAY['notification', 'email']),

-- Système
('SYS_ENCRYPTION_DISABLED', 'Désactivation du chiffrement', 'Le chiffrement des données a été désactivé', 'system', 'critical', 95, 'encryption_disabled', 1, 1, '{}', ARRAY['send_notification', 'send_email', 'escalate']::alert_action_type[], ARRAY['notification', 'email']),
('SYS_BACKUP_FAILED', 'Échec de sauvegarde', 'La sauvegarde automatique a échoué', 'system', 'high', 80, 'backup_failed', 1, 60, '{}', ARRAY['send_notification', 'send_email']::alert_action_type[], ARRAY['notification', 'email']),
('SYS_CONFIG_CHANGE', 'Modification de paramètres critiques', 'Modification de configuration système sensible', 'system', 'high', 60, 'critical_config_change', 1, 60, '{}', ARRAY['send_notification', 'send_email']::alert_action_type[], ARRAY['notification', 'email']),

-- Conformité
('COMP_SOC2_VIOLATION', 'Non-conformité SOC 2', 'Contrôle SOC 2 marqué comme non conforme', 'compliance', 'high', 70, 'soc2_violation', 1, 1440, '{}', ARRAY['send_notification', 'send_email']::alert_action_type[], ARRAY['notification', 'email']),
('COMP_POLICY_EXPIRED', 'Politique de sécurité expirée', 'Une politique de sécurité a expiré', 'compliance', 'medium', 55, 'policy_expired', 1, 1440, '{}', ARRAY['send_notification']::alert_action_type[], ARRAY['notification']),
('COMP_RGPD_RETENTION', 'Dépassement durée conservation RGPD', 'Données conservées au-delà de la durée légale', 'compliance', 'high', 75, 'rgpd_retention_exceeded', 1, 1440, '{}', ARRAY['send_notification', 'send_email']::alert_action_type[], ARRAY['notification', 'email']);

-- =============================================
-- Enable RLS
-- =============================================
ALTER TABLE public.security_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alert_auto_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_event_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_engine_config ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- security_alert_rules
CREATE POLICY "Admins and security users can view alert rules"
ON public.security_alert_rules FOR SELECT
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite'::module_name, 'read'::permission_type));

CREATE POLICY "Admins can manage alert rules"
ON public.security_alert_rules FOR ALL
USING (is_admin(auth.uid()));

-- security_alert_events
CREATE POLICY "Admins and security users can view alert events"
ON public.security_alert_events FOR SELECT
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite'::module_name, 'read'::permission_type));

CREATE POLICY "System can insert alert events"
ON public.security_alert_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update alert events"
ON public.security_alert_events FOR UPDATE
USING (is_admin(auth.uid()));

-- security_alert_history
CREATE POLICY "Admins and security users can view alert history"
ON public.security_alert_history FOR SELECT
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite'::module_name, 'read'::permission_type));

CREATE POLICY "System can insert alert history"
ON public.security_alert_history FOR INSERT
WITH CHECK (true);

-- security_alert_notifications
CREATE POLICY "Admins can view alert notifications"
ON public.security_alert_notifications FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "System can manage alert notifications"
ON public.security_alert_notifications FOR ALL
USING (true);

-- security_alert_auto_actions
CREATE POLICY "Admins can view auto actions"
ON public.security_alert_auto_actions FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "System can manage auto actions"
ON public.security_alert_auto_actions FOR ALL
USING (true);

-- security_event_counters
CREATE POLICY "System can manage event counters"
ON public.security_event_counters FOR ALL
USING (true);

-- security_engine_config
CREATE POLICY "Admins can view engine config"
ON public.security_engine_config FOR SELECT
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite'::module_name, 'read'::permission_type));

CREATE POLICY "Admins can manage engine config"
ON public.security_engine_config FOR ALL
USING (is_admin(auth.uid()));

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_alert_rules_category ON public.security_alert_rules(category);
CREATE INDEX idx_alert_rules_enabled ON public.security_alert_rules(is_enabled);
CREATE INDEX idx_alert_events_status ON public.security_alert_events(status);
CREATE INDEX idx_alert_events_severity ON public.security_alert_events(severity);
CREATE INDEX idx_alert_events_category ON public.security_alert_events(category);
CREATE INDEX idx_alert_events_created ON public.security_alert_events(created_at DESC);
CREATE INDEX idx_alert_events_user ON public.security_alert_events(user_id);
CREATE INDEX idx_alert_events_assigned ON public.security_alert_events(assigned_to);
CREATE INDEX idx_event_counters_rule ON public.security_event_counters(rule_id, event_type);
CREATE INDEX idx_event_counters_window ON public.security_event_counters(window_end);

-- =============================================
-- Triggers
-- =============================================
CREATE TRIGGER set_security_alert_rules_updated_at
    BEFORE UPDATE ON public.security_alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_security_alert_events_updated_at
    BEFORE UPDATE ON public.security_alert_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- Function: Créer une alerte à partir d'un événement
-- =============================================
CREATE OR REPLACE FUNCTION public.create_security_alert(
  p_rule_code TEXT,
  p_user_id UUID DEFAULT NULL,
  p_user_email TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}',
  p_evidence JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule RECORD;
  v_alert_id UUID;
  v_counter_count INTEGER;
BEGIN
  -- Récupérer la règle
  SELECT * INTO v_rule 
  FROM security_alert_rules 
  WHERE code = p_rule_code AND is_enabled = true;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Vérifier les seuils si nécessaire
  IF v_rule.threshold_count > 1 THEN
    -- Incrémenter ou créer le compteur
    INSERT INTO security_event_counters (
      rule_id, user_id, ip_address, event_type, counter, window_end
    ) VALUES (
      v_rule.id, p_user_id, p_ip_address, v_rule.event_type, 1, 
      now() + (v_rule.threshold_window_minutes || ' minutes')::interval
    )
    ON CONFLICT (rule_id, user_id, ip_address, event_type, window_start) 
    DO UPDATE SET 
      counter = security_event_counters.counter + 1,
      last_event_at = now()
    RETURNING counter INTO v_counter_count;
    
    -- Si le seuil n'est pas atteint, ne pas créer d'alerte
    IF v_counter_count < v_rule.threshold_count THEN
      RETURN NULL;
    END IF;
  END IF;
  
  -- Créer l'alerte
  INSERT INTO security_alert_events (
    rule_id, title, description, category, severity, risk_score,
    user_id, user_email, ip_address, user_agent, event_type,
    event_data, evidence, source_module
  ) VALUES (
    v_rule.id, v_rule.name, v_rule.description, v_rule.category,
    v_rule.severity, v_rule.risk_score, p_user_id, p_user_email,
    p_ip_address, p_user_agent, v_rule.event_type, p_event_data,
    p_evidence, COALESCE(p_event_data->>'module', 'system')
  )
  RETURNING id INTO v_alert_id;
  
  RETURN v_alert_id;
END;
$$;

-- =============================================
-- Function: Mettre à jour le statut d'une alerte
-- =============================================
CREATE OR REPLACE FUNCTION public.update_alert_status(
  p_alert_id UUID,
  p_new_status alert_status,
  p_comment TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status alert_status;
BEGIN
  SELECT status INTO v_old_status 
  FROM security_alert_events 
  WHERE id = p_alert_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Mettre à jour l'alerte
  UPDATE security_alert_events 
  SET 
    status = p_new_status,
    acknowledged_at = CASE WHEN p_new_status = 'acknowledged' THEN now() ELSE acknowledged_at END,
    acknowledged_by = CASE WHEN p_new_status = 'acknowledged' THEN p_user_id ELSE acknowledged_by END,
    resolved_at = CASE WHEN p_new_status = 'resolved' THEN now() ELSE resolved_at END,
    resolved_by = CASE WHEN p_new_status = 'resolved' THEN p_user_id ELSE resolved_by END,
    resolution_notes = CASE WHEN p_new_status = 'resolved' THEN COALESCE(p_comment, resolution_notes) ELSE resolution_notes END
  WHERE id = p_alert_id;
  
  -- Enregistrer dans l'historique
  INSERT INTO security_alert_history (
    alert_id, action, from_status, to_status, comment, performed_by
  ) VALUES (
    p_alert_id, 'status_change', v_old_status, p_new_status, p_comment, p_user_id
  );
  
  RETURN true;
END;
$$;
