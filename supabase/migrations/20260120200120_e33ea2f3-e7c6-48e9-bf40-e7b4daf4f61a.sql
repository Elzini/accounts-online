-- Create company accounting settings table
CREATE TABLE public.company_accounting_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Auto journal entries control
  auto_journal_entries_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_sales_entries BOOLEAN NOT NULL DEFAULT true,
  auto_purchase_entries BOOLEAN NOT NULL DEFAULT true,
  
  -- Account mappings for sales
  sales_cash_account_id UUID REFERENCES public.account_categories(id),
  sales_revenue_account_id UUID REFERENCES public.account_categories(id),
  cogs_account_id UUID REFERENCES public.account_categories(id),
  inventory_account_id UUID REFERENCES public.account_categories(id),
  vat_payable_account_id UUID REFERENCES public.account_categories(id),
  
  -- Account mappings for purchases
  purchase_cash_account_id UUID REFERENCES public.account_categories(id),
  purchase_inventory_account_id UUID REFERENCES public.account_categories(id),
  vat_recoverable_account_id UUID REFERENCES public.account_categories(id),
  suppliers_account_id UUID REFERENCES public.account_categories(id),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_accounting_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Super admins can manage all settings"
ON public.company_accounting_settings
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Company admins can view their settings"
ON public.company_accounting_settings
FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Company admins can update their settings"
ON public.company_accounting_settings
FOR UPDATE
USING (company_id = get_user_company_id(auth.uid()) AND is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_company_accounting_settings_updated_at
BEFORE UPDATE ON public.company_accounting_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update sale journal entry trigger to check settings
CREATE OR REPLACE FUNCTION public.create_sale_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_cash_account_id UUID;
  v_sales_revenue_account_id UUID;
  v_cogs_account_id UUID;
  v_inventory_account_id UUID;
  v_tax_account_id UUID;
  v_entry_id UUID;
  v_car_purchase_price NUMERIC;
  v_tax_settings RECORD;
  v_tax_amount NUMERIC := 0;
  v_net_sale NUMERIC;
BEGIN
  -- Check if auto journal entries are enabled for this company
  SELECT * INTO v_settings FROM company_accounting_settings 
  WHERE company_id = NEW.company_id;
  
  -- If settings exist and auto entries are disabled, skip
  IF v_settings IS NOT NULL AND (NOT v_settings.auto_journal_entries_enabled OR NOT v_settings.auto_sales_entries) THEN
    RETURN NEW;
  END IF;

  -- Get account IDs (prefer custom settings, fallback to defaults)
  IF v_settings IS NOT NULL AND v_settings.sales_cash_account_id IS NOT NULL THEN
    v_cash_account_id := v_settings.sales_cash_account_id;
  ELSE
    SELECT id INTO v_cash_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1100' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.sales_revenue_account_id IS NOT NULL THEN
    v_sales_revenue_account_id := v_settings.sales_revenue_account_id;
  ELSE
    SELECT id INTO v_sales_revenue_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '4100' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.cogs_account_id IS NOT NULL THEN
    v_cogs_account_id := v_settings.cogs_account_id;
  ELSE
    SELECT id INTO v_cogs_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '5100' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.inventory_account_id IS NOT NULL THEN
    v_inventory_account_id := v_settings.inventory_account_id;
  ELSE
    SELECT id INTO v_inventory_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1200' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.vat_payable_account_id IS NOT NULL THEN
    v_tax_account_id := v_settings.vat_payable_account_id;
  ELSE
    SELECT id INTO v_tax_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '2200' LIMIT 1;
  END IF;
  
  -- If essential accounts don't exist, skip
  IF v_cash_account_id IS NULL OR v_sales_revenue_account_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get car purchase price for COGS
  SELECT purchase_price INTO v_car_purchase_price FROM cars WHERE id = NEW.car_id;
  
  -- Get tax settings
  SELECT * INTO v_tax_settings FROM tax_settings 
  WHERE company_id = NEW.company_id AND is_active = true AND apply_to_sales = true;
  
  IF v_tax_settings IS NOT NULL THEN
    v_tax_amount := NEW.sale_price * (v_tax_settings.tax_rate / 100);
  END IF;
  
  v_net_sale := NEW.sale_price - v_tax_amount;
  
  -- Create journal entry header
  INSERT INTO journal_entries (
    company_id, entry_date, description, reference_type, reference_id, 
    total_debit, total_credit, is_posted
  ) VALUES (
    NEW.company_id, NEW.sale_date, 
    'قيد مبيعات - فاتورة رقم ' || NEW.sale_number,
    'sale', NEW.id,
    NEW.sale_price + COALESCE(v_car_purchase_price, 0),
    NEW.sale_price + COALESCE(v_car_purchase_price, 0),
    true
  ) RETURNING id INTO v_entry_id;
  
  -- Debit: Cash
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_cash_account_id, 'تحصيل مبيعات', NEW.sale_price, 0);
  
  -- Credit: Sales Revenue
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_sales_revenue_account_id, 'إيرادات المبيعات', 0, v_net_sale);
  
  -- Credit: VAT Payable
  IF v_tax_amount > 0 AND v_tax_account_id IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_tax_account_id, 'ضريبة القيمة المضافة', 0, v_tax_amount);
  END IF;
  
  -- COGS entry
  IF v_cogs_account_id IS NOT NULL AND v_inventory_account_id IS NOT NULL AND v_car_purchase_price IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_cogs_account_id, 'تكلفة البضاعة المباعة', v_car_purchase_price, 0);
    
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_inventory_account_id, 'خروج من المخزون', 0, v_car_purchase_price);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update purchase journal entry trigger to check settings
CREATE OR REPLACE FUNCTION public.create_purchase_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_cash_account_id UUID;
  v_inventory_account_id UUID;
  v_suppliers_account_id UUID;
  v_tax_recoverable_account_id UUID;
  v_entry_id UUID;
  v_tax_settings RECORD;
  v_tax_amount NUMERIC := 0;
  v_net_purchase NUMERIC;
