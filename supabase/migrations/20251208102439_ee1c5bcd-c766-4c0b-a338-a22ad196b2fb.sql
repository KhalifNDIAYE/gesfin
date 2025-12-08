
-- Add exceptional override fields to journal_entries
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS is_exceptional_override boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS override_reason text,
ADD COLUMN IF NOT EXISTS override_requested_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS override_requested_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS director_override_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS director_override_approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS director_override_approved_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS admin_override_approved boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_override_approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS admin_override_approved_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS override_amount numeric,
ADD COLUMN IF NOT EXISTS override_status text DEFAULT 'none' CHECK (override_status IN ('none', 'pending_director', 'pending_admin', 'approved', 'rejected'));

-- Create exceptional overrides log table for detailed tracking
CREATE TABLE IF NOT EXISTS public.exceptional_overrides_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  budget_line_id uuid REFERENCES budget_lines(id),
  budget_id uuid REFERENCES budgets(id),
  project_id uuid REFERENCES projects(id),
  requested_amount numeric NOT NULL,
  budget_available numeric NOT NULL,
  override_amount numeric NOT NULL,
  override_percentage numeric NOT NULL,
  override_reason text NOT NULL,
  requested_by uuid REFERENCES profiles(id),
  requested_at timestamp with time zone DEFAULT now(),
  director_decision text CHECK (director_decision IN ('pending', 'approved', 'rejected')),
  director_decided_by uuid REFERENCES profiles(id),
  director_decided_at timestamp with time zone,
  director_comment text,
  admin_decision text CHECK (admin_decision IN ('pending', 'approved', 'rejected')),
  admin_decided_by uuid REFERENCES profiles(id),
  admin_decided_at timestamp with time zone,
  admin_comment text,
  final_status text DEFAULT 'pending' CHECK (final_status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exceptional_overrides_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for exceptional_overrides_log
CREATE POLICY "Authenticated users can view exceptional overrides"
  ON public.exceptional_overrides_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can insert overrides"
  ON public.exceptional_overrides_log FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'comptabilite'::module_name, 'create'::permission_type));

CREATE POLICY "Directors and admins can update overrides"
  ON public.exceptional_overrides_log FOR UPDATE
  USING (
    has_role(auth.uid(), 'dg') OR 
    has_role(auth.uid(), 'admin') OR
    is_admin(auth.uid())
  );

