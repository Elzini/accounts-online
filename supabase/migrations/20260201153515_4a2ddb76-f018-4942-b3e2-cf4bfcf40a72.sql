-- Add expense_account_id column to prepaid_expenses table
ALTER TABLE prepaid_expenses 
ADD COLUMN IF NOT EXISTS expense_account_id uuid REFERENCES account_categories(id);

-- Update the trigger to use the expense account from prepaid expense if available
CREATE OR REPLACE FUNCTION public.create_expense_journal_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_credit_account_id UUID;
  v_expense_account_id UUID;
  v_entry_id UUID;
  v_category_name TEXT;
  v_credit_description TEXT;
  v_prepaid_expense_account_id UUID;
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
    -- For prepaid expense amortization, credit Prepaid Expenses account (1304)
    SELECT id INTO v_credit_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1304' LIMIT 1;
    v_credit_description := 'إطفاء مصروف مقدم';
    
    -- Try to get the expense account from the prepaid expense record
    SELECT pe.expense_account_id INTO v_prepaid_expense_account_id
    FROM prepaid_expense_amortizations pea
    JOIN prepaid_expenses pe ON pe.id = pea.prepaid_expense_id
    WHERE pea.expense_id = NEW.id
    LIMIT 1;
    
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
  
  -- Get expense account if not already set from prepaid expense
  IF v_expense_account_id IS NULL THEN
    -- First try from the expense record itself
    IF NEW.account_id IS NOT NULL THEN
      v_expense_account_id := NEW.account_id;
    ELSIF v_settings IS NOT NULL AND v_settings.expense_account_id IS NOT NULL THEN
      v_expense_account_id := v_settings.expense_account_id;
    ELSE
      -- Use default miscellaneous expense account
      SELECT id INTO v_expense_account_id FROM account_categories 
      WHERE company_id = NEW.company_id AND code = '5405' LIMIT 1;
    END IF;
  END IF;
  
  -- If essential accounts don't exist, skip
  IF v_credit_account_id IS NULL OR v_expense_account_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Create journal entry header
  INSERT INTO journal_entries (
    company_id, entry_date, description, reference_type, reference_id, 
    total_debit, total_credit, is_posted
  ) VALUES (
    NEW.company_id, NEW.expense_date, 
    'قيد مصروفات - ' || COALESCE(v_category_name, 'عام') || ' - ' || NEW.description,
    'expense', NEW.id,
    NEW.amount,
    NEW.amount,
    true
  ) RETURNING id INTO v_entry_id;
  
  -- Debit: Expense Account
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_expense_account_id, NEW.description, NEW.amount, 0);
  
  -- Credit: Prepaid Expenses (1304) or Cash/Bank (1101) based on payment method
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_credit_account_id, v_credit_description, 0, NEW.amount);
  
  RETURN NEW;
END;
$$;