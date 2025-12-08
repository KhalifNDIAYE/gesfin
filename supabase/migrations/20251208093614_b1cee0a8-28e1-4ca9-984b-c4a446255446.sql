-- Add new alert types for budget thresholds
INSERT INTO email_alert_types (alert_type, name, description, is_enabled, send_immediately, severity)
VALUES 
  ('budget_warning_80', 'Alerte budgétaire préventive (80%)', 'Alerte envoyée lorsqu''une ligne budgétaire atteint 80% de consommation', true, true, 'warning'),
  ('budget_warning_90', 'Alerte budgétaire critique (90%)', 'Alerte envoyée lorsqu''une ligne budgétaire atteint 90% de consommation', true, true, 'major')
ON CONFLICT (alert_type) DO NOTHING;

-- Update alert type labels in send-alert-email function will be handled in code