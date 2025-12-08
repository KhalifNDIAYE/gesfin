-- Table des transferts budgétaires avec workflow de validation
CREATE TABLE public.budget_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  
  -- Lignes source et destination
  source_budget_line_id UUID NOT NULL REFERENCES public.budget_lines(id),
  destination_budget_line_id UUID NOT NULL REFERENCES public.budget_lines(id),
  
  -- Montants
  amount NUMERIC NOT NULL CHECK (amount > 0),
  amount_local NUMERIC,
  
  -- Justification
  reason TEXT NOT NULL,
  description TEXT,
  
  -- Statut du workflow
  status TEXT NOT NULL DEFAULT 'pending_director' 
    CHECK (status IN ('pending_director', 'pending_admin', 'approved', 'rejected', 'cancelled')),
  
  -- Validation Directeur (DG)
  director_validated_by UUID REFERENCES public.profiles(id),
  director_validated_at TIMESTAMP WITH TIME ZONE,
  director_comment TEXT,
  
  -- Validation Administrateur
  admin_validated_by UUID REFERENCES public.profiles(id),
  admin_validated_at TIMESTAMP WITH TIME ZONE,
  admin_comment TEXT,
  
  -- Rejet
  rejected_by UUID REFERENCES public.profiles(id),
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Métadonnées
  requested_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  executed_at TIMESTAMP WITH TIME ZONE,
  
  -- Contrainte: source et destination différentes
  CONSTRAINT different_lines CHECK (source_budget_line_id != destination_budget_line_id)
);

-- Index pour les performances
CREATE INDEX idx_budget_transfers_status ON public.budget_transfers(status);
CREATE INDEX idx_budget_transfers_source ON public.budget_transfers(source_budget_line_id);
CREATE INDEX idx_budget_transfers_destination ON public.budget_transfers(destination_budget_line_id);
CREATE INDEX idx_budget_transfers_requested_by ON public.budget_transfers(requested_by);

-- Activer RLS
ALTER TABLE public.budget_transfers ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Authenticated users can view budget transfers"
ON public.budget_transfers FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can create transfers"
ON public.budget_transfers FOR INSERT
WITH CHECK (has_permission(auth.uid(), 'comptabilite'::module_name, 'create'::permission_type));

