
-- Create function to assign per-company sequential inventory numbers
CREATE OR REPLACE FUNCTION public.assign_company_inventory_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_next_number INT;
BEGIN
  -- Get the next inventory number for this company
  SELECT COALESCE(MAX(inventory_number), 0) + 1
  INTO v_next_number
  FROM cars
  WHERE company_id = NEW.company_id;
  
  NEW.inventory_number := v_next_number;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign inventory numbers before insert
DROP TRIGGER IF EXISTS trg_assign_inventory_number ON cars;
CREATE TRIGGER trg_assign_inventory_number
  BEFORE INSERT ON cars
  FOR EACH ROW
  EXECUTE FUNCTION assign_company_inventory_number();

-- Create function to re-sequence inventory numbers after delete
CREATE OR REPLACE FUNCTION public.resequence_inventory_numbers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Re-sequence all cars for the company after deletion
  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_num
    FROM cars
    WHERE company_id = OLD.company_id
  )
  UPDATE cars
  SET inventory_number = numbered.new_num
  FROM numbered
  WHERE cars.id = numbered.id;
  
  RETURN OLD;
END;
$$;

-- Create trigger to re-sequence after delete
DROP TRIGGER IF EXISTS trg_resequence_inventory ON cars;
CREATE TRIGGER trg_resequence_inventory
  AFTER DELETE ON cars
  FOR EACH ROW
  EXECUTE FUNCTION resequence_inventory_numbers();

-- Fix existing data: re-sequence all companies' inventory numbers
DO $$
DECLARE
  v_company RECORD;
BEGIN
  FOR v_company IN SELECT DISTINCT company_id FROM cars WHERE company_id IS NOT NULL
  LOOP
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_num
      FROM cars
      WHERE company_id = v_company.company_id
    )
    UPDATE cars
    SET inventory_number = numbered.new_num
    FROM numbered
    WHERE cars.id = numbered.id;
  END LOOP;
END;
$$;
