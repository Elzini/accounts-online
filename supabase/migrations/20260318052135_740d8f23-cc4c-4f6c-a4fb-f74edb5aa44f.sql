-- Create trigger function to auto-create sub-account when a supplier is added
CREATE OR REPLACE FUNCTION public.auto_create_supplier_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_account_id uuid;
  parent_code text;
  next_code text;
  max_code text;
BEGIN
  -- Find the parent supplier account (code 2101) for the same company
  SELECT id, code INTO parent_account_id, parent_code
  FROM public.account_categories
  WHERE code = '2101' AND company_id = NEW.company_id
  LIMIT 1;

  IF parent_account_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the max existing sub-account code under this parent
  SELECT MAX(code) INTO max_code
  FROM public.account_categories
  WHERE parent_id = parent_account_id AND company_id = NEW.company_id;

  IF max_code IS NULL THEN
    next_code := parent_code || '01';
  ELSE
    next_code := LPAD((max_code::bigint + 1)::text, LENGTH(max_code), '0');
  END IF;

  -- Create the sub-account
  INSERT INTO public.account_categories (company_id, code, name, type, parent_id, is_system)
  VALUES (NEW.company_id, next_code, NEW.name, 'liability', parent_account_id, false)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger function to auto-create sub-account when a customer is added
CREATE OR REPLACE FUNCTION public.auto_create_customer_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent_account_id uuid;
  parent_code text;
  next_code text;
  max_code text;
BEGIN
  -- Find the parent customer account (code 1201) for the same company
  SELECT id, code INTO parent_account_id, parent_code
  FROM public.account_categories
  WHERE code = '1201' AND company_id = NEW.company_id
  LIMIT 1;

  IF parent_account_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the max existing sub-account code under this parent
  SELECT MAX(code) INTO max_code
  FROM public.account_categories
  WHERE parent_id = parent_account_id AND company_id = NEW.company_id;

  IF max_code IS NULL THEN
    next_code := parent_code || '01';
  ELSE
    next_code := LPAD((max_code::bigint + 1)::text, LENGTH(max_code), '0');
  END IF;

  -- Create the sub-account
  INSERT INTO public.account_categories (company_id, code, name, type, parent_id, is_system)
  VALUES (NEW.company_id, next_code, NEW.name, 'asset', parent_account_id, false)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trg_auto_create_supplier_account ON public.suppliers;
CREATE TRIGGER trg_auto_create_supplier_account
  AFTER INSERT ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_supplier_account();

DROP TRIGGER IF EXISTS trg_auto_create_customer_account ON public.customers;
CREATE TRIGGER trg_auto_create_customer_account
  AFTER INSERT ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_customer_account();

-- Also create accounts for the existing suppliers that don't have accounts yet
DO $$
DECLARE
  sup RECORD;
  parent_account_id uuid;
  parent_code text;
  next_code text;
  max_code text;
BEGIN
  FOR sup IN 
    SELECT DISTINCT ON (s.name, s.company_id) s.id, s.name, s.company_id 
    FROM public.suppliers s
    WHERE NOT EXISTS (
      SELECT 1 FROM public.account_categories ac 
      WHERE ac.name = s.name AND ac.company_id = s.company_id 
      AND ac.parent_id IN (SELECT id FROM public.account_categories WHERE code = '2101' AND company_id = s.company_id)
    )
  LOOP
    SELECT id, code INTO parent_account_id, parent_code
    FROM public.account_categories
    WHERE code = '2101' AND company_id = sup.company_id
    LIMIT 1;

    IF parent_account_id IS NOT NULL THEN
      SELECT MAX(code) INTO max_code
      FROM public.account_categories
      WHERE parent_id = parent_account_id AND company_id = sup.company_id;

      IF max_code IS NULL THEN
        next_code := parent_code || '01';
      ELSE
        next_code := LPAD((max_code::bigint + 1)::text, LENGTH(max_code), '0');
      END IF;

      INSERT INTO public.account_categories (company_id, code, name, type, parent_id, is_system)
      VALUES (sup.company_id, next_code, sup.name, 'liability', parent_account_id, false)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Also create accounts for existing customers that don't have accounts yet
DO $$
DECLARE
  cust RECORD;
  parent_account_id uuid;
  parent_code text;
  next_code text;
  max_code text;
BEGIN
  FOR cust IN 
    SELECT DISTINCT ON (c.name, c.company_id) c.id, c.name, c.company_id 
    FROM public.customers c
    WHERE NOT EXISTS (
      SELECT 1 FROM public.account_categories ac 
      WHERE ac.name = c.name AND ac.company_id = c.company_id 
      AND ac.parent_id IN (SELECT id FROM public.account_categories WHERE code = '1201' AND company_id = c.company_id)
    )
  LOOP
    SELECT id, code INTO parent_account_id, parent_code
    FROM public.account_categories
    WHERE code = '1201' AND company_id = cust.company_id
    LIMIT 1;

    IF parent_account_id IS NOT NULL THEN
      SELECT MAX(code) INTO max_code
      FROM public.account_categories
      WHERE parent_id = parent_account_id AND company_id = cust.company_id;

      IF max_code IS NULL THEN
        next_code := parent_code || '01';
      ELSE
        next_code := LPAD((max_code::bigint + 1)::text, LENGTH(max_code), '0');
      END IF;

      INSERT INTO public.account_categories (company_id, code, name, type, parent_id, is_system)
      VALUES (cust.company_id, next_code, cust.name, 'asset', parent_account_id, false)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;
