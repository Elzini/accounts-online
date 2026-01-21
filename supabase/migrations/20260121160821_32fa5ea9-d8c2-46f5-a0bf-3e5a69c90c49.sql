-- Fix the create_sale_journal_entry function - cast reference_id properly
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
  v_existing_entry UUID;
BEGIN
  -- Check if journal entry already exists for this sale (fix: cast NEW.id to uuid for comparison)
  SELECT id INTO v_existing_entry FROM journal_entries 
  WHERE reference_type = 'sale' AND reference_id = NEW.id
  LIMIT 1;
  
  IF v_existing_entry IS NOT NULL THEN
    RETURN NEW;
  END IF;

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

  -- Get car purchase price
  SELECT purchase_price INTO v_car_purchase_price FROM cars WHERE id = NEW.car_id;
  
  -- If essential accounts don't exist, skip
  IF v_cash_account_id IS NULL OR v_sales_revenue_account_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get tax settings
  SELECT * INTO v_tax_settings FROM tax_settings 
  WHERE company_id = NEW.company_id AND is_active = true AND apply_to_sales = true;
  
  -- Calculate tax if applicable (Tax = Base * 15%)
  IF v_tax_settings IS NOT NULL THEN
    v_net_sale := NEW.sale_price;
    v_tax_amount := NEW.sale_price * (v_tax_settings.tax_rate / 100);
    
    -- Get tax account (VAT Payable - 2201)
    IF v_settings IS NOT NULL AND v_settings.vat_payable_account_id IS NOT NULL THEN
      v_tax_account_id := v_settings.vat_payable_account_id;
    ELSE
      SELECT id INTO v_tax_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '2201' LIMIT 1;
    END IF;
  ELSE
    v_net_sale := NEW.sale_price;
  END IF;
  
  -- Create journal entry header
  INSERT INTO journal_entries (
    company_id, entry_date, description, reference_type, reference_id, 
    total_debit, total_credit, is_posted
  ) VALUES (
    NEW.company_id, NEW.sale_date, 
    'قيد مبيعات - فاتورة رقم ' || NEW.sale_number,
    'sale', NEW.id,
    NEW.sale_price + v_tax_amount + COALESCE(v_car_purchase_price, 0),
    NEW.sale_price + v_tax_amount + COALESCE(v_car_purchase_price, 0),
    true
  ) RETURNING id INTO v_entry_id;
  
  -- Debit: Cash/Bank (total sale price + tax)
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_cash_account_id, 'استلام ثمن البيع', NEW.sale_price + v_tax_amount, 0);
  
  -- Credit: Sales Revenue (base amount without tax)
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_sales_revenue_account_id, 'إيراد المبيعات', 0, v_net_sale);
  
  -- Credit: VAT Payable (if tax is applied)
  IF v_tax_amount > 0 AND v_tax_account_id IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_tax_account_id, 'ضريبة القيمة المضافة - مخرجات', 0, v_tax_amount);
  END IF;
  
  -- If we have COGS and inventory accounts, record cost of goods sold
  IF v_cogs_account_id IS NOT NULL AND v_inventory_account_id IS NOT NULL AND v_car_purchase_price IS NOT NULL THEN
    -- Debit: Cost of Goods Sold
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_cogs_account_id, 'تكلفة البضاعة المباعة', v_car_purchase_price, 0);
    
    -- Credit: Inventory
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_inventory_account_id, 'تخفيض المخزون', 0, v_car_purchase_price);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Also fix the create_purchase_journal_entry function
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
  v_tax_account_id UUID;
  v_entry_id UUID;
  v_tax_settings RECORD;
  v_tax_amount NUMERIC := 0;
  v_net_purchase NUMERIC;
  v_existing_entry UUID;
BEGIN
  -- Check if journal entry already exists for this purchase (fix: compare uuid to uuid)
  SELECT id INTO v_existing_entry FROM journal_entries 
  WHERE reference_type = 'purchase' AND reference_id = NEW.id
  LIMIT 1;
  
  IF v_existing_entry IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Check if auto journal entries are enabled for this company
  SELECT * INTO v_settings FROM company_accounting_settings 
  WHERE company_id = NEW.company_id;
  
  -- If settings exist and auto entries are disabled, skip
  IF v_settings IS NOT NULL AND (NOT v_settings.auto_journal_entries_enabled OR NOT v_settings.auto_purchase_entries) THEN
    RETURN NEW;
  END IF;

  -- Get account IDs
  IF NEW.payment_account_id IS NOT NULL THEN
    v_cash_account_id := NEW.payment_account_id;
  ELSIF v_settings IS NOT NULL AND v_settings.purchase_cash_account_id IS NOT NULL THEN
    v_cash_account_id := v_settings.purchase_cash_account_id;
  ELSE
    SELECT id INTO v_cash_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1101' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.inventory_account_id IS NOT NULL THEN
    v_inventory_account_id := v_settings.inventory_account_id;
  ELSE
    SELECT id INTO v_inventory_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1301' LIMIT 1;
  END IF;

  -- If essential accounts don't exist, skip
  IF v_cash_account_id IS NULL OR v_inventory_account_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get tax settings
  SELECT * INTO v_tax_settings FROM tax_settings 
  WHERE company_id = NEW.company_id AND is_active = true AND apply_to_purchases = true;
  
  -- Calculate tax if applicable (Tax = Base * 15%)
  IF v_tax_settings IS NOT NULL THEN
    v_net_purchase := NEW.purchase_price;
    v_tax_amount := NEW.purchase_price * (v_tax_settings.tax_rate / 100);
    
    -- Get tax account (VAT Recoverable - 1401)
    IF v_settings IS NOT NULL AND v_settings.vat_recoverable_account_id IS NOT NULL THEN
      v_tax_account_id := v_settings.vat_recoverable_account_id;
    ELSE
      SELECT id INTO v_tax_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '1401' LIMIT 1;
    END IF;
  ELSE
    v_net_purchase := NEW.purchase_price;
  END IF;
  
  -- Create journal entry header
  INSERT INTO journal_entries (
    company_id, entry_date, description, reference_type, reference_id, 
    total_debit, total_credit, is_posted
  ) VALUES (
    NEW.company_id, NEW.purchase_date, 
    'قيد شراء سيارة - ' || NEW.name,
    'purchase', NEW.id,
    NEW.purchase_price + v_tax_amount,
    NEW.purchase_price + v_tax_amount,
    true
  ) RETURNING id INTO v_entry_id;
  
  -- Debit: Inventory (base amount)
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_inventory_account_id, 'إضافة للمخزون', v_net_purchase, 0);
  
  -- Debit: VAT Recoverable (if tax is applied)
  IF v_tax_amount > 0 AND v_tax_account_id IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_tax_account_id, 'ضريبة القيمة المضافة - مدخلات', v_tax_amount, 0);
  END IF;
  
  -- Credit: Cash/Bank (total including tax)
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_cash_account_id, 'دفع ثمن الشراء', 0, NEW.purchase_price + v_tax_amount);
  
  RETURN NEW;
END;
$$;