-- Function to request an exceptional override
CREATE OR REPLACE FUNCTION public.request_exceptional_override(
  _entry_id uuid,
  _budget_line_id uuid,
  _requested_amount numeric,
  _override_reason text,
  _user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _budget_line record;
  _budget record;
  _project_id uuid;
  _budget_available numeric;
  _override_amount numeric;
  _override_percentage numeric;
  _override_log_id uuid;
  _user_email text;
BEGIN
  -- Get budget line info
  SELECT bl.*, b.id as budget_id, b.name as budget_name
  INTO _budget_line
  FROM budget_lines bl
  JOIN budgets b ON bl.budget_id = b.id
  WHERE bl.id = _budget_line_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Ligne budgétaire non trouvée');
  END IF;
  
  -- Calculate available budget and override amount
  _budget_available := COALESCE(_budget_line.forecast_amount, 0) 
                      - COALESCE(_budget_line.committed_amount, 0) 
                      - COALESCE(_budget_line.realized_amount, 0);
  
  -- If budget is available, no override needed
  IF _budget_available >= _requested_amount THEN
    RETURN json_build_object('success', false, 'error', 'Budget suffisant, dépassement non nécessaire');
  END IF;
  
  _override_amount := _requested_amount - GREATEST(_budget_available, 0);
  _override_percentage := CASE 
    WHEN COALESCE(_budget_line.forecast_amount, 0) > 0 
    THEN ((_requested_amount + COALESCE(_budget_line.committed_amount, 0) + COALESCE(_budget_line.realized_amount, 0)) / _budget_line.forecast_amount * 100) - 100
    ELSE 100
  END;
  
  -- Get project_id from entry
  SELECT project_id INTO _project_id FROM journal_entries WHERE id = _entry_id;
  
  -- Create override log entry
  INSERT INTO exceptional_overrides_log (
    journal_entry_id,
    budget_line_id,
    budget_id,
    project_id,
    requested_amount,
    budget_available,
    override_amount,
    override_percentage,
    override_reason,
    requested_by,
    director_decision,
    admin_decision
  ) VALUES (
    _entry_id,
    _budget_line_id,
    _budget_line.budget_id,
    _project_id,
    _requested_amount,
    _budget_available,
    _override_amount,
    _override_percentage,
    _override_reason,
    _user_id,
    'pending',
    'pending'
  )
  RETURNING id INTO _override_log_id;
  
  -- Update the journal entry
  UPDATE journal_entries
  SET 
    is_exceptional_override = true,
    override_reason = _override_reason,
    override_requested_at = now(),
    override_requested_by = _user_id,
    override_amount = _override_amount,
    override_status = 'pending_director'
  WHERE id = _entry_id;
  
  -- Log in audit
  SELECT email INTO _user_email FROM profiles WHERE id = _user_id;
  
  INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, new_values)
  VALUES (
    _user_id,
    _user_email,
    'exceptional_override_requested',
    'comptabilite',
    'expense',
    _entry_id::text,
    jsonb_build_object(
      'override_log_id', _override_log_id,
      'override_amount', _override_amount,
      'override_percentage', _override_percentage,
      'reason', _override_reason
    )
  );
  
  -- Create notifications for Director (DG)
  INSERT INTO notifications (user_id, type, severity, module, title, message, related_entity_type, related_entity_id, direct_link, triggered_by)
  SELECT 
    ur.user_id,
    'validation',
    'warning',
    'comptabilite',
    'Demande de dépassement exceptionnel',
    'Une demande de dépassement de ' || _override_amount::text || ' XOF (' || round(_override_percentage, 1)::text || '%) attend votre validation',
    'expense',
    _entry_id::text,
    '/comptabilite/depassements',
    _user_id
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE r.name = 'dg';
  
  RETURN json_build_object(
    'success', true, 
    'override_log_id', _override_log_id,
    'override_amount', _override_amount,
    'override_percentage', _override_percentage
  );
END;
$$;

-- Function for Director to approve/reject override
CREATE OR REPLACE FUNCTION public.process_director_override_decision(
  _override_log_id uuid,
  _decision text,
  _comment text,
  _user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _override_log record;
  _user_email text;
  _is_director boolean;
BEGIN
  -- Check if user is director
  SELECT has_role(_user_id, 'dg') OR is_admin(_user_id) INTO _is_director;
  
  IF NOT _is_director THEN
    RETURN json_build_object('success', false, 'error', 'Seul le Directeur peut valider cette demande');
  END IF;
  
  -- Get override log
  SELECT * INTO _override_log FROM exceptional_overrides_log WHERE id = _override_log_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Demande de dépassement non trouvée');
  END IF;
  
  IF _override_log.director_decision != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Cette demande a déjà été traitée par le Directeur');
  END IF;
  
  -- Update override log
  UPDATE exceptional_overrides_log
  SET 
    director_decision = _decision,
    director_decided_by = _user_id,
    director_decided_at = now(),
    director_comment = _comment,
    final_status = CASE WHEN _decision = 'rejected' THEN 'rejected' ELSE 'pending' END
  WHERE id = _override_log_id;
  
  -- Update journal entry
  UPDATE journal_entries
  SET 
    director_override_approved = (_decision = 'approved'),
    director_override_approved_at = now(),
    director_override_approved_by = _user_id,
    override_status = CASE 
      WHEN _decision = 'approved' THEN 'pending_admin'
      ELSE 'rejected'
    END
  WHERE id = _override_log.journal_entry_id;
  
  -- Log in audit
  SELECT email INTO _user_email FROM profiles WHERE id = _user_id;
  
  INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, new_values)
  VALUES (
    _user_id,
    _user_email,
    'exceptional_override_director_' || _decision,
    'comptabilite',
    'expense',
    _override_log.journal_entry_id::text,
    jsonb_build_object('decision', _decision, 'comment', _comment)
  );
  
  -- If approved, notify admin
  IF _decision = 'approved' THEN
    INSERT INTO notifications (user_id, type, severity, module, title, message, related_entity_type, related_entity_id, direct_link, triggered_by)
    SELECT 
      ur.user_id,
      'validation',
      'warning',
      'comptabilite',
      'Dépassement approuvé par DG - Validation admin requise',
      'Un dépassement de ' || _override_log.override_amount::text || ' XOF attend votre validation finale',
      'expense',
      _override_log.journal_entry_id::text,
      '/comptabilite/depassements',
      _user_id
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE r.name = 'admin';
  END IF;
  
  RETURN json_build_object('success', true, 'decision', _decision);
