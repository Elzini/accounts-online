
-- Fix search_path for all sync functions
CREATE OR REPLACE FUNCTION sync_app_settings_to_defaults()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.default_company_settings (setting_key, setting_type, setting_value)
  VALUES (NEW.key, 'app_settings', NEW.value)
  ON CONFLICT (setting_key, setting_type) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sync_invoice_settings_to_defaults()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_settings IS NOT NULL THEN
    INSERT INTO public.default_company_settings (setting_key, setting_type, setting_value)
    VALUES ('invoice_settings', 'invoice', NEW.invoice_settings::text)
    ON CONFLICT (setting_key, setting_type) 
    DO UPDATE SET 
      setting_value = EXCLUDED.setting_value,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sync_accounting_settings_to_defaults()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.default_company_settings (setting_key, setting_type, setting_value)
  VALUES 
    ('auto_journal_entries_enabled', 'accounting', NEW.auto_journal_entries_enabled::text),
    ('auto_sales_entries', 'accounting', NEW.auto_sales_entries::text),
    ('auto_purchase_entries', 'accounting', NEW.auto_purchase_entries::text),
    ('auto_expense_entries', 'accounting', NEW.auto_expense_entries::text)
  ON CONFLICT (setting_key, setting_type) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sync_account_category_to_defaults()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.default_company_settings (setting_key, setting_type, setting_value)
  VALUES (
    'account_' || NEW.code, 
    'chart_of_accounts', 
    jsonb_build_object(
      'code', NEW.code,
      'name', NEW.name,
      'type', NEW.type,
      'description', NEW.description,
      'is_system', NEW.is_system
    )::text
  )
  ON CONFLICT (setting_key, setting_type) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sync_expense_category_to_defaults()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.default_company_settings (setting_key, setting_type, setting_value)
  VALUES (
    'expense_category_' || NEW.name, 
    'expense_categories', 
    jsonb_build_object(
      'name', NEW.name,
      'description', NEW.description,
      'is_active', NEW.is_active
    )::text
  )
  ON CONFLICT (setting_key, setting_type) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
