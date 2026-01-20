
-- Add payment_account_id column to sales table
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_account_id uuid REFERENCES public.account_categories(id);

-- Add payment_account_id column to cars table (for purchase payment method)
ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS payment_account_id uuid REFERENCES public.account_categories(id);

-- Update the sale journal entry trigger to use payment_account_id
CREATE OR REPLACE FUNCTION public.create_sale_journal_entry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Get account IDs - Use payment_account_id if provided, otherwise use settings or defaults
  IF NEW.payment_account_id IS NOT NULL THEN
    v_cash_account_id := NEW.payment_account_id;
  ELSIF v_settings IS NOT NULL AND v_settings.sales_cash_account_id IS NOT NULL THEN
    v_cash_account_id := v_settings.sales_cash_account_id;
  ELSE
    SELECT id INTO v_cash_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1101' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.sales_revenue_account_id IS NOT NULL THEN
    v_sales_revenue_account_id := v_settings.sales_revenue_account_id;
  ELSE
    SELECT id INTO v_sales_revenue_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '4102' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.cogs_account_id IS NOT NULL THEN
    v_cogs_account_id := v_settings.cogs_account_id;
  ELSE
    SELECT id INTO v_cogs_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '5101' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.inventory_account_id IS NOT NULL THEN
    v_inventory_account_id := v_settings.inventory_account_id;
  ELSE
    SELECT id INTO v_inventory_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1301' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.vat_payable_account_id IS NOT NULL THEN
    v_tax_account_id := v_settings.vat_payable_account_id;
  ELSE
    SELECT id INTO v_tax_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '2201' LIMIT 1;
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
  
  -- Debit: Cash/Bank/Receivable
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
$function$;

-- Update the purchase journal entry trigger to use payment_account_id
CREATE OR REPLACE FUNCTION public.create_purchase_journal_entry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- Get account IDs - Use payment_account_id if provided, otherwise use settings or defaults
  IF NEW.payment_account_id IS NOT NULL THEN
    v_cash_account_id := NEW.payment_account_id;
  ELSIF v_settings IS NOT NULL AND v_settings.purchase_cash_account_id IS NOT NULL THEN
    v_cash_account_id := v_settings.purchase_cash_account_id;
  ELSE
    SELECT id INTO v_cash_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1101' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.purchase_inventory_account_id IS NOT NULL THEN
    v_inventory_account_id := v_settings.purchase_inventory_account_id;
  ELSE
    SELECT id INTO v_inventory_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1301' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.suppliers_account_id IS NOT NULL THEN
    v_suppliers_account_id := v_settings.suppliers_account_id;
  ELSE
    SELECT id INTO v_suppliers_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '2101' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.vat_recoverable_account_id IS NOT NULL THEN
    v_tax_recoverable_account_id := v_settings.vat_recoverable_account_id;
  ELSE
    SELECT id INTO v_tax_recoverable_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '2202' LIMIT 1;
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
  
  -- Credit: Cash/Bank/Suppliers
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_cash_account_id, 'دفع ثمن الشراء', 0, v_net_purchase + v_tax_amount);
  
  RETURN NEW;
END;
$function$;
