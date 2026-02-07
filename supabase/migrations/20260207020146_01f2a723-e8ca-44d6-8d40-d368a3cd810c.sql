
-- Enhance initialize_company_defaults to also create initial audit log
CREATE OR REPLACE FUNCTION public.initialize_company_defaults()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  template_row RECORD;
  parent_map JSONB := '{}'::JSONB;
  new_account_id UUID;
  parent_account_id UUID;
  existing_count INTEGER;
BEGIN
  -- Check if accounts already exist for this company (prevent duplicate initialization)
  SELECT COUNT(*) INTO existing_count FROM public.account_categories WHERE company_id = NEW.id;
  IF existing_count > 0 THEN
    RETURN NEW;
  END IF;

  -- Copy accounts from COA templates based on company type
  FOR template_row IN 
    SELECT * FROM public.coa_templates 
    WHERE company_type = COALESCE(NEW.company_type, 'car_dealership')
    ORDER BY sort_order NULLS LAST, code
  LOOP
    -- Resolve parent_id
    parent_account_id := NULL;
    IF template_row.parent_code IS NOT NULL THEN
      parent_account_id := (parent_map ->> template_row.parent_code)::UUID;
    END IF;
    
    -- Insert account
    INSERT INTO public.account_categories (
      company_id, code, name, type, parent_id, is_system
    ) VALUES (
      NEW.id, 
      template_row.code, 
      template_row.name, 
      template_row.type, 
      parent_account_id, 
      COALESCE(template_row.is_header, false)
    )
    ON CONFLICT (company_id, code) DO NOTHING
    RETURNING id INTO new_account_id;
    
    -- If insert succeeded, add to parent map
    IF new_account_id IS NOT NULL THEN
      parent_map := parent_map || jsonb_build_object(template_row.code, new_account_id::text);
    ELSE
      -- Get existing account id for parent mapping
      SELECT id INTO new_account_id FROM public.account_categories 
      WHERE company_id = NEW.id AND code = template_row.code;
      IF new_account_id IS NOT NULL THEN
        parent_map := parent_map || jsonb_build_object(template_row.code, new_account_id::text);
      END IF;
    END IF;
  END LOOP;

  -- Create default accounting settings
  INSERT INTO public.company_accounting_settings (company_id)
  VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;

  -- Create default tax settings with VAT compliance
  INSERT INTO public.tax_settings (company_id, tax_name, tax_rate, is_active, apply_to_sales, apply_to_purchases)
  VALUES (NEW.id, 'ضريبة القيمة المضافة', 15.00, false, true, true)
  ON CONFLICT (company_id) DO NOTHING;

  -- Create initial audit log entry for company creation
  INSERT INTO public.audit_logs (
    company_id,
    user_id,
    action,
    entity_type,
    entity_id,
    new_data
  ) VALUES (
    NEW.id,
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    'create',
    'company',
    NEW.id,
    jsonb_build_object(
      'name', NEW.name,
      'company_type', NEW.company_type,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$function$;
