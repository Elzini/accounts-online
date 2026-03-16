
-- Temporarily disable the closed fiscal year check trigger
ALTER TABLE public.journal_entries DISABLE TRIGGER prevent_journal_entry_closed_fy;

-- Re-number all entries per company + fiscal_year ordered by date
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

-- Also update the assign trigger to auto-set fiscal_year_id when NULL
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
      SELECT id INTO v_fiscal_year_id FROM fiscal_years
      WHERE company_id = NEW.company_id AND is_active = true LIMIT 1;
      
      IF v_fiscal_year_id IS NULL THEN
        SELECT id INTO v_fiscal_year_id FROM fiscal_years
        WHERE company_id = NEW.company_id
        AND NEW.entry_date BETWEEN start_date AND end_date LIMIT 1;
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
