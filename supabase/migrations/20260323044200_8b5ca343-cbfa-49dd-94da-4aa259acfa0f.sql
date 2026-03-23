
-- Auto-set is_current when creating a new fiscal year
-- If the new year's start_date covers "today", make it current
CREATE OR REPLACE FUNCTION public.auto_set_current_fiscal_year()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the new fiscal year covers today's date, make it current
  IF CURRENT_DATE >= NEW.start_date AND CURRENT_DATE <= NEW.end_date THEN
    -- Unset other years for same company
    UPDATE fiscal_years 
    SET is_current = false 
    WHERE company_id = NEW.company_id AND id != NEW.id;
    
    NEW.is_current := true;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS trg_auto_current_fiscal_year ON fiscal_years;
CREATE TRIGGER trg_auto_current_fiscal_year
  BEFORE INSERT ON fiscal_years
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_current_fiscal_year();

-- Fix existing data: set is_current based on today's date
UPDATE fiscal_years SET is_current = false;
UPDATE fiscal_years SET is_current = true
WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
AND id IN (
  SELECT DISTINCT ON (company_id) id 
  FROM fiscal_years 
  WHERE start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE
  ORDER BY company_id, start_date DESC
);
