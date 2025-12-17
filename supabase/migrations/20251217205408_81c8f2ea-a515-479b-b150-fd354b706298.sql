-- =============================================
-- MOTEUR DE CORRÉLATION D'ÉVÉNEMENTS IA
-- =============================================

-- Types pour le moteur IA
CREATE TYPE correlation_type AS ENUM ('temporal', 'behavioral', 'contextual', 'data_sensitive');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE ai_decision_type AS ENUM ('alert_created', 'risk_score_updated', 'auto_response_triggered', 'baseline_updated', 'pattern_detected');
CREATE TYPE auto_response_type AS ENUM ('account_lock', 'force_logout', 'mfa_required', 'rssi_alert', 'quarantine');

-- Table des patterns de corrélation IA
CREATE TABLE ai_correlation_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  correlation_type correlation_type NOT NULL,
  event_types TEXT[] NOT NULL DEFAULT '{}',
  time_window_minutes INTEGER DEFAULT 60,
  min_events_threshold INTEGER DEFAULT 2,
  risk_weight NUMERIC(3,2) DEFAULT 1.0,
  detection_logic JSONB DEFAULT '{}',
  is_ai_learned BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des baselines comportementales utilisateur
CREATE TABLE user_behavioral_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  baseline_type TEXT NOT NULL, -- 'login_times', 'access_patterns', 'actions_frequency', etc.
  baseline_data JSONB NOT NULL DEFAULT '{}',
  sample_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, baseline_type)
);

-- Table des scores de risque utilisateur
CREATE TABLE user_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  current_score NUMERIC(5,2) DEFAULT 0,
  risk_level risk_level DEFAULT 'low',
  score_factors JSONB DEFAULT '[]',
  last_events JSONB DEFAULT '[]',
  anomalies_detected INTEGER DEFAULT 0,
  auto_responses_triggered INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index unique pour score actuel par utilisateur
CREATE UNIQUE INDEX idx_user_risk_scores_current ON user_risk_scores(user_id) WHERE session_id IS NULL;

-- Table des alertes corrélées IA
CREATE TABLE ai_correlated_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  correlation_type correlation_type NOT NULL,
  pattern_id UUID REFERENCES ai_correlation_patterns(id),
  user_id UUID REFERENCES profiles(id),
  user_email TEXT,
  risk_score NUMERIC(5,2) NOT NULL,
  risk_level risk_level NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  
  -- Événements corrélés
  correlated_event_ids UUID[] DEFAULT '{}',
  correlated_events JSONB DEFAULT '[]',
  event_count INTEGER DEFAULT 0,
  time_span_minutes INTEGER,
  
  -- Explications IA
  ai_reasoning TEXT,
  risk_factors JSONB DEFAULT '[]',
  detection_confidence NUMERIC(3,2) DEFAULT 0.5,
  
  -- Chronologie
  first_event_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  
  -- Status et workflow
  status TEXT DEFAULT 'new',
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  
  -- Auto-réponses
  auto_responses_applied TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table des événements sources pour corrélation
CREATE TABLE ai_correlation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlated_alert_id UUID REFERENCES ai_correlated_alerts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL, -- 'audit_logs', 'security_blocked_actions', 'security_alert_events', etc.
  event_id UUID,
  event_timestamp TIMESTAMPTZ NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_id UUID,
  ip_address TEXT,
  risk_contribution NUMERIC(3,2) DEFAULT 0,
  sequence_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table d'audit des décisions IA
CREATE TABLE ai_decisions_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type ai_decision_type NOT NULL,
  related_alert_id UUID REFERENCES ai_correlated_alerts(id),
  related_user_id UUID REFERENCES profiles(id),
  
  -- Entrées de la décision
  input_data JSONB NOT NULL DEFAULT '{}',
  
  -- Sortie de l'IA
  ai_model TEXT DEFAULT 'google/gemini-2.5-flash',
  ai_response JSONB DEFAULT '{}',
  confidence_score NUMERIC(3,2),
  processing_time_ms INTEGER,
  
  -- Décision prise
  decision_made TEXT NOT NULL,
  decision_reasoning TEXT,
  
  -- Auto-réponse
  auto_response_type auto_response_type,
  auto_response_executed BOOLEAN DEFAULT false,
  auto_response_result JSONB,
  
  -- Conformité
  is_explainable BOOLEAN DEFAULT true,
  compliance_tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table de configuration du moteur IA
