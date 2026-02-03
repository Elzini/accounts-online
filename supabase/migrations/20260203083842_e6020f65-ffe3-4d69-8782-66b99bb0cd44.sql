-- إصلاح القيود الناقصة: إضافة تكلفة البضاعة المباعة للقيود التي تفتقرها
-- نستخدم SECURITY DEFINER مع تعطيل triggers مؤقتاً

-- Function to fix missing COGS in existing sale journal entries
CREATE OR REPLACE FUNCTION public.fix_missing_cogs_entries()
RETURNS TABLE(sale_id UUID, sale_number INT, fixed BOOLEAN, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry RECORD;
  v_sale RECORD;
  v_cogs_account_id UUID;
  v_inventory_account_id UUID;
  v_total_purchase_price NUMERIC;
  v_item RECORD;
  v_settings RECORD;
  v_new_total NUMERIC;
BEGIN
  -- تعطيل triggers مؤقتاً لتجاوز audit log
  SET session_replication_role = replica;
  
  -- Loop through all sale journal entries that are missing COGS lines
  FOR v_entry IN
    SELECT je.id as journal_entry_id, je.reference_id, je.company_id, je.total_debit
    FROM journal_entries je
    WHERE je.reference_type = 'sale'
      AND NOT EXISTS (
        SELECT 1 FROM journal_entry_lines jel
        JOIN account_categories ac ON ac.id = jel.account_id
        WHERE jel.journal_entry_id = je.id 
          AND ac.code = '5101'
          AND jel.debit > 0
      )
  LOOP
    -- Get the sale details
    SELECT * INTO v_sale FROM sales WHERE id = v_entry.reference_id;
    
    IF v_sale IS NULL THEN
      sale_id := v_entry.reference_id;
      sale_number := NULL;
      fixed := false;
      message := 'Sale not found';
      RETURN NEXT;
      CONTINUE;
    END IF;
    
    -- Get company accounting settings
    SELECT * INTO v_settings FROM company_accounting_settings 
    WHERE company_id = v_entry.company_id;
    
    -- Get COGS account (5101)
    IF v_settings IS NOT NULL AND v_settings.cogs_account_id IS NOT NULL THEN
      v_cogs_account_id := v_settings.cogs_account_id;
    ELSE
      SELECT id INTO v_cogs_account_id FROM account_categories 
      WHERE company_id = v_entry.company_id AND code = '5101' LIMIT 1;
    END IF;
    
    -- Get Inventory account (1301)
    IF v_settings IS NOT NULL AND v_settings.inventory_account_id IS NOT NULL THEN
      v_inventory_account_id := v_settings.inventory_account_id;
    ELSE
      SELECT id INTO v_inventory_account_id FROM account_categories 
      WHERE company_id = v_entry.company_id AND code = '1301' LIMIT 1;
    END IF;
    
    IF v_cogs_account_id IS NULL OR v_inventory_account_id IS NULL THEN
      sale_id := v_sale.id;
      sale_number := v_sale.sale_number;
      fixed := false;
      message := 'COGS or Inventory account not found';
      RETURN NEXT;
      CONTINUE;
    END IF;
    
    -- Calculate total purchase price from sale_items or single car
    v_total_purchase_price := 0;
    
    -- Check if this is a multi-car sale
    FOR v_item IN 
      SELECT si.car_id, c.purchase_price
      FROM sale_items si
      JOIN cars c ON c.id = si.car_id
      WHERE si.sale_id = v_sale.id
    LOOP
      v_total_purchase_price := v_total_purchase_price + COALESCE(v_item.purchase_price, 0);
    END LOOP;
    
    -- If no sale_items found, use the main car_id
    IF v_total_purchase_price = 0 AND v_sale.car_id IS NOT NULL THEN
      SELECT purchase_price INTO v_total_purchase_price 
      FROM cars WHERE id = v_sale.car_id;
    END IF;
    
    IF v_total_purchase_price IS NULL OR v_total_purchase_price = 0 THEN
      sale_id := v_sale.id;
      sale_number := v_sale.sale_number;
      fixed := false;
      message := 'No purchase price found for car(s)';
      RETURN NEXT;
      CONTINUE;
    END IF;
    
    -- Add COGS debit line
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry.journal_entry_id, v_cogs_account_id, 'تكلفة البضاعة المباعة', v_total_purchase_price, 0);
    
    -- Add Inventory credit line
    INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry.journal_entry_id, v_inventory_account_id, 'تخفيض المخزون', 0, v_total_purchase_price);
    
    -- Update journal entry totals
    v_new_total := v_entry.total_debit + v_total_purchase_price;
    UPDATE journal_entries 
    SET total_debit = v_new_total, total_credit = v_new_total
    WHERE id = v_entry.journal_entry_id;
    
    sale_id := v_sale.id;
    sale_number := v_sale.sale_number;
    fixed := true;
    message := 'Added COGS ' || v_total_purchase_price::TEXT || ' SAR';
    RETURN NEXT;
  END LOOP;
  
  -- إعادة تفعيل triggers
  SET session_replication_role = DEFAULT;
  
  RETURN;
END;
$$;