
-- Make sure the assign trigger fires BEFORE other triggers (alphabetical order matters for same timing)
-- The trigger name 'trg_assign_journal_entry_number' already comes before 'trg_create_invoice...' alphabetically

-- Also update the asset functions to NOT manually set entry_number since the trigger handles it now
-- Update create_asset_purchase_entry
CREATE OR REPLACE FUNCTION public.create_asset_purchase_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entry_id UUID;
    v_fiscal_year_id UUID;
    v_asset_account_id UUID;
    v_cash_account_id UUID;
    v_company_id UUID;
    v_category_name TEXT;
BEGIN
    IF NEW.status != 'active' THEN
        RETURN NEW;
    END IF;
    
    IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN
        RETURN NEW;
    END IF;

    v_company_id := NEW.company_id;

    SELECT id INTO v_fiscal_year_id FROM fiscal_years
    WHERE company_id = v_company_id AND is_active = true LIMIT 1;

    SELECT ac.name INTO v_category_name FROM asset_categories ac WHERE ac.id = NEW.category_id;

    SELECT id INTO v_asset_account_id FROM account_categories
    WHERE company_id = v_company_id AND code = '1201' LIMIT 1;
    
    SELECT id INTO v_cash_account_id FROM account_categories
    WHERE company_id = v_company_id AND code = '1101' LIMIT 1;

    IF v_asset_account_id IS NULL OR v_cash_account_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- entry_number will be auto-assigned by trg_assign_journal_entry_number
    INSERT INTO public.journal_entries (
        company_id,
        entry_date,
        description,
        total_debit,
        total_credit,
        is_posted,
        fiscal_year_id,
        reference_type,
        reference_id
    ) VALUES (
        v_company_id,
        NEW.purchase_date,
        'شراء أصل ثابت: ' || NEW.name,
        NEW.purchase_cost,
        NEW.purchase_cost,
        true,
        v_fiscal_year_id,
        'asset_purchase',
        NEW.id::text
    ) RETURNING id INTO v_entry_id;

    INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES
        (v_entry_id, v_asset_account_id, 'شراء أصل: ' || NEW.name || COALESCE(' - ' || v_category_name, ''), NEW.purchase_cost, 0),
        (v_entry_id, v_cash_account_id, 'سداد ثمن أصل: ' || NEW.name, 0, NEW.purchase_cost);

    NEW.journal_entry_id := v_entry_id;
    RETURN NEW;
END;
$$;
