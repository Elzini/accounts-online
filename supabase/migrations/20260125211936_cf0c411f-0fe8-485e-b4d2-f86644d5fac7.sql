
-- Create function to auto-create account when expense category is added
CREATE OR REPLACE FUNCTION public.create_account_for_expense_category()
RETURNS TRIGGER AS $$
DECLARE
  next_code TEXT;
  max_code INTEGER;
BEGIN
  -- Find the next available code under 54xx (مصروفات أخرى) or 52xx (المصروفات الإدارية)
  SELECT COALESCE(MAX(CAST(code AS INTEGER)), 5404) INTO max_code
  FROM public.account_categories 
  WHERE company_id = NEW.company_id 
    AND code ~ '^54[0-9]{2}$';
  
  next_code := (max_code + 1)::TEXT;
  
  -- If we exceed 5499, use 55xx series
  IF max_code >= 5499 THEN
    SELECT COALESCE(MAX(CAST(code AS INTEGER)), 5500) INTO max_code
    FROM public.account_categories 
    WHERE company_id = NEW.company_id 
      AND code ~ '^55[0-9]{2}$';
    next_code := (max_code + 1)::TEXT;
  END IF;
  
  -- Create the account in chart of accounts
  INSERT INTO public.account_categories (
    company_id,
    code,
    name,
    type,
    description,
    is_system
  )
  VALUES (
    NEW.company_id,
    next_code,
    NEW.name,
    'expenses',
    COALESCE(NEW.description, 'فئة مصروفات: ' || NEW.name),
    false
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-creating accounts
DROP TRIGGER IF EXISTS create_account_for_expense_category_trigger ON public.expense_categories;
CREATE TRIGGER create_account_for_expense_category_trigger
AFTER INSERT ON public.expense_categories
FOR EACH ROW
EXECUTE FUNCTION public.create_account_for_expense_category();

-- Also create accounts for existing expense categories that don't have matching accounts
DO $$
DECLARE
  cat RECORD;
  next_code TEXT;
  max_code INTEGER;
BEGIN
  FOR cat IN 
    SELECT ec.* 
    FROM expense_categories ec
    WHERE NOT EXISTS (
      SELECT 1 FROM account_categories ac 
      WHERE ac.company_id = ec.company_id 
        AND ac.name = ec.name 
        AND ac.type = 'expenses'
    )
  LOOP
    -- Find next available code
    SELECT COALESCE(MAX(CAST(code AS INTEGER)), 5404) INTO max_code
    FROM account_categories 
    WHERE company_id = cat.company_id 
      AND code ~ '^54[0-9]{2}$';
    
    next_code := (max_code + 1)::TEXT;
    
    IF max_code >= 5499 THEN
      SELECT COALESCE(MAX(CAST(code AS INTEGER)), 5500) INTO max_code
      FROM account_categories 
      WHERE company_id = cat.company_id 
        AND code ~ '^55[0-9]{2}$';
      next_code := (max_code + 1)::TEXT;
    END IF;
    
    INSERT INTO account_categories (company_id, code, name, type, description, is_system)
    VALUES (cat.company_id, next_code, cat.name, 'expenses', COALESCE(cat.description, 'فئة مصروفات'), false)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