CREATE TABLE ai_engine_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_critical BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insérer les patterns de corrélation par défaut
INSERT INTO ai_correlation_patterns (code, name, description, correlation_type, event_types, time_window_minutes, min_events_threshold, risk_weight, detection_logic) VALUES
-- Corrélations temporelles
('BRUTE_FORCE_ESCALATION', 'Escalade après échecs multiples', 'Plusieurs échecs d''authentification suivis d''un accès réussi puis export de données', 'temporal', ARRAY['auth_failure', 'auth_success', 'data_export'], 30, 3, 1.5, '{"sequence_required": true, "min_failures": 3}'),
('RAPID_PRIVILEGE_USE', 'Utilisation rapide de privilèges', 'Changement de permissions suivi d''accès à données sensibles', 'temporal', ARRAY['permission_change', 'sensitive_access'], 15, 2, 1.3, '{"sequence_required": true}'),
('MASS_DATA_ACCESS', 'Accès massif aux données', 'Téléchargements multiples dans une fenêtre courte', 'temporal', ARRAY['document_download', 'data_export'], 10, 5, 1.4, '{"count_threshold": 5}'),

-- Corrélations comportementales
('UNUSUAL_LOGIN_TIME', 'Connexion hors horaires', 'Connexion en dehors des heures habituelles de l''utilisateur', 'behavioral', ARRAY['auth_success'], 60, 1, 1.2, '{"check_baseline": "login_times", "deviation_threshold": 2}'),
('UNUSUAL_LOCATION', 'Localisation inhabituelle', 'Connexion depuis un pays ou IP inhabituel', 'behavioral', ARRAY['auth_success'], 60, 1, 1.5, '{"check_baseline": "locations", "new_location": true}'),
('ROLE_ANOMALY', 'Comportement inhabituel par rôle', 'Actions non typiques pour le rôle de l''utilisateur', 'behavioral', ARRAY['any_action'], 60, 3, 1.3, '{"check_baseline": "role_actions"}'),

-- Corrélations contextuelles
('GEO_EXPORT_COMBO', 'Export depuis localisation suspecte', 'Export de données depuis un nouveau pays', 'contextual', ARRAY['auth_success', 'data_export'], 60, 2, 1.8, '{"requires_new_location": true, "requires_export": true}'),
('OFF_HOURS_CRITICAL', 'Modification critique hors horaires', 'Modification de configuration critique en dehors des heures normales', 'contextual', ARRAY['config_change', 'permission_change'], 60, 1, 1.6, '{"check_business_hours": true, "critical_only": true}'),
('PERMISSION_SENSITIVE_COMBO', 'Changement permissions + accès sensible', 'Modification de permissions suivie d''accès à données sensibles', 'contextual', ARRAY['permission_change', 'sensitive_access'], 30, 2, 1.7, '{"sequence_required": true}'),

-- Corrélations sur données sensibles
('ACCESS_DENIED_THEN_DOWNLOAD', 'Téléchargement après refus', 'Téléchargement massif après plusieurs accès refusés', 'data_sensitive', ARRAY['access_denied', 'document_download'], 60, 3, 1.9, '{"min_denials": 2, "min_downloads": 3}'),
('CRITICAL_DELETE_AFTER_MODIFY', 'Suppression après modification', 'Suppression de documents critiques après modification', 'data_sensitive', ARRAY['document_modify', 'document_delete'], 30, 2, 2.0, '{"critical_docs_only": true}'),
('MASS_EXPORT_PATTERN', 'Pattern d''exfiltration', 'Comportement suggérant une exfiltration de données', 'data_sensitive', ARRAY['document_download', 'data_export', 'api_call'], 120, 10, 2.5, '{"volume_threshold": "high"}');

