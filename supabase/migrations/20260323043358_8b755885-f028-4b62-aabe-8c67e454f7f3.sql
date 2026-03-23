
-- Fix populate_account_mappings to handle ALL sector code variations
CREATE OR REPLACE FUNCTION public.populate_account_mappings(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account RECORD;
  v_mapped_keys text[] := '{}';
BEGIN
  DELETE FROM account_mappings WHERE company_id = p_company_id;

  FOR v_account IN
    SELECT id, code FROM account_categories WHERE company_id = p_company_id ORDER BY code
  LOOP
    CASE v_account.code
      WHEN '1101' THEN
        IF NOT 'cash' = ANY(v_mapped_keys) THEN
          INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
          VALUES (p_company_id, 'cash', 'system', v_account.id),
                 (p_company_id, 'sales_cash', 'sales', v_account.id);
          v_mapped_keys := v_mapped_keys || '{cash,sales_cash}';
        END IF;
      WHEN '1201' THEN
        IF NOT 'customers' = ANY(v_mapped_keys) THEN
          INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
          VALUES (p_company_id, 'customers', 'system', v_account.id);
          v_mapped_keys := v_mapped_keys || '{customers}';
        END IF;
      WHEN '1301' THEN
        IF NOT 'purchase_expense' = ANY(v_mapped_keys) THEN
          INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
          VALUES (p_company_id, 'purchase_expense', 'purchases', v_account.id),
                 (p_company_id, 'inventory', 'system', v_account.id);
          v_mapped_keys := v_mapped_keys || '{purchase_expense,inventory}';
        END IF;
      WHEN '1108' THEN
        IF NOT 'vat_input' = ANY(v_mapped_keys) THEN
          INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
          VALUES (p_company_id, 'vat_input', 'purchases', v_account.id);
          v_mapped_keys := v_mapped_keys || '{vat_input}';
        END IF;
      WHEN '1181' THEN
        IF NOT 'vat_input' = ANY(v_mapped_keys) THEN
          INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
          VALUES (p_company_id, 'vat_input', 'purchases', v_account.id);
          v_mapped_keys := v_mapped_keys || '{vat_input}';
        END IF;
      WHEN '2101' THEN
        IF NOT 'suppliers' = ANY(v_mapped_keys) THEN
          INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
          VALUES (p_company_id, 'suppliers', 'system', v_account.id);
          v_mapped_keys := v_mapped_keys || '{suppliers}';
        END IF;
      WHEN '210401' THEN
        IF NOT 'vat_output' = ANY(v_mapped_keys) THEN
          INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
          VALUES (p_company_id, 'vat_output', 'sales', v_account.id);
          v_mapped_keys := v_mapped_keys || '{vat_output}';
        END IF;
      WHEN '21041' THEN
        IF NOT 'vat_output' = ANY(v_mapped_keys) THEN
          INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
          VALUES (p_company_id, 'vat_output', 'sales', v_account.id);
          v_mapped_keys := v_mapped_keys || '{vat_output}';
        END IF;
      WHEN '2104' THEN
        IF NOT 'vat_output' = ANY(v_mapped_keys) THEN
          IF NOT EXISTS (
            SELECT 1 FROM account_categories 
            WHERE company_id = p_company_id AND code IN ('210401', '21041')
          ) THEN
            INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
            VALUES (p_company_id, 'vat_output', 'sales', v_account.id);
            v_mapped_keys := v_mapped_keys || '{vat_output}';
          END IF;
        END IF;
      WHEN '4101' THEN
        IF NOT 'sales_revenue' = ANY(v_mapped_keys) THEN
          INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
          VALUES (p_company_id, 'sales_revenue', 'sales', v_account.id);
          v_mapped_keys := v_mapped_keys || '{sales_revenue}';
        END IF;
      WHEN '5101' THEN
        IF NOT 'cogs' = ANY(v_mapped_keys) THEN
          INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
          VALUES (p_company_id, 'cogs', 'system', v_account.id);
          v_mapped_keys := v_mapped_keys || '{cogs}';
        END IF;
      WHEN '3301' THEN
        IF NOT 'retained_earnings' = ANY(v_mapped_keys) THEN
          INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
          VALUES (p_company_id, 'retained_earnings', 'system', v_account.id);
          v_mapped_keys := v_mapped_keys || '{retained_earnings}';
        END IF;
      WHEN '3201' THEN
        IF NOT 'retained_earnings' = ANY(v_mapped_keys) THEN
          INSERT INTO account_mappings (company_id, mapping_key, mapping_type, account_id)
          VALUES (p_company_id, 'retained_earnings', 'system', v_account.id);
          v_mapped_keys := v_mapped_keys || '{retained_earnings}';
        END IF;
      ELSE NULL;
    END CASE;
  END LOOP;
END;
$$;

-- Re-run for ALL companies to fix incomplete mappings
DO $$
DECLARE
  v_company RECORD;
BEGIN
  FOR v_company IN SELECT id FROM companies
  LOOP
    PERFORM populate_account_mappings(v_company.id);
  END LOOP;
END;
$$;
