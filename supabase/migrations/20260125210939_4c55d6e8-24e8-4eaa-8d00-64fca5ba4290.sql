
-- Create function to sync app_settings to default_company_settings
CREATE OR REPLACE FUNCTION sync_app_settings_to_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if this is not a company-specific override
  -- Sync all app_settings changes to defaults
  INSERT INTO default_company_settings (setting_key, setting_type, setting_value)
  VALUES (NEW.key, 'app_settings', NEW.value)
  ON CONFLICT (setting_key, setting_type) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for app_settings
DROP TRIGGER IF EXISTS sync_app_settings_trigger ON app_settings;
CREATE TRIGGER sync_app_settings_trigger
AFTER INSERT OR UPDATE ON app_settings
FOR EACH ROW
EXECUTE FUNCTION sync_app_settings_to_defaults();

-- Create function to sync invoice_settings to default_company_settings
CREATE OR REPLACE FUNCTION sync_invoice_settings_to_defaults()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_settings IS NOT NULL THEN
    INSERT INTO default_company_settings (setting_key, setting_type, setting_value)
    VALUES ('invoice_settings', 'invoice', NEW.invoice_settings::text)
    ON CONFLICT (setting_key, setting_type) 
    DO UPDATE SET 
      setting_value = EXCLUDED.setting_value,
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for companies invoice_settings
DROP TRIGGER IF EXISTS sync_invoice_settings_trigger ON companies;
CREATE TRIGGER sync_invoice_settings_trigger
AFTER UPDATE OF invoice_settings ON companies
FOR EACH ROW
WHEN (NEW.invoice_settings IS DISTINCT FROM OLD.invoice_settings)
EXECUTE FUNCTION sync_invoice_settings_to_defaults();

-- Create function to sync accounting settings to defaults
CREATE OR REPLACE FUNCTION sync_accounting_settings_to_defaults()
RETURNS TRIGGER AS $$
DECLARE
  setting_record RECORD;
BEGIN
  -- Sync VAT settings
  INSERT INTO default_company_settings (setting_key, setting_type, setting_value)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for company_accounting_settings
DROP TRIGGER IF EXISTS sync_accounting_settings_trigger ON company_accounting_settings;
CREATE TRIGGER sync_accounting_settings_trigger
AFTER INSERT OR UPDATE ON company_accounting_settings
FOR EACH ROW
EXECUTE FUNCTION sync_accounting_settings_to_defaults();

-- Create function to sync new account categories to defaults (for chart of accounts structure)
CREATE OR REPLACE FUNCTION sync_account_category_to_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Store account category structure in defaults
  INSERT INTO default_company_settings (setting_key, setting_type, setting_value)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for account_categories
DROP TRIGGER IF EXISTS sync_account_category_trigger ON account_categories;
CREATE TRIGGER sync_account_category_trigger
AFTER INSERT OR UPDATE ON account_categories
FOR EACH ROW
EXECUTE FUNCTION sync_account_category_to_defaults();

-- Create function to sync expense categories to defaults
CREATE OR REPLACE FUNCTION sync_expense_category_to_defaults()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO default_company_settings (setting_key, setting_type, setting_value)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for expense_categories
DROP TRIGGER IF EXISTS sync_expense_category_trigger ON expense_categories;
CREATE TRIGGER sync_expense_category_trigger
AFTER INSERT OR UPDATE ON expense_categories
FOR EACH ROW
EXECUTE FUNCTION sync_expense_category_to_defaults();

-- Add unique constraint for setting_key + setting_type if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'default_company_settings_key_type_unique'
  ) THEN
    ALTER TABLE default_company_settings 
    ADD CONSTRAINT default_company_settings_key_type_unique 
    UNIQUE (setting_key, setting_type);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
