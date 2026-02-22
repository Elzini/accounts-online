
-- Create trigger function for invoice journal entries (non-car companies)
CREATE OR REPLACE FUNCTION public.create_invoice_journal_entry()
RETURNS TRIGGER
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
  v_item RECORD;
  v_description TEXT;
  v_ref_type TEXT;
BEGIN
  -- Only process when status changes to 'issued'
  IF TG_OP = 'INSERT' AND NEW.status != 'issued' THEN
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status != 'issued' OR OLD.status = 'issued' THEN
      RETURN NEW;
    END IF;
  END IF;

  -- Check if journal entry already exists
  v_ref_type := CASE 
    WHEN NEW.invoice_type = 'sales' THEN 'invoice_sale'
    WHEN NEW.invoice_type = 'purchase' THEN 'invoice_purchase'
    ELSE 'invoice'
  END;
  
  SELECT id INTO v_existing_entry FROM journal_entries 
  WHERE reference_type = v_ref_type AND reference_id = NEW.id
  LIMIT 1;
  
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
    -- Cash/Receivable account
    IF v_settings IS NOT NULL AND v_settings.sales_cash_account_id IS NOT NULL THEN
      v_cash_account_id := v_settings.sales_cash_account_id;
    ELSE
      SELECT id INTO v_cash_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '1101' LIMIT 1;
    END IF;
    
    -- Revenue account
    IF v_settings IS NOT NULL AND v_settings.sales_revenue_account_id IS NOT NULL THEN
      v_revenue_account_id := v_settings.sales_revenue_account_id;
    ELSE
      SELECT id INTO v_revenue_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '4101' LIMIT 1;
    END IF;

    -- VAT payable account
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

    -- Calculate COGS from invoice items
    SELECT COALESCE(SUM(ii.quantity * COALESCE(i.cost_price, 0)), 0) INTO v_total_cost
    FROM invoice_items ii
    LEFT JOIN items i ON i.id = ii.inventory_item_id
    WHERE ii.invoice_id = NEW.id AND ii.inventory_item_id IS NOT NULL;

    -- COGS & Inventory accounts
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

    -- Create journal entry
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

    -- Debit: Cash (total including VAT)
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_cash_account_id, 'تحصيل فاتورة مبيعات', v_net_amount, 0);

    -- Credit: Revenue (net of VAT)
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_revenue_account_id, 'إيراد المبيعات', 0, v_net_amount - v_tax_amount);

    -- Credit: VAT Payable
    IF v_tax_amount > 0 AND v_tax_account_id IS NOT NULL THEN
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      VALUES (v_entry_id, v_tax_account_id, 'ضريبة القيمة المضافة - مبيعات', 0, v_tax_amount);
    END IF;

    -- COGS entries
    IF v_total_cost > 0 AND v_cogs_account_id IS NOT NULL AND v_inventory_account_id IS NOT NULL THEN
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      VALUES (v_entry_id, v_cogs_account_id, 'تكلفة البضاعة المباعة', v_total_cost, 0);
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      VALUES (v_entry_id, v_inventory_account_id, 'تخفيض المخزون', 0, v_total_cost);
    END IF;

    -- Link journal entry to invoice
    NEW.journal_entry_id := v_entry_id;

  ELSIF NEW.invoice_type = 'purchase' THEN
    -- === PURCHASE INVOICE ===
    -- Inventory/Expense account (debit)
    IF v_settings IS NOT NULL AND v_settings.inventory_account_id IS NOT NULL THEN
      v_inventory_account_id := v_settings.inventory_account_id;
    ELSE
      SELECT id INTO v_inventory_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '1301' LIMIT 1;
    END IF;

    -- Cash/Payable account (credit)
    IF v_settings IS NOT NULL AND v_settings.sales_cash_account_id IS NOT NULL THEN
      v_cash_account_id := v_settings.sales_cash_account_id;
    ELSE
      SELECT id INTO v_cash_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '1101' LIMIT 1;
    END IF;

    -- VAT receivable
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

    -- Debit: Inventory/Purchases
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_inventory_account_id, 'مشتريات بضاعة', v_net_amount - v_tax_amount, 0);

    -- Debit: VAT Receivable
    IF v_tax_amount > 0 AND v_tax_account_id IS NOT NULL THEN
      INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
      VALUES (v_entry_id, v_tax_account_id, 'ضريبة القيمة المضافة - مشتريات', v_tax_amount, 0);
    END IF;

    -- Credit: Cash/Bank
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_cash_account_id, 'سداد فاتورة مشتريات', 0, v_net_amount);

    NEW.journal_entry_id := v_entry_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to invoices table
DROP TRIGGER IF EXISTS create_invoice_journal_entry_trigger ON public.invoices;
CREATE TRIGGER create_invoice_journal_entry_trigger
  BEFORE INSERT OR UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.create_invoice_journal_entry();

-- Also fix existing invoices that are 'issued' but missing journal entries
DO $$
DECLARE
  v_inv RECORD;
BEGIN
  FOR v_inv IN 
    SELECT id FROM invoices 
    WHERE status = 'issued' AND journal_entry_id IS NULL
  LOOP
    -- Re-trigger by updating status
    UPDATE invoices SET status = 'issued' WHERE id = v_inv.id;
  END LOOP;
END;
$$;
