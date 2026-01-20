-- Create a table for default company settings (template for new companies)
CREATE TABLE IF NOT EXISTS public.default_company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type text NOT NULL, -- 'app_settings', 'tax_settings', 'accounting_settings'
  setting_key text NOT NULL,
  setting_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(setting_type, setting_key)
);

-- Enable RLS
ALTER TABLE public.default_company_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can manage default settings
CREATE POLICY "Super admins can manage default company settings"
ON public.default_company_settings
FOR ALL
USING (is_super_admin(auth.uid()));

-- Everyone can view default settings (needed when creating new companies)
CREATE POLICY "Anyone can view default company settings"
ON public.default_company_settings
FOR SELECT
USING (true);

-- Insert default app settings
INSERT INTO public.default_company_settings (setting_type, setting_key, setting_value) VALUES
-- App Settings
('app_settings', 'app_name', 'منصة إدارة المعارض'),
('app_settings', 'app_subtitle', 'لتجارة السيارات'),
('app_settings', 'welcome_message', 'مرحباً بك في منصة إدارة المعارض للسيارات'),
('app_settings', 'dashboard_title', 'لوحة التحكم'),
('app_settings', 'purchases_title', 'المشتريات'),
('app_settings', 'sales_title', 'المبيعات'),
('app_settings', 'customers_title', 'العملاء'),
('app_settings', 'suppliers_title', 'الموردين'),
('app_settings', 'reports_title', 'التقارير'),
-- Tax Settings
('tax_settings', 'tax_name', 'ضريبة القيمة المضافة'),
('tax_settings', 'tax_rate', '15'),
('tax_settings', 'is_active', 'true'),
('tax_settings', 'apply_to_sales', 'true'),
('tax_settings', 'apply_to_purchases', 'true'),
-- Accounting Settings
('accounting_settings', 'auto_journal_entries_enabled', 'true'),
('accounting_settings', 'auto_sales_entries', 'true'),
('accounting_settings', 'auto_purchase_entries', 'true'),
('accounting_settings', 'auto_expense_entries', 'true')
ON CONFLICT (setting_type, setting_key) DO NOTHING;

-- Create function to copy default settings to a new company
CREATE OR REPLACE FUNCTION public.apply_default_settings_to_company(p_company_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_setting RECORD;
  v_tax_settings_exists boolean;
  v_accounting_settings_exists boolean;
BEGIN
  -- Copy app_settings
  FOR v_setting IN 
    SELECT setting_key, setting_value 
    FROM default_company_settings 
    WHERE setting_type = 'app_settings'
  LOOP
    INSERT INTO app_settings (company_id, key, value)
    VALUES (p_company_id, v_setting.setting_key, v_setting.setting_value)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Check if tax_settings exists for company
  SELECT EXISTS(SELECT 1 FROM tax_settings WHERE company_id = p_company_id) INTO v_tax_settings_exists;
  
  IF NOT v_tax_settings_exists THEN
    INSERT INTO tax_settings (
      company_id,
      tax_name,
      tax_rate,
      is_active,
      apply_to_sales,
      apply_to_purchases
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
      company_id,
      auto_journal_entries_enabled,
      auto_sales_entries,
      auto_purchase_entries,
      auto_expense_entries
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
$$;

-- Create trigger to automatically apply default settings when a new company is created
CREATE OR REPLACE FUNCTION public.trigger_apply_default_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM apply_default_settings_to_company(NEW.id);
  RETURN NEW;
END;
$$;

-- Create trigger on companies table
DROP TRIGGER IF EXISTS on_company_created_apply_defaults ON public.companies;
CREATE TRIGGER on_company_created_apply_defaults
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION trigger_apply_default_settings();