BEGIN
  -- Check if auto journal entries are enabled for this company
  SELECT * INTO v_settings FROM company_accounting_settings 
  WHERE company_id = NEW.company_id;
  
  -- If settings exist and auto entries are disabled, skip
  IF v_settings IS NOT NULL AND (NOT v_settings.auto_journal_entries_enabled OR NOT v_settings.auto_purchase_entries) THEN
    RETURN NEW;
  END IF;

  -- Get account IDs (prefer custom settings, fallback to defaults)
  IF v_settings IS NOT NULL AND v_settings.purchase_cash_account_id IS NOT NULL THEN
    v_cash_account_id := v_settings.purchase_cash_account_id;
  ELSE
    SELECT id INTO v_cash_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1100' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.purchase_inventory_account_id IS NOT NULL THEN
    v_inventory_account_id := v_settings.purchase_inventory_account_id;
  ELSE
    SELECT id INTO v_inventory_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1200' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.suppliers_account_id IS NOT NULL THEN
    v_suppliers_account_id := v_settings.suppliers_account_id;
  ELSE
    SELECT id INTO v_suppliers_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '2100' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.vat_recoverable_account_id IS NOT NULL THEN
    v_tax_recoverable_account_id := v_settings.vat_recoverable_account_id;
  ELSE
    SELECT id INTO v_tax_recoverable_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '2300' LIMIT 1;
  END IF;
  
  -- If essential accounts don't exist, skip
  IF v_inventory_account_id IS NULL OR v_cash_account_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get tax settings
  SELECT * INTO v_tax_settings FROM tax_settings 
  WHERE company_id = NEW.company_id AND is_active = true AND apply_to_purchases = true;
  
  IF v_tax_settings IS NOT NULL THEN
    v_tax_amount := NEW.purchase_price * (v_tax_settings.tax_rate / 100);
  END IF;
  
  v_net_purchase := NEW.purchase_price;
  
  -- Create journal entry header
  INSERT INTO journal_entries (
    company_id, entry_date, description, reference_type, reference_id, 
    total_debit, total_credit, is_posted
  ) VALUES (
    NEW.company_id, NEW.purchase_date, 
    'قيد مشتريات - سيارة ' || NEW.name || ' (' || NEW.chassis_number || ')',
    'purchase', NEW.id,
    v_net_purchase + v_tax_amount,
    v_net_purchase + v_tax_amount,
    true
  ) RETURNING id INTO v_entry_id;
  
  -- Debit: Inventory
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_inventory_account_id, 'شراء سيارة', v_net_purchase, 0);
  
  -- Debit: VAT Recoverable
  IF v_tax_amount > 0 AND v_tax_recoverable_account_id IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_tax_recoverable_account_id, 'ضريبة القيمة المضافة المستردة', v_tax_amount, 0);
  END IF;
  
  -- Credit: Cash/Suppliers
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_cash_account_id, 'دفع ثمن الشراء', 0, v_net_purchase + v_tax_amount);
  
  RETURN NEW;
END;
$$;