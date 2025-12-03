-- Add budget workflow columns
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS closed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES public.profiles(id);

-- Create budget validation history table
CREATE TABLE IF NOT EXISTS public.budget_validation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  from_status text NOT NULL,
  to_status text NOT NULL,
  action text NOT NULL,
  comment text,
  performed_by uuid REFERENCES public.profiles(id),
  performed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_validation_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for budget validation history
CREATE POLICY "Authenticated users can view budget validation history"
ON public.budget_validation_history FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can insert validation history"
ON public.budget_validation_history FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'comptabilite'::module_name, 'create'::permission_type));

-- Function to validate budget transitions
CREATE OR REPLACE FUNCTION public.validate_budget_transition(
  _budget_id uuid,
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
  _budget_creator uuid;
  _is_valid boolean := false;
  _user_role text;
  _result json;
  _fiscal_year_id uuid;
  _total_amount numeric;
BEGIN
  -- Get current budget info
  SELECT status, created_by, fiscal_year_id, total_amount 
  INTO _current_status, _budget_creator, _fiscal_year_id, _total_amount
  FROM budgets WHERE id = _budget_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Budget non trouvé');
  END IF;
  
  -- Check if budget has a fiscal year
  IF _fiscal_year_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Le budget doit être rattaché à un exercice fiscal');
  END IF;
  
  -- Check if total amount is positive when submitting
  IF _new_status = 'soumis' AND (_total_amount IS NULL OR _total_amount <= 0) THEN
    RETURN json_build_object('success', false, 'error', 'Le montant total du budget doit être positif');
  END IF;
  
  -- Check user role
  SELECT r.name INTO _user_role
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id
  AND r.name IN ('admin', 'daf', 'dg')
  LIMIT 1;
  
  -- Validate transition based on current status and user role
  CASE _current_status
    WHEN 'draft' THEN
      IF _new_status = 'soumis' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'soumis' THEN
      IF _new_status IN ('valide', 'rejete') AND _user_role IN ('dg', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'rejete' THEN
      IF _new_status = 'draft' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'valide' THEN
      IF _new_status = 'clos' AND _user_role IN ('daf', 'dg', 'admin') THEN
        _is_valid := true;
      END IF;
    ELSE
      _is_valid := false;
  END CASE;
  
  IF NOT _is_valid THEN
    RETURN json_build_object('success', false, 'error', 'Transition non autorisée');
  END IF;
  
  -- Update the budget
  UPDATE budgets
  SET 
    status = _new_status,
    rejection_reason = CASE WHEN _new_status = 'rejete' THEN _comment ELSE NULL END,
    rejected_by = CASE WHEN _new_status = 'rejete' THEN _user_id ELSE NULL END,
    rejected_at = CASE WHEN _new_status = 'rejete' THEN now() ELSE NULL END,
    submitted_by = CASE WHEN _new_status = 'soumis' THEN _user_id ELSE submitted_by END,
    submitted_at = CASE WHEN _new_status = 'soumis' THEN now() ELSE submitted_at END,
    validated_by = CASE WHEN _new_status = 'valide' THEN _user_id ELSE validated_by END,
    validated_at = CASE WHEN _new_status = 'valide' THEN now() ELSE validated_at END,
    approved_by = CASE WHEN _new_status = 'valide' THEN _user_id ELSE approved_by END,
    approved_at = CASE WHEN _new_status = 'valide' THEN now() ELSE approved_at END,
    closed_by = CASE WHEN _new_status = 'clos' THEN _user_id ELSE closed_by END,
    closed_at = CASE WHEN _new_status = 'clos' THEN now() ELSE closed_at END,
    updated_at = now()
  WHERE id = _budget_id;
  
  -- Log the transition
  INSERT INTO budget_validation_history (budget_id, from_status, to_status, action, comment, performed_by)
  VALUES (_budget_id, _current_status, _new_status, _new_status, _comment, _user_id);
  
  RETURN json_build_object('success', true, 'new_status', _new_status);
END;
$$;

-- Function to check if a validated budget exists for fiscal year
CREATE OR REPLACE FUNCTION public.has_validated_budget(_fiscal_year_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.budgets
    WHERE fiscal_year_id = _fiscal_year_id
      AND status = 'valide'
  )
$$;