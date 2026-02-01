
-- Add prepaid_asset_account_id column to store the selected prepaid asset account
ALTER TABLE public.prepaid_expenses 
ADD COLUMN prepaid_asset_account_id UUID REFERENCES public.account_categories(id);

-- Update the expense journal entry trigger to use the correct accounts
CREATE OR REPLACE FUNCTION public.create_expense_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_settings RECORD;
  v_credit_account_id UUID;
  v_expense_account_id UUID;
  v_entry_id UUID;
  v_category_name TEXT;
  v_credit_description TEXT;
  v_prepaid_expense_account_id UUID;
  v_prepaid_asset_account_id UUID;
BEGIN
  -- Check if auto journal entries are enabled for this company
  SELECT * INTO v_settings FROM company_accounting_settings 
  WHERE company_id = NEW.company_id;
  
  -- If settings exist and auto entries are disabled, skip
  IF v_settings IS NOT NULL AND (NOT v_settings.auto_journal_entries_enabled OR NOT v_settings.auto_expense_entries) THEN
    RETURN NEW;
  END IF;

  -- Get expense category name
  SELECT name INTO v_category_name FROM expense_categories WHERE id = NEW.category_id;

  -- Determine the credit account based on payment method
  IF NEW.payment_method = 'prepaid' THEN
    -- For prepaid expense amortization, get accounts from the prepaid expense record
    SELECT pe.expense_account_id, pe.prepaid_asset_account_id 
    INTO v_prepaid_expense_account_id, v_prepaid_asset_account_id
    FROM prepaid_expense_amortizations pea
    JOIN prepaid_expenses pe ON pe.id = pea.prepaid_expense_id
    WHERE pea.expense_id = NEW.id
    LIMIT 1;
    
    -- Use the prepaid asset account if specified, otherwise fallback to 1304
    IF v_prepaid_asset_account_id IS NOT NULL THEN
      v_credit_account_id := v_prepaid_asset_account_id;
    ELSE
      SELECT id INTO v_credit_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '1304' LIMIT 1;
    END IF;
    v_credit_description := 'إطفاء مصروف مقدم';
    
    -- Use the expense account from prepaid expense if available
    IF v_prepaid_expense_account_id IS NOT NULL THEN
      v_expense_account_id := v_prepaid_expense_account_id;
    END IF;
  ELSE
    -- For regular expenses, credit Cash/Bank
    IF v_settings IS NOT NULL AND v_settings.expense_cash_account_id IS NOT NULL THEN
      v_credit_account_id := v_settings.expense_cash_account_id;
    ELSE
      SELECT id INTO v_credit_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '1101' LIMIT 1;
    END IF;
    v_credit_description := 'دفع مصروفات';
  END IF;
  
  -- If no expense account determined yet, try to find one
  IF v_expense_account_id IS NULL THEN
    -- Try to find expense account by category name
    IF v_category_name IS NOT NULL THEN
      SELECT id INTO v_expense_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND name LIKE '%' || v_category_name || '%' AND code LIKE '5%'
      LIMIT 1;
    END IF;
    
    -- Fallback to default expense account or 5101
    IF v_expense_account_id IS NULL THEN
      IF v_settings IS NOT NULL AND v_settings.expense_account_id IS NOT NULL THEN
        v_expense_account_id := v_settings.expense_account_id;
      ELSE
        SELECT id INTO v_expense_account_id FROM account_categories 
        WHERE company_id = NEW.company_id AND code = '5101' LIMIT 1;
      END IF;
    END IF;
  END IF;

  -- Create journal entry only if we have both accounts
  IF v_expense_account_id IS NOT NULL AND v_credit_account_id IS NOT NULL THEN
    INSERT INTO public.journal_entries (
      company_id,
      entry_date,
      description,
      total_debit,
      total_credit,
      reference_type,
      reference_id,
      is_posted
    )
    VALUES (
      NEW.company_id,
      NEW.expense_date,
      'قيد مصروفات - ' || COALESCE(v_category_name, 'عام') || ' - ' || NEW.description,
      NEW.amount,
      NEW.amount,
      'expense',
      NEW.id,
      true
    )
    RETURNING id INTO v_entry_id;

    -- Create journal entry lines
    INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, debit, credit, description)
    VALUES 
      (v_entry_id, v_expense_account_id, NEW.amount, 0, NEW.description),
      (v_entry_id, v_credit_account_id, 0, NEW.amount, v_credit_description);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