CREATE POLICY "System can update budget transfers"
ON public.budget_transfers FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Table d'historique des transferts (immuable)
CREATE TABLE public.budget_transfer_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transfer_id UUID NOT NULL REFERENCES public.budget_transfers(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL CHECK (action IN ('created', 'director_approved', 'director_rejected', 'admin_approved', 'admin_rejected', 'executed', 'cancelled')),
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  
  comment TEXT,
  performed_by UUID REFERENCES public.profiles(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Snapshot des données au moment de l'action
  snapshot JSONB
);

CREATE INDEX idx_budget_transfer_history_transfer ON public.budget_transfer_history(transfer_id);

-- Activer RLS sur l'historique
ALTER TABLE public.budget_transfer_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transfer history"
ON public.budget_transfer_history FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert transfer history"
ON public.budget_transfer_history FOR INSERT
WITH CHECK (true);

-- Fonction de création de transfert
CREATE OR REPLACE FUNCTION public.create_budget_transfer(
  _source_budget_line_id UUID,
  _destination_budget_line_id UUID,
  _amount NUMERIC,
  _reason TEXT,
  _description TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _transfer_id UUID;
  _source_line RECORD;
  _dest_line RECORD;
  _source_budget RECORD;
  _code TEXT;
  _available_amount NUMERIC;
  _user_id UUID;
  _user_email TEXT;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Non authentifié');
  END IF;
  
  -- Vérifier que les lignes existent
  SELECT bl.*, b.code as budget_code, b.name as budget_name, b.is_frozen, b.status as budget_status
  INTO _source_line
  FROM budget_lines bl
  JOIN budgets b ON b.id = bl.budget_id
  WHERE bl.id = _source_budget_line_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Ligne budgétaire source non trouvée');
  END IF;
  
  SELECT bl.*, b.code as budget_code, b.name as budget_name
  INTO _dest_line
  FROM budget_lines bl
  JOIN budgets b ON b.id = bl.budget_id
  WHERE bl.id = _destination_budget_line_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Ligne budgétaire destination non trouvée');
  END IF;
  
  -- Vérifier que le budget source n'est pas gelé
  IF _source_line.is_frozen THEN
    RETURN json_build_object('success', false, 'error', 'Le budget source est gelé');
  END IF;
  
  -- Vérifier que le budget source est validé
  IF _source_line.budget_status NOT IN ('valide') THEN
    RETURN json_build_object('success', false, 'error', 'Le budget source doit être validé');
  END IF;
  
  -- Calculer le montant disponible
  _available_amount := COALESCE(_source_line.forecast_amount, 0) 
                      - COALESCE(_source_line.committed_amount, 0) 
                      - COALESCE(_source_line.realized_amount, 0);
  
  IF _available_amount < _amount THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Montant insuffisant sur la ligne source. Disponible: ' || _available_amount::TEXT
    );
  END IF;
  
  -- Générer le code
  SELECT 'TRF-' || LPAD((COUNT(*) + 1)::TEXT, 6, '0') INTO _code
  FROM budget_transfers;
  
  -- Créer le transfert
  INSERT INTO budget_transfers (
    code,
    source_budget_line_id,
    destination_budget_line_id,
    amount,
    amount_local,
    reason,
    description,
    requested_by,
    status
  ) VALUES (
    _code,
    _source_budget_line_id,
    _destination_budget_line_id,
    _amount,
    _amount, -- Même devise pour simplifier
    _reason,
    _description,
    _user_id,
    'pending_director'
  )
  RETURNING id INTO _transfer_id;
  
  -- Créer l'entrée d'historique
  INSERT INTO budget_transfer_history (
    transfer_id,
    action,
    from_status,
    to_status,
    performed_by,
    snapshot
  ) VALUES (
    _transfer_id,
    'created',
    'new',
    'pending_director',
    _user_id,
    jsonb_build_object(
      'source_line', _source_line.description,
      'source_budget', _source_line.budget_name,
      'destination_line', _dest_line.description,
      'destination_budget', _dest_line.budget_name,
      'amount', _amount,
      'available_before', _available_amount
    )
  );
  
  -- Journaliser dans audit_logs
  SELECT email INTO _user_email FROM profiles WHERE id = _user_id;
  
  INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, new_values)
  VALUES (
    _user_id,
    _user_email,
    'budget_transfer_created',
    'comptabilite',
    'budget_transfer',
    _transfer_id::TEXT,
    jsonb_build_object(
      'code', _code,
      'amount', _amount,
      'source_line_id', _source_budget_line_id,
      'destination_line_id', _destination_budget_line_id,
      'reason', _reason
    )
  );
  
  -- Notifier le Directeur
  INSERT INTO notifications (user_id, type, severity, module, title, message, related_entity_type, related_entity_id, direct_link, triggered_by)
  SELECT 
    ur.user_id,
    'validation',
    'warning',
    'comptabilite',
    'Demande de transfert budgétaire',
    'Un transfert de ' || _amount::TEXT || ' XOF attend votre validation',
    'budget_transfer',
    _transfer_id::TEXT,
    '/budget/transferts',
    _user_id
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE r.name = 'dg';
  
  RETURN json_build_object(
    'success', true,
    'transfer_id', _transfer_id,
    'code', _code
  );
END;
$$;

