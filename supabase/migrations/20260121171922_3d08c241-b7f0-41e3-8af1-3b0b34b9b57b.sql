-- Function to sync invoice_settings to all companies
CREATE OR REPLACE FUNCTION public.sync_invoice_settings_to_all_companies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_settings jsonb;
  company_record RECORD;
BEGIN
  -- Get the default invoice settings from default_company_settings
  SELECT setting_value::jsonb INTO default_settings
  FROM default_company_settings
  WHERE setting_key = 'invoice_settings' AND setting_type = 'invoice';
  
  -- If no default found, use a comprehensive default
  IF default_settings IS NULL THEN
    default_settings := '{
      "show_qr": true,
      "template": "modern",
      "show_logo": true,
      "show_terms": true,
      "terms_text": "شكراً لتعاملكم معنا",
      "footer_text": "هذه الفاتورة صادرة وفقاً لنظام الفوترة الإلكترونية في المملكة العربية السعودية",
      "primary_color": "#059669",
      "logo_position": "right",
      "qr_position": "left",
      "seller_position": "top",
      "buyer_position": "bottom",
      "seller_title": "معلومات البائع",
      "buyer_title": "معلومات المشتري"
    }'::jsonb;
  END IF;
  
  -- Update all companies - merge existing settings with defaults (existing settings take priority)
  FOR company_record IN SELECT id, invoice_settings FROM companies LOOP
    UPDATE companies
    SET invoice_settings = default_settings || COALESCE(company_record.invoice_settings, '{}'::jsonb),
        updated_at = NOW()
    WHERE id = company_record.id;
  END LOOP;
END;
$$;

-- Function to sync app_settings to all companies
CREATE OR REPLACE FUNCTION public.sync_app_settings_to_all_companies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  setting_record RECORD;
  company_record RECORD;
BEGIN
  -- For each default app setting
  FOR setting_record IN 
    SELECT setting_key, setting_value 
    FROM default_company_settings 
    WHERE setting_type = 'app_setting'
  LOOP
    -- For each company
    FOR company_record IN SELECT id FROM companies LOOP
      -- Insert or update the setting for this company
      INSERT INTO app_settings (company_id, key, value, created_at, updated_at)
      VALUES (company_record.id, setting_record.setting_key, setting_record.setting_value, NOW(), NOW())
      ON CONFLICT (company_id, key) 
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      WHERE app_settings.value IS NULL OR app_settings.value = '';
    END LOOP;
  END LOOP;
END;
$$;

-- Create unique constraint on app_settings for company_id + key if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_settings_company_key_unique'
  ) THEN
    ALTER TABLE app_settings ADD CONSTRAINT app_settings_company_key_unique UNIQUE (company_id, key);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Function to sync accounting settings to all companies
CREATE OR REPLACE FUNCTION public.sync_accounting_settings_to_all_companies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  company_record RECORD;
BEGIN
  -- Ensure all companies have accounting settings entry
  FOR company_record IN SELECT id FROM companies LOOP
    INSERT INTO company_accounting_settings (company_id)
    VALUES (company_record.id)
    ON CONFLICT (company_id) DO NOTHING;
  END LOOP;
END;
$$;

-- Master function to sync ALL settings to all companies
CREATE OR REPLACE FUNCTION public.sync_all_settings_to_all_companies()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  companies_count integer;
BEGIN
  -- Count companies
  SELECT COUNT(*) INTO companies_count FROM companies;
  
  -- Sync invoice settings
  PERFORM sync_invoice_settings_to_all_companies();
  
  -- Sync app settings
  PERFORM sync_app_settings_to_all_companies();
  
  -- Sync accounting settings
  PERFORM sync_accounting_settings_to_all_companies();
  
  RETURN jsonb_build_object(
    'success', true,
    'companies_updated', companies_count,
    'updated_at', NOW()
  );
END;
$$;

-- Trigger function to auto-sync when default_company_settings is updated
CREATE OR REPLACE FUNCTION public.on_default_settings_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto sync based on setting type
  IF NEW.setting_type = 'invoice' THEN
    PERFORM sync_invoice_settings_to_all_companies();
  ELSIF NEW.setting_type = 'app_setting' THEN
    PERFORM sync_app_settings_to_all_companies();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_sync_default_settings ON default_company_settings;

-- Create trigger on default_company_settings
CREATE TRIGGER trigger_sync_default_settings
  AFTER INSERT OR UPDATE ON default_company_settings
  FOR EACH ROW
  EXECUTE FUNCTION on_default_settings_change();

-- Trigger function to initialize settings for new companies
CREATE OR REPLACE FUNCTION public.on_company_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_invoice_settings jsonb;
  setting_record RECORD;
BEGIN
  -- Get default invoice settings
  SELECT setting_value::jsonb INTO default_invoice_settings
  FROM default_company_settings
  WHERE setting_key = 'invoice_settings' AND setting_type = 'invoice';
  
  -- Use comprehensive defaults if none found
  IF default_invoice_settings IS NULL THEN
    default_invoice_settings := '{
      "show_qr": true,
      "template": "modern",
      "show_logo": true,
      "show_terms": true,
      "terms_text": "شكراً لتعاملكم معنا",
      "footer_text": "هذه الفاتورة صادرة وفقاً لنظام الفوترة الإلكترونية في المملكة العربية السعودية",
      "primary_color": "#059669",
      "logo_position": "right",
      "qr_position": "left",
      "seller_position": "top",
      "buyer_position": "bottom",
      "seller_title": "معلومات البائع",
      "buyer_title": "معلومات المشتري"
    }'::jsonb;
  END IF;
  
  -- Update the new company with default invoice settings
  UPDATE companies
  SET invoice_settings = COALESCE(NEW.invoice_settings, '{}'::jsonb) || default_invoice_settings
  WHERE id = NEW.id;
  
  -- Copy all default app settings to new company
  FOR setting_record IN 
    SELECT setting_key, setting_value 
    FROM default_company_settings 
    WHERE setting_type = 'app_setting'
  LOOP
    INSERT INTO app_settings (company_id, key, value)
    VALUES (NEW.id, setting_record.setting_key, setting_record.setting_value)
    ON CONFLICT (company_id, key) DO NOTHING;
  END LOOP;
  
  -- Create accounting settings for new company
  INSERT INTO company_accounting_settings (company_id)
  VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_company_created ON companies;

-- Create trigger for new companies
CREATE TRIGGER trigger_company_created
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION on_company_created();

-- Run initial sync for all existing companies NOW
SELECT sync_all_settings_to_all_companies();