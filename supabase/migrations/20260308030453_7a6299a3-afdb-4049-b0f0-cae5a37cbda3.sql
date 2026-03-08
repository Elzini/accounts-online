
DO $$
DECLARE
  r RECORD;
  v_parent_id UUID;
  v_next_code TEXT;
  v_max_code TEXT;
  v_existing UUID;
  v_code_exists UUID;
BEGIN
  -- Backfill suppliers
  FOR r IN SELECT DISTINCT s.id, s.name, s.company_id FROM suppliers s LOOP
    SELECT id INTO v_parent_id FROM account_categories 
    WHERE company_id = r.company_id AND code = '2101' LIMIT 1;
    
    IF v_parent_id IS NOT NULL THEN
      SELECT id INTO v_existing FROM account_categories
      WHERE company_id = r.company_id AND parent_id = v_parent_id AND name = r.name LIMIT 1;
      
      IF v_existing IS NULL THEN
        SELECT MAX(code) INTO v_max_code FROM account_categories 
        WHERE company_id = r.company_id AND code ~ '^2101\d+$' AND LENGTH(code) > 4;
        
        IF v_max_code IS NULL THEN
          v_next_code := '21011';
        ELSE
          v_next_code := (v_max_code::bigint + 1)::text;
        END IF;
        
        -- Double-check code doesn't exist
        SELECT id INTO v_code_exists FROM account_categories
        WHERE company_id = r.company_id AND code = v_next_code LIMIT 1;
        
        IF v_code_exists IS NULL THEN
          INSERT INTO account_categories (company_id, code, name, type, parent_id, is_system, description)
          VALUES (r.company_id, v_next_code, r.name, 'liability', v_parent_id, false, 'حساب مورد - ' || r.name);
        END IF;
      END IF;
    END IF;
  END LOOP;
  
  -- Backfill customers
  FOR r IN SELECT DISTINCT c.id, c.name, c.company_id FROM customers c LOOP
    SELECT id INTO v_parent_id FROM account_categories 
    WHERE company_id = r.company_id AND code = '1201' LIMIT 1;
    
    IF v_parent_id IS NOT NULL THEN
      SELECT id INTO v_existing FROM account_categories
      WHERE company_id = r.company_id AND parent_id = v_parent_id AND name = r.name LIMIT 1;
      
      IF v_existing IS NULL THEN
        SELECT MAX(code) INTO v_max_code FROM account_categories 
        WHERE company_id = r.company_id AND code ~ '^1201\d+$' AND LENGTH(code) > 4;
        
        IF v_max_code IS NULL THEN
          v_next_code := '12011';
        ELSE
          v_next_code := (v_max_code::bigint + 1)::text;
        END IF;
        
        -- Double-check code doesn't exist
        SELECT id INTO v_code_exists FROM account_categories
        WHERE company_id = r.company_id AND code = v_next_code LIMIT 1;
        
        IF v_code_exists IS NULL THEN
          INSERT INTO account_categories (company_id, code, name, type, parent_id, is_system, description)
          VALUES (r.company_id, v_next_code, r.name, 'asset', v_parent_id, false, 'حساب عميل - ' || r.name);
        END IF;
      END IF;
    END IF;
  END LOOP;
END $$;
