
-- ==========================================
-- 1. Multi-Currency Support
-- ==========================================
CREATE TABLE public.currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  symbol TEXT,
  is_base BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  decimal_places INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  from_currency_id UUID NOT NULL REFERENCES public.currencies(id),
  to_currency_id UUID NOT NULL REFERENCES public.currencies(id),
  rate NUMERIC(18,6) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 2. Document Attachments Storage Bucket
-- ==========================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('journal-attachments', 'journal-attachments', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view journal attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'journal-attachments');

CREATE POLICY "Authenticated users can upload journal attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'journal-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete journal attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'journal-attachments' AND auth.role() = 'authenticated');

-- Journal attachments metadata table
CREATE TABLE public.journal_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- 3. Multi-Branch Support
-- ==========================================
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  phone TEXT,
  manager_name TEXT,
  is_main BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- ==========================================
-- RLS
-- ==========================================
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage currencies" ON public.currencies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage exchange rates" ON public.exchange_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage journal attachments" ON public.journal_attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can manage branches" ON public.branches FOR ALL USING (true) WITH CHECK (true);
