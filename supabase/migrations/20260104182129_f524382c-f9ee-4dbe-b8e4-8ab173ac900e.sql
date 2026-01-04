-- Create enum for signature status
CREATE TYPE public.signature_status AS ENUM ('pending', 'signed', 'rejected', 'cancelled');

-- Create table for document signatures
CREATE TABLE public.document_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(100) NOT NULL, -- 'convention', 'marche', 'budget', 'rapport', etc.
    document_id UUID NOT NULL,
    document_ref VARCHAR(255), -- Human-readable reference
    document_hash VARCHAR(128) NOT NULL, -- SHA-256 hash of PDF content
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    signer_name VARCHAR(255) NOT NULL,
    signer_role VARCHAR(100) NOT NULL,
    signer_email VARCHAR(255),
    signature_status public.signature_status DEFAULT 'pending',
    signed_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    signature_image_url TEXT, -- Optional handwritten signature image
    legal_consent BOOLEAN DEFAULT FALSE,
    consent_text TEXT,
    signature_order INTEGER DEFAULT 1, -- For multi-signer workflow
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for faster lookups
CREATE INDEX idx_document_signatures_document ON public.document_signatures(document_type, document_id);
CREATE INDEX idx_document_signatures_user ON public.document_signatures(user_id);
CREATE INDEX idx_document_signatures_status ON public.document_signatures(signature_status);

-- Enable RLS
ALTER TABLE public.document_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view signatures for documents they have access to
CREATE POLICY "Users can view document signatures"
ON public.document_signatures
FOR SELECT
TO authenticated
USING (true);

-- Users can create signature requests if they have permission
CREATE POLICY "Users can create signature requests"
ON public.document_signatures
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Users can update their own pending signatures (to sign or reject)
CREATE POLICY "Users can sign their pending signatures"
ON public.document_signatures
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND signature_status = 'pending');

-- Admins can update any signature
CREATE POLICY "Admins can manage all signatures"
ON public.document_signatures
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_document_signatures_updated_at
    BEFORE UPDATE ON public.document_signatures
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create table to track signature workflow templates
CREATE TABLE public.signature_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_type VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    required_roles TEXT[] NOT NULL, -- Array of roles required to sign
    signature_order_type VARCHAR(50) DEFAULT 'sequential', -- 'sequential' or 'parallel'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on signature_workflows
ALTER TABLE public.signature_workflows ENABLE ROW LEVEL SECURITY;

-- Everyone can view workflows
CREATE POLICY "Users can view signature workflows"
ON public.signature_workflows
FOR SELECT
TO authenticated
USING (true);

-- Only admins can manage workflows
CREATE POLICY "Admins can manage signature workflows"
ON public.signature_workflows
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default workflows
INSERT INTO public.signature_workflows (document_type, name, description, required_roles, signature_order_type)
VALUES 
    ('convention', 'Convention Standard', 'Workflow de signature pour les conventions', ARRAY['responsable_financier', 'directeur_financier', 'directeur_general'], 'sequential'),
    ('marche', 'Marché Standard', 'Workflow de signature pour les marchés', ARRAY['chef_projet', 'directeur_financier', 'directeur_general'], 'sequential'),
    ('budget', 'Budget Standard', 'Workflow de signature pour les budgets', ARRAY['responsable_financier', 'directeur_financier'], 'sequential');