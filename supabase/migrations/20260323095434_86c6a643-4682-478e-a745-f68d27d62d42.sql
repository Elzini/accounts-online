
-- Add company_id column to journal_entry_lines
ALTER TABLE public.journal_entry_lines 
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- Disable conflicting triggers for bulk backfill
ALTER TABLE public.journal_entry_lines DISABLE TRIGGER sync_journal_entry_totals;
ALTER TABLE public.journal_entry_lines DISABLE TRIGGER trg_protect_posted_journal_lines;
ALTER TABLE public.journal_entry_lines DISABLE TRIGGER trg_sync_journal_line;

-- Backfill company_id from parent
UPDATE public.journal_entry_lines jel
SET company_id = je.company_id
FROM public.journal_entries je
WHERE jel.journal_entry_id = je.id
  AND jel.company_id IS NULL;

-- Re-enable triggers
ALTER TABLE public.journal_entry_lines ENABLE TRIGGER sync_journal_entry_totals;
ALTER TABLE public.journal_entry_lines ENABLE TRIGGER trg_protect_posted_journal_lines;
ALTER TABLE public.journal_entry_lines ENABLE TRIGGER trg_sync_journal_line;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jel_company_account 
  ON public.journal_entry_lines(company_id, account_id);
CREATE INDEX IF NOT EXISTS idx_jel_company_entry 
  ON public.journal_entry_lines(company_id, journal_entry_id);

-- Auto-populate trigger
CREATE OR REPLACE FUNCTION public.auto_set_jel_company_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.journal_entries WHERE id = NEW.journal_entry_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_jel_company_id ON public.journal_entry_lines;
CREATE TRIGGER trg_auto_jel_company_id
  BEFORE INSERT ON public.journal_entry_lines
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_jel_company_id();
