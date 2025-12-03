-- Add new roles for expense validation workflow
INSERT INTO public.roles (name, description, is_system)
VALUES 
  ('daf', 'Directeur Administratif et Financier', true),
  ('dt', 'Directeur Technique', true),
  ('dg', 'Directeur Général', true)
ON CONFLICT (name) DO NOTHING;

-- Create expense workflow status enum
DO $$ BEGIN
  CREATE TYPE public.expense_status AS ENUM (
    'brouillon',
    'soumise',
    'en_validation_daf',
    'en_validation_dt',
    'en_validation_dg',
    'validee',
    'rejetee',
    'payee'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add workflow columns to journal_entries
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS expense_workflow_status text DEFAULT 'brouillon',
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id),
ADD COLUMN IF NOT EXISTS budget_line_id uuid REFERENCES public.budget_lines(id),
ADD COLUMN IF NOT EXISTS requested_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS daf_validated_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS daf_validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS dt_validated_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS dt_validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS dg_validated_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS dg_validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS paid_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;

-- Create expense validation history table
CREATE TABLE IF NOT EXISTS public.expense_validation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  from_status text NOT NULL,
  to_status text NOT NULL,
  action text NOT NULL,
  comment text,
  performed_by uuid REFERENCES public.profiles(id),
  performed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_validation_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_validation_history
CREATE POLICY "Authenticated users can view expense validation history"
  ON public.expense_validation_history
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can insert validation history"
  ON public.expense_validation_history
  FOR INSERT
  WITH CHECK (has_permission(auth.uid(), 'comptabilite'::module_name, 'create'::permission_type));

-- Function to check budget availability
CREATE OR REPLACE FUNCTION public.check_budget_availability(_budget_line_id uuid, _amount numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _available numeric;
BEGIN
  SELECT COALESCE(forecast_amount, 0) - COALESCE(committed_amount, 0) - COALESCE(realized_amount, 0)
  INTO _available
  FROM budget_lines
  WHERE id = _budget_line_id;
  
  RETURN COALESCE(_available, 0) >= _amount;
END;
$$;

-- Function to validate expense workflow transition
CREATE OR REPLACE FUNCTION public.validate_expense_transition(
  _entry_id uuid,
  _new_status text,
  _user_id uuid,
  _comment text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_status text;
  _entry_creator uuid;
  _is_valid boolean := false;
  _user_role text;
  _result json;
BEGIN
  -- Get current entry info
  SELECT expense_workflow_status, created_by INTO _current_status, _entry_creator
  FROM journal_entries WHERE id = _entry_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Écriture non trouvée');
  END IF;
  
  -- Check user role
  SELECT r.name INTO _user_role
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id
  AND r.name IN ('admin', 'daf', 'dt', 'dg')
  LIMIT 1;
  
  -- Validate transition based on current status and user role
  CASE _current_status
    WHEN 'brouillon' THEN
      IF _new_status = 'soumise' AND (_entry_creator = _user_id OR _user_role = 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'soumise' THEN
      IF _new_status IN ('en_validation_daf', 'rejetee') AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'en_validation_daf' THEN
      IF _new_status IN ('en_validation_dt', 'rejetee') AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'en_validation_dt' THEN
      IF _new_status IN ('en_validation_dg', 'rejetee') AND _user_role IN ('dt', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'en_validation_dg' THEN
      IF _new_status IN ('validee', 'rejetee') AND _user_role IN ('dg', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'validee' THEN
      IF _new_status = 'payee' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'rejetee' THEN
      IF _new_status = 'brouillon' AND (_entry_creator = _user_id OR _user_role = 'admin') THEN
        _is_valid := true;
      END IF;
    ELSE
      _is_valid := false;
  END CASE;
  
  IF NOT _is_valid THEN
    RETURN json_build_object('success', false, 'error', 'Transition non autorisée');
  END IF;
  
  -- Update the entry
  UPDATE journal_entries
  SET 
    expense_workflow_status = _new_status,
    rejection_reason = CASE WHEN _new_status = 'rejetee' THEN _comment ELSE NULL END,
    rejected_by = CASE WHEN _new_status = 'rejetee' THEN _user_id ELSE NULL END,
    rejected_at = CASE WHEN _new_status = 'rejetee' THEN now() ELSE NULL END,
    daf_validated_by = CASE WHEN _new_status = 'en_validation_daf' THEN _user_id ELSE daf_validated_by END,
    daf_validated_at = CASE WHEN _new_status = 'en_validation_daf' THEN now() ELSE daf_validated_at END,
    dt_validated_by = CASE WHEN _new_status = 'en_validation_dt' THEN _user_id ELSE dt_validated_by END,
    dt_validated_at = CASE WHEN _new_status = 'en_validation_dt' THEN now() ELSE dt_validated_at END,
    dg_validated_by = CASE WHEN _new_status = 'en_validation_dg' THEN _user_id ELSE dg_validated_by END,
    dg_validated_at = CASE WHEN _new_status = 'en_validation_dg' THEN now() ELSE dg_validated_at END,
    paid_by = CASE WHEN _new_status = 'payee' THEN _user_id ELSE paid_by END,
    paid_at = CASE WHEN _new_status = 'payee' THEN now() ELSE paid_at END,
    validated_by = CASE WHEN _new_status = 'validee' THEN _user_id ELSE validated_by END,
    validated_at = CASE WHEN _new_status = 'validee' THEN now() ELSE validated_at END,
    updated_at = now()
  WHERE id = _entry_id;
  
  -- Log the transition
  INSERT INTO expense_validation_history (journal_entry_id, from_status, to_status, action, comment, performed_by)
  VALUES (_entry_id, _current_status, _new_status, _new_status, _comment, _user_id);
  
  RETURN json_build_object('success', true, 'new_status', _new_status);
END;
$$;

-- Add permissions for new roles
INSERT INTO public.permissions (module, permission)
SELECT module, permission FROM (
  VALUES 
    ('comptabilite'::module_name, 'validate'::permission_type)
) AS v(module, permission)
ON CONFLICT DO NOTHING;

-- Grant validate permission to DAF, DT, DG roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('daf', 'dt', 'dg')
AND p.module = 'comptabilite' AND p.permission = 'validate'
ON CONFLICT DO NOTHING;

-- Grant all comptabilite permissions to DAF
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'daf'
AND p.module = 'comptabilite'
ON CONFLICT DO NOTHING;