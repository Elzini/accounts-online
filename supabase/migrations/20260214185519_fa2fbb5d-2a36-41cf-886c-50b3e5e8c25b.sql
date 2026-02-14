-- Update the journal entry trigger to skip drafts and fire on approval
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
  -- DRAFT SUPPORT: Skip journal entry creation for draft invoices
  IF NEW.status = 'draft' THEN
    RETURN NEW;
  END IF;

  -- For UPDATE trigger: only create entry when status changes to 'approved'
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'draft' OR NEW.status != 'approved' THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Check if journal entry already exists for this sale
  SELECT id INTO v_existing_entry FROM journal_entries 
  WHERE reference_type = 'sale' AND reference_id = NEW.id
  LIMIT 1;
  
  IF v_existing_entry IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Check if auto journal entries are enabled for this company
  SELECT * INTO v_settings FROM company_accounting_settings 
  WHERE company_id = NEW.company_id;
  
  IF v_settings IS NOT NULL AND (NOT v_settings.auto_journal_entries_enabled OR NOT v_settings.auto_sales_entries) THEN
    RETURN NEW;
  END IF;

  -- Get account IDs
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
    WHERE company_id = NEW.company_id AND code = '4101' LIMIT 1;
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

  SELECT purchase_price INTO v_car_purchase_price FROM cars WHERE id = NEW.car_id;
  
  IF v_cash_account_id IS NULL OR v_sales_revenue_account_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  SELECT * INTO v_tax_settings FROM tax_settings 
  WHERE company_id = NEW.company_id AND is_active = true AND apply_to_sales = true;
  
  IF v_tax_settings IS NOT NULL THEN
    v_net_sale := NEW.sale_price;
    v_tax_amount := NEW.sale_price * (v_tax_settings.tax_rate / 100);
    
    IF v_settings IS NOT NULL AND v_settings.vat_payable_account_id IS NOT NULL THEN
      v_tax_account_id := v_settings.vat_payable_account_id;
    ELSE
      SELECT id INTO v_tax_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '2201' LIMIT 1;
    END IF;
  ELSE
    v_net_sale := NEW.sale_price;
  END IF;
  
  INSERT INTO journal_entries (
    company_id, entry_date, description, reference_type, reference_id, 
    total_debit, total_credit, is_posted
  ) VALUES (
    NEW.company_id, NEW.sale_date, 
    'قيد مبيعات سيارة جديدة - فاتورة رقم ' || NEW.sale_number,
    'sale', NEW.id,
    NEW.sale_price + v_tax_amount + COALESCE(v_car_purchase_price, 0),
    NEW.sale_price + v_tax_amount + COALESCE(v_car_purchase_price, 0),
    true
  ) RETURNING id INTO v_entry_id;
  
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_cash_account_id, 'استلام ثمن البيع', NEW.sale_price + v_tax_amount, 0);
  
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_sales_revenue_account_id, 'إيراد المبيعات', 0, NEW.sale_price);
  
  IF v_tax_amount > 0 AND v_tax_account_id IS NOT NULL THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_tax_account_id, 'ضريبة القيمة المضافة', 0, v_tax_amount);
  END IF;
  
  IF v_cogs_account_id IS NOT NULL AND v_inventory_account_id IS NOT NULL AND v_car_purchase_price IS NOT NULL AND v_car_purchase_price > 0 THEN
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_cogs_account_id, 'تكلفة البضاعة المباعة', v_car_purchase_price, 0);
    
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_inventory_account_id, 'المخزون', 0, v_car_purchase_price);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Add the trigger for UPDATE as well (for draft -> approved transition)
DROP TRIGGER IF EXISTS create_sale_journal_entry_on_approve ON public.sales;
CREATE TRIGGER create_sale_journal_entry_on_approve
  AFTER UPDATE ON public.sales
  FOR EACH ROW
  WHEN (OLD.status = 'draft' AND NEW.status = 'approved')
  EXECUTE FUNCTION public.create_sale_journal_entry();