END;
$$;

-- Function for Admin to approve/reject override (final decision)
CREATE OR REPLACE FUNCTION public.process_admin_override_decision(
  _override_log_id uuid,
  _decision text,
  _comment text,
  _user_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _override_log record;
  _user_email text;
  _is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT is_admin(_user_id) INTO _is_admin;
  
  IF NOT _is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Seul l''Administrateur peut valider cette demande');
  END IF;
  
  -- Get override log
  SELECT * INTO _override_log FROM exceptional_overrides_log WHERE id = _override_log_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Demande de dépassement non trouvée');
  END IF;
  
  IF _override_log.director_decision != 'approved' THEN
    RETURN json_build_object('success', false, 'error', 'Le Directeur doit d''abord approuver cette demande');
  END IF;
  
  IF _override_log.admin_decision != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'Cette demande a déjà été traitée par l''Administrateur');
  END IF;
  
  -- Update override log
  UPDATE exceptional_overrides_log
  SET 
    admin_decision = _decision,
    admin_decided_by = _user_id,
    admin_decided_at = now(),
    admin_comment = _comment,
    final_status = _decision
  WHERE id = _override_log_id;
  
  -- Update journal entry
  UPDATE journal_entries
  SET 
    admin_override_approved = (_decision = 'approved'),
    admin_override_approved_at = now(),
    admin_override_approved_by = _user_id,
    override_status = _decision
  WHERE id = _override_log.journal_entry_id;
  
  -- Log in audit
  SELECT email INTO _user_email FROM profiles WHERE id = _user_id;
  
  INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, new_values)
  VALUES (
    _user_id,
    _user_email,
    'exceptional_override_admin_' || _decision,
    'comptabilite',
    'expense',
    _override_log.journal_entry_id::text,
    jsonb_build_object('decision', _decision, 'comment', _comment, 'final', true)
  );
  
  -- Notify the requester
  INSERT INTO notifications (user_id, type, severity, module, title, message, related_entity_type, related_entity_id, direct_link, triggered_by)
  VALUES (
    _override_log.requested_by,
    'validation',
    CASE WHEN _decision = 'approved' THEN 'success' ELSE 'error' END,
    'comptabilite',
    CASE WHEN _decision = 'approved' THEN 'Dépassement approuvé' ELSE 'Dépassement rejeté' END,
    CASE WHEN _decision = 'approved' 
      THEN 'Votre demande de dépassement de ' || _override_log.override_amount::text || ' XOF a été approuvée'
      ELSE 'Votre demande de dépassement a été rejetée: ' || COALESCE(_comment, 'Aucun motif')
    END,
    'expense',
    _override_log.journal_entry_id::text,
    '/comptabilite/depenses',
    _user_id
  );
  
  RETURN json_build_object('success', true, 'decision', _decision, 'final', true);
END;
$$;
