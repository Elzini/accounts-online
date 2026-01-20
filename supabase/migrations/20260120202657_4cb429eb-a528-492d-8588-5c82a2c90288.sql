-- Add expense account settings columns
ALTER TABLE company_accounting_settings 
ADD COLUMN IF NOT EXISTS auto_expense_entries boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS expense_cash_account_id uuid REFERENCES account_categories(id),
ADD COLUMN IF NOT EXISTS expense_account_id uuid REFERENCES account_categories(id);

-- Create trigger function for expense journal entries
CREATE OR REPLACE FUNCTION public.create_expense_journal_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_settings RECORD;
  v_cash_account_id UUID;
  v_expense_account_id UUID;
  v_entry_id UUID;
  v_category_name TEXT;
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

  -- Get account IDs (prefer custom settings, fallback to defaults)
  IF v_settings IS NOT NULL AND v_settings.expense_cash_account_id IS NOT NULL THEN
    v_cash_account_id := v_settings.expense_cash_account_id;
  ELSE
    SELECT id INTO v_cash_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '1101' LIMIT 1;
  END IF;
  
  IF v_settings IS NOT NULL AND v_settings.expense_account_id IS NOT NULL THEN
    v_expense_account_id := v_settings.expense_account_id;
  ELSE
    -- Try to find matching expense account based on category
    SELECT id INTO v_expense_account_id FROM account_categories 
    WHERE company_id = NEW.company_id AND code = '5405' LIMIT 1;
  END IF;
  
  -- If essential accounts don't exist, skip
  IF v_cash_account_id IS NULL OR v_expense_account_id IS NULL THEN
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
  
  -- Credit: Cash/Bank
  INSERT INTO journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
  VALUES (v_entry_id, v_cash_account_id, 'دفع مصروفات', 0, NEW.amount);
  
  RETURN NEW;
END;
$$;

-- Create trigger on expenses table
DROP TRIGGER IF EXISTS create_expense_journal_entry_trigger ON expenses;
CREATE TRIGGER create_expense_journal_entry_trigger
  AFTER INSERT ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION create_expense_journal_entry();