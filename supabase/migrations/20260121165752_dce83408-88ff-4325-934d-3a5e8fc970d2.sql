
-- Create function to apply default settings to existing companies
CREATE OR REPLACE FUNCTION public.apply_defaults_to_existing_companies()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company RECORD;
  v_setting RECORD;
  v_default_invoice_settings jsonb;
  v_tax_name text;
  v_tax_rate numeric;
  v_tax_active boolean;
  v_apply_to_sales boolean;
  v_apply_to_purchases boolean;
  v_auto_journal_enabled boolean;
  v_auto_sales_entries boolean;
  v_auto_purchase_entries boolean;
  v_auto_expense_entries boolean;
  v_companies_updated int := 0;
BEGIN
  -- Get default values
  SELECT setting_value::jsonb INTO v_default_invoice_settings
  FROM default_company_settings
  WHERE setting_type = 'invoice_settings' AND setting_key = 'default_invoice_settings'
  LIMIT 1;

  SELECT COALESCE(
    (SELECT setting_value FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'tax_name'),
    'ضريبة القيمة المضافة'
  ) INTO v_tax_name;
  
  SELECT COALESCE(
    (SELECT setting_value::numeric FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'tax_rate'),
    15
  ) INTO v_tax_rate;
  
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'is_active'),
    true
  ) INTO v_tax_active;
  
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'apply_to_sales'),
    true
  ) INTO v_apply_to_sales;
  
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'apply_to_purchases'),
    true
  ) INTO v_apply_to_purchases;

  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'accounting_settings' AND setting_key = 'auto_journal_entries_enabled'),
    true
  ) INTO v_auto_journal_enabled;
  
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'accounting_settings' AND setting_key = 'auto_sales_entries'),
    true
  ) INTO v_auto_sales_entries;
  
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'accounting_settings' AND setting_key = 'auto_purchase_entries'),
    true
  ) INTO v_auto_purchase_entries;
  
  SELECT COALESCE(
    (SELECT setting_value::boolean FROM default_company_settings WHERE setting_type = 'accounting_settings' AND setting_key = 'auto_expense_entries'),
    true
  ) INTO v_auto_expense_entries;

  -- Loop through all companies
  FOR v_company IN SELECT id FROM companies
  LOOP
    -- Apply app settings
    FOR v_setting IN 
      SELECT setting_key, setting_value 
      FROM default_company_settings 
      WHERE setting_type = 'app_settings' AND setting_value IS NOT NULL AND setting_value != ''
    LOOP
      INSERT INTO app_settings (company_id, key, value)
      VALUES (v_company.id, v_setting.setting_key, v_setting.setting_value)
      ON CONFLICT (company_id, key) DO UPDATE SET value = EXCLUDED.value;
    END LOOP;

    -- Apply invoice settings
    IF v_default_invoice_settings IS NOT NULL THEN
      UPDATE companies
      SET invoice_settings = v_default_invoice_settings
      WHERE id = v_company.id;
    END IF;

    -- Apply tax settings (update existing or insert new)
    INSERT INTO tax_settings (
      company_id, tax_name, tax_rate, is_active, apply_to_sales, apply_to_purchases
    ) VALUES (
      v_company.id, v_tax_name, v_tax_rate, v_tax_active, v_apply_to_sales, v_apply_to_purchases
    )
    ON CONFLICT (company_id) DO UPDATE SET
      tax_name = EXCLUDED.tax_name,
      tax_rate = EXCLUDED.tax_rate,
      is_active = EXCLUDED.is_active,
      apply_to_sales = EXCLUDED.apply_to_sales,
      apply_to_purchases = EXCLUDED.apply_to_purchases;

    -- Apply accounting settings
    INSERT INTO company_accounting_settings (
      company_id, auto_journal_entries_enabled, auto_sales_entries, auto_purchase_entries, auto_expense_entries
    ) VALUES (
      v_company.id, v_auto_journal_enabled, v_auto_sales_entries, v_auto_purchase_entries, v_auto_expense_entries
    )
    ON CONFLICT (company_id) DO UPDATE SET
      auto_journal_entries_enabled = EXCLUDED.auto_journal_entries_enabled,
      auto_sales_entries = EXCLUDED.auto_sales_entries,
      auto_purchase_entries = EXCLUDED.auto_purchase_entries,
      auto_expense_entries = EXCLUDED.auto_expense_entries;

    v_companies_updated := v_companies_updated + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'companies_updated', v_companies_updated);
END;
$function$;

-- Add unique constraint for tax_settings if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tax_settings_company_id_key'
  ) THEN
    ALTER TABLE tax_settings ADD CONSTRAINT tax_settings_company_id_key UNIQUE (company_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Add unique constraint for company_accounting_settings if not exists  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_accounting_settings_company_id_key'
  ) THEN
    ALTER TABLE company_accounting_settings ADD CONSTRAINT company_accounting_settings_company_id_key UNIQUE (company_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Add unique constraint for app_settings if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_company_id_key_unique'
  ) THEN
    ALTER TABLE app_settings ADD CONSTRAINT app_settings_company_id_key_unique UNIQUE (company_id, key);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
