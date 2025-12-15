-- Create compliance standards enum
CREATE TYPE public.compliance_standard AS ENUM ('SOC2', 'HIPAA', 'RGPD', 'FedRAMP', 'ISO27001');

-- Create compliance status enum
CREATE TYPE public.compliance_status AS ENUM ('conforme', 'non_conforme', 'a_ameliorer', 'en_cours');

-- Create incident severity enum
CREATE TYPE public.incident_severity AS ENUM ('mineur', 'majeur', 'critique');

-- Create incident status enum
CREATE TYPE public.incident_status AS ENUM ('ouvert', 'en_cours', 'clos');

-- Create policy type enum
CREATE TYPE public.security_policy_type AS ENUM ('mot_de_passe', 'acces', 'sauvegarde', 'conservation_donnees');

-- Compliance Controls table
CREATE TABLE public.compliance_controls (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    standard compliance_standard NOT NULL,
    status compliance_status NOT NULL DEFAULT 'en_cours',
    responsible_id UUID REFERENCES public.profiles(id),
    evidence_document_path TEXT,
    evidence_description TEXT,
    last_verification_date TIMESTAMP WITH TIME ZONE,
    next_verification_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RGPD Registry table
CREATE TABLE public.rgpd_registry (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    treatment_name TEXT NOT NULL,
    purpose TEXT NOT NULL,
    data_categories TEXT[] NOT NULL,
    legal_basis TEXT NOT NULL,
    retention_period TEXT NOT NULL,
    data_controller_id UUID REFERENCES public.profiles(id),
    subprocessors TEXT[],
    data_subjects TEXT,
    security_measures TEXT,
    cross_border_transfers BOOLEAN DEFAULT false,
    transfer_details TEXT,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Security Incidents table
CREATE TABLE public.security_incidents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity incident_severity NOT NULL,
    status incident_status NOT NULL DEFAULT 'ouvert',
    impact TEXT,
    affected_systems TEXT[],
    affected_users_count INTEGER DEFAULT 0,
    detection_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolution_date TIMESTAMP WITH TIME ZONE,
    root_cause TEXT,
    corrective_actions TEXT,
    preventive_actions TEXT,
    reported_by UUID REFERENCES public.profiles(id),
    assigned_to UUID REFERENCES public.profiles(id),
    closed_by UUID REFERENCES public.profiles(id),
    closed_at TIMESTAMP WITH TIME ZONE,
    notifications_sent BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Security Incident History table
CREATE TABLE public.security_incident_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id UUID NOT NULL REFERENCES public.security_incidents(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    from_status incident_status,
    to_status incident_status,
    comment TEXT,
    performed_by UUID REFERENCES public.profiles(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Security Policies table
CREATE TABLE public.security_policies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    policy_type security_policy_type NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    requires_acknowledgment BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Policy Version History
CREATE TABLE public.security_policy_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES public.security_policies(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    content TEXT NOT NULL,
    changes_summary TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Policy Acknowledgments table
CREATE TABLE public.security_policy_acknowledgments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL REFERENCES public.security_policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ip_address TEXT,
    UNIQUE(policy_id, user_id)
);

-- Security Alerts table
CREATE TABLE public.security_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_type TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'warning',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    source TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    email_sent BOOLEAN DEFAULT false,
    notification_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Security Metrics table (for dashboard)
CREATE TABLE public.security_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_date DATE NOT NULL,
    active_users_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    blocked_actions_count INTEGER DEFAULT 0,
    security_incidents_count INTEGER DEFAULT 0,
    compliance_score NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(metric_date)
);

-- Enable RLS on all tables
ALTER TABLE public.compliance_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rgpd_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_incident_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_policy_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for compliance_controls
CREATE POLICY "Admins and security users can view compliance controls"
ON public.compliance_controls FOR SELECT
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite'::module_name, 'read'::permission_type));

CREATE POLICY "Admins can manage compliance controls"
ON public.compliance_controls FOR ALL
USING (is_admin(auth.uid()));

-- RLS Policies for rgpd_registry
CREATE POLICY "Admins and security users can view RGPD registry"
ON public.rgpd_registry FOR SELECT
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite'::module_name, 'read'::permission_type));

CREATE POLICY "Admins can manage RGPD registry"
ON public.rgpd_registry FOR ALL
USING (is_admin(auth.uid()));

-- RLS Policies for security_incidents
CREATE POLICY "Admins and security users can view security incidents"
ON public.security_incidents FOR SELECT
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite'::module_name, 'read'::permission_type));

CREATE POLICY "Admins can manage security incidents"
ON public.security_incidents FOR ALL
USING (is_admin(auth.uid()));

-- RLS Policies for security_incident_history
CREATE POLICY "Admins and security users can view incident history"
ON public.security_incident_history FOR SELECT
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite'::module_name, 'read'::permission_type));

CREATE POLICY "System can insert incident history"
ON public.security_incident_history FOR INSERT
WITH CHECK (true);

-- RLS Policies for security_policies
CREATE POLICY "Authenticated users can view active policies"
ON public.security_policies FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

CREATE POLICY "Admins can manage security policies"
ON public.security_policies FOR ALL
USING (is_admin(auth.uid()));

-- RLS Policies for security_policy_versions
CREATE POLICY "Admins and security users can view policy versions"
ON public.security_policy_versions FOR SELECT
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite'::module_name, 'read'::permission_type));

CREATE POLICY "Admins can manage policy versions"
ON public.security_policy_versions FOR ALL
USING (is_admin(auth.uid()));

-- RLS Policies for security_policy_acknowledgments
CREATE POLICY "Users can view their own acknowledgments"
ON public.security_policy_acknowledgments FOR SELECT
USING (user_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Users can acknowledge policies"
ON public.security_policy_acknowledgments FOR INSERT
WITH CHECK (user_id = auth.uid());

-- RLS Policies for security_alerts
CREATE POLICY "Admins and security users can view security alerts"
ON public.security_alerts FOR SELECT
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite'::module_name, 'read'::permission_type));

CREATE POLICY "System can insert security alerts"
ON public.security_alerts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can update security alerts"
ON public.security_alerts FOR UPDATE
USING (is_admin(auth.uid()));

-- RLS Policies for security_metrics
CREATE POLICY "Admins and security users can view security metrics"
ON public.security_metrics FOR SELECT
USING (is_admin(auth.uid()) OR has_permission(auth.uid(), 'securite'::module_name, 'read'::permission_type));

CREATE POLICY "System can manage security metrics"
ON public.security_metrics FOR ALL
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_compliance_controls_updated_at
BEFORE UPDATE ON public.compliance_controls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rgpd_registry_updated_at
BEFORE UPDATE ON public.rgpd_registry
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_incidents_updated_at
BEFORE UPDATE ON public.security_incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_policies_updated_at
BEFORE UPDATE ON public.security_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_compliance_controls_standard ON public.compliance_controls(standard);
CREATE INDEX idx_compliance_controls_status ON public.compliance_controls(status);
CREATE INDEX idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX idx_security_alerts_created_at ON public.security_alerts(created_at);
CREATE INDEX idx_security_metrics_date ON public.security_metrics(metric_date);