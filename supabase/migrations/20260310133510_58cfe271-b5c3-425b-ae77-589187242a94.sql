
-- 1. Fix sync trigger: exclude branding/company-specific settings from syncing to defaults
CREATE OR REPLACE FUNCTION sync_app_settings_to_defaults()
RETURNS TRIGGER AS $$
DECLARE
  v_excluded_keys text[] := ARRAY[
    'app_name', 'app_subtitle', 'login_logo_url', 'sidebar_logo_url', 
    'login_title', 'login_subtitle', 'login_bg_color', 'login_card_color',
    'login_header_gradient_start', 'login_header_gradient_end',
    'primary_color', 'welcome_message'
  ];
BEGIN
  -- Never sync company-specific branding settings to global defaults
  IF NEW.key = ANY(v_excluded_keys) THEN
    RETURN NEW;
  END IF;

  INSERT INTO default_company_settings (setting_key, setting_type, setting_value)
  VALUES (NEW.key, 'app_settings', NEW.value)
  ON CONFLICT (setting_key, setting_type) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 2. Clean up branding data from defaults table (these should NOT be inherited)
DELETE FROM default_company_settings 
WHERE setting_type IN ('app_settings', 'app') 
  AND setting_key IN (
    'login_logo_url', 'sidebar_logo_url', 
    'login_title', 'login_subtitle', 'login_bg_color', 'login_card_color',
    'login_header_gradient_start', 'login_header_gradient_end',
    'primary_color', 'welcome_message'
  );

-- Reset app_name and app_subtitle in defaults to generic values
UPDATE default_company_settings 
SET setting_value = 'حسبات اون لاين' 
WHERE setting_key = 'app_name' AND setting_type = 'app';

UPDATE default_company_settings 
SET setting_value = 'نظام إدارة الأعمال' 
WHERE setting_key = 'app_subtitle' AND setting_type = 'app';

-- Also clean app_settings type
UPDATE default_company_settings 
SET setting_value = 'حسبات اون لاين' 
WHERE setting_key = 'app_name' AND setting_type = 'app_settings';

UPDATE default_company_settings 
SET setting_value = '' 
WHERE setting_key = 'app_subtitle' AND setting_type = 'app_settings';

-- 3. Update apply_default_settings_to_company to exclude branding
CREATE OR REPLACE FUNCTION public.apply_default_settings_to_company(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_setting RECORD;
  v_company_name text;
  v_tax_settings_exists boolean;
  v_accounting_settings_exists boolean;
  v_excluded_keys text[] := ARRAY[
    'login_logo_url', 'sidebar_logo_url', 
    'login_title', 'login_subtitle', 'login_bg_color', 'login_card_color',
    'login_header_gradient_start', 'login_header_gradient_end'
  ];
BEGIN
  -- Get the actual company name
  SELECT name INTO v_company_name FROM companies WHERE id = p_company_id;

  -- Copy app_settings (excluding branding)
  FOR v_setting IN 
    SELECT setting_key, setting_value 
    FROM default_company_settings 
    WHERE setting_type = 'app_settings'
      AND setting_key != ALL(v_excluded_keys)
  LOOP
    -- Use actual company name for app_name
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

  -- Tax settings
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

  -- Accounting settings
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

  -- Create default accounts
  PERFORM create_default_accounts(p_company_id);
END;
$$;
