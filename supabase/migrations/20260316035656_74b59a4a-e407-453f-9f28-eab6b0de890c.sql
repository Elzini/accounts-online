
-- Fix the trigger function: change purchase approved status from 'active' to 'issued'
CREATE OR REPLACE FUNCTION public.create_invoice_journal_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_cash_account_id UUID;
  v_revenue_account_id UUID;
  v_cogs_account_id UUID;
  v_inventory_account_id UUID;
  v_tax_account_id UUID;
  v_entry_id UUID;
  v_tax_settings RECORD;
  v_tax_amount NUMERIC := 0;
  v_net_amount NUMERIC;
  v_existing_entry UUID;
  v_total_cost NUMERIC := 0;
  v_description TEXT;
  v_ref_type TEXT;
  v_approved_status TEXT;
BEGIN
  -- Both sales and purchases use 'issued' as approved status
  v_approved_status := 'issued';

  -- Only process when status matches the approved status
  IF TG_OP = 'INSERT' AND NEW.status != v_approved_status THEN
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status != v_approved_status OR OLD.status = v_approved_status THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Determine reference type
  v_ref_type := CASE 
    WHEN NEW.invoice_type = 'sales' THEN 'invoice_sale'
    WHEN NEW.invoice_type = 'purchase' THEN 'invoice_purchase'
    ELSE 'invoice'
  END;
  
  -- Check if journal entry already exists
  SELECT id INTO v_existing_entry FROM journal_entries 
  WHERE reference_type = v_ref_type AND reference_id = NEW.id LIMIT 1;
  
  IF v_existing_entry IS NOT NULL THEN
    NEW.journal_entry_id := v_existing_entry;
    RETURN NEW;
  END IF;

  -- Check company accounting settings
  SELECT * INTO v_settings FROM company_accounting_settings 
  WHERE company_id = NEW.company_id;
  
  IF v_settings IS NOT NULL AND NOT v_settings.auto_journal_entries_enabled THEN
    RETURN NEW;
  END IF;

  -- Get tax settings
  SELECT * INTO v_tax_settings FROM tax_settings 
  WHERE company_id = NEW.company_id AND is_active = true;

  IF NEW.invoice_type = 'sales' THEN
    -- === SALES INVOICE ===
    IF v_settings IS NOT NULL AND v_settings.sales_cash_account_id IS NOT NULL THEN
      v_cash_account_id := v_settings.sales_cash_account_id;
    ELSE
      SELECT id INTO v_cash_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '1101' LIMIT 1;
    END IF;
    
    IF v_settings IS NOT NULL AND v_settings.sales_revenue_account_id IS NOT NULL THEN
      v_revenue_account_id := v_settings.sales_revenue_account_id;
    ELSE
      SELECT id INTO v_revenue_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '4101' LIMIT 1;
    END IF;

    IF v_tax_settings IS NOT NULL AND v_tax_settings.apply_to_sales THEN
      v_tax_amount := COALESCE(NEW.vat_amount, 0);
      IF v_settings IS NOT NULL AND v_settings.vat_payable_account_id IS NOT NULL THEN
        v_tax_account_id := v_settings.vat_payable_account_id;
      ELSE
        SELECT id INTO v_tax_account_id FROM account_categories 
        WHERE company_id = NEW.company_id AND code = '2201' LIMIT 1;
      END IF;
    END IF;

    IF v_cash_account_id IS NULL OR v_revenue_account_id IS NULL THEN
      RETURN NEW;
    END IF;

    v_net_amount := COALESCE(NEW.total, 0);
    v_description := 'قيد فاتورة مبيعات رقم ' || COALESCE(NEW.invoice_number, NEW.id::text);

    SELECT COALESCE(SUM(ii.quantity * COALESCE(i.cost_price, 0)), 0) INTO v_total_cost
    FROM invoice_items ii
    LEFT JOIN items i ON i.id = ii.inventory_item_id
    WHERE ii.invoice_id = NEW.id AND ii.inventory_item_id IS NOT NULL;

    IF v_total_cost > 0 THEN
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
    END IF;

    INSERT INTO journal_entries (
      company_id, entry_date, description, reference_type, reference_id,
      total_debit, total_credit, is_posted
    ) VALUES (
      NEW.company_id, COALESCE(NEW.invoice_date::date, CURRENT_DATE),
      v_description, v_ref_type, NEW.id,
      v_net_amount + COALESCE(v_total_cost, 0),
      v_net_amount + COALESCE(v_total_cost, 0),
      true
    ) RETURNING id INTO v_entry_id;

    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_cash_account_id, 'تحصيل فاتورة مبيعات', v_net_amount, 0);

    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_revenue_account_id, 'إيراد المبيعات', 0, v_net_amount - v_tax_amount);

    IF v_tax_amount > 0 AND v_tax_account_id IS NOT NULL THEN
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      VALUES (v_entry_id, v_tax_account_id, 'ضريبة القيمة المضافة - مبيعات', 0, v_tax_amount);
    END IF;

    IF v_total_cost > 0 AND v_cogs_account_id IS NOT NULL AND v_inventory_account_id IS NOT NULL THEN
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      VALUES (v_entry_id, v_cogs_account_id, 'تكلفة البضاعة المباعة', v_total_cost, 0);
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      VALUES (v_entry_id, v_inventory_account_id, 'تخفيض المخزون', 0, v_total_cost);
    END IF;

    NEW.journal_entry_id := v_entry_id;

  ELSIF NEW.invoice_type = 'purchase' THEN
    -- === PURCHASE INVOICE ===
    IF v_settings IS NOT NULL AND v_settings.inventory_account_id IS NOT NULL THEN
      v_inventory_account_id := v_settings.inventory_account_id;
    ELSE
      SELECT id INTO v_inventory_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '1301' LIMIT 1;
    END IF;

    IF v_settings IS NOT NULL AND v_settings.sales_cash_account_id IS NOT NULL THEN
      v_cash_account_id := v_settings.sales_cash_account_id;
    ELSE
      SELECT id INTO v_cash_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '1101' LIMIT 1;
    END IF;

    IF v_tax_settings IS NOT NULL AND v_tax_settings.apply_to_purchases THEN
      v_tax_amount := COALESCE(NEW.vat_amount, 0);
      SELECT id INTO v_tax_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '2202' LIMIT 1;
    END IF;

    IF v_inventory_account_id IS NULL OR v_cash_account_id IS NULL THEN
      RETURN NEW;
    END IF;

    v_net_amount := COALESCE(NEW.total, 0);
    v_description := 'قيد فاتورة مشتريات رقم ' || COALESCE(NEW.invoice_number, NEW.id::text);

    INSERT INTO journal_entries (
      company_id, entry_date, description, reference_type, reference_id,
      total_debit, total_credit, is_posted
    ) VALUES (
      NEW.company_id, COALESCE(NEW.invoice_date::date, CURRENT_DATE),
      v_description, v_ref_type, NEW.id,
      v_net_amount, v_net_amount, true
    ) RETURNING id INTO v_entry_id;

    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_inventory_account_id, 'مشتريات بضاعة', v_net_amount - v_tax_amount, 0);

    IF v_tax_amount > 0 AND v_tax_account_id IS NOT NULL THEN
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      VALUES (v_entry_id, v_tax_account_id, 'ضريبة القيمة المضافة - مشتريات', v_tax_amount, 0);
    END IF;

    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_cash_account_id, 'سداد فاتورة مشتريات', 0, v_net_amount);

    NEW.journal_entry_id := v_entry_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on invoices table (for both INSERT and UPDATE)
DROP TRIGGER IF EXISTS trg_create_invoice_journal_entry ON public.invoices;
CREATE TRIGGER trg_create_invoice_journal_entry
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.create_invoice_journal_entry();
