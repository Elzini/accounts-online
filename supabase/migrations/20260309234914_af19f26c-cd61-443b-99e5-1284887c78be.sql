CREATE OR REPLACE FUNCTION public.apply_default_settings_to_company(p_company_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_setting RECORD;
  v_company_name text;
  v_tax_settings_exists boolean;
  v_accounting_settings_exists boolean;
BEGIN
  -- Get the actual company name
  SELECT name INTO v_company_name FROM companies WHERE id = p_company_id;

  -- Copy app_settings
  FOR v_setting IN 
    SELECT setting_key, setting_value 
    FROM default_company_settings 
    WHERE setting_type = 'app_settings'
  LOOP
    -- Use actual company name for app_name instead of template value
    IF v_setting.setting_key = 'app_name' THEN
      INSERT INTO app_settings (company_id, key, value)
      VALUES (p_company_id, v_setting.setting_key, COALESCE(v_company_name, v_setting.setting_value))
      ON CONFLICT DO NOTHING;
    ELSE
      INSERT INTO app_settings (company_id, key, value)
      VALUES (p_company_id, v_setting.setting_key, v_setting.setting_value)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Check if tax_settings exists for company
  SELECT EXISTS(SELECT 1 FROM tax_settings WHERE company_id = p_company_id) INTO v_tax_settings_exists;
  
  IF NOT v_tax_settings_exists THEN
    INSERT INTO tax_settings (
      company_id, tax_name, tax_rate, is_active, apply_to_sales, apply_to_purchases
    )
    SELECT 
      p_company_id,
      COALESCE((SELECT setting_value FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'tax_name'), 'ضريبة القيمة المضافة'),
      COALESCE((SELECT setting_value FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'tax_rate')::numeric, 15),
      COALESCE((SELECT setting_value FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'is_active')::boolean, true),
      COALESCE((SELECT setting_value FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'apply_to_sales')::boolean, true),
      COALESCE((SELECT setting_value FROM default_company_settings WHERE setting_type = 'tax_settings' AND setting_key = 'apply_to_purchases')::boolean, true);
  END IF;

  -- Check if company_accounting_settings exists for company
  SELECT EXISTS(SELECT 1 FROM company_accounting_settings WHERE company_id = p_company_id) INTO v_accounting_settings_exists;
  
  IF NOT v_accounting_settings_exists THEN
    INSERT INTO company_accounting_settings (
      company_id, auto_journal_entries_enabled, auto_sales_entries, auto_purchase_entries, auto_expense_entries
    )
    SELECT 
      p_company_id,
      COALESCE((SELECT setting_value FROM default_company_settings WHERE setting_type = 'accounting_settings' AND setting_key = 'auto_journal_entries_enabled')::boolean, true),
      COALESCE((SELECT setting_value FROM default_company_settings WHERE setting_type = 'accounting_settings' AND setting_key = 'auto_sales_entries')::boolean, true),
      COALESCE((SELECT setting_value FROM default_company_settings WHERE setting_type = 'accounting_settings' AND setting_key = 'auto_purchase_entries')::boolean, true),
      COALESCE((SELECT setting_value FROM default_company_settings WHERE setting_type = 'accounting_settings' AND setting_key = 'auto_expense_entries')::boolean, true);
  END IF;

  -- Create default accounts for the company
  PERFORM create_default_accounts(p_company_id);
END;
$function$;