-- Insérer les paramètres par défaut du moteur IA
INSERT INTO ai_engine_settings (setting_key, setting_value, description, is_critical) VALUES
('ai_enabled', 'true', 'Activer/désactiver le moteur IA', true),
('auto_response_enabled', 'true', 'Activer les réponses automatiques', true),
('risk_score_thresholds', '{"low": 25, "medium": 50, "high": 75, "critical": 90}', 'Seuils pour les niveaux de risque', false),
('baseline_learning_period_days', '30', 'Période d''apprentissage pour les baselines', false),
('max_events_per_correlation', '100', 'Nombre maximum d''événements par corrélation', false),
('auto_lock_threshold', '90', 'Score de risque pour verrouillage automatique', true),
('rssi_alert_threshold', '75', 'Score de risque pour alerte RSSI', false),
('correlation_window_max_hours', '24', 'Fenêtre maximale pour corrélation', false);

-- RLS Policies
ALTER TABLE ai_correlation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_behavioral_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_correlated_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_correlation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_decisions_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_engine_settings ENABLE ROW LEVEL SECURITY;

-- Policies pour patterns (lecture publique, écriture admin)
CREATE POLICY "Patterns readable by authenticated" ON ai_correlation_patterns FOR SELECT TO authenticated USING (true);
CREATE POLICY "Patterns writable by admin" ON ai_correlation_patterns FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Policies pour baselines (utilisateur voit le sien, admin voit tout)
CREATE POLICY "User sees own baseline" ON user_behavioral_baselines FOR SELECT TO authenticated 
USING (user_id = auth.uid() OR is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite', 'read'));
CREATE POLICY "System can manage baselines" ON user_behavioral_baselines FOR ALL TO authenticated 
USING (is_admin(auth.uid()));

-- Policies pour scores de risque
CREATE POLICY "User sees own risk score" ON user_risk_scores FOR SELECT TO authenticated 
USING (user_id = auth.uid() OR is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite', 'read'));
CREATE POLICY "Admin manages risk scores" ON user_risk_scores FOR ALL TO authenticated 
USING (is_admin(auth.uid()));

-- Policies pour alertes corrélées
CREATE POLICY "Security users see alerts" ON ai_correlated_alerts FOR SELECT TO authenticated 
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite', 'read'));
CREATE POLICY "Admin manages alerts" ON ai_correlated_alerts FOR ALL TO authenticated 
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite', 'update'));

-- Policies pour événements de corrélation
CREATE POLICY "Security users see correlation events" ON ai_correlation_events FOR SELECT TO authenticated 
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite', 'read'));
CREATE POLICY "System manages correlation events" ON ai_correlation_events FOR ALL TO authenticated 
USING (is_admin(auth.uid()));

-- Policies pour audit IA
CREATE POLICY "Security users see AI audit" ON ai_decisions_audit FOR SELECT TO authenticated 
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite', 'read'));
CREATE POLICY "System can create AI audit" ON ai_decisions_audit FOR INSERT TO authenticated WITH CHECK (true);

-- Policies pour paramètres
CREATE POLICY "Settings readable by security users" ON ai_engine_settings FOR SELECT TO authenticated 
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite', 'read'));
CREATE POLICY "Settings writable by admin" ON ai_engine_settings FOR ALL TO authenticated 
USING (is_admin(auth.uid()));

-- Index pour performances
CREATE INDEX idx_ai_correlated_alerts_user ON ai_correlated_alerts(user_id);
CREATE INDEX idx_ai_correlated_alerts_status ON ai_correlated_alerts(status);
CREATE INDEX idx_ai_correlated_alerts_created ON ai_correlated_alerts(created_at DESC);
CREATE INDEX idx_ai_correlated_alerts_risk ON ai_correlated_alerts(risk_level, risk_score DESC);
CREATE INDEX idx_ai_correlation_events_alert ON ai_correlation_events(correlated_alert_id);
CREATE INDEX idx_user_risk_scores_user ON user_risk_scores(user_id);
CREATE INDEX idx_user_behavioral_baselines_user ON user_behavioral_baselines(user_id);
CREATE INDEX idx_ai_decisions_audit_type ON ai_decisions_audit(decision_type);
CREATE INDEX idx_ai_decisions_audit_created ON ai_decisions_audit(created_at DESC);

-- Fonction pour calculer le score de risque
CREATE OR REPLACE FUNCTION calculate_user_risk_score(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_base_score NUMERIC := 0;
  v_factors JSONB := '[]';
  v_recent_alerts INTEGER;
  v_blocked_actions INTEGER;
  v_anomalies INTEGER;
  v_risk_level risk_level;
  v_thresholds JSONB;
BEGIN
  -- Récupérer les seuils
  SELECT setting_value INTO v_thresholds
  FROM ai_engine_settings WHERE setting_key = 'risk_score_thresholds';
  
  IF v_thresholds IS NULL THEN
    v_thresholds := '{"low": 25, "medium": 50, "high": 75, "critical": 90}';
  END IF;
  
  -- Compter les alertes récentes (24h)
  SELECT COUNT(*) INTO v_recent_alerts
  FROM security_alert_events
  WHERE user_id = p_user_id AND created_at > now() - interval '24 hours';
  
  IF v_recent_alerts > 0 THEN
    v_base_score := v_base_score + (v_recent_alerts * 10);
    v_factors := v_factors || jsonb_build_object(
      'factor', 'recent_alerts',
      'count', v_recent_alerts,
      'contribution', v_recent_alerts * 10
    );
  END IF;
  
  -- Compter les actions bloquées (24h)
  SELECT COUNT(*) INTO v_blocked_actions
  FROM security_blocked_actions
  WHERE user_id = p_user_id AND blocked_at > now() - interval '24 hours';
  
  IF v_blocked_actions > 0 THEN
    v_base_score := v_base_score + (v_blocked_actions * 15);
    v_factors := v_factors || jsonb_build_object(
      'factor', 'blocked_actions',
      'count', v_blocked_actions,
      'contribution', v_blocked_actions * 15
    );
  END IF;
  
  -- Compter les alertes corrélées non résolues
  SELECT COUNT(*) INTO v_anomalies
  FROM ai_correlated_alerts
  WHERE user_id = p_user_id AND status NOT IN ('resolved', 'false_positive');
  
  IF v_anomalies > 0 THEN
    v_base_score := v_base_score + (v_anomalies * 20);
    v_factors := v_factors || jsonb_build_object(
      'factor', 'correlated_anomalies',
      'count', v_anomalies,
      'contribution', v_anomalies * 20
    );
  END IF;
  
  -- Plafonner à 100
  v_base_score := LEAST(v_base_score, 100);
  
  -- Déterminer le niveau de risque
  v_risk_level := CASE
    WHEN v_base_score >= (v_thresholds->>'critical')::numeric THEN 'critical'
    WHEN v_base_score >= (v_thresholds->>'high')::numeric THEN 'high'
    WHEN v_base_score >= (v_thresholds->>'medium')::numeric THEN 'medium'
    ELSE 'low'
  END;
  
  -- Mettre à jour ou créer le score
  INSERT INTO user_risk_scores (user_id, current_score, risk_level, score_factors, anomalies_detected, last_calculated_at)
  VALUES (p_user_id, v_base_score, v_risk_level, v_factors, v_anomalies, now())
  ON CONFLICT (user_id) WHERE session_id IS NULL
  DO UPDATE SET
    current_score = v_base_score,
    risk_level = v_risk_level,
    score_factors = v_factors,
    anomalies_detected = v_anomalies,
    last_calculated_at = now(),
    updated_at = now();
  
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'score', v_base_score,
    'level', v_risk_level,
    'factors', v_factors
  );
END;
$$;