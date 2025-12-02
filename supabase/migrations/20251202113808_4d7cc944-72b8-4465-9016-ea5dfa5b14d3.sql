-- Create enum for journal types
CREATE TYPE public.journal_type AS ENUM (
  'achats',
  'ventes', 
  'banque',
  'caisse',
  'operations_diverses',
  'a_nouveaux'
);

-- Create enum for entry types
CREATE TYPE public.entry_type AS ENUM (
  'depense',
  'financement',
  'decaissement',
  'prise_en_charge',
  'autre'
);

-- Create enum for entry status
CREATE TYPE public.entry_status AS ENUM (
  'brouillon',
  'valide',
  'cloture'
);

-- Create enum for third party types
CREATE TYPE public.third_party_type AS ENUM (
  'fournisseur',
  'client',
  'employe',
  'bailleur',
  'autre'
);

-- Create journals table (codes journaux)
CREATE TABLE public.journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  journal_type journal_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create third_parties table (tiers)
CREATE TABLE public.third_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  third_party_type third_party_type NOT NULL,
  account_code TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create journal_entries table (pièces comptables)
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL,
  journal_id UUID NOT NULL REFERENCES public.journals(id),
  fiscal_year_id UUID NOT NULL REFERENCES public.fiscal_years(id),
  entry_type entry_type NOT NULL DEFAULT 'autre',
  description TEXT NOT NULL,
  reference TEXT,
  currency_id UUID NOT NULL REFERENCES public.currencies(id),
  exchange_rate NUMERIC(18, 6) DEFAULT 1,
  status entry_status NOT NULL DEFAULT 'brouillon',
  third_party_id UUID REFERENCES public.third_parties(id),
  created_by UUID REFERENCES public.profiles(id),
  validated_by UUID REFERENCES public.profiles(id),
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create journal_entry_lines table (lignes d'écriture)
CREATE TABLE public.journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  account_id UUID NOT NULL REFERENCES public.plan_accounts(id),
  description TEXT,
  debit_amount NUMERIC(18, 2) DEFAULT 0,
  credit_amount NUMERIC(18, 2) DEFAULT 0,
  debit_amount_currency NUMERIC(18, 2) DEFAULT 0,
  credit_amount_currency NUMERIC(18, 2) DEFAULT 0,
  third_party_id UUID REFERENCES public.third_parties(id),
  tracking_axis_id UUID REFERENCES public.tracking_axes(id),
  lettering_code TEXT,
  is_lettered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT line_number_positive CHECK (line_number > 0),
  CONSTRAINT valid_amounts CHECK (
    (debit_amount >= 0 AND credit_amount >= 0) AND
    (debit_amount = 0 OR credit_amount = 0)
  )
);

-- Create unique constraint for entry number per fiscal year
CREATE UNIQUE INDEX idx_journal_entries_number_year ON public.journal_entries(entry_number, fiscal_year_id);

-- Create indexes for better performance
CREATE INDEX idx_journal_entries_date ON public.journal_entries(entry_date);
CREATE INDEX idx_journal_entries_fiscal_year ON public.journal_entries(fiscal_year_id);
CREATE INDEX idx_journal_entries_journal ON public.journal_entries(journal_id);
CREATE INDEX idx_journal_entries_status ON public.journal_entries(status);
CREATE INDEX idx_journal_entry_lines_account ON public.journal_entry_lines(account_id);
CREATE INDEX idx_journal_entry_lines_entry ON public.journal_entry_lines(journal_entry_id);
CREATE INDEX idx_journal_entry_lines_lettering ON public.journal_entry_lines(lettering_code) WHERE lettering_code IS NOT NULL;

-- Enable RLS
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.third_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

-- RLS Policies for journals
CREATE POLICY "Authenticated users can view journals" ON public.journals
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can manage journals" ON public.journals
  FOR ALL USING (has_permission(auth.uid(), 'comptabilite', 'create'));

-- RLS Policies for third_parties
CREATE POLICY "Authenticated users can view third parties" ON public.third_parties
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can manage third parties" ON public.third_parties
  FOR ALL USING (has_permission(auth.uid(), 'comptabilite', 'create'));

-- RLS Policies for journal_entries
CREATE POLICY "Authenticated users can view journal entries" ON public.journal_entries
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can manage journal entries" ON public.journal_entries
  FOR ALL USING (has_permission(auth.uid(), 'comptabilite', 'create'));

-- RLS Policies for journal_entry_lines
CREATE POLICY "Authenticated users can view journal entry lines" ON public.journal_entry_lines
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users with comptabilite permission can manage journal entry lines" ON public.journal_entry_lines
  FOR ALL USING (has_permission(auth.uid(), 'comptabilite', 'create'));

-- Insert default journals
INSERT INTO public.journals (code, name, journal_type) VALUES
  ('ACH', 'Journal des Achats', 'achats'),
  ('VTE', 'Journal des Ventes', 'ventes'),
  ('BQ', 'Journal de Banque', 'banque'),
  ('CAI', 'Journal de Caisse', 'caisse'),
  ('OD', 'Opérations Diverses', 'operations_diverses'),
  ('AN', 'À-Nouveaux', 'a_nouveaux');

-- Create triggers for updated_at
CREATE TRIGGER update_journals_updated_at
  BEFORE UPDATE ON public.journals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_third_parties_updated_at
  BEFORE UPDATE ON public.third_parties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_journal_entry_lines_updated_at
  BEFORE UPDATE ON public.journal_entry_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to generate entry number
CREATE OR REPLACE FUNCTION public.generate_entry_number(
  _journal_code TEXT,
  _fiscal_year_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _year_name TEXT;
  _sequence INTEGER;
  _entry_number TEXT;
BEGIN
  SELECT name INTO _year_name FROM fiscal_years WHERE id = _fiscal_year_id;
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(entry_number FROM LENGTH(_journal_code) + 2 FOR LENGTH(entry_number) - LENGTH(_journal_code) - 1 - LENGTH(_year_name)) AS INTEGER)
  ), 0) + 1
  INTO _sequence
  FROM journal_entries je
  JOIN journals j ON j.id = je.journal_id
  WHERE j.code = _journal_code
    AND je.fiscal_year_id = _fiscal_year_id;
  
  _entry_number := _journal_code || '-' || LPAD(_sequence::TEXT, 6, '0') || '/' || _year_name;
  
  RETURN _entry_number;
END;
$$;