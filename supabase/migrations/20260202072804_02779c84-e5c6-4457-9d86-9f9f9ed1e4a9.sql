
-- =====================================================
-- FIX: AUTO JOURNAL ENTRIES FOR FIXED ASSETS
-- =====================================================

-- Create function to generate journal entry for asset purchase
CREATE OR REPLACE FUNCTION public.create_asset_purchase_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entry_id UUID;
    v_entry_number INTEGER;
    v_fiscal_year_id UUID;
    v_asset_account_id UUID;
    v_cash_account_id UUID;
    v_company_id UUID;
BEGIN
    v_company_id := NEW.company_id;

    -- Get current fiscal year
    SELECT id INTO v_fiscal_year_id
    FROM public.fiscal_years
    WHERE company_id = v_company_id
    AND is_current = true
    LIMIT 1;

    -- Get asset account (Fixed Assets default code 1301 or from asset's account_category_id)
    IF NEW.account_category_id IS NOT NULL THEN
        v_asset_account_id := NEW.account_category_id;
    ELSE
        -- Try to find default fixed assets account (code 13xx or 1301)
        SELECT id INTO v_asset_account_id
        FROM public.account_categories
        WHERE company_id = v_company_id
        AND (code LIKE '13%' OR code = '1301' OR name LIKE '%أصول ثابتة%' OR name LIKE '%fixed%')
        AND type = 'asset'
        LIMIT 1;
    END IF;

    -- Get cash/bank account from company settings or default (1101)
    SELECT purchase_cash_account_id INTO v_cash_account_id
    FROM public.company_accounting_settings
    WHERE company_id = v_company_id;

    IF v_cash_account_id IS NULL THEN
        SELECT id INTO v_cash_account_id
        FROM public.account_categories
        WHERE company_id = v_company_id
        AND (code = '1101' OR code LIKE '11%')
        AND type = 'asset'
        LIMIT 1;
    END IF;

    -- Skip if we don't have both accounts
    IF v_asset_account_id IS NULL OR v_cash_account_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get next entry number
    SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_entry_number
    FROM public.journal_entries
    WHERE company_id = v_company_id;

    -- Create journal entry header
    INSERT INTO public.journal_entries (
        company_id,
        entry_number,
        entry_date,
        description,
        reference_type,
        reference_id,
        total_debit,
        total_credit,
        is_posted,
        fiscal_year_id,
        created_at
    ) VALUES (
        v_company_id,
        v_entry_number,
        NEW.purchase_date,
        'شراء أصل ثابت: ' || NEW.name,
        'fixed_asset',
        NEW.id,
        NEW.purchase_price,
        NEW.purchase_price,
        true,
        v_fiscal_year_id,
        now()
    )
    RETURNING id INTO v_entry_id;

    -- Create journal entry lines
    -- Debit: Fixed Assets Account
    INSERT INTO public.journal_entry_lines (
        journal_entry_id,
        account_id,
        description,
        debit,
        credit
    ) VALUES (
        v_entry_id,
        v_asset_account_id,
        'شراء أصل: ' || NEW.name,
        NEW.purchase_price,
        0
    );

    -- Credit: Cash/Bank Account
    INSERT INTO public.journal_entry_lines (
        journal_entry_id,
        account_id,
        description,
        debit,
        credit
    ) VALUES (
        v_entry_id,
        v_cash_account_id,
        'دفع ثمن أصل: ' || NEW.name,
        0,
        NEW.purchase_price
    );

    RETURN NEW;
END;
$$;

-- Create function for depreciation journal entry
CREATE OR REPLACE FUNCTION public.create_depreciation_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entry_id UUID;
    v_entry_number INTEGER;
    v_fiscal_year_id UUID;
    v_depreciation_expense_account_id UUID;
    v_accumulated_depreciation_account_id UUID;
    v_asset_name TEXT;
    v_company_id UUID;
BEGIN
    v_company_id := NEW.company_id;

    -- Get asset details
    SELECT 
        name, 
        depreciation_account_id, 
        accumulated_depreciation_account_id
    INTO 
        v_asset_name, 
        v_depreciation_expense_account_id, 
        v_accumulated_depreciation_account_id
    FROM public.fixed_assets
    WHERE id = NEW.asset_id;

    -- Get current fiscal year
    SELECT id INTO v_fiscal_year_id
    FROM public.fiscal_years
    WHERE company_id = v_company_id
    AND is_current = true
    LIMIT 1;

    -- If depreciation expense account not set, find default (code 54xx or 5401)
    IF v_depreciation_expense_account_id IS NULL THEN
        SELECT id INTO v_depreciation_expense_account_id
        FROM public.account_categories
        WHERE company_id = v_company_id
        AND (code LIKE '54%' OR code = '5401' OR name LIKE '%إهلاك%' OR name LIKE '%depreciation%')
        AND type = 'expense'
        LIMIT 1;
    END IF;

    -- If accumulated depreciation account not set, find default (code 13xx with 'مجمع' or 'accumulated')
    IF v_accumulated_depreciation_account_id IS NULL THEN
        SELECT id INTO v_accumulated_depreciation_account_id
        FROM public.account_categories
        WHERE company_id = v_company_id
        AND (name LIKE '%مجمع%' OR name LIKE '%accumulated%' OR code LIKE '139%')
        LIMIT 1;
    END IF;

    -- If still no accumulated depreciation account, create one
    IF v_accumulated_depreciation_account_id IS NULL THEN
        INSERT INTO public.account_categories (
            company_id,
            code,
            name,
            type,
            description,
            is_system
        ) VALUES (
            v_company_id,
            '1390',
            'مجمع إهلاك الأصول الثابتة',
            'asset',
            'حساب مجمع إهلاك الأصول الثابتة',
            true
        )
        RETURNING id INTO v_accumulated_depreciation_account_id;
    END IF;

    -- If still no depreciation expense account, create one
    IF v_depreciation_expense_account_id IS NULL THEN
        INSERT INTO public.account_categories (
            company_id,
            code,
            name,
            type,
            description,
            is_system
        ) VALUES (
            v_company_id,
            '5401',
            'مصروف إهلاك الأصول الثابتة',
            'expense',
            'مصروف إهلاك الأصول الثابتة',
            true
        )
        RETURNING id INTO v_depreciation_expense_account_id;
    END IF;

    -- Get next entry number
    SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_entry_number
    FROM public.journal_entries
    WHERE company_id = v_company_id;

    -- Create journal entry header
    INSERT INTO public.journal_entries (
        company_id,
        entry_number,
        entry_date,
        description,
        reference_type,
        reference_id,
        total_debit,
        total_credit,
        is_posted,
        fiscal_year_id,
        created_at
    ) VALUES (
        v_company_id,
        v_entry_number,
        NEW.entry_date,
        'إهلاك أصل: ' || COALESCE(v_asset_name, 'أصل ثابت') || ' للفترة من ' || NEW.period_start || ' إلى ' || NEW.period_end,
        'depreciation',
        NEW.id,
        NEW.depreciation_amount,
        NEW.depreciation_amount,
        true,
        v_fiscal_year_id,
        now()
    )
    RETURNING id INTO v_entry_id;

    -- Update depreciation entry with journal_entry_id
    UPDATE public.depreciation_entries
    SET journal_entry_id = v_entry_id
    WHERE id = NEW.id;

    -- Create journal entry lines
    -- Debit: Depreciation Expense
    INSERT INTO public.journal_entry_lines (
        journal_entry_id,
        account_id,
        description,
        debit,
        credit
    ) VALUES (
        v_entry_id,
        v_depreciation_expense_account_id,
        'مصروف إهلاك: ' || COALESCE(v_asset_name, 'أصل ثابت'),
        NEW.depreciation_amount,
        0
    );

    -- Credit: Accumulated Depreciation
    INSERT INTO public.journal_entry_lines (
        journal_entry_id,
        account_id,
        description,
        debit,
        credit
    ) VALUES (
        v_entry_id,
        v_accumulated_depreciation_account_id,
        'مجمع إهلاك: ' || COALESCE(v_asset_name, 'أصل ثابت'),
        0,
        NEW.depreciation_amount
    );

    RETURN NEW;
END;
$$;

-- Create function for asset disposal journal entry
CREATE OR REPLACE FUNCTION public.create_asset_disposal_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_entry_id UUID;
    v_entry_number INTEGER;
    v_fiscal_year_id UUID;
    v_asset_account_id UUID;
    v_accumulated_depreciation_account_id UUID;
    v_cash_account_id UUID;
    v_gain_loss_account_id UUID;
    v_book_value NUMERIC;
    v_gain_loss NUMERIC;
    v_company_id UUID;
BEGIN
    -- Only trigger when status changes to 'disposed'
    IF NEW.status != 'disposed' OR OLD.status = 'disposed' THEN
        RETURN NEW;
    END IF;

    v_company_id := NEW.company_id;
    v_book_value := NEW.purchase_price - NEW.accumulated_depreciation;
    v_gain_loss := COALESCE(NEW.disposal_value, 0) - v_book_value;

    -- Get current fiscal year
    SELECT id INTO v_fiscal_year_id
    FROM public.fiscal_years
    WHERE company_id = v_company_id
    AND is_current = true
    LIMIT 1;

    -- Get asset account
    v_asset_account_id := NEW.account_category_id;
    IF v_asset_account_id IS NULL THEN
        SELECT id INTO v_asset_account_id
        FROM public.account_categories
        WHERE company_id = v_company_id
        AND (code LIKE '13%' OR code = '1301')
        AND type = 'asset'
        LIMIT 1;
    END IF;

    -- Get accumulated depreciation account
    v_accumulated_depreciation_account_id := NEW.accumulated_depreciation_account_id;
    IF v_accumulated_depreciation_account_id IS NULL THEN
        SELECT id INTO v_accumulated_depreciation_account_id
        FROM public.account_categories
        WHERE company_id = v_company_id
        AND (name LIKE '%مجمع%' OR code LIKE '139%')
        LIMIT 1;
    END IF;

    -- Get cash account
    SELECT purchase_cash_account_id INTO v_cash_account_id
    FROM public.company_accounting_settings
    WHERE company_id = v_company_id;

    IF v_cash_account_id IS NULL THEN
        SELECT id INTO v_cash_account_id
        FROM public.account_categories
        WHERE company_id = v_company_id
        AND code = '1101'
        LIMIT 1;
    END IF;

    -- Get or create gain/loss account
    IF v_gain_loss > 0 THEN
        -- Gain on disposal (Revenue)
        SELECT id INTO v_gain_loss_account_id
        FROM public.account_categories
        WHERE company_id = v_company_id
        AND (name LIKE '%أرباح بيع%' OR name LIKE '%gain%disposal%')
        LIMIT 1;

        IF v_gain_loss_account_id IS NULL THEN
            INSERT INTO public.account_categories (company_id, code, name, type, is_system)
            VALUES (v_company_id, '4901', 'أرباح بيع أصول ثابتة', 'revenue', true)
            RETURNING id INTO v_gain_loss_account_id;
        END IF;
    ELSE
        -- Loss on disposal (Expense)
        SELECT id INTO v_gain_loss_account_id
        FROM public.account_categories
        WHERE company_id = v_company_id
        AND (name LIKE '%خسائر بيع%' OR name LIKE '%loss%disposal%')
        LIMIT 1;

        IF v_gain_loss_account_id IS NULL THEN
            INSERT INTO public.account_categories (company_id, code, name, type, is_system)
            VALUES (v_company_id, '5901', 'خسائر بيع أصول ثابتة', 'expense', true)
            RETURNING id INTO v_gain_loss_account_id;
        END IF;
    END IF;

    -- Skip if missing essential accounts
    IF v_asset_account_id IS NULL OR v_cash_account_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get next entry number
    SELECT COALESCE(MAX(entry_number), 0) + 1 INTO v_entry_number
    FROM public.journal_entries
    WHERE company_id = v_company_id;

    -- Create journal entry header
    INSERT INTO public.journal_entries (
        company_id,
        entry_number,
        entry_date,
        description,
        reference_type,
        reference_id,
        total_debit,
        total_credit,
        is_posted,
        fiscal_year_id,
        created_at
    ) VALUES (
        v_company_id,
        v_entry_number,
        COALESCE(NEW.disposal_date, CURRENT_DATE),
        'التخلص من أصل: ' || NEW.name,
        'asset_disposal',
        NEW.id,
        COALESCE(NEW.disposal_value, 0) + NEW.accumulated_depreciation + CASE WHEN v_gain_loss < 0 THEN ABS(v_gain_loss) ELSE 0 END,
        NEW.purchase_price + CASE WHEN v_gain_loss > 0 THEN v_gain_loss ELSE 0 END,
        true,
        v_fiscal_year_id,
        now()
    )
    RETURNING id INTO v_entry_id;

    -- Debit: Cash received
    IF COALESCE(NEW.disposal_value, 0) > 0 THEN
        INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
        VALUES (v_entry_id, v_cash_account_id, 'نقد من بيع أصل: ' || NEW.name, NEW.disposal_value, 0);
    END IF;

    -- Debit: Accumulated Depreciation (reverse)
    IF NEW.accumulated_depreciation > 0 AND v_accumulated_depreciation_account_id IS NOT NULL THEN
        INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
        VALUES (v_entry_id, v_accumulated_depreciation_account_id, 'إلغاء مجمع إهلاك: ' || NEW.name, NEW.accumulated_depreciation, 0);
    END IF;

    -- Debit/Credit: Loss or Gain
    IF v_gain_loss < 0 THEN
        -- Loss (Debit)
        INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
        VALUES (v_entry_id, v_gain_loss_account_id, 'خسارة بيع أصل: ' || NEW.name, ABS(v_gain_loss), 0);
    ELSIF v_gain_loss > 0 THEN
        -- Gain (Credit)
        INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
        VALUES (v_entry_id, v_gain_loss_account_id, 'ربح بيع أصل: ' || NEW.name, 0, v_gain_loss);
    END IF;

    -- Credit: Asset Account (original cost)
    INSERT INTO public.journal_entry_lines (journal_entry_id, account_id, description, debit, credit)
    VALUES (v_entry_id, v_asset_account_id, 'إلغاء أصل: ' || NEW.name, 0, NEW.purchase_price);

    RETURN NEW;
END;
$$;

-- Apply triggers
DROP TRIGGER IF EXISTS create_asset_journal_entry ON public.fixed_assets;
CREATE TRIGGER create_asset_journal_entry
    AFTER INSERT ON public.fixed_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.create_asset_purchase_journal_entry();

DROP TRIGGER IF EXISTS create_depreciation_entry_journal ON public.depreciation_entries;
CREATE TRIGGER create_depreciation_entry_journal
    AFTER INSERT ON public.depreciation_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.create_depreciation_journal_entry();

DROP TRIGGER IF EXISTS create_disposal_journal_entry ON public.fixed_assets;
CREATE TRIGGER create_disposal_journal_entry
    AFTER UPDATE ON public.fixed_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.create_asset_disposal_journal_entry();

-- =====================================================
-- ADD DEFAULT FIXED ASSETS ACCOUNTS TO COA TEMPLATE
-- =====================================================

-- Add fixed assets accounts if not exist
INSERT INTO public.coa_templates (company_type, code, name, name_en, type, parent_code, is_header, sort_order)
VALUES 
    ('car_dealership', '1300', 'الأصول الثابتة', 'Fixed Assets', 'asset', '1000', true, 130),
    ('car_dealership', '1301', 'المعدات والأجهزة', 'Equipment', 'asset', '1300', false, 131),
    ('car_dealership', '1302', 'الأثاث والتجهيزات', 'Furniture & Fixtures', 'asset', '1300', false, 132),
    ('car_dealership', '1303', 'السيارات الإدارية', 'Vehicles', 'asset', '1300', false, 133),
    ('car_dealership', '1304', 'أجهزة الحاسب', 'Computers', 'asset', '1300', false, 134),
    ('car_dealership', '1390', 'مجمع إهلاك الأصول الثابتة', 'Accumulated Depreciation', 'asset', '1300', false, 139),
    ('car_dealership', '5401', 'مصروف الإهلاك', 'Depreciation Expense', 'expense', '5400', false, 541),
    ('car_dealership', '4901', 'أرباح بيع الأصول', 'Gain on Asset Disposal', 'revenue', '4900', false, 491),
    ('car_dealership', '5901', 'خسائر بيع الأصول', 'Loss on Asset Disposal', 'expense', '5900', false, 591)
ON CONFLICT DO NOTHING;
