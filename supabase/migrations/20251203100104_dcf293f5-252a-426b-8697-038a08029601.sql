-- Create table for security blocked actions logging
CREATE TABLE public.security_blocked_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- User information
  user_id UUID REFERENCES public.profiles(id),
  user_email TEXT,
  user_full_name TEXT,
  user_roles TEXT[], -- Array of role names
  
  -- Technical information
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  operating_system TEXT,
  device_type TEXT, -- desktop, mobile, tablet
  
  -- Security information
  module TEXT NOT NULL, -- bailleurs, comptabilite, etc.
  action_attempted TEXT NOT NULL, -- create, update, delete, validate, export, import, read
  resource_type TEXT, -- bailleur, convention, etc.
  resource_id TEXT, -- ID of the targeted resource
  permission_required TEXT NOT NULL, -- The permission that was needed
  permissions_held TEXT[], -- Permissions the user actually has
  status TEXT NOT NULL DEFAULT 'REFUSED',
  
  -- Temporal information
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  timezone TEXT DEFAULT 'UTC',
  
  -- Source of blocking
  block_source TEXT NOT NULL, -- ui, api, url_forced
  request_url TEXT,
  request_method TEXT,
  
  -- Severity level (calculated based on action type)
  severity TEXT NOT NULL DEFAULT 'low', -- low, medium, critical
  
  -- Additional context
  additional_context JSONB,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_security_blocked_actions_user_id ON public.security_blocked_actions(user_id);
CREATE INDEX idx_security_blocked_actions_timestamp ON public.security_blocked_actions(timestamp DESC);
CREATE INDEX idx_security_blocked_actions_module ON public.security_blocked_actions(module);
CREATE INDEX idx_security_blocked_actions_severity ON public.security_blocked_actions(severity);
CREATE INDEX idx_security_blocked_actions_user_email ON public.security_blocked_actions(user_email);

-- Enable RLS
ALTER TABLE public.security_blocked_actions ENABLE ROW LEVEL SECURITY;

-- Only admins can view blocked actions
CREATE POLICY "Only admins can view security blocked actions"
ON public.security_blocked_actions
FOR SELECT
USING (public.is_admin(auth.uid()));

-- System can insert logs (using service role or security definer function)
CREATE POLICY "System can insert security logs"
ON public.security_blocked_actions
FOR INSERT
WITH CHECK (true);

-- No updates or deletes allowed (immutable logs)
-- No UPDATE or DELETE policies = no one can modify/delete

-- Create function to log blocked actions
CREATE OR REPLACE FUNCTION public.log_blocked_action(
  _user_id UUID,
  _user_email TEXT,
  _user_full_name TEXT,
  _user_roles TEXT[],
  _ip_address TEXT,
  _user_agent TEXT,
  _browser TEXT,
  _operating_system TEXT,
  _device_type TEXT,
  _module TEXT,
  _action_attempted TEXT,
  _resource_type TEXT,
  _resource_id TEXT,
  _permission_required TEXT,
  _permissions_held TEXT[],
  _block_source TEXT,
  _request_url TEXT,
  _request_method TEXT,
  _additional_context JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id UUID;
  _severity TEXT;
BEGIN
  -- Calculate severity based on action and module
  _severity := CASE
    WHEN _module IN ('securite', 'utilisateurs', 'parametres') AND _action_attempted IN ('delete', 'update') THEN 'critical'
    WHEN _action_attempted = 'delete' THEN 'medium'
    WHEN _action_attempted IN ('create', 'update', 'validate') THEN 'medium'
    ELSE 'low'
  END;
  
  -- Insert the blocked action log
  INSERT INTO public.security_blocked_actions (
    user_id,
    user_email,
    user_full_name,
    user_roles,
    ip_address,
    user_agent,
    browser,
    operating_system,
    device_type,
    module,
    action_attempted,
    resource_type,
    resource_id,
    permission_required,
    permissions_held,
    block_source,
    request_url,
    request_method,
    severity,
    additional_context,
    timezone
  ) VALUES (
    _user_id,
    _user_email,
    _user_full_name,
    _user_roles,
    _ip_address,
    _user_agent,
    _browser,
    _operating_system,
    _device_type,
    _module,
    _action_attempted,
    _resource_type,
    _resource_id,
    _permission_required,
    _permissions_held,
    _block_source,
    _request_url,
    _request_method,
    _severity,
    _additional_context,
    COALESCE(current_setting('TIMEZONE', true), 'UTC')
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.log_blocked_action TO authenticated;