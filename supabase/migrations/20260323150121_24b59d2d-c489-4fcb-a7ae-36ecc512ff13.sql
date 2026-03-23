
CREATE TABLE public.tax_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rule_key TEXT NOT NULL,
  label TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'standard' CHECK (method IN ('standard', 'margin_scheme', 'zero_rated', 'exempt')),
  rate NUMERIC NOT NULL DEFAULT 15,
  applies_to_condition TEXT,
  applies_to_transaction TEXT CHECK (applies_to_transaction IN ('sale', 'purchase', 'both')),
  margin_inclusive BOOLEAN DEFAULT false,
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, rule_key)
);

ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company tax rules"
  ON public.tax_rules FOR SELECT TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage own company tax rules"
  ON public.tax_rules FOR ALL TO authenticated
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));
