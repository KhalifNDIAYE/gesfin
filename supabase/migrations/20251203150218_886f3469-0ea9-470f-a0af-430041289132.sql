-- Remove unused SMTP credential columns from email_notification_settings
-- These are not used since the system uses Resend API for email delivery
ALTER TABLE public.email_notification_settings 
  DROP COLUMN IF EXISTS smtp_host,
  DROP COLUMN IF EXISTS smtp_port,
  DROP COLUMN IF EXISTS smtp_username,
  DROP COLUMN IF EXISTS smtp_password;