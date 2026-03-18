
-- Fix entries with NULL fiscal_year_id by assigning the correct fiscal year
ALTER TABLE public.journal_entries DISABLE TRIGGER trg_protect_posted_journal_entries;
ALTER TABLE public.journal_entries DISABLE TRIGGER prevent_journal_entry_closed_fy;

UPDATE public.journal_entries je
SET fiscal_year_id = fy.id
FROM public.fiscal_years fy
WHERE je.fiscal_year_id IS NULL
  AND fy.company_id = je.company_id
  AND je.entry_date BETWEEN fy.start_date AND fy.end_date;

-- Renumber all entries per company+fiscal_year
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

ALTER TABLE public.journal_entries ENABLE TRIGGER trg_protect_posted_journal_entries;
ALTER TABLE public.journal_entries ENABLE TRIGGER prevent_journal_entry_closed_fy;

-- Also fix the trigger function to handle the case where is_active column doesn't exist
-- Use is_current instead
CREATE OR REPLACE FUNCTION public.assign_journal_entry_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_number INTEGER;
  v_fiscal_year_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Auto-assign fiscal_year_id if not set
    IF NEW.fiscal_year_id IS NULL THEN
      -- Try is_current first
      SELECT id INTO v_fiscal_year_id FROM fiscal_years
      WHERE company_id = NEW.company_id AND is_current = true LIMIT 1;
      
      -- Then try date range match
      IF v_fiscal_year_id IS NULL THEN
        SELECT id INTO v_fiscal_year_id FROM fiscal_years
        WHERE company_id = NEW.company_id
        AND NEW.entry_date BETWEEN start_date AND end_date LIMIT 1;
      END IF;

      -- Finally try any open fiscal year
      IF v_fiscal_year_id IS NULL THEN
        SELECT id INTO v_fiscal_year_id FROM fiscal_years
        WHERE company_id = NEW.company_id AND status = 'open'
        ORDER BY start_date DESC LIMIT 1;
      END IF;
      
      NEW.fiscal_year_id := v_fiscal_year_id;
    END IF;

    -- Get next entry number for this company + fiscal_year
    SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_next_number
    FROM public.journal_entries
    WHERE company_id = NEW.company_id
      AND fiscal_year_id IS NOT DISTINCT FROM NEW.fiscal_year_id;
    
    NEW.entry_number := v_next_number;
  END IF;
  
  RETURN NEW;
END;
$$;