-- Fonction de validation par le Directeur
CREATE OR REPLACE FUNCTION public.validate_budget_transfer_director(
  _transfer_id UUID,
  _decision TEXT,
  _comment TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _transfer RECORD;
  _user_id UUID;
  _user_email TEXT;
  _is_director BOOLEAN;
  _new_status TEXT;
BEGIN
  _user_id := auth.uid();
  
  -- Vérifier si l'utilisateur est directeur
  SELECT has_role(_user_id, 'dg') OR is_admin(_user_id) INTO _is_director;
  
  IF NOT _is_director THEN
    RETURN json_build_object('success', false, 'error', 'Seul le Directeur peut valider cette demande');
  END IF;
  
  -- Récupérer le transfert
  SELECT * INTO _transfer FROM budget_transfers WHERE id = _transfer_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transfert non trouvé');
  END IF;
  
  IF _transfer.status != 'pending_director' THEN
    RETURN json_build_object('success', false, 'error', 'Ce transfert n''est pas en attente de validation directeur');
  END IF;
  
  -- Anti-fraude: Le demandeur ne peut pas valider sa propre demande
  IF _user_id = _transfer.requested_by THEN
    RETURN json_build_object('success', false, 'error', 'Vous ne pouvez pas valider votre propre demande');
  END IF;
  
  IF _decision = 'approved' THEN
    _new_status := 'pending_admin';
  ELSIF _decision = 'rejected' THEN
    _new_status := 'rejected';
  ELSE
    RETURN json_build_object('success', false, 'error', 'Décision invalide');
  END IF;
  
  -- Mettre à jour le transfert
  UPDATE budget_transfers
  SET 
    status = _new_status,
    director_validated_by = CASE WHEN _decision = 'approved' THEN _user_id ELSE NULL END,
    director_validated_at = CASE WHEN _decision = 'approved' THEN now() ELSE NULL END,
    director_comment = _comment,
    rejected_by = CASE WHEN _decision = 'rejected' THEN _user_id ELSE NULL END,
    rejected_at = CASE WHEN _decision = 'rejected' THEN now() ELSE NULL END,
    rejection_reason = CASE WHEN _decision = 'rejected' THEN _comment ELSE NULL END,
    updated_at = now()
  WHERE id = _transfer_id;
  
  -- Historique
  INSERT INTO budget_transfer_history (transfer_id, action, from_status, to_status, comment, performed_by)
  VALUES (
    _transfer_id,
    CASE WHEN _decision = 'approved' THEN 'director_approved' ELSE 'director_rejected' END,
    'pending_director',
    _new_status,
    _comment,
    _user_id
  );
  
  -- Audit
  SELECT email INTO _user_email FROM profiles WHERE id = _user_id;
  
  INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, old_values, new_values)
  VALUES (
    _user_id,
    _user_email,
    'budget_transfer_director_' || _decision,
    'comptabilite',
    'budget_transfer',
    _transfer_id::TEXT,
    jsonb_build_object('status', 'pending_director'),
    jsonb_build_object('status', _new_status, 'comment', _comment)
  );
  
  -- Notifications
  IF _decision = 'approved' THEN
    -- Notifier l'administrateur
    INSERT INTO notifications (user_id, type, severity, module, title, message, related_entity_type, related_entity_id, direct_link, triggered_by)
    SELECT 
      ur.user_id,
      'validation',
      'warning',
      'comptabilite',
      'Transfert budgétaire approuvé par DG',
      'Un transfert de ' || _transfer.amount::TEXT || ' XOF attend votre validation finale',
      'budget_transfer',
      _transfer_id::TEXT,
      '/budget/transferts',
      _user_id
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE r.name = 'admin';
  ELSE
    -- Notifier le demandeur du rejet
    INSERT INTO notifications (user_id, type, severity, module, title, message, related_entity_type, related_entity_id, direct_link, triggered_by)
    VALUES (
      _transfer.requested_by,
      'validation',
      'error',
      'comptabilite',
      'Transfert budgétaire rejeté',
      'Votre demande de transfert a été rejetée: ' || COALESCE(_comment, 'Aucun motif'),
      'budget_transfer',
      _transfer_id::TEXT,
      '/budget/transferts',
      _user_id
    );
  END IF;
  
  RETURN json_build_object('success', true, 'new_status', _new_status);
END;
$$;

