
-- Fix the function to use correct status value 'open'
CREATE OR REPLACE FUNCTION public.initialize_company_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  template_row RECORD;
  parent_map JSONB := '{}'::JSONB;
  new_account_id UUID;
  parent_account_id UUID;
  existing_count INTEGER;
  v_fiscal_year_exists boolean;
  v_skip_coa boolean := false;
BEGIN
  SELECT COUNT(*) INTO existing_count FROM public.account_categories WHERE company_id = NEW.id;
  IF existing_count > 0 THEN
    v_skip_coa := true;
  END IF;

  IF NOT v_skip_coa THEN
    FOR template_row IN 
      SELECT * FROM public.coa_templates 
      WHERE company_type = COALESCE(NEW.company_type, 'car_dealership')
      ORDER BY sort_order NULLS LAST, code
    LOOP
      parent_account_id := NULL;
      IF template_row.parent_code IS NOT NULL THEN
        parent_account_id := (parent_map ->> template_row.parent_code)::UUID;
      END IF;
      
      INSERT INTO public.account_categories (
        company_id, code, name, type, parent_id, is_system
      ) VALUES (
        NEW.id, template_row.code, template_row.name, template_row.type, 
        parent_account_id, COALESCE(template_row.is_header, false)
      )
      ON CONFLICT (company_id, code) DO NOTHING
      RETURNING id INTO new_account_id;
      
      IF new_account_id IS NOT NULL THEN
        parent_map := parent_map || jsonb_build_object(template_row.code, new_account_id::text);
      ELSE
        SELECT id INTO new_account_id FROM public.account_categories 
        WHERE company_id = NEW.id AND code = template_row.code;
        IF new_account_id IS NOT NULL THEN
          parent_map := parent_map || jsonb_build_object(template_row.code, new_account_id::text);
        END IF;
      END IF;
    END LOOP;

    INSERT INTO public.company_accounting_settings (company_id)
    VALUES (NEW.id) ON CONFLICT (company_id) DO NOTHING;

    INSERT INTO public.tax_settings (company_id, tax_name, tax_rate, is_active, apply_to_sales, apply_to_purchases)
    VALUES (NEW.id, 'ضريبة القيمة المضافة', 15.00, false, true, true)
    ON CONFLICT (company_id) DO NOTHING;
  END IF;

  -- AUTO-CREATE FISCAL YEAR (critical for invoicing!)
  SELECT EXISTS(SELECT 1 FROM fiscal_years WHERE company_id = NEW.id) INTO v_fiscal_year_exists;
  IF NOT v_fiscal_year_exists THEN
    INSERT INTO fiscal_years (company_id, name, start_date, end_date, status, is_current)
    VALUES (
      NEW.id,
      EXTRACT(YEAR FROM CURRENT_DATE)::text,
      date_trunc('year', CURRENT_DATE)::date,
      (date_trunc('year', CURRENT_DATE) + interval '1 year' - interval '1 day')::date,
      'open', true
    );
  END IF;

  BEGIN
    INSERT INTO public.audit_logs (
      company_id, user_id, action, entity_type, entity_id, new_data
    ) VALUES (
      NEW.id, COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
      'create', 'company', NEW.id,
      jsonb_build_object('name', NEW.name, 'company_type', NEW.company_type)
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
END;
$$;

-- Fix existing companies missing fiscal years (status = 'open')
INSERT INTO fiscal_years (company_id, name, start_date, end_date, status, is_current)
SELECT c.id, EXTRACT(YEAR FROM CURRENT_DATE)::text, 
       date_trunc('year', CURRENT_DATE)::date,
       (date_trunc('year', CURRENT_DATE) + interval '1 year' - interval '1 day')::date,
       'open', true
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM fiscal_years WHERE company_id = c.id);

-- Fix companies with wrong app_name
WITH correct_names AS (
  SELECT c.id, c.name
  FROM companies c
  JOIN app_settings a ON a.company_id = c.id AND a.key = 'app_name'
  WHERE a.value != c.name
)
UPDATE app_settings 
SET value = correct_names.name
FROM correct_names
WHERE app_settings.company_id = correct_names.id 
  AND app_settings.key = 'app_name';
