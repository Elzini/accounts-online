
-- 1. Update protect_posted_journal_entries to allow bypass during reset
CREATE OR REPLACE FUNCTION public.protect_posted_journal_entries()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Allow bypass during company data reset
  IF current_setting('app.resetting_company_data', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF COALESCE(OLD.is_posted, false) THEN
      IF OLD.reference_type IN ('opening', 'closing') THEN
        RETURN OLD;
      END IF;
      RAISE EXCEPTION 'Cannot delete posted journal entry %. Use reversal entry instead.', COALESCE(OLD.entry_number::text, OLD.id::text);
    END IF;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Update prevent_closed_fiscal_year_changes to allow bypass during reset
CREATE OR REPLACE FUNCTION public.prevent_closed_fiscal_year_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_entry_date DATE;
  v_company_id UUID;
  v_fiscal_year RECORD;
BEGIN
  -- Allow bypass during company data reset
  IF current_setting('app.resetting_company_data', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    v_entry_date := OLD.entry_date;
    v_company_id := OLD.company_id;
  ELSE
    v_entry_date := NEW.entry_date;
    v_company_id := NEW.company_id;
  END IF;

  SELECT * INTO v_fiscal_year FROM public.fiscal_years
  WHERE company_id = v_company_id
    AND v_entry_date BETWEEN start_date AND end_date
    AND status = 'closed'
  LIMIT 1;

  IF v_fiscal_year.id IS NOT NULL THEN
    RAISE EXCEPTION 'لا يمكن تعديل أو حذف القيود في سنة مالية مغلقة (%)', v_fiscal_year.name;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Update reset_company_data to set bypass flag and use correct delete order
CREATE OR REPLACE FUNCTION public.reset_company_data(p_company_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid := auth.uid();
  v_is_super boolean := false;
  v_is_admin boolean := false;
  v_target_company uuid;
  v_deleted_total bigint := 0;
  v_rows bigint;
  rec record;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED';
  END IF;

  SELECT public.is_super_admin(v_actor) INTO v_is_super;
  SELECT public.is_admin(v_actor) INTO v_is_admin;

  IF NOT v_is_super AND NOT v_is_admin THEN
    RAISE EXCEPTION 'FORBIDDEN';
  END IF;

  IF p_company_id IS NOT NULL THEN
    IF v_is_super THEN
      v_target_company := p_company_id;
    ELSE
      SELECT company_id INTO v_target_company
      FROM public.profiles
      WHERE user_id = v_actor;

      IF v_target_company IS NULL OR v_target_company <> p_company_id THEN
        RAISE EXCEPTION 'FORBIDDEN';
      END IF;
    END IF;
  ELSE
    SELECT company_id INTO v_target_company
    FROM public.profiles
    WHERE user_id = v_actor;
  END IF;

  IF v_target_company IS NULL THEN
    RAISE EXCEPTION 'COMPANY_NOT_FOUND';
  END IF;

  -- Enable bypass for protection triggers
  PERFORM set_config('app.resetting_company_data', 'on', true);

  -- Unlink fiscal_years references to journal_entries
  UPDATE public.fiscal_years
  SET opening_balance_entry_id = NULL,
      closing_balance_entry_id = NULL
  WHERE company_id = v_target_company;

  -- Explicit deletion of journal-related children first
  DELETE FROM public.journal_entry_lines WHERE company_id = v_target_company;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_deleted_total := v_deleted_total + COALESCE(v_rows, 0);

  DELETE FROM public.journal_attachments WHERE company_id = v_target_company;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  v_deleted_total := v_deleted_total + COALESCE(v_rows, 0);

  -- Delete from all company tables in dependency order (children first)
  FOR rec IN
    WITH company_tables AS (
      SELECT c.table_name::text AS table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema
       AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'company_id'
        AND t.table_type = 'BASE TABLE'
        AND c.table_name NOT IN (
          'companies','profiles','company_accounting_settings','tax_settings',
          'account_categories','account_mappings','fiscal_years','app_settings',
          'audit_logs','audit_logs_archive','audit_hash_chain','security_events',
          'tenant_encryption_keys','tenant_encryption_config','tenant_rate_limits',
          'tenant_resource_quotas','tenant_db_roles','backup_schedules','backups',
          'company_encryption_keys','api_keys','integration_configs',
          'menu_configuration','dashboard_config','user_preferences','sms_provider_configs'
        )
    )
    SELECT table_name FROM company_tables ORDER BY table_name
  LOOP
    BEGIN
      EXECUTE format('DELETE FROM public.%I WHERE company_id = $1', rec.table_name)
        USING v_target_company;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      v_deleted_total := v_deleted_total + COALESCE(v_rows, 0);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  -- Second pass for any remaining FK-blocked rows
  FOR rec IN
    WITH company_tables AS (
      SELECT c.table_name::text AS table_name
      FROM information_schema.columns c
      JOIN information_schema.tables t
        ON t.table_schema = c.table_schema
       AND t.table_name = c.table_name
      WHERE c.table_schema = 'public'
        AND c.column_name = 'company_id'
        AND t.table_type = 'BASE TABLE'
        AND c.table_name NOT IN (
          'companies','profiles','company_accounting_settings','tax_settings',
          'account_categories','account_mappings','fiscal_years','app_settings',
          'audit_logs','audit_logs_archive','audit_hash_chain','security_events',
          'tenant_encryption_keys','tenant_encryption_config','tenant_rate_limits',
          'tenant_resource_quotas','tenant_db_roles','backup_schedules','backups',
          'company_encryption_keys','api_keys','integration_configs',
          'menu_configuration','dashboard_config','user_preferences','sms_provider_configs'
        )
    )
    SELECT table_name FROM company_tables ORDER BY table_name
  LOOP
    BEGIN
      EXECUTE format('DELETE FROM public.%I WHERE company_id = $1', rec.table_name)
        USING v_target_company;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      v_deleted_total := v_deleted_total + COALESCE(v_rows, 0);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;

  -- Disable bypass
  PERFORM set_config('app.resetting_company_data', 'off', true);

  RETURN jsonb_build_object(
    'success', true,
    'company_id', v_target_company,
    'deleted_rows', v_deleted_total
  );
END;
$$;
