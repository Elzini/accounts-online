
-- Update renumber function to temporarily bypass protection
CREATE OR REPLACE FUNCTION renumber_journal_entries_after_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Temporarily disable protection to allow renumbering
  ALTER TABLE public.journal_entries DISABLE TRIGGER trg_protect_posted_journal_entries;
  
  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (
      ORDER BY entry_date ASC, created_at ASC
    ) AS new_number
    FROM public.journal_entries
    WHERE company_id = OLD.company_id
      AND fiscal_year_id IS NOT DISTINCT FROM OLD.fiscal_year_id
  )
  UPDATE public.journal_entries je
  SET entry_number = numbered.new_number
  FROM numbered
  WHERE je.id = numbered.id
    AND je.entry_number != numbered.new_number;

  -- Re-enable protection
  ALTER TABLE public.journal_entries ENABLE TRIGGER trg_protect_posted_journal_entries;
  
  RETURN OLD;
END;
$$;
