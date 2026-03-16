
-- Fix the assign_journal_entry_number trigger function
CREATE OR REPLACE FUNCTION assign_journal_entry_number()
RETURNS TRIGGER AS $$
DECLARE
  v_next_number INTEGER;
  v_fiscal_year_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.fiscal_year_id IS NULL THEN
      SELECT id INTO v_fiscal_year_id FROM fiscal_years
      WHERE company_id = NEW.company_id AND is_current = true LIMIT 1;
      
      IF v_fiscal_year_id IS NULL THEN
        SELECT id INTO v_fiscal_year_id FROM fiscal_years
        WHERE company_id = NEW.company_id
        AND NEW.entry_date BETWEEN start_date AND end_date LIMIT 1;
      END IF;

      IF v_fiscal_year_id IS NULL THEN
        SELECT id INTO v_fiscal_year_id FROM fiscal_years
        WHERE company_id = NEW.company_id AND status = 'open'
        ORDER BY start_date DESC LIMIT 1;
      END IF;
      
      NEW.fiscal_year_id := v_fiscal_year_id;
    END IF;

    SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_next_number
    FROM public.journal_entries
    WHERE company_id = NEW.company_id
      AND fiscal_year_id IS NOT DISTINCT FROM NEW.fiscal_year_id;
    
    NEW.entry_number := v_next_number;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Temporarily disable the closed fiscal year trigger
ALTER TABLE journal_entries DISABLE TRIGGER prevent_journal_entry_closed_fy;

-- Fix existing entries: assign fiscal_year_id where missing
UPDATE journal_entries je
SET fiscal_year_id = fy.id
FROM fiscal_years fy
WHERE je.fiscal_year_id IS NULL
  AND fy.company_id = je.company_id
  AND je.entry_date BETWEEN fy.start_date AND fy.end_date;

UPDATE journal_entries je
SET fiscal_year_id = (
  SELECT fy.id FROM fiscal_years fy
  WHERE fy.company_id = je.company_id AND fy.status = 'open'
  ORDER BY fy.start_date DESC LIMIT 1
)
WHERE je.fiscal_year_id IS NULL;

-- Re-number all entries per company+fiscal_year by entry_date and created_at
WITH numbered AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY company_id, fiscal_year_id 
           ORDER BY entry_date, created_at
         ) as new_number
  FROM journal_entries
)
UPDATE journal_entries je
SET entry_number = n.new_number
FROM numbered n
WHERE je.id = n.id AND je.entry_number != n.new_number;

-- Re-enable the trigger
ALTER TABLE journal_entries ENABLE TRIGGER prevent_journal_entry_closed_fy;
