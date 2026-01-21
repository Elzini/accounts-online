
-- Create a function to regenerate all journal entries for existing sales and purchases
CREATE OR REPLACE FUNCTION public.regenerate_journal_entries(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sale RECORD;
  v_car RECORD;
  v_count_sales INT := 0;
  v_count_purchases INT := 0;
BEGIN
  -- Delete existing journal entries that are auto-generated
  DELETE FROM journal_entries 
  WHERE company_id = p_company_id 
    AND reference_type IN ('sale', 'purchase');
  
  -- Regenerate purchase entries for all cars
  FOR v_car IN 
    SELECT * FROM cars WHERE company_id = p_company_id
  LOOP
    -- Delete any existing entry for this car first
    DELETE FROM journal_entries WHERE reference_type = 'purchase' AND reference_id = v_car.id::text;
    
    -- Trigger the function manually by doing an update
    UPDATE cars SET updated_at = NOW() WHERE id = v_car.id;
    v_count_purchases := v_count_purchases + 1;
  END LOOP;
  
  -- Regenerate sale entries for all sales
  FOR v_sale IN 
    SELECT * FROM sales WHERE company_id = p_company_id
  LOOP
    -- Delete any existing entry for this sale first
    DELETE FROM journal_entries WHERE reference_type = 'sale' AND reference_id = v_sale.id::text;
    
    -- Trigger the function manually by doing an update
    UPDATE sales SET updated_at = NOW() WHERE id = v_sale.id;
    v_count_sales := v_count_sales + 1;
  END LOOP;
  
  RETURN 'Regenerated ' || v_count_purchases || ' purchase entries and ' || v_count_sales || ' sale entries';
END;
$$;
