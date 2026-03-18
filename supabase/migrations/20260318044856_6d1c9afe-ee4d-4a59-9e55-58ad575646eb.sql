
-- Create the missing BEFORE INSERT trigger for auto-assigning entry numbers
DROP TRIGGER IF EXISTS trg_assign_journal_entry_number ON public.journal_entries;
CREATE TRIGGER trg_assign_journal_entry_number
  BEFORE INSERT ON public.journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_journal_entry_number();

-- Temporarily disable protection triggers for renumbering
ALTER TABLE public.journal_entries DISABLE TRIGGER trg_protect_posted_journal_entries;
ALTER TABLE public.journal_entries DISABLE TRIGGER prevent_journal_entry_closed_fy;

-- Fix existing entries: re-number per company+fiscal_year
WITH numbered AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY company_id, fiscal_year_id 
           ORDER BY entry_date, created_at
         ) as new_number
  FROM public.journal_entries
)
UPDATE public.journal_entries je
SET entry_number = n.new_number
FROM numbered n
WHERE je.id = n.id AND je.entry_number != n.new_number;

-- Re-enable protection triggers
ALTER TABLE public.journal_entries ENABLE TRIGGER trg_protect_posted_journal_entries;
ALTER TABLE public.journal_entries ENABLE TRIGGER prevent_journal_entry_closed_fy;