-- Fonction de validation par l'Administrateur (avec exécution du transfert)
CREATE OR REPLACE FUNCTION public.validate_budget_transfer_admin(
  _transfer_id UUID,
  _decision TEXT,
  _comment TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _transfer RECORD;
  _source_line RECORD;
  _dest_line RECORD;
  _user_id UUID;
  _user_email TEXT;
  _is_admin BOOLEAN;
  _new_status TEXT;
BEGIN
  _user_id := auth.uid();
  
  -- Vérifier si l'utilisateur est admin
  SELECT is_admin(_user_id) INTO _is_admin;
  
  IF NOT _is_admin THEN
    RETURN json_build_object('success', false, 'error', 'Seul l''Administrateur peut finaliser cette demande');
  END IF;
  
  -- Récupérer le transfert
  SELECT * INTO _transfer FROM budget_transfers WHERE id = _transfer_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Transfert non trouvé');
  END IF;
  
  IF _transfer.status != 'pending_admin' THEN
    RETURN json_build_object('success', false, 'error', 'Ce transfert n''est pas en attente de validation admin');
  END IF;
  
  -- Anti-fraude: Le demandeur ne peut pas valider sa propre demande
  IF _user_id = _transfer.requested_by THEN
    RETURN json_build_object('success', false, 'error', 'Vous ne pouvez pas valider votre propre demande');
  END IF;
  
  -- Anti-fraude: Le directeur qui a approuvé ne peut pas être l'admin qui finalise
  IF _user_id = _transfer.director_validated_by THEN
    RETURN json_build_object('success', false, 'error', 'Vous avez déjà validé ce transfert en tant que Directeur');
  END IF;
  
  IF _decision = 'approved' THEN
    _new_status := 'approved';
    
    -- Récupérer les lignes budgétaires
    SELECT * INTO _source_line FROM budget_lines WHERE id = _transfer.source_budget_line_id;
    SELECT * INTO _dest_line FROM budget_lines WHERE id = _transfer.destination_budget_line_id;
    
    -- Vérifier encore le montant disponible
    IF (COALESCE(_source_line.forecast_amount, 0) - COALESCE(_source_line.committed_amount, 0) - COALESCE(_source_line.realized_amount, 0)) < _transfer.amount THEN
      RETURN json_build_object('success', false, 'error', 'Montant insuffisant sur la ligne source');
    END IF;
    
    -- Exécuter le transfert: diminuer la source
    UPDATE budget_lines
    SET 
      forecast_amount = COALESCE(forecast_amount, 0) - _transfer.amount,
      forecast_amount_local = COALESCE(forecast_amount_local, 0) - _transfer.amount,
      updated_at = now()
    WHERE id = _transfer.source_budget_line_id;
    
    -- Exécuter le transfert: augmenter la destination
    UPDATE budget_lines
    SET 
      forecast_amount = COALESCE(forecast_amount, 0) + _transfer.amount,
      forecast_amount_local = COALESCE(forecast_amount_local, 0) + _transfer.amount,
      updated_at = now()
    WHERE id = _transfer.destination_budget_line_id;
    
  ELSIF _decision = 'rejected' THEN
    _new_status := 'rejected';
  ELSE
    RETURN json_build_object('success', false, 'error', 'Décision invalide');
  END IF;
  
  -- Mettre à jour le transfert
  UPDATE budget_transfers
  SET 
    status = _new_status,
    admin_validated_by = CASE WHEN _decision = 'approved' THEN _user_id ELSE NULL END,
    admin_validated_at = CASE WHEN _decision = 'approved' THEN now() ELSE NULL END,
    admin_comment = _comment,
    executed_at = CASE WHEN _decision = 'approved' THEN now() ELSE NULL END,
    rejected_by = CASE WHEN _decision = 'rejected' THEN _user_id ELSE rejected_by END,
    rejected_at = CASE WHEN _decision = 'rejected' THEN now() ELSE rejected_at END,
    rejection_reason = CASE WHEN _decision = 'rejected' THEN _comment ELSE rejection_reason END,
    updated_at = now()
  WHERE id = _transfer_id;
  
  -- Historique
  INSERT INTO budget_transfer_history (transfer_id, action, from_status, to_status, comment, performed_by, snapshot)
  VALUES (
    _transfer_id,
    CASE WHEN _decision = 'approved' THEN 'executed' ELSE 'admin_rejected' END,
    'pending_admin',
    _new_status,
    _comment,
    _user_id,
    CASE WHEN _decision = 'approved' THEN
      jsonb_build_object(
        'executed_at', now(),
        'source_before', _source_line.forecast_amount,
        'source_after', COALESCE(_source_line.forecast_amount, 0) - _transfer.amount,
        'dest_before', _dest_line.forecast_amount,
        'dest_after', COALESCE(_dest_line.forecast_amount, 0) + _transfer.amount
      )
    ELSE NULL END
  );
  
  -- Audit
  SELECT email INTO _user_email FROM profiles WHERE id = _user_id;
  
  INSERT INTO audit_logs (user_id, user_email, action, module, resource_type, resource_id, old_values, new_values)
  VALUES (
    _user_id,
    _user_email,
    'budget_transfer_admin_' || _decision,
    'comptabilite',
    'budget_transfer',
    _transfer_id::TEXT,
    jsonb_build_object('status', 'pending_admin'),
    jsonb_build_object(
      'status', _new_status, 
      'comment', _comment,
      'executed', _decision = 'approved'
    )
  );
  
  -- Notifier le demandeur
  INSERT INTO notifications (user_id, type, severity, module, title, message, related_entity_type, related_entity_id, direct_link, triggered_by)
  VALUES (
    _transfer.requested_by,
    'validation',
    CASE WHEN _decision = 'approved' THEN 'success' ELSE 'error' END,
    'comptabilite',
    CASE WHEN _decision = 'approved' THEN 'Transfert budgétaire exécuté' ELSE 'Transfert budgétaire rejeté' END,
    CASE WHEN _decision = 'approved' 
      THEN 'Votre demande de transfert de ' || _transfer.amount::TEXT || ' XOF a été approuvée et exécutée'
      ELSE 'Votre demande de transfert a été rejetée: ' || COALESCE(_comment, 'Aucun motif')
    END,
    'budget_transfer',
    _transfer_id::TEXT,
    '/budget/transferts',
    _user_id
  );
  
  RETURN json_build_object('success', true, 'new_status', _new_status, 'executed', _decision = 'approved');
END;
$$;