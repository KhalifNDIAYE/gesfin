-- Add comptable role if not exists
INSERT INTO public.roles (name, description)
VALUES ('comptable', 'Comptable - Gestion des décaissements')
ON CONFLICT (name) DO NOTHING;

-- Add workflow columns to direct_payments table
ALTER TABLE public.direct_payments 
ADD COLUMN IF NOT EXISTS workflow_status text DEFAULT 'brouillon',
ADD COLUMN IF NOT EXISTS submitted_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS daf_validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS daf_validated_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS dg_validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS dg_validated_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS validated_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS paid_by uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS related_expense_id uuid REFERENCES public.journal_entries(id);

-- Create disbursement validation history table
CREATE TABLE IF NOT EXISTS public.disbursement_validation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disbursement_id uuid NOT NULL REFERENCES public.direct_payments(id) ON DELETE CASCADE,
  from_status text NOT NULL,
  to_status text NOT NULL,
  action text NOT NULL,
  comment text,
  performed_by uuid REFERENCES public.profiles(id),
  performed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.disbursement_validation_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for disbursement validation history
CREATE POLICY "Authenticated users can view disbursement validation history"
ON public.disbursement_validation_history FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can insert disbursement hist"
ON public.disbursement_validation_history FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'comptabilite'::module_name, 'create'::permission_type));

-- Function to check if related expense is validated
CREATE OR REPLACE FUNCTION public.is_expense_validated(_expense_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT expense_workflow_status = 'validee' FROM journal_entries WHERE id = _expense_id),
    true
  )
$$;

-- Function to check treasury availability
CREATE OR REPLACE FUNCTION public.check_treasury_availability(_amount numeric)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_received numeric;
  _total_paid numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO _total_received
  FROM replenishments WHERE status = 'received';
  
  SELECT COALESCE(SUM(amount), 0) INTO _total_paid
  FROM direct_payments WHERE workflow_status = 'paye';
  
  RETURN (_total_received - _total_paid) >= _amount;
END;
$$;

-- Function to validate disbursement transitions
CREATE OR REPLACE FUNCTION public.validate_disbursement_transition(
  _disbursement_id uuid,
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
  _disbursement_creator uuid;
  _is_valid boolean := false;
  _user_role text;
  _amount numeric;
  _related_expense_id uuid;
BEGIN
  SELECT workflow_status, created_by, amount, related_expense_id 
  INTO _current_status, _disbursement_creator, _amount, _related_expense_id
  FROM direct_payments WHERE id = _disbursement_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Décaissement non trouvé');
  END IF;
  
  IF _related_expense_id IS NOT NULL AND _new_status IN ('soumis', 'en_validation_daf') THEN
    IF NOT is_expense_validated(_related_expense_id) THEN
      RETURN json_build_object('success', false, 'error', 'La dépense associée doit être validée');
    END IF;
  END IF;
  
  IF _new_status = 'soumis' THEN
    IF NOT check_treasury_availability(_amount) THEN
      RETURN json_build_object('success', false, 'error', 'Trésorerie insuffisante');
    END IF;
  END IF;
  
  SELECT r.name INTO _user_role
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = _user_id
  AND r.name IN ('admin', 'comptable', 'daf', 'dg')
  LIMIT 1;
  
  CASE _current_status
    WHEN 'brouillon' THEN
      IF _new_status = 'soumis' AND _user_role IN ('comptable', 'daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'soumis' THEN
      IF _new_status = 'en_validation_daf' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      ELSIF _new_status = 'rejete' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'en_validation_daf' THEN
      IF _new_status = 'en_validation_dg' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      ELSIF _new_status = 'rejete' AND _user_role IN ('daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'en_validation_dg' THEN
      IF _new_status = 'valide' AND _user_role IN ('dg', 'admin') THEN
        _is_valid := true;
      ELSIF _new_status = 'rejete' AND _user_role IN ('dg', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'valide' THEN
      IF _new_status = 'paye' AND _user_role IN ('comptable', 'daf', 'admin') THEN
        _is_valid := true;
      END IF;
    WHEN 'rejete' THEN
      IF _new_status = 'brouillon' AND _user_role IN ('comptable', 'admin') THEN
        _is_valid := true;
      END IF;
    ELSE
      _is_valid := false;
  END CASE;
  
  IF NOT _is_valid THEN
    RETURN json_build_object('success', false, 'error', 'Transition non autorisée');
  END IF;
  
  UPDATE direct_payments
  SET 
    workflow_status = _new_status,
    status = CASE 
      WHEN _new_status = 'paye' THEN 'paid'
      WHEN _new_status = 'valide' THEN 'approved'
      WHEN _new_status = 'rejete' THEN 'rejected'
      ELSE status
    END,
    rejection_reason = CASE WHEN _new_status = 'rejete' THEN _comment ELSE NULL END,
    rejected_by = CASE WHEN _new_status = 'rejete' THEN _user_id ELSE NULL END,
    rejected_at = CASE WHEN _new_status = 'rejete' THEN now() ELSE NULL END,
    submitted_by = CASE WHEN _new_status = 'soumis' THEN _user_id ELSE submitted_by END,
    submitted_at = CASE WHEN _new_status = 'soumis' THEN now() ELSE submitted_at END,
    daf_validated_by = CASE WHEN _new_status = 'en_validation_dg' THEN _user_id ELSE daf_validated_by END,
    daf_validated_at = CASE WHEN _new_status = 'en_validation_dg' THEN now() ELSE daf_validated_at END,
    dg_validated_by = CASE WHEN _new_status = 'valide' THEN _user_id ELSE dg_validated_by END,
    dg_validated_at = CASE WHEN _new_status = 'valide' THEN now() ELSE dg_validated_at END,
    validated_by = CASE WHEN _new_status = 'valide' THEN _user_id ELSE validated_by END,
    validated_at = CASE WHEN _new_status = 'valide' THEN now() ELSE validated_at END,
    paid_by = CASE WHEN _new_status = 'paye' THEN _user_id ELSE paid_by END,
    paid_at = CASE WHEN _new_status = 'paye' THEN now() ELSE paid_at END,
    payment_date = CASE WHEN _new_status = 'paye' THEN CURRENT_DATE ELSE payment_date END,
    updated_at = now()
  WHERE id = _disbursement_id;
  
  INSERT INTO disbursement_validation_history (disbursement_id, from_status, to_status, action, comment, performed_by)
  VALUES (_disbursement_id, _current_status, _new_status, _new_status, _comment, _user_id);
  
  RETURN json_build_object('success', true, 'new_status', _new_status);
END;
$$;