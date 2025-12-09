
-- =====================================================
-- SYNCHRONISATION AUTOMATIQUE BAILLEURS-CONVENTIONS-PROJETS
-- =====================================================

-- 1. Fonction de journalisation des synchronisations
CREATE OR REPLACE FUNCTION public.log_sync_action(
  _project_id uuid,
  _action text,
  _details text,
  _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO audit_logs (
    action,
    resource_type,
    resource_id,
    module,
    old_values,
    new_values,
    user_id,
    user_email
  )
  SELECT 
    _action,
    'project',
    _project_id::text,
    'projets',
    _old_values,
    jsonb_build_object('details', _details) || COALESCE(_new_values, '{}'::jsonb),
    auth.uid(),
    p.email
  FROM profiles p
  WHERE p.id = auth.uid();
END;
$$;

-- 2. Fonction pour synchroniser les bailleurs d'un projet basé sur ses conventions
CREATE OR REPLACE FUNCTION public.sync_project_bailleurs_from_conventions(_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _bailleur_record RECORD;
  _existing_bailleurs uuid[];
  _new_bailleurs uuid[];
  _removed_count int := 0;
  _added_count int := 0;
  _updated_count int := 0;
BEGIN
  -- Récupérer les bailleurs existants du projet
  SELECT ARRAY_AGG(bailleur_id) INTO _existing_bailleurs
  FROM project_bailleurs
  WHERE project_id = _project_id;

  -- Récupérer les bailleurs des conventions liées
  SELECT ARRAY_AGG(DISTINCT c.bailleur_id) INTO _new_bailleurs
  FROM project_conventions pc
  JOIN conventions c ON c.id = pc.convention_id
  WHERE pc.project_id = _project_id
  AND c.bailleur_id IS NOT NULL;

  -- Supprimer les bailleurs qui ne sont plus liés via des conventions
  IF _existing_bailleurs IS NOT NULL THEN
    DELETE FROM project_bailleurs
    WHERE project_id = _project_id
    AND bailleur_id != ALL(COALESCE(_new_bailleurs, ARRAY[]::uuid[]))
    RETURNING 1 INTO _removed_count;
    
    _removed_count := COALESCE(_removed_count, 0);
  END IF;

  -- Ajouter ou mettre à jour les bailleurs des conventions
  FOR _bailleur_record IN
    SELECT 
      c.bailleur_id,
      SUM(c.total_amount) as total_committed,
      SUM(c.disbursed_amount) as total_disbursed,
      SUM(c.remaining_amount) as total_remaining,
      CASE 
        WHEN SUM(c.total_amount) > 0 THEN (SUM(c.disbursed_amount) / SUM(c.total_amount)) * 100
        ELSE 0
      END as execution_rate
    FROM project_conventions pc
    JOIN conventions c ON c.id = pc.convention_id
    WHERE pc.project_id = _project_id
    AND c.bailleur_id IS NOT NULL
    GROUP BY c.bailleur_id
  LOOP
    INSERT INTO project_bailleurs (
      project_id,
      bailleur_id,
      committed_amount,
      disbursed_amount,
      remaining_amount,
      execution_rate
    ) VALUES (
      _project_id,
      _bailleur_record.bailleur_id,
      _bailleur_record.total_committed,
      _bailleur_record.total_disbursed,
      _bailleur_record.total_remaining,
      _bailleur_record.execution_rate
    )
    ON CONFLICT (project_id, bailleur_id) DO UPDATE SET
      committed_amount = EXCLUDED.committed_amount,
      disbursed_amount = EXCLUDED.disbursed_amount,
      remaining_amount = EXCLUDED.remaining_amount,
      execution_rate = EXCLUDED.execution_rate,
      updated_at = now();
      
    IF FOUND THEN
      _updated_count := _updated_count + 1;
    END IF;
  END LOOP;

  -- Journaliser la synchronisation
  PERFORM log_sync_action(
    _project_id,
    'sync_bailleurs_from_conventions',
    format('Synchronisation bailleurs: %s ajoutés/mis à jour, %s retirés', _updated_count, _removed_count),
    NULL,
    jsonb_build_object('bailleurs_count', COALESCE(array_length(_new_bailleurs, 1), 0))
  );
END;
$$;

-- 3. Fonction pour recalculer les KPIs d'un projet
CREATE OR REPLACE FUNCTION public.recalculate_project_kpis(_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total_budget numeric := 0;
  _consumed_budget numeric := 0;
  _old_values jsonb;
  _new_values jsonb;
BEGIN
  -- Sauvegarder les anciennes valeurs
  SELECT jsonb_build_object(
    'total_budget', total_budget,
    'consumed_budget', consumed_budget
  ) INTO _old_values
  FROM projects WHERE id = _project_id;

  -- Calculer le budget total depuis les conventions liées
  SELECT 
    COALESCE(SUM(c.total_amount), 0),
    COALESCE(SUM(c.disbursed_amount), 0)
  INTO _total_budget, _consumed_budget
  FROM project_conventions pc
  JOIN conventions c ON c.id = pc.convention_id
  WHERE pc.project_id = _project_id;

  -- Mettre à jour le projet
  UPDATE projects
  SET 
    total_budget = _total_budget,
    consumed_budget = _consumed_budget,
    updated_at = now()
  WHERE id = _project_id;

  -- Préparer les nouvelles valeurs
  _new_values := jsonb_build_object(
    'total_budget', _total_budget,
    'consumed_budget', _consumed_budget,
    'execution_rate', CASE WHEN _total_budget > 0 THEN round((_consumed_budget / _total_budget) * 100, 2) ELSE 0 END
  );

  -- Journaliser le recalcul
  PERFORM log_sync_action(
    _project_id,
    'recalculate_project_kpis',
    'Recalcul automatique des KPIs du projet',
    _old_values,
    _new_values
  );
END;
$$;

-- 4. Trigger pour synchroniser après ajout/suppression de convention au projet
CREATE OR REPLACE FUNCTION public.trigger_sync_on_project_convention_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _project_id uuid;
  _convention_name text;
  _bailleur_name text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    _project_id := OLD.project_id;
    
    -- Récupérer info convention pour le log
    SELECT c.name, b.name INTO _convention_name, _bailleur_name
    FROM conventions c
    LEFT JOIN bailleurs b ON b.id = c.bailleur_id
    WHERE c.id = OLD.convention_id;
    
    PERFORM log_sync_action(
      _project_id,
      'convention_removed',
      format('Convention "%s" retirée → bailleur "%s" synchronisé', _convention_name, COALESCE(_bailleur_name, 'N/A')),
      jsonb_build_object('convention_id', OLD.convention_id),
      NULL
    );
  ELSE
    _project_id := NEW.project_id;
    
    -- Récupérer info convention pour le log
    SELECT c.name, b.name INTO _convention_name, _bailleur_name
    FROM conventions c
    LEFT JOIN bailleurs b ON b.id = c.bailleur_id
    WHERE c.id = NEW.convention_id;
    
    PERFORM log_sync_action(
      _project_id,
      'convention_added',
      format('Convention "%s" ajoutée → bailleur "%s" synchronisé', _convention_name, COALESCE(_bailleur_name, 'N/A')),
      NULL,
      jsonb_build_object('convention_id', NEW.convention_id)
    );
  END IF;
  
  -- Synchroniser les bailleurs
  PERFORM sync_project_bailleurs_from_conventions(_project_id);
  
  -- Recalculer les KPIs
  PERFORM recalculate_project_kpis(_project_id);
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS sync_on_project_convention_change ON project_conventions;
CREATE TRIGGER sync_on_project_convention_change
AFTER INSERT OR DELETE ON project_conventions
FOR EACH ROW
EXECUTE FUNCTION trigger_sync_on_project_convention_change();

-- 5. Trigger pour synchroniser quand une convention est modifiée
CREATE OR REPLACE FUNCTION public.trigger_sync_on_convention_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _project_record RECORD;
  _old_bailleur_name text;
  _new_bailleur_name text;
BEGIN
  -- Récupérer les noms des bailleurs
  SELECT name INTO _old_bailleur_name FROM bailleurs WHERE id = OLD.bailleur_id;
  SELECT name INTO _new_bailleur_name FROM bailleurs WHERE id = NEW.bailleur_id;

  -- Mettre à jour tous les projets liés à cette convention
  FOR _project_record IN
    SELECT pc.project_id
    FROM project_conventions pc
    WHERE pc.convention_id = NEW.id
  LOOP
    -- Journaliser la mise à jour
    PERFORM log_sync_action(
      _project_record.project_id,
      'convention_updated',
      format('Convention "%s" mise à jour - Montants recalculés', NEW.name),
      jsonb_build_object(
        'old_total', OLD.total_amount,
        'old_disbursed', OLD.disbursed_amount,
        'old_bailleur', _old_bailleur_name
      ),
      jsonb_build_object(
        'new_total', NEW.total_amount,
        'new_disbursed', NEW.disbursed_amount,
        'new_bailleur', _new_bailleur_name
      )
    );
    
    -- Synchroniser les bailleurs si le bailleur a changé
    IF OLD.bailleur_id IS DISTINCT FROM NEW.bailleur_id THEN
      PERFORM sync_project_bailleurs_from_conventions(_project_record.project_id);
    END IF;
    
    -- Recalculer les KPIs dans tous les cas
    PERFORM recalculate_project_kpis(_project_record.project_id);
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_on_convention_update ON conventions;
CREATE TRIGGER sync_on_convention_update
AFTER UPDATE ON conventions
FOR EACH ROW
WHEN (
  OLD.total_amount IS DISTINCT FROM NEW.total_amount OR
  OLD.disbursed_amount IS DISTINCT FROM NEW.disbursed_amount OR
  OLD.remaining_amount IS DISTINCT FROM NEW.remaining_amount OR
  OLD.bailleur_id IS DISTINCT FROM NEW.bailleur_id OR
  OLD.status IS DISTINCT FROM NEW.status
)
EXECUTE FUNCTION trigger_sync_on_convention_update();

-- 6. Trigger pour synchroniser quand un bailleur est modifié
CREATE OR REPLACE FUNCTION public.trigger_sync_on_bailleur_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _project_record RECORD;
BEGIN
  -- Mettre à jour tous les projets liés à ce bailleur via les conventions
  FOR _project_record IN
    SELECT DISTINCT pc.project_id
    FROM project_conventions pc
    JOIN conventions c ON c.id = pc.convention_id
    WHERE c.bailleur_id = NEW.id
  LOOP
    -- Journaliser
    PERFORM log_sync_action(
      _project_record.project_id,
      'bailleur_updated',
      format('Bailleur "%s" mis à jour - Synchronisation automatique', NEW.name),
      jsonb_build_object('old_name', OLD.name),
      jsonb_build_object('new_name', NEW.name)
    );
    
    -- Synchroniser les données bailleur
    PERFORM sync_project_bailleurs_from_conventions(_project_record.project_id);
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_on_bailleur_update ON bailleurs;
CREATE TRIGGER sync_on_bailleur_update
AFTER UPDATE ON bailleurs
FOR EACH ROW
WHEN (
  OLD.name IS DISTINCT FROM NEW.name OR
  OLD.is_active IS DISTINCT FROM NEW.is_active
)
EXECUTE FUNCTION trigger_sync_on_bailleur_update();

-- 7. Ajouter une contrainte unique sur project_bailleurs pour éviter les doublons
ALTER TABLE project_bailleurs 
DROP CONSTRAINT IF EXISTS project_bailleurs_project_bailleur_unique;

ALTER TABLE project_bailleurs 
ADD CONSTRAINT project_bailleurs_project_bailleur_unique 
UNIQUE (project_id, bailleur_id);

-- 8. Fonction pour obtenir les KPIs complets d'un projet
CREATE OR REPLACE FUNCTION public.get_project_kpis(_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result jsonb;
  _project record;
  _convention_count int;
  _bailleur_count int;
  _total_from_conventions numeric;
  _disbursed_from_conventions numeric;
BEGIN
  -- Récupérer le projet
  SELECT * INTO _project FROM projects WHERE id = _project_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Project not found');
  END IF;
  
  -- Compter les conventions
  SELECT COUNT(*) INTO _convention_count
  FROM project_conventions
  WHERE project_id = _project_id;
  
  -- Compter les bailleurs
  SELECT COUNT(*) INTO _bailleur_count
  FROM project_bailleurs
  WHERE project_id = _project_id;
  
  -- Calculer les montants depuis les conventions
  SELECT 
    COALESCE(SUM(c.total_amount), 0),
    COALESCE(SUM(c.disbursed_amount), 0)
  INTO _total_from_conventions, _disbursed_from_conventions
  FROM project_conventions pc
  JOIN conventions c ON c.id = pc.convention_id
  WHERE pc.project_id = _project_id;
  
  -- Construire le résultat
  _result := jsonb_build_object(
    'project_id', _project_id,
    'project_code', _project.code,
    'project_name', _project.name,
    'status', _project.status,
    'total_budget', _project.total_budget,
    'consumed_budget', _project.consumed_budget,
    'available_budget', _project.total_budget - _project.consumed_budget,
    'execution_rate', CASE 
      WHEN _project.total_budget > 0 THEN round((_project.consumed_budget / _project.total_budget) * 100, 2)
      ELSE 0
    END,
    'convention_count', _convention_count,
    'bailleur_count', _bailleur_count,
    'total_from_conventions', _total_from_conventions,
    'disbursed_from_conventions', _disbursed_from_conventions,
    'start_date', _project.start_date,
    'end_date', _project.end_date,
    'days_remaining', CASE 
      WHEN _project.end_date IS NOT NULL THEN (_project.end_date - CURRENT_DATE)
      ELSE NULL
    END,
    'is_overdue', _project.end_date IS NOT NULL AND _project.end_date < CURRENT_DATE
  );
  
  RETURN _result;
END;
$$;

-- 9. Vue pour les statistiques des bailleurs avec leurs conventions et projets
CREATE OR REPLACE VIEW public.bailleur_stats AS
SELECT 
  b.id as bailleur_id,
  b.code as bailleur_code,
  b.name as bailleur_name,
  b.short_name,
  b.is_active,
  COUNT(DISTINCT c.id) as convention_count,
  COUNT(DISTINCT pc.project_id) as project_count,
  COALESCE(SUM(c.total_amount), 0) as total_committed,
  COALESCE(SUM(c.disbursed_amount), 0) as total_disbursed,
  COALESCE(SUM(c.remaining_amount), 0) as total_remaining,
  CASE 
    WHEN COALESCE(SUM(c.total_amount), 0) > 0 
    THEN round((COALESCE(SUM(c.disbursed_amount), 0) / SUM(c.total_amount)) * 100, 2)
    ELSE 0
  END as global_execution_rate
FROM bailleurs b
LEFT JOIN conventions c ON c.bailleur_id = b.id
LEFT JOIN project_conventions pc ON pc.convention_id = c.id
GROUP BY b.id, b.code, b.name, b.short_name, b.is_active;

-- 10. Vue pour le suivi des conventions avec projets liés
CREATE OR REPLACE VIEW public.convention_project_stats AS
SELECT 
  c.id as convention_id,
  c.code as convention_code,
  c.name as convention_name,
  c.status,
  c.total_amount,
  c.disbursed_amount,
  c.remaining_amount,
  b.id as bailleur_id,
  b.name as bailleur_name,
  COUNT(DISTINCT pc.project_id) as linked_projects_count,
  ARRAY_AGG(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL) as project_names,
  CASE 
    WHEN c.total_amount > 0 THEN round((c.disbursed_amount / c.total_amount) * 100, 2)
    ELSE 0
  END as execution_rate
FROM conventions c
LEFT JOIN bailleurs b ON b.id = c.bailleur_id
LEFT JOIN project_conventions pc ON pc.convention_id = c.id
LEFT JOIN projects p ON p.id = pc.project_id
GROUP BY c.id, c.code, c.name, c.status, c.total_amount, c.disbursed_amount, c.remaining_amount, b.id, b.name;
