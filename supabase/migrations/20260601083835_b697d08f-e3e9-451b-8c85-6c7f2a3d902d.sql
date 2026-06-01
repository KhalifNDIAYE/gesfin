
-- ============ CONTRACT TABLES: restrict writes to 'marches' permission ============
-- contract_bailleurs
DROP POLICY IF EXISTS "Users can insert contract_bailleurs" ON public.contract_bailleurs;
DROP POLICY IF EXISTS "Users can update contract_bailleurs" ON public.contract_bailleurs;
DROP POLICY IF EXISTS "Users can delete contract_bailleurs" ON public.contract_bailleurs;
CREATE POLICY "Marches users can insert contract_bailleurs" ON public.contract_bailleurs
  FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marches'::module_name, 'create'::permission_type) OR is_admin(auth.uid()));
CREATE POLICY "Marches users can update contract_bailleurs" ON public.contract_bailleurs
  FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'marches'::module_name, 'update'::permission_type) OR is_admin(auth.uid()))
  WITH CHECK (has_permission(auth.uid(), 'marches'::module_name, 'update'::permission_type) OR is_admin(auth.uid()));
CREATE POLICY "Marches users can delete contract_bailleurs" ON public.contract_bailleurs
  FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'marches'::module_name, 'delete'::permission_type) OR is_admin(auth.uid()));

-- contract_conventions
DROP POLICY IF EXISTS "Users can insert contract_conventions" ON public.contract_conventions;
DROP POLICY IF EXISTS "Users can update contract_conventions" ON public.contract_conventions;
DROP POLICY IF EXISTS "Users can delete contract_conventions" ON public.contract_conventions;
CREATE POLICY "Marches users can insert contract_conventions" ON public.contract_conventions
  FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marches'::module_name, 'create'::permission_type) OR is_admin(auth.uid()));
CREATE POLICY "Marches users can update contract_conventions" ON public.contract_conventions
  FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'marches'::module_name, 'update'::permission_type) OR is_admin(auth.uid()))
  WITH CHECK (has_permission(auth.uid(), 'marches'::module_name, 'update'::permission_type) OR is_admin(auth.uid()));
CREATE POLICY "Marches users can delete contract_conventions" ON public.contract_conventions
  FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'marches'::module_name, 'delete'::permission_type) OR is_admin(auth.uid()));

-- contract_documents
DROP POLICY IF EXISTS "Users can insert contract_documents" ON public.contract_documents;
DROP POLICY IF EXISTS "Users can update contract_documents" ON public.contract_documents;
DROP POLICY IF EXISTS "Users can delete contract_documents" ON public.contract_documents;
CREATE POLICY "Marches users can insert contract_documents" ON public.contract_documents
  FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marches'::module_name, 'create'::permission_type) OR is_admin(auth.uid()));
CREATE POLICY "Marches users can update contract_documents" ON public.contract_documents
  FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'marches'::module_name, 'update'::permission_type) OR is_admin(auth.uid()))
  WITH CHECK (has_permission(auth.uid(), 'marches'::module_name, 'update'::permission_type) OR is_admin(auth.uid()));
CREATE POLICY "Marches users can delete contract_documents" ON public.contract_documents
  FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'marches'::module_name, 'delete'::permission_type) OR is_admin(auth.uid()));

-- contract_payment_schedule
DROP POLICY IF EXISTS "Users can insert contract_payment_schedule" ON public.contract_payment_schedule;
DROP POLICY IF EXISTS "Users can update contract_payment_schedule" ON public.contract_payment_schedule;
DROP POLICY IF EXISTS "Users can delete contract_payment_schedule" ON public.contract_payment_schedule;
CREATE POLICY "Marches users can insert contract_payment_schedule" ON public.contract_payment_schedule
  FOR INSERT TO authenticated
  WITH CHECK (has_permission(auth.uid(), 'marches'::module_name, 'create'::permission_type) OR is_admin(auth.uid()));
CREATE POLICY "Marches users can update contract_payment_schedule" ON public.contract_payment_schedule
  FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'marches'::module_name, 'update'::permission_type) OR is_admin(auth.uid()))
  WITH CHECK (has_permission(auth.uid(), 'marches'::module_name, 'update'::permission_type) OR is_admin(auth.uid()));
CREATE POLICY "Marches users can delete contract_payment_schedule" ON public.contract_payment_schedule
  FOR DELETE TO authenticated
  USING (has_permission(auth.uid(), 'marches'::module_name, 'delete'::permission_type) OR is_admin(auth.uid()));

-- ============ AUDIT LOGS: prevent log forgery (self-attributed only) ============
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert their own audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ============ EMAIL LOGS: backend-only inserts ============
DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;
CREATE POLICY "Service role can insert email logs" ON public.email_logs
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ============ BUDGET TRANSFER HISTORY: authenticated inserts only ============
DROP POLICY IF EXISTS "System can insert transfer history" ON public.budget_transfer_history;
CREATE POLICY "Authenticated users can insert transfer history" ON public.budget_transfer_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============ BUDGET TRANSFERS: restrict update to comptabilite/admin ============
DROP POLICY IF EXISTS "System can update budget transfers" ON public.budget_transfers;
CREATE POLICY "Comptabilite users can update budget transfers" ON public.budget_transfers
  FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(), 'comptabilite'::module_name, 'update'::permission_type) OR is_admin(auth.uid()))
  WITH CHECK (has_permission(auth.uid(), 'comptabilite'::module_name, 'update'::permission_type) OR is_admin(auth.uid()));

-- ============ DOCUMENT SIGNATURES: restrict reads to participants/admins ============
CREATE OR REPLACE FUNCTION public.is_signature_participant(_document_type text, _document_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.document_signatures ds
    WHERE ds.document_type = _document_type
      AND ds.document_id = _document_id
      AND (ds.user_id = auth.uid() OR ds.created_by = auth.uid())
  );
$$;

DROP POLICY IF EXISTS "Users can view document signatures" ON public.document_signatures;
CREATE POLICY "Participants can view document signatures" ON public.document_signatures
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR created_by = auth.uid()
    OR is_signature_participant(document_type, document_id)
  );

-- ============ SECURITY TABLES: admin-only management ============
DROP POLICY IF EXISTS "System can manage auto actions" ON public.security_alert_auto_actions;
CREATE POLICY "Admins can manage auto actions" ON public.security_alert_auto_actions
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can manage alert notifications" ON public.security_alert_notifications;
CREATE POLICY "Admins can manage alert notifications" ON public.security_alert_notifications
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can manage event counters" ON public.security_event_counters;
CREATE POLICY "Admins can manage event counters" ON public.security_event_counters
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "System can manage security metrics" ON public.security_metrics;
CREATE POLICY "Admins can manage security metrics" ON public.security_metrics
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- ============ SECURITY HISTORY: authenticated inserts only ============
DROP POLICY IF EXISTS "System can insert alert history" ON public.security_alert_history;
CREATE POLICY "Authenticated users can insert alert history" ON public.security_alert_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "System can insert incident history" ON public.security_incident_history;
CREATE POLICY "Authenticated users can insert incident history" ON public.security_incident_history
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============ EXPENSE ATTACHMENTS STORAGE: remove overly broad policies ============
DROP POLICY IF EXISTS "Users can view expense attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload expense attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete expense attachments" ON storage.objects;
