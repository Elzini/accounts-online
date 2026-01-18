
-- Drop existing triggers if they exist (to recreate properly)
DROP TRIGGER IF EXISTS create_sale_journal_trigger ON public.sales;
DROP TRIGGER IF EXISTS create_purchase_journal_trigger ON public.cars;

-- Create or replace the sale journal entry function
CREATE OR REPLACE FUNCTION public.create_sale_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
  -- Get account IDs for this company
  SELECT id INTO v_cash_account_id FROM account_categories 
  WHERE company_id = NEW.company_id AND code = '1100' LIMIT 1;
  
  SELECT id INTO v_sales_revenue_account_id FROM account_categories 
  WHERE company_id = NEW.company_id AND code = '4100' LIMIT 1;
  
  SELECT id INTO v_cogs_account_id FROM account_categories 
  WHERE company_id = NEW.company_id AND code = '5100' LIMIT 1;
  
  SELECT id INTO v_inventory_account_id FROM account_categories 
  WHERE company_id = NEW.company_id AND code = '1200' LIMIT 1;
  
  SELECT id INTO v_tax_account_id FROM account_categories 
  WHERE company_id = NEW.company_id AND code = '2200' LIMIT 1;
  
  -- If accounts don't exist, skip creating journal entry
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
  
  -- Debit: Cash (total sale including tax)
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_cash_account_id, 'تحصيل مبيعات', NEW.sale_price, 0);
  
  -- Credit: Sales Revenue (net of tax)
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_sales_revenue_account_id, 'إيرادات المبيعات', 0, v_net_sale);
  
  -- Credit: VAT Payable (if applicable)
  IF v_tax_amount > 0 AND v_tax_account_id IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_tax_account_id, 'ضريبة القيمة المضافة', 0, v_tax_amount);
  END IF;
  
  -- COGS entry (if accounts exist and we have purchase price)
  IF v_cogs_account_id IS NOT NULL AND v_inventory_account_id IS NOT NULL AND v_car_purchase_price IS NOT NULL THEN
    -- Debit: Cost of Goods Sold
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_cogs_account_id, 'تكلفة البضاعة المباعة', v_car_purchase_price, 0);
    
    -- Credit: Inventory
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_inventory_account_id, 'خروج من المخزون', 0, v_car_purchase_price);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create or replace the purchase journal entry function
CREATE OR REPLACE FUNCTION public.create_purchase_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cash_account_id UUID;
  v_inventory_account_id UUID;
  v_suppliers_account_id UUID;
  v_tax_recoverable_account_id UUID;
  v_entry_id UUID;
  v_tax_settings RECORD;
  v_tax_amount NUMERIC := 0;
  v_net_purchase NUMERIC;
BEGIN
  -- Get account IDs for this company
  SELECT id INTO v_cash_account_id FROM account_categories 
  WHERE company_id = NEW.company_id AND code = '1100' LIMIT 1;
  
  SELECT id INTO v_inventory_account_id FROM account_categories 
  WHERE company_id = NEW.company_id AND code = '1200' LIMIT 1;
  
  SELECT id INTO v_suppliers_account_id FROM account_categories 
  WHERE company_id = NEW.company_id AND code = '2100' LIMIT 1;
  
  SELECT id INTO v_tax_recoverable_account_id FROM account_categories 
  WHERE company_id = NEW.company_id AND code = '2300' LIMIT 1;
  
  -- If accounts don't exist, skip creating journal entry
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
  
  -- Debit: Inventory (purchase price)
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_inventory_account_id, 'شراء سيارة', v_net_purchase, 0);
  
  -- Debit: VAT Recoverable (if applicable)
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

-- Create triggers
CREATE TRIGGER create_sale_journal_trigger
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.create_sale_journal_entry();

CREATE TRIGGER create_purchase_journal_trigger
  AFTER INSERT ON public.cars
  FOR EACH ROW
  EXECUTE FUNCTION public.create_purchase_journal_entry();
