
-- Temporarily disable the closed fiscal year check trigger
ALTER TABLE public.journal_entries DISABLE TRIGGER prevent_journal_entry_closed_fy;

-- Re-number all existing entries per company + fiscal_year ordered by entry_date, created_at
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY company_id, fiscal_year_id 
           ORDER BY entry_date, created_at
         ) AS new_number
  FROM public.journal_entries
)
UPDATE public.journal_entries je
SET entry_number = numbered.new_number
FROM numbered
WHERE je.id = numbered.id;

-- Re-enable the trigger
ALTER TABLE public.journal_entries ENABLE TRIGGER prevent_journal_entry_closed_fy;
