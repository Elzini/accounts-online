-- Temporarily disable the protection trigger for type normalization
ALTER TABLE account_categories DISABLE TRIGGER trg_protect_system_accounts;

-- 1. Normalize all plural types to singular in account_categories
UPDATE account_categories SET type = 'asset' WHERE type = 'assets';
UPDATE account_categories SET type = 'liability' WHERE type = 'liabilities';
UPDATE account_categories SET type = 'expense' WHERE type = 'expenses';

-- Re-enable the trigger
ALTER TABLE account_categories ENABLE TRIGGER trg_protect_system_accounts;

-- 2. Create function to auto-populate account_mappings
CREATE OR REPLACE FUNCTION populate_account_mappings(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account RECORD;
BEGIN
  DELETE FROM account_mappings WHERE company_id = p_company_id;

  FOR v_account IN
    SELECT id, code FROM account_categories WHERE company_id = p_company_id
  LOOP
    CASE v_account.code
      WHEN '1101' THEN
        INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
        VALUES (p_company_id, 'cash', 'system', v_account.id),
               (p_company_id, 'sales_cash', 'system', v_account.id);
      WHEN '1201' THEN
        INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
        VALUES (p_company_id, 'customers', 'system', v_account.id);
      WHEN '1301' THEN
        INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
        VALUES (p_company_id, 'purchase_expense', 'system', v_account.id),
               (p_company_id, 'inventory', 'system', v_account.id);
      WHEN '1108' THEN
        INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
        VALUES (p_company_id, 'vat_input', 'system', v_account.id);
      WHEN '2101' THEN
        INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
        VALUES (p_company_id, 'suppliers', 'system', v_account.id);
      WHEN '210401' THEN
        INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
        VALUES (p_company_id, 'vat_output', 'system', v_account.id);
      WHEN '4101' THEN
        INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
        VALUES (p_company_id, 'sales_revenue', 'system', v_account.id);
      WHEN '5101' THEN
        INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
        VALUES (p_company_id, 'cogs', 'system', v_account.id);
      WHEN '3301' THEN
        INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
        VALUES (p_company_id, 'retained_earnings', 'system', v_account.id);
      ELSE NULL;
    END CASE;
  END LOOP;
END;
$$;

-- 3. Populate mappings for existing companies that have accounts but no mappings
DO $$
DECLARE
  v_company_id uuid;
BEGIN
  FOR v_company_id IN
    SELECT DISTINCT ac.company_id 
    FROM account_categories ac
    LEFT JOIN account_mappings am ON am.company_id = ac.company_id
    WHERE am.id IS NULL
    GROUP BY ac.company_id
    HAVING COUNT(ac.id) > 5
  LOOP
    PERFORM populate_account_mappings(v_company_id);
  END LOOP;
END;
$$;