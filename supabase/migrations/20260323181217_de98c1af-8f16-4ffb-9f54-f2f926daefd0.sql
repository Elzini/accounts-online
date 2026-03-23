-- Fix: Add separate VAT input/output accounts for companies that only have generic 2103
-- and re-populate their mappings

DO $$
DECLARE
  v_company RECORD;
  v_parent_id uuid;
  v_assets_root_id uuid;
BEGIN
  -- For each company that has accounts but is missing 1108 (VAT Input)
  FOR v_company IN
    SELECT DISTINCT ac.company_id
    FROM account_categories ac
    WHERE NOT EXISTS (
      SELECT 1 FROM account_categories 
      WHERE company_id = ac.company_id AND code = '1108'
    )
    GROUP BY ac.company_id
    HAVING COUNT(*) > 5
  LOOP
    -- Find parent for 1108 (assets root or '1' or '11')
    SELECT id INTO v_assets_root_id
    FROM account_categories
    WHERE company_id = v_company.company_id AND code IN ('11', '1')
    ORDER BY length(code) DESC
    LIMIT 1;

    INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
    VALUES (v_company.company_id, '1108', 'ضريبة القيمة المضافة - مدخلات', 'asset', true, v_assets_root_id, 'ضريبة المشتريات القابلة للاسترداد')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- For each company that has accounts but is missing 210401 (VAT Output)
  FOR v_company IN
    SELECT DISTINCT ac.company_id
    FROM account_categories ac
    WHERE NOT EXISTS (
      SELECT 1 FROM account_categories 
      WHERE company_id = ac.company_id AND code = '210401'
    )
    AND NOT EXISTS (
      SELECT 1 FROM account_categories 
      WHERE company_id = ac.company_id AND code = '21041'
    )
    GROUP BY ac.company_id
    HAVING COUNT(*) > 5
  LOOP
    -- Find or create parent 2104
    SELECT id INTO v_parent_id
    FROM account_categories
    WHERE company_id = v_company.company_id AND code = '2104';

    IF v_parent_id IS NULL THEN
      -- Find parent for 2104 (21 or 2)
      SELECT id INTO v_parent_id
      FROM account_categories
      WHERE company_id = v_company.company_id AND code IN ('21', '2')
      ORDER BY length(code) DESC
      LIMIT 1;

      INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
      VALUES (v_company.company_id, '2104', 'ضريبة القيمة المضافة', 'liability', true, v_parent_id, 'حسابات الضريبة')
      RETURNING id INTO v_parent_id;
    END IF;

    INSERT INTO account_categories (company_id, code, name, type, is_system, parent_id, description)
    VALUES (v_company.company_id, '210401', 'ضريبة القيمة المضافة - مخرجات', 'liability', true, v_parent_id, 'ضريبة المبيعات المستحقة')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Re-populate mappings for all companies that now have proper VAT accounts
  FOR v_company IN
    SELECT DISTINCT company_id
    FROM account_categories
    WHERE code IN ('1108', '210401')
  LOOP
    PERFORM populate_account_mappings(v_company.company_id);
  END LOOP;
END $$;