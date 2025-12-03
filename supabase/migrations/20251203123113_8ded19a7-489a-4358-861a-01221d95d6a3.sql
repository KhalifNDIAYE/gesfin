-- Table des notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('budget_overrun', 'project_late', 'convention_expired', 'blocked_action', 'validation_pending', 'backup_status', 'system_info')),
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  module text,
  title text NOT NULL,
  message text NOT NULL,
  related_entity_type text,
  related_entity_id text,
  related_entity_name text,
  direct_link text,
  triggered_by uuid REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  read_at timestamp with time zone,
  archived_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Index pour les performances
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies: users see their own notifications, admins see all
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications FOR SELECT 
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications FOR UPDATE 
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "System can insert notifications" 
  ON public.notifications FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications FOR DELETE 
  USING (user_id = auth.uid() OR is_admin(auth.uid()));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Function to create notification for specific user
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _type text,
  _severity text,
  _module text,
  _title text,
  _message text,
  _related_entity_type text DEFAULT NULL,
  _related_entity_id text DEFAULT NULL,
  _related_entity_name text DEFAULT NULL,
  _direct_link text DEFAULT NULL,
  _triggered_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, severity, module, title, message,
    related_entity_type, related_entity_id, related_entity_name,
    direct_link, triggered_by
  ) VALUES (
    _user_id, _type, _severity, _module, _title, _message,
    _related_entity_type, _related_entity_id, _related_entity_name,
    _direct_link, _triggered_by
  )
  RETURNING id INTO _notification_id;
  
  RETURN _notification_id;
END;
$$;

-- Function to create notification for users with specific permission
CREATE OR REPLACE FUNCTION public.create_notification_for_permission(
  _module module_name,
  _permission permission_type,
  _type text,
  _severity text,
  _notification_module text,
  _title text,
  _message text,
  _related_entity_type text DEFAULT NULL,
  _related_entity_id text DEFAULT NULL,
  _related_entity_name text DEFAULT NULL,
  _direct_link text DEFAULT NULL,
  _triggered_by uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_record RECORD;
BEGIN
  FOR _user_record IN
    SELECT DISTINCT ur.user_id
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE p.module = _module AND p.permission = _permission
    UNION
    SELECT ur.user_id
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE r.name = 'admin'
  LOOP
    INSERT INTO public.notifications (
      user_id, type, severity, module, title, message,
      related_entity_type, related_entity_id, related_entity_name,
      direct_link, triggered_by
    ) VALUES (
      _user_record.user_id, _type, _severity, _notification_module, _title, _message,
      _related_entity_type, _related_entity_id, _related_entity_name,
      _direct_link, _triggered_by
    );
  END LOOP;
END;
$$;