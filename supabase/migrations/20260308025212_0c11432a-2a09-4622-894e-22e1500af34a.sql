CREATE OR REPLACE FUNCTION public.create_purchase_journal_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_settings RECORD;
  v_supplier_account_id UUID;
  v_inventory_account_id UUID;
  v_tax_account_id UUID;
  v_entry_id UUID;
  v_tax_settings RECORD;
  v_tax_amount NUMERIC := 0;
  v_net_purchase NUMERIC;
  v_existing_entry UUID;
  v_supplier_name TEXT := '';
BEGIN
  -- Check if journal entry already exists for this purchase
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

  -- Get Supplier Account (ذمم الموردين - 2101) - Perpetual inventory with AP
  IF v_settings IS NOT NULL AND v_settings.suppliers_account_id IS NOT NULL THEN
    v_supplier_account_id := v_settings.suppliers_account_id;
  ELSE
    SELECT id INTO v_supplier_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '2101' LIMIT 1;
  END IF;
  
  -- Get Inventory Account (1301)
  IF v_settings IS NOT NULL AND v_settings.inventory_account_id IS NOT NULL THEN
    v_inventory_account_id := v_settings.inventory_account_id;
  ELSE
    SELECT id INTO v_inventory_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1301' LIMIT 1;
  END IF;

  -- If essential accounts don't exist, skip
  IF v_supplier_account_id IS NULL OR v_inventory_account_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get supplier name if available
  IF NEW.supplier_id IS NOT NULL THEN
    SELECT name INTO v_supplier_name FROM suppliers WHERE id = NEW.supplier_id;
  END IF;
  
  -- Get tax settings - used cars have 0% tax on purchases
  IF NEW.car_condition = 'used' THEN
    v_net_purchase := NEW.purchase_price;
    v_tax_amount := 0;
  ELSE
    SELECT * INTO v_tax_settings FROM tax_settings 
    WHERE company_id = NEW.company_id AND is_active = true AND apply_to_purchases = true;
    
    v_net_purchase := NEW.purchase_price;
    
    IF v_tax_settings IS NOT NULL THEN
      v_tax_amount := NEW.purchase_price * (v_tax_settings.tax_rate / 100);
      
      -- Get tax account (VAT Recoverable)
      IF v_settings IS NOT NULL AND v_settings.vat_recoverable_account_id IS NOT NULL THEN
        v_tax_account_id := v_settings.vat_recoverable_account_id;
      ELSE
        SELECT id INTO v_tax_account_id FROM account_categories 
        WHERE company_id = NEW.company_id AND code = '1401' LIMIT 1;
      END IF;
    END IF;
  END IF;
  
  -- Create journal entry header
  INSERT INTO journal_entries (
    company_id, entry_date, description, reference_type, reference_id, 
    total_debit, total_credit, is_posted
  ) VALUES (
    NEW.company_id, NEW.purchase_date, 
    'قيد شراء سيارة - ' || NEW.name || CASE WHEN v_supplier_name != '' THEN ' - ' || v_supplier_name ELSE '' END,
    'purchase', NEW.id,
    NEW.purchase_price + v_tax_amount,
    NEW.purchase_price + v_tax_amount,
    true
  ) RETURNING id INTO v_entry_id;
  
  -- Debit: Inventory (base amount) - الجرد المستمر
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_inventory_account_id, 'إضافة للمخزون', v_net_purchase, 0);
  
  -- Debit: VAT Recoverable (if tax is applied - new cars only)
  IF v_tax_amount > 0 AND v_tax_account_id IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_tax_account_id, 'ضريبة القيمة المضافة - مدخلات', v_tax_amount, 0);
  END IF;
  
  -- Credit: Supplier AP (ذمم الموردين) instead of direct cash/bank
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_supplier_account_id, 
    CASE WHEN v_supplier_name != '' THEN 'مستحق للمورد - ' || v_supplier_name ELSE 'ذمم الموردين' END, 
    0, NEW.purchase_price + v_tax_amount);
  
  RETURN NEW;
END;
$function$;