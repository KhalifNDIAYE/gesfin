-- Add missing columns to contracts table for complete form
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS contract_number TEXT,
ADD COLUMN IF NOT EXISTS attributaire TEXT,
ADD COLUMN IF NOT EXISTS amount_ht NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tva_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tva_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES auth.users(id);

-- Create contract_bailleurs junction table for multi-select
CREATE TABLE IF NOT EXISTS public.contract_bailleurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  bailleur_id UUID NOT NULL REFERENCES public.bailleurs(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(contract_id, bailleur_id)
);

-- Create contract_conventions junction table for multi-select
CREATE TABLE IF NOT EXISTS public.contract_conventions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  convention_id UUID NOT NULL REFERENCES public.conventions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(contract_id, convention_id)
);

-- Create contract_documents table for file attachments
CREATE TABLE IF NOT EXISTS public.contract_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create contract_payment_schedule for payment milestones
CREATE TABLE IF NOT EXISTS public.contract_payment_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  milestone_number INTEGER NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  percentage NUMERIC,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.contract_bailleurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_conventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_payment_schedule ENABLE ROW LEVEL SECURITY;

-- RLS policies for contract_bailleurs
CREATE POLICY "Users can view contract_bailleurs" ON public.contract_bailleurs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert contract_bailleurs" ON public.contract_bailleurs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update contract_bailleurs" ON public.contract_bailleurs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete contract_bailleurs" ON public.contract_bailleurs FOR DELETE TO authenticated USING (true);

-- RLS policies for contract_conventions
CREATE POLICY "Users can view contract_conventions" ON public.contract_conventions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert contract_conventions" ON public.contract_conventions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update contract_conventions" ON public.contract_conventions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete contract_conventions" ON public.contract_conventions FOR DELETE TO authenticated USING (true);

-- RLS policies for contract_documents
CREATE POLICY "Users can view contract_documents" ON public.contract_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert contract_documents" ON public.contract_documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update contract_documents" ON public.contract_documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete contract_documents" ON public.contract_documents FOR DELETE TO authenticated USING (true);

-- RLS policies for contract_payment_schedule
CREATE POLICY "Users can view contract_payment_schedule" ON public.contract_payment_schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert contract_payment_schedule" ON public.contract_payment_schedule FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update contract_payment_schedule" ON public.contract_payment_schedule FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete contract_payment_schedule" ON public.contract_payment_schedule FOR DELETE TO authenticated USING (true);

-- Create storage bucket for contract documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('contract-documents', 'contract-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for contract documents
CREATE POLICY "Authenticated users can view contract documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contract-documents');

CREATE POLICY "Authenticated users can upload contract documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contract-documents');

CREATE POLICY "Authenticated users can delete contract documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'contract-documents');