
-- Remove duplicate triggers
DROP TRIGGER IF EXISTS create_sale_journal_trigger ON sales;
DROP TRIGGER IF EXISTS create_purchase_journal_trigger ON cars;

-- Update the sale journal entry function to check for existing entry
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
  v_existing_entry UUID;
BEGIN
  -- Check if journal entry already exists for this sale
  SELECT id INTO v_existing_entry FROM journal_entries 
  WHERE reference_type = 'sale' AND reference_id = NEW.id::text
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
  
  -- Calculate tax if applicable
  IF v_tax_settings IS NOT NULL THEN
    v_tax_amount := NEW.sale_price * (v_tax_settings.tax_rate / 100) / (1 + v_tax_settings.tax_rate / 100);
    v_net_sale := NEW.sale_price - v_tax_amount;
    
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
    'sale', NEW.id::text,
    NEW.sale_price + COALESCE(v_car_purchase_price, 0),
    NEW.sale_price + COALESCE(v_car_purchase_price, 0),
    true
  ) RETURNING id INTO v_entry_id;
  
  -- Debit: Cash/Bank (total sale price including tax)
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_cash_account_id, 'استلام ثمن البيع', NEW.sale_price, 0);
  
  -- Credit: Sales Revenue (net of tax)
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_sales_revenue_account_id, 'إيراد المبيعات', 0, v_net_sale);
  
  -- Credit: VAT Payable (if tax is applied)
  IF v_tax_amount > 0 AND v_tax_account_id IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_tax_account_id, 'ضريبة القيمة المضافة', 0, v_tax_amount);
  END IF;
  
  -- Record COGS and reduce inventory (if accounts exist and purchase price is available)
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
$function$;

-- Update the purchase journal entry function to check for existing entry
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
  v_tax_account_id UUID;
  v_entry_id UUID;
  v_tax_settings RECORD;
  v_tax_amount NUMERIC := 0;
  v_net_purchase NUMERIC;
  v_existing_entry UUID;
BEGIN
  -- Check if journal entry already exists for this car purchase
  SELECT id INTO v_existing_entry FROM journal_entries 
  WHERE reference_type = 'purchase' AND reference_id = NEW.id::text
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

  -- If essential accounts don't exist, skip
  IF v_inventory_account_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get tax settings
  SELECT * INTO v_tax_settings FROM tax_settings 
  WHERE company_id = NEW.company_id AND is_active = true AND apply_to_purchases = true;
  
  -- Calculate tax if applicable
  IF v_tax_settings IS NOT NULL THEN
    v_tax_amount := NEW.purchase_price * (v_tax_settings.tax_rate / 100) / (1 + v_tax_settings.tax_rate / 100);
    v_net_purchase := NEW.purchase_price - v_tax_amount;
    
    -- Get tax account (VAT Recoverable - 2202)
    IF v_settings IS NOT NULL AND v_settings.vat_recoverable_account_id IS NOT NULL THEN
      v_tax_account_id := v_settings.vat_recoverable_account_id;
    ELSE
      SELECT id INTO v_tax_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '2202' LIMIT 1;
    END IF;
  ELSE
    v_net_purchase := NEW.purchase_price;
  END IF;

  -- Get supplier and car info for description
  DECLARE
    v_supplier_name TEXT;
    v_car_name TEXT;
  BEGIN
    SELECT name INTO v_supplier_name FROM suppliers WHERE id = NEW.supplier_id;
    v_car_name := NEW.name || ' (' || NEW.chassis_number || ')';
    
    -- Create journal entry header
    INSERT INTO journal_entries (
      company_id, entry_date, description, reference_type, reference_id, 
      total_debit, total_credit, is_posted
    ) VALUES (
      NEW.company_id, NEW.purchase_date, 
      'قيد مشتريات - سيارة ' || v_car_name,
      'purchase', NEW.id::text,
      NEW.purchase_price,
      NEW.purchase_price,
      true
    ) RETURNING id INTO v_entry_id;
    
    -- Debit: Inventory (net of tax)
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_inventory_account_id, 'إضافة للمخزون - ' || v_car_name, v_net_purchase, 0);
    
    -- Debit: VAT Recoverable (if tax is applied)
    IF v_tax_amount > 0 AND v_tax_account_id IS NOT NULL THEN
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      VALUES (v_entry_id, v_tax_account_id, 'ضريبة القيمة المضافة المستردة', v_tax_amount, 0);
    END IF;
    
    -- Credit: Cash/Bank (if paid immediately)
    IF v_cash_account_id IS NOT NULL THEN
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      VALUES (v_entry_id, v_cash_account_id, 'دفع ثمن الشراء', 0, NEW.purchase_price);
    -- Credit: Suppliers Account (if not paid immediately)  
    ELSIF v_suppliers_account_id IS NOT NULL THEN
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      VALUES (v_entry_id, v_suppliers_account_id, 'مستحق للمورد', 0, NEW.purchase_price);
    END IF;
  END;
  
  RETURN NEW;
END;
$function$;
