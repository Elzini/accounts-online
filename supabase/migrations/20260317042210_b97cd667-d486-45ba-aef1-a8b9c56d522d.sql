
-- Function to renumber journal entries after deletion (gapless sequencing)
CREATE OR REPLACE FUNCTION renumber_journal_entries_after_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Renumber all entries for the same company and fiscal year
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

  RETURN OLD;
END;
$$;

-- Create trigger on DELETE
DROP TRIGGER IF EXISTS trg_renumber_journal_entries ON public.journal_entries;
CREATE TRIGGER trg_renumber_journal_entries
  AFTER DELETE ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION renumber_journal_entries_after_